import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { connectDb } from "@/lib/db/mongoose";
import { readFallback } from "./fallback";
import { mergeSettings, SOCIAL_KINDS, type EffectiveSettings, type StoredSettings } from "./merge";
import { SiteSettingsModel } from "./model";

// The one place that reads site settings (specs/028-site-settings contracts/data-access.md, research R3, R4).
// Cached with the "settings" tag; saving refreshes it, and every public page reads settings through the (site) layout.

const REFRESH_SECONDS = 3600;

type StoredDoc = StoredSettings & { _id: string };

function toStored(doc: StoredDoc): StoredSettings {
  const out: StoredSettings = {};
  for (const key of ["whatsappNumber", "email", "phone", "address", "notifyEmail"] as const) {
    if (doc[key]) out[key] = doc[key];
  }
  const links: StoredSettings["socialLinks"] = {};
  for (const kind of SOCIAL_KINDS) if (doc.socialLinks?.[kind]) links[kind] = doc.socialLinks[kind];
  if (Object.keys(links).length) out.socialLinks = links;
  return out;
}

/** The saved settings, uncached (the admin page always shows what is stored). Null on a fresh database. Throws on a database error. */
export async function readStoredSettings(): Promise<StoredSettings | null> {
  await connectDb();
  const doc = await SiteSettingsModel.findById("site").lean<StoredDoc>();
  return doc ? toStored(doc) : null;
}

const readCached = unstable_cache(readStoredSettings, ["settings"], { tags: ["settings"], revalidate: REFRESH_SECONDS });

/**
 * The settings the site uses: saved values over the fallbacks. Never throws: if the database cannot be read, the fallbacks
 * are used so pages and form submissions keep working (FR-004; the trade-off is in research R4).
 */
export const getSiteSettings = cache(async (): Promise<EffectiveSettings> => {
  const fallback = readFallback();
  try {
    return mergeSettings(await readCached(), fallback);
  } catch (err) {
    console.error(`[settings] read failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return mergeSettings(null, fallback);
  }
});
