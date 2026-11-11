"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { UPLOAD_SCOPES, isConfigured, signUploadParams, type UploadScope, type UploadSignature } from "@/lib/cloudinary/server";
import { connectDb } from "@/lib/db/mongoose";
import { SLOT_KEYS } from "@/lib/images/slots";
import { readStoredSiteImages } from "@/lib/site-images/data";
import { SiteImagesModel } from "@/lib/site-images/model";
import { deleteReplaced, imageFailure, resolveImageChange, type ImageChange } from "./images-verify";
import { parseSiteImages, type SiteImagesFormValues } from "./images-schema";
import { logAdmin } from "./log";
import type { ActionResult } from "./result";
import { withAdmin } from "./session";

// Image uploads (specs/030-image-upload contracts/server-actions.md). Public POST endpoints, so each is wrapped by withAdmin:
// with no session nothing is signed and Cloudinary is never called. The API secret is never returned.

export const signUpload = withAdmin(async (input: { scope: UploadScope }): Promise<ActionResult<{ upload: UploadSignature }>> => {
  const scope = input?.scope;
  if (!UPLOAD_SCOPES.includes(scope)) return { ok: false, code: "invalid" };
  if (!isConfigured()) return { ok: false, code: "not_configured" };
  const upload = signUploadParams(scope);
  if (!upload) return { ok: false, code: "not_configured" };
  return { ok: true, upload };
});

/**
 * Saves the site images (specs/030-image-upload contracts/server-actions.md). A public POST endpoint, so it is wrapped by
 * withAdmin and re-validates; new images are verified at Cloudinary, replaced files are deleted after the write, and the
 * public site is refreshed only once the write succeeded.
 */
export const saveSiteImages = withAdmin(async (values: SiteImagesFormValues): Promise<ActionResult<{ values: SiteImagesFormValues }>> => {
  const parsed = parseSiteImages(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  try {
    await connectDb();
    const current = await readStoredSiteImages();
    const changes = {} as Record<string, ImageChange>;
    try {
      for (const key of SLOT_KEYS) changes[key] = await resolveImageChange(current[key], parsed.data[key]);
    } catch (err) {
      return imageFailure(err);
    }
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};
    const saved = {} as SiteImagesFormValues;
    for (const key of SLOT_KEYS) {
      const image = changes[key].image;
      saved[key] = image;
      if (image) $set[key] = image;
      else $unset[key] = 1;
    }
    await SiteImagesModel.updateOne(
      { _id: "images" },
      { ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}) },
      { upsert: true, runValidators: true },
    );
    for (const key of SLOT_KEYS) await deleteReplaced(changes[key]);
    revalidateTag("site-images", { expire: 0 });
    revalidatePath("/admin/settings/images");
    logAdmin("settings", "ok", "images");
    return { ok: true, values: saved };
  } catch (err) {
    console.error(`[admin] site images action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return { ok: false, code: "unavailable" };
  }
});
