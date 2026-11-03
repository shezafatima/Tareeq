---
id: 3
title: Twin handoff ADR and approvals
stage: misc
date: 2026-11-02
surface: agent
model: claude-opus-5-5
feature: 005-robot-travel-carousel
branch: 005-robot-travel-carousel
user: shezafatima
command: /sp.adr
labels: ["adr", "hero-protection", "twin-handoff", "layout-modes", "accessibility"]
links:
  spec: specs/005-robot-travel-carousel/spec.md
  ticket: null
  adr: history/adr/0001-twin-handoff-and-css-layout-modes.md
  pr: null
files:
 - history/adr/0001-twin-handoff-and-css-layout-modes.md
 - specs/005-robot-travel-carousel/plan.md
 - specs/005-robot-travel-carousel/contracts/travel-stage.md
tests:
 - none (documentation only)
---

## Prompt

/sp.adr twin-handoff-and-css-layout-modes 1. Approved, with one fix. Opacity 0 leaves the hero's cards still in the tab order and still read by screen readers while invisible. When hidden, also set visibility:hidden (or aria-hidden plus inert) so they are not focusable or announced, and restore it at the top. Confirm by tabbing through the page mid-scroll: focus must never land on an invisible hero card.

2. Approved as described. Optional prop, default unchanged.

3. Approved, with conditions. A twin is fine, but the handoff must be imperceptible:
   - The twin must appear at exactly the hero robot's position, size and rotation at the moment of handoff, so there is no pop, jump or scale change.
   - Only one robot is visible at any time, and the hidden one must not be focusable or announced.
   - The hidden robot's eye tracking, blink loop and any animation must pause while it is hidden, so we are not running two of everything.
   - Reuse the same image file so it is served from cache, not fetched twice.
   - Verify with screenshots taken either side of the handoff frame, plus one during it. If there is any visible pop, tell me and we will reconsider rather than ship it.

## Response snapshot

Created the project's first ADR, `history/adr/0001-twin-handoff-and-css-layout-modes.md` (no create-adr script or `history/adr/` existed; filled the template by hand), as one decision cluster: CSS-decided layout modes via an inline `data-js` flag, and the twin hand-off from the unedited hero, with the owner's conditions as binding parts of the decision. Updated plan.md (Constitution Check VIII approved with conditions; hero impact statement now uses `visibility: hidden` plus `inert` plus `aria-hidden`; added the `RobotEyes` inert-pause with gaze snap on resume that condition 3 requires; the known limit that the hero's parallax springs cannot be paused without editing `Hero.tsx`) and the travel contract (hand-off table, owner checks, tighter hand-off tolerance for the robot).

## Outcome

- Impact: Decisions recorded and approved; plan ready for `/sp.tasks`.
- Tests: none (documentation only).
- Files: ADR-0001, plan.md, contracts/travel-stage.md.
- Next prompts: `/sp.tasks`.
- Reflection: meeting condition 3 needs one more small `RobotEyes` behaviour (pause while inert, snap gaze on resume) beyond the approved prop; stated explicitly to the owner.

## Evaluation notes (flywheel)

- Failure modes observed: no create-adr script and no ADR directory in the project (handled by hand).
- Graders run and results (PASS/FAIL): ADR grader PASS (clustered decision, alternatives with rationale, positive and negative consequences, concise, references).
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): build and verify the hand-off (before, during, after screenshots) before any carousel work, so a visible pop is caught first.
