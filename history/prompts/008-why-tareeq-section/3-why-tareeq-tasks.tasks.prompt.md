---
id: 3
title: Why Tareeq tasks
stage: tasks
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 008-why-tareeq-section
branch: 008-why-tareeq-section
user: shezafatima
command: /sp.tasks
labels: ["home", "why-tareeq", "tasks", "robot-stage", "home-order"]
links:
  spec: specs/008-why-tareeq-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/008-why-tareeq-section/tasks.md
tests:
 - none (tasks stage); check-script sections defined in T019, T020, T024, T027, T031
---

## Prompt

/sp.tasks (no extra input)

## Response snapshot

Generated tasks.md for feature 008. First read the real code to name exact files, classes, CSS blocks and the check-script sections (so each task can be followed without guessing). Phases:
- Setup and baseline: a worktree of main for the back-to-back Lighthouse comparison, an alternating Lighthouse script, baseline notes.
- Foundational: shared robot-image constant, move BreathingRobot to ui/, add RobotStage, rename the robot CSS to generic classes, delete the hero card travel (TravelStage, travel-context, the hero-look face, the travel CSS), three-mode layout hook, trim how-it-works-check, full re-check of How it works.
- US1 the section: content types and file, four inline icons, onDark tile tone, mirrored grid CSS, the rewritten WhyTareeq, retire the old principles, new check script with content, layout and breathing sections.
- US2 the order: page.tsx reorder, id on Programs, scroll cue to #programs, update the checks that assumed the old order, order/cue/hero sections.
- US3 phones, reduced motion, no scripts.
- US4 the saffron accents (sparkle, dot grid, wavy line) placed outside the text area, with an overlap and contrast check.
- Polish: full run, back-to-back Lighthouse, accessibility pass, screenshots, hand-off notes (incl. a note voiding 007's hand-off tasks), close-out asking before merge (007 merges first).
Followed the plan as written, including removing the card travel, which the owner is still to confirm.

## Outcome

- ✅ Impact: tasks.md ready for /sp.implement, starting with the baseline.
- 🧪 Tests: test tasks included as check-script sections per story.
- 📁 Files: tasks.md
- 🔁 Next prompts: owner confirms removing the card travel (or asks for something else), optional /sp.adr remove-hero-card-handoff, then /sp.implement
- 🧠 Reflection: the risky step is deleting 007's hand-off, so it is paired with a full re-check of How it works before any new section work starts.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check (see report)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
