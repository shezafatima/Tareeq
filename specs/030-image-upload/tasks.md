# Tasks: Admin image upload and editable site images

**Input**: `specs/030-image-upload/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)
**Tests**: Pure-logic unit tests and the extended admin guard test are included, because the spec requires the unauthenticated-action test to be extended (FR-016). No component tests.
**Format**: `- [ ] ID [P?] [Story] description with file path`. `[P]` means a different file with no dependency on an unfinished task.

User stories (from spec.md): **US1** cover images for programs and courses (P1), **US2** editable site images (P2), **US3** owner-only uploading (P1, cross-cutting, verified in its own phase).

---

## Phase 1: Setup

- [X] T001 Install the server-side SDK with `npm install cloudinary` (exact version pinned in `package.json`, as the other dependencies are), and confirm it is imported only from `src/lib/cloudinary/server.ts`.
- [X] T002 [P] Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to `.env.example` under a "Image uploads (feature 030). Server-only; never commit real values." block, with a note that the secret never reaches the browser and uploads are disabled when any is missing.

---

## Phase 2: Foundational (blocks all stories)

- [X] T003 Create `src/lib/images/shared.ts` (pure, relative imports only): `StoredImage` type, `IMAGE_LIMITS` (5 MB, allowed MIME `image/jpeg|png|webp`, extensions, alt max 200, folder prefix `tareeq/`), `validateFile({name,type,size})` returning a message or null, `imageSchema` (zod mini; alt required and trimmed), `isOurCloudinaryUrl(url, cloudName?)`, and `optimizedUrl(url, width?)` that inserts `f_auto,q_auto` (and `w_N`) after `/upload/` and returns non-Cloudinary URLs unchanged.
- [X] T004 [P] Create `src/lib/images/slots.ts` (pure): `SITE_IMAGE_SLOTS` registry with one entry `founderPhoto` (label "Founder photo", recommended "1122 x 1402 (4:5 portrait)", default `/founder.jpeg`, 1122 x 1402, default alt from `src/content/mentor.ts`), a `SlotKey` type, and `isSlotKey()`.
- [X] T005 [P] Write `tests/unit/images-shared.test.ts`: `validateFile` accepts jpg/png/webp at 5 MB and rejects gif, svg, 5 MB + 1 byte, empty file and a MIME/extension mismatch; `imageSchema` rejects missing or blank alt and accepts a valid image; `optimizedUrl` inserts the transform once, is idempotent, and leaves `/founder.jpeg` and non-Cloudinary hosts unchanged.
- [X] T006 Create `src/lib/cloudinary/server.ts` (`import "server-only"`): `isConfigured()`, `signUploadParams(scope)` (signs `allowed_formats`, `folder` = `tareeq/<scope>`, `timestamp` with the SDK; never returns the secret), `verifyAsset(publicId)` (Admin API `resource`; require format jpg/png/webp, bytes <= 5 MB, type `upload`, publicId under `tareeq/`, URL on our cloud; return the server's url, width, height or throw a typed rejection; delete the stray asset best effort on rejection), and `destroyAsset(publicId)` (swallow errors and log `[images] destroy failed: <ErrorName>` only).
- [X] T007 Create `src/lib/admin/images-verify.ts` (`import "server-only"`): `resolveImageChange(prev, next)` returns `{ image | null, toDelete: publicId | null }`; an unchanged publicId skips `verifyAsset` and only takes the new alt; a new publicId is verified and the server's url/width/height replace the client's.
- [X] T008 Create `src/lib/admin/images-actions.ts` (`"use server"`) with `signUpload` wrapped in `withAdmin` per `contracts/server-actions.md`: validates `scope`, returns `not_configured` when env is missing, never returns the secret. (`saveSiteImages` is added in T022.)
- [X] T009 [P] Create `src/components/ui/SafeImage.tsx` (`"use client"`, reason: `onError` handler and state): wraps `next/image`, takes `src`, `fallbackSrc`, `alt`, `width`, `height`, `sizes`, `className`; on error switches once to `fallbackSrc`; passes the Cloudinary URL through `optimizedUrl`.
- [X] T010 Create `src/components/admin/ImageUploader.tsx` (`"use client"`, reason: state, file APIs, XHR) per `contracts/routes-and-ui.md`: drop zone as a labelled button over a hidden file input; client `validateFile`; calls `signUpload`, then uploads to `https://api.cloudinary.com/v1_1/<cloud>/image/upload` with XHR for progress and cancel; states empty, dragging, rejected, uploading, uploaded, legacy, not configured, failed with retry; required alt text field with its own error; Replace and Remove buttons; 44px targets; progress with `role="progressbar"`; `aria-live="polite"` messages; focus returns to the zone after Remove; no easing on the progress bar under reduced motion; works at 360px. Reuse existing admin `Field`/button styles and tokens (no hardcoded hex).

**Checkpoint**: `npm run test:unit` passes T005; `npx tsc --noEmit` and `npm run lint` are clean.

---

## Phase 3: User Story 1 - Cover images for programs and courses (P1)

**Goal**: the owner uploads, replaces and removes a cover from both admin forms, and public cards, detail pages and share images use it, with a brand pattern fallback and no breakage for legacy URLs.
**Independent test**: quickstart steps 5 and 3-4 (upload, replace, remove, legacy record, invalid file, missing alt).

- [X] T011 [P] [US1] Add optional `coverImage` sub-document (`url, publicId, width, height, alt`; `_id: false`) to `src/lib/programs/model.ts` and `src/lib/courses/model.ts`, leaving `coverImageUrl` as is.
- [X] T012 [P] [US1] Add `coverImage?: StoredImage` to the public types in `src/lib/programs/options.ts` and `src/lib/courses/options.ts` (including the course card `Pick` list), and map it in `src/lib/programs/data.ts`, `src/lib/courses/data.ts` and `src/lib/courses/view.ts`.
- [X] T013 [US1] Add `coverImage` (nullable `imageSchema`) to `src/lib/admin/programs-schema.ts` and `src/lib/admin/courses-schema.ts`; keep the legacy `coverImageUrl` value in form state as read-only `legacyCoverUrl`, and add the `MESSAGES` entries (alt required, image rejected).
- [X] T014 [US1] Update `src/lib/admin/programs-actions.ts` and `src/lib/admin/courses-actions.ts`: in create and update, run `resolveImageChange`, write `coverImage`, `$unset` `coverImageUrl` when a new image is saved or the image is removed, then `destroyAsset` the replaced asset after the write; map a rejection to `image_rejected`; in delete, best-effort destroy the cover (research R9). Add `image_rejected` to `src/lib/admin/result.ts` if the codes are enumerated there.
- [X] T015 [P] [US1] Update the admin read helpers `src/lib/admin/programs-read.ts` and `src/lib/admin/courses-read.ts` to return `coverImage` and the legacy URL for the form.
- [X] T016 [US1] Replace the `coverImageUrl` text field with `ImageUploader` (scope `program`, with the legacy URL passed in) in `src/components/admin/ProgramForm.tsx`, and with scope `course` in `src/components/admin/CourseEditor.tsx`; update the field `ORDER` lists and unsaved-changes tracking; keep field error focus working for the alt text.
- [X] T017 [P] [US1] Update `src/components/admin/ProgramPreview.tsx` and `src/components/admin/CoursePreview.tsx` to preview the new image (or legacy URL).
- [X] T018 [US1] Update `src/components/sections/programs/ProgramCover.tsx` to take `coverImage` and `legacyUrl`, prefer the stored image, use `optimizedUrl` and an `onError` hide (via `SafeImage` or a small variant) so the brand pattern underneath shows; keep `aria-hidden` and `priority` behavior. Update its callers in `ProgramPanel.tsx`, `CourseCard.tsx`, `CourseHeader.tsx`, `ProgramHeader.tsx`.
- [X] T019 [P] [US1] Update the share image in `src/app/(site)/programs/[slug]/page.tsx` and `src/app/(site)/courses/[slug]/page.tsx` to use `coverImage` (optimized URL, stored width and height, stored alt), then the legacy URL, then the existing `/robot.png`.
- [x] T020 [US1] Verify US1 in the browser: quickstart steps 3, 4 and 5 at 360px and 1440px, keyboard only, and with reduced motion.

**Checkpoint**: US1 works alone.

---

## Phase 4: User Story 2 - Editable site images (P2)

**Goal**: the owner replaces the home page founder photo from `/admin/settings/images`; an empty slot or failed image shows `/founder.jpeg`.
**Independent test**: quickstart steps 2 and 6.

- [X] T021 [P] [US2] Create `src/lib/site-images/model.ts` (`server-only`): single doc `_id: "images"`, optional `founderPhoto` sub-document, collection `siteimages`, timestamps, same pattern as `src/lib/settings/model.ts`.
- [X] T022 [US2] Create `src/lib/site-images/data.ts` (`server-only`): `readStoredSiteImages()` (uncached, throws on database error), `getSiteImages()` (`unstable_cache` with tag `site-images`, 3600 s, wrapped in `react.cache`, never throws, logs only the error name) returning each registry slot as `{ src, width, height, alt, isDefault }`, ignoring unknown stored keys. Put the pure merge in `src/lib/site-images/merge.ts` for testing.
- [X] T023 [P] [US2] Write `tests/unit/site-images-merge.test.ts`: empty database gives defaults with `isDefault: true`; a stored image overrides; an unknown stored key is ignored; a stored value with a missing url falls back to the default.
- [X] T024 [US2] Add `saveSiteImages` (`withAdmin`) to `src/lib/admin/images-actions.ts`: validate, `resolveImageChange` per slot, upsert with `$set`/`$unset`, destroy replaced assets after the write, `revalidateTag("site-images", { expire: 0 })`, `revalidatePath("/admin/settings/images")`, `logAdmin`, and return the new values; errors `invalid`, `image_rejected`, `unavailable`.
- [X] T025 [US2] Create `src/components/admin/SiteImagesForm.tsx` (`"use client"`, reason: form state and the save action): one card per registry slot with label, recommended size, current preview with a "Default" chip, `ImageUploader` (scope `site`), "Use default" action, Save using `useActionFeedback`, `Toast` and `useUnsavedChanges`, matching `SettingsForm.tsx`.
- [X] T026 [US2] Create `src/app/admin/(panel)/settings/images/page.tsx`: `requireAdmin()`, `safeLoad(readStoredSiteImages)`, `UnavailableNotice` on failure, `metadata` title "Site images"; add a "Site images" link to `src/app/admin/(panel)/settings/page.tsx`.
- [X] T027 [US2] Make the mentor photo editable: in `src/content/index.ts`, merge `getSiteImages().founderPhoto` into the mentor content's `photo`; update `src/components/sections/MentorPhoto.tsx` to render through `SafeImage` with `/founder.jpeg` as the fallback and the stored alt. Do not change the `.mentor-glow` styling or the 4:5 frame. Keep `src/content/mentor.ts` as the default source.
- [x] T028 [US2] Verify US2 in the browser: quickstart steps 2 and 6 at 360px and 1440px; confirm the home page picks up a new photo on the next load and returns to `/founder.jpeg` after "Use default".

**Checkpoint**: US1 and US2 both work.

---

## Phase 5: User Story 3 - Owner-only, verified uploading (P1)

**Goal**: prove that nothing uploads or saves without a session and that the server rejects bad files.
**Independent test**: `npm run test:admin-guard`; quickstart step 3.

- [X] T029 [US3] Extend `scripts/admin-guard-test.mts`: add `signUpload` and `saveSiteImages` to `REQUIRED_ACTIONS`; stub the `cloudinary` module (throwing on any call) before importing the actions so the test fails if signing, the Admin API or destroy is reached without a session; assert each new action returns `{ok:false, code:"unauthorized"}`; update the header comment to cite spec 030 FR-016.
- [X] T030 [US3] Confirm the existing program and course actions (create, update, delete) still report unauthorized under the same test with the new `coverImage` argument shape, and that no Route Handler was added (test part B).
- [x] T031 [US3] Manual server-verification check: with a valid session, send a save whose `publicId` points to a non-image, an oversized file, a wrong folder and a nonexistent id (use a short `tsx` script or the browser devtools); each must return `image_rejected` and leave the record unchanged.

---

## Phase 6: Polish and cross-cutting

- [X] T032 [P] Confirm the secret never reaches the client: search the built output and `src/components` for `CLOUDINARY_API_SECRET` and for any import of `cloudinary` outside `src/lib/cloudinary/server.ts` and `src/lib/admin/*`.
- [X] T033 [P] Confirm the excluded images are unchanged: `git diff` shows no change to `Hero.tsx`, `RobotEyes.tsx`, `Preloader.tsx`, `Logo.tsx`, how-it-works components or `public/`.
- [X] T034 Run `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run test:admin-guard` and `npm run build`; fix anything they report.
- [x] T035 Run the whole `quickstart.md` at 360px and 1440px, keyboard only, with reduced motion on; spot-check Lighthouse (mobile) on the home page for no regression in Performance, Accessibility and SEO.
- [x] T036 Write `specs/030-image-upload/verification.md` with the results of T020, T028, T031, T034 and T035, then follow the one-feature-per-branch rule: commit, merge to main, delete the branch.

---

## Dependencies and order

- Setup (T001-T002) -> Foundational (T003-T010) -> US1 and US2 -> US3 -> Polish.
- T003 blocks T005-T010. T006 blocks T007 and T008. T010 needs T003, T008 and T009.
- US1 and US2 are independent once Phase 2 is done; both need `ImageUploader`. US1 order: T011/T012 -> T013 -> T014 -> T015/T016 -> T017/T018/T019 -> T020.
- US2 order: T021 -> T022 -> T024 -> T025 -> T026 -> T027 -> T028 (T023 any time after T022's merge module).
- US3 (T029-T031) needs the actions from T008, T014 and T024.

## Parallel examples

- After T003: T004, T005 and T009 together.
- US1 first wave: T011, T012 and T015 together (different files).
- US1 and US2 can proceed in parallel by two people once T010 is done.

## Implementation strategy

- **MVP**: Phases 1-2 plus US1 (covers) delivers the upload foundation and the most-used admin improvement, and can ship alone.
- Then US2 (founder photo), then US3 verification, then Polish. Each phase ends with lint, types, tests and a browser check (Constitution VII).
- Unplanned addition to confirm: destroying the cover when a program or course is deleted (T014, research R9).
