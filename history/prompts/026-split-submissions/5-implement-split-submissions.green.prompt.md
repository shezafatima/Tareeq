---
id: 5
title: Implement split submissions
stage: green
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 026-split-submissions
branch: 026-split-submissions
user: shezafatima
command: /sp.implement
labels: ["admin", "submissions", "leads", "implementation"]
links:
  spec: specs/026-split-submissions/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/lib/leads/model.ts
 - src/lib/leads/category-snapshot.ts
 - src/lib/leads/actions.ts
 - src/lib/admin/leads-params.ts
 - src/lib/admin/leads-filter.ts
 - src/lib/admin/lead-status.ts
 - src/lib/admin/course-leads.ts
 - src/lib/admin/leads-query.ts
 - src/lib/admin/leads-actions.ts
 - src/lib/admin/whatsapp.ts
 - src/lib/admin/format.ts
 - src/app/admin/(panel)/layout.tsx
 - src/app/admin/(panel)/page.tsx
 - src/app/admin/(panel)/submissions/page.tsx
 - src/app/admin/(panel)/submissions/workshops/page.tsx
 - src/app/admin/(panel)/submissions/courses/page.tsx
 - src/components/admin/AdminNav.tsx
 - src/components/admin/Sidebar.tsx
 - src/components/admin/TopBar.tsx
 - src/components/admin/SubmissionsTable.tsx
 - src/components/admin/RowStatus.tsx
 - src/components/admin/FilterBar.tsx
 - src/components/admin/StatStrip.tsx
 - src/components/admin/Pagination.tsx
 - src/components/admin/LeadDrawer.tsx
 - scripts/admin-guard-test.mts
 - specs/026-split-submissions/tasks.md
 - specs/026-split-submissions/verification.md
 - specs/026-split-submissions/contracts/data-access.md
tests:
 - tests/unit/admin-leads-params.test.ts (rewritten)
 - tests/unit/admin-leads-filter.test.ts (new)
 - tests/unit/admin-lead-status.test.ts (new)
 - tests/unit/admin-course-leads.test.ts (new)
 - tests/unit/admin-whatsapp.test.ts (extended)
 - scripts/admin-guard-test.mts part D (new): 12/12
 - npm run test:unit 176/176, lint, tsc, build PASS
---

## Prompt

/sp.implement

## Response snapshot

Implemented 34 of 42 tasks.
- Foundation: category snapshot fields + {type, courseId} index; readCategorySnapshot (uncached, never throws) spread into CourseLead.create; type-first pure params/filter/status/course-leads/WhatsApp modules; type-scoped reads (listWorkshopLeads, listCourseLeads, getLead via findOne {_id, type}, getLeadStats, getNewCounts, getWorkshopMonths, getCourseLeadLookup); the shared actions take a required type and match on {_id, type}, revalidating the /admin layout.
- UI: generic SubmissionsTable (column config, overlay-link cards), FilterBar driven by select config, type-aware StatStrip/Pagination/LeadDrawer (Under 18 chip, Edit course / Course removed, category, labelled fields, WhatsApp per type), workshop and course pages, /admin and /admin/submissions redirects, AdminNav "Submissions" group with new-count badges loaded in the panel layout, and the RowStatus client leaf (useOptimistic Mark contacted).
- Checks: lint, tsc, 176 unit tests, build (25 pages), guard A–D (D 12/12) and signed-out 307s all pass.
- Left open for the owner: the 8 tasks that need an admin sign-in (browser walkthroughs, a11y/360px pass, index check, regression).

## Outcome

- ✅ Impact: Both type-scoped views, the snapshot, badges and quick action are built; every automated check passes.
- 🧪 Tests: 176/176 unit; guard test A–D PASS.
- 📁 Files: 25 source files changed or added, 5 test files.
- 🔁 Next prompts: owner walkthrough (verification.md "Still to verify"), then commit, merge to main, delete the branch.
- 🧠 Reflection: Putting `type` inside the single filter builder (set last) and asserting it in tests made the scoping guarantee cheap to prove.

## Evaluation notes (flywheel)

- Failure modes observed: bash heredocs with apostrophes failed in this shell (switched to the Write tool); the dev server on port 3000 was already running, so a second one refused to start (used the existing one, read-only).
- Graders run and results (PASS/FAIL): lint PASS, tsc PASS, unit PASS, build PASS, guard PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
