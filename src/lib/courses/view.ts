// What pages show for courses, worked out from stored fields. Pure, so it can be unit tested and used by client code.
// See specs/025-courses-catalog/contracts/data-access.md.
import type { CourseOption } from "../../content/types.ts";
import {
  FORMAT_LABELS,
  isLevel,
  LEVEL_LABELS,
  LISTED_STATUSES,
  type Course,
  type CourseCardData,
  type CourseCategory,
  type Level,
} from "./options.ts";

/** Published and open or coming soon: shown on /courses and offered on the register form. */
export function isListed(course: Pick<Course, "published" | "enrollmentStatus">): boolean {
  return course.published && (LISTED_STATUSES as readonly string[]).includes(course.enrollmentStatus);
}

/** Featured first, then display order, then title. Returns a copy. */
export function sortCourses<T extends Pick<Course, "featured" | "order" | "title">>(courses: T[]): T[] {
  return [...courses].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order || a.title.localeCompare(b.title),
  );
}

export type CourseFilters = { category?: string; level?: Level };

/** The ?category= and ?level= filters in a query string. Unknown values are dropped. */
export function parseCourseFilters(search: string, categorySlugs: readonly string[]): CourseFilters {
  const params = new URLSearchParams(search);
  const category = params.get("category");
  const level = params.get("level");
  return {
    ...(category && categorySlugs.includes(category) ? { category } : {}),
    ...(isLevel(level) ? { level } : {}),
  };
}

/** Facts that have a value, in display order. */
export function courseFacts(
  course: Pick<Course, "format" | "durationText" | "startDateText" | "priceText" | "level">,
): { label: string; value: string }[] {
  return [
    { label: "Format", value: FORMAT_LABELS[course.format] ?? "" },
    { label: "Duration", value: course.durationText },
    { label: "Starts", value: course.startDateText },
    { label: "Price", value: course.priceText },
    { label: "Level", value: LEVEL_LABELS[course.level] ?? "" },
  ].filter((f) => f.value.trim() !== "");
}

export function toCardData(course: Course): CourseCardData {
  return {
    title: course.title,
    slug: course.slug,
    category: course.category,
    level: course.level,
    format: course.format,
    durationText: course.durationText,
    enrollmentStatus: course.enrollmentStatus,
    priceText: course.priceText,
    summary: course.summary,
    ...(course.coverImageUrl ? { coverImageUrl: course.coverImageUrl } : {}),
  };
}

/**
 * Register form choices: listed courses grouped by category (in category order, uncategorised last), each group in
 * course order. "Not sure yet" is not included; getCourseOptions() adds it.
 */
export function toCourseOptions(courses: Course[], categories: CourseCategory[]): CourseOption[] {
  const rank = new Map(categories.map((c, i) => [c.slug, i]));
  const groupRank = (c: Course) => (c.category ? (rank.get(c.category.slug) ?? categories.length) : categories.length + 1);
  const listed = sortCourses(courses.filter(isListed));
  return listed
    .map((c, i) => ({ c, i }))
    .sort((a, b) => groupRank(a.c) - groupRank(b.c) || a.i - b.i)
    .map(({ c }) => ({
      id: c.id,
      name: c.title,
      slug: c.slug,
      ...(c.category ? { group: c.category.name } : {}),
      status: c.enrollmentStatus === "open" ? "open" : "coming-soon",
    }));
}

/** Which confirmation a course sign-up gets: "open" for an open course, otherwise the waitlist wording. */
export function confirmationVariant(option: Pick<CourseOption, "status"> | undefined): "open" | "waitlist" {
  return option?.status === "open" ? "open" : "waitlist";
}
