import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { connectDb } from "@/lib/db/mongoose";
import { pickImage } from "@/lib/images/schema";
import { SLOT_KEYS } from "@/lib/images/slots";
import { mergeSiteImages, type EffectiveSiteImages, type StoredSiteImages } from "./merge";
import { SiteImagesModel } from "./model";

// The one place that reads site images (specs/030-image-upload research R7). Cached with the "site-images" tag; saving refreshes it.

const REFRESH_SECONDS = 3600;

/** The saved images, uncached (the admin page always shows what is stored). Empty on a fresh database. Throws on a database error. */
export async function readStoredSiteImages(): Promise<StoredSiteImages> {
  await connectDb();
  const doc = await SiteImagesModel.findById("images").lean<Record<string, unknown>>();
  const out: StoredSiteImages = {};
  if (!doc) return out;
  for (const key of SLOT_KEYS) {
    const image = pickImage(doc[key]);
    if (image) out[key] = image;
  }
  return out;
}

const readCached = unstable_cache(readStoredSiteImages, ["site-images"], { tags: ["site-images"], revalidate: REFRESH_SECONDS });

/** The images the site uses: saved images over each slot's default file. Never throws: a database error falls back to the defaults. */
export const getSiteImages = cache(async (): Promise<EffectiveSiteImages> => {
  try {
    return mergeSiteImages(await readCached());
  } catch (err) {
    console.error(`[site-images] read failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return mergeSiteImages(null);
  }
});
