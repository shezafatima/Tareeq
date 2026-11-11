---
id: 7
title: Follow-up index and badge verification
stage: misc
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 026-split-submissions
branch: 027-split-submissions-followup
user: shezafatima
command: follow-up (after /sp.specify duplicate of 026)
labels: ["admin","submissions","indexes","verification","follow-up"]
links:
  spec: specs/026-split-submissions/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/026-split-submissions/verification.md
tests:
 - npm run test:unit (176/176 pass)
 - npm run test:admin-guard (PASS; wrong-type checks 12/12)
 - npx tsc --noEmit (exit 0)
 - read-only leads.indexes() against live DB
---

## Prompt

do the 027 follow-up for 026

## Response snapshot

Created branch 027-split-submissions-followup. Checked the open items from 026 verification.md:
- Index {type, status, createdAt} and {type, courseId}: both declared in src/lib/leads/model.ts:42-43, and both present in the live leads collection (read-only indexes() call). T039 closed.
- Sidebar badge refresh (T033): setLeadStatus, saveLeadNotes and deleteLead all call revalidatePath("/admin", "layout"). getNewCounts in the panel layout isn't cached, so the action response re-renders the badges. No router.refresh() needed. Closed by code check.
- Unit tests, admin guard test and typecheck pass. No source code changes were needed. Recorded the results in verification.md.
Still open for the owner (needs an admin sign-in): T026/T029 walkthrough, T036 Mark contacted failure path and keyboard order, T037/T038 a11y/360px/reduced motion, T040 regression, T042 copy sign-off.

## Outcome

- ✅ Impact: closed T033 and T039 of 026; confirmed the duplicate /sp.specify request needs no new code
- 🧪 Tests: unit 176/176, admin-guard PASS, tsc clean
- 📁 Files: specs/026-split-submissions/verification.md
- 🔁 Next prompts: owner runs the remaining manual checks; commit, merge and delete the 027 branch
- 🧠 Reflection: checking merged history before running /sp.specify avoided duplicating a whole feature

## Evaluation notes (flywheel)

- Failure modes observed: setup-plan.ps1 on main creates a stray specs/main/ folder
- Graders run and results (PASS/FAIL): unit PASS, admin-guard PASS, tsc PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): make setup-plan refuse to run on main
