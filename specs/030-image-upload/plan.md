# Implementation Plan: Admin image upload and editable site images

**Branch**: `030-image-upload` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

## Summary

The browser uploads straight to Cloudinary using a short-lived signature that a session-checked Server Action issues; the API secret never leaves the server. One reusable `ImageUploader` (client leaf) validates type and size, shows preview and progress, and holds `{url, publicId, width, height, alt}` in form state. On save, a Server Action re-verifies the asset with Cloudinary's Admin API (format, bytes, size, our folder), stores the server's numbers (not the client's), and deletes the replaced or removed asset best-effort.

- **Programs and courses**: a new `coverImage` sub-document next to the legacy `coverImageUrl`. The public side prefers `coverImage`, then the legacy URL, then the brand pattern. No migration.
- **Site images**: a code-defined slot registry (one slot today: `founderPhoto`, default `/founder.jpeg`), stored in a new single-document collection, read through server-only `getSiteImages()` (`unstable_cache`, tag `site-images`). The mentor section reads its photo through it.
- **Failure fallback**: a small client leaf swaps a failed image for the default file (slots) or hides it so the brand pattern shows (covers).
- **Security**: signing and every save are `withAdmin` Server Actions. No Route Handler is added, so the guard test's "no route handlers" rule still holds. `scripts/admin-guard-test.mts` gains the new actions.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router)
**Primary Dependencies**: existing mongoose 9, zod 4 (mini), next-auth 5. **New: `cloudinary` (server-side only)**, explicitly allowed (Constitution IX)
**Storage**: MongoDB (`programs` and `courses` get an optional `coverImage` sub-doc; new `siteimages` collection); Cloudinary for files
**Testing**: `node --test` unit tests (`tests/unit`), `npm run test:admin-guard` extended, manual browser checks (quickstart.md)
**Target Platform**: Node runtime; admin routes dynamic
**Project Type**: Single Next.js web app (`src/`)
**Performance Goals**: public pages gain no client JS beyond one tiny `onError` leaf; images served as `f_auto,q_auto` at responsive widths. Admin save adds one Admin API call per changed image.
**Constraints**: 360px, 44px targets, keyboard operable, reduced motion, Server Components by default, secrets only in env
**Scale/Scope**: 1 new route, 1 uploader, 1 form, 1 leaf, about 6 lib modules, 2 model fields, 2 new unit test files

## Constitution Check

*Passes before research and after design.*

| Principle | Status | How |
|---|---|---|
| I. Mobile first | ✅ | Uploader is a single column with 44px controls and no horizontal scroll at 360px. |
| II. Reusable components | ✅ | One `ImageUploader` used in both forms and the site-images page; one `SafeImage` leaf; slots come from one registry. |
| III. Brand system | ✅ | Tokens only; same field and button styles as other admin forms. |
| IV. Accessible | ✅ | Real file input behind a labelled button; drop zone is a button, not a div; progress is `role=progressbar` plus a live status; errors tied with `aria-describedby`; alt text is a labelled required field. Public alt text comes from the stored value. |
| V. Protect data | ✅ | `withAdmin` on signing and every save; server re-verifies before saving; secret stays in env; logs carry only error names. |
| VI. Fast | ✅ | `next/image` with explicit `sizes`; `f_auto,q_auto`; stored width and height prevent layout shift. |
| VII. Small steps | ✅ | Milestones below, each ending with lint, types, tests, build and a browser check. |
| VIII. Don't touch the hero | ✅ | Hero, robot and eyes overlay untouched. |
| IX. No surprise dependencies | ✅ | Only the `cloudinary` SDK, approved in the request, server-only. |
| X. Safest option | ✅ | Missing config disables uploading with a clear message; an empty or failed image always falls back to a shipped file or the brand pattern. |
| XI. Server Components | ✅ | Client only for `ImageUploader` (state, file APIs, XHR), `SafeImage` (`onError`) and the existing form components. |

## Project Structure

### Documentation

```text
specs/030-image-upload/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── server-actions.md
    └── routes-and-ui.md
```

### Source (changes)

```text
src/lib/images/
├── shared.ts            # pure: StoredImage, LIMITS, validateFile(), imageSchema, optimizedUrl(), isOurCloudinaryUrl()
└── slots.ts             # pure: SITE_IMAGE_SLOTS registry (key, label, recommended size, default file)
src/lib/cloudinary/
└── server.ts            # server-only: config check, signUploadParams(), verifyAsset(), destroyAsset()
src/lib/site-images/
├── model.ts             # server-only: single doc, _id "images"
└── data.ts              # server-only: getSiteImages() (tag "site-images"), readStoredSiteImages()
src/lib/admin/
├── images-actions.ts    # "use server": signUpload, saveSiteImages (withAdmin)
├── images-verify.ts     # server-only: resolveImageChange(prev, next) -> verified image + asset to delete
└── programs-* / courses-*   # coverImage added to schema, actions, read, form values
src/components/admin/
├── ImageUploader.tsx    # client
├── SiteImagesForm.tsx   # client
└── ProgramForm / CourseEditor / *Preview   # uploader replaces the URL field
src/components/ui/SafeImage.tsx                      # client leaf: onError -> fallback
src/components/sections/programs/ProgramCover.tsx    # takes image object + legacy url
src/components/sections/MentorPhoto.tsx              # SafeImage with default fallback
src/content/index.ts                                 # getMentor merges getSiteImages().founderPhoto
src/app/admin/(panel)/settings/images/page.tsx       # new; link added on settings/page.tsx
src/lib/programs|courses/{model,data,options,view}.ts   # coverImage
.env.example, scripts/admin-guard-test.mts
tests/unit/images-shared.test.ts, tests/unit/site-images-merge.test.ts
```

`next.config.ts` already allows `res.cloudinary.com`, so it needs no change.

**Structure Decision**: follow the 022/028 layout: pure modules importable by tests with relative imports, `server-only` data modules, and `*-actions.ts` files wrapped by `withAdmin`.

## Milestones

1. **Foundation**: dependency, env, `images/shared.ts` and tests, `cloudinary/server.ts`, `signUpload` action, guard-test update.
2. **Uploader**: `ImageUploader` with all states, tried first on the site-images page (smallest surface).
3. **Site images**: model, `getSiteImages()`, `saveSiteImages`, admin page and Settings link, mentor section reads it, `SafeImage` fallback.
4. **Programs and courses**: model, schema, actions, read, view, forms and previews, public cover rendering and share image, delete cleanup.
5. **Verify**: lint, types, unit tests, guard test, build, browser check at 360 and 1440, Lighthouse spot check on home.

## Risks

- **Admin API rate limit or outage on save**: the save fails with a clear "could not check the image, try again" and the record is unchanged (safest, FR-002).
- **Orphaned uploads** (uploaded, never saved): accepted in the spec; a cleanup job is out of scope.
- **Double optimisation**: Cloudinary already delivers `f_auto,q_auto` and the Next optimizer re-encodes once more. Accepted for simplicity (research R4).

## Complexity Tracking

None.
