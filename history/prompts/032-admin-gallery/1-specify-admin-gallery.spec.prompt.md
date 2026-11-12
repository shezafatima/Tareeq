---
id: 1
title: Specify admin gallery
stage: spec
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 032-admin-gallery
branch: 032-admin-gallery
user: shezafatima
command: /sp.specify
labels: ["admin", "gallery", "upload", "lightbox", "consent", "spec"]
links:
  spec: specs/032-admin-gallery/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/032-admin-gallery/spec.md
 - specs/032-admin-gallery/checklists/requirements.md
tests:
 - none (specification stage)
---

## Prompt

/sp.specify Admin: gallery

Purpose: the owner uploads workshop photos, and they appear on the site grouped by event.

Data (Mongoose):
- GalleryAlbum: title (e.g. "Teacher workshop, Karachi"), slug (unique), dateText (e.g. "November 2026"), description (optional), coverImage (optional; defaults to the first photo), order, published, timestamps.
- GalleryPhoto: album (ref), image ({url, publicId, width, height, alt}, using the existing upload shape), caption (optional), order, published, timestamps.
- Server-only getPublishedAlbums(), getAlbumBySlug(slug), getLatestPhotos(limit). Cache tag "gallery".

Admin (/admin/gallery, added to the sidebar):
- Albums grid: cover, title, date, photo count, published toggle. Create/edit/delete album (deleting an album with photos asks for confirmation and deletes its photos and their Cloudinary assets, best effort).
- Album page: multi-file upload (drag and drop several images at once, reusing the existing signed upload, with a per-file progress state). Each photo has its own alt text (required before publish; a missing alt shows a warning badge), an optional caption and a published toggle. Reorder by order number. Set as album cover. Delete with confirmation.
- A notice on the upload area: "Only upload photos of children with parent/school consent."
- Server-side session checks on every action and upload signature. Extend the unauthenticated-action test. Every change revalidates "gallery".

Public:
- /gallery: album cards (cover, title, date, photo count), newest first. If there are no published albums, the page shows a friendly "Photos coming after our first workshop" message, and Gallery is not shown in the nav.
- /gallery/[slug]: a responsive masonry/grid of photos, with a lightbox (keyboard arrows, Esc, swipe on touch, focus trap, caption shown). Unpublished or unknown slug -> 404. Per-album metadata and OG image (the cover).
- /workshop: the existing hidden gallery section now shows the latest 6 published photos with a "See all photos" link to /gallery, and stays hidden when there are none.
- Images via next/image with Cloudinary automatic format and quality, lazy-loaded, with explicit sizes.

Constraints: existing admin UI patterns, no new dependencies (build the lightbox in-house), mobile at 360px, reduced motion respected.

Out of scope: video in the gallery, blog, image editing.

## Response snapshot

Created branch 032-admin-gallery and specs/032-admin-gallery/spec.md with 7 user stories (create album + multi-upload P1, alt-text/publish/cover curation P1, public browsing with in-house viewer P1, empty states + conditional nav P2, latest 6 on /workshop P2, album delete with cascade P2, owner-only access P1), 27 functional requirements, 8 success criteria, edge cases, assumptions and out-of-scope list. Public visibility rule: photo published + alt text + album published; album visible only with at least one visible photo. Noted that /workshop has no existing gallery section (page.tsx:18-19), so it is added new. Quality checklist all passing; no clarification markers.

## Outcome

- ✅ Impact: Spec ready for /sp.plan.
- 🧪 Tests: none at spec stage.
- 📁 Files: spec.md, checklists/requirements.md.
- 🔁 Next prompts: /sp.clarify (optional) or /sp.plan.
- 🧠 Reflection: The input assumed an existing hidden gallery section on /workshop; the code shows none, recorded as an assumption rather than a blocker.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 fails at the end on Windows PowerShell 5.1 (Join-Path with three arguments); branch and spec were created, prompts dir created manually.
- Graders run and results (PASS/FAIL): spec quality checklist PASS.
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): nest the Join-Path calls in create-new-feature.ps1 for PS 5.1 compatibility.
