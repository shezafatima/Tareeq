---
id: 1
title: Fix workshop step indicator
stage: general
date: 2026-11-09
surface: agent
model: claude-opus-5-5
feature: none
branch: 017-fix-step-indicator
user: shezafatima
command: continue
labels: ["bugfix", "workshop-form", "css"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - src/app/globals.css
 - scripts/leads-check.mjs
tests:
 - scripts/leads-check.mjs
 - scripts/how-it-works-check.mjs
 - scripts/polish-token-check.mjs
 - scripts/home-check.mjs
---

## Prompt

continue

## Response snapshot

Took the one remaining item the assistant could do itself: the workshop form's "Step 1 of 2" broken by feature 013's How it works styles. It was worse than first reported: hidden on desktop, and clipped to a grey 3px bar on phones. Scoped the three rules to `.step-card .step-progress` and added a visibility guard to the lead check. Committed and merged under the one-feature-per-branch rule; not pushed.

## Outcome

- ✅ Impact: Visitors see which step of the booking form they are on, at every width.
- 🧪 Tests: Lead-form sections 125/0 plus the new guard; How it works 68/0 in Edge; token and home checks pass.
- 📁 Files: src/app/globals.css, scripts/leads-check.mjs
- 🔁 Next prompts: Owner reviews Our Way draft copy; deploy steps from 015.
- 🧠 Reflection: A check that reads text or visibility can pass on text nobody can see; check its size as well.

## Evaluation notes (flywheel)

- Failure modes observed: Generic class names shared across features; the earlier check counted 3px-clipped text as visible.
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Prefix section CSS classes by feature, as `way-` does.
