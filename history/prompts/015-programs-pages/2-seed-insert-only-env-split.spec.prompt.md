---
id: 2
title: Seed insert-only and env split
stage: spec
date: 2026-11-05
surface: agent
model: claude-opus-5-5
feature: 015-programs-pages
branch: 015-programs-pages
user: shezafatima
command: none (spec revision)
labels: ["programs", "seed", "env", "lead-capture", "spec"]
links:
  spec: specs/015-programs-pages/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/015-programs-pages/spec.md
 - specs/015-programs-pages/checklists/requirements.md
 - history/prompts/015-programs-pages/2-seed-insert-only-env-split.spec.prompt.md
tests:
 - none (specification stage)
---

## Prompt

Accept all your adjustments and added behaviours. Two changes:
1. Seed is insert-only: upsert by slug with $setOnInsert, so it creates missing programs and never modifies existing documents. Re-running it is always safe. Remove the "overwrites admin edits" risk.
2. Env validation is per-module: the DB module validates only MONGODB_URI. The Resend and rate-limit modules validate their own variables. The seed runs via tsx with dotenv loading .env.local and imports the DB module directly. The lead-capture behaviour must not change.
Keep "run the seed against production before deploying" in the plan's deploy notes.

## Response snapshot

Updated the spec: FR-003 and User Story 4 are insert-only, with new acceptance scenarios; the overwrite risk is removed; FR-026 to FR-028 and SC-010 cover per-module validation, seed tooling and unchanged lead capture; the deploy-order assumption now requires a plan deploy note. Flagged two items for the plan: the split would let leads save with a missing Resend setting unless the action still checks those settings up front, and `server-only` is not installed, so the seed's direct import fails under tsx until that is handled.

## Outcome

- ✅ Impact: Spec revised and ready for /sp.plan.
- 🧪 Tests: None at the spec stage; quality checklist re-run and passing.
- 📁 Files: spec.md, checklists/requirements.md, this PHR.
- 🔁 Next prompts: /sp.plan
- 🧠 Reflection: Today's combined settings check also acts as an early guard for lead submissions, which the split would silently remove.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): requirements checklist PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
