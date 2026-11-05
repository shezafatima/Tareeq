---
id: 3
title: Audiences section task list
stage: tasks
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 010-audiences-section
branch: 010-audiences-section
user: shezafatima
command: /sp.tasks
labels: ["tasks", "audiences"]
links:
  spec: specs/010-audiences-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/010-audiences-section/tasks.md
tests:
 - none (tasks stage)
---

## Prompt

/sp.tasks (no extra input)

## Response snapshot

Generated 23 tasks in 7 phases (setup 2, foundational 3, US1 4, US2 2, US3 3, US4 3, polish 6), with guard rails for the finished sections, MVP = US1+US2, and a Playwright check script plus build, lint and Lighthouse in the polish phase.

## Outcome

- ✅ Impact: tasks.md ready for /sp.implement
- 🧪 Tests: none run
- 📁 Files: tasks.md
- 🔁 Next prompts: /sp.implement
- 🧠 Reflection: US2 and US3 share WhoItsFor.tsx, so they are ordered rather than parallel.
