// Course registration helpers for admin (specs/026-split-submissions research R7, data-model.md). Pure.
// Category: the snapshot first; older records without one fall back to the course's current category.

export type CourseRef = { id: string; title: string; categoryId: string; categoryName: string | null };
export type CategoryRef = { id: string; name: string };
export type FilterOption = { value: string; label: string };

export type CourseLink = { kind: "edit"; href: string } | { kind: "removed" } | { kind: "none" };

const NOT_SURE = "not-sure";

/** The category to show, or null for a dash. */
export function categoryFor(
  lead: { courseId: string; categoryId?: string | null; categoryName?: string | null },
  courseById: Map<string, CourseRef>,
): string | null {
  if (lead.courseId === NOT_SURE) return null;
  if (typeof lead.categoryId === "string") return lead.categoryName ?? null;
  if (lead.categoryId === null) return null; // saved knowing there was no category: never fall back
  return courseById.get(lead.courseId)?.categoryName ?? null;
}

export function courseLinkFor(courseId: string, courseById: Map<string, CourseRef>): CourseLink {
  if (courseId === NOT_SURE) return { kind: "none" };
  return courseById.has(courseId) ? { kind: "edit", href: `/admin/courses/${courseId}/edit` } : { kind: "removed" };
}

/** Current categories in their order, then categories found only in snapshots, marked "(removed)". */
export function categoryOptions(current: CategoryRef[], snapshots: CategoryRef[]): FilterOption[] {
  const known = new Set(current.map((c) => c.id));
  const removed = snapshots
    .filter((s) => !known.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => ({ value: s.id, label: `${s.name} (removed)` }));
  return [...current.map((c) => ({ value: c.id, label: c.name })), ...removed];
}

export function courseOptions(courses: CourseRef[]): FilterOption[] {
  return [
    ...[...courses].sort((a, b) => a.title.localeCompare(b.title)).map((c) => ({ value: c.id, label: c.title })),
    { value: NOT_SURE, label: "Not sure yet" },
  ];
}

export function courseIdsByCategory(courses: CourseRef[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const c of courses) map.set(c.categoryId, [...(map.get(c.categoryId) ?? []), c.id]);
  return map;
}
