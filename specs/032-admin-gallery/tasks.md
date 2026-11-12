---
description: "Task list for 032-admin-gallery"
---

# Tasks: Admin gallery

**Input**: Design documents from `/specs/032-admin-gallery/`
**Prerequisites**: plan.md, spec.md, research.md (R1–R18), data-model.md, contracts/ (data-access.md, routes-and-ui.md), quickstart.md

**Tests**: Included. FR-025 requires extending the unauthenticated-action test, and the plan adds unit tests for the pure rule modules. Unit tests use `node --test` in `tests/unit/*.test.ts`. They import pure modules by **relative** path with `.ts` extensions, as in `tests/unit/admin-testimonials-schema.test.ts`.

**Organization**: tasks are grouped by user story. P1 stories come first, then P2.

| Story | What it covers | Priority |
|-------|----------------|----------|
| US1 | Create an album and upload photos | P1 |
| US2 | Describe, publish and curate photos | P1 |
| US3 | Visitors browse albums and photos (with the lightbox) | P1 |
| US7 | Owner-only access (final guard verification) | P1 |
| US4 | Empty states and conditional nav | P2 |
| US5 | Latest photos on /workshop | P2 |
| US6 | Delete an album | P2 |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US7 from spec.md

## Conventions every task must follow

- **Read the file first.** Read an existing file before changing it, and keep its comment style: a short header comment citing the spec and research ids, e.g. `// specs/032-admin-gallery research R5`.
- **Copy the testimonials and programs pattern.** The reference files are:
  - `src/lib/testimonials/model.ts`, `src/lib/testimonials/data.ts`
  - `src/lib/programs/data.ts` (per-slug cache)
  - `src/lib/admin/testimonials-{schema,read,actions}.ts`
  - `src/lib/admin/courses-actions.ts` (slug with `nextFreeSlug`)
  - `src/lib/admin/images-actions.ts`, `src/lib/admin/images-verify.ts`
  - `src/app/admin/(panel)/testimonials/**`
  - `src/components/admin/TestimonialAdminCard.tsx`, `TestimonialForm.tsx`
  - `src/app/(site)/programs/[slug]/{page,not-found}.tsx`

  Match their naming, error handling and the tone of their messages.
- **Pure modules use relative imports only**, with `.ts` extensions and no `server-only` or `@/` alias. This applies to `src/lib/gallery/view.ts`, `src/lib/admin/gallery-schema.ts` and `src/lib/site.ts`.
- **Server modules start with `import "server-only";`**: `model.ts`, `data.ts` and `gallery-read.ts`.
- **Every Server Action is wrapped with `withAdmin`** and returns `ActionResult`.
  - Successful writes call `revalidateTag("gallery", { expire: 0 })` and `revalidatePath("/admin/gallery")`.
  - Logs use `logAdmin("gallery", …)` with ids only. Never log titles, captions or alt text.
  - Outages return `unavailable`, logged by error name only.
- **Every admin page calls `await requireAdmin()` first** and loads data through `safeLoad`, showing `UnavailableNotice` on failure.
- **Images**: public images use `SafeImage` with an explicit `sizes` (research R12). Admin thumbnails use a plain `<img>` with `optimizedUrl(url, 480)`, as in `ImageUploader`.
- **Styling and motion**: brand tokens only, no hex. Saffron is never used as text on a light background. Touch targets are `min-h-11`. Every transition gets `motion-reduce:transition-none`.
- **`"use client"`** goes only on the files plan.md lists as client components. Each gets a one-line reason comment.
- **No new dependencies.** Do not touch the hero or the tokens. The only Header change is the `items` prop (T040).

---

## Phase 1: Setup

- [X] T001 Record the baseline on branch `032-admin-gallery`:
  - Run `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build` and `npm run test:admin-guard -- --no-http`.
  - Write the results, the unit test count and the guard test's action count to `specs/032-admin-gallery/verification.md` (new file, section "Baseline").

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: data model, pure rules with tests, the upload scope, the shared upload helper, reads and the sidebar entry.

**⚠️ CRITICAL**: No user story work starts until this phase is done.

- [X] T002 Refactor `src/lib/images/schema.ts` (research R3):
  - Add `export function imageSubSchema({ altRequired }: { altRequired: boolean })`, which returns the same `Schema` as today. When `altRequired` is false, `alt` is `{ type: String, trim: true, maxlength: IMAGE_LIMITS.maxAlt, default: "" }`.
  - Redefine `export const storedImageSchema = imageSubSchema({ altRequired: true })`. Keep `pickImage` unchanged.
  - Check that `npx tsc --noEmit` passes and that existing models still import `storedImageSchema`.
- [X] T003 [P] Add `"gallery"` to `UPLOAD_SCOPES` in `src/lib/cloudinary/server.ts` (research R6). In `src/components/admin/ImageUploader.tsx`, widen the `scope` prop type to `UploadScope`-compatible literals, so `"gallery"` is accepted.
- [X] T004 [P] Add `"gallery"` to the `AdminEvent` union in `src/lib/admin/log.ts`.
- [X] T005 Create `src/lib/images/upload-client.ts` (research R6), with no `"use client"` directive (it is a plain browser helper):
  - `export function uploadToCloudinary(file: File, upload: UploadSignature, opts: { onProgress?: (percent: number) => void; signal?: AbortSignal }): Promise<{ publicId: string; url: string; width: number; height: number }>`
  - Move the XHR body from `ImageUploader.start` into it unchanged: FormData fields `file`, `api_key`, `timestamp`, `signature`, `folder`, `allowed_formats`, POSTed to `https://api.cloudinary.com/v1_1/<cloud>/image/upload`, with `upload.onprogress`.
  - Reject with `Error("UploadFailed")` on a network error or a bad response, and with `DOMException("Aborted", "AbortError")` on abort.
  - Import `UploadSignature` as a **type only** from `@/lib/cloudinary/server`. If that pulls in `server-only`, move the `UploadSignature` type into `src/lib/images/shared.ts` and re-export it from `server.ts`.
- [X] T006 Refactor `src/components/admin/ImageUploader.tsx` to call `uploadToCloudinary` (depends on T005):
  - Keep every visible behaviour: progress, cancel (use an `AbortController` in place of `xhrRef`), messages, local preview, alt field.
  - Abort on unmount.
  - Manually re-test the founder photo upload in Settings → Images.
- [X] T007 Create `src/lib/gallery/model.ts` per data-model.md (depends on T002):
  - **`GalleryAlbum`**:
    - `title` (required, trim, 120), `slug` (required, unique, match `SLUG_PATTERN`, maxlength `SLUG_MAX` from `../programs/options.ts`), `dateText` (required, trim, 40), `description` (trim, 500)
    - `coverPhoto` (`Schema.Types.ObjectId`, ref `"GalleryPhoto"`, default null), `order` (Number, min 0, max 9999, default 0), `published` (Boolean, default false)
    - `{ collection: "galleryalbums", timestamps: true }`; index `{ published: 1, createdAt: -1 }`
  - **`GalleryPhoto`**:
    - `album` (ObjectId, ref `"GalleryAlbum"`, required), `image` (`imageSubSchema({ altRequired: false })`, required), `caption` (trim, 300), `order` (Number, min 0, max 9999, default 0)
    - `published` (Boolean, default false), with a validator that refuses `true` when `this.image?.alt?.trim()` is empty on document saves. Query contexts pass through, because the actions' filters guard them (research R5).
    - `{ collection: "galleryphotos", timestamps: true }`; indexes `{ album: 1, order: 1, createdAt: 1 }` and `{ published: 1, createdAt: -1 }`
  - Export `GalleryAlbumModel` and `GalleryPhotoModel` with the `mongoose.models.X ?? mongoose.model(...)` guard.
- [X] T008 [P] Create `src/lib/gallery/view.ts` (pure) per data-model.md "Derived rules":
  - Types `PublicPhoto`, `PublicAlbumCard`, `PublicAlbum`.
  - `hasAlt(alt)`, `isPhotoVisible(photo, albumPublished)`, `comparePhotos` (order asc, then createdAt asc), `compareAlbums` (createdAt desc, then order asc).
  - `resolveCover<T extends { id: string }>(coverPhotoId: string | null, photos: T[]): T | null`. Callers pass an already sorted and filtered list: the chosen photo if it is in the list, otherwise `photos[0] ?? null`.
  - `toPublicPhoto(doc)` returns `{ id, src: url, width, height, alt, caption? }`.
  - `clampLimit(n)` clamps to 1–24.
- [X] T009 [P] Create `tests/unit/gallery-view.test.ts` (depends on T008). Cases:
  - Blank or whitespace alt is not visible; an unpublished photo is not visible; a published album is required.
  - Photo sort ties go oldest first; album sort is newest first, with order breaking ties.
  - `resolveCover`: the chosen photo when present, the first photo when the chosen one is missing, null when empty.
  - `clampLimit(0)` returns 1, and `clampLimit(100)` returns 24.
- [X] T010 [P] Create `src/lib/admin/gallery-schema.ts` (pure, `zod/mini`) per research R18:
  - `ALBUM_LIMITS = { title: 120, dateText: 40, description: 500, order: 9999 }` and `PHOTO_LIMITS = { alt: IMAGE_LIMITS.maxAlt, caption: 300, order: 9999 }`.
  - `MESSAGES`: `title`, `dateText`, `description`, `order` ("Use a whole number from 0 to 9999."), `alt`, `caption`, `altRequired: "Add alt text before publishing this photo."`, `altLocked: "Add alt text before publishing."`
  - `AlbumFormValues` `{ title, dateText, description, order: string, published: boolean }` and `parseAlbum(raw)` → `{ success: true, data: { title, dateText, description?, order: number, published } } | { success: false, errors }`. A blank description becomes undefined; the order text becomes an integer.
  - `PhotoDetailsValues` `{ alt, caption, order: string }` and `parsePhotoDetails(raw)`. Alt may be blank and is trimmed, max 200; a blank caption becomes undefined.
  - Re-export `slugify` from `./programs-schema.ts` and reuse `toFieldErrors`.
- [X] T011 [P] Create `tests/unit/gallery-schema.test.ts` (depends on T010). Cases:
  - Title and date label are required and capped at 120 and 40.
  - Description is capped at 500, and a blank one becomes undefined.
  - Order: `"abc"`, `"-1"` and `"10000"` are rejected; `"0"` and `"9999"` are accepted.
  - Alt: blank is accepted, 201 characters are rejected, whitespace is trimmed to blank.
  - A caption of 301 characters is rejected.
  - `slugify("Teacher workshop, Karachi")` returns `"teacher-workshop-karachi"`.
- [X] T012 Create `src/lib/admin/gallery-read.ts` (`server-only`, uncached) per contracts/data-access.md (depends on T007, T008):
  - `listAllAlbums(): Promise<AdminAlbumCard[]>`: all albums sorted by `compareAlbums`. `photoCount` comes from one `GalleryPhotoModel.aggregate([{ $group: { _id: "$album", n: { $sum: 1 } } }])`. The cover comes from `resolveCover(coverPhoto, sorted photos of that album)`; fetch only the needed photos with one `find({ album: { $in: ids } })` and sort them in memory.
  - `getAdminAlbum(id): Promise<AdminAlbum | null>`: `null` when `!isObjectId(id)` or the album is unknown. Photos are sorted by `comparePhotos` and mapped to `AdminPhoto` with `missingAlt: !hasAlt(alt)` and `isCover: id === resolved cover id`.
  - `nextPhotoOrder(albumId)`: max + 1, or 1 when the album is empty.
  - `albumSlugsLike(base)`: slugs matching `^<escaped base>(-\d+)?$`.
- [X] T013 Create `src/lib/gallery/data.ts` (`server-only`) per contracts/data-access.md (depends on T007, T008). All reads use `unstable_cache` with `{ tags: ["gallery"], revalidate: 3600 }` and throw on database failure.
  - `getPublishedAlbums()`, key `["gallery:albums"]`:
    1. Find published albums.
    2. Find visible photos `{ album: { $in }, published: true, "image.alt": { $nin: ["", null] } }`, sorted `{ order: 1, createdAt: 1 }`.
    3. Group the photos by album and drop albums with none.
    4. Return `{ slug, title, dateText, photoCount, cover: toPublicPhoto(resolveCover(...)) }`, sorted with `compareAlbums`.
  - `getAlbumBySlug(slug)`: returns `null` when the slug fails `SLUG_PATTERN` or `SLUG_MAX`. Cache key `["gallery:album", slug]`. Also returns `null` when the album is unpublished or has 0 visible photos.
  - `getLatestPhotos(limit)`: key `["gallery:latest", String(clampLimit(limit))]`. Gets the ids of published albums, then visible photos in them sorted `{ createdAt: -1 }`, limited.
  - `getPublishedAlbumSlugs()`: `(await getPublishedAlbums()).map(a => a.slug)`.
  - `hasPublicGallery()`: `(await getPublishedAlbums()).length > 0`.
- [X] T014 [P] Add the Gallery entry to `src/components/admin/AdminNav.tsx` `ENTRIES` after Testimonials: `{ kind: "link", href: "/admin/gallery", label: "Gallery", Icon: Images, isActive: under("/admin/gallery") }`, importing `Images` from `@phosphor-icons/react/dist/ssr`.
- [X] T015 Checkpoint: `npx tsc --noEmit`, `npm run test:unit` (new tests pass) and `npm run lint` are clean. Append the results to `verification.md` ("Foundational").

**Checkpoint**: Foundation ready. User story work can start.

---

## Phase 3: User Story 1 - Create an album and upload photos (Priority: P1) 🎯 MVP

**Goal**: the owner creates an album and drops several photos at once. Each file shows its own progress and becomes a stored, unpublished photo.

**Independent Test**: create an album and drop 5 valid images plus 1 `.gif`. The 5 become photo cards and only the `.gif` fails, with its reason (quickstart steps 3–6).

- [X] T016 [US1] Create `src/lib/admin/gallery-actions.ts` (`"use server"`) with `createGalleryAlbum` and `updateGalleryAlbum` per contracts/data-access.md:
  - Add the helpers `unavailable(err)` and `refresh(albumId?)`. `refresh` revalidates the tag, `/admin/gallery` and `/admin/gallery/<id>`.
  - `createGalleryAlbum(values)`:
    1. `parseAlbum`.
    2. `slug = nextFreeSlug(slugify(title) || "album", await albumSlugsLike(base))`.
    3. Create the album. On an `E11000` duplicate-key error, retry once with a fresh slug list.
    4. Return `{ ok: true, id }`.
  - `updateGalleryAlbum({ id, values })`: validate the id, `parseAlbum`, then `updateOne` with `$set` and `$unset: { description: 1 }` when the description is blank. Never change the slug. Return `not_found` when nothing matched.
- [X] T017 [US1] Add `addGalleryPhoto({ albumId, publicId })` to `src/lib/admin/gallery-actions.ts` (research R7):
  1. Return `invalid` unless `isObjectId(albumId)`, `publicId` is a string and it starts with `tareeq/gallery/`.
  2. Return `not_configured` when `!isConfigured()`.
  3. `connectDb`, and return `not_found` when the album does not exist.
  4. `verifyAsset(publicId)`. On `ImageRejected`, return `imageFailure(err)`; the asset is already destroyed.
  5. `GalleryPhotoModel.create({ album, image: { ...verified, publicId, alt: "" }, order: await nextPhotoOrder(albumId), published: false })`.
  6. If the create throws, `await destroyAsset(publicId)` and return `unavailable`.
  7. `refresh(albumId)` and return `{ ok: true, id }`.
- [X] T018 [P] [US1] Create `src/components/admin/GalleryAlbumForm.tsx` (client: form state and save feedback):
  - Props: `mode: "create" | "edit"`, `album?: { id, slug, title, dateText, description?, order, published }`.
  - Fields: title, date label (placeholder "November 2026"), description textarea, order, and Published (a checkbox in create mode).
  - Use the existing `Field`/`TextareaField` components, or the plain inputs from `TestimonialForm.tsx`, whichever that form uses.
  - In edit mode, show the address read-only: "Address: /gallery/<slug>".
  - Show field errors from `fieldErrors`, and feedback through `useActionFeedback`. After a create, `router.push("/admin/gallery/<id>")`; after an edit, call `router.refresh()`.
  - Use `useUnsavedChanges` like `TestimonialForm`.
- [X] T019 [P] [US1] Create `src/components/admin/GalleryAlbumAdminCard.tsx` (server):
  - Props: `album: AdminAlbumCard`.
  - Shows a 4:3 cover (`<img>` `optimizedUrl(url, 480)` `object-cover`, or a soft-blue placeholder with an `Images` icon), the title as a link to `/admin/gallery/<id>`, the date label, and "N photos" (singular for 1).
  - Slots for the toggle and delete are filled in US2 and US6. Leave a clearly marked actions row.
- [X] T020 [US1] Create `src/app/admin/(panel)/gallery/page.tsx` (depends on T012, T019):
  - Copy `testimonials/page.tsx`: `metadata = { title: "Gallery" }`, H1 "Gallery", a "New album" link to `/admin/gallery/new`.
  - `EmptyState` with icon `Images`, title "No albums yet.", body "Create an album for a workshop, then upload its photos."
  - Grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` of `GalleryAlbumAdminCard`.
- [X] T021 [US1] Create `src/app/admin/(panel)/gallery/new/page.tsx`: `requireAdmin()`, H1 "New album", and a back link to `/admin/gallery`. Renders `<GalleryAlbumForm mode="create" />`.
- [X] T022 [US1] Create `src/components/admin/GalleryUploader.tsx` (client: file and drag events, queue state, XHR progress, beforeunload) per contracts/routes-and-ui.md (depends on T005, T017):
  - Props: `albumId`, `configured: boolean`.
  - Above the zone, a static `role="note"` panel with the exact text "Only upload photos of children with parent/school consent."
  - The zone is a button plus a hidden `<input type="file" multiple accept="image/jpeg,image/png,image/webp">`, with drop of many files. The hint reads "JPG, PNG or WebP, up to 5 MB each."
  - Queue item: `{ key, file, state: "waiting" | "uploading" | "done" | "failed", percent, error? }`. A pump runs at most 3 items at a time.
  - Per item:
    1. `validateFile` (failed with that message).
    2. `signUpload({ scope: "gallery" })`: `unauthorized` gives "Your session has ended. Please sign in again."; `not_configured` gives `IMAGE_MESSAGES.notConfigured`.
    3. `uploadToCloudinary` with `onProgress`.
    4. `addGalleryPhoto`. A failure gives `IMAGE_MESSAGES.rejected` for `image_rejected`, otherwise `IMAGE_MESSAGES.uploadFailed`.
    5. On success, mark the item done and `router.refresh()` (debounced to once per 800ms).
  - Each row shows the file name, a state chip, a `role="progressbar"` with `aria-valuenow` while uploading, and a Retry button for failed rows (re-queue).
  - "Clear finished" removes done rows. A visually hidden `aria-live="polite"` summary reads e.g. "3 of 5 uploaded".
  - While any item is waiting or uploading, register a `beforeunload` handler. Abort in-flight uploads on unmount.
  - When `!configured`, the zone is disabled and shows `IMAGE_MESSAGES.notConfigured`.
  - Layout at 360px: rows wrap and file names truncate (`min-w-0 truncate`).
- [X] T023 [US1] Create `src/app/admin/(panel)/gallery/[id]/page.tsx` (depends on T012, T018, T022):
  - `requireAdmin()`, `safeLoad(() => getAdminAlbum(id))`, and `notFound()` for null. `generateMetadata` gives the title "<album title> · Gallery".
  - Sections: H1 album title + back link; "Album details" with `<GalleryAlbumForm mode="edit" album=… />`; "Upload photos" with `<GalleryUploader albumId configured={isConfigured()} />` (import `isConfigured` from `@/lib/cloudinary/server`); "Photos (N)" as a grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`.
  - For this story, render a minimal photo tile per photo (thumbnail + "Missing alt text" chip). US2 replaces it with `GalleryPhotoCard`.
  - An empty photo state: "No photos yet. Drop some above."
- [X] T024 [US1] Add `"createGalleryAlbum"`, `"updateGalleryAlbum"` and `"addGalleryPhoto"` to `REQUIRED_ACTIONS` in `scripts/admin-guard-test.mts`, with the comment `// specs/032-admin-gallery FR-025`. Add the argument sets `[{ scope: "gallery" }]` and `[{ albumId: "000000000000000000000000", publicId: "tareeq/gallery/x" }]` to the args loop. Run `npm run test:admin-guard -- --no-http`.
- [X] T025 [US1] Browser check at 360/390/1440px: quickstart steps 2–6. Confirm in the Cloudinary console that files land in `tareeq/gallery`. Record the results in `verification.md` ("US1").

**Checkpoint**: Albums and uploads work end to end (photos stay unpublished).

---

## Phase 4: User Story 2 - Describe, publish and curate photos (Priority: P1)

**Goal**: per-photo alt text, caption, order, publish (gated on alt), set as cover and delete; album publish toggle.

**Independent Test**: quickstart steps 7–11 (badge and locked toggle, refused publish, cover fallback, reorder, clearing alt unpublishes).

- [X] T026 [US2] Add the photo and album curation actions to `src/lib/admin/gallery-actions.ts` (research R5, contracts/data-access.md):
  - **`updateGalleryPhoto({ id, values })`**:
    1. `parsePhotoDetails`.
    2. Set `$set: { "image.alt": alt, order }`, plus `caption` or `$unset: { caption: 1 }`. When the alt is blank, also `$set: { published: false }`.
    3. Use `findOneAndUpdate(..., { new: true, projection: { album: 1, published: 1 } })`.
    4. Return `not_found` when there is no document; otherwise `refresh(album)` and return `{ ok: true, published }`.
  - **`setGalleryPhotoPublished({ id, published })`**:
    - Filter: `published ? { _id: id, "image.alt": { $nin: ["", null], $regex: /\S/ } } : { _id: id }`.
    - If nothing matched while publishing and the photo exists, return `{ ok: false, code: "invalid", message: MESSAGES.altRequired }`; otherwise return `not_found`.
  - **`setGalleryAlbumCover({ albumId, photoId })`**: validate both ids. The photo must exist with `album: albumId`, else `not_found`. Then `updateOne({ _id: albumId }, { $set: { coverPhoto: photoId } })`.
  - **`deleteGalleryPhoto({ id })`**:
    1. `findByIdAndDelete` (projection `album`, `image.publicId`); return `not_found` when there is nothing to delete.
    2. `GalleryAlbumModel.updateOne({ _id: album, coverPhoto: id }, { $set: { coverPhoto: null } })`.
    3. `refresh(album)`, then `await destroyAsset(publicId)`.
  - **`setGalleryAlbumPublished({ id, published })`**: a simple `updateOne`; `not_found` when nothing matched.
- [X] T027 [P] [US2] Create `src/components/admin/PhotoDetailsForm.tsx` (client: input state and save feedback):
  - Props: `photoId`, `initial: { alt, caption, order }`.
  - Fields: "Alt text (required to publish)" with a counter out of 200 and the helper "Describe what the photo shows, e.g. 'Teachers trying a chatbot in pairs'.", Caption (optional, counter out of 300), Order (`inputMode="numeric"`), and a Save button.
  - On success, `router.refresh()` and a toast. If the result has `published === false` and the photo was published, the toast says "Saved. The photo was unpublished because it has no alt text."
  - Field errors use `aria-describedby`. Every input has its own label, with ids built from `photoId`.
- [X] T028 [P] [US2] Create `src/components/admin/PhotoCoverButton.tsx` (client: pending state and click handler): calls `setGalleryAlbumCover`, then `router.refresh()`, with error feedback through `useActionFeedback`. Label "Set as cover".
- [X] T029 [US2] Create `src/components/admin/GalleryPhotoCard.tsx` (server) (depends on T027, T028):
  - Props: `albumId`, `photo: AdminPhoto`.
  - Thumbnail `<img src={optimizedUrl(url, 480)} width height alt={alt} className="h-auto w-full">` at its natural proportions. Chips: "Cover" (when `isCover`) and "Missing alt text" (`StatusChip`, warning tone, when `missingAlt`).
  - Render `PhotoDetailsForm` and `PublishedToggle`. Wire the toggle exactly as `TestimonialAdminCard` does (same prop names), calling `setGalleryPhotoPublished`, with `lockedReason={photo.missingAlt ? MESSAGES.altLocked : undefined}`.
  - Show `PhotoCoverButton` unless the photo is the cover. Delete uses the existing `ConfirmDialog` pattern from `TestimonialAdminCard` (or its delete button component), with the text "Delete this photo? This cannot be undone." and calling `deleteGalleryPhoto`.
- [X] T030 [US2] In `src/app/admin/(panel)/gallery/[id]/page.tsx`, replace the minimal tiles with `<GalleryPhotoCard albumId photo />`.
- [X] T031 [US2] In `src/components/admin/GalleryAlbumAdminCard.tsx`, add `PublishedToggle` to the actions row, calling `setGalleryAlbumPublished`. Its label says "Published"; the existing toggle markup is unchanged.
- [X] T032 [US2] Add `"updateGalleryPhoto"`, `"setGalleryPhotoPublished"`, `"setGalleryAlbumCover"`, `"deleteGalleryPhoto"` and `"setGalleryAlbumPublished"` to `REQUIRED_ACTIONS` in `scripts/admin-guard-test.mts`. Run `npm run test:admin-guard -- --no-http`.
- [X] T033 [US2] Browser check: quickstart steps 7, 10, 11 and 15 (admin side). The public parts of steps 8–9 are checked in US3. Record the results in `verification.md` ("US2").

**Checkpoint**: Photos can be described, published, ordered, set as cover and deleted.

---

## Phase 5: User Story 3 - Visitors browse albums and photos (Priority: P1)

**Goal**: `/gallery` album cards and `/gallery/[slug]` masonry grid with the in-house lightbox, 404 and per-album metadata.

**Independent Test**: with one published album (4 published photos, 1 unpublished), run quickstart steps 8–9, 12–13 and 17 on desktop and at 360px with touch emulation.

- [X] T034 [P] [US3] Create `src/components/sections/gallery/GalleryAlbumCard.tsx` (server):
  - Props: `album: PublicAlbumCard`, `priority?: boolean`.
  - A `Card`-style article. The cover sits in a `relative aspect-[4/3] overflow-hidden` box, using `SafeImage fill` `object-cover`, `sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"`, `alt={cover.alt}`.
  - The H2 title holds a link to `/gallery/<slug>` with `after:absolute after:inset-0`, so the whole card is clickable. Below it, the date label and "N photos".
  - Visible focus ring on the card through `focus-within`.
- [X] T035 [P] [US3] Create `src/components/sections/gallery/GalleryGrid.tsx` (server) per contracts/routes-and-ui.md:
  - `<ul className="columns-2 gap-3 sm:columns-3 lg:columns-4">`. Each item is `<li className="mb-3 break-inside-avoid">` holding a `<button type="button" data-photo-index={i} aria-label={\`Open photo ${i + 1} of ${n}: ${alt}\`}>` with a visible focus ring.
  - Inside it, `SafeImage` with `width`/`height` from the record, `className="h-auto w-full rounded-lg"`, `sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"` and `priority={i < 2}`.
- [X] T036 [US3] Create `src/components/sections/gallery/GalleryLightbox.tsx` (client: state, key, pointer and focus handling, scroll lock) per research R11:
  - Props: `photos: PublicPhoto[]`, `children`. Render `<div onClick={delegate}>{children}</div>`; the delegate finds `closest("[data-photo-index]")` and opens at that index, remembering the button.
  - While open, render `<div role="dialog" aria-modal="true" aria-label={\`Photo ${i+1} of ${n}\`} className="fixed inset-0 z-50 flex flex-col bg-midnight/95 text-white">`. Inside it:
    - a top bar with the counter "N of M" and a Close button (`aria-label="Close"`, 44px, `X` icon)
    - the image area, `next/image` `src={optimizedUrl(src)}` with width/height, `sizes="100vw"`, `className="max-h-[80svh] w-auto object-contain"`, `priority`
    - Previous and Next buttons (`aria-label`, 44px, disabled at the ends)
    - the caption in a `<p aria-live="polite">`
  - `useFocusTrap(panelRef, open, () => openerRef.current)` from `@/hooks/useFocusTrap`. Lock `document.body.style.overflow` while open, as in `BookingDialog`.
  - `keydown`: Escape closes; ArrowLeft and ArrowRight move without wrapping.
  - Swipe: on `pointerdown` record x/y; on `pointerup` move when `|dx| > 50 && |dx| > |dy|`. Set `touch-action: pan-y` on the image area so vertical scrolling stays native.
  - Fade: `transition-opacity duration-200 motion-reduce:transition-none`. Never animate layout properties.
- [X] T037 [US3] Create `src/app/(site)/gallery/page.tsx`:
  - `export const revalidate = 3600`. Static metadata `{ title: "Gallery", description: "Photos from Tareeq workshops with teachers and students." }`.
  - `PageHeader` with H1 "Gallery" and a short intro.
  - Read `getPublishedAlbums()` in a try/catch; on failure, log the error name and treat the list as empty.
  - If there are albums, `<Container>` with a grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` of `GalleryAlbumCard` (the first gets `priority`). If there are none, render `<GalleryEmpty />` (created in US4; for now a temporary inline paragraph with the same text, which T041 replaces).
- [X] T038 [US3] Create `src/app/(site)/gallery/[slug]/page.tsx` and `not-found.tsx`, copying `programs/[slug]`:
  - `revalidate = 3600`, and `generateStaticParams` from `getPublishedAlbumSlugs()` (wrapped in a try/catch that returns `[]`).
  - `generateMetadata`:
    - `title` = album title, `description` = description or `Photos from ${title}, ${dateText}.`
    - `alternates.canonical` = `/gallery/<slug>`
    - `openGraph.images` = `[{ url: optimizedUrl(cover.src, 1200), width: cover.width, height: cover.height, alt: cover.alt }]`
    - `twitter: { card: "summary_large_image", … }`
  - Page: `notFound()` for null. A header with H1 title, the date label, the description and a "Back to all albums" link to `/gallery`. Then `<GalleryLightbox photos={album.photos}><GalleryGrid photos={album.photos} /></GalleryLightbox>`.
  - `not-found.tsx`: H1 "We couldn't find that album", text "It may have been moved or taken down.", and a `Button` "See all photos" to `/gallery`.
- [X] T039 [US3] Browser check: quickstart steps 8 (public parts), 9, 12, 13 and 17 at 360/390/1440px with touch emulation. Run Lighthouse mobile on `/gallery/<slug>` (targets: Performance 90+, Accessibility 95+, SEO 90+). Record the results in `verification.md` ("US3").

**Checkpoint**: The public gallery works and is accessible.

---

## Phase 6: User Story 7 - Owner-only access (Priority: P1)

**Goal**: prove that every gallery entry point refuses a caller with no session.

**Independent Test**: `npm run test:admin-guard` lists all 9 gallery actions as refused with no database or Cloudinary call; signed-out visits to the admin pages redirect.

- [X] T040 [US7] Confirm that `scripts/admin-guard-test.mts` lists all 9 gallery actions (from T024 and T032, plus `deleteGalleryAlbum` after T047). Run `npm run test:admin-guard` (with the dev server running). Then, signed out, visit `/admin/gallery`, `/admin/gallery/new` and `/admin/gallery/<id>` and confirm each redirects to `/admin/login`. Record the results in `verification.md` ("US7").

---

## Phase 7: User Story 4 - Empty states and navigation (Priority: P2)

**Goal**: a friendly empty /gallery, and Gallery in the nav only when an album is visible.

**Independent Test**: quickstart steps 1 and 14. On an empty database there is no nav link and /gallery shows the message; publishing one album with one visible photo shows the link.

- [X] T041 [P] [US4] Create `src/components/sections/gallery/GalleryEmpty.tsx` (server): a soft-blue panel with an `Images` icon (`aria-hidden`) and the H2 "Photos coming after our first workshop". The body reads "We'll share pictures here once our first workshop has run." It ends with a `Button` "Book a workshop" linking to `joinHref`. Use it in `src/app/(site)/gallery/page.tsx` in place of the temporary paragraph.
- [X] T042 [P] [US4] In `src/lib/site.ts`, add `export function navItemsFor({ gallery }: { gallery: boolean }): NavItem[]`. It returns Programs, Courses, then `{ label: "Gallery", href: "/gallery" }` when `gallery` is true, then Our Way. Keep the `navItems` export equal to `navItemsFor({ gallery: false })`, for any other importer.
- [X] T043 [P] [US4] Extend `tests/unit/site-links.test.ts` with `navItemsFor` cases: without the gallery the result equals `navItems`; with it, Gallery comes third and the hrefs are unique.
- [X] T044 [US4] Pass nav items through the shell (depends on T042; research R9; **Principle VIII: markup and styles unchanged**):
  - `src/app/(site)/layout.tsx` becomes `async`. Read `hasPublicGallery()` in a try/catch (on failure use `false` and log the error name), then compute `const items = navItemsFor({ gallery })`.
  - Pass `items` to `<Header items={items} />` and `<Footer items={items} />`.
  - `Header` passes `items` to `<DesktopNav items />` and `<MobileMenuContent items />`.
  - `DesktopNav`, `MobileMenuContent` and `Footer` map over the `items` prop instead of importing `navItems`. No class or markup changes.
- [ ] T045 [US4] Browser check: quickstart steps 1 and 14 (empty state, nav hidden and then shown in desktop nav, mobile menu and footer). Screenshot the home page at 390 and 1440px and compare with the baseline: the hero must be identical. Record the results in `verification.md` ("US4").

---

## Phase 8: User Story 5 - Latest photos on the workshop page (Priority: P2)

**Goal**: /workshop shows the 6 newest visible photos with a "See all photos" link, and hides the section when there are none.

**Independent Test**: with 0, 3 and 8 visible photos, /workshop shows no section, 3 photos, and the newest 6.

- [X] T046 [US5] Create `src/components/sections/WorkshopGallery.tsx` (async server component, research R16) and render it in `src/app/(site)/workshop/page.tsx` after the booking-button `Container`, before `BookingDialog`:
  - Read `getLatestPhotos(6)` in a try/catch (on failure, log and return `null`). Return `null` when the list is empty.
  - Otherwise render `<section aria-labelledby="workshop-gallery-heading">` in a `Container` with `pb-section`, containing:
    - the H2 "From our workshops"
    - a grid `grid-cols-2 sm:grid-cols-3 gap-3` of square tiles (`relative aspect-square overflow-hidden rounded-lg`, `SafeImage fill object-cover`, `sizes="(min-width:640px) 33vw, 50vw"`, `alt` from the record)
    - a `Button` "See all photos" to `/gallery` with `ChevronRight`
  - Update the page's header comment: the gallery section now exists (specs/032-admin-gallery).
  - Check with 0, 3 and 8 visible photos (quickstart step 8 workshop part, step 14). Record the results in `verification.md` ("US5").

---

## Phase 9: User Story 6 - Delete an album (Priority: P2)

**Goal**: delete an album with a confirmation that states the photo count. Its photos and assets are removed (best effort).

**Independent Test**: quickstart step 16.

- [X] T047 [US6] Add `deleteGalleryAlbum({ id })` to `src/lib/admin/gallery-actions.ts` (research R15):
  1. Validate the id and `connectDb`.
  2. `const photos = await GalleryPhotoModel.find({ album: id }).select("image.publicId").lean()`.
  3. `const album = await GalleryAlbumModel.findByIdAndDelete(id, { projection: { _id: 1 } }).lean()`; return `not_found` when it is null.
  4. `await GalleryPhotoModel.deleteMany({ album: id })`, then `refresh()` and `logAdmin("gallery", "ok", id)`.
  5. Destroy the assets in chunks of 5 with `Promise.allSettled(chunk.map(p => destroyAsset(p.image.publicId)))`.
  6. Return `{ ok: true, deletedPhotos: photos.length }`.

  Add `"deleteGalleryAlbum"` to `REQUIRED_ACTIONS` in `scripts/admin-guard-test.mts`.
- [X] T048 [US6] Create `src/components/admin/AlbumDeleteButton.tsx` (client: confirm dialog state and pending state):
  - Props: `albumId`, `title`, `photoCount`, `redirectTo?: string`.
  - It uses the existing `ConfirmDialog`. The text is "Delete this album and its N photos? This cannot be undone." when N > 0, otherwise "Delete this album?"
  - On success it shows a toast and calls `router.refresh()`, or `router.push(redirectTo)` when `redirectTo` is given.
  - Add it to the actions row of `GalleryAlbumAdminCard.tsx`, and to the album page (`[id]/page.tsx`, in a "Delete album" section at the bottom with `redirectTo="/admin/gallery"`).
- [X] T049 [US6] Run `npm run test:admin-guard -- --no-http`. In the browser, check quickstart step 16 (records and Cloudinary assets gone, public state back to empty). Record the results in `verification.md` ("US6").

---

## Phase 10: Polish & cross-cutting

- [ ] T050 [P] Accessibility pass on every new page:
  - Exactly one H1 per page, every input labelled, visible focus everywhere, no horizontal scroll at 360px, 44px targets.
  - In the lightbox, check focus return and Tab containment with the keyboard only.
  - Fix any issue in the file concerned.
- [X] T051 [P] Grep the new files for hardcoded hex values, `console.log`, and logs that include titles, captions or alt text, and fix any hits. Confirm `"use client"` appears only in `GalleryAlbumForm`, `GalleryUploader`, `PhotoDetailsForm`, `PhotoCoverButton`, `GalleryLightbox` and `AlbumDeleteButton`, each with a reason comment.
- [ ] T052 Final run:
  - `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build` and `npm run test:admin-guard`.
  - Run the full quickstart (steps 1–17) once more.
  - Write the final results and the counts compared with the baseline to `verification.md` ("Final").

---

## Dependencies & execution order

- **Setup (T001)**, then **Foundational (T002–T015)**, which blocks every story.
  - T005 must come before T006 and T022.
  - T007 must come before T012 and T013.
  - T008 must come before T012 and T013.
- **US1 (T016–T025)** comes first and is the MVP.
- **US2 (T026–T033)** builds on US1's album page and actions file.
- **US3 (T034–T039)** needs published data, so it needs US2 to create visible photos. It does not depend on US2's code.
- **US7 (T040)** runs after US1 and US2 have added their actions. It is re-run after T047.
- **US4 (T041–T045)** needs `hasPublicGallery` (T013) and the /gallery page (T037).
- **US5 (T046)** needs only Foundational. It can run in parallel with US3 or US4.
- **US6 (T047–T049)** needs US1 (album card and page).
- **Polish (T050–T052)** comes last.

### Same-file sequencing (not [P])

- `src/lib/admin/gallery-actions.ts`: T016 → T017 → T026 → T047
- `scripts/admin-guard-test.mts`: T024 → T032 → T047
- `src/app/admin/(panel)/gallery/[id]/page.tsx`: T023 → T030 → T048
- `src/components/admin/GalleryAlbumAdminCard.tsx`: T019 → T031 → T048
- `src/app/(site)/gallery/page.tsx`: T037 → T041

## Parallel examples

```text
Foundational, after T002:  T003, T004, T008, T010, T014 together; then T009 and T011 with T007
US1:  T018 (album form) and T019 (album card) while T016/T017 (actions) are written
US2:  T027 (PhotoDetailsForm) and T028 (PhotoCoverButton) together, then T029
US3:  T034 (album card) and T035 (grid) together, then T036 (lightbox)
US4:  T041, T042 and T043 together, then T044
US5:  T046 can run beside US3 or US4 (different files)
```

## Implementation strategy

1. **MVP**: Setup + Foundational + US1 lets the owner create albums and upload photos safely (unpublished, hidden). Stop and verify.
2. Add **US2**. Photos can now be published, but nothing renders publicly yet, which is safe.
3. Add **US3** and **US7**. The public gallery goes live behind owner-only actions. This completes every P1 story.
4. Add **US4** (nav and empty state), **US5** (workshop strip) and **US6** (album delete).
5. **Polish** and final verification. Then follow the branch rule: commit, merge to main, delete the branch.

Each phase ends with its browser and test checkpoint (Principle VII). Do not start the next phase until it is confirmed.
