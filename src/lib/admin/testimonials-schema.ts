// One rule set for a testimonial, used by the edit form (instant feedback) and the Server Actions (source of truth).
// Limits mirror the stored model in src/lib/testimonials/model.ts. Pure: relative imports only, no server code.
// specs/031-admin-testimonials data-model.md "Validation".
import * as z from "zod/mini";
import { parseYouTubeId } from "../youtube.ts";

export const LIMITS = { url: 300, name: 80, role: 40, organization: 80, quote: 140, order: 9999 } as const;

export const QUOTE_MAX = LIMITS.quote;
export const ROLE_SUGGESTIONS = ["Teacher", "Student"] as const;

export const MESSAGES = {
  url: "Paste a YouTube Shorts, watch or youtu.be link.",
  name: `Enter the person's name (up to ${LIMITS.name} characters).`,
  role: `Enter a role such as Teacher or Student (up to ${LIMITS.role} characters).`,
  organization: `Keep the organization under ${LIMITS.organization} characters.`,
  quote: `Write one line of up to ${LIMITS.quote} characters.`,
  order: `Enter a whole number between -${LIMITS.order} and ${LIMITS.order}.`,
  consentRequired: "Tick consent before publishing.",
} as const;

const required = (max: number, message: string) =>
  z.string().check(z.trim(), z.minLength(1, message), z.maxLength(max, message));

export const testimonialSchema = z.object({
  youtubeUrl: z.string().check(
    z.trim(),
    z.minLength(1, MESSAGES.url),
    z.maxLength(LIMITS.url, MESSAGES.url),
    z.refine((v) => parseYouTubeId(v) !== null, MESSAGES.url),
  ),
  name: required(LIMITS.name, MESSAGES.name),
  role: required(LIMITS.role, MESSAGES.role),
  organization: z.string().check(z.trim(), z.maxLength(LIMITS.organization, MESSAGES.organization)),
  quote: z.string().check(
    z.trim(),
    z.minLength(1, MESSAGES.quote),
    z.maxLength(QUOTE_MAX, MESSAGES.quote),
    z.refine((v) => !/[\r\n]/.test(v), MESSAGES.quote),
  ),
  consent: z.boolean(),
  published: z.boolean(),
  order: z.number().check(z.int(MESSAGES.order), z.gte(-LIMITS.order, MESSAGES.order), z.lte(LIMITS.order, MESSAGES.order)),
});

export type TestimonialInput = z.output<typeof testimonialSchema>;

/** The form's values as typed: every text field a string, `order` as the text in the box. */
export type TestimonialFormValues = Omit<TestimonialInput, "order"> & { order: string };

export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.core.$ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export type ParseResult =
  | { success: true; data: TestimonialInput & { youtubeId: string } }
  | { success: false; errors: FieldErrors };

/**
 * Checks form values. `order` text becomes a number; empty or non-numeric text fails. The video id is taken from the link here,
 * never from the client. Publishing without consent is refused (research R5.1).
 */
export function parseTestimonial(raw: TestimonialFormValues): ParseResult {
  const orderText = typeof raw?.order === "string" ? raw.order.trim() : "";
  const result = z.safeParse(testimonialSchema, { ...raw, order: orderText === "" ? NaN : Number(orderText) });
  const errors: FieldErrors = result.success ? {} : toFieldErrors(result.error);
  if (raw?.published === true && raw?.consent !== true) errors.published = MESSAGES.consentRequired;
  if (!result.success || Object.keys(errors).length) return { success: false, errors };
  const youtubeId = parseYouTubeId(result.data.youtubeUrl);
  if (!youtubeId) return { success: false, errors: { youtubeUrl: MESSAGES.url } };
  return { success: true, data: { ...result.data, youtubeId } };
}
