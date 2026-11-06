---
id: 6
title: Final verification and regex fix
stage: green
date: 2026-11-06
surface: agent
model: claude-opus-5-5
feature: 015-programs-pages
branch: 015-programs-pages
user: shezafatima
command: /sp.specify (pre-flight for the next feature)
labels: ["verification", "lead-capture", "bugfix", "lighthouse"]
links:
  spec: specs/015-programs-pages/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/lib/leads/notify.ts
 - specs/015-programs-pages/baseline.md
 - specs/015-programs-pages/tasks.md
tests:
 - scripts/leads-check.mjs
 - scripts/leads-db-check.mjs
 - scripts/leads-env-check.mjs
 - scripts/programs-pages-check.mjs
 - scripts/programs-check.mjs
 - scripts/home-check.mjs
 - scripts/polish-token-check.mjs
 - scripts/whatsapp-check.mjs
 - scripts/desktop-check.mjs
 - scripts/footer-check.mjs
 - scripts/pages-check.mjs
 - tests/unit
---

## Prompt

/sp.specify for the Our Way page was blocked by the one-feature-per-branch rule, because 015 was uncommitted. The owner was asked how to clear 015.

Q: How should I clear 015?
A: Verify, then merge (Recommended)

Q: Which address should the contact email use?
A: Decide later

## Response snapshot

Ran the open checks one at a time. Found and fixed a 015 regression: the notification address check had lost its backslashes, so any address with the letter "s" made every valid form fail. Lead capture now saves and delivers. Detail page accessibility is 100. Remaining failures also occur on main, including a hidden "Step 1 of 2" on the desktop workshop form, caused by feature 013. Performance stays below 90 with no home regression against main.

## Outcome

- ✅ Impact: 015 cleared for merge; a bug that would have blocked form submissions is fixed.
- 🧪 Tests: Results are in specs/015-programs-pages/baseline.md.
- 📁 Files: One-line fix in notify.ts; baseline and tasks updated.
- 🔁 Next prompts: Merge 015, then specify Our Way. T065 stays open for the owner's email.
- 🧠 Reflection: The missing-settings check passed while the all-settings-valid path was broken, so both must run before merge.

## Evaluation notes (flywheel)

- Failure modes observed: Lost backslashes in a regex; stale data cache across builds after an unpublish test, cleared by removing .next/cache.
- Graders run and results (PASS/FAIL): PASS, except failures also on main, listed in baseline.md
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add a check that runs one valid submission with all settings set to the settings check.
