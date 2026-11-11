import "server-only";
import { connectDb } from "@/lib/db/mongoose";
import { Lead } from "@/lib/leads/model";
import {
  categoryFor,
  categoryOptions,
  courseIdsByCategory,
  courseLinkFor,
  courseOptions,
  type CategoryRef,
  type CourseLink,
  type CourseRef,
  type FilterOption,
} from "./course-leads";
import { listAllCategories, listAllCourses } from "./courses-read";
import { courseFilter, workshopFilter } from "./leads-filter";
import {
  clampPage,
  isObjectId,
  LEAD_STATUS_VALUES,
  PAGE_SIZE,
  type CourseParams,
  type LeadStatusValue,
  type LeadType,
  type WorkshopParams,
} from "./leads-params";

// Reads for the two Submissions views (specs/026-split-submissions/contracts/data-access.md). Every query carries the
// view's type, so a workshop view can never read, count or open a course record and vice versa (FR-005). Stored
// leads are read as plain objects and shaped here, so pages and client components only receive serialisable data.

type Base = { id: string; fullName: string; ref: string; status: LeadStatusValue; createdAt: string };

export type WorkshopRow = Base & { role: string; organization: string; participants: number; preferredMonth: string | null };
export type CourseRow = Base & { courseId: string; courseName: string; category: string | null; level: string; ageGroup: string };

type DetailBase = Base & {
  phone: string;
  email: string;
  message: string;
  adminNotes: string;
  statusChangedAt: string | null;
  consent: { given: boolean; at: string; noteVersion: string };
  notification: { state: string; attempts: number; lastAttemptAt: string | null };
};

export type LeadDetail =
  | (DetailBase & {
      type: "workshop";
      workshop: { role: string; organization: string; city: string; participants: number; preferredMonth: string | null };
    })
  | (DetailBase & {
      type: "course";
      course: { courseId: string; courseName: string; category: string | null; level: string; ageGroup: string; link: CourseLink };
    });

/** Courses and categories as they are now, for the course view's category column, filters and course links. */
export type CourseLeadLookup = {
  courseById: Map<string, CourseRef>;
  courseOptions: FilterOption[];
  categoryOptions: FilterOption[];
  courseIdsByCategory: Map<string, string[]>;
};

type Raw = {
  _id: { toString(): string };
  type: LeadType;
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
  courseId?: string;
  courseName?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  level?: string;
  ageGroup?: string;
};

const iso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);
const EMPTY_LOOKUP: Map<string, CourseRef> = new Map();

function toBase(d: Raw): Base {
  return { id: d._id.toString(), fullName: d.fullName, ref: d.ref, status: d.status, createdAt: new Date(d.createdAt).toISOString() };
}

/** the snapshot fields exactly as stored: absent stays absent (older record), null stays null */
function snapshotOf(d: Raw): { courseId: string; categoryId?: string | null; categoryName?: string | null } {
  return {
    courseId: d.courseId ?? "",
    ...("categoryId" in d ? { categoryId: d.categoryId ?? null } : {}),
    ...("categoryName" in d ? { categoryName: d.categoryName ?? null } : {}),
  };
}

function toWorkshopRow(d: Raw): WorkshopRow {
  return {
    ...toBase(d),
    role: d.role ?? "",
    organization: d.organization ?? "",
    participants: d.participants ?? 0,
    preferredMonth: d.preferredMonth ?? null,
  };
}

function toCourseRow(d: Raw, courseById: Map<string, CourseRef>): CourseRow {
  return {
    ...toBase(d),
    courseId: d.courseId ?? "",
    courseName: d.courseName ?? "",
    category: categoryFor(snapshotOf(d), courseById),
    level: d.level ?? "",
    ageGroup: d.ageGroup ?? "",
  };
}

function toDetail(d: Raw, courseById: Map<string, CourseRef>): LeadDetail {
  const base: DetailBase = {
    ...toBase(d),
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
  };
  if (d.type === "workshop") {
    return {
      ...base,
      type: "workshop",
      workshop: {
        role: d.role ?? "",
        organization: d.organization ?? "",
        city: d.city ?? "",
        participants: d.participants ?? 0,
        preferredMonth: d.preferredMonth ?? null,
      },
    };
  }
  const courseId = d.courseId ?? "";
  return {
    ...base,
    type: "course",
    course: {
      courseId,
      courseName: d.courseName ?? "",
      category: categoryFor(snapshotOf(d), courseById),
      level: d.level ?? "",
      ageGroup: d.ageGroup ?? "",
      link: courseLinkFor(courseId, courseById),
    },
  };
}

export type StatusCounts = Record<LeadStatusValue, number>;

/** Counts per status for one type (not narrowed by filters), from one aggregate query. */
export async function getLeadStats(type: LeadType): Promise<StatusCounts> {
  await connectDb();
  const rows = await Lead.aggregate<{ _id: string; n: number }>([
    { $match: { type } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries(LEAD_STATUS_VALUES.map((s) => [s, 0])) as StatusCounts;
  for (const row of rows) if (row._id in counts) counts[row._id as LeadStatusValue] = row.n;
  return counts;
}

export type NewCounts = Record<LeadType, number>;

/** How many records of each type are still "new", for the sidebar badges. */
export async function getNewCounts(): Promise<NewCounts> {
  await connectDb();
  const rows = await Lead.aggregate<{ _id: string; n: number }>([
    { $match: { status: "new" } },
    { $group: { _id: "$type", n: { $sum: 1 } } },
  ]);
  const counts: NewCounts = { workshop: 0, course: 0 };
  for (const row of rows) if (row._id === "workshop" || row._id === "course") counts[row._id] = row.n;
  return counts;
}

export type LeadPage<R> = { rows: R[]; total: number; page: number; pages: number };

async function readPage(filter: Record<string, unknown>, requested: number): Promise<{ docs: Raw[]; total: number; page: number; pages: number }> {
  await connectDb();
  const total = await Lead.countDocuments(filter);
  const page = clampPage(requested, total);
  const docs = await Lead.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean<Raw[]>();
  return { docs, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** One page of workshop requests, newest first. `page` is clamped to the last page. */
export async function listWorkshopLeads(p: WorkshopParams): Promise<LeadPage<WorkshopRow>> {
  const { docs, ...rest } = await readPage(workshopFilter(p), p.page);
  return { rows: docs.map(toWorkshopRow), ...rest };
}

/** One page of course registrations, newest first, with each row's category resolved. */
export async function listCourseLeads(p: CourseParams, lookup: CourseLeadLookup): Promise<LeadPage<CourseRow>> {
  const live = p.category ? (lookup.courseIdsByCategory.get(p.category) ?? []) : null;
  const { docs, ...rest } = await readPage(courseFilter(p, live), p.page);
  return { rows: docs.map((d) => toCourseRow(d, lookup.courseById)), ...rest };
}

/** One lead of the given type with every stored field, or null for an unknown or malformed id or another type. */
export async function getLead(type: LeadType, id: string, lookup?: CourseLeadLookup): Promise<LeadDetail | null> {
  if (!isObjectId(id)) return null;
  await connectDb();
  const doc = await Lead.findOne({ _id: id, type }).lean<Raw>();
  return doc ? toDetail(doc, lookup?.courseById ?? EMPTY_LOOKUP) : null;
}

/** Preferred months stored on workshop requests, newest first, for the month filter. */
export async function getWorkshopMonths(): Promise<string[]> {
  await connectDb();
  const months = (await Lead.distinct("preferredMonth", { type: "workshop", preferredMonth: { $ne: null } })) as unknown[];
  return months.filter((m): m is string => typeof m === "string" && /^\d{4}-\d{2}$/.test(m)).sort().reverse();
}

/** Current courses and categories plus categories only found in snapshots (research R7). */
export async function getCourseLeadLookup(): Promise<CourseLeadLookup> {
  await connectDb();
  const [courses, categories, snapshots] = await Promise.all([
    listAllCourses(),
    listAllCategories(),
    Lead.aggregate<{ _id: string; name: string | null }>([
      { $match: { type: "course", categoryId: { $type: "string" } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$categoryId", name: { $first: "$categoryName" } } },
    ]),
  ]);
  const refs: CourseRef[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    categoryId: c.categoryId,
    categoryName: c.category?.name ?? null,
  }));
  const current: CategoryRef[] = categories.map((c) => ({ id: c.id, name: c.name }));
  const seen: CategoryRef[] = snapshots.map((s) => ({ id: String(s._id), name: s.name ?? "Unnamed category" }));
  return {
    courseById: new Map(refs.map((r) => [r.id, r])),
    courseOptions: courseOptions(refs),
    categoryOptions: categoryOptions(current, seen),
    courseIdsByCategory: courseIdsByCategory(refs),
  };
}
