"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { getCourseOptions, getLeadCopy, PRIVACY_NOTE_VERSION, type CourseOption } from "@/content";
import { confirmationVariant } from "@/lib/courses/view";
import { connectDb } from "@/lib/db/mongoose";
import { getWhatsAppUrlWithMessage } from "@/lib/site";
import { WORKSHOP_CITY } from "./config";
import { logLead } from "./log";
import { CourseLead, Lead, WorkshopLead, type LeadDoc } from "./model";
import { getResendEnv, notifyOwner } from "./notify";
import { checkAndCount, clientKey, getRateLimitSecret } from "./rate-limit";
import { generateRef } from "./reference";
import {
  COURSE_FIELDS,
  courseSchema,
  pickValues,
  toFieldErrors,
  WORKSHOP_FIELDS,
  workshopSchema,
  type CourseInput,
  type FieldName,
  type WorkshopInput,
} from "./schema";
import type { LeadActionState } from "./state";

// Lead form Server Actions. Each is a public POST endpoint: everything from the form is untrusted,
// the return value is shaped for the UI only, and nothing personal is logged.
// Processing order: specs/006-lead-capture/contracts/server-actions.md.

type Kind = "workshop" | "course";

type Common = { fullName: string; phone: string; email: string; message: string; submissionKey: string };

type Pipeline<T extends Common> = {
  kind: Kind;
  fields: readonly FieldName[];
  parse: (values: Record<string, string | undefined>) => Promise<{ success: true; data: T } | { success: false; error: Parameters<typeof toFieldErrors>[0] }>;
  /** type-specific fields to store */
  create: (data: T, base: Record<string, unknown>) => Promise<LeadDoc>;
  /** the WhatsApp link (and, for courses, the confirmation variant) for a reference; courseId is the chosen course, if any */
  respond: (ref: string, courseId?: string) => Promise<Success>;
};

type Success = { whatsappUrl: string | null; variant?: "open" | "waitlist" };

const isDuplicateKey = (err: unknown, field: string) =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: number }).code === 11000 &&
  Object.prototype.hasOwnProperty.call((err as { keyPattern?: object }).keyPattern ?? {}, field);

type StoredRef = { ref: string; courseId?: string } | null;

async function whatsappFor(kind: Kind, ref: string): Promise<string | null> {
  const copy = await getLeadCopy();
  return getWhatsAppUrlWithMessage(copy[kind].whatsappPrefill.replace("{ref}", ref));
}

/**
 * A course sign-up's confirmation: the open-course wording when the chosen course is open now, otherwise the waitlist
 * wording. Worked out against the current options, so a replayed submit follows the course's present status.
 */
async function courseResponse(options: CourseOption[], ref: string, courseId?: string): Promise<Success> {
  const option = options.find((o) => o.id === courseId);
  const variant = confirmationVariant(option);
  if (!option || variant === "waitlist") return { variant: "waitlist", whatsappUrl: await whatsappFor("course", ref) };
  const copy = await getLeadCopy();
  const text = copy.course.open.whatsappPrefill.replace("{course}", option.name).replace("{ref}", ref);
  return { variant, whatsappUrl: getWhatsAppUrlWithMessage(text) };
}

/** Saves with a fresh reference, retrying if the reference happens to exist already. */
async function saveWithRef(create: (ref: string) => Promise<LeadDoc>): Promise<LeadDoc> {
  for (let i = 0; ; i++) {
    try {
      return await create(generateRef());
    } catch (err) {
      if (i < 2 && isDuplicateKey(err, "ref")) continue;
      throw err;
    }
  }
}

/** Sends the owner email after the response and records the outcome on the lead. */
function notifyAfterResponse(lead: LeadDoc) {
  after(async () => {
    const result = await notifyOwner(lead);
    try {
      await Lead.updateOne(
        { _id: lead._id },
        {
          $set: result.ok
            ? { "notification.state": "sent", "notification.providerId": result.providerId, "notification.lastErrorCode": null }
            : { "notification.state": "failed", "notification.lastErrorCode": result.code },
          $inc: { "notification.attempts": 1 },
          $currentDate: { "notification.lastAttemptAt": true },
        },
      );
    } catch (err) {
      logLead("notify", { type: lead.type, ref: lead.ref, outcome: "record_failed", code: err instanceof Error ? err.name : "UnknownError" });
    }
    logLead("notify", { type: lead.type, ref: lead.ref, outcome: result.ok ? "sent" : "failed", code: result.ok ? undefined : result.code });
  });
}

async function handleSubmission<T extends Common>(p: Pipeline<T>, prev: LeadActionState, formData: FormData): Promise<LeadActionState> {
  const attempt = prev.attempt + 1;
  const values = pickValues(formData, p.fields);

  try {
    // Honeypot: a filled trap field means a bot. Nothing is saved or emailed, and the answer looks like success.
    const trap = formData.get("website");
    if (typeof trap === "string" && trap.trim() !== "") {
      try {
        await connectDb();
        await checkAndCount(clientKey(await headers())); // bots count against the limit too
      } catch {
        // counting is best effort; the answer below does not depend on it
      }
      logLead("submit", { type: p.kind, outcome: "honeypot" });
      const fakeRef = generateRef(); // not stored
      return { status: "success", attempt, ref: fakeRef, ...(await p.respond(fakeRef, values.courseId)) };
    }

    const parsed = await p.parse(values);
    if (!parsed.success) return { status: "invalid", attempt, values, errors: toFieldErrors(parsed.error) };
    const data = parsed.data;

    // Never accept a lead the site cannot notify the owner about: a missing setting gives the generic error, nothing stored.
    getResendEnv();
    getRateLimitSecret();
    await connectDb();

    // A repeated submit of the same form (double tap, retry after a dropped connection) returns the first result.
    const existing = await Lead.findOne({ submissionKey: data.submissionKey }, { ref: 1, courseId: 1 }).lean<StoredRef>();
    if (existing) {
      logLead("submit", { type: p.kind, ref: existing.ref, outcome: "duplicate" });
      return { status: "success", attempt, ref: existing.ref, ...(await p.respond(existing.ref, existing.courseId)) };
    }

    // Rate limit: 5 submissions per address per hour, both forms together. Only valid submissions are counted, so
    // fixing a typo never uses one up, and a replayed submission (above) is not counted twice.
    if (!(await checkAndCount(clientKey(await headers())))) {
      logLead("submit", { type: p.kind, outcome: "rate_limited" });
      return { status: "rate_limited", attempt, values };
    }

    let lead: LeadDoc;
    try {
      lead = await saveWithRef((ref) =>
        p.create(data, {
          ref,
          submissionKey: data.submissionKey,
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          message: data.message,
          consent: { given: true, at: new Date(), noteVersion: PRIVACY_NOTE_VERSION },
        }),
      );
    } catch (err) {
      if (!isDuplicateKey(err, "submissionKey")) throw err;
      const again = await Lead.findOne({ submissionKey: data.submissionKey }, { ref: 1, courseId: 1 }).lean<StoredRef>();
      if (!again) throw err;
      return { status: "success", attempt, ref: again.ref, ...(await p.respond(again.ref, again.courseId)) };
    }

    logLead("submit", { type: p.kind, ref: lead.ref, outcome: "saved" });
    notifyAfterResponse(lead);
    return { status: "success", attempt, ref: lead.ref, ...(await p.respond(lead.ref, (data as { courseId?: string }).courseId)) };
  } catch (err) {
    logLead("submit", { type: p.kind, outcome: "error", code: err instanceof Error ? err.name : "UnknownError" });
    return { status: "error", attempt, values };
  }
}

export async function submitWorkshop(prev: LeadActionState, formData: FormData): Promise<LeadActionState> {
  return handleSubmission<WorkshopInput>(
    {
      kind: "workshop",
      fields: WORKSHOP_FIELDS,
      parse: async (values) => workshopSchema(new Date()).safeParse(values),
      create: (data, base) =>
        WorkshopLead.create({
          ...base,
          role: data.role,
          organization: data.organization,
          // fixed by the server (amendment A3); anything the browser sends as "city" is ignored
          city: WORKSHOP_CITY,
          participants: data.participants,
          preferredMonth: data.preferredMonth,
        }) as Promise<LeadDoc>,
      respond: async (ref) => ({ whatsappUrl: await whatsappFor("workshop", ref) }),
    },
    prev,
    formData,
  );
}

export async function submitCourse(prev: LeadActionState, formData: FormData): Promise<LeadActionState> {
  // The allowed courses are read at submit time, so a course removed after the page loaded is refused.
  const options = await getCourseOptions();
  return handleSubmission<CourseInput>(
    {
      kind: "course",
      fields: COURSE_FIELDS,
      parse: async (values) => courseSchema(options.map((o) => o.id)).safeParse(values),
      create: (data, base) =>
        CourseLead.create({
          ...base,
          courseId: data.courseId,
          // a snapshot of the course title, so renaming or deleting the course never rewrites what the visitor picked
          courseName: options.find((o) => o.id === data.courseId)!.name,
          level: data.level,
          ageGroup: data.ageGroup,
        }) as Promise<LeadDoc>,
      respond: (ref, courseId) => courseResponse(options, ref, courseId),
    },
    prev,
    formData,
  );
}
