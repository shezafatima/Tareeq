---
id: 2
title: Robot travel carousel plan
stage: plan
date: 2026-11-02
surface: agent
model: claude-opus-5-5
feature: 005-robot-travel-carousel
branch: 005-robot-travel-carousel
user: shezafatima
command: /sp.plan
labels: ["plan", "robot-travel", "carousel", "sticky-stage", "hero-impact"]
links:
  spec: specs/005-robot-travel-carousel/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/005-robot-travel-carousel/plan.md
 - specs/005-robot-travel-carousel/research.md
 - specs/005-robot-travel-carousel/data-model.md
 - specs/005-robot-travel-carousel/quickstart.md
 - specs/005-robot-travel-carousel/contracts/travel-stage.md
 - specs/005-robot-travel-carousel/contracts/carousel.md
tests:
 - none (planning only)
---

## Prompt

/sp.plan (no additional input), followed mid-turn by the owner's message: "move on"

## Response snapshot

Read the constitution and the hero's robot and eye code. Planned: layout modes (travel, swipe, list) decided by CSS before first paint via an inline `data-js` flag, so no reflow; a visually identical twin robot and the carousel cards in a sticky stage, handed off invisibly from the hero at the first pixel of scroll (hero hidden by inline opacity as feature 003 did for the cards; `Hero.tsx` not edited); travel ending exactly when the stage starts sticking inside a tall, unpinned runway; coverflow on an inner element, fanned out on arrival; WAI carousel pattern with 4 s autoplay and the specified pause and stop rules; scroll-snap swipe below 1024px; feature 003's stage deleted. Hero impact statement for approval: runtime opacity on the hero's robot and cards, and one optional default-preserving prop on `RobotEyes` so the twin can look at carousel cards. The twin is flagged as a deviation from the spec's "same robot" assumption. ADR suggested.

## Outcome

- Impact: Plan ready for `/sp.tasks`, pending approval of the hero impact statement.
- Tests: none (planning only).
- Files: plan.md, research.md, data-model.md, quickstart.md, two contracts.
- Next prompts: approve the hero impact and twin approach; `/sp.tasks`; optionally `/sp.adr twin-handoff-and-css-layout-modes`.
- Reflection: the eye component's card lookup is hard-wired to the hero's cards; found by reading the code before planning.

## Evaluation notes (flywheel)

- Failure modes observed: none.
- Graders run and results (PASS/FAIL): Constitution Check PASS except Principle VIII (approval needed).
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): build the hand-off at scroll 0 to 3px first and prove the hero identical before building the carousel.
