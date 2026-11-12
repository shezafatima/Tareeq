# Contract: data access (reads and Server Actions)

Every action returns the existing `ActionResult` (`src/lib/admin/result.ts`). Every action is wrapped by `withAdmin`, which returns `{ ok:false, code:"unauthorized" }` with no session, before any database or Cloudinary call. Every successful write calls `revalidateTag("gallery", { expire: 0 })` and `revalidatePath("/admin/gallery")`; album-level changes also revalidate `/admin/gallery/<id>`. Logs use `logAdmin("gallery", outcome, id)` only, with no titles, captions or alt text.

## Public reads: `src/lib/gallery/data.ts` (`server-only`, cached, tag `"gallery"`, revalidate 3600)

| Function | Returns | Notes |
|----------|---------|-------|
| `getPublishedAlbums()` | `PublicAlbumCard[]` | visible albums only (FR-004), newest first; `photoCount` = visible photos; throws on DB failure (never cached) |
| `getAlbumBySlug(slug)` | `PublicAlbum \| null` | `null` for a malformed, unknown, unpublished or empty album; photos visible-only, in order |
| `getLatestPhotos(limit)` | `PublicPhoto[]` | visible photos across visible albums, `createdAt` desc; `limit` clamped 1–24 |
| `getPublishedAlbumSlugs()` | `string[]` | for `generateStaticParams` |
| `hasPublicGallery()` | `boolean` | true when at least one album is visible; for the nav and the /gallery empty state |

## Admin reads: `src/lib/admin/gallery-read.ts` (`server-only`, not cached)

| Function | Returns |
|----------|---------|
| `listAllAlbums()` | `AdminAlbumCard[]` (all albums; `photoCount` = all photos; cover per `resolveCover` non-public) |
| `getAdminAlbum(id)` | `AdminAlbum \| null` (`null` for malformed or unknown id) |

## Server Actions: `src/lib/admin/gallery-actions.ts`

| Action | Input | Success | Failures |
|--------|-------|---------|----------|
| `createGalleryAlbum` | `AlbumFormValues` `{ title, dateText, description, order, published }` | `{ ok, id }` | `invalid` + `fieldErrors`; `unavailable` |
| `updateGalleryAlbum` | `{ id, values: AlbumFormValues }` | `{ ok }` | `invalid`; `not_found`; `unavailable` (slug unchanged) |
| `setGalleryAlbumPublished` | `{ id, published }` | `{ ok }` | `invalid`; `not_found`; `unavailable` |
| `deleteGalleryAlbum` | `{ id }` | `{ ok, deletedPhotos }` | `invalid`; `not_found`; `unavailable`. Deletes photos, then the album, then assets (best effort, R15) |
| `addGalleryPhoto` | `{ albumId, publicId }` | `{ ok, id }` | `invalid` (bad id or publicId not under `tareeq/gallery/`); `not_found` (album); `image_rejected` (failed Cloudinary checks: asset destroyed); `not_configured`; `unavailable` (asset destroyed if verified) |
| `updateGalleryPhoto` | `{ id, values: { alt, caption, order } }` | `{ ok, published }` | `invalid` + `fieldErrors`; `not_found`; `unavailable`. A blank alt forces `published:false`; the returned `published` tells the card |
| `setGalleryPhotoPublished` | `{ id, published }` | `{ ok }` | `invalid` with `message: MESSAGES.altRequired` when publishing a photo with blank alt; `not_found`; `unavailable` |
| `setGalleryAlbumCover` | `{ albumId, photoId }` | `{ ok }` | `invalid`; `not_found` (album, or the photo is not in this album); `unavailable` |
| `deleteGalleryPhoto` | `{ id }` | `{ ok }` | `invalid`; `not_found`; `unavailable`. Unsets `coverPhoto` on its album if it was the cover; destroys the asset afterwards (best effort) |

Existing action change: `signUpload({ scope })` accepts `"gallery"` (via `UPLOAD_SCOPES`). Its behaviour is otherwise unchanged.

## Schema: `src/lib/admin/gallery-schema.ts` (pure, zod/mini, relative imports)

- `ALBUM_LIMITS`, `PHOTO_LIMITS`, `MESSAGES` (`title`, `dateText`, `description`, `order`, `alt`, `caption`, `altRequired: "Add alt text before publishing this photo."`)
- `parseAlbum(raw) → { success, data } | { success:false, errors }`
- `parsePhotoDetails(raw)` (alt may be blank)
- Re-exports `slugify`

## Guard test: `scripts/admin-guard-test.mts`

- Add the 9 new actions to `REQUIRED_ACTIONS`: `createGalleryAlbum`, `updateGalleryAlbum`, `setGalleryAlbumPublished`, `deleteGalleryAlbum`, `addGalleryPhoto`, `updateGalleryPhoto`, `setGalleryPhotoPublished`, `setGalleryAlbumCover`, `deleteGalleryPhoto`.
- Add the argument set `[{ scope: "gallery" }]` and `[{ albumId: "000000000000000000000000", publicId: "tareeq/gallery/x" }]`, so `signUpload` for the gallery and `addGalleryPhoto` are each refused with Cloudinary untouched.
