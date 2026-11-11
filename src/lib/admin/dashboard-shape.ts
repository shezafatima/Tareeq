// Turns raw dashboard query results into the serialisable shapes the page renders (specs/029-admin-dashboard
// data-model.md, contracts/data-access.md). Pure: relative imports only, no server code, so unit tests can load it.
// Every output object is built field by field, so extra stored fields (phone, email, notes) can never leak through.

import { chartDays, karachiTime, relativeDays } from "./dashboard-time.ts";
import { leadsHref, type LeadStatusValue, type LeadType } from "./leads-params.ts";

/** The raw output of the aggregation's single document. Every array may be empty. */
export type FacetResult = {
  newByType: { _id: LeadType; n: number }[];
  week: { _id: "this" | "last"; n: number }[];
  booked: { n: number }[];
  daily: { _id: { day: string; type: LeadType }; n: number }[];
  topCourses: { _id: string; name: string; n: number }[];
};

export type DaySeries = { day: string; label: string; workshop: number; course: number };
export type TopCourse = { courseId: string; name: string; count: number };

export type DashboardSummary = {
  newCounts: Record<LeadType, number>;
  week: { thisWeek: number; lastWeek: number; delta: number; deltaText: string };
  bookedThisMonth: number;
  /** always exactly 14 entries, oldest first, zero-filled */
  daily: DaySeries[];
  topCourses: TopCourse[];
};

export type AttentionRow = { id: string; type: LeadType; name: string; age: string; href: string };
export type RecentRow = {
  id: string;
  type: LeadType;
  name: string;
  /** course: the course name stored with the registration; workshop: the organization */
  context: string;
  status: LeadStatusValue;
  when: string;
  href: string;
};
export type ContentCounts = { programs: number; courses: number; categories: number };

export type DashboardData = {
  summary: DashboardSummary;
  attention: { rows: AttentionRow[]; total: number };
  recent: RecentRow[];
  content: ContentCounts;
};

/** A stored lead with only the fields the dashboard may read. */
export type RawLead = {
  _id: { toString(): string };
  type: LeadType;
  fullName: string;
  createdAt: Date;
  status?: LeadStatusValue;
  organization?: string;
  courseName?: string;
};

/** "+2 vs last week", "−1 vs last week" (a real minus sign) or "No change vs last week". Never a percentage. */
export function weekDeltaText(thisWeek: number, lastWeek: number): string {
  const delta = thisWeek - lastWeek;
  if (delta === 0) return "No change vs last week";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)} vs last week`;
}

/** The smallest 1, 2 or 5 times a power of ten that is at least `n` (at least 1): a tidy top for the chart's axis. */
export function niceMax(n: number): number {
  if (n <= 1) return 1;
  let power = 1;
  while (power * 10 <= n) power *= 10;
  for (const step of [1, 2, 5, 10]) if (step * power >= n) return step * power;
  return 10 * power;
}

export function toSummary(facet: FacetResult, now: Date): DashboardSummary {
  const newCounts: Record<LeadType, number> = { workshop: 0, course: 0 };
  for (const row of facet.newByType) if (row._id === "workshop" || row._id === "course") newCounts[row._id] = row.n;

  const thisWeek = facet.week.find((r) => r._id === "this")?.n ?? 0;
  const lastWeek = facet.week.find((r) => r._id === "last")?.n ?? 0;

  const counts = new Map<string, { workshop: number; course: number }>();
  for (const row of facet.daily) {
    const entry = counts.get(row._id.day) ?? { workshop: 0, course: 0 };
    if (row._id.type === "workshop" || row._id.type === "course") entry[row._id.type] += row.n;
    counts.set(row._id.day, entry);
  }

  return {
    newCounts,
    week: { thisWeek, lastWeek, delta: thisWeek - lastWeek, deltaText: weekDeltaText(thisWeek, lastWeek) },
    bookedThisMonth: facet.booked[0]?.n ?? 0,
    daily: chartDays(now).map(({ day, label }) => ({
      day,
      label,
      workshop: counts.get(day)?.workshop ?? 0,
      course: counts.get(day)?.course ?? 0,
    })),
    topCourses: facet.topCourses.map((r) => ({ courseId: r._id, name: r.name, count: r.n })),
  };
}

export function toAttentionRow(raw: RawLead, now: Date): AttentionRow {
  const id = raw._id.toString();
  return {
    id,
    type: raw.type,
    name: raw.fullName,
    age: relativeDays(raw.createdAt, now),
    href: leadsHref(raw.type, { lead: id }),
  };
}

export function toRecentRow(raw: RawLead, now: Date): RecentRow {
  const id = raw._id.toString();
  const age = relativeDays(raw.createdAt, now);
  const context = raw.type === "course" ? raw.courseName : raw.organization;
  return {
    id,
    type: raw.type,
    name: raw.fullName,
    context: context || "—",
    status: raw.status ?? "new",
    when: age === "today" ? `today, ${karachiTime(raw.createdAt)}` : age,
    href: leadsHref(raw.type, { lead: id }),
  };
}
