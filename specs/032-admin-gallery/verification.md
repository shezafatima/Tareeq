# Verification: Admin gallery

## Baseline (branch 032-admin-gallery, before changes, 2026-11-12)

- `npm run lint`: clean
- `npx tsc --noEmit`: clean
- `npm run test:unit`: 241 tests, 241 pass
- `npm run build`: succeeds
- `npm run test:admin-guard -- --no-http`: PASS, 7 action files, 23 actions

## Foundational (T002-T015)

- `npx tsc --noEmit`: clean
- `npm run lint`: clean
- `npm run test:unit`: 253 tests, 253 pass (241 baseline + 12 new: gallery-view 6, gallery-schema 6)
- ImageUploader now uses `uploadToCloudinary` (src/lib/images/upload-client.ts); the browser re-test of the founder photo upload is done with US1 (T025).

## Implementation checks (automated and curl)

Run against `npm run build` + `next start` on port 3100 with the project's real `.env.local`. **No data was written**: the database
has no gallery records, so these are the empty-state paths.

- `npx tsc --noEmit`, `npm run lint`: clean. `npm run build`: succeeds; `/gallery` static (revalidate 1h), `/gallery/[slug]` SSG, `/admin/gallery`, `/admin/gallery/new`, `/admin/gallery/[id]` dynamic.
- `npm run test:unit`: 254 tests, 254 pass (+13 over baseline: gallery-view 6, gallery-schema 6, nav 1).
- `npm run test:admin-guard` (with HTTP): PASS. 8 action files, **32 actions** (23 + 9 gallery), each refused with no session and no database or Cloudinary call. Includes `signUpload({scope:"gallery"})` and `addGalleryPhoto`.
- `GET /gallery` -> 200 with "Photos coming after our first workshop".
- `GET /gallery/nope` -> 404 with the album not-found page.
- Home page has no `href="/gallery"` (nav hidden when empty). `/workshop` has no "From our workshops" section.
- Signed out: `/admin/gallery`, `/admin/gallery/new`, `/admin/gallery/<id>` -> 307 to `/admin/login`.
- Code audit of new files: no hex colours, no `console.log`, no titles/captions/alt in logs. `"use client"` only on GalleryAlbumForm, GalleryDeleteButton, GalleryUploader, PhotoCoverButton, PhotoDetailsForm, GalleryLightbox.

## Browser walkthrough (quickstart) with real uploads, 2026-11-12

Run with Playwright (installed Chromium) against `next start` on :3100, a throwaway admin login (temporary `.env.production.local`, deleted after),
the project real MongoDB and Cloudinary. Test album titled "ZZ QA Teacher workshop, Karachi"; **everything it created was deleted through the
admin itself** and verified gone (database pages and Cloudinary). A pre-existing album "ai" (7-9-26, 2 photos, published) was found and left
untouched (checked identical before and after). Scripts and screenshots are in the session scratchpad, not in the repo.

**Result: 99 checks run, 97 passed.** The 2 that did not pass as written were my assertions, not the app: (1) "empty state shown" assumed an
empty gallery, but the database already had the public "ai" album; (2) reduced-motion fade is 1e-05s through the site global reduced-motion rule
(effectively instant; normal motion is 0.2s), and my check wanted exactly 0.

- **Albums and upload (US1)**: sidebar entry; album created, slug `zz-qa-teacher-workshop-karachi`; consent notice above the upload zone; 12 files
  dropped at once (10 PNG + 1 GIF + 1 9.7 MB PNG): at most 3 uploading at the same time, GIF and oversized file fail alone with the type and size
  messages and a Retry button, the 10 others become cards; every new card shows "Missing alt text".
- **Alt gate and curation (US2)**: switch on an alt-less photo is aria-disabled, does not publish, reason reachable on keyboard focus; after alt text
  and publish, badge count drops; album published from the grid; Set as cover updates the admin Cover chip, the public card and og:image; unpublishing
  the cover falls back to the first visible photo; order 0 puts a photo first publicly; clearing alt on a published photo unpublishes it
  (toast says so) and it leaves the public page and the card count; **a forged publish request (replayed server action with an alt-less photo id)
  was refused by the server with "Add alt text before publishing this photo." and left the photo unpublished**.
- **Public (US3/US4/US5)**: /gallery card shows the cover, title, date, "4 photos"; Gallery appears third in the desktop nav and the footer
  (Programs, Courses, Gallery, Our Way); album page: h1, 4 photos, meta title, og:image is a Cloudinary `f_auto,q_auto` URL; unpublished album
  returns 404, vanishes from /gallery and from the /workshop strip; /workshop shows "From our workshops" (max 6) with "See all photos" to /gallery.
- **Lightbox**: Enter opens at the focused photo (labelled "Photo N of M", aria-modal, caption, counter, body scroll locked, focus inside); arrows
  move and stop at both ends; 18 Tab/Shift+Tab presses never leave the dialog; Esc and Close return focus to the opening photo; touch at 360px:
  swipe left/right moves, mostly-vertical and short (<50px) swipes are ignored, no wrap, controls >= 44px.
- **Images**: grid images load through `/_next/image` with `f_auto,q_auto`, explicit `sizes`, alt on all; first two eager, the rest lazy.
- **360px**: no horizontal scroll on /gallery, album, /workshop, the album 404, /admin/gallery, /admin/gallery/new and the album admin page.
- **Delete (US6)**: photo delete confirms, Cancel changes nothing, confirm removes it and its Cloudinary asset; album delete confirmation says
  "Delete this album and its 9 photos?", Cancel keeps it, confirm removes the album, admin page becomes not found, /gallery/<slug> 404, and
  all 9 remaining assets are destroyed (10 of 10 including the photo deleted earlier).
- **ImageUploader regression (T006)**: founder-photo slot in Settings -> Images uploads through the shared helper to `tareeq/site/`, shows the alt
  field and progress; asset destroyed afterwards, nothing saved.
- **Lighthouse (mobile, default throttling, local production build)**: accessibility 100, SEO 100, best practices 100 on /gallery and
  /gallery/ai. **Performance does not reach the 90 target**: /gallery 79 (warm; 60 on the first cold run), album page 76, CLS 0, LCP about 3.8 s.
  The same run on existing pages gives /programs 66 and /our-way 67 (TBT 750-950 ms), so the gap is site-wide in this setup (6 s preloader,
  client JS), and the gallery pages score higher than those. Not a gallery-specific regression, but the Principle VI gate is not met in this
  measurement either way.

## Still not verified

- Quickstart steps 1 and 14 in the browser with **no** public album (nav link hidden, /gallery empty message): the real database now has the public
  "ai" album, and I did not unpublish it. Covered earlier by curl before that album was public, and by the navItemsFor unit test.
- Hero visual comparison after the Header/nav prop change (T045): not pixel-compared; the diff to Header/DesktopNav/MobileMenuContent/Footer is props-only.
- T050 accessibility pass on the admin pages (no Lighthouse run behind the login; keyboard behaviour of the public viewer was tested).
- /workshop with exactly 3 and 8 photos (saw 6 with the "ai" album present).

## Deviations from the plan

- One shared `GalleryDeleteButton` (photos and albums) instead of `AlbumDeleteButton` plus a photo variant, to avoid two copies (Principle II).
- `gallery/data.ts` also exports `loadPublishedAlbums`, `hasPublicGallerySafe`, `getLatestPhotosSafe` (error handling as in programs R2 / plan R9).
