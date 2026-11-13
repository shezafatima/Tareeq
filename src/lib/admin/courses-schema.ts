// One rule set for a course and a course category, used by the admin forms (instant feedback) and the Server Actions
// (source of truth). Limits mirror src/lib/courses/model.ts. Pure: relative imports only, no server code.
import * as z from "zod/mini";
import { ENROLLMENT_STATUSES, FORMATS, LEVELS, SLUG_MAX, SLUG_PATTERN } from "../courses/options.ts";
import { imageSchema } from "../images/shared.ts";
import { EMPTY_PRICING, parsePricing, type Pricing, type PricingFormValues } from "../pricing/rules.ts";
import { isAllowedCoverUrl } from "./programs-schema.ts";

export { slugify } from "./programs-schema.ts";

export const LIMITS = {
  title: 120,
  summary: 240,
  description: 20000,
  outcome: 240,
  itemTitle: 120,
  itemDescription: 1000,
  shortText: 120,
  priceText: 120,
  order: 9999,
  categoryName: 80,
  categoryDescription: 500,
} as const;

export const MESSAGES = {
  title: `Enter a title (up to ${LIMITS.title} characters).`,
  slug: "Use lowercase letters, numbers and single hyphens, for example intro-to-ai.",
  slugLength: `The address can be up to ${SLUG_MAX} characters.`,
  slugTaken: "Another course already uses this address. Choose a different one.",
  categorySlugTaken: "Another category already uses this address. Choose a different one.",
  category: "Choose a category.",
  level: "Choose a level.",
  format: "Choose a format.",
  enrollmentStatus: "Choose an enrolment status.",
  summary: `Enter a short summary (up to ${LIMITS.summary} characters).`,
  description: `Keep the description under ${LIMITS.description} characters.`,
  outcome: `Each outcome needs text, up to ${LIMITS.outcome} characters.`,
  itemTitle: `Each syllabus item needs a title, up to ${LIMITS.itemTitle} characters.`,
  itemDescription: `Keep each syllabus description under ${LIMITS.itemDescription} characters.`,
  shortText: `Keep this under ${LIMITS.shortText} characters.`,
  priceText: `Keep the price text under ${LIMITS.priceText} characters.`,
  cover: "Use a web address starting with https:// or a site path starting with /.",
  order: `Enter a whole number between -${LIMITS.order} and ${LIMITS.order}.`,
  categoryName: `Enter a name (up to ${LIMITS.categoryName} characters).`,
  categoryDescription: `Keep the description under ${LIMITS.categoryDescription} characters.`,
} as const;

const OBJECT_ID = /^[a-f0-9]{24}$/;

const required = (max: number, message: string) =>
  z.string().check(z.trim(), z.minLength(1, message), z.maxLength(max, message));
const optional = (max: number, message: string) => z.string().check(z.trim(), z.maxLength(max, message));
const slugField = z.string().check(
  z.trim(),
  z.minLength(1, MESSAGES.slug),
  z.maxLength(SLUG_MAX, MESSAGES.slugLength),
  z.regex(SLUG_PATTERN, MESSAGES.slug),
);
const orderField = z
  .number(MESSAGES.order)
  .check(z.int(MESSAGES.order), z.gte(-LIMITS.order, MESSAGES.order), z.lte(LIMITS.order, MESSAGES.order));

export const courseSchema = z.object({
  title: required(LIMITS.title, MESSAGES.title),
  slug: slugField,
  slugAuto: z.optional(z.boolean()),
  category: z.string().check(z.regex(OBJECT_ID, MESSAGES.category)),
  level: z.enum(LEVELS, MESSAGES.level),
  format: z.enum(FORMATS, MESSAGES.format),
  enrollmentStatus: z.enum(ENROLLMENT_STATUSES, MESSAGES.enrollmentStatus),
  summary: required(LIMITS.summary, MESSAGES.summary),
  description: z.string().check(z.maxLength(LIMITS.description, MESSAGES.description)),
  outcomes: z.array(required(LIMITS.outcome, MESSAGES.outcome)),
  syllabus: z.array(
    z.object({
      title: required(LIMITS.itemTitle, MESSAGES.itemTitle),
      description: optional(LIMITS.itemDescription, MESSAGES.itemDescription),
    }),
  ),
  durationText: optional(LIMITS.shortText, MESSAGES.shortText),
  startDateText: optional(LIMITS.shortText, MESSAGES.shortText),
  priceText: optional(LIMITS.priceText, MESSAGES.priceText),
  /** the older plain URL: kept only so an old record still shows its image; the form can clear it, never type one */
  coverImageUrl: z.string().check(z.trim(), z.refine(isAllowedCoverUrl, MESSAGES.cover)),
  /** the uploaded cover (specs/030-image-upload); null = none */
  coverImage: z.optional(z.nullable(imageSchema)),
  featured: z.boolean(),
  order: orderField,
  published: z.boolean(),
});

/** `pricing` is checked by parsePricing (specs/034); null = "Not set", so the stored pricing is removed and the price text shows. */
export type CourseInput = z.output<typeof courseSchema> & { pricing: Pricing | null };

/** The course form's values as typed: `order` is the text in the box; `slugAuto` is true while the slug follows the title. */
export type CourseFormValues = Omit<CourseInput, "order" | "slugAuto" | "pricing"> & {
  order: string;
  slugAuto?: boolean;
  pricing: PricingFormValues;
};

export const categorySchema = z.object({
  name: required(LIMITS.categoryName, MESSAGES.categoryName),
  slug: slugField,
  slugAuto: z.optional(z.boolean()),
  description: optional(LIMITS.categoryDescription, MESSAGES.categoryDescription),
  order: orderField,
});

export type CategoryInput = z.output<typeof categorySchema>;
export type CategoryFormValues = Omit<CategoryInput, "order" | "slugAuto"> & { order: string; slugAuto?: boolean };

export type FieldErrors = Record<string, string>;

function toFieldErrors(error: z.core.$ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

const orderNumber = (text: unknown) => {
  const t = typeof text === "string" ? text.trim() : "";
  return t === "" ? NaN : Number(t);
};

/** Blank outcome and syllabus rows are dropped before checking, so an unused "add" row is never an error. */
export function dropEmptyRows(raw: CourseFormValues): CourseFormValues {
  return {
    ...raw,
    outcomes: (raw.outcomes ?? []).filter((o) => typeof o === "string" && o.trim() !== ""),
    syllabus: (raw.syllabus ?? []).filter((s) => (s.title ?? "").trim() !== "" || (s.description ?? "").trim() !== ""),
  };
}

export type CourseParseResult = { success: true; data: CourseInput } | { success: false; errors: FieldErrors };
export type CategoryParseResult = { success: true; data: CategoryInput } | { success: false; errors: FieldErrors };

/** Checks course form values. `order` text becomes a number; empty or non-numeric text fails. Never throws. */
export function parseCourse(raw: CourseFormValues): CourseParseResult {
  if (!raw || typeof raw !== "object") return { success: false, errors: { title: MESSAGES.title } };
  const cleaned = dropEmptyRows(raw);
  const { pricing: pricingValues, ...fields } = cleaned;
  const result = z.safeParse(courseSchema, { ...fields, order: orderNumber(cleaned.order) });
  const pricing = parsePricing(pricingValues ?? EMPTY_PRICING);
  const errors = {
    ...(result.success ? {} : toFieldErrors(result.error)),
    ...(pricing.success ? {} : pricing.errors),
  };
  if (!result.success || !pricing.success || Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { ...result.data, pricing: pricing.data } };
}

/** Checks category form values. Never throws. */
export function parseCategory(raw: CategoryFormValues): CategoryParseResult {
  if (!raw || typeof raw !== "object") return { success: false, errors: { name: MESSAGES.categoryName } };
  const result = z.safeParse(categorySchema, { ...raw, order: orderNumber(raw.order) });
  return result.success ? { success: true, data: result.data } : { success: false, errors: toFieldErrors(result.error) };
}
