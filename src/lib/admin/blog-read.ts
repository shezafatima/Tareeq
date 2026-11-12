import "server-only";
import type { Types } from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { BlogCategoryModel, BlogPostModel } from "@/lib/blog/model";
import { pickImage } from "@/lib/images/schema";
import type { StoredImage } from "@/lib/images/shared";
import { karachiDay, type BlogPostFormValues } from "./blog-schema";
import { escapeRegex, isObjectId } from "./leads-params";

// Admin reads of the blog (specs/033-admin-blog contracts/data-access.md). Deliberately NOT cached, so the owner always sees what
// is stored, draft or published, the moment it is saved.

export const ADMIN_POST_LIMIT = 200;

export type AdminPostRow = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  publishedAt: string | null;
  featured: boolean;
  updatedAt: string;
  category: { id: string; name: string } | null;
  cover: StoredImage | null;
};

/** The editor's values plus what it needs to know about the saved post. */
export type AdminPost = BlogPostFormValues & {
  id: string;
  updatedAt: string;
  /** exact stored instant, so an unchanged date keeps its timestamp */
  publishedAtExact: string | null;
  contentImages: { url: string; width: number; height: number }[];
};

export type AdminBlogCategory = { id: string; name: string; slug: string; description: string; order: number; count: number };

type StoredCategory = { _id: Types.ObjectId; name: string; slug: string; order: number };
type StoredPost = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: unknown;
  content?: string;
  contentImages?: { url: string; width: number; height: number }[];
  category?: Types.ObjectId | StoredCategory | null;
  tags?: string[];
  status: "draft" | "published";
  publishedAt?: Date | null;
  updatedAt: Date;
  seo?: { metaTitle?: string; metaDescription?: string };
  featured?: boolean;
};

export type AdminPostFilters = { status?: "draft" | "published" | null; category?: string | null; q?: string | null };

/** Posts matching the filters, most recently edited first, at most ADMIN_POST_LIMIT. Throws when the database cannot be read. */
export async function listAdminPosts({ status, category, q }: AdminPostFilters = {}): Promise<AdminPostRow[]> {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (status === "draft" || status === "published") filter.status = status;
  if (category && isObjectId(category)) filter.category = category;
  const text = (q ?? "").trim().slice(0, 100);
  if (text) filter.title = { $regex: escapeRegex(text), $options: "i" };
  const docs = await BlogPostModel.find(filter)
    .select("-content -contentImages")
    .sort({ updatedAt: -1 })
    .limit(ADMIN_POST_LIMIT)
    .populate<{ category: StoredCategory | null }>("category", "name slug")
    .lean<StoredPost[]>();
  return docs.map((d) => {
    const cat = d.category && typeof d.category === "object" && "name" in d.category ? d.category : null;
    return {
      id: d._id.toString(),
      title: d.title,
      slug: d.slug,
      status: d.status,
      publishedAt: d.publishedAt ? new Date(d.publishedAt).toISOString() : null,
      featured: d.featured === true,
      updatedAt: new Date(d.updatedAt).toISOString(),
      category: cat ? { id: cat._id.toString(), name: cat.name } : null,
      cover: pickImage(d.coverImage) ?? null,
    };
  });
}

/** One post for the editor or the preview page, or null for an unknown or malformed id. Throws when the database cannot be read. */
export async function getAdminPost(id: string): Promise<AdminPost | null> {
  if (typeof id !== "string" || !isObjectId(id)) return null;
  await connectDb();
  const d = await BlogPostModel.findById(id).lean<StoredPost>();
  if (!d) return null;
  const categoryId = d.category ? (typeof d.category === "object" && "_id" in d.category ? d.category._id : d.category).toString() : "";
  return {
    id: d._id.toString(),
    title: d.title,
    slug: d.slug,
    slugAuto: false, // an existing address never changes by itself
    excerpt: d.excerpt ?? "",
    categoryId,
    tags: d.tags ?? [],
    coverImage: pickImage(d.coverImage) ?? null,
    featured: d.featured === true,
    publishedAt: d.publishedAt ? karachiDay(new Date(d.publishedAt)) : "",
    publishedAtExact: d.publishedAt ? new Date(d.publishedAt).toISOString() : null,
    content: d.content ?? "",
    metaTitle: d.seo?.metaTitle ?? "",
    metaDescription: d.seo?.metaDescription ?? "",
    status: d.status,
    updatedAt: new Date(d.updatedAt).toISOString(),
    contentImages: (d.contentImages ?? []).map((i) => ({ url: i.url, width: i.width, height: i.height })),
  };
}

/** Every category in display order with how many posts (any status) use it. Throws when the database cannot be read. */
export async function listAdminBlogCategories(): Promise<AdminBlogCategory[]> {
  await connectDb();
  const [categories, counts] = await Promise.all([
    BlogCategoryModel.find().sort({ order: 1, name: 1 }).lean<StoredCategory[]>(),
    BlogPostModel.aggregate<{ _id: Types.ObjectId | null; n: number }>([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  return categories.map((c) => ({ id: c._id.toString(), name: c.name, slug: c.slug, description: "", order: c.order, count: byId.get(c._id.toString()) ?? 0 }));
}
