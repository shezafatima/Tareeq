---
id: 3
title: Home core pages task list
stage: tasks
date: 2026-11-01
surface: agent
model: claude-sonnet-5-5
feature: 003-home-core-pages
branch: 003-home-core-pages
user: shezafatima
command: /sp.tasks
labels: ["tasks", "scroll-transition", "content-layer"]
links:
  spec: specs/003-home-core-pages/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/003-home-core-pages/tasks.md
 - history/prompts/003-home-core-pages/3-home-core-pages-task-list.tasks.prompt.md
tests:
 - none (task planning only)
---

## Prompt

Approved, go ahead with /sp.tasks

(The /sp.tasks skill body had no further user input.)

## Response snapshot

Generated `specs/003-home-core-pages/tasks.md`: 70 tasks in checklist format. Setup 3, Foundational 22 (content layer, hero export approved, draft data, shared components, nav/redirect/metadata), US1 10, US3 6, US2 10, US4 4, US5 4, US6 4, Polish 7. US3 is built before US2 because the stage and fallback modes are the base for travel. Verification scripts (home-check, transition-check, pages-check) grow per story with checkpoints; MVP is Phases 1 to 3.

## Outcome

- Impact: Ready for `/sp.implement`.
- Tests: none run; verification tasks defined.
- Files: tasks.md.
- Next prompts: `/sp.implement` (start with Phases 1 to 3).
- Reflection: Task counts verified by hand to sum to 70.

## Evaluation notes (flywheel)

- Failure modes observed: none.
- Graders run and results (PASS/FAIL): format check by inspection PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): prototype T042 to T045 hand-off early to check the 2px match.
