import "server-only";
import type { Types } from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { GalleryAlbumModel, GalleryPhotoModel } from "@/lib/gallery/model";
import { compareAlbums, comparePhotos, hasAlt, resolveCover, toPublicPhoto, type PublicPhoto } from "@/lib/gallery/view";
import type { StoredImage } from "@/lib/images/shared";
import { isObjectId } from "./leads-params";

// Admin reads of the gallery (specs/032-admin-gallery contracts/data-access.md). Deliberately NOT cached, so the owner always
// sees what is stored, published or not, the moment it is saved.

export type AdminAlbumCard = {
  id: string;
  slug: string;
  title: string;
  dateText: string;
  published: boolean;
  photoCount: number;
  cover: PublicPhoto | null;
};

export type AdminPhoto = {
  id: string;
  image: StoredImage;
  caption?: string;
  order: number;
  published: boolean;
  missingAlt: boolean;
  isCover: boolean;
};

export type AdminAlbum = AdminAlbumCard & { description?: string; order: number; coverPhotoId: string | null; photos: AdminPhoto[] };

type StoredAlbum = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  dateText: string;
  description?: string;
  coverPhoto?: { toString(): string } | null;
  order: number;
  published: boolean;
  createdAt: Date;
};

type StoredPhoto = {
  _id: Types.ObjectId;
  album: Types.ObjectId;
  image: StoredImage;
  caption?: string;
  order: number;
  published: boolean;
  createdAt: Date;
};

/** Every album, live or not, newest first, with its photo count and cover. Throws when the database cannot be read. */
export async function listAllAlbums(): Promise<AdminAlbumCard[]> {
  await connectDb();
  const albums = (await GalleryAlbumModel.find().lean<StoredAlbum[]>()).sort(compareAlbums);
  if (albums.length === 0) return [];
  const photos = await GalleryPhotoModel.find({ album: { $in: albums.map((a) => a._id) } })
    .select("album image order published createdAt caption")
    .lean<StoredPhoto[]>();
  const byAlbum = new Map<string, StoredPhoto[]>();
  for (const p of photos) {
    const key = p.album.toString();
    byAlbum.set(key, [...(byAlbum.get(key) ?? []), p]);
  }
  return albums.map((a) => {
    const own = (byAlbum.get(a._id.toString()) ?? []).sort(comparePhotos).map((p) => ({ id: p._id.toString(), doc: p }));
    const cover = resolveCover(a.coverPhoto?.toString() ?? null, own);
    return {
      id: a._id.toString(),
      slug: a.slug,
      title: a.title,
      dateText: a.dateText,
      published: a.published === true,
      photoCount: own.length,
      cover: cover ? toPublicPhoto(cover.doc) : null,
    };
  });
}

/** One album with all its photos, by its opaque id, or null for an unknown or malformed id. */
export async function getAdminAlbum(id: string): Promise<AdminAlbum | null> {
  if (!isObjectId(id)) return null;
  await connectDb();
  const album = await GalleryAlbumModel.findById(id).lean<StoredAlbum>();
  if (!album) return null;
  const docs = (await GalleryPhotoModel.find({ album: album._id }).lean<StoredPhoto[]>()).sort(comparePhotos);
  const items = docs.map((p) => ({ id: p._id.toString(), doc: p }));
  const cover = resolveCover(album.coverPhoto?.toString() ?? null, items);
  return {
    id: album._id.toString(),
    slug: album.slug,
    title: album.title,
    dateText: album.dateText,
    published: album.published === true,
    photoCount: docs.length,
    cover: cover ? toPublicPhoto(cover.doc) : null,
    ...(album.description ? { description: album.description } : {}),
    order: album.order,
    coverPhotoId: album.coverPhoto?.toString() ?? null,
    photos: docs.map((p) => ({
      id: p._id.toString(),
      image: { url: p.image.url, publicId: p.image.publicId, width: p.image.width, height: p.image.height, alt: p.image.alt ?? "" },
      ...(p.caption ? { caption: p.caption } : {}),
      order: p.order,
      published: p.published === true,
      missingAlt: !hasAlt(p.image.alt),
      isCover: cover?.id === p._id.toString(),
    })),
  };
}

/** The order for a new photo: one more than the highest in the album, or 1 when it has none. */
export async function nextPhotoOrder(albumId: string): Promise<number> {
  await connectDb();
  const top = await GalleryPhotoModel.findOne({ album: albumId }).sort({ order: -1 }).select("order").lean<{ order: number }>();
  return top ? Math.min(9999, top.order + 1) : 1;
}

/** Slugs already used that could clash with `base` (the same, or base-2, base-3 ...). */
export async function albumSlugsLike(base: string): Promise<string[]> {
  await connectDb();
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const docs = await GalleryAlbumModel.find({ slug: { $regex: `^${escaped}(-\\d+)?$` } }).select("slug").lean<{ slug: string }[]>();
  return docs.map((d) => d.slug);
}
