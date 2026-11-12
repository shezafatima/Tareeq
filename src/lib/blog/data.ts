import "server-only";
import type { Types } from "mongoose";
import { unstable_cache } from "next/cache";
import { connectDb } from "@/lib/db/mongoose";
import { pickImage } from "@/lib/images/schema";
import { SLUG_MAX, SLUG_PATTERN } from "@/lib/programs/options";
import { BlogCategoryModel, BlogPostModel } from "./model";
import {
  listForPage,
  rankRelated,
  type BlogListing,
  type PublicCategory,
  type PublicPost,
  type PublicPostCard,
} from "./view";

// The public reads of the blog (specs/033-admin-blog contracts/data-access.md, research R7). One cached list of published post cards
// (tag "blog") feeds the list, hero, related posts, chips, navigation, sitemap and feed; each post is cached on its own
// (tags "blog" and "post:<slug>"). A failed read throws, so it is never cached. Drafts are never read here.

const REFRESH_SECONDS = 3600;
const BLOG_TAG = "blog";

type StoredCategory = { _id: Types.ObjectId; name: string; slug: string; order: number };
type StoredPost = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: unknown;
  content?: string;
  contentImages?: { url: string; width: number; height: number }[];
  category?: StoredCategory | null;
  tags?: string[];
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  readingTime?: number;
  seo?: { metaTitle?: string; metaDescription?: string };
  featured?: boolean;
};

function toCard(doc: StoredPost): PublicPostCard {
  const cat = doc.category && typeof doc.category === "object" && "slug" in doc.category ? doc.category : null;
  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt ?? "",
    cover: pickImage(doc.coverImage) ?? null,
    category: cat ? { name: cat.name, slug: cat.slug } : null,
    tags: doc.tags ?? [],
    publishedAt: new Date(doc.publishedAt ?? doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
    readingTime: doc.readingTime ?? 1,
    featured: doc.featured === true,
  };
}

const newestFirst = (a: PublicPostCard, b: PublicPostCard): number => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

const readPublishedCards = unstable_cache(
  async (): Promise<PublicPostCard[]> => {
    await connectDb();
    const docs = await BlogPostModel.find({ status: "published" })
      .select("-content -contentImages")
      .populate<{ category: StoredCategory | null }>("category", "name slug order")
      .lean<StoredPost[]>();
    return docs.map(toCard).sort(newestFirst);
  },
  ["blog:cards"],
  { tags: [BLOG_TAG], revalidate: REFRESH_SECONDS },
);

/** Every published post as a card, newest first. Throws when the database cannot be read. */
export async function getPublishedCards(): Promise<PublicPostCard[]> {
  return readPublishedCards();
}

/** One page of the blog list with its hero (unfiltered page 1 only) and filters applied. 9 per page. */
export async function getPublishedPosts({ category, tag, page }: { category?: string | null; tag?: string | null; page?: number }): Promise<BlogListing> {
  return listForPage({ cards: await readPublishedCards(), category, tag, page: page ?? 1 });
}

/** A published post with its content, or null if the address is unknown, a draft or malformed. */
export async function getPostBySlug(slug: string): Promise<PublicPost | null> {
  if (typeof slug !== "string" || slug.length > SLUG_MAX || !SLUG_PATTERN.test(slug)) return null;
  const read = unstable_cache(
    async (): Promise<PublicPost | null> => {
      await connectDb();
      const doc = await BlogPostModel.findOne({ slug, status: "published" })
        .populate<{ category: StoredCategory | null }>("category", "name slug order")
        .lean<StoredPost>();
      if (!doc) return null;
      return {
        ...toCard(doc),
        content: doc.content ?? "",
        contentImages: (doc.contentImages ?? []).map((i) => ({ url: i.url, width: i.width, height: i.height })),
        seo: { metaTitle: doc.seo?.metaTitle ?? "", metaDescription: doc.seo?.metaDescription ?? "" },
      };
    },
    ["blog:post", slug],
    { tags: [BLOG_TAG, `post:${slug}`], revalidate: REFRESH_SECONDS },
  );
  return read();
}

/** Up to `n` other published posts: same category first, then shared tags, then newest. */
export async function getRelatedPosts(post: { slug: string; category: PublicPostCard["category"]; tags: string[] }, n: number = 3): Promise<PublicPostCard[]> {
  return rankRelated(post, await readPublishedCards(), n);
}

const readCategories = unstable_cache(
  async (): Promise<PublicCategory[]> => {
    await connectDb();
    const [categories, cards] = await Promise.all([
      BlogCategoryModel.find().sort({ order: 1, name: 1 }).lean<StoredCategory[]>(),
      readPublishedCards(),
    ]);
    const counts = new Map<string, number>();
    for (const c of cards) if (c.category) counts.set(c.category.slug, (counts.get(c.category.slug) ?? 0) + 1);
    return categories
      .filter((c) => (counts.get(c.slug) ?? 0) > 0)
      .map((c) => ({ name: c.name, slug: c.slug, order: c.order, postCount: counts.get(c.slug) ?? 0 }));
  },
  ["blog:categories"],
  { tags: [BLOG_TAG], revalidate: REFRESH_SECONDS },
);

/** Categories that have at least one published post, in display order. */
export async function getBlogCategories(): Promise<PublicCategory[]> {
  return readCategories();
}

const logFailure = (where: string, err: unknown) => console.error(`[blog] ${where} failed: ${err instanceof Error ? err.name : "UnknownError"}`);

/** Addresses of published posts, for static generation. Empty when the database cannot be read, so the build still succeeds. */
export async function getPublishedPostSlugs(): Promise<string[]> {
  try {
    return (await readPublishedCards()).map((c) => c.slug);
  } catch (err) {
    logFailure("slug read", err);
    return [];
  }
}

/** The newest published posts for the RSS feed. Throws when the database cannot be read. */
export async function getFeedPosts(n: number = 20): Promise<PublicPostCard[]> {
  return (await readPublishedCards()).slice(0, Math.max(1, n));
}

/** Published posts for the sitemap; empty when the database cannot be read. */
export async function getSitemapPosts(): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    return (await readPublishedCards()).map((c) => ({ slug: c.slug, updatedAt: c.updatedAt }));
  } catch (err) {
    logFailure("sitemap read", err);
    return [];
  }
}

/** Never throws: false when the database cannot be read, so the navigation just hides the link (research R17). */
export async function hasPublishedPostsSafe(): Promise<boolean> {
  try {
    return (await readPublishedCards()).length > 0;
  } catch (err) {
    logFailure("nav read", err);
    return false;
  }
}

/**
 * The list for /blog; null means unavailable. In production a failed read is rethrown, so regeneration fails and the last good
 * page keeps being served. The build and dev have no good page to protect, so they get null (same rule as the gallery).
 */
export async function loadPublishedPosts(args: { category?: string | null; tag?: string | null; page?: number }): Promise<BlogListing | null> {
  try {
    return await getPublishedPosts(args);
  } catch (err) {
    logFailure("list read", err);
    const building = process.env.NEXT_PHASE === "phase-production-build";
    if (process.env.NODE_ENV === "production" && !building) throw err;
    return null;
  }
}

export type BlogIndex = { listing: BlogListing; categories: PublicCategory[]; hasPosts: boolean };

/**
 * Everything /blog needs in one read: the listing for the asked page and filters, the category chips, and whether any post is
 * published at all (that decides "First posts coming soon."). Null means unavailable, with the same production rule as above.
 */
export async function loadBlogIndex(args: { category?: string | null; tag?: string | null; page?: number }): Promise<BlogIndex | null> {
  try {
    const [cards, categories] = await Promise.all([readPublishedCards(), readCategories()]);
    return { listing: listForPage({ cards, category: args.category, tag: args.tag, page: args.page ?? 1 }), categories, hasPosts: cards.length > 0 };
  } catch (err) {
    logFailure("index read", err);
    const building = process.env.NEXT_PHASE === "phase-production-build";
    if (process.env.NODE_ENV === "production" && !building) throw err;
    return null;
  }
}
