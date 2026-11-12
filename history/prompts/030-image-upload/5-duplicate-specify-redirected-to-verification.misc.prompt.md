---
id: 5
title: Duplicate specify redirected to verification
stage: misc
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 030-image-upload
branch: main
user: shezafatima
command: /sp.specify
labels: ["images","cloudinary","verification","duplicate"]
links:
  spec: specs/030-image-upload/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - history/prompts/030-image-upload/5-duplicate-specify-redirected-to-verification.misc.prompt.md
tests:
 - none run (blocked: no CLOUDINARY_* values in .env.local)
---

## Prompt

/sp.specify Admin: image upload and editable site images

Purpose: the owner uploads and replaces images from the admin, with no code change or redeploy.

Upload foundation:
- Cloudinary, with signed uploads. The signature is generated on the server after a session check. Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET. Update .env.example. The API secret never reaches the client.
- Allowed: JPG, PNG, WebP, up to 5 MB. Type and size are validated on the client and verified on the server before the image is saved to a record.
- Stored image shape: {url, publicId, width, height, alt}. Alt text is required before saving.
- One reusable ImageUploader component: drag and drop or click, preview, upload progress, replace, remove, alt text field, error states. Keyboard-operable.
- Replacing or removing an image deletes the old Cloudinary asset (best effort; a failure is logged and does not block the save).
- Public rendering through next/image with Cloudinary automatic format and quality. Add res.cloudinary.com to the allowed image hosts.
- New dependency allowed: the Cloudinary SDK, server-side only.

Programs and courses:
- Replace the plain coverImageUrl text field with the ImageUploader in both admin forms.
- Existing records that have only a URL string keep working. No migration is required for the site to render.
- Public cards and detail pages use the uploaded image, and fall back to the existing brand pattern when there is none.

Site images (/admin/settings/images, linked from Settings):
- Named image slots, each with a label, a recommended size and a preview. Each slot falls back to the current file in /public when it is empty, so the site looks the same on a fresh database.
- Slots: founder photo (Meet your mentor), Our Way page images, the default Open Graph image, and any other static content image on public pages. First list every static image the public pages use and propose the slot list for approval before building.
- Excluded, and must stay as code-owned files: the hero robot image and its eyes overlay, the preloader image, the logo and favicon, and the How it works videos.
- Server-only getSiteImages(), cached with tag "site-images". Saving revalidates the tag.

Checks:
- Every upload-signature request and every save has a server-side session check. Extend the unauthenticated-action test.
- An image that fails to load on the public site falls back to the slot's default file, never a broken image.

Constraints: existing admin UI patterns, mobile at 360px, reduced motion respected.

Out of scope: video upload, an image library browser, cropping or editing tools, gallery, blog, testimonials.

## Response snapshot

Detected that this feature is already specified, implemented and merged to main as 030-image-upload (commit fd2c5c9). Asked the user how to proceed; they chose to finish the open 030 verification (T020, T028, T031, T035, T036) instead of writing a new spec. No new branch or spec was created. Verification is blocked until the three CLOUDINARY_* values are added to .env.local by the user.

## Outcome

- ✅ Impact: avoided a duplicate 031 spec/branch
- 🧪 Tests: none run; blocked on credentials
- 📁 Files: this PHR only
- 🔁 Next prompts: add Cloudinary credentials, then run quickstart steps 2-7 and T031
- 🧠 Reflection: check git log/specs before starting /sp.specify on a pasted feature description
