---
id: 3
title: Programs section UI tasks
stage: tasks
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 009-programs-section-ui
branch: 009-programs-section-ui
user: shezafatima
command: /sp.tasks
labels: ["home", "programs", "tasks"]
links:
  spec: specs/009-programs-section-ui/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/009-programs-section-ui/tasks.md
tests:
 - none (tasks stage); checks defined in T008, T012, T013, T018, T022, T027
---

## Prompt

/sp.tasks (no extra input)

## Response snapshot

Generated tasks.md (34 tasks): Setup (3), Foundational content/types/getter/chevron prop (5), US1 bento section (7), US2 CTAs (4), US3 robustness (4), US4 motion (5), Polish (6). Found that scripts/home-check.mjs asserts 2-3 programs and "Who it's for" facts, so T014 updates it. Lists protected files not to edit, dependencies, parallel examples and an MVP-first strategy.

## Outcome

- Ready for /sp.implement.
