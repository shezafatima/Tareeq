// Rules for gallery albums and photos, used by the forms (instant feedback) and the Server Actions (source of truth).
// Limits mirror the stored models in src/lib/gallery/model.ts. Pure: relative imports only, no server code.
// specs/032-admin-gallery research R18.
import * as z from "zod/mini";
import { IMAGE_LIMITS } from "../images/shared.ts";
import { toFieldErrors, type FieldErrors } from "./programs-schema.ts";

export { slugify } from "./programs-schema.ts";
export type { FieldErrors };

export const ALBUM_LIMITS = { title: 120, dateText: 40, description: 500, order: 9999 } as const;
export const PHOTO_LIMITS = { alt: IMAGE_LIMITS.maxAlt, caption: 300, order: 9999 } as const;

export const MESSAGES = {
  title: `Enter a title (up to ${ALBUM_LIMITS.title} characters).`,
  dateText: `Enter when it took place, for example November 2026 (up to ${ALBUM_LIMITS.dateText} characters).`,
  description: `Keep the description under ${ALBUM_LIMITS.description} characters.`,
  order: `Use a whole number from 0 to ${ALBUM_LIMITS.order}.`,
  alt: `Keep the alt text under ${PHOTO_LIMITS.alt} characters.`,
  caption: `Keep the caption under ${PHOTO_LIMITS.caption} characters.`,
  altRequired: "Add alt text before publishing this photo.",
  altLocked: "Add alt text before publishing.",
} as const;

const required = (max: number, message: string) =>
  z.string().check(z.trim(), z.minLength(1, message), z.maxLength(max, message));
const optional = (max: number, message: string) => z.string().check(z.trim(), z.maxLength(max, message));
const order = z.number().check(z.int(MESSAGES.order), z.gte(0, MESSAGES.order), z.lte(ALBUM_LIMITS.order, MESSAGES.order));

/** Order text from a form box becomes a number; empty or non-numeric text becomes NaN and fails. */
const orderValue = (raw: unknown): number => {
  const text = typeof raw === "string" ? raw.trim() : "";
  return text === "" ? NaN : Number(text);
};

const albumSchema = z.object({
  title: required(ALBUM_LIMITS.title, MESSAGES.title),
  dateText: required(ALBUM_LIMITS.dateText, MESSAGES.dateText),
  description: optional(ALBUM_LIMITS.description, MESSAGES.description),
  order,
  published: z.boolean(),
});

/** The album form's values as typed: `order` is the text in the box. */
export type AlbumFormValues = { title: string; dateText: string; description: string; order: string; published: boolean };
export type AlbumInput = { title: string; dateText: string; description?: string; order: number; published: boolean };
export type ParsedAlbum = { success: true; data: AlbumInput } | { success: false; errors: FieldErrors };

export function parseAlbum(raw: AlbumFormValues): ParsedAlbum {
  const result = z.safeParse(albumSchema, { ...raw, order: orderValue(raw?.order) });
  if (!result.success) return { success: false, errors: toFieldErrors(result.error) };
  const { description, ...rest } = result.data;
  return { success: true, data: { ...rest, ...(description ? { description } : {}) } };
}

const photoDetailsSchema = z.object({
  alt: optional(PHOTO_LIMITS.alt, MESSAGES.alt),
  caption: optional(PHOTO_LIMITS.caption, MESSAGES.caption),
  order,
});

/** The photo card's values as typed. Alt text may be blank (a blank alt just keeps the photo unpublished). */
export type PhotoDetailsValues = { alt: string; caption: string; order: string };
export type PhotoDetails = { alt: string; caption?: string; order: number };
export type ParsedPhotoDetails = { success: true; data: PhotoDetails } | { success: false; errors: FieldErrors };

export function parsePhotoDetails(raw: PhotoDetailsValues): ParsedPhotoDetails {
  const result = z.safeParse(photoDetailsSchema, { ...raw, order: orderValue(raw?.order) });
  if (!result.success) return { success: false, errors: toFieldErrors(result.error) };
  const { caption, ...rest } = result.data;
  return { success: true, data: { ...rest, ...(caption ? { caption } : {}) } };
}
