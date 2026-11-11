---
id: 1
title: Split submissions spec
stage: spec
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 026-split-submissions
branch: 026-split-submissions
user: shezafatima
command: /sp.specify
labels: ["admin", "submissions", "leads", "spec"]
links:
  spec: specs/026-split-submissions/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/026-split-submissions/spec.md
 - specs/026-split-submissions/checklists/requirements.md
 - specs/025-courses-catalog/verification.md
tests:
 - npm run lint (025 final gate, PASS)
 - npm run test:unit (025 final gate, PASS 154/154)
 - npm run build (025 final gate, PASS)
 - npm run test:admin-guard -- --no-http (025 final gate, PASS)
---

## Prompt

/sp.specify Admin: separate workshop and course submissions

Context: reuse the existing submissions table, drawer, filters, stat strip, toasts and auth checks. Same collection, split by `type`. No data migration.

Routes:
- /admin/submissions/workshops: workshop submissions only.
- /admin/submissions/courses: course registrations only.
- /admin temporarily redirects to /admin/submissions/workshops (the dashboard feature will replace this later). The old combined list is removed.
- Sidebar: a "Submissions" group with two items, "Workshops" and "Course registrations". Each shows a badge with its count of status "new".

Workshop view:
- Columns: name, role, organization, participants, preferred month, status, received date.
- Filters: status, role, preferred month. Search: name, phone, email, organization.
- Stat strip: New, Contacted, Booked, Closed (workshop only).
- Drawer: all workshop fields.

Course view:
- Columns: name, course (courseTitle snapshot), category, level, age group, status, received date.
- Filters: status, course, category, level, age group. Search: name, phone, email.
- Stat strip: New, Contacted, Enrolled, Closed. Map the existing "booked" value to the label "Enrolled" for courses; do not add a new status value.
- Drawer: all course fields. Show an "Under 18" badge when ageGroup is under-18. If the course still exists, link to its admin edit page; otherwise show "Course removed" next to the snapshot title.

Both views:
- Filters and pagination live in the URL query.
- Quick action on each row: "Mark contacted" (optimistic, with a toast).
- Row actions stay as they are: status, notes, WhatsApp (prefilled message mentions the workshop or the course title), copy phone/email, delete with confirmation.
- Indexes: ensure compound indexes on {type, status, createdAt} and {type, courseId} exist.
- Every query is scoped by type on the server, so a workshop page can never return course records and vice versa.
- Extend the unauthenticated-action test to cover any new actions.

Constraints: Server Components and Server Actions, existing UI patterns, no new dependencies, mobile cards at 360px, reduced motion respected.

Out of scope: CSV export, dashboard, email changes, form changes.

## Response snapshot

Before branching, 025-courses-catalog was still uncommitted. Owner chose "Finish 025 first": ran the automated final gate (lint, 154 unit tests, build, admin guard all PASS), recorded it in verification.md with T038/T047-T050 and the Programs click-through still pending, committed (77a9ac6), merged to main (d37775e) and deleted the branch. Then created 026-split-submissions and wrote the spec: 4 user stories (workshop view P1, course view P1, sidebar badges P2, Mark contacted P2), 22 FRs, 7 success criteria, edge cases for cross-type ids/actions, removed courses, "Not sure yet", and deleted categories. Assumptions: the snapshot is the stored `courseName`; level/age are applicant answers; category is looked up from the current course since leads store none. No clarification markers.

## Outcome

- ✅ Impact: Spec ready for /sp.plan; 025 merged to main first.
- 🧪 Tests: none for the spec; 025 gate re-run and passing.
- 📁 Files: spec.md, checklists/requirements.md, 025 verification.md.
- 🔁 Next prompts: /sp.clarify (optional) or /sp.plan.
- 🧠 Reflection: Grounding in the lead model surfaced that registrations store no category and name the snapshot `courseName`, which shaped FR-014 and the assumptions.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 printed its known trailing parameter error; branch and spec were created.
- Graders run and results (PASS/FAIL): spec quality checklist PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
