import { Schema } from "mongoose";
import { IMAGE_LIMITS } from "./shared";

// The stored image sub-document shared by programs, courses and site images (specs/030-image-upload data-model.md).
// A second guard: the domain rules are in imageSchema (shared.ts) and the server's verification.
export const storedImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 1000, match: /^https:\/\/res\.cloudinary\.com\// },
    publicId: { type: String, required: true, trim: true, maxlength: 255 },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    alt: { type: String, required: true, trim: true, maxlength: IMAGE_LIMITS.maxAlt },
  },
  { _id: false },
);

/** A stored sub-document as a plain StoredImage, or undefined when it is missing or incomplete. */
export function pickImage(v: unknown): { url: string; publicId: string; width: number; height: number; alt: string } | undefined {
  const i = v as Record<string, unknown> | null | undefined;
  if (!i || typeof i.url !== "string" || !i.url || typeof i.publicId !== "string") return undefined;
  return { url: i.url, publicId: i.publicId, width: Number(i.width), height: Number(i.height), alt: typeof i.alt === "string" ? i.alt : "" };
}
