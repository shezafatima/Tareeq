// One rule set per lead form, used by the client form (instant feedback) and the server action
// (source of truth). See specs/006-lead-capture/contracts/server-actions.md for every field and message.
// Pure: relative imports only, no server code.
import * as z from "zod/mini";
import { AGE_VALUES, allowedMonths, LEVEL_VALUES, ROLE_VALUES } from "./options.ts";
import { normalisePhone, PHONE_ERROR } from "./phone.ts";

export const FIELD_LIMITS = {
  fullName: { min: 2, max: 100 },
  organization: { min: 2, max: 150 },
  message: { max: 1000 },
  email: { max: 254 },
  participants: { min: 1, max: 1000 },
} as const;

export const MESSAGES = {
  fullName: "Please enter your full name.",
  phone: PHONE_ERROR,
  email: "Please enter a valid email address, for example name@example.com.",
  message: "Please keep your message under 1000 characters.",
  consent: "Please tick the box so we can contact you about your request.",
  role: "Please choose who the workshop is for.",
  organization: "Please enter your school or organization name.",
  participants: "Please enter a whole number between 1 and 1000.",
  preferredMonth: "Please choose a month from the list.",
  courseId: "Please choose a course, or pick ‘Not sure yet’.",
  level: "Please choose your current level.",
  ageGroup: "Please choose your age group.",
  submissionKey: "Please reload the page and try again.",
} as const;

export const COMMON_FIELDS = ["fullName", "phone", "email", "message", "consent", "submissionKey"] as const;
export const WORKSHOP_FIELDS = [
  "role",
  "fullName",
  "phone",
  "email",
  "organization",
  "participants",
  "preferredMonth",
  "message",
  "consent",
  "submissionKey",
] as const;
export const COURSE_FIELDS = ["fullName", "phone", "email", "courseId", "level", "ageGroup", "message", "consent", "submissionKey"] as const;

/** Form A is filled in two steps (amendment A9). Step 1 is checked before "Next". */
export const WORKSHOP_STEP1_FIELDS = ["role", "fullName", "phone", "email"] as const;
export const WORKSHOP_STEP2_FIELDS = ["organization", "participants", "preferredMonth", "message", "consent"] as const;

export type FieldName = (typeof WORKSHOP_FIELDS)[number] | (typeof COURSE_FIELDS)[number];
export type FormValues = Partial<Record<FieldName, string>>;
export type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const text = (min: number, max: number, message: string) =>
  z.string().check(z.trim(), z.minLength(min, message), z.maxLength(max, message));

const commonShape = {
  fullName: text(FIELD_LIMITS.fullName.min, FIELD_LIMITS.fullName.max, MESSAGES.fullName),
  phone: z.pipe(
    z.string().check(
      z.refine((v) => normalisePhone(v).ok, MESSAGES.phone),
    ),
    z.transform((v) => (normalisePhone(v) as { ok: true; e164: string }).e164),
  ),
  email: z.string().check(
    z.trim(),
    z.toLowerCase(),
    z.maxLength(FIELD_LIMITS.email.max, MESSAGES.email),
    z.regex(EMAIL, MESSAGES.email),
  ),
  message: z.string().check(z.trim(), z.maxLength(FIELD_LIMITS.message.max, MESSAGES.message)),
  consent: z.literal("yes", MESSAGES.consent),
  submissionKey: z.string().check(z.regex(UUID, MESSAGES.submissionKey)),
};

// Email is optional on Form A (amendment A7): phone is the required way to reach the visitor. If it is given, it must be valid.
const optionalEmail = z.string().check(
  z.trim(),
  z.toLowerCase(),
  z.maxLength(FIELD_LIMITS.email.max, MESSAGES.email),
  z.refine((v) => v === "" || EMAIL.test(v), MESSAGES.email),
);

export function workshopSchema(now: Date) {
  const months = allowedMonths(now);
  return z.object({
    ...commonShape,
    email: optionalEmail,
    role: z.enum(ROLE_VALUES, MESSAGES.role),
    organization: text(FIELD_LIMITS.organization.min, FIELD_LIMITS.organization.max, MESSAGES.organization),
    participants: z.pipe(
      z.string().check(
        z.trim(),
        z.refine((v) => {
          if (!/^\d+$/.test(v)) return false;
          const n = Number(v);
          return n >= FIELD_LIMITS.participants.min && n <= FIELD_LIMITS.participants.max;
        }, MESSAGES.participants),
      ),
      z.transform((v) => Number(v)),
    ),
    preferredMonth: z.pipe(
      z.string().check(z.refine((v) => v === "" || months.has(v), MESSAGES.preferredMonth)),
      z.transform((v) => (v === "" ? null : v)),
    ),
  });
}

export function courseSchema(courseIds: readonly string[]) {
  return z.object({
    ...commonShape,
    courseId: z.string().check(z.refine((v) => courseIds.includes(v), MESSAGES.courseId)),
    level: z.enum(LEVEL_VALUES, MESSAGES.level),
    ageGroup: z.enum(AGE_VALUES, MESSAGES.ageGroup),
  });
}

export type WorkshopInput = z.output<ReturnType<typeof workshopSchema>>;
export type CourseInput = z.output<ReturnType<typeof courseSchema>>;

/** Reads only the listed fields (trimmed strings; "" when absent). The honeypot and anything else are dropped. */
export function pickValues(formData: FormData, fields: readonly FieldName[]): FormValues {
  const values: FormValues = {};
  for (const name of fields) {
    const v = formData.get(name);
    values[name] = typeof v === "string" ? v.trim() : "";
  }
  return values;
}

/** First message per field from a failed parse. */
export function toFieldErrors(error: z.core.$ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const name = issue.path[0] as FieldName | undefined;
    if (name && !out[name]) out[name] = issue.message;
  }
  return out;
}
