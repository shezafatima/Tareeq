---
id: 3
title: How it works video stepper tasks
stage: tasks
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 013-how-it-works-video-stepper
branch: 013-how-it-works-video-stepper
user: shezafatima
command: /sp.tasks
labels: ["how-it-works", "video", "stepper", "tasks"]
links:
  spec: specs/013-how-it-works-video-stepper/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/013-how-it-works-video-stepper/tasks.md
tests:
 - none (planning stage)
---

## Prompt

/sp.tasks (no extra user input)

## Response snapshot

Generated 38 ordered tasks in 8 phases (Setup 6, Foundational 7, US1 6, US2 3, US3 4, US4 3, US5 3, Polish 6) with hard rules protecting the hero and the shared robot code, unit tests for lib/stepper.ts and a Playwright check script extended per story.

## Outcome

- ✅ Impact: tasks.md ready for /sp.implement
- 🧪 Tests: none run
- 📁 Files: tasks.md
- 🔁 Next prompts: /sp.implement (optionally /sp.analyze first)
- 🧠 Reflection: T030 detail-panel wording is convoluted; flagged in the report for review.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check by inspection PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): simplify the mobile detail-panel task
