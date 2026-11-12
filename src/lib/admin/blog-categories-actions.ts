"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { BlogCategoryModel, BlogPostModel } from "@/lib/blog/model";
import { connectDb } from "@/lib/db/mongoose";
import { MESSAGES, parseCategory, type CategoryFormValues } from "./courses-schema";
import { isObjectId } from "./leads-params";
import { logAdmin } from "./log";
import type { ActionResult, Failure } from "./result";
import { withAdmin } from "./session";
import { nextFreeSlug } from "./slug";

// Blog category edits (specs/033-admin-blog contracts/data-access.md). Same shape as course-categories-actions.ts: each action is
// a public POST endpoint, so each is wrapped by withAdmin, re-validates with the form's rules, and refreshes the public pages only
// after the write. A blog category has no description, so that field is accepted and ignored.

const unavailable = (err: unknown): Failure => {
  console.error(`[admin] blog category action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  return { ok: false, code: "unavailable" };
};

const isDuplicateKey = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
const slugTaken: Failure = { ok: false, code: "conflict", fieldErrors: { slug: MESSAGES.categorySlugTaken } };
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Category names show on every post card, so any category change refreshes the whole blog. */
function refresh(): void {
  revalidateTag("blog", { expire: 0 });
  revalidatePath("/admin/blog");
  revalidatePath("/admin/blog/categories");
}

async function freeSlug(base: string): Promise<string> {
  const taken = await BlogCategoryModel.find({ slug: { $regex: `^${escapeRegex(base)}(-\\d+)?$` } })
    .select("slug")
    .lean<{ slug: string }[]>();
  return nextFreeSlug(base, taken.map((t) => t.slug));
}

export const createBlogCategory = withAdmin(
  async (values: CategoryFormValues): Promise<ActionResult<{ id: string; slug: string }>> => {
    const parsed = parseCategory(values);
    if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
    const { slugAuto, name, slug: wanted, order } = parsed.data;
    try {
      await connectDb();
      for (let attempt = 0; attempt < 2; attempt++) {
        let slug = wanted;
        if (await BlogCategoryModel.exists({ slug })) {
          if (!slugAuto) return slugTaken;
          slug = await freeSlug(wanted);
        }
        try {
          const created = await BlogCategoryModel.create({ name, slug, order });
          refresh();
          logAdmin("blog", "ok", created.id);
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

export const updateBlogCategory = withAdmin(async (input: { id: string; values: CategoryFormValues }): Promise<ActionResult> => {
  const { id, values } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  const parsed = parseCategory(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  const { name, slug, order } = parsed.data;
  try {
    await connectDb();
    if (!(await BlogCategoryModel.exists({ _id: id }))) return { ok: false, code: "not_found" };
    if (await BlogCategoryModel.exists({ slug, _id: { $ne: id } })) return slugTaken;
    await BlogCategoryModel.updateOne({ _id: id }, { $set: { name, slug, order } }, { runValidators: true });
    refresh();
    logAdmin("blog", "ok", id);
    return { ok: true };
  } catch (err) {
    if (isDuplicateKey(err)) return slugTaken;
    return unavailable(err);
  }
});

export const setBlogCategoryOrder = withAdmin(async (input: { id: string; order: number }): Promise<ActionResult> => {
  const { id, order } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id) || typeof order !== "number" || !Number.isInteger(order) || Math.abs(order) > 9999) {
    return { ok: false, code: "invalid", fieldErrors: { order: MESSAGES.order } };
  }
  try {
    await connectDb();
    const doc = await BlogCategoryModel.findByIdAndUpdate(id, { $set: { order } }, { projection: { _id: 1 } }).lean();
    if (!doc) return { ok: false, code: "not_found" };
    refresh();
    logAdmin("blog", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

/** Refused while any post, draft or published, uses the category (FR-016). */
export const deleteBlogCategory = withAdmin(async (input: { id: string }): Promise<ActionResult> => {
  const { id } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const count = await BlogPostModel.countDocuments({ category: id });
    if (count > 0) return { ok: false, code: "in_use", count, message: `Used by ${count} post${count === 1 ? "" : "s"} — move ${count === 1 ? "it" : "them"} to another category first.` };
    const doc = await BlogCategoryModel.findByIdAndDelete(id, { projection: { _id: 1 } }).lean();
    if (!doc) return { ok: false, code: "not_found" };
    refresh();
    logAdmin("blog", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});
