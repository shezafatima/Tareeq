import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { connectDb } from "@/lib/db/mongoose";
import { AnnouncementModel } from "./model";
import { selectAnnouncement, type AnnouncementView, type StoredAnnouncement } from "./rules";

// The one place that reads the announcement (specs/034-pricing-certificate-announcement contracts/data-access.md §2).
// The stored document is cached with the "announcement" tag; saving refreshes it. Whether it is active is decided after the
// cached read, so an end time that has passed is honoured on the next render without waiting for the cache to expire.

const REFRESH_SECONDS = 3600;

type Doc = {
  enabled?: boolean;
  text?: string;
  linkLabel?: string;
  linkUrl?: string;
  style?: StoredAnnouncement["style"];
  startsAt?: Date;
  endsAt?: Date;
  dismissible?: boolean;
  updatedAt?: Date;
};

// Dates become ISO strings, because the cache stores JSON and selectAnnouncement accepts both.
function toStored(doc: Doc): StoredAnnouncement {
  return {
    enabled: doc.enabled === true,
    text: doc.text ?? "",
    linkLabel: doc.linkLabel ?? null,
    linkUrl: doc.linkUrl ?? null,
    style: doc.style ?? "saffron",
    startsAt: doc.startsAt ? doc.startsAt.toISOString() : null,
    endsAt: doc.endsAt ? doc.endsAt.toISOString() : null,
    dismissible: doc.dismissible !== false,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

/** The saved announcement, uncached (the admin page always shows what is stored). Null on a fresh database. Throws on a database error. */
export async function readStoredAnnouncement(): Promise<StoredAnnouncement | null> {
  await connectDb();
  const doc = await AnnouncementModel.findById("announcement").lean<Doc>();
  return doc ? toStored(doc) : null;
}

const readCached = unstable_cache(readStoredAnnouncement, ["announcement"], { tags: ["announcement"], revalidate: REFRESH_SECONDS });

/**
 * The bar to draw on public pages, or null. Never throws: if the database cannot be read there is simply no bar,
 * so a database problem never breaks a page.
 */
export const getAnnouncement = cache(async (): Promise<AnnouncementView | null> => {
  try {
    return selectAnnouncement(await readCached(), Date.now());
  } catch (err) {
    console.error(`[announcement] read failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return null;
  }
});
