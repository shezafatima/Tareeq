---
id: 2
title: Admin dashboard plan
stage: plan
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 029-admin-dashboard
branch: 029-admin-dashboard
user: shezafatima
command: /sp.plan
labels: ["admin", "dashboard", "plan", "aggregation", "svg-chart"]
links:
  spec: specs/029-admin-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/029-admin-dashboard/plan.md
 - specs/029-admin-dashboard/research.md
 - specs/029-admin-dashboard/data-model.md
 - specs/029-admin-dashboard/contracts/data-access.md
 - specs/029-admin-dashboard/contracts/routes-and-ui.md
 - specs/029-admin-dashboard/quickstart.md
tests:
 - none (plan stage)
---

## Prompt

/sp.plan

## Response snapshot

Planned the dashboard as a force-dynamic Server Component at `(panel)/(home)/page.tsx`, with its own dashboard-shaped loading skeleton; the old redirect page is deleted. Data comes from one Promise.all in one safeLoad: a single narrowed $facet (new by type, this/last week, booked this month, 14-day daily by Karachi day, top 5 courses over 30 days excluding "not-sure"), indexed finds for the 8 most recent and for overdue leads (with a count), and the published program, published course and category counts. Pure dashboard-time.ts handles Karachi time with a fixed +05:00 offset on both the JS and MongoDB side; overdue means more than 48 working hours with Sundays excluded, queried as one cutoff. Pure dashboard-shape.ts handles zero-fill, the week delta text and the axis max. Mark contacted reuses setLeadStatus through a client AttentionItem that hides itself optimistically, so no new action is added. The server SVG chart uses royal and saffron stacked bars, a label on each bar and an sr-only table. The Dashboard sidebar entry is active only on an exact match. A dev-only seed script is guarded to `_dev` databases. Constitution check I–XI passes with no violations.

## Outcome

- ✅ Impact: Plan and Phase 0/1 artifacts ready for /sp.tasks
- 🧪 Tests: planned: tests/unit/dashboard-time.test.ts, dashboard-shape.test.ts; guard test unchanged
- 📁 Files: plan.md, research.md, data-model.md, contracts/data-access.md, contracts/routes-and-ui.md, quickstart.md
- 🔁 Next prompts: /sp.tasks
- 🧠 Reflection: Keeping recent and overdue out of $facet keeps them on existing indexes; the user's "second small query" became two parallel finds.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Constitution Check PASS (pre and post design)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
