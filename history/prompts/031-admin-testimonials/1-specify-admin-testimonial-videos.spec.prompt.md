---
id: 1
title: Specify admin testimonial videos
stage: spec
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 031-admin-testimonials
branch: 031-admin-testimonials
user: shezafatima
command: /sp.specify
labels: ["admin", "testimonials", "consent", "spec"]
links:
  spec: specs/031-admin-testimonials/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/031-admin-testimonials/spec.md
 - specs/031-admin-testimonials/checklists/requirements.md
tests:
 - none (spec stage)
---

## Prompt

/sp.specify Admin: testimonial videos

Context: the home Testimonials section currently reads src/content/testimonials.ts (with development-only placeholders). After this feature it reads from MongoDB. Keep the section's UI, the click-to-load player, the production rule (section hidden when there are 0 real items) and the development placeholders exactly as they are.

Data model (Mongoose "Testimonial"):
youtubeUrl, youtubeId (extracted on save with the existing helper), name, role (e.g. "Teacher", "Student"), organization (optional), quote (one short line, max 140 characters), consent (boolean, required true to publish), published, order, timestamps.
- Server-only getPublishedTestimonials() returns only items with consent and published both true, sorted by order. Cache tag "testimonials".
- Seed: none. Delete the static content file. Development placeholders stay in code and render only when NODE_ENV !== "production".

Admin (/admin/testimonials, added to the sidebar):
- A grid of 9:16 cards showing the YouTube thumbnail, name, role, quote, a published toggle and a consent badge.
- Create/edit form: YouTube URL (accepts Shorts, watch and youtu.be; shows a live thumbnail preview once the URL is valid; invalid URLs show an inline error), name, role, organization, quote with a character counter, consent checkbox ("I have this person's permission to show this video"), order, published.
- The publish toggle is disabled with a tooltip until consent is ticked. The server refuses to publish without consent.
- Delete with confirmation. Reorder by order number.
- Every save, toggle or delete revalidates "testimonials". Server-side session checks; extend the unauthenticated-action test.

Constraints: existing admin UI patterns, no new dependencies, mobile at 360px, reduced motion respected. YouTube thumbnails from i.ytimg.com (already allowed).

Out of scope: video upload, written-only testimonials, gallery, blog.

## Response snapshot

Created branch 031-admin-testimonials and specs/031-admin-testimonials/spec.md with 4 user stories (add and show a testimonial P1, consent gate P1, manage list P2, owner-only access P1), 21 functional requirements, 6 success criteria, edge cases, assumptions and out-of-scope. Quality checklist passes with no clarification markers.

## Outcome

- ✅ Impact: Spec ready for /sp.plan
- 🧪 Tests: none (spec stage)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.clarify (optional) or /sp.plan
- 🧠 Reflection: Input was detailed; defaults recorded as assumptions instead of questions.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 raised a parameter-binding error after creating the branch and spec file
- Graders run and results (PASS/FAIL): spec quality checklist PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
