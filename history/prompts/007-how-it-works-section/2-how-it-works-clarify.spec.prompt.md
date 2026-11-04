---
id: 2
title: How it works clarifications
stage: spec
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 007-how-it-works-section
branch: 007-how-it-works-section
user: shezafatima
command: /sp.clarify
labels: ["home", "how-it-works", "clarification", "reduced-motion", "carousel"]
links:
  spec: specs/007-how-it-works-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/007-how-it-works-section/spec.md
 - specs/007-how-it-works-section/checklists/requirements.md
tests:
 - none (spec stage)
---

## Prompt

/sp.clarify (no extra input). Owner answers during the session:
1. "A" (replace feature 005's travel completely).
2. "no keep the card animation as it is" (reduced motion keeps the carousel and flip animation).
3. "A" (new carousel front: step number, step name, one-line explanation; the hero sample line gives way to it).
4. "can be swipe pauses on hoovr at particular card not hover at the section stops it", then "A" (pause only while hovering the card in focus, not the section; a swipe or tap stops auto-advance for the rest of the visit).

## Response snapshot

Asked four questions, one at a time, and recorded each in the spec's Clarifications section and applied it to the requirements:
1. Replace 005's travel completely: confirmed (the 005 code is deleted).
2. Reduced motion: the carousel and flip keep their normal animation; only the scroll-linked travel, auto-advance, the mobile entrance and the robot breathing are off; without scripts all three cards show together.
3. Carousel front: step number, step name and one-line explanation; back shows the example; the hero sample line fades into the new front as the card settles.
4. Auto-advance: pauses only while the pointer is over the card in focus and while focus is in the carousel (plus hidden tab and off screen); a touch swipe or tap stops it for the rest of the visit.
Sections touched: Clarifications, User Story 2 and 4 scenarios, FR-004, FR-013, FR-014, FR-017, FR-019, FR-020, Key Entities, SC-004, SC-008, Assumptions, checklist notes.

## Outcome

- ✅ Impact: the two biggest risks (what happens to 005, and what reduced motion means) and two interaction rules are settled.
- 🧪 Tests: none (spec stage).
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan
- 🧠 Reflection: two answers were off-menu; restating the reading back to the owner before recording avoided baking in a misread rule.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): spec consistency check PASS (no contradictory wording left; no clarification markers)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
