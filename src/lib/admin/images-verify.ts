import "server-only";
import { destroyAsset, ImageRejected, verifyAsset } from "@/lib/cloudinary/server";
import { IMAGE_MESSAGES, type StoredImage } from "@/lib/images/shared";
import type { Failure } from "./result";

// Decides what to store when an image field is saved, and which old asset to delete (specs/030-image-upload research R3, R9).

export type ImageChange = { image: StoredImage | null; toDelete: string | null };

/**
 * `prev` is what is stored now, `next` is what the form sent (null = no image).
 * - same publicId: keep the stored file, take the new alt text, no Cloudinary call
 * - new publicId: verify at Cloudinary; the server's url, width and height replace the client's
 * Throws ImageRejected for a bad asset, or another error when Cloudinary cannot be reached.
 */
export async function resolveImageChange(prev: StoredImage | null | undefined, next: StoredImage | null): Promise<ImageChange> {
  if (!next) return { image: null, toDelete: prev?.publicId ?? null };
  if (prev && prev.publicId === next.publicId) return { image: { ...prev, alt: next.alt }, toDelete: null };
  const verified = await verifyAsset(next.publicId);
  return { image: { ...verified, publicId: next.publicId, alt: next.alt }, toDelete: prev?.publicId ?? null };
}

export { ImageRejected };

/** The action result for a failed resolveImageChange: a bad image is the owner's to fix; anything else is an outage. */
export function imageFailure(err: unknown): Failure {
  if (err instanceof ImageRejected) return { ok: false, code: "image_rejected", message: IMAGE_MESSAGES.rejected };
  console.error(`[images] verify failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  return { ok: false, code: "unavailable" };
}

/** Run after the database write succeeded. Never throws. */
export async function deleteReplaced(change: ImageChange): Promise<void> {
  if (change.toDelete) await destroyAsset(change.toDelete);
}
