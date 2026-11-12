// One rule set for a blog post, used by the editor (instant feedback) and the Server Actions (source of truth). Limits mirror
// src/lib/blog/model.ts (specs/033-admin-blog data-model.md). Pure: relative imports only, no server code.
import * as z from "zod/mini";
import { IMAGE_LIMITS, IMAGE_MESSAGES, type StoredImage } from "../images/shared.ts";
import { SLUG_MAX, SLUG_PATTERN } from "../programs/options.ts";
import { slugify, toFieldErrors, type FieldErrors } from "./programs-schema.ts";

export { slugify };
export type { FieldErrors };

export const LIMITS = {
  title: 120,
  excerpt: 200,
  content: 100000,
  tags: 10,
  tag: 30,
  metaTitle: 70,
  metaDescription: 200,
  /** recommended lengths shown as soft warnings in the SEO panel */
  metaTitleAdvice: 60,
  metaDescriptionAdvice: 160,
} as const;

export const RESERVED_SLUGS = ["preview"] as const;

export const MESSAGES = {
  title: `Enter a title (up to ${LIMITS.title} characters).`,
  slug: "Use lowercase letters, numbers and single hyphens, for example teaching-kids-to-code.",
  slugLength: `The address can be up to ${SLUG_MAX} characters.`,
  slugReserved: "This address is reserved. Choose a different one.",
  slugTaken: "Another post already uses this address. Choose a different one.",
  excerpt: `Keep the excerpt to ${LIMITS.excerpt} characters or fewer.`,
  content: `Keep the post under ${LIMITS.content.toLocaleString("en-GB")} characters.`,
  category: "Choose a category.",
  tags: `Use up to ${LIMITS.tags} tags of up to ${LIMITS.tag} characters each.`,
  publishedAt: "Enter a date (not more than a year ahead).",
  metaTitle: `Keep the search title to ${LIMITS.metaTitle} characters or fewer.`,
  metaDescription: `Keep the search description to ${LIMITS.metaDescription} characters or fewer.`,
  status: "Choose draft or published.",
  cover: "Add a cover image.",
  coverAlt: IMAGE_MESSAGES.alt,
  // shown at each field when a publish is refused
  needTitle: "Add a title before publishing.",
  needSlug: "Add an address before publishing.",
  needExcerpt: "Add a short excerpt before publishing.",
  needCategory: "Choose a category before publishing.",
  needCover: "Add a cover image before publishing.",
  needCoverAlt: "Describe the cover image before publishing.",
  needContent: "Write the post before publishing.",
  categoryName: "Enter a name (up to 60 characters).",
} as const;

const OBJECT_ID = /^[a-f0-9]{24}$/;
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

export type BlogPostFormValues = {
  title: string;
  slug: string;
  /** true while the slug follows the title */
  slugAuto: boolean;
  excerpt: string;
  /** "" = none */
  categoryId: string;
  tags: string[];
  coverImage: StoredImage | null;
  featured: boolean;
  /** "YYYY-MM-DD" (Asia/Karachi day) or "" */
  publishedAt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  /** the status the owner is asking for (research R9) */
  status: "draft" | "published";
};

export const EMPTY_POST: BlogPostFormValues = {
  title: "",
  slug: "",
  slugAuto: true,
  excerpt: "",
  categoryId: "",
  tags: [],
  coverImage: null,
  featured: false,
  publishedAt: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
  status: "draft",
};

/** Trimmed, lower-cased, de-duplicated tags with the blanks dropped. Order is kept. */
export function normaliseTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const out: string[] = [];
  for (const t of tags) {
    const v = typeof t === "string" ? t.trim().toLowerCase() : "";
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

// ---- publish date: a day in Asia/Karachi (UTC+5, no daylight saving), stored at 09:00 there = 04:00Z (data-model.md)

/** The Asia/Karachi calendar day of an instant, as "YYYY-MM-DD". */
export const karachiDay = (d: Date): string => new Date(d.getTime() + 5 * 3600000).toISOString().slice(0, 10);

/** The instant a typed day is stored at: 09:00 in Karachi. */
export function dayToDate(day: string): Date {
  const m = DAY.exec(day);
  return new Date(Date.UTC(Number(m?.[1]), Number(m?.[2]) - 1, Number(m?.[3]), 4));
}

/** True for a real calendar day. */
export function isRealDay(day: string): boolean {
  const m = DAY.exec(day);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

const dayOk = (v: string): boolean => v === "" || (isRealDay(v) && dayToDate(v).getTime() <= Date.now() + 366 * 86400000);

const coverSchema = z.object({
  url: z.string().check(z.trim(), z.minLength(1, MESSAGES.cover), z.maxLength(1000, MESSAGES.cover)),
  publicId: z.string().check(z.trim(), z.minLength(1, MESSAGES.cover), z.maxLength(255, MESSAGES.cover)),
  width: z.number().check(z.int(MESSAGES.cover), z.positive(MESSAGES.cover)),
  height: z.number().check(z.int(MESSAGES.cover), z.positive(MESSAGES.cover)),
  // a draft may have a cover that is not described yet; publishing needs the description (publishIssues)
  alt: z.string().check(z.trim(), z.maxLength(IMAGE_LIMITS.maxAlt, MESSAGES.coverAlt)),
});

const slugField = z.string().check(
  z.trim(),
  z.minLength(1, MESSAGES.slug),
  z.maxLength(SLUG_MAX, MESSAGES.slugLength),
  z.regex(SLUG_PATTERN, MESSAGES.slug),
  z.refine((v) => !(RESERVED_SLUGS as readonly string[]).includes(v), MESSAGES.slugReserved),
);

export const blogPostSchema = z.object({
  title: z.string().check(z.trim(), z.minLength(1, MESSAGES.title), z.maxLength(LIMITS.title, MESSAGES.title)),
  slug: slugField,
  slugAuto: z.optional(z.boolean()),
  excerpt: z.string().check(z.trim(), z.maxLength(LIMITS.excerpt, MESSAGES.excerpt)),
  categoryId: z.string().check(z.refine((v) => v === "" || OBJECT_ID.test(v), MESSAGES.category)),
  tags: z.array(z.string().check(z.minLength(1, MESSAGES.tags), z.maxLength(LIMITS.tag, MESSAGES.tags))).check(z.maxLength(LIMITS.tags, MESSAGES.tags)),
  coverImage: z.nullable(coverSchema),
  featured: z.boolean(),
  publishedAt: z.string().check(z.trim(), z.refine(dayOk, MESSAGES.publishedAt)),
  content: z.string().check(z.maxLength(LIMITS.content, MESSAGES.content)),
  metaTitle: z.string().check(z.trim(), z.maxLength(LIMITS.metaTitle, MESSAGES.metaTitle)),
  metaDescription: z.string().check(z.trim(), z.maxLength(LIMITS.metaDescription, MESSAGES.metaDescription)),
  status: z.enum(["draft", "published"], MESSAGES.status),
});

export type BlogPostInput = z.output<typeof blogPostSchema>;
export type BlogParseResult = { success: true; data: BlogPostInput } | { success: false; errors: FieldErrors };

/** Checks the editor's values. Tags are normalised first. Never throws. */
export function parseBlogPost(raw: BlogPostFormValues): BlogParseResult {
  if (!raw || typeof raw !== "object") return { success: false, errors: { title: MESSAGES.title } };
  const result = z.safeParse(blogPostSchema, { ...raw, tags: normaliseTags(raw.tags), coverImage: raw.coverImage ?? null });
  return result.success ? { success: true, data: result.data } : { success: false, errors: toFieldErrors(result.error) };
}

/**
 * What stops a post from being published (FR-014): a message for each missing field, or {} when it can go live. Run on the
 * server for every publish; the editor uses it to point at the fields.
 */
export function publishIssues(v: BlogPostFormValues): FieldErrors {
  const out: FieldErrors = {};
  const text = (s: unknown) => (typeof s === "string" ? s.trim() : "");
  if (!text(v.title)) out.title = MESSAGES.needTitle;
  if (!text(v.slug)) out.slug = MESSAGES.needSlug;
  if (!text(v.excerpt)) out.excerpt = MESSAGES.needExcerpt;
  if (!OBJECT_ID.test(text(v.categoryId))) out.categoryId = MESSAGES.needCategory;
  if (!v.coverImage || !text(v.coverImage.url)) out.coverImage = MESSAGES.needCover;
  else if (!text(v.coverImage.alt)) out.coverImage = MESSAGES.needCoverAlt;
  if (!text(v.content)) out.content = MESSAGES.needContent;
  return out;
}
