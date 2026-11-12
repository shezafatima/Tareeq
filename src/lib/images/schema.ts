import { Schema } from "mongoose";
import { IMAGE_LIMITS } from "./shared";

// The stored image sub-document shared by programs, courses and site images (specs/030-image-upload data-model.md).
// A second guard: the domain rules are in imageSchema (shared.ts) and the server's verification.
/** `altRequired: false` is for gallery photos, which exist before the owner has described them (specs/032-admin-gallery research R3). */
export function imageSubSchema({ altRequired }: { altRequired: boolean }) {
  return new Schema(
    {
      url: { type: String, required: true, trim: true, maxlength: 1000, match: /^https:\/\/res\.cloudinary\.com\// },
      publicId: { type: String, required: true, trim: true, maxlength: 255 },
      width: { type: Number, required: true, min: 1 },
      height: { type: Number, required: true, min: 1 },
      alt: altRequired
        ? { type: String, required: true, trim: true, maxlength: IMAGE_LIMITS.maxAlt }
        : { type: String, default: "", trim: true, maxlength: IMAGE_LIMITS.maxAlt },
    },
    { _id: false },
  );
}

export const storedImageSchema = imageSubSchema({ altRequired: true });

/** A stored sub-document as a plain StoredImage, or undefined when it is missing or incomplete. */
export function pickImage(v: unknown): { url: string; publicId: string; width: number; height: number; alt: string } | undefined {
  const i = v as Record<string, unknown> | null | undefined;
  if (!i || typeof i.url !== "string" || !i.url || typeof i.publicId !== "string") return undefined;
  return { url: i.url, publicId: i.publicId, width: Number(i.width), height: Number(i.height), alt: typeof i.alt === "string" ? i.alt : "" };
}
