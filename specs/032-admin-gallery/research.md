# Research: Admin gallery

All Technical Context unknowns are resolved below. Each decision names the existing code it follows.

## R1 Module layout

- **Decision**: Mirror testimonials/programs. Public: `src/lib/gallery/{model.ts, data.ts, view.ts}`. Admin: `src/lib/admin/gallery-{schema,read,actions}.ts`. Pages under `src/app/admin/(panel)/gallery/` and `src/app/(site)/gallery/`.
- **Rationale**: Same split as `src/lib/testimonials/*` + `src/lib/admin/testimonials-*` (031). `gallery-actions.ts` matches the `*-actions.ts` glob the guard test already scans.
- **Alternatives**: One `src/lib/gallery/admin.ts` module. Rejected: the guard test discovers actions only in `src/lib/admin/*-actions.ts`.

## R2 Two collections

- **Decision**: `galleryalbums` and `galleryphotos`. Each photo references its album, with an index on `{ album, order, createdAt }`.
- **Rationale**: This is what the input asks for. Photos are edited one at a time and uploaded in parallel, so separate documents avoid write contention on one large album document. "Latest 6 across albums" is then a simple query.
- **Alternatives**: Photos embedded in the album. Rejected: parallel uploads would all race on `$push` to one document, and a cross-album "latest" query would need an unwind.

## R3 Photo image sub-document with optional alt

- **Decision**: Turn `storedImageSchema` in `src/lib/images/schema.ts` into a factory, `imageSubSchema({ altRequired })`. Keep `storedImageSchema = imageSubSchema({ altRequired: true })` exported unchanged. Gallery photos use `imageSubSchema({ altRequired: false })` with `alt` defaulting to `""`.
- **Rationale**: Gallery photos exist without alt until the owner describes them (spec FR-012). Programs, courses and site images keep the required-alt rule. One definition, no copy (Principle II).
- **Alternatives**: `storedImageSchema.clone()` plus a path override. Rejected: less obvious, and it relies on Mongoose clone semantics. A separate copied schema was rejected as a duplicate that would drift.

## R4 Cover stored as a photo reference, not an image copy

- **Decision**: The album stores `coverPhoto: ObjectId | null` (ref `GalleryPhoto`) instead of an embedded `coverImage` copy. A pure `resolveCover(album, photos)` in `view.ts` applies FR-003: use the chosen photo if it is eligible, otherwise the first eligible photo by order.
- **Rationale**: An embedded copy goes stale when the photo's alt changes. It also points at a deleted Cloudinary asset after the photo is deleted, and it can't follow the "falls back when unpublished" rule. A reference always resolves to current data. **This deviates from the input's `coverImage` field name and shape.** Behaviour is the same ("optional; defaults to the first photo").
- **Alternatives**: An embedded copy kept in sync by every photo action. Rejected: it adds sync points in four actions for no gain.

## R5 Alt-text publish gate (defence in depth, as with testimonial consent, 031 R5)

- **Decision**: The gate is enforced in four places:
  1. In the schema/form, the Published toggle is locked when alt is blank (the existing `PublishedToggle` `lockedReason` prop).
  2. `setGalleryPhotoPublished(true)` uses the filter `{ _id, "image.alt": { $nin: ["", null] } }`. If nothing matches but the photo exists, it returns `invalid` with `MESSAGES.altRequired`.
  3. `updateGalleryPhoto` forces `published: false` when the saved alt is blank.
  4. A model validator on `published` refuses `true` with a blank `image.alt` on document saves.
- **Rationale**: SC-002 says 0 alt-less photos are public, whatever path the request takes. Public queries also filter on non-empty alt (R7), so a bad record could not leak even if it existed.

## R6 Multi-file upload

- **Decision**:
  - Add `"gallery"` to `UPLOAD_SCOPES` (`src/lib/cloudinary/server.ts`). Uploads go to `tareeq/gallery`.
  - Extract the XHR upload from `ImageUploader` into `src/lib/images/upload-client.ts` as `uploadToCloudinary(file, signature, { onProgress, signal })`, which resolves to `{ publicId, url, width, height }`. `ImageUploader` and the new `GalleryUploader` both call it.
  - `GalleryUploader` (client) keeps a queue of `{ id, file, state, percent, error }` and runs 3 at a time. For each file it calls `validateFile` → `signUpload({ scope: "gallery" })` → `uploadToCloudinary` → `addGalleryPhoto({ albumId, publicId })`.
  - Failed files keep their `File` for Retry. While anything is waiting or uploading, `beforeunload` is armed (existing `useUnsavedChanges`).
  - When a file finishes, `router.refresh()` re-renders the server photo list.
- **Rationale**: This reuses the signed flow, the limits and the messages unchanged (FR-008). The upload code now appears twice, so it is extracted before the second copy (Principle II). Three parallel uploads keep a slow phone connection usable (spec assumption).
- **Alternatives**: Generalising `ImageUploader` to many files. Rejected: it is a single-value form field, and multi-file would complicate every existing use. Sending files through a Server Action was rejected because it breaks the "file goes straight to Cloudinary" rule (030 R1).

## R7 Server-side add and verification

- **Decision**: `addGalleryPhoto({ albumId, publicId })`:
  1. Checks the album exists.
  2. Runs `verifyAsset(publicId)`, so url, width and height come from Cloudinary rather than the client (030 R3).
  3. Creates the photo with `order = max + 1`, `published: false` and `alt: ""`.
  4. If the database write fails after verification, it calls `destroyAsset(publicId)` (best effort) and returns `unavailable`.
- **Rationale**: This covers the edge case "uploaded but saving failed", and it never trusts client-sent dimensions or URLs.

## R8 Caching and freshness

- **Decision**:
  - All public reads use `unstable_cache` with tag `"gallery"` and revalidate 3600:
    - `getPublishedAlbums()`
    - `getAlbumBySlug(slug)` (key `["gallery-album", slug]`)
    - `getLatestPhotos(limit)`
    - `getPublishedAlbumSlugs()`
    - `hasPublicGallery()`
  - Every action calls `revalidateTag("gallery", { expire: 0 })` plus `revalidatePath("/admin/gallery")` (and the album admin path where relevant).
- **Rationale**: Same as `testimonials/data.ts` and `programs/data.ts`. One tag covers /gallery, album pages, the workshop section and the nav (FR-024).
- **Visibility query (FR-004)**: photos `{ published: true, "image.alt": { $nin: ["", null] } }` in albums `{ published: true }`. Album lists use one aggregate (`$match` published albums → `$lookup` visible photos → keep albums with at least one → count + cover candidates).

## R9 Conditional "Gallery" nav item

- **Decision**:
  - `SiteLayout` becomes `async` and reads `hasPublicGallery()` once. Any error counts as `false`, logged by error name.
  - It passes `items = navItemsFor({ gallery })` (a pure helper in `src/lib/site.ts`) to `Header` → `DesktopNav` / `MobileMenuContent`, and to `Footer`, as a prop.
  - Gallery goes after Courses: Programs, Courses, Gallery, Our Way.
- **Rationale**: One read per render, passed down (Principle XI). A failure only hides the link and never breaks the page shell.
- **Principle VIII impact**: `Header` gains an `items` prop. Its markup and styles are unchanged, so the hero is not touched. This impact is stated here for approval.
- **Alternatives**: Each nav component reading on its own. Rejected because it reads the same data three times.

## R10 Album grid layout

- **Decision**: CSS multi-column masonry (`columns-2 sm:columns-3 lg:columns-4`, `break-inside-avoid`). Each photo is a `<button>` wrapping `next/image` at its stored width and height. DOM order is album order, so keyboard order and viewer order are the same.
- **Rationale**: Proportions are preserved (FR-018) with no dependency and no JS layout. At 360px it is two columns with no horizontal scroll.
- **Trade-off**: Visual reading order runs down each column. This is accepted for a photo gallery. Tab order and the viewer still follow album order.

## R11 In-house lightbox

- **Decision**: `GalleryLightbox` (client) wraps the server-rendered grid as `children`. It uses event delegation: a click or Enter on `[data-photo-index]` opens it. Photos arrive as serialisable props (`src`, `width`, `height`, `alt`, `caption`).
  - **Dialog**: `role="dialog"`, `aria-modal="true"`, labelled "Photo N of M". Focus is trapped with the existing `useFocusTrap`, which also returns focus to the opener. Body scroll is locked, as in `BookingDialog`.
  - **Keys**: Escape closes, ArrowLeft/ArrowRight move, and there is no wrap at the ends (buttons are disabled there).
  - **Swipe**: Pointer events. A move counts as a swipe when it is horizontal (`|dx| > 50px` and `|dx| > |dy|`); a mostly vertical gesture is ignored.
  - **Motion**: An opacity fade only, removed under `motion-reduce`.
  - **Image**: `next/image` with `sizes="100vw"`, `object-contain`, max `90svh`, loaded eagerly for the current photo.
- **Rationale**: No new dependency (FR-026). Server markup stays server-side (Principle XI), and the focus and scroll behaviour already used in the site is reused.

## R12 Image delivery

- **Decision**: Public images use the existing `SafeImage` (Cloudinary `f_auto,q_auto` via `optimizedUrl`, lazy by default, broken-image fallback hides the image) with explicit `sizes`:
  - album cards: `(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw`
  - grid: `(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw`
  - workshop strip: `(min-width:640px) 33vw, 50vw`

  `priority` is set only for the first album card and the first 2 grid photos. The `res.cloudinary.com` remote pattern already exists.
- **Rationale**: Same pipeline as program covers and the founder photo (030). This covers the edge case "file deleted at the image store".

## R13 Album slug

- **Decision**: On create, `slug = nextFreeSlug(slugify(title), takenSlugsWithPrefix)`, using the existing `slugify` and `src/lib/admin/slug.ts`. The slug is never changed afterwards. A duplicate-key race is retried once with a fresh list.
- **Rationale**: This is the courses pattern (025 R4). Fixed addresses keep shared links working (spec edge case).

## R14 Sorting

- **Decision**:
  - Albums (public): `createdAt` descending, then `order` ascending (FR-016 as written).
  - Albums (admin): the same.
  - Photos: `order` ascending, then `createdAt` ascending.
  - Latest photos: `createdAt` descending.
- **Note**: With creation time as the primary key, an album's order number only breaks ties. This follows the spec; see the follow-up in plan.md.

## R15 Album delete cascade

- **Decision**: `deleteGalleryAlbum({ id })`:
  1. Reads the photo publicIds.
  2. `GalleryPhotoModel.deleteMany({ album })`.
  3. `GalleryAlbumModel.deleteOne`.
  4. Revalidates.
  5. Then runs `destroyAsset` for each publicId, 5 at a time, with `Promise.allSettled`. `destroyAsset` already logs and never throws.

  The confirmation count comes from the admin read, so the action needs no extra parameter.
- **Rationale**: Records go first, so the public site never points at a missing file. File clean-up is best effort (FR-015), and the guard test's Cloudinary tripwire already covers `destroy`.

## R16 Workshop section

- **Decision**: A new server component, `src/components/sections/WorkshopGallery.tsx`, reads `getLatestPhotos(6)`. It returns `null` when the list is empty or the read fails (logged). Otherwise it shows a heading, a 2/3-column grid of 6 photos (not interactive) and a "See all photos" `Button` linking to `/gallery`. It renders on `/workshop` after the booking button, inside the existing page.
- **Rationale**: /workshop has no gallery section today (spec assumption). The section adds no client JavaScript.

## R17 Admin photo cards

- **Decision**: `GalleryPhotoCard` is a server shell with client leaves:
  - `PhotoDetailsForm` (alt, caption and order inputs with one Save, using `useActionFeedback`)
  - the existing `PublishedToggle` with `lockedReason` when alt is blank
  - a "Set as cover" button (disabled for the current cover, with a "Cover" chip shown)
  - Delete via the existing `ConfirmDialog`

  The "Missing alt text" badge uses `StatusChip`.
- **Rationale**: This reuses the 031 components (Principle II), and client code is limited to the interactive leaves (Principle XI).

## R18 Validation limits

| Field | Rule |
|-------|------|
| Album title | required, 1–120 |
| Date label | required, 1–40 |
| Description | optional, ≤ 500 |
| Album and photo order | integer 0–9999 |
| Photo alt | ≤ 200 (`IMAGE_LIMITS.maxAlt`), may be blank (blank blocks publish) |
| Caption | optional, ≤ 300 |

The rules live in `gallery-schema.ts`, which is pure (zod/mini) and shared by the forms and the actions.
