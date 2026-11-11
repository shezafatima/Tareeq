"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDb } from "@/lib/db/mongoose";
import { CourseCategoryModel, CourseModel } from "@/lib/courses/model";
import { MESSAGES, parseCategory, type CategoryFormValues } from "./courses-schema";
import { isObjectId } from "./leads-params";
import { logAdmin } from "./log";
import type { ActionResult, Failure } from "./result";
import { withAdmin } from "./session";
import { nextFreeSlug } from "./slug";

// Course category edits (specs/025-courses-catalog/contracts/server-actions.md). Each action is a public POST endpoint, so
// each is wrapped by withAdmin, re-validates with the form's rules, and refreshes the public pages only after the write.

const unavailable = (err: unknown): Failure => {
  console.error(`[admin] category action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  return { ok: false, code: "unavailable" };
};

const isDuplicateKey = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
const slugTaken: Failure = { ok: false, code: "conflict", fieldErrors: { slug: MESSAGES.categorySlugTaken } };
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Category names show on every course card, so a category change refreshes the course pages too. See research R3. */
function refresh(): void {
  revalidateTag("categories", { expire: 0 });
  revalidateTag("courses", { expire: 0 });
  revalidatePath("/admin/courses");
  revalidatePath("/admin/courses/categories");
}

async function freeSlug(base: string): Promise<string> {
  const taken = await CourseCategoryModel.find({ slug: { $regex: `^${escapeRegex(base)}(-\\d+)?$` } })
    .select("slug")
    .lean<{ slug: string }[]>();
  return nextFreeSlug(base, taken.map((t) => t.slug));
}

export const createCategory = withAdmin(
  async (values: CategoryFormValues): Promise<ActionResult<{ id: string; slug: string }>> => {
    const parsed = parseCategory(values);
    if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
    const { slugAuto, ...data } = parsed.data;
    try {
      await connectDb();
      for (let attempt = 0; attempt < 2; attempt++) {
        let slug = data.slug;
        if (await CourseCategoryModel.exists({ slug })) {
          if (!slugAuto) return slugTaken;
          slug = await freeSlug(data.slug);
        }
        try {
          const created = await CourseCategoryModel.create({ ...data, slug });
          refresh();
          logAdmin("category", "ok", created.id);
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
  },
);

export const updateCategory = withAdmin(async (input: { id: string; values: CategoryFormValues }): Promise<ActionResult> => {
  const { id, values } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  const parsed = parseCategory(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  const { slugAuto, ...data } = parsed.data;
  void slugAuto; // only used on create: a changed slug on update is always treated as typed
  try {
    await connectDb();
    if (!(await CourseCategoryModel.exists({ _id: id }))) return { ok: false, code: "not_found" };
    if (await CourseCategoryModel.exists({ slug: data.slug, _id: { $ne: id } })) return slugTaken;
    await CourseCategoryModel.updateOne({ _id: id }, { $set: data }, { runValidators: true });
    refresh();
    logAdmin("category", "ok", id);
    return { ok: true };
  } catch (err) {
    if (isDuplicateKey(err)) return slugTaken;
    return unavailable(err);
  }
});

export const setCategoryOrder = withAdmin(async (input: { id: string; order: number }): Promise<ActionResult> => {
  const { id, order } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id) || typeof order !== "number" || !Number.isInteger(order) || Math.abs(order) > 9999) {
    return { ok: false, code: "invalid", fieldErrors: { order: MESSAGES.order } };
  }
  try {
    await connectDb();
    const doc = await CourseCategoryModel.findByIdAndUpdate(id, { $set: { order } }, { projection: { _id: 1 } }).lean();
    if (!doc) return { ok: false, code: "not_found" };
    refresh();
    logAdmin("category", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

export const deleteCategory = withAdmin(async (input: { id: string }): Promise<ActionResult> => {
  const { id } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const count = await CourseModel.countDocuments({ category: id });
    if (count > 0) return { ok: false, code: "in_use", count };
    const doc = await CourseCategoryModel.findByIdAndDelete(id, { projection: { _id: 1 } }).lean();
    if (!doc) return { ok: false, code: "not_found" };
    refresh();
    logAdmin("category", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});
