---
id: 3
title: Brand preloader task list
stage: tasks
date: 2026-10-30
surface: agent
model: claude-sonnet-5-5
feature: 002-brand-preloader
branch: 002-brand-preloader
user: shezafatima
command: /sp.tasks
labels: ["tasks","preloader","verification","skip-cases"]
links:
  spec: specs/002-brand-preloader/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/002-brand-preloader/tasks.md
tests:
 - none
---

## Prompt

/sp.tasks (no arguments), run on the 002-brand-preloader branch after the plan.

## Response snapshot

Generated tasks.md with 32 tasks in 7 phases: Setup 3 (baselines: hero snapshot and five Lighthouse runs before), Foundational 8 (export-only edit to the hero eye file with a hero-unchanged proof, visor numbers, state CSS, inline script skeleton, mount points), US1 6, US2 5, US3 3, US4 2, Polish 5. A single scripts/preloader-check.mjs grows section by section (frames, timing, skip, a11y). Environment hygiene rules are written into the task file (verified-free ports, no junctions to node_modules, Lighthouse only after assets return 200) because of mistakes made during the previous feature. US1 alone is not releasable; US2 and US3 are needed first.

## Outcome

- ✅ Impact: Executable task list ready for /sp.implement.
- 🧪 Tests: none run
- 📁 Files: tasks.md
- 🔁 Next prompts: /sp.analyze (optional), then /sp.implement
- 🧠 Reflection: Baselines are captured before any code changes so the performance and hero comparisons are fair.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format validation PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
