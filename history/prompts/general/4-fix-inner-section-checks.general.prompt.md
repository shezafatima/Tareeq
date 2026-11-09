---
id: 4
title: Fix inner section checks
stage: general
date: 2026-11-09
surface: agent
model: claude-opus-5-5
feature: none
branch: 020-fix-inner-checks
user: shezafatima
command: fix the inner section failures
labels: ["tests", "polish-reveal-check"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - scripts/polish-reveal-check.mjs
tests:
 - scripts/polish-reveal-check.mjs
---

## Prompt

fix the inner section failures

## Response snapshot

Both failures were outdated expectations, not site bugs. The header check expected an eyebrow, heading and intro, but feature 015's spec gives /programs a heading and one line, as 016 does for Our Way; it now requires the h1 and at least one line beside it to enter, and every part marked for an entrance to have one. The copy-unchanged comparison against feature 004's text snapshots was retired: features 008 to 016 rewrote that copy on purpose, and the snapshots were in git-ignored shots/, so a fresh clone could not run it. The inner section passes 18 of 18.

## Outcome

- ✅ Impact: polish-reveal-check's inner section is clean.
- 🧪 Tests: inner 18/0; syntax check passes.
- 📁 Files: scripts/polish-reveal-check.mjs
- 🔁 Next prompts: Push main when the owner asks.
- 🧠 Reflection: A guard that compares against untracked local files only works on the machine that made them.

## Evaluation notes (flywheel)

- Failure modes observed: Snapshot baselines kept outside git.
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
