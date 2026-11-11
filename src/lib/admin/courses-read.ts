import "server-only";
import { connectDb } from "@/lib/db/mongoose";
import { CourseCategoryModel, CourseModel } from "@/lib/courses/model";
import { isEnrollmentStatus, type Course, type CourseCategory, type EnrollmentStatus } from "@/lib/courses/options";
import { sortCourses } from "@/lib/courses/view";
import { pickImage } from "@/lib/images/schema";
import { isObjectId } from "./leads-params";

// Admin reads of courses and categories. Deliberately NOT cached (unlike src/lib/courses/data.ts), so the owner always
// sees what is stored, published or not, the moment it is saved.

export type AdminCategory = CourseCategory & { courseCount: number };
export type AdminCourse = Course & { categoryId: string };

type StoredCategory = { _id: { toString(): string }; name: string; slug: string; description?: string; order: number };
type StoredCourse = Omit<Course, "id" | "category" | "createdAt" | "updatedAt"> & {
  _id: { toString(): string };
  category: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

const toCategory = (doc: StoredCategory): CourseCategory => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
  description: doc.description ?? "",
  order: doc.order,
});

async function readCategories(): Promise<CourseCategory[]> {
  const docs = await CourseCategoryModel.find().sort({ order: 1, name: 1 }).lean<StoredCategory[]>();
  return docs.map(toCategory);
}

/** Every category in display order, with how many courses use it. Throws when the database cannot be read. */
export async function listAllCategories(): Promise<AdminCategory[]> {
  await connectDb();
  const [categories, counts] = await Promise.all([
    readCategories(),
    CourseModel.aggregate<{ _id: { toString(): string }; n: number }>([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  return categories.map((c) => ({ ...c, courseCount: byId.get(c.id) ?? 0 }));
}

function toAdminCourse(doc: StoredCourse, categories: Map<string, CourseCategory>): AdminCourse {
  const categoryId = doc.category.toString();
  const category = categories.get(categoryId);
  return {
    id: doc._id.toString(),
    categoryId,
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
    ...(pickImage(doc.coverImage) ? { coverImage: pickImage(doc.coverImage) } : {}),
    featured: Boolean(doc.featured),
    order: doc.order,
    published: doc.published,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

/** Every course, published or not, featured first then display order. Invalid filters are ignored. */
export async function listAllCourses(filters: { category?: string; status?: string } = {}): Promise<AdminCourse[]> {
  await connectDb();
  const query: { category?: string; enrollmentStatus?: EnrollmentStatus } = {};
  if (filters.category && isObjectId(filters.category)) query.category = filters.category;
  if (isEnrollmentStatus(filters.status)) query.enrollmentStatus = filters.status;
  const [docs, categories] = await Promise.all([CourseModel.find(query).lean<StoredCourse[]>(), readCategories()]);
  const byId = new Map(categories.map((c) => [c.id, c]));
  return sortCourses(docs.map((d) => toAdminCourse(d, byId)));
}

/** One course by its opaque id, or null for an unknown or malformed id. */
export async function getCourseById(id: string): Promise<AdminCourse | null> {
  if (!isObjectId(id)) return null;
  await connectDb();
  const [doc, categories] = await Promise.all([CourseModel.findById(id).lean<StoredCourse>(), readCategories()]);
  return doc ? toAdminCourse(doc, new Map(categories.map((c) => [c.id, c]))) : null;
}
