---
id: 4
title: Courses catalog task breakdown
stage: tasks
date: 2026-11-10
surface: agent
model: claude-opus-5-5
feature: 025-courses-catalog
branch: 025-courses-catalog
user: shezafatima
command: /sp.tasks
labels: ["courses", "tasks", "admin", "register-form"]
links:
  spec: specs/025-courses-catalog/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/025-courses-catalog/tasks.md
tests:
 - none run (task generation); test tasks T008-T010, T013, T028, T041 defined
---

## Prompt

/sp.tasks (no arguments)

## Response snapshot

Generated tasks.md with 52 tasks in 8 phases: Setup (1), Foundational (9: options, slug helper, models, shared schema, view helpers, result code + 3 unit test files), US4 categories (6), US1 admin courses (12), US2 public catalogue (10), US5 empty state (1), US3 register integration (8), Polish (5). US4 runs before US1 because courses need a category; this is stated explicitly. Tests are included because the spec requires extending the guard test and the plan defines unit tests. Every task has an ID, an optional [P], a story label in story phases, and exact file paths, plus dependency, parallel and MVP sections.

## Outcome

- ✅ Impact: tasks.md ready for /sp.implement
- 🧪 Tests: guard test extension (T013/T028) and 4 unit test files planned
- 📁 Files: specs/025-courses-catalog/tasks.md
- 🔁 Next prompts: /sp.analyze (optional consistency check), /sp.implement
- 🧠 Reflection: The story order departs from spec priority (US4 before US1); flagged in the doc rather than hidden.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check (checkbox, ID, labels, paths) PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
