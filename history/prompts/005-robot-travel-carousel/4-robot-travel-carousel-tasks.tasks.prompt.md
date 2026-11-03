---
id: 4
title: Robot travel carousel task list
stage: tasks
date: 2026-11-02
surface: agent
model: claude-opus-5-5
feature: 005-robot-travel-carousel
branch: 005-robot-travel-carousel
user: shezafatima
command: /sp.tasks
labels: ["tasks", "robot-travel", "carousel", "stop-gate", "hero-protection"]
links:
  spec: specs/005-robot-travel-carousel/spec.md
  ticket: null
  adr: history/adr/0001-twin-handoff-and-css-layout-modes.md
  pr: null
files:
 - specs/005-robot-travel-carousel/tasks.md
 - history/prompts/005-robot-travel-carousel/4-robot-travel-carousel-tasks.tasks.prompt.md
tests:
 - none (task planning only)
---

## Prompt

/sp.tasks (no additional user input)

## Response snapshot

Generated `specs/005-robot-travel-carousel/tasks.md`: 53 tasks in checklist format. Setup 4 (hero, text and Lighthouse baselines), Foundational 9 (inline `data-js` flag, CSS layout modes, `useLayoutMode`, reusable `RobotFigure` with the image hardcoded, the two approved `RobotEyes` changes with an immediate hero compare, deletion of feature 003's stage, token guard update), US6 3 (page order first because travel lands right below the hero), US5 5 (server markup and list fallback), US1 10 (hand-off and travel, with T027 as a stop gate: before, during and after screenshots, report to the owner if any pop), US2 6 (coverflow, autoplay state machine, WAI carousel), US3 4 (eyes, glance at the active card, hidden robot's eyes paused), US4 4 (scroll-snap swipe), Polish 8 (a11y, widths, leftovers, full regression, Lighthouse after, hero proof, final screenshots, commit-merge-delete routine).

## Outcome

- Impact: Ready for `/sp.implement`.
- Tests: none run; verification tasks defined in `robot-travel-check.mjs` and existing scripts.
- Files: tasks.md.
- Next prompts: `/sp.implement` (Phases 1 to 5 first; stop at T027 if the hand-off is visible).
- Reflection: task counts verified to sum to 53; every owner condition from ADR-0001 maps to a task (T023, T026, T027, T029, T030, T040).

## Evaluation notes (flywheel)

- Failure modes observed: none.
- Graders run and results (PASS/FAIL): format check by inspection PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): build T022 to T027 before any carousel code.
