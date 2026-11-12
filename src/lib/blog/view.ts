// Pure rules for what the public sees of the blog (specs/033-admin-blog data-model.md "Derived values"). Relative imports only.
import type { StoredImage } from "../images/shared.ts";

import type { ImageSize } from "./markdown.ts";

export type { RenderedContent } from "./markdown.ts";

export const POSTS_PER_PAGE = 9;
export const WORDS_PER_MINUTE = 200;

/** What the browser is told about a body image's display width (shared by the renderer and the image component). */
export const BODY_IMAGE_SIZES = "(min-width: 1024px) 720px, 100vw";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });

/** "12 Nov 2026" in Karachi time, so the date matches the day the owner picked. Empty for a missing or invalid date. */
export function formatPostDate(iso: string | null | undefined): string {
  const t = iso ? new Date(iso) : null;
  return t && !Number.isNaN(t.getTime()) ? DATE_FORMAT.format(t) : "";
}

export type BlogCategoryRef = { name: string; slug: string };

export type PublicPostCard = {
  slug: string;
  title: string;
  excerpt: string;
  cover: StoredImage | null;
  category: BlogCategoryRef | null;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  featured: boolean;
};

export type PublicPost = PublicPostCard & {
  content: string;
  contentImages: { url: string; width: number; height: number }[];
  seo: { metaTitle: string; metaDescription: string };
};

/** A category chip: only categories with at least one published post are listed publicly. */
export type PublicCategory = BlogCategoryRef & { order: number; postCount: number };

/** The sizes map the renderer wants, from a post's stored image sizes. */
export function sizesFrom(images: { url: string; width: number; height: number }[] | undefined): Record<string, ImageSize> {
  const out: Record<string, ImageSize> = {};
  for (const i of images ?? []) if (i && typeof i.url === "string") out[i.url] = { width: i.width, height: i.height };
  return out;
}

const time = (d: string | number | Date): number => new Date(d).getTime();

/** Whole minutes to read, 200 words per minute rounded up, never below 1 (FR-003). Code fence lines and addresses are not words. */
export function readingMinutes(markdown: string): number {
  const text = String(markdown ?? "")
    .replace(/^\s*```.*$/gm, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, " $1 ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, " $1 ");
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** The newest featured card (cards are already newest first), or null. */
export function pickHero<T extends { featured: boolean; publishedAt: string }>(cards: T[]): T | null {
  let best: T | null = null;
  for (const c of cards) if (c.featured && (!best || time(c.publishedAt) > time(best.publishedAt))) best = c;
  return best;
}

/** Cards in a category (by slug) and/or carrying a tag (compared in lower case). */
export function filterCards<T extends { category: BlogCategoryRef | null; tags: string[] }>(
  cards: T[],
  { category, tag }: { category?: string | null; tag?: string | null },
): T[] {
  const wantTag = tag ? tag.trim().toLowerCase() : "";
  return cards.filter((c) => (!category || c.category?.slug === category) && (!wantTag || c.tags.includes(wantTag)));
}

export type Paged<T> = { items: T[]; page: number; pages: number; total: number };

/** One page of a list. A page that is not a whole number of at least 1 is page 1; a page past the end has no items. */
export function paginate<T>(list: T[], page: number, perPage: number = POSTS_PER_PAGE): Paged<T> {
  const p = Number.isInteger(page) && page >= 1 ? page : 1;
  const pages = Math.ceil(list.length / perPage);
  return { items: list.slice((p - 1) * perPage, p * perPage), page: p, pages, total: list.length };
}

export type BlogListing = {
  hero: PublicPostCard | null;
  posts: PublicPostCard[];
  page: number;
  pages: number;
  total: number;
  /** a category or tag was asked for and nothing matches it */
  unknown: boolean;
};

/**
 * What /blog shows (research R8). The hero is the newest featured post, only on unfiltered page 1; when no filter is active it is
 * left out of the grid on every page, so totals and page counts agree.
 */
export function listForPage({
  cards,
  category,
  tag,
  page,
}: {
  cards: PublicPostCard[];
  category?: string | null;
  tag?: string | null;
  page: number;
}): BlogListing {
  const filtered = Boolean(category || tag);
  const matching = filterCards(cards, { category, tag });
  const hero = filtered ? null : pickHero(cards);
  const source = hero ? matching.filter((c) => c.slug !== hero.slug) : matching;
  const paged = paginate(source, page);
  return { hero: paged.page === 1 ? hero : null, posts: paged.items, page: paged.page, pages: paged.pages, total: paged.total, unknown: filtered && matching.length === 0 };
}

/** The posts to feature on the home page: featured ones first, then the rest, each newest first. */
export function pickForHome<T extends { featured: boolean; publishedAt: string }>(cards: T[], n: number = 3): T[] {
  const newest = (a: T, b: T) => time(b.publishedAt) - time(a.publishedAt);
  const featured = cards.filter((c) => c.featured).sort(newest);
  const rest = cards.filter((c) => !c.featured).sort(newest);
  return [...featured, ...rest].slice(0, Math.max(0, n));
}

/** Up to `n` other posts: same category first (newest first), then the rest by most shared tags, then newest (FR-006). */
export function rankRelated<T extends { slug: string; category: BlogCategoryRef | null; tags: string[]; publishedAt: string }>(
  post: { slug: string; category: BlogCategoryRef | null; tags: string[] },
  cards: T[],
  n: number = 3,
): T[] {
  const mine = new Set(post.tags);
  const scored = cards
    .filter((c) => c.slug !== post.slug)
    .map((c) => ({ c, same: Boolean(post.category && c.category?.slug === post.category.slug), shared: c.tags.filter((t) => mine.has(t)).length }));
  scored.sort((a, b) => {
    if (a.same !== b.same) return a.same ? -1 : 1;
    if (!a.same && a.shared !== b.shared) return b.shared - a.shared;
    return time(b.c.publishedAt) - time(a.c.publishedAt);
  });
  return scored.slice(0, Math.max(0, n)).map((s) => s.c);
}

/** The title and description search engines and link previews use: the SEO fields, falling back to the title and excerpt. */
export function effectiveSeo(post: { title: string; excerpt: string; seo?: { metaTitle?: string | null; metaDescription?: string | null } | null }): {
  title: string;
  description: string;
} {
  return {
    title: post.seo?.metaTitle?.trim() || post.title,
    description: post.seo?.metaDescription?.trim() || post.excerpt,
  };
}

/** The address of the blog list with its filters; page 1 is left out. */
export function blogHref({ category, tag, page }: { category?: string | null; tag?: string | null; page?: number }): string {
  const sp = new URLSearchParams();
  if (category) sp.set("category", category);
  if (tag) sp.set("tag", tag);
  if (typeof page === "number" && page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

/** The page numbers to show: the first, the last and the ones next to the current page, with `null` standing for a gap. */
export function pageWindow(page: number, pages: number): (number | null)[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}
