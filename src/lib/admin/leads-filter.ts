// Database filters for the two Submissions views (specs/026-split-submissions research R3, R10). Pure, so tests can
// prove every filter is scoped by type (SC-001). Search text is always escaped and matched literally.

import { escapeRegex, type CourseParams, type WorkshopParams } from "./leads-params.ts";

type Filter = Record<string, unknown>;

/** name/email/(organization)/phone matches; phones are stored as +92… but typed as 0300…, so digits match too */
function searchOr(q: string, fields: readonly string[]): Filter[] | null {
  if (!q) return null;
  const text = new RegExp(escapeRegex(q), "i");
  const or: Filter[] = fields.map((f) => ({ [f]: text }));
  const digits = q.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length >= 4) or.push({ phone: new RegExp(escapeRegex(digits)) });
  return or;
}

export function workshopFilter(p: WorkshopParams): Filter {
  const filter: Filter = {};
  if (p.status) filter.status = p.status;
  if (p.role) filter.role = p.role;
  if (p.month) filter.preferredMonth = p.month;
  const or = searchOr(p.q, ["fullName", "email", "organization", "phone"]);
  if (or) filter.$or = or;
  filter.type = "workshop"; // set last, so nothing above can override it
  return filter;
}

/**
 * `liveCourseIds`: ids of the current courses in the chosen category, for older records that carry no category
 * snapshot. Records with a snapshot match on it; records saved with no category (null) never match.
 */
export function courseFilter(p: CourseParams, liveCourseIds: string[] | null): Filter {
  const filter: Filter = {};
  if (p.status) filter.status = p.status;
  if (p.course) filter.courseId = p.course;
  if (p.level) filter.level = p.level;
  if (p.age) filter.ageGroup = p.age;
  const or = searchOr(p.q, ["fullName", "email", "phone"]);
  if (or) filter.$or = or;
  if (p.category) {
    filter.$and = [
      { $or: [{ categoryId: p.category }, { categoryId: { $exists: false }, courseId: { $in: liveCourseIds ?? [] } }] },
    ];
  }
  filter.type = "course";
  return filter;
}
