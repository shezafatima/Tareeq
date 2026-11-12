import "server-only";
import type { Types } from "mongoose";
import { unstable_cache } from "next/cache";
import { connectDb } from "@/lib/db/mongoose";
import { SLUG_MAX, SLUG_PATTERN } from "@/lib/programs/options";
import { GalleryAlbumModel, GalleryPhotoModel } from "./model";
import {
  clampLimit,
  compareAlbums,
  comparePhotos,
  resolveCover,
  toPublicPhoto,
  type PublicAlbum,
  type PublicAlbumCard,
  type PublicPhoto,
} from "./view";

// The public reads of the gallery (specs/032-admin-gallery contracts/data-access.md). Cached and refreshed by the "gallery" tag.
// A failed read throws, so it is never cached. Visibility rule (FR-004): the photo is published and has alt text, and its album is
// published; an album with no visible photo is not listed and its address answers 404.

const REFRESH_SECONDS = 3600;
const TAGS = ["gallery"];
const VISIBLE_PHOTO = { published: true, "image.alt": { $nin: ["", null], $regex: /\S/ } } as const;

type StoredAlbum = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  dateText: string;
  description?: string;
  coverPhoto?: { toString(): string } | null;
  order: number;
  createdAt: Date;
};

type StoredPhoto = Parameters<typeof toPublicPhoto>[0] & { album: { toString(): string }; order: number; createdAt: Date };

/** Visible photos of the given albums, grouped by album id and sorted by order. */
async function visiblePhotosByAlbum(albumIds: Types.ObjectId[]): Promise<Map<string, { photo: PublicPhoto; doc: StoredPhoto }[]>> {
  const docs = (await GalleryPhotoModel.find({ album: { $in: albumIds }, ...VISIBLE_PHOTO }).lean<StoredPhoto[]>()).sort(comparePhotos);
  const out = new Map<string, { photo: PublicPhoto; doc: StoredPhoto }[]>();
  for (const doc of docs) {
    const key = doc.album.toString();
    out.set(key, [...(out.get(key) ?? []), { photo: toPublicPhoto(doc), doc }]);
  }
  return out;
}

function toCard(album: StoredAlbum, photos: PublicPhoto[]): PublicAlbumCard | null {
  const cover = resolveCover(album.coverPhoto?.toString() ?? null, photos);
  if (!cover) return null;
  return { slug: album.slug, title: album.title, dateText: album.dateText, photoCount: photos.length, cover };
}

const readAlbums = unstable_cache(
  async (): Promise<PublicAlbumCard[]> => {
    await connectDb();
    const albums = (await GalleryAlbumModel.find({ published: true }).lean<StoredAlbum[]>()).sort(compareAlbums);
    if (albums.length === 0) return [];
    const photos = await visiblePhotosByAlbum(albums.map((a) => a._id));
    return albums.flatMap((a) => {
      const card = toCard(a, (photos.get(a._id.toString()) ?? []).map((p) => p.photo));
      return card ? [card] : [];
    });
  },
  ["gallery:albums"],
  { tags: TAGS, revalidate: REFRESH_SECONDS },
);

/** Visible albums, newest first. Throws when the database cannot be read. */
export async function getPublishedAlbums(): Promise<PublicAlbumCard[]> {
  return readAlbums();
}

/** A visible album with its visible photos, or null if the address is unknown, unpublished, empty or malformed. */
export async function getAlbumBySlug(slug: string): Promise<PublicAlbum | null> {
  if (typeof slug !== "string" || slug.length > SLUG_MAX || !SLUG_PATTERN.test(slug)) return null;
  const read = unstable_cache(
    async (): Promise<PublicAlbum | null> => {
      await connectDb();
      const album = await GalleryAlbumModel.findOne({ slug, published: true }).lean<StoredAlbum>();
      if (!album) return null;
      const photos = (await visiblePhotosByAlbum([album._id])).get(album._id.toString())?.map((p) => p.photo) ?? [];
      const card = toCard(album, photos);
      if (!card) return null;
      return { ...card, ...(album.description ? { description: album.description } : {}), photos };
    },
    ["gallery:album", slug],
    { tags: TAGS, revalidate: REFRESH_SECONDS },
  );
  return read();
}

/** The newest visible photos across visible albums (workshop page strip). */
export async function getLatestPhotos(limit: number): Promise<PublicPhoto[]> {
  const n = clampLimit(limit);
  const read = unstable_cache(
    async (): Promise<PublicPhoto[]> => {
      await connectDb();
      const albums = await GalleryAlbumModel.find({ published: true }).select("_id").lean<{ _id: Types.ObjectId }[]>();
      if (albums.length === 0) return [];
      const docs = await GalleryPhotoModel.find({ album: { $in: albums.map((a) => a._id) }, ...VISIBLE_PHOTO })
        .sort({ createdAt: -1 })
        .limit(n)
        .lean<StoredPhoto[]>();
      return docs.map(toPublicPhoto);
    },
    ["gallery:latest", String(n)],
    { tags: TAGS, revalidate: REFRESH_SECONDS },
  );
  return read();
}

/** Addresses of visible albums, for static generation. Empty when the database cannot be read, so the build still succeeds. */
export async function getPublishedAlbumSlugs(): Promise<string[]> {
  try {
    return (await getPublishedAlbums()).map((a) => a.slug);
  } catch (err) {
    console.error(`[gallery] slug read failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return [];
  }
}

/** True when at least one album is visible: drives the Gallery link in the navigation. */
export async function hasPublicGallery(): Promise<boolean> {
  return (await getPublishedAlbums()).length > 0;
}

const logFailure = (where: string, err: unknown) =>
  console.error(`[gallery] ${where} failed: ${err instanceof Error ? err.name : "UnknownError"}`);

/**
 * Visible albums for /gallery; null means unavailable. In production a failed read is rethrown, so regeneration fails and the last
 * good page keeps being served. The build and dev have no good page to protect, so they get null (same rule as programs, R2).
 */
export async function loadPublishedAlbums(): Promise<PublicAlbumCard[] | null> {
  try {
    return await getPublishedAlbums();
  } catch (err) {
    logFailure("list read", err);
    const building = process.env.NEXT_PHASE === "phase-production-build";
    if (process.env.NODE_ENV === "production" && !building) throw err;
    return null;
  }
}

/** Never throws: false when the database cannot be read, so the navigation just hides the link (research R9). */
export async function hasPublicGallerySafe(): Promise<boolean> {
  try {
    return await hasPublicGallery();
  } catch (err) {
    logFailure("nav read", err);
    return false;
  }
}

/** Never throws: an empty list when the database cannot be read, so the workshop page just hides the strip. */
export async function getLatestPhotosSafe(limit: number): Promise<PublicPhoto[]> {
  try {
    return await getLatestPhotos(limit);
  } catch (err) {
    logFailure("latest read", err);
    return [];
  }
}
