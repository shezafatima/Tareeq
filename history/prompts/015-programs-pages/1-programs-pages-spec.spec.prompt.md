---
id: 1
title: Programs pages database-driven spec
stage: spec
date: 2026-11-05
surface: agent
model: claude-opus-5-5
feature: 015-programs-pages
branch: 015-programs-pages
user: shezafatima
command: /sp.specify
labels: ["programs", "database", "seed", "pages", "spec"]
links:
  spec: specs/015-programs-pages/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/015-programs-pages/spec.md
 - specs/015-programs-pages/checklists/requirements.md
 - history/prompts/015-programs-pages/1-programs-pages-spec.spec.prompt.md
tests:
 - none (specification stage)
---

## Prompt

/sp.specify Programs page (database-driven)

Context: the home Programs section currently reads src/content/programs.ts. After this feature, both the home section and the new pages read programs from MongoDB through one data function. Delete the static file once it has been seeded.

Data model (Mongoose "Program"; design it so the later admin CRUD needs no schema change):
title, slug (unique), audience (teachers | school-students | college | online | corporate), status (booking-now | register-interest | coming-soon), ctaType (workshop-modal | register | whatsapp), summary (1-2 lines), description (markdown), outcomes (string[]), curriculum ([{title, description}]), facts ({format, duration, groupSize, location}), priceText (free text, e.g. "Contact us"), coverImageUrl (optional string; Cloudinary comes later), order (number), published (boolean), timestamps.
- A seed script (npm run seed:programs) inserts the current 5 programs from the static content. It is idempotent (upsert by slug).
- Data access in one server-only module: getPublishedPrograms(), getProgramBySlug(slug). Cache with Next tags ("programs", "program:<slug>") so the later admin can call revalidateTag on save.

/programs (index): modern, bold, editorial
- Hero: oversized Sora heading (e.g. "Pick your way in."), one line, and audience filter chips (All, Teachers, Students, College, Online, Corporate). Filtering is client-side and instant, and the URL updates (?for=teachers) so it can be shared.
- Programs as numbered full-width panels (01, 02, ...): large title, audience tag, status chip, 3 facts, CTA, "View program ->". Alternate the panel surfaces (navy / paper) for rhythm.
- Hover (pointer devices): the panel expands slightly, the cover image or brand pattern reveals on the right, and the number shifts to saffron. Mobile: stacked cards, no hover reveal.
- Coming-soon programs are shown, but quieter, and sorted last.

/programs/[slug] (detail):
- Immersive header: title, summary, status, the cover image or a brand gradient pattern if there is none.
- Body: description (rendered markdown, sanitized), "You'll leave with" outcomes, curriculum as a vertical timeline, facts grid.
- A sticky booking card on desktop (price text, facts, CTA). On mobile it becomes a sticky bottom CTA bar.
- The CTA follows ctaType: workshop-modal opens the existing booking modal (/workshop?book=1 or in place), register goes to /register (with the course/program preselected if the form supports it), whatsapp opens a prefilled message.
- Unpublished or unknown slug: 404. generateStaticParams for published slugs. Per-program metadata and Open Graph.

Motion: entrance stagger, panel hover expand, timeline steps reveal on scroll. Transform/opacity only. Everything is off under prefers-reduced-motion.

Constraints: Server Components. Client leaves only for filters, hover reveal and sticky bar. Brand tokens, Sora/Inter, existing background. No new UI libraries. Markdown via a small renderer plus a sanitizer. Name both in the plan.

Out of scope: admin CRUD and auth (next admin feature), image upload, payments.

Clarification answer: Draft copy (Recommended).

## Response snapshot

Created branch 015-programs-pages (014 was already used by a merged branch) and wrote the spec with 5 user stories, 25 functional requirements, 9 success criteria and a seed mapping. Corrected the brief's source path: the 5 programs are in src/content/home-programs.ts, and an older 3-item list in src/content/data/programs.ts is retired too. Resolved a brand conflict (saffron numerals on paper panels) in FR-012. The user chose DRAFT-marked seed copy for description, curriculum and price text.

## Outcome

- ✅ Impact: Spec ready for planning; no open clarification markers.
- 🧪 Tests: None at the spec stage; quality checklist passed.
- 📁 Files: spec.md, checklists/requirements.md, this PHR.
- 🔁 Next prompts: /sp.plan (must name the markdown renderer and sanitizer).
- 🧠 Reflection: Checking the brief against the code surfaced a wrong path, a second static list and a constitution conflict.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 errored on Windows PowerShell 5.1 at its three-argument Join-Path, after creating the branch and spec; the prompts directory was created by this session.
- Graders run and results (PASS/FAIL): requirements checklist PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Replace the three-argument Join-Path in create-new-feature.ps1.
