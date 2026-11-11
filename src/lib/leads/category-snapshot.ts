import "server-only";
import { CourseCategoryModel, CourseModel } from "@/lib/courses/model";
import { connectDb } from "@/lib/db/mongoose";

// The category a course registration is saved with (specs/026-split-submissions research R6, FR-014). Read fresh,
// not from the public cache, so the snapshot is the category at the moment of sign-up. Nothing here comes from the form.

export type CategorySnapshot = { categoryId: string | null; categoryName: string | null };

const NONE: CategorySnapshot = { categoryId: null, categoryName: null };

/**
 * `{ categoryId, categoryName }` for the course; nulls for "Not sure yet" or a course/category that no longer exists;
 * `{}` (fields left off, so admin falls back to the live lookup) when the database read fails. Never throws, so a
 * failed lookup never blocks a registration.
 */
export async function readCategorySnapshot(courseId: string): Promise<CategorySnapshot | Record<string, never>> {
  if (courseId === "not-sure" || !/^[0-9a-f]{24}$/i.test(courseId)) return NONE;
  try {
    await connectDb();
    const course = await CourseModel.findById(courseId).select("category").lean<{ category?: unknown }>();
    if (!course?.category) return NONE;
    const category = await CourseCategoryModel.findById(course.category)
      .select("name")
      .lean<{ _id: { toString(): string }; name: string }>();
    if (!category) return NONE;
    return { categoryId: category._id.toString(), categoryName: category.name };
  } catch (err) {
    console.error(`[leads] category snapshot failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return {};
  }
}
