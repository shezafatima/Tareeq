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

## Not yet verified (needs Cloudinary credentials, which are not in `.env.local`)

- T020: real upload, replace, remove, wrong-type and oversized file, missing alt text, legacy URL record, at 360px and 1440px, keyboard only, reduced motion.
- T028: replace the founder photo and see it on the home page; "Use default image" returns the original; a broken slot URL falls back to `/founder.jpeg`.
- T031: server-side rejection of a bad `publicId` (non-image, oversized, wrong folder, missing).
- T035: full quickstart and a Lighthouse spot check.

## Notes

- The mentor photo merge is done in `MentorSection.tsx` (not in `src/content/index.ts`), so the content module stays free of server-only reads. `src/content/mentor.ts` keeps the default photo's alt text.
- `ImageUploader` uploads with a plain `XMLHttpRequest` to Cloudinary for progress events; the preview uses a plain `<img>` (blob, Cloudinary or legacy URL).
