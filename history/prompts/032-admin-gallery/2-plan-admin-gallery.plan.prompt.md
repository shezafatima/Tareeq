---
id: 2
title: Plan admin gallery
stage: plan
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 032-admin-gallery
branch: 032-admin-gallery
user: shezafatima
command: /sp.plan
labels: ["admin", "gallery", "upload", "lightbox", "cloudinary", "plan"]
links:
  spec: specs/032-admin-gallery/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/032-admin-gallery/plan.md
 - specs/032-admin-gallery/research.md
 - specs/032-admin-gallery/data-model.md
 - specs/032-admin-gallery/contracts/data-access.md
 - specs/032-admin-gallery/contracts/routes-and-ui.md
 - specs/032-admin-gallery/quickstart.md
tests:
 - none (planning stage)
---

## Prompt

/sp.plan (no additional arguments)

## Response snapshot

Wrote plan.md, research.md (R1–R18), data-model.md, contracts (data-access, routes-and-ui) and quickstart.md. Key decisions: two collections; cover stored as a photo reference (`coverPhoto`) instead of an embedded `coverImage` copy; `storedImageSchema` turned into an `imageSubSchema({ altRequired })` factory so gallery photos may exist without alt; alt-text publish gate enforced in UI, action filter, update action and model; "gallery" upload scope plus XHR upload extracted to `src/lib/images/upload-client.ts` shared by ImageUploader and the new multi-file GalleryUploader (3 parallel, per-file state, retry); server verifies every asset before creating a photo; cached public reads under tag "gallery"; nav Gallery link via one cached `hasPublicGallery()` read in an async SiteLayout passed to Header/Footer as props (Principle VIII impact stated); CSS-columns masonry grid; in-house lightbox on existing useFocusTrap wrapping the server grid; album delete removes records first, then Cloudinary assets best effort. Constitution check passes; 4 milestones. update-agent-context ran; CLAUDE.md unchanged.

## Outcome

- ✅ Impact: Plan ready for /sp.tasks.
- 🧪 Tests: none at plan stage; plan adds gallery-schema, gallery-view, site-links unit tests and guard-test entries.
- 📁 Files: 6 planning artifacts.
- 🔁 Next prompts: /sp.tasks
- 🧠 Reflection: The input's embedded coverImage would go stale or dangle; a reference resolves the same behaviour more safely.

## Evaluation notes (flywheel)

- Failure modes observed: none.
- Graders run and results (PASS/FAIL): Constitution check PASS (VIII flagged, not violated).
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
