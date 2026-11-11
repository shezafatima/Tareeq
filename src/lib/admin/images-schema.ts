// The rules for saving the site images, used by the form (instant feedback) and the Server Action (source of truth).
// Pure: relative imports only, no server code.
import * as z from "zod/mini";
import { imageSchema, type StoredImage } from "../images/shared.ts";
import { SLOT_KEYS, type SlotKey } from "../images/slots.ts";
import { toFieldErrors, type FieldErrors } from "./programs-schema.ts";

export type SiteImagesFormValues = Record<SlotKey, StoredImage | null>;

const shape = Object.fromEntries(SLOT_KEYS.map((key) => [key, z.nullable(imageSchema)])) as Record<SlotKey, z.ZodMiniNullable<typeof imageSchema>>;
const siteImagesSchema = z.object(shape);

export type ParsedSiteImages = { success: true; data: SiteImagesFormValues } | { success: false; errors: FieldErrors };

export function parseSiteImages(raw: unknown): ParsedSiteImages {
  const result = z.safeParse(siteImagesSchema, raw);
  return result.success ? { success: true, data: result.data as SiteImagesFormValues } : { success: false, errors: toFieldErrors(result.error) };
}
