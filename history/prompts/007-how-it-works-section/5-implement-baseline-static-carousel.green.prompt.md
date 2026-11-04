---
id: 5
title: Implement baseline static section carousel
stage: green
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 007-how-it-works-section
branch: 007-how-it-works-section
user: shezafatima
command: /sp.implement (phases 1 to 3)
labels: ["home", "how-it-works", "implement", "carousel", "flip", "accessibility"]
links:
  spec: specs/007-how-it-works-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/007-how-it-works-section/baseline.md
 - specs/007-how-it-works-section/tasks.md
 - specs/004-site-visual-polish/protected.sha.json
 - scripts/polish-token-check.mjs
 - scripts/home-check.mjs
 - scripts/how-it-works-check.mjs
 - src/content/how-it-works.ts
 - src/content/index.ts
 - src/content/types.ts
 - src/content/data/cta.ts
 - src/hooks/useLayoutMode.ts
 - src/components/RobotEyes.tsx
 - src/components/sections/how-it-works/HowItWorks.tsx
 - src/components/sections/how-it-works/CarouselCard.tsx
 - src/components/sections/how-it-works/StepCarousel.tsx
 - src/components/sections/how-it-works/TravelStage.tsx
 - src/components/sections/how-it-works/travel-context.ts
 - src/app/globals.css
tests:
 - how-it-works-check: layout and no-JS (57/57), controls and flip (39/39), carousel timing and pause rules (11/11), touch stop (2/2)
 - home-check (all pass), polish-token-check (all pass), lint, build (clean)
---

## Prompt

/sp.implement (no extra input), then "continue" twice. Mid-turn owner message: "I said you to move cards also with scroll from hero section I omitted robot only for scroll effect not cards also."

## Response snapshot

Phase 1 (baseline): production build of main's code; Lighthouse x5 on / (median 75, TBT about 800 ms, LCP 1.1 s, CLS 0; it swings 75 to 91 with machine load, so the final comparison will be back to back against main), JS 870,102 bytes, hero screenshots saved. Found the hero guard failing for reasons from feature 006 (Hero.tsx's one-line owner-approved link change, and the new approved dependencies); re-recorded the Hero.tsx hash (only that entry changed) and updated the dependency expectation.

Phase 2 (foundational): content types, file and accessor; deleted the robot twin, RobotFigure*, two images, the old check script; reverted RobotEyes.tsx to its pre-005 version (byte-identical); four-mode layout hook; trimmed context; rewrote CarouselCard and HowItWorks (server); replaced the old CSS with the new grid layout and list mode; retired the old step content; updated home-check (also fixed its stale CTA expectation from feature 006); built the check script skeleton with layout and no-JS sections.

Phase 3 (carousel): CSS stack and flip (with an override so the slide and flip keep animating under reduced motion), and the StepCarousel controller (controls, arrow keys, pointer-event swipe, flip by hover/tap/button, the owner's pause rules, touch stop). A real accessibility bug was found and fixed by the keyboard test: making the flipped-from face inert dropped focus and flipped the card straight back; focus is now moved to the face that stays visible before the other is made inert.

The owner's mid-turn message: the cards must travel with the scroll out of the hero (only the robot is excluded). That is already the plan; it is the next phase (hand-off), which is why it is not visible yet.

## Outcome

- ✅ Impact: the static section and the working carousel (MVP) are in; 24 of 47 tasks done.
- 🧪 Tests: all automated checks pass.
- 📁 Files: see list.
- 🔁 Next prompts: continue with Phase 4 (the hand-off: cards travel from the hero with the spring settle).
- 🧠 Reflection: the keyboard-flip bug only showed up because the check drove the real keyboard; an inert toggle on a focused element is easy to miss by reading code.

## Evaluation notes (flywheel)

- Failure modes observed: a combined build+start shell command exceeded its time limit once (a stuck build was stopped and rerun with output to a file); the shell choked on a heredoc containing an apostrophe (switched to file writes).
- Graders run and results (PASS/FAIL): all PASS after one keyboard-focus fix
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
