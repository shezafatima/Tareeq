---
id: 1
title: How it works section spec
stage: spec
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 007-how-it-works-section
branch: 007-how-it-works-section
user: shezafatima
command: /sp.specify
labels: ["home", "how-it-works", "carousel", "scroll-handoff", "spec"]
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

/sp.specify Home: "How it works" section

Position: the first section directly after the hero. Do not change the hero's layout, robot, eyes, background or card styling, except what is strictly needed to hand the cards off on scroll.

Purpose: explain the Tareeq method in 3 steps using the hero's three cards (Prompt, Build, Learn).

Layout:
- Desktop (>=1024px): two columns. Left: robot image /how-it-works.png (next/image, lazy, explicit width/height, meaningful alt). Right: section heading "How it works", one-line intro, and the card carousel.
- Mobile/tablet: heading, then the robot image (smaller, centred), then the carousel. No horizontal page scroll at 360px.

Card hand-off from hero (scroll-linked):
- As the user scrolls from the hero, the three hero cards travel down and settle into the carousel position in this section. The hero robot does NOT move.
- Settle with a short spring and a slight overshoot, then the carousel takes over. The travel must feel continuous, with no flash or duplicate cards visible at once.
- Scrolling back up reverses it: the cards return to their hero positions.
- Mobile (<768px): no travel. Cards fade and rise into place when the section enters the viewport.
- prefers-reduced-motion: no travel and no auto-play. Cards are simply present.

Carousel:
- One card in focus at a time. Auto-advances every 5s. Pauses on hover, on focus and while the tab is hidden. Dots plus prev/next buttons, and swipe on touch.
- Each card shows a step number, title and one line. Hover/tap flips it to the back, which has one concrete example (e.g. Prompt: "Turn a lesson plan into 5 quiz questions in 2 minutes"). Flip is keyboard-operable (Enter/Space).
- Placeholder copy goes in one typed content file (src/content/how-it-works.ts) for owner review.

Robot image breathing:
- A continuous gentle loop of about 4s: scale 1 -> 1.02 with a 4-6px upward drift, transform-origin at the bottom, ease-in-out. Add a soft saffron/blue glow behind it that pulses in sync.
- Pause the animation when the section is off-screen. Static under reduced motion.

Constraints:
- Server Component section. Client leaves only for card travel, carousel and breathing.
- Animate transforms and opacity only (no layout thrash). Use Framer Motion, which is already in the stack. No GSAP.
- Brand tokens, Sora/Inter, existing background. No new colours.
- Must not regress the hero's LCP or its viewport-fit.

Out of scope: other home sections, admin-managed content.

## Response snapshot

Created branch 007-how-it-works-section and the spec: 4 user stories (cards travel from the hero P1, carousel with flip cards P1, phones/tablets/reduced motion P2, robot breathing P3), edge cases, 29 functional requirements, 12 measurable success criteria, scope, dependencies and assumptions. Found that this overlaps with merged feature 005 (robot travels, pinned robot, coverflow, 4 s autoplay) and contradicts it (here the hero robot stays, the section has its own robot image, one card at a time, 5 s), so the spec records the assumption that it replaces 005's travel code (owner to confirm). Other defaults recorded: reduced motion/no-script show all three cards together; cards travel from 768px; autoplay resumes after interaction rather than stopping; placeholder Build/Learn examples, intro and image description are DRAFT. Zero clarification markers; checklist passes.

## Outcome

- ✅ Impact: spec ready for /sp.clarify or /sp.plan once the owner confirms the replace-005 assumption.
- 🧪 Tests: none (spec stage).
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: confirm the three defaults, then /sp.plan (hero impact statement, Lighthouse baseline from feature 005, step content reuse)
- 🧠 Reflection: the brief reads like a fresh feature but silently supersedes a merged one; stating that explicitly avoids two competing implementations.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 printed a parameter-binding error but still created the branch and spec file (same as feature 006).
- Graders run and results (PASS/FAIL): spec quality checklist PASS (all items)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
