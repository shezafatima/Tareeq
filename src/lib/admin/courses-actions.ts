"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDb } from "@/lib/db/mongoose";
import { CourseCategoryModel, CourseModel } from "@/lib/courses/model";
import { MESSAGES, parseCourse, type CourseFormValues, type CourseInput } from "./courses-schema";
import { isObjectId } from "./leads-params";
import { logAdmin } from "./log";
import type { ActionResult, Failure } from "./result";
import { withAdmin } from "./session";
import { nextFreeSlug } from "./slug";

// Course edits (specs/025-courses-catalog/contracts/server-actions.md). Each action is a public POST endpoint, so each is
// wrapped by withAdmin, re-validates with the form's rules, and refreshes the public pages only after the write succeeded.

const unavailable = (err: unknown): Failure => {
  console.error(`[admin] course action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  return { ok: false, code: "unavailable" };
};

const isDuplicateKey = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
const slugTaken: Failure = { ok: false, code: "conflict", fieldErrors: { slug: MESSAGES.slugTaken } };
const noCategory: Failure = { ok: false, code: "invalid", fieldErrors: { category: MESSAGES.category } };
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The course list, the register choices and the given course pages show the change at once. Pass old and new slugs. */
function refresh(...slugs: string[]): void {
  revalidateTag("courses", { expire: 0 });
  for (const slug of new Set(slugs)) revalidateTag(`course:${slug}`, { expire: 0 });
  revalidatePath("/admin/courses");
}

/** The document to store: an empty cover image is left out entirely (the model rejects an empty string). */
function toDocument(data: Omit<CourseInput, "slugAuto">) {
  const { coverImageUrl, ...rest } = data;
  return { ...rest, ...(coverImageUrl ? { coverImageUrl } : {}) };
}

async function freeSlug(base: string): Promise<string> {
  const taken = await CourseModel.find({ slug: { $regex: `^${escapeRegex(base)}(-\\d+)?$` } })
    .select("slug")
    .lean<{ slug: string }[]>();
  return nextFreeSlug(base, taken.map((t) => t.slug));
}

export const createCourse = withAdmin(async (values: CourseFormValues): Promise<ActionResult<{ id: string; slug: string }>> => {
  const parsed = parseCourse(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  const { slugAuto, ...data } = parsed.data;
  try {
    await connectDb();
    if (!(await CourseCategoryModel.exists({ _id: data.category }))) return noCategory;
    // a slug filled in from the title gets the lowest free -N; a typed slug is never changed behind the owner's back (R4)
    for (let attempt = 0; attempt < 2; attempt++) {
      let slug = data.slug;
      if (await CourseModel.exists({ slug })) {
        if (!slugAuto) return slugTaken;
        slug = await freeSlug(data.slug);
      }
      try {
        const created = await CourseModel.create(toDocument({ ...data, slug }));
        refresh(slug);
        logAdmin("course", "ok", created.id);
        return { ok: true, id: created.id, slug };
      } catch (err) {
        if (!isDuplicateKey(err)) throw err;
        if (!slugAuto) return slugTaken;
      }
    }
    return slugTaken;
  } catch (err) {
    return unavailable(err);
  }
});

export const updateCourse = withAdmin(async (input: { id: string; values: CourseFormValues }): Promise<ActionResult> => {
  const { id, values } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  const parsed = parseCourse(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  const { slugAuto, ...data } = parsed.data;
  void slugAuto; // only used on create: a changed slug on update is always treated as typed
  try {
    await connectDb();
    const current = await CourseModel.findById(id).select("slug").lean<{ slug: string }>();
    if (!current) return { ok: false, code: "not_found" };
    if (!(await CourseCategoryModel.exists({ _id: data.category }))) return noCategory;
    if (await CourseModel.exists({ slug: data.slug, _id: { $ne: id } })) return slugTaken;
    const doc = toDocument(data);
    await CourseModel.updateOne(
      { _id: id },
      { $set: doc, ...(doc.coverImageUrl ? {} : { $unset: { coverImageUrl: 1 } }) },
      { runValidators: true },
    );
    refresh(data.slug, current.slug);
    logAdmin("course", "ok", id);
    return { ok: true };
  } catch (err) {
    if (isDuplicateKey(err)) return slugTaken;
    return unavailable(err);
  }
});

async function setFlag(id: unknown, field: "published" | "featured", value: unknown): Promise<ActionResult> {
  if (typeof id !== "string" || !isObjectId(id) || typeof value !== "boolean") return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const doc = await CourseModel.findByIdAndUpdate(id, { $set: { [field]: value } }, { projection: { slug: 1 } }).lean<{
      slug: string;
    }>();
    if (!doc) return { ok: false, code: "not_found" };
    refresh(doc.slug);
    logAdmin("course", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
}

export const setCoursePublished = withAdmin(async (input: { id: string; published: boolean }): Promise<ActionResult> =>
  setFlag(input?.id, "published", input?.published),
);

export const setCourseFeatured = withAdmin(async (input: { id: string; featured: boolean }): Promise<ActionResult> =>
  setFlag(input?.id, "featured", input?.featured),
);

export const deleteCourse = withAdmin(async (input: { id: string }): Promise<ActionResult> => {
  const { id } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  try {
    await connectDb();
    // course sign-ups keep their title snapshot, so deleting a course never changes what old leads show (FR-029)
    const doc = await CourseModel.findByIdAndDelete(id, { projection: { slug: 1 } }).lean<{ slug: string }>();
    if (!doc) return { ok: false, code: "not_found" };
    refresh(doc.slug);
    logAdmin("course", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});
