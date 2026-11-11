---
id: 2
title: Category snapshot and type checks
stage: spec
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 026-split-submissions
branch: 026-split-submissions
user: shezafatima
command: none (spec follow-up)
labels: ["admin", "submissions", "spec", "clarification"]
links:
  spec: specs/026-split-submissions/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/026-split-submissions/spec.md
tests:
 - none
---

## Prompt

Accept all your gap handling. Two decisions:
1. Category snapshot: when a course registration is saved, the server also stores categoryId and categoryName from the course's current category (server-side only; no change to the form's fields or UI). The category column and filter use the snapshot first and fall back to the live lookup for older records without one. Registrations for deleted courses then stay findable by category. "Not sure yet" still shows a dash.
2. Type checks: keep the shared status, notes and delete actions. Each takes the expected type and queries by {_id, type}, so a wrong-type record behaves as not found. No duplicated per-type actions. Cover this in the tests: a course record acted on with type "workshop" must fail and change nothing.

## Response snapshot

Added a Clarifications session to the spec. Replaced the live-only category rule with FR-014 (server stores a category id+name snapshot on save; "Not sure yet" or no-category courses are saved marked "no category" so they never fall back) and FR-014a (snapshot first, live lookup for older records, otherwise a dash). Rewrote FR-006 (shared status/notes/delete actions take the expected type and match on id+type; wrong type = existing not-found result; Mark contacted reuses the status action). Added FR-023 (wrong-type tests both ways), SC-008 (snapshot coverage), updated the edge cases (category filter also lists snapshot-only category names), key entities, context, assumptions (no backfill, email unchanged) and out-of-scope wording.

## Outcome

- ✅ Impact: Spec updated with both owner decisions; ready for /sp.plan.
- 🧪 Tests: none (spec only); FR-023 defines the new wrong-type tests.
- 📁 Files: specs/026-split-submissions/spec.md
- 🔁 Next prompts: /sp.plan
- 🧠 Reflection: Marking "no category" explicitly keeps new no-category records from being mistaken for older un-snapshotted ones.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): spec quality checklist still PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
