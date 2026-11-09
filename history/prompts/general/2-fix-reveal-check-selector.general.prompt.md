---
id: 2
title: Fix reveal check interaction selector
stage: general
date: 2026-11-09
surface: agent
model: claude-opus-5-5
feature: none
branch: 018-fix-reveal-check-selector
user: shezafatima
command: fix the polish-reveal-check interaction selector
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

fix the polish-reveal-check interaction selector

## Response snapshot

The interaction section looked for `main article.lift` cards and "Join this workshop" buttons on /programs, which feature 015 replaced. The lift and focus checks now use the home page's program cards, and the press check uses the shared Button in the header. Every section now runs. The only interaction failure left was the real footer link height issue, fixed separately. Results are printed only at the end, so a full run that crashes loses them; the sections were run one at a time.

## Outcome

- ✅ Impact: The interaction section runs again: 11 of 12, then 12 of 12 after the footer fix.
- 🧪 Tests: All nine sections run; failures left are the 4 old `inner` ones and one timing flake in `stability`.
- 📁 Files: scripts/polish-reveal-check.mjs
- 🔁 Next prompts: Footer link heights.
- 🧠 Reflection: Checks tied to page markup break silently when a later feature rewrites that page.

## Evaluation notes (flywheel)

- Failure modes observed: A full run took over 10 minutes and once crashed on a preloader timeout under load.
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Print each result as it happens, so a crash keeps what already ran.
