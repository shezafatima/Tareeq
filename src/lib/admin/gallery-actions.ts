"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { destroyAsset, isConfigured, verifyAsset } from "@/lib/cloudinary/server";
import { connectDb } from "@/lib/db/mongoose";
import { GalleryAlbumModel, GalleryPhotoModel } from "@/lib/gallery/model";
import { IMAGE_LIMITS } from "@/lib/images/shared";
import { albumSlugsLike, nextPhotoOrder } from "./gallery-read";
import {
  MESSAGES,
  parseAlbum,
  parsePhotoDetails,
  slugify,
  type AlbumFormValues,
  type PhotoDetailsValues,
} from "./gallery-schema";
import { imageFailure } from "./images-verify";
import { isObjectId } from "./leads-params";
import { logAdmin } from "./log";
import type { ActionResult, Failure } from "./result";
import { withAdmin } from "./session";
import { nextFreeSlug } from "./slug";

// Gallery edits (specs/032-admin-gallery contracts/data-access.md). Each action is a public POST endpoint, so each is wrapped by
// withAdmin, re-validates with the same rules as the forms, and refreshes the public site only after the write succeeded.
// A photo can never be published without alt text (research R5). Logs carry ids and error names only.

const GALLERY_FOLDER = `${IMAGE_LIMITS.folderRoot}/gallery/`;

const unavailable = (err: unknown): Failure => {
  console.error(`[admin] gallery action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  return { ok: false, code: "unavailable" };
};

/** Makes the public gallery (cards, album pages, workshop strip, navigation) and the admin pages show the change at once. */
function refresh(albumId?: string): void {
  revalidateTag("gallery", { expire: 0 });
  revalidatePath("/admin/gallery");
  if (albumId) revalidatePath(`/admin/gallery/${albumId}`);
}

const isDuplicateKey = (err: unknown): boolean => (err as { code?: number } | null)?.code === 11000;

export const createGalleryAlbum = withAdmin(async (values: AlbumFormValues): Promise<ActionResult<{ id: string }>> => {
  const parsed = parseAlbum(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  try {
    await connectDb();
    const base = slugify(parsed.data.title) || "album";
    // a clash between two saves at the same moment is rare; try once more with a fresh list
    for (let attempt = 0; attempt < 2; attempt++) {
      const slug = nextFreeSlug(base, await albumSlugsLike(base));
      try {
        const created = await GalleryAlbumModel.create({ ...parsed.data, slug });
        refresh();
        logAdmin("gallery", "ok", created.id);
        return { ok: true, id: created.id };
      } catch (err) {
        if (!isDuplicateKey(err) || attempt === 1) throw err;
      }
    }
    return { ok: false, code: "unavailable" };
  } catch (err) {
    return unavailable(err);
  }
});

export const updateGalleryAlbum = withAdmin(async (input: { id: string; values: AlbumFormValues }): Promise<ActionResult> => {
  const { id, values } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  const parsed = parseAlbum(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  try {
    await connectDb();
    const { description, ...rest } = parsed.data;
    // the address (slug) is never changed, so shared links keep working
    const result = await GalleryAlbumModel.updateOne(
      { _id: id },
      { $set: { ...rest, ...(description ? { description } : {}) }, ...(description ? {} : { $unset: { description: 1 } }) },
      { runValidators: true },
    );
    if (result.matchedCount === 0) return { ok: false, code: "not_found" };
    refresh(id);
    logAdmin("gallery", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

export const setGalleryAlbumPublished = withAdmin(async (input: { id: string; published: boolean }): Promise<ActionResult> => {
  const { id, published } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id) || typeof published !== "boolean") return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const result = await GalleryAlbumModel.updateOne({ _id: id }, { $set: { published } });
    if (result.matchedCount === 0) return { ok: false, code: "not_found" };
    refresh(id);
    logAdmin("gallery", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

/** Deletes the album and its photos, then their image files. Records go first so the site never points at a missing file (R15). */
export const deleteGalleryAlbum = withAdmin(async (input: { id: string }): Promise<ActionResult<{ deletedPhotos: number }>> => {
  const { id } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const photos = await GalleryPhotoModel.find({ album: id }).select("image.publicId").lean<{ image: { publicId: string } }[]>();
    const album = await GalleryAlbumModel.findByIdAndDelete(id, { projection: { _id: 1 } }).lean();
    if (!album) return { ok: false, code: "not_found" };
    await GalleryPhotoModel.deleteMany({ album: id });
    refresh();
    logAdmin("gallery", "ok", id);
    // best effort: destroyAsset logs and never throws, so a failure cannot undo the delete
    const ids = photos.map((p) => p.image.publicId);
    for (let i = 0; i < ids.length; i += 5) await Promise.allSettled(ids.slice(i, i + 5).map((p) => destroyAsset(p)));
    return { ok: true, deletedPhotos: photos.length };
  } catch (err) {
    return unavailable(err);
  }
});

/** Records an uploaded file as a new, unpublished photo. The file is checked at Cloudinary here; the client's numbers are not trusted. */
export const addGalleryPhoto = withAdmin(async (input: { albumId: string; publicId: string }): Promise<ActionResult<{ id: string }>> => {
  const { albumId, publicId } = input ?? {};
  if (typeof albumId !== "string" || !isObjectId(albumId)) return { ok: false, code: "invalid" };
  if (typeof publicId !== "string" || !publicId.startsWith(GALLERY_FOLDER) || publicId.includes("..")) return { ok: false, code: "invalid" };
  if (!isConfigured()) return { ok: false, code: "not_configured" };
  try {
    await connectDb();
    if (!(await GalleryAlbumModel.exists({ _id: albumId }))) {
      await destroyAsset(publicId);
      return { ok: false, code: "not_found" };
    }
    let verified;
    try {
      verified = await verifyAsset(publicId);
    } catch (err) {
      return imageFailure(err);
    }
    try {
      const created = await GalleryPhotoModel.create({
        album: albumId,
        image: { ...verified, publicId, alt: "" },
        order: await nextPhotoOrder(albumId),
        published: false,
      });
      refresh(albumId);
      logAdmin("gallery", "ok", created.id);
      return { ok: true, id: created.id };
    } catch (err) {
      await destroyAsset(publicId); // the record failed, so do not leave an orphaned file
      throw err;
    }
  } catch (err) {
    return unavailable(err);
  }
});

export const updateGalleryPhoto = withAdmin(
  async (input: { id: string; values: PhotoDetailsValues }): Promise<ActionResult<{ published: boolean }>> => {
    const { id, values } = input ?? {};
    if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
    const parsed = parsePhotoDetails(values);
    if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
    try {
      await connectDb();
      const { alt, caption, order } = parsed.data;
      // clearing the alt text of a published photo unpublishes it (R5.3)
      const updated = await GalleryPhotoModel.findOneAndUpdate(
        { _id: id },
        {
          $set: { "image.alt": alt, order, ...(caption ? { caption } : {}), ...(alt === "" ? { published: false } : {}) },
          ...(caption ? {} : { $unset: { caption: 1 } }),
        },
        { returnDocument: "after", runValidators: true, projection: { album: 1, published: 1 } },
      ).lean<{ album: { toString(): string }; published: boolean }>();
      if (!updated) return { ok: false, code: "not_found" };
      refresh(updated.album.toString());
      logAdmin("gallery", "ok", id);
      return { ok: true, published: updated.published === true };
    } catch (err) {
      return unavailable(err);
    }
  },
);

export const setGalleryPhotoPublished = withAdmin(async (input: { id: string; published: boolean }): Promise<ActionResult> => {
  const { id, published } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id) || typeof published !== "boolean") return { ok: false, code: "invalid" };
  try {
    await connectDb();
    // publishing only matches a photo whose stored alt text has a visible character, so a stale page or a crafted call cannot slip past
    const filter = published ? { _id: id, "image.alt": { $regex: /\S/ } } : { _id: id };
    const updated = await GalleryPhotoModel.findOneAndUpdate(filter, { $set: { published } }, { projection: { album: 1 } }).lean<{
      album: { toString(): string };
    }>();
    if (!updated) {
      if (published && (await GalleryPhotoModel.exists({ _id: id }))) {
        return { ok: false, code: "invalid", message: MESSAGES.altRequired };
      }
      return { ok: false, code: "not_found" };
    }
    refresh(updated.album.toString());
    logAdmin("gallery", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

export const setGalleryAlbumCover = withAdmin(async (input: { albumId: string; photoId: string }): Promise<ActionResult> => {
  const { albumId, photoId } = input ?? {};
  if (typeof albumId !== "string" || !isObjectId(albumId) || typeof photoId !== "string" || !isObjectId(photoId)) {
    return { ok: false, code: "invalid" };
  }
  try {
    await connectDb();
    // the photo must belong to this album
    if (!(await GalleryPhotoModel.exists({ _id: photoId, album: albumId }))) return { ok: false, code: "not_found" };
    const result = await GalleryAlbumModel.updateOne({ _id: albumId }, { $set: { coverPhoto: photoId } });
    if (result.matchedCount === 0) return { ok: false, code: "not_found" };
    refresh(albumId);
    logAdmin("gallery", "ok", albumId);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

export const deleteGalleryPhoto = withAdmin(async (input: { id: string }): Promise<ActionResult> => {
  const { id } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const photo = await GalleryPhotoModel.findByIdAndDelete(id, { projection: { album: 1, "image.publicId": 1 } }).lean<{
      album: { toString(): string };
      image: { publicId: string };
    }>();
    if (!photo) return { ok: false, code: "not_found" };
    const albumId = photo.album.toString();
    await GalleryAlbumModel.updateOne({ _id: albumId, coverPhoto: id }, { $set: { coverPhoto: null } });
    refresh(albumId);
    logAdmin("gallery", "ok", id);
    await destroyAsset(photo.image.publicId); // best effort, never throws
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});
