---
id: 3
title: Tasks for admin gallery
stage: tasks
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 032-admin-gallery
branch: 032-admin-gallery
user: shezafatima
command: /sp.tasks
labels: ["admin", "gallery", "tasks"]
links:
  spec: specs/032-admin-gallery/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/032-admin-gallery/tasks.md
tests:
 - none run (task generation); tasks add tests/unit/gallery-view.test.ts, tests/unit/gallery-schema.test.ts, site-links cases and guard-test entries
---

## Prompt

/sp.tasks (no additional arguments)

## Response snapshot

Generated specs/032-admin-gallery/tasks.md with 52 tasks: Setup (1), Foundational (14: image sub-schema factory, upload scope, upload-client extraction + ImageUploader refactor, models, view.ts, gallery-schema, unit tests, admin and public reads, sidebar), US1 create album + multi-upload (10, MVP), US2 curate/publish/cover/delete photos (8), US3 public gallery + lightbox + metadata (6), US7 guard verification (1), US4 empty state + conditional nav (5), US5 workshop strip (1), US6 album delete (3), Polish (3). 18 tasks marked [P]. Same-file sequencing and parallel examples listed; guard-test entries added per story as actions land.

## Outcome

- ✅ Impact: Tasks ready for /sp.implement.
- 🧪 Tests: unit tests and guard-test extension included as tasks (FR-025, plan milestones).
- 📁 Files: tasks.md
- 🔁 Next prompts: /sp.analyze (optional) or /sp.implement
- 🧠 Reflection: Guard-test entries are added in each story rather than at the end so REQUIRED_ACTIONS never references an action that does not exist yet.

## Evaluation notes (flywheel)

- Failure modes observed: none.
- Graders run and results (PASS/FAIL): format check PASS (52/52 tasks match checkbox + ID + label pattern).
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
