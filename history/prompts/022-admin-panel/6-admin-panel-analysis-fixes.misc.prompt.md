---
id: 6
title: Admin panel analysis fixes
stage: misc
date: 2026-11-09
surface: agent
model: claude-sonnet-5-5
feature: 022-admin-panel
branch: 022-admin-panel
user: shezafatima
command: manual follow-up to /sp.analyze
labels: ["analyze","remediation","guard-test","lighthouse","motion"]
links:
  spec: specs/022-admin-panel/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/022-admin-panel/spec.md
 - specs/022-admin-panel/plan.md
 - specs/022-admin-panel/research.md
 - specs/022-admin-panel/tasks.md
 - specs/022-admin-panel/quickstart.md
 - specs/022-admin-panel/contracts/env.md
 - specs/022-admin-panel/contracts/server-actions.md
tests:
 - none (documents only)
---

## Prompt

User resolutions to the analysis: C1 add an automated test calling every admin Server Action and Route Handler with no session (must pass before done); A1 preview reuses the public presentational component, small refactor or drop it; F1 interaction motion 150-250 ms, count-up exempt up to 800 ms, all off under reduced motion; D1 fix the plan to comply with the constitution without amending it; U3 simplest option, state it in one line. Update spec/plan/tasks accordingly, then re-run the check.

## Response snapshot

Applied: withAdmin() wrapper plus scripts/admin-guard-test.ts (T030) as a mandatory gate; ProgramPreview renders the public ProgramPanel (drop rule recorded); FR-029 and SC-010 amended for the count-up; Lighthouse task (T061) with Perf 90+/A11y 95+ gates and a Complexity Tracking entry for the SEO score on noindex pages; trustHost:true for Auth.js; also U1 (pure helper files) and U2 (unauthorized/not_found UI handling). Tasks renumbered to 63.

## Outcome

- ✅ Impact: all CRITICAL/HIGH findings addressed in documents.
- 🧪 Tests: none run.
- 📁 Files: see list.
- 🔁 Next prompts: /sp.implement
- 🧠 Reflection: the SEO score cannot reach 90 with the required noindex; handled via the constitution's own Complexity Tracking, flagged to the user.

## Evaluation notes (flywheel)

- Failure modes observed: a bash heredoc with a non-ASCII print failed under Windows cp1252 (cosmetic).
- Graders run and results (PASS/FAIL): consistency re-check PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
