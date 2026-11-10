import "server-only";
import { connectDb } from "@/lib/db/mongoose";
import { Lead } from "@/lib/leads/model";
import {
  clampPage,
  escapeRegex,
  isObjectId,
  LEAD_STATUS_VALUES,
  PAGE_SIZE,
  type LeadParams,
  type LeadStatusValue,
} from "./leads-params";

// Reads for the Submissions page (specs/022-admin-panel/research.md R5). Stored leads are read as plain objects and
// shaped here, so pages and client components only ever receive serialisable summaries.

export type LeadSummary = {
  id: string;
  type: "workshop" | "course";
  fullName: string;
  ref: string;
  status: LeadStatusValue;
  /** organization for workshops, course name for courses */
  subject: string;
  createdAt: string;
};

export type LeadDetail = LeadSummary & {
  phone: string;
  email: string;
  message: string;
  adminNotes: string;
  statusChangedAt: string | null;
  consent: { given: boolean; at: string; noteVersion: string };
  notification: { state: string; attempts: number; lastAttemptAt: string | null };
  workshop?: { role: string; organization: string; city: string; participants: number; preferredMonth: string | null };
  course?: { courseName: string; level: string; ageGroup: string };
};

type Raw = {
  _id: { toString(): string };
  type: "workshop" | "course";
  ref: string;
  status: LeadStatusValue;
  statusChangedAt?: Date | null;
  adminNotes?: string;
  fullName: string;
  phone: string;
  email?: string;
  message?: string;
  consent?: { given: boolean; at: Date; noteVersion: string };
  notification?: { state: string; attempts: number; lastAttemptAt?: Date | null };
  createdAt: Date;
  role?: string;
  organization?: string;
  city?: string;
  participants?: number;
  preferredMonth?: string | null;
  courseName?: string;
  level?: string;
  ageGroup?: string;
};

const iso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);

function toSummary(d: Raw): LeadSummary {
  return {
    id: d._id.toString(),
    type: d.type,
    fullName: d.fullName,
    ref: d.ref,
    status: d.status,
    subject: (d.type === "workshop" ? d.organization : d.courseName) ?? "",
    createdAt: new Date(d.createdAt).toISOString(),
  };
}

function toDetail(d: Raw): LeadDetail {
  return {
    ...toSummary(d),
    phone: d.phone,
    email: d.email ?? "",
    message: d.message ?? "",
    adminNotes: d.adminNotes ?? "",
    statusChangedAt: iso(d.statusChangedAt),
    consent: { given: d.consent?.given ?? false, at: iso(d.consent?.at) ?? "", noteVersion: d.consent?.noteVersion ?? "" },
    notification: {
      state: d.notification?.state ?? "",
      attempts: d.notification?.attempts ?? 0,
      lastAttemptAt: iso(d.notification?.lastAttemptAt),
    },
    ...(d.type === "workshop"
      ? {
          workshop: {
            role: d.role ?? "",
            organization: d.organization ?? "",
            city: d.city ?? "",
            participants: d.participants ?? 0,
            preferredMonth: d.preferredMonth ?? null,
          },
        }
      : { course: { courseName: d.courseName ?? "", level: d.level ?? "", ageGroup: d.ageGroup ?? "" } }),
  };
}

function buildFilter(p: LeadParams): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (p.type) filter.type = p.type;
  if (p.status) filter.status = p.status;
  if (p.q) {
    const text = new RegExp(escapeRegex(p.q), "i");
    const or: Record<string, unknown>[] = [{ fullName: text }, { email: text }, { organization: text }, { phone: text }];
    // phones are stored in +92 form but typed as 0300...: also match on the digits without a leading zero
    const digits = p.q.replace(/\D/g, "").replace(/^0+/, "");
    if (digits.length >= 4) or.push({ phone: new RegExp(escapeRegex(digits)) });
    filter.$or = or;
  }
  return filter;
}

export type StatusCounts = Record<LeadStatusValue, number>;

/** Counts per status for the whole pipeline (not narrowed by filters), from one aggregate query. */
export async function getLeadStats(): Promise<StatusCounts> {
  await connectDb();
  const rows = await Lead.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]);
  const counts = Object.fromEntries(LEAD_STATUS_VALUES.map((s) => [s, 0])) as StatusCounts;
  for (const row of rows) if (row._id in counts) counts[row._id as LeadStatusValue] = row.n;
  return counts;
}

export type LeadPage = { leads: LeadSummary[]; total: number; page: number; pages: number };

/** One page of leads, newest first. `page` is clamped to the last page. */
export async function listLeads(p: LeadParams): Promise<LeadPage> {
  await connectDb();
  const filter = buildFilter(p);
  const total = await Lead.countDocuments(filter);
  const page = clampPage(p.page, total);
  const docs = await Lead.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean<Raw[]>();
  return { leads: docs.map(toSummary), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** One lead with every stored field, or null for an unknown or malformed id. */
export async function getLead(id: string): Promise<LeadDetail | null> {
  if (!isObjectId(id)) return null;
  await connectDb();
  const doc = await Lead.findById(id).lean<Raw>();
  return doc ? toDetail(doc) : null;
}
