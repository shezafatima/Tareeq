---
id: 4
title: How it works tasks
stage: tasks
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 007-how-it-works-section
branch: 007-how-it-works-section
user: shezafatima
command: /sp.tasks
labels: ["home", "how-it-works", "tasks", "carousel", "hand-off"]
links:
  spec: specs/007-how-it-works-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/007-how-it-works-section/tasks.md
tests:
 - none (tasks stage); check-script sections defined in T015, T023, T029, T036, T040
---

## Prompt

/sp.tasks (no extra input)

## Response snapshot

Generated tasks.md with 47 tasks (format validated: checkbox, ID, file path; story labels only in story phases):
- Setup and baseline: 2 (Lighthouse, JS size, hero screenshots and hash before any change)
- Foundational: 14 (content types, file and accessor; delete the robot twin; revert 005's RobotEyes edit; four-mode layout hook; trimmed context; rewritten server CarouselCard and HowItWorks; base CSS; retire steps content; check-script skeleton)
- US2 carousel (MVP): 8
- US1 hand-off: 7
- US4 phones, tablets, reduced motion, no scripts: 6
- US3 breathing: 4
- Polish and close-out: 6
Order: US2 before US1 because the cards land in the carousel (both P1). Called out two pitfalls: the site's global reduced-motion rule would zero the slide and flip transitions the owner wants kept (T017 overrides it with higher specificity), and the hand-off must never pop (T030 screenshots, stop if it does). Only 4 tasks are parallel because most share StepCarousel, TravelStage, globals.css or the check script.

## Outcome

- ✅ Impact: tasks.md ready for /sp.implement, starting with the baseline.
- 🧪 Tests: test tasks included as check-script sections per story.
- 📁 Files: tasks.md
- 🔁 Next prompts: owner approves the hero impact statement, optional /sp.adr how-it-works-cards-handoff, then /sp.implement
- 🧠 Reflection: the global prefers-reduced-motion rule is the kind of thing that silently defeats an owner decision; naming it in a task keeps it from being rediscovered late.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check PASS (47/47)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
