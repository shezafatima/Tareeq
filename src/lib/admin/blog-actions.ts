"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { BlogCategoryModel, BlogPostModel } from "@/lib/blog/model";
import { imageUrlsIn, renderBlogMarkdown, type ImageSize, type RenderedContent } from "@/lib/blog/markdown";
import { readingMinutes } from "@/lib/blog/view";
import { lookupAssetSize } from "@/lib/cloudinary/server";
import { connectDb } from "@/lib/db/mongoose";
import { pickImage } from "@/lib/images/schema";
import { publicIdFromUrl } from "@/lib/images/shared";
import { dayToDate, karachiDay, LIMITS, MESSAGES, parseBlogPost, publishIssues, type BlogPostFormValues } from "./blog-schema";
import { deleteReplaced, imageFailure, resolveImageChange, type ImageChange } from "./images-verify";
import { isObjectId } from "./leads-params";
import { logAdmin } from "./log";
import type { ActionResult, Failure } from "./result";
import { withAdmin } from "./session";
import { nextFreeSlug } from "./slug";

// Blog post edits (specs/033-admin-blog contracts/data-access.md). Each action is a public POST endpoint, so each is wrapped by
// withAdmin, re-validates with the editor's rules, and refreshes the public pages only after the write succeeded.

const unavailable = (err: unknown): Failure => {
  console.error(`[admin] blog action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  return { ok: false, code: "unavailable" };
};

const isDuplicateKey = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
const slugTaken: Failure = { ok: false, code: "conflict", fieldErrors: { slug: MESSAGES.slugTaken } };
const noCategory: Failure = { ok: false, code: "invalid", fieldErrors: { categoryId: MESSAGES.category } };
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MAX_CONTENT_IMAGES = 100;
const MAX_SIZE_LOOKUPS = 20;

/** The blog list, related posts, navigation, sitemap, feed and each given post page show the change at once. Pass old and new slugs. */
function refresh(...slugs: string[]): void {
  revalidateTag("blog", { expire: 0 });
  for (const slug of new Set(slugs)) revalidateTag(`post:${slug}`, { expire: 0 });
  revalidatePath("/admin/blog");
}

async function freeSlug(base: string): Promise<string> {
  const taken = await BlogPostModel.find({ slug: { $regex: `^${escapeRegex(base)}(-\\d+)?$` } })
    .select("slug")
    .lean<{ slug: string }[]>();
  return nextFreeSlug(base, taken.map((t) => t.slug));
}

type ContentImage = { url: string; width: number; height: number };

/**
 * The sizes of the post's images that live in our image store (research R4): sizes already known are kept, new ones are looked up
 * once at Cloudinary (at most 20 a save). A failed lookup is logged and that image simply falls back to a plain lazy <img>.
 */
async function rebuildContentImages(content: string, known: ContentImage[] | undefined, id?: string): Promise<ContentImage[]> {
  const have = new Map((known ?? []).map((i) => [i.url, i]));
  const out: ContentImage[] = [];
  let lookups = 0;
  for (const url of imageUrlsIn(content)) {
    if (out.length >= MAX_CONTENT_IMAGES) break;
    const existing = have.get(url);
    if (existing) {
      out.push({ url, width: existing.width, height: existing.height });
      continue;
    }
    const publicId = publicIdFromUrl(url, process.env.CLOUDINARY_CLOUD_NAME || undefined);
    if (!publicId || lookups >= MAX_SIZE_LOOKUPS) continue;
    lookups++;
    try {
      const size = await lookupAssetSize(publicId);
      if (size) out.push({ url, ...size });
    } catch (err) {
      console.error(`[admin] blog image size lookup failed: ${err instanceof Error ? err.name : "UnknownError"}`);
      logAdmin("blog", "image-size-failed", id);
    }
  }
  return out;
}

type StoredCurrent = {
  slug: string;
  status: "draft" | "published";
  publishedAt?: Date | null;
  coverImage?: unknown;
  contentImages?: ContentImage[];
};

/**
 * The publish date to store (data-model.md). A typed day different from the stored Karachi day is stored at 09:00 there; the same
 * day keeps the exact stored instant. The first publish with no date sets now. A cleared date on a post that has one keeps it.
 */
function resolvePublishedAt(day: string, existing: Date | null | undefined, status: "draft" | "published"): Date | null {
  let at: Date | null = existing ? new Date(existing) : null;
  if (day && !(at && karachiDay(at) === day)) at = dayToDate(day);
  if (status === "published" && !at) at = new Date();
  return at;
}

export type SavedPost = { id: string; slug: string; status: "draft" | "published"; publishedAt: string | null; updatedAt: string; readingTime: number };

/**
 * Creates (id null) or updates a post. `values.status` is the status being asked for: "published" publishes (and is refused,
 * with a message per missing field, when the post is not complete), "draft" saves as a draft or unpublishes (research R9).
 */
export const saveBlogPost = withAdmin(async (input: { id: string | null; values: BlogPostFormValues }): Promise<ActionResult<SavedPost>> => {
  const { id, values } = input ?? {};
  if (id !== null && (typeof id !== "string" || !isObjectId(id))) return { ok: false, code: "invalid" };
  const parsed = parseBlogPost(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  const { slugAuto, ...data } = parsed.data;
  if (data.status === "published") {
    const issues = publishIssues({ ...data, slugAuto: Boolean(slugAuto) });
    if (Object.keys(issues).length > 0) return { ok: false, code: "invalid", fieldErrors: issues };
  }
  try {
    await connectDb();
    let current: StoredCurrent | null = null;
    if (id) {
      current = await BlogPostModel.findById(id).select("slug status publishedAt coverImage contentImages").lean<StoredCurrent>();
      if (!current) return { ok: false, code: "not_found" };
    }
    if (data.categoryId && !(await BlogCategoryModel.exists({ _id: data.categoryId }))) return noCategory;
    if (id && (await BlogPostModel.exists({ slug: data.slug, _id: { $ne: id } }))) return slugTaken;

    let change: ImageChange;
    try {
      change = await resolveImageChange(pickImage(current?.coverImage), data.coverImage ?? null);
    } catch (err) {
      return imageFailure(err);
    }

    const publishedAt = resolvePublishedAt(data.publishedAt, current?.publishedAt, data.status);
    const body = {
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      contentImages: await rebuildContentImages(data.content, current?.contentImages, id ?? undefined),
      tags: data.tags,
      status: data.status,
      publishedAt,
      readingTime: readingMinutes(data.content),
      seo: { metaTitle: data.metaTitle, metaDescription: data.metaDescription },
      featured: data.featured,
    };

    if (id && current) {
      const unset: Record<string, 1> = {};
      if (!change.image) unset.coverImage = 1;
      if (!data.categoryId) unset.category = 1;
      const saved = await BlogPostModel.findByIdAndUpdate(
        id,
        {
          $set: { ...body, slug: data.slug, ...(change.image ? { coverImage: change.image } : {}), ...(data.categoryId ? { category: data.categoryId } : {}) },
          ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
        { new: true, runValidators: true, projection: { updatedAt: 1, publishedAt: 1 } },
      ).lean<{ updatedAt: Date; publishedAt?: Date | null }>();
      if (!saved) return { ok: false, code: "not_found" };
      await deleteReplaced(change);
      refresh(data.slug, current.slug);
      logAdmin("blog", "ok", id);
      return {
        ok: true,
        id,
        slug: data.slug,
        status: data.status,
        publishedAt: saved.publishedAt ? new Date(saved.publishedAt).toISOString() : null,
        updatedAt: new Date(saved.updatedAt).toISOString(),
        readingTime: body.readingTime,
      };
    }

    // a slug filled in from the title gets the lowest free -N; a typed slug is never changed behind the owner's back
    for (let attempt = 0; attempt < 2; attempt++) {
      let slug = data.slug;
      if (await BlogPostModel.exists({ slug })) {
        if (!slugAuto) return slugTaken;
        slug = await freeSlug(data.slug);
      }
      try {
        const created = await BlogPostModel.create({
          ...body,
          slug,
          ...(change.image ? { coverImage: change.image } : {}),
          ...(data.categoryId ? { category: data.categoryId } : {}),
        });
        refresh(slug);
        logAdmin("blog", "ok", created.id);
        return {
          ok: true,
          id: created.id,
          slug,
          status: data.status,
          publishedAt: created.publishedAt ? new Date(created.publishedAt).toISOString() : null,
          updatedAt: new Date(created.updatedAt).toISOString(),
          readingTime: body.readingTime,
        };
      } catch (err) {
        if (!isDuplicateKey(err)) throw err;
        if (!slugAuto) return slugTaken;
      }
    }
    return slugTaken;
  } catch (err) {
    if (isDuplicateKey(err)) return slugTaken;
    return unavailable(err);
  }
});

/** Deletes a post for good and removes its cover file, best effort. Body images are kept: they may be reused elsewhere (research R10). */
export const deleteBlogPost = withAdmin(async (input: { id: string }): Promise<ActionResult> => {
  const { id } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const doc = await BlogPostModel.findByIdAndDelete(id, { projection: { slug: 1, coverImage: 1 } }).lean<{ slug: string; coverImage?: unknown }>();
    if (!doc) return { ok: false, code: "not_found" };
    const cover = pickImage(doc.coverImage);
    if (cover) await deleteReplaced({ image: null, toDelete: cover.publicId });
    refresh(doc.slug);
    logAdmin("blog", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

/**
 * The editor's live preview (research R5): the same renderer the public page uses, so what the owner sees is what readers get. It
 * touches neither the database nor Cloudinary. `sizes` only says how big the images are; it is a display hint, never stored.
 */
export const renderBlogPreview = withAdmin(
  async (input: { markdown: string; sizes: Record<string, ImageSize> }): Promise<ActionResult<RenderedContent>> => {
    const { markdown, sizes } = input ?? {};
    if (typeof markdown !== "string" || markdown.length > LIMITS.content) return { ok: false, code: "invalid" };
    const clean: Record<string, ImageSize> = {};
    const entries = sizes && typeof sizes === "object" ? Object.entries(sizes).slice(0, MAX_CONTENT_IMAGES) : [];
    for (const [url, size] of entries) {
      const { width, height } = (size ?? {}) as Partial<ImageSize>;
      if (Number.isInteger(width) && Number.isInteger(height) && width! > 0 && height! > 0 && width! <= 10000 && height! <= 10000) {
        clean[url] = { width: width!, height: height! };
      }
    }
    try {
      return { ok: true, ...renderBlogMarkdown(markdown, clean) };
    } catch (err) {
      return unavailable(err);
    }
  },
);
