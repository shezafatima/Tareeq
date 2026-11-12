---
id: 3
title: Tasks for admin testimonial videos
stage: tasks
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 031-admin-testimonials
branch: 031-admin-testimonials
user: shezafatima
command: /sp.tasks
labels: ["admin", "testimonials", "tasks"]
links:
  spec: specs/031-admin-testimonials/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/031-admin-testimonials/tasks.md
tests:
 - none (tasks stage); tasks add tests/unit/admin-testimonials-schema.test.ts and guard-test entries
---

## Prompt

/sp.tasks

## Response snapshot

Generated tasks.md with 29 tasks: Setup (1), Foundational (8: selector move, model with consent guard, cached public read, getTestimonials rewire + static file deletion, shared schema, schema unit tests, admin reads, sidebar entry), US1 (6: create/update actions, form with preview and counter, card, list/new/edit pages), US2 (4: consent-filtered publish action, PublishedToggle lockedReason, form consent lock, card badge + switch), US3 (4: delete action, ConfirmDialog delete, empty state, order verification), US4 (2: guard-test REQUIRED_ACTIONS, signed-out redirects), Polish (4). MVP = Setup + Foundational + US1 + T024.

## Outcome

- ✅ Impact: tasks.md ready for /sp.implement
- 🧪 Tests: schema unit tests (T007) and guard test extension (T024) planned
- 📁 Files: specs/031-admin-testimonials/tasks.md
- 🔁 Next prompts: /sp.analyze (optional) or /sp.implement
- 🧠 Reflection: Same-file sequences are called out so parallel work never collides.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check PASS (all tasks have checkbox, ID, story label where required, file path)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
