import "server-only";
import { unstable_cache } from "next/cache";
import type { CourseOption } from "@/content/types";
import { connectDb } from "@/lib/db/mongoose";
import { CourseCategoryModel, CourseModel } from "./model";
import { isLevel, SLUG_MAX, SLUG_PATTERN, type Course, type CourseCategory, type Level } from "./options";
import { isListed, sortCourses, toCourseOptions } from "./view";

// The one place that reads courses for the public site (specs/025-courses-catalog/contracts/data-access.md). Reads are
// cached and refreshed by tag: "courses" for every course, "course:<slug>" for one, "categories" for category names.
// Course reads carry "categories" too, so renaming a category refreshes every card that shows it. A failed read throws,
// so it is never cached.

const REFRESH_SECONDS = 3600;

type StoredCategory = { _id: { toString(): string }; name: string; slug: string; description?: string; order: number };
type StoredCourse = Omit<Course, "id" | "category" | "createdAt" | "updatedAt"> & {
  _id: { toString(): string };
  category: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

const readCategories = unstable_cache(
  async (): Promise<CourseCategory[]> => {
    await connectDb();
    const docs = await CourseCategoryModel.find().sort({ order: 1, name: 1 }).lean<StoredCategory[]>();
    return docs.map((d) => ({ id: d._id.toString(), name: d.name, slug: d.slug, description: d.description ?? "", order: d.order }));
  },
  ["course-categories"],
  { tags: ["categories"], revalidate: REFRESH_SECONDS },
);

function toCourse(doc: StoredCourse, categories: Map<string, CourseCategory>): Course {
  const category = categories.get(doc.category.toString());
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    category: category ? { name: category.name, slug: category.slug } : null,
    level: doc.level,
    summary: doc.summary,
    description: doc.description ?? "",
    outcomes: [...(doc.outcomes ?? [])],
    syllabus: (doc.syllabus ?? []).map(({ title, description }) => ({ title, description: description ?? "" })),
    format: doc.format,
    durationText: doc.durationText ?? "",
    startDateText: doc.startDateText ?? "",
    priceText: doc.priceText ?? "",
    enrollmentStatus: doc.enrollmentStatus,
    ...(doc.coverImageUrl ? { coverImageUrl: doc.coverImageUrl } : {}),
    featured: Boolean(doc.featured),
    order: doc.order,
    published: doc.published,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

const byId = (categories: CourseCategory[]) => new Map(categories.map((c) => [c.id, c]));

/** Every published course of any status, sorted. Closed ones are kept: their pages stay up (clarification Q1). */
const readPublished = unstable_cache(
  async (): Promise<Course[]> => {
    await connectDb();
    const [docs, categories] = await Promise.all([
      CourseModel.find({ published: true }).lean<StoredCourse[]>(),
      readCategories(),
    ]);
    const map = byId(categories);
    return sortCourses(docs.map((d) => toCourse(d, map)));
  },
  ["courses:published"],
  { tags: ["courses", "categories"], revalidate: REFRESH_SECONDS },
);

/** Every category, in display order. Throws when the database cannot be read. */
export async function getCategories(): Promise<CourseCategory[]> {
  return readCategories();
}

/**
 * Published courses that are open or coming soon, featured first, then display order. The filters are applied after the
 * cached read (the catalogue is small), so there is one cache entry. Throws when the database cannot be read.
 */
export async function getPublishedCourses(filters: { category?: string; level?: Level } = {}): Promise<Course[]> {
  const listed = (await readPublished()).filter(isListed);
  return listed.filter(
    (c) =>
      (!filters.category || c.category?.slug === filters.category) && (!filters.level || (isLevel(filters.level) && c.level === filters.level)),
  );
}

/** A published course of any status, or null if the slug is unknown, unpublished or malformed. Throws on a failed read. */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (typeof slug !== "string" || slug.length > SLUG_MAX || !SLUG_PATTERN.test(slug)) return null;
  const read = unstable_cache(
    async (): Promise<Course | null> => {
      await connectDb();
      const [doc, categories] = await Promise.all([
        CourseModel.findOne({ slug, published: true }).lean<StoredCourse>(),
        readCategories(),
      ]);
      return doc ? toCourse(doc, byId(categories)) : null;
    },
    ["course", slug],
    { tags: ["courses", `course:${slug}`, "categories"], revalidate: REFRESH_SECONDS },
  );
  return read();
}

const logFailure = (where: string, err: unknown) =>
  console.error(`[courses] ${where} failed: ${err instanceof Error ? err.name : "UnknownError"}`);

/**
 * Listed courses for a page that has an unavailable state; null means unavailable. In production a failed read is
 * rethrown, so regeneration fails and the last good page keeps being served. The build and dev get null.
 */
export async function loadPublishedCourses(): Promise<Course[] | null> {
  try {
    return await getPublishedCourses();
  } catch (err) {
    logFailure("list read", err);
    const building = process.env.NEXT_PHASE === "phase-production-build";
    if (process.env.NODE_ENV === "production" && !building) throw err;
    return null;
  }
}

/** Every published slug (closed included) to generate ahead of time. Empty when the database cannot be read. */
export async function getPublishedCourseSlugs(): Promise<string[]> {
  try {
    return (await readPublished()).map((c) => c.slug);
  } catch (err) {
    logFailure("slug read", err);
    return [];
  }
}

/** Register form choices: open and coming-soon courses, grouped by category. "Not sure yet" is added by the caller. */
export async function getOfferedCourseOptions(): Promise<CourseOption[]> {
  const [courses, categories] = await Promise.all([readPublished(), readCategories()]);
  return toCourseOptions(courses, categories);
}
