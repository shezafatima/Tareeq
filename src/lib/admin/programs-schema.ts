// One rule set for a program, used by the edit form (instant feedback) and the Server Actions (source of truth).
// Limits mirror the stored model in src/lib/programs/model.ts. Pure: relative imports only, no server code.
import * as z from "zod/mini";
import { AUDIENCES, CTA_TYPES, SLUG_MAX, SLUG_PATTERN, STATUSES } from "../programs/options.ts";

export const LIMITS = {
  title: 120,
  summary: 240,
  description: 20000,
  outcome: 240,
  stepTitle: 120,
  stepDescription: 1000,
  fact: 120,
  priceText: 120,
  order: 9999,
} as const;

export const MESSAGES = {
  title: `Enter a title (up to ${LIMITS.title} characters).`,
  slug: "Use lowercase letters, numbers and single hyphens, for example teachers-workshop.",
  slugLength: `The address can be up to ${SLUG_MAX} characters.`,
  slugTaken: "Another program already uses this address. Choose a different one.",
  audience: "Choose who this program is for.",
  status: "Choose a status.",
  ctaType: "Choose what the button does.",
  summary: `Enter a short summary (up to ${LIMITS.summary} characters).`,
  description: `Keep the description under ${LIMITS.description} characters.`,
  outcome: `Each outcome needs text, up to ${LIMITS.outcome} characters.`,
  stepTitle: `Each step needs a title, up to ${LIMITS.stepTitle} characters.`,
  stepDescription: `Keep each step description under ${LIMITS.stepDescription} characters.`,
  fact: `Keep this under ${LIMITS.fact} characters.`,
  priceText: `Keep the price text under ${LIMITS.priceText} characters.`,
  cover: "Use a web address starting with https:// or a site path starting with /.",
  order: `Enter a whole number between -${LIMITS.order} and ${LIMITS.order}.`,
} as const;

const required = (max: number, message: string) =>
  z.string().check(z.trim(), z.minLength(1, message), z.maxLength(max, message));
const optional = (max: number, message: string) => z.string().check(z.trim(), z.maxLength(max, message));

/** Empty, https:// or a site-relative path (not protocol-relative), the same rule as the stored model. */
export const isAllowedCoverUrl = (v: string): boolean =>
  v === "" || v.startsWith("https://") || (v.startsWith("/") && !v.startsWith("//"));

export const programSchema = z.object({
  title: required(LIMITS.title, MESSAGES.title),
  slug: z.string().check(
    z.trim(),
    z.minLength(1, MESSAGES.slug),
    z.maxLength(SLUG_MAX, MESSAGES.slugLength),
    z.regex(SLUG_PATTERN, MESSAGES.slug),
  ),
  audience: z.enum(AUDIENCES, MESSAGES.audience),
  status: z.enum(STATUSES, MESSAGES.status),
  ctaType: z.enum(CTA_TYPES, MESSAGES.ctaType),
  summary: required(LIMITS.summary, MESSAGES.summary),
  description: z.string().check(z.maxLength(LIMITS.description, MESSAGES.description)),
  outcomes: z.array(required(LIMITS.outcome, MESSAGES.outcome)),
  curriculum: z.array(
    z.object({
      title: required(LIMITS.stepTitle, MESSAGES.stepTitle),
      description: optional(LIMITS.stepDescription, MESSAGES.stepDescription),
    }),
  ),
  facts: z.object({
    format: optional(LIMITS.fact, MESSAGES.fact),
    duration: optional(LIMITS.fact, MESSAGES.fact),
    groupSize: optional(LIMITS.fact, MESSAGES.fact),
    location: optional(LIMITS.fact, MESSAGES.fact),
  }),
  priceText: optional(LIMITS.priceText, MESSAGES.priceText),
  coverImageUrl: z.string().check(z.trim(), z.refine(isAllowedCoverUrl, MESSAGES.cover)),
  order: z.number().check(z.int(MESSAGES.order), z.gte(-LIMITS.order, MESSAGES.order), z.lte(LIMITS.order, MESSAGES.order)),
  published: z.boolean(),
});

export type ProgramInput = z.output<typeof programSchema>;

/** The form's values as typed: every text field a string, `order` as the text in the box. */
export type ProgramFormValues = Omit<ProgramInput, "order"> & { order: string };

export type FieldErrors = Record<string, string>;

/** Blank outcome and curriculum rows are dropped before checking, so an unused "add" row is never an error. */
export function dropEmptyRows(raw: ProgramFormValues): ProgramFormValues {
  return {
    ...raw,
    outcomes: raw.outcomes.filter((o) => o.trim() !== ""),
    curriculum: raw.curriculum.filter((s) => s.title.trim() !== "" || s.description.trim() !== ""),
  };
}

/** A web address for the title: lowercase words joined by single hyphens, accents removed, at most 80 characters. */
export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export function toFieldErrors(error: z.core.$ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export type ParseResult = { success: true; data: ProgramInput } | { success: false; errors: FieldErrors };

/** Checks form values (after dropping blank rows). `order` text becomes a number; empty or non-numeric text fails. */
export function parseProgram(raw: ProgramFormValues): ParseResult {
  const cleaned = dropEmptyRows(raw);
  const orderText = typeof cleaned.order === "string" ? cleaned.order.trim() : "";
  const result = z.safeParse(programSchema, { ...cleaned, order: orderText === "" ? NaN : Number(orderText) });
  return result.success ? { success: true, data: result.data } : { success: false, errors: toFieldErrors(result.error) };
}
