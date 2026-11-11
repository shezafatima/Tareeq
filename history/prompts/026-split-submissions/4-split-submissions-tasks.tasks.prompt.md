---
id: 4
title: Split submissions tasks
stage: tasks
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 026-split-submissions
branch: 026-split-submissions
user: shezafatima
command: /sp.tasks
labels: ["admin", "submissions", "tasks"]
links:
  spec: specs/026-split-submissions/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/026-split-submissions/tasks.md
tests:
 - none (task generation only)
---

## Prompt

/sp.tasks

## Response snapshot

Generated tasks.md with 42 tasks in 7 phases:
- Setup: 1 (baseline)
- Foundational: 16 (model fields + {type, courseId} index, readCategorySnapshot wired into submitCourse, pure params/filter/status/course-leads/WhatsApp modules, type-first leads-query, type-scoped actions, 5 unit test files, guard test part A probes + part D wrong-type checks)
- US1 workshop view: 9 (generalise StatStrip/Pagination/FilterBar/SubmissionsTable/LeadDrawer, workshops page, /admin and /admin/submissions redirects, temp nav)
- US2 course view: 3 (drawer course block with Under 18 + edit link/Course removed, courses page)
- US3 sidebar badges: 4 (layout counts, prop threading, AdminNav group + offset indicator, refresh check)
- US4 Mark contacted: 3 (RowStatus client leaf with useOptimistic, wired into rows/cards)
- Polish: 6 (a11y, 360px/reduced motion, indexes, regression, final gate, DRAFT copy)

13 tasks are marked [P]. MVP is US1; ship together with US2 if released mid-feature.

## Outcome

- ✅ Impact: Executable task list ready for /sp.implement.
- 🧪 Tests: planned: admin-leads-params (rewrite), admin-leads-filter, admin-lead-status, admin-course-leads, admin-whatsapp (extended), guard test part D.
- 📁 Files: specs/026-split-submissions/tasks.md
- 🔁 Next prompts: /sp.analyze (optional), /sp.implement
- 🧠 Reflection: Foundational is large because the type parameter changes every shared signature; doing it once up front keeps the story phases small.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check PASS (42/42 tasks have checkbox, ID and file path; story labels only in story phases)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
