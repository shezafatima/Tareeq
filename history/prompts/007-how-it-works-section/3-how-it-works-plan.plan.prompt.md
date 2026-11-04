---
id: 3
title: How it works plan
stage: plan
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 007-how-it-works-section
branch: 007-how-it-works-section
user: shezafatima
command: /sp.plan
labels: ["home", "how-it-works", "plan", "hand-off", "carousel", "framer-motion"]
links:
  spec: specs/007-how-it-works-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/007-how-it-works-section/plan.md
 - specs/007-how-it-works-section/research.md
 - specs/007-how-it-works-section/data-model.md
 - specs/007-how-it-works-section/quickstart.md
 - specs/007-how-it-works-section/contracts/travel-stage.md
 - specs/007-how-it-works-section/contracts/carousel.md
tests:
 - none (plan stage)
---

## Prompt

/sp.plan (no extra input)

## Response snapshot

Read feature 005's implementation (HowItWorks, TravelStage, StepCarousel, CarouselCard, TravellingRobot, travel-context, useLayoutMode, the CSS section, RobotFigure*, RobotEyes changes, ADR-0001, protected hash file) and planned the change around it:
- Keep ADR-0001's twin hand-off for the cards only, so Hero.tsx is never edited; the hero robot is never hidden or touched. Hero impact statement included for the owner.
- Four CSS-decided modes (list, travel from 768px, phone, still for reduced motion), one grid layout (two columns from 1024px, stacked below), all cards in one grid cell so the height is reserved.
- Scroll progress followed by a Framer Motion spring (starting stiffness 320, damping 24, about 6% overshoot) for the settle; face swap from the hero look to the carousel front.
- One-card stack with CSS transitions, pointer-event swipe, flip cards with a real button, the owner's five-second pause rules (touch stops it for good).
- Breathing image as a client leaf using Framer Motion, stopped off screen and under reduced motion.
- One typed content file at the owner's path read through an accessor; the old step content retired.
- Delete the robot twin, RobotFigure*, two robot images, the coverflow CSS, the old check script; revert 005's RobotEyes edit after reviewing its diff.
Constitution check PASS (one item for the owner: VIII hero impact). No new dependency. Milestones 0 to 5 with a baseline first. ADR suggested (not created).

## Outcome

- ✅ Impact: plan and Phase 0/1 artifacts complete; ready for /sp.tasks.
- 🧪 Tests: none (plan stage); verification strategy defined (R10, quickstart).
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/ (2)
- 🔁 Next prompts: owner approves the hero impact statement, optionally /sp.adr how-it-works-cards-handoff, then /sp.tasks
- 🧠 Reflection: most of the risk had already been solved by 005's twin hand-off; keeping it for cards and deleting the robot half makes the change smaller than it first looks.

## Evaluation notes (flywheel)

- Failure modes observed: update-agent-context.ps1 reports success but CLAUDE.md has no markers to update (as in feature 006).
- Graders run and results (PASS/FAIL): constitution gate PASS (pre and post design)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
