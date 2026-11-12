---
id: 2
title: Plan admin testimonial videos
stage: plan
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 031-admin-testimonials
branch: 031-admin-testimonials
user: shezafatima
command: /sp.plan
labels: ["admin", "testimonials", "consent", "plan", "mongodb"]
links:
  spec: specs/031-admin-testimonials/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/031-admin-testimonials/plan.md
 - specs/031-admin-testimonials/research.md
 - specs/031-admin-testimonials/data-model.md
 - specs/031-admin-testimonials/contracts/data-access.md
 - specs/031-admin-testimonials/contracts/routes-and-ui.md
 - specs/031-admin-testimonials/quickstart.md
tests:
 - none (plan stage)
---

## Prompt

/sp.plan

## Response snapshot

Planned the feature by mirroring the Programs admin: new src/lib/testimonials/{model,data}.ts (cached read, tag "testimonials"), pure selector moved to src/lib/testimonials/select.ts, getTestimonials() rewired so the public section and dev placeholders stay unchanged (DB error treated as zero items). Admin: shared zod-mini schema, uncached reads, four withAdmin actions (create, update, setTestimonialPublished with a consent-filtered conditional update, delete), guard-test REQUIRED_ACTIONS extended. UI: sidebar entry, 9:16 card grid, PublishedToggle gains an optional lockedReason (aria-disabled + focusable tooltip), TestimonialForm with live thumbnail, 140-char counter, consent auto-unpublish, ConfirmDialog delete. Constitution I–XI pass; three milestones.

## Outcome

- ✅ Impact: Plan and design artifacts ready for /sp.tasks
- 🧪 Tests: none (plan stage); plan adds admin-testimonials-schema unit tests and guard-test entries
- 📁 Files: plan.md, research.md, data-model.md, contracts/data-access.md, contracts/routes-and-ui.md, quickstart.md
- 🔁 Next prompts: /sp.tasks
- 🧠 Reflection: Consent is enforced in three layers so a direct request cannot publish without consent.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Constitution Check PASS (pre and post design)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
