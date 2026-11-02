---
id: 3
title: Site visual polish task list
stage: tasks
date: 2026-11-02
surface: agent
model: claude-sonnet-5-5
feature: 004-site-visual-polish
branch: 004-site-visual-polish
user: shezafatima
command: /sp.tasks
labels: ["tasks", "scroll-reveal", "motion-tokens", "hero-protection"]
links:
  spec: specs/004-site-visual-polish/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/004-site-visual-polish/tasks.md
 - history/prompts/004-site-visual-polish/3-site-visual-polish-task-list.tasks.prompt.md
tests:
 - none (task planning only)
---

## Prompt

/sp.tasks (no additional user input; the command body was the standard task-generation workflow for the current feature, 004-site-visual-polish)

## Response snapshot

Generated `specs/004-site-visual-polish/tasks.md`: 67 tasks in checklist format. Setup 4, Foundational 18 (tokens, reveal CSS, `Reveal`, `RevealController`, icons, tile, divider, content entity, check scripts), US1 9, US2 9, US5 6, US3 8, US4 6, Polish 7. Story order follows dependency: US5 (proving motion never gets in the way) comes before spreading the pattern to inner pages (US3) and the hero-area additions (US4). Every phase ends with build, lint, the new `polish-reveal-check.mjs` and existing checks, a look at screenshots, and the hero compare. Rules forbid editing `Hero.tsx`, `preloader/` and `how-it-works/`. Lighthouse approval is an explicit first-phase task.

## Outcome

- Impact: Ready for `/sp.implement`.
- Tests: none run; verification tasks defined.
- Files: tasks.md.
- Next prompts: `/sp.implement` (Phases 1 to 3 first); owner to approve Lighthouse and confirm the trust-strip facts; decide whether to commit feature 003 first.
- Reflection: task counts verified to sum to 67. T053 (text snapshot) must run before T047 to T051; noted in the phase.

## Evaluation notes (flywheel)

- Failure modes observed: none.
- Graders run and results (PASS/FAIL): format check by inspection PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): build T009 to T011 and test the no-flash gate before any visual work.
