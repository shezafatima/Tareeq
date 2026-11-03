---
id: 1
title: Robot travel carousel spec
stage: spec
date: 2026-11-02
surface: agent
model: claude-sonnet-5-5
feature: 005-robot-travel-carousel
branch: 005-robot-travel-carousel
user: shezafatima
command: /sp.specify
labels: ["robot-travel", "carousel", "how-it-works", "scroll", "hero-protection"]
links:
  spec: specs/005-robot-travel-carousel/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/005-robot-travel-carousel/spec.md
 - specs/005-robot-travel-carousel/checklists/requirements.md
 - history/prompts/005-robot-travel-carousel/1-robot-travel-carousel-spec.spec.prompt.md
tests:
 - none (specification only)
---

## Prompt

"How it works" becomes the FIRST section after the hero. Move "Who it's for" to sit after it.Feature: robot travels into the "How it works" section.

This REPLACES the current hero-to-"How it works" card behaviour from feature 003. The cards no longer settle into three columns, and the connector line is removed. Delete that code rather than layering on top of it.

## The idea
As the visitor scrolls out of the hero, the robot and its three cards travel together into the "How it works" section below. The robot settles on the left, the cards become a carousel on the right.

## Desktop (1024px and up)
- Robot: travels from its hero position down and across to the LEFT side of the "How it works" section, scaling down slightly. It becomes sticky within that section, so it stays in view while the visitor reads, then releases at the section's end.
- Do NOT mirror or flip the robot image. Its chest chevron is a brand mark and would point the wrong way. If a flip is still wanted, flip the image but overlay the chevron separately so it stays correct, and tell me before doing it.
- The robot's eye tracking, blink and card-hover reactions must keep working in its new position. Its parallax may be reduced or dropped here if it fights the scroll.
- Cards: travel from the hero to the RIGHT side and form a carousel: one card centred and fully visible, the other two behind and to the sides, smaller, dimmed and slightly rotated, like a coverflow.
- The section is NOT pinned. It is taller than the viewport, and everything is driven by normal scroll position. Scrolling back up reverses the travel smoothly.

## Carousel behaviour
- Autoplays, advancing one card at a time, roughly every 4 seconds, with a smooth rotate-and-slide between positions.
- Pauses on hover, on keyboard focus, when the tab is hidden, and when the section is out of view.
- Each card shows its step: Prompt, Build or Learn, with heading, body text and its icon. The centred card is the only one that is readable; the side cards are decorative.
- Keyboard accessible: arrow keys move between cards, focus is visible, and autoplay stops once the visitor interacts. Dots or a simple control indicate position and allow manual selection.
- The robot looks toward the active card as it changes.

## Mobile and tablet (below 1024px)
- No travel animation and no sticky robot. The section renders normally: the robot image above or beside, scaled to fit, and the cards below as a swipeable carousel, one card at a time, full width.
- Swipe gestures work. Autoplay still applies with the same pause rules.
- The robot stays in the hero on mobile as it does today.

## Non-negotiable
- The section must be complete and readable with all animation removed. All three steps' content must be reachable: with reduced motion or no JavaScript, show the three cards as a simple stacked or three-column list, not a carousel.
- prefers-reduced-motion: no travel, no autoplay, no rotation. Static cards.
- Animate only transform and opacity. Reserve the section's height from the start so nothing reflows. No scroll jank on a mid-range phone.
- The hero must look and behave exactly as it does today at the top of the page. Moving the robot into a shared layer must not change its appearance, eye tracking or card hover there. Compare before and after with screenshots and computed styles.

## Verify
- Build and lint clean.
- Scroll-sequence screenshots at 1440x900: top of hero, mid-travel, robot settled, and each of the three carousel positions.
- Screenshots at 390x844 of the hero and the section.
- Confirm the hero is pixel-identical to before at both widths.
- Confirm the section reads correctly with JavaScript disabled and with reduced motion.
- Report Lighthouse mobile Performance and CLS before and after.

## Response snapshot

Pre-flight: `main` clean and no unmerged feature. Created branch `005-robot-travel-carousel` and wrote `specs/005-robot-travel-carousel/spec.md`: six user stories (travel P1, carousel P1, phones P1, always-readable P1, robot stays alive P2, page order P2), edge cases, 29 functional requirements, key entities, 11 success criteria, assumptions. Zero [NEEDS CLARIFICATION] markers. Records the owner decisions (How it works first and feature 003's card behaviour replaced and deleted; robot never mirrored; section not pinned) and flags that moving the robot out of the finished hero needs a hero impact statement and the owner's approval at plan time. Checklist passes.

## Outcome

- Impact: Spec ready for `/sp.plan`.
- Tests: none (specification only).
- Files: spec.md, checklists/requirements.md, this PHR.
- Next prompts: `/sp.plan` (how one robot can live in both the hero and the section, hero impact statement); take the Lighthouse "before" first.
- Reflection: the create-new-feature script again printed its trailing parameter error after creating the branch and spec file.

## Evaluation notes (flywheel)

- Failure modes observed: script's trailing "positional parameter ... 'prompts'" error (same as before).
- Graders run and results (PASS/FAIL): spec quality checklist PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): prototype the shared-robot hand-off at scroll 0 first and prove the hero is pixel-identical before building the carousel.
