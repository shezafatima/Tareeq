---
id: 3
title: Admin dashboard tasks
stage: tasks
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 029-admin-dashboard
branch: 029-admin-dashboard
user: shezafatima
command: /sp.tasks
labels: ["admin", "dashboard", "tasks"]
links:
  spec: specs/029-admin-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/029-admin-dashboard/tasks.md
 - specs/029-admin-dashboard/data-model.md
tests:
 - planned: tests/unit/dashboard-time.test.ts
 - planned: tests/unit/dashboard-shape.test.ts
---

## Prompt

/sp.tasks

## Response snapshot

Generated tasks.md with 29 tasks: Setup 1 (baseline); Foundational 12 (pure dashboard-time + tests, dashboard-shape + tests, dashboard-query $facet + finds, route move into (home) with force-dynamic, dashboard skeleton, DashboardCard, Greeting, TypeChip, sidebar Dashboard entry, dev-only seed script); US1 3 (AttentionItem client leaf reusing setLeadStatus, NeedsAttention, wiring); US2 2 (DashboardStats, wiring); US3 3 (LeadsChart SVG + sr-only table, RecentActivity, wiring); US4 3 (TopCourses, ContentSummary, wiring); Polish 5 (static checks + privacy grep, quickstart walkthrough at 360/390/1440, a11y pass, seed cleanup, commit/merge/delete branch). Added `href` to AttentionRow in data-model.md so the two documents agree.

## Outcome

- ✅ Impact: tasks.md ready for /sp.implement; MVP = Foundational + US1
- 🧪 Tests: two unit test files planned with exact Karachi and working-hour cases; guard test unchanged
- 📁 Files: tasks.md (new), data-model.md (AttentionRow.href)
- 🔁 Next prompts: /sp.analyze (optional) or /sp.implement
- 🧠 Reflection: All page.tsx wiring tasks touch one file, so they are sequential; the components fan out in parallel.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check PASS (29/29 tasks have checkbox, ID, story label where required, file path)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
