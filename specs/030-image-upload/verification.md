# Verification: Admin image upload and editable site images

**Date**: 2026-11-11 | **Branch**: `030-image-upload`

## Automated (passing)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | clean |
| `npm run test:unit` | 235 pass, 0 fail (new: `images-shared`, `site-images-merge`) |
| `npm run test:admin-guard -- --no-http` | PASS: 19 Server Actions refused with no session; `signUpload` and `saveSiteImages` included; the Cloudinary SDK (sign, resource, destroy, upload) is stubbed to throw, and nothing reached it |
| `npm run build` | passes; `/admin/settings/images` is a dynamic route |
| Secret exposure | `CLOUDINARY_API_SECRET` and `from "cloudinary"` appear only in `src/lib/cloudinary/server.ts`; no client component imports it; the secret is not in `.next/static` |
| Code-owned images untouched | no change to `Hero.tsx`, `RobotEyes.tsx`, `Preloader.tsx`, `Logo.tsx`, how-it-works components or `public/` |

## Smoke checks on a production build

- Home page renders `/founder.jpeg` (the default) with an empty database path.
- `/admin/settings/images` with no session redirects to `/admin/login` (307).

## T020: cover image uploads in the browser (passing, 2026-11-12)

`scripts/image-upload-check.mjs` against a production build (`next start`), real Cloudinary uploads, `tareeq_dev` database.
It creates a temporary published program and course and deletes them, and every asset it uploaded, at the end.
Result: **46 passed, 0 failed**. Screenshots in `shots/030/` (git-ignored).

| Area | Checked |
|---|---|
| Legacy URL record | shown in the admin as the current image with Replace and Remove; renders on the public card and detail page with no migration; cleared once replaced |
| Rejected files (1440 and 360) | GIF shows "Use a JPG, PNG or WebP image."; 6 MB JPG shows the 5 MB message; no request reaches Cloudinary; record unchanged |
| Cloudinary unreachable | "The upload did not finish..." shown; the current image stays; record unchanged |
| Missing alt text (1440 and 360) | save blocked, alt field marked invalid with the message, toast "Please check the highlighted fields."; record unchanged |
| Upload and save | stored `{url, publicId, width, height, alt}` in `tareeq/program` and `tareeq/course`; public card, detail page and `og:image` use it; public `img` goes through `/_next/image` with `f_auto,q_auto` |
| Replace | progress bar shown; alt text kept; new publicId saved; old asset deleted from Cloudinary |
| Remove | record cleared; asset deleted from Cloudinary; card and detail page show the brand pattern |
| Keyboard only (360) | Tab reaches the uploader, which shows a focus outline; Enter opens the file chooser; Tab to alt text and type; save with Enter; after Remove, focus returns to the uploader |
| Reduced motion (360) | progress bar transition 0.01 ms, no animation |
| Layout | no horizontal scroll at 360 (edit page, errors shown, public detail page) or 1440 |

Notes from the run, none of them app defects:
- Test harness: a made-up `x-forwarded-for` header (for the sign-in limit) must be sent to our server only. Sent to Cloudinary, it fails the CORS preflight and the upload shows "did not finish".
- Pressing a key before the form hydrates does nothing; once loaded, Enter and mouse each opened the file chooser 10 of 10 times.
- Next.js expands `$` in `ADMIN_PASSWORD_HASH` even from the process environment, so a hash passed on the command line needs each `$` escaped, the same as in `.env.local`.

## T028 and T031: site images and server re-checks (passing, 2026-11-12)

`scripts/site-images-check.mjs` against `next start`, real Cloudinary, `tareeq_dev`. Result: **32 passed, 0 failed**.
The dev database already held an owner-uploaded founder photo. The script sets the site images record aside without touching
the file (replacing it through the app would delete it), and restores it exactly at the end; the run confirmed the record is
identical and the owner's Cloudinary file still exists.

| Area | Checked |
|---|---|
| Admin page | Settings links to `/admin/settings/images`; empty slot previews `/founder.jpeg` with the "Default" chip and the recommended size; Save disabled until something changes; unsaved-changes note |
| Save | blocked without alt text; saved photo stored in `tareeq/site` with width, height and alt |
| Home page | shows the new photo with its alt text on the next load (cache tag refreshed on save) |
| Use default image | clears the slot, deletes the old Cloudinary file, home page returns to `/founder.jpeg` |
| Broken stored URL | home page swaps to `/founder.jpeg` (loaded) within 3 s; no broken image |
| 360 px | no horizontal scroll on the images page or home page; uploader reachable with Tab |
| T031 (upload reply tampered in the browser, saved through the real form) | oversized PNG (5.6 MB), PDF, GIF, wrong folder (`samples/...`) and nonexistent id are each refused with "This image could not be accepted. Upload it again."; the record is unchanged; the PNG, PDF and GIF are deleted from Cloudinary by the server |

## T035: quickstart and Lighthouse (2026-11-12)

Quickstart steps 2 to 6 and 9 are covered by the two scripts above; step 8 by the automated table at the top.
Step 7, with the three Cloudinary values blanked: the uploader shows "Uploads are not set up yet..."; nothing is sent to
Cloudinary; `/`, `/programs`, `/courses` and `/our-way` return 200 with no broken images.

Mobile Lighthouse on `/` (`next start`, three runs; the owner's dev server was left running and the connection was slow):

| Run | Performance | Accessibility | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| 1 | 57 | 100 | 100 | 4337 ms | 1340 ms | 0 |
| 2 | 69 | 100 | 100 | 1246 ms | 1342 ms | 0 |
| 3 | 67 | 100 | 100 | 1255 ms | 1560 ms | 0 |

Accessibility, SEO and layout shift pass. Performance misses the 90 target, as it has on every local home page run since
feature 015 (55 to 89, TBT about 1,300 to 1,500 ms; see `specs/015-programs-pages/baseline.md`). These runs sit inside that
range with the same TBT, so they show no sign of a regression, but no side-by-side run against the pre-030 build was made.
The founder photo is below the fold and lazy-loaded.

## Notes

- The mentor photo merge is done in `MentorSection.tsx` (not in `src/content/index.ts`), so the content module stays free of server-only reads. `src/content/mentor.ts` keeps the default photo's alt text.
- `ImageUploader` uploads with a plain `XMLHttpRequest` to Cloudinary for progress events; the preview uses a plain `<img>` (blob, Cloudinary or legacy URL).
