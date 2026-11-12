// Pure rules for what the public sees of the gallery (specs/032-admin-gallery data-model.md "Derived rules"). Relative imports only.

export type PublicPhoto = { id: string; src: string; width: number; height: number; alt: string; caption?: string };
export type PublicAlbumCard = { slug: string; title: string; dateText: string; photoCount: number; cover: PublicPhoto };
export type PublicAlbum = PublicAlbumCard & { description?: string; photos: PublicPhoto[] };

/** True when the alt text has something other than spaces in it. */
export const hasAlt = (alt: unknown): boolean => typeof alt === "string" && alt.trim() !== "";

/** A photo is public only when it is published, described, and its album is published (FR-004). */
export const isPhotoVisible = (photo: { published: boolean; image: { alt?: string | null } }, albumPublished: boolean): boolean =>
  albumPublished && photo.published === true && hasAlt(photo.image?.alt);

const time = (d: Date | string | number): number => new Date(d).getTime();

/** Photos: order ascending, oldest first on ties. */
export const comparePhotos = (a: { order: number; createdAt: Date | string }, b: { order: number; createdAt: Date | string }): number =>
  a.order - b.order || time(a.createdAt) - time(b.createdAt);

/** Albums: newest created first, the order number breaks ties (FR-016). */
export const compareAlbums = (a: { order: number; createdAt: Date | string }, b: { order: number; createdAt: Date | string }): number =>
  time(b.createdAt) - time(a.createdAt) || a.order - b.order;

/**
 * The cover of an album from an already filtered and sorted list: the chosen photo when it is in the list,
 * otherwise the first one, or null when there are none (FR-003).
 */
export function resolveCover<T extends { id: string }>(coverPhotoId: string | null | undefined, photos: T[]): T | null {
  if (coverPhotoId) {
    const chosen = photos.find((p) => p.id === coverPhotoId);
    if (chosen) return chosen;
  }
  return photos[0] ?? null;
}

export function toPublicPhoto(doc: {
  _id: { toString(): string };
  image: { url: string; width: number; height: number; alt?: string | null };
  caption?: string | null;
}): PublicPhoto {
  return {
    id: doc._id.toString(),
    src: doc.image.url,
    width: doc.image.width,
    height: doc.image.height,
    alt: (doc.image.alt ?? "").trim(),
    ...(doc.caption ? { caption: doc.caption } : {}),
  };
}

/** A safe row limit for "latest photos" reads. */
export const clampLimit = (n: number, max = 24): number => (Number.isFinite(n) ? Math.min(max, Math.max(1, Math.floor(n))) : 1);
