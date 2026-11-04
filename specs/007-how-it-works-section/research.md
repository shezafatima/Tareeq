# Research: "How it works" Section With Card Hand-off and Carousel (007)

**Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This feature replaces feature 005's robot travel (owner decision, spec Clarifications). The research below is mostly about what to keep from 005 (it solved the hard problem of leaving the signed-off hero untouched), what to delete, and how to meet the new behaviour without adding anything to the project.

Read for this plan: `src/components/sections/how-it-works/*` (005), `src/components/Hero.tsx` (card markup only), `src/components/RobotEyes.tsx`, `src/components/RobotFigure*.tsx`, `src/hooks/useLayoutMode.ts`, `src/components/ui/Reveal.tsx`, `src/app/globals.css` (section on feature 005), `history/adr/0001-twin-handoff-and-css-layout-modes.md`, `specs/005-robot-travel-carousel/baseline.md`.

---

## R1. How the cards leave the hero without editing the hero

**Decision**: Keep feature 005's **twin hand-off, for the cards only**. `Hero.tsx` is not edited. The section holds three twin cards that start exactly on the hero's three cards (position, size, tilt read live), and from the first pixel of scroll the hero's card wrappers are hidden (`visibility: hidden`, `inert`, `aria-hidden`) and the twins shown, in the same task, so only one set is ever visible. Back at the top it reverses. The hero's robot is **never hidden or touched**, which is what the brief asks for ("the hero robot does NOT move").

**Rationale**:
- ADR-0001 was approved by the owner with binding conditions (fully hidden, no pop, one set visible, verified by screenshots on either side of the hand-off). Those conditions apply unchanged to the cards.
- The cards sit inside clipped, parallax and entrance layers in `Hero.tsx`, so they cannot visually leave it without restructuring the finished file (constitution Principle VIII).
- It gets simpler: the robot twin, its eye-tracking hand-off and its image swap (all of 005's hardest parts) disappear.

**Hero impact statement** (for the owner, Principle VIII): `Hero.tsx` and the other protected files keep their exact hashes (checked by `scripts/polish-token-check.mjs`). The only runtime effect on the hero is that, while scrolled, the three card wrappers are hidden and inert and then restored. The hero robot, eyes, background and card styling are unchanged. 005's edit to `RobotEyes.tsx` (see R9) is **reverted**, so the hero is closer to its finished state than today.

**Alternatives considered**: restructure the hero so cards can escape its clip (forbidden, risky); animate the real hero cards with a fixed position (breaks the hero's own layout and parallax); no travel, just a fade (does not meet the brief).

---

## R2. Layout modes decided by CSS before the first paint

**Decision**: Keep 005's rule that CSS, not scripts, decides layout and height, using the existing `html[data-js]` flag. Four modes:

| Mode | When | What |
|---|---|---|
| `list` | no JavaScript | all three cards visible together as plain text (front and example), no carousel |
| `travel` | `html[data-js]`, width 768px and up, motion allowed | cards travel from the hero, then the one-card carousel |
| `phone` | `html[data-js]`, width under 768px, motion allowed | one-card carousel, the carousel fades and rises in (existing Reveal) |
| `still` | `html[data-js]`, reduced motion (any width) | one-card carousel at rest: no travel, no auto-advance, no breathing, no entrance; slide and flip still animate when the visitor acts (owner decision) |

The section's column layout is independent of the mode and also pure CSS: two columns from 1024px (robot left; heading, intro and carousel right), stacked below (heading, robot, carousel). One DOM order (heading block, robot, carousel) serves both through CSS grid areas, so nothing reflows when scripts arrive.

**Height**: all three cards are stacked in one grid cell, so the carousel's height is always the tallest card, known from the server HTML. Nothing shifts when the carousel starts (FR-025).

**Rationale**: it is how 005 got zero layout shift. The client only attaches behaviour to the mode CSS already chose (`useLayoutMode`, updated for the four modes).

**Alternatives considered**: choose the mode in JavaScript after mount (causes a layout jump and a flash of the wrong layout).

---

## R3. Scroll-linked travel with a spring settle

**Decision**: Progress `p` (0 to 1) comes from scroll position: 0 at the top of the page, 1 when the carousel slot has reached a comfortable place on screen (`ARRIVE_AT`: the slot's centre at about 60% of the viewport height; measured, not hard-coded, and recomputed on resize, font load and layout change). The twin cards' transforms follow a **spring follower** of `p` (Framer Motion `useSpring`, starting values stiffness 320, damping 24, which is a damping ratio of about 0.67 and an overshoot of about 6%). Slow scrolling tracks tightly; arriving fast or stopping lets the spring settle with a small overshoot, then the carousel takes over. Reversing scroll reverses the same path.

The overshoot is the spring's own (positions extrapolate slightly past the target), so it needs no separate animation and cannot desynchronise from scroll. Measured by the check script against SC-003 (settles within 0.8 s, overshoot under about 10% of the distance).

**Face swap**: as in 005, each twin has a compact face (the hero card's look) and the carousel front. From about 65% of progress the compact face fades out and the front fades in, so the hero's look gives way to the step number, name and one-line explanation with no flash (owner decision, clarification 3).

**Alternatives considered**: a time-based tween started at a scroll threshold (not scroll-linked, cannot reverse cleanly); CSS scroll-driven animations (not supported on all target browsers); GSAP (excluded by the owner).

---

## R4. Carousel: one card in focus, no coverflow

**Decision**: The three cards occupy the same grid cell. The card in focus is fully visible; the others are hidden and inert (`opacity: 0`, `inert`, `aria-hidden`). Changing card slides the old one out and the new one in with CSS transitions on `transform` and `opacity` only, driven by a `data-pos` attribute (`active`, `before`, `after`) set by the client controller. The controller is a thin client wrapper around server-rendered cards (005's pattern), so the card text is in the HTML for every mode and for search engines.

**Swipe**: pointer events on the carousel with `touch-action: pan-y`, so vertical scroll is never blocked. A mostly sideways drag past a threshold (or a fast flick) moves one card; the card follows the finger while dragging. Works at any width, so tablets and touch laptops swipe too.

**Controls**: dots (a 44px target each), previous and next buttons, and Left/Right arrow keys while focus is inside. Cycling at the ends.

**Accessibility**: the carousel is a `region` with `aria-roledescription="carousel"`; each card is a `group` with `aria-roledescription="slide"` and a label such as "1 of 3: Prompt"; only the card in focus is reachable. The live region is `polite` only after the visitor has interacted, never during auto-advance.

**Alternatives considered**: native scroll-snap track (005's phone mode: good for touch, but a different mechanism from the desktop one, and harder to pair with the travel and the flip); a carousel library (not allowed, not needed).

---

## R5. Auto-advance rules

**Decision** (spec FR-017, owner decisions 2 and 4): a 5-second timer that runs only when none of these hold:
- the pointer is over the card in focus (fine pointers only; hovering elsewhere in the section does nothing),
- keyboard focus is inside the carousel,
- the tab is hidden (`visibilitychange`),
- the section is off screen (`IntersectionObserver`),
- a card is flipped,
- in `travel` mode, the cards have not arrived yet.

A touch swipe, or a tap on a card or control, stops it **for the rest of the visit** (state in memory only; nothing stored). In `still` and `list` modes it never runs.

**Rationale**: matches the owner's rules; touch has no hover, so a deliberate stop is the only way to keep a phone visitor from being pulled away from a card they are reading.

---

## R6. Flip cards

**Decision**: Each card has a front and a back in the DOM. A CSS 3D flip (`transform: rotateY`, `backface-visibility: hidden`; `transform` only) toggles on: pointer hover (fine pointers), tap, and Enter or Space on a real `button` placed on the card (a small "See an example" / "Back" control, so the flip is keyboard-operable without wrapping headings in a button). The face that is not showing is `aria-hidden` and `inert`. A card flipped by hover returns when the pointer leaves; one flipped by tap or key returns when flipped again or when it leaves focus (spec Assumptions). The flip keeps its animation under reduced motion (owner decision; it only happens when the visitor acts). In `list` mode (no JavaScript) both faces are shown as plain text.

**Alternatives considered**: whole card as `role="button"` (hides the card's heading from screen readers); flip on hover only (not keyboard- or touch-operable).

---

## R7. Robot image and its breathing

**Decision**:
- **Image**: `next/image` for `/how-it-works.png` (407×612 portrait, about 245 KB source, transparent), explicit `width` and `height`, lazy (not `priority`), `sizes="(min-width: 1024px) 340px, 200px"` so phones fetch a small optimised copy. Description (DRAFT): "The Tareeq robot assistant, smiling, with one hand held out as if presenting the steps." Never mirrored (the chest chevron is a brand mark).
- **Breathing**: a small client leaf, `BreathingRobot`, using Framer Motion (already in the project, already loaded by the hero): a keyframed loop of about 4 s on the image wrapper (`scale` 1 → 1.02 → 1, `y` 0 → -5 → 0, `transform-origin` at the bottom, ease-in-out) and, in sync, the glow behind it (`opacity` and `scale` only). The glow is a radial gradient of the existing saffron and blue tokens at low opacity (no new colours; saffron is never text). It runs only while the section is in view (`useInView`) and not at all under reduced motion (`useReducedMotion`), where the image and glow are still. Both layers are `aria-hidden` except the image's own description.

**Alternatives considered**: CSS keyframes (lighter, but the brief asks for Framer Motion and the pause-off-screen logic is already needed in script); a canvas or video (excluded, heavy).

---

## R8. Content: one typed file, read through the accessor

**Decision**: `src/content/how-it-works.ts` (the path the owner named) holds everything the section says: heading, one-line intro, image description, and for each step: id, number, name, one-line explanation, example. Types live in `src/content/types.ts` with the rest. It is read through a new accessor, `getHowItWorks()`, in `src/content/index.ts`, like all other copy (the lint rule that blocks imports from `src/content/data/*` outside the content folder keeps pages from importing it directly). All wording that is not the owner's is marked `DRAFT: owner to confirm before launch`.

The existing step content is **retired, not duplicated**: `src/content/data/steps.ts`, `getSteps()`, the `Step` type and `homeCopy.howItWorks` are removed once the new file replaces them (their only consumer is the section being rewritten). The new file starts from their wording ("Say what you need", "Make something that works", "Understand why it works", "Every session follows the same three steps.").

**Alternatives considered**: keep `steps.ts` and add examples beside it (two files to review, two sources of the step names); put the file under `data/` (the owner named a path; a note in the plan records the deviation from the folder convention, with no cost).

---

## R9. What gets deleted from feature 005

**Decision** (owner decision A, spec FR-004): remove, not layer over:
- `TravellingRobot.tsx`, `RobotFigure.tsx`, `RobotFigureLive.tsx` and `public/robot-chevron.png`, `public/robot-noeyes-nochevron.png` (used only by the robot twin; `robot-noeyes.png` stays because the hero uses it).
- The robot parts of `travel-context.ts` and `TravelStage.tsx` (twin registration, robot hand-off, hovered-card reaction, the sticky runway), and the coverflow, sticky-stage and robot CSS in `globals.css`.
- `scripts/robot-travel-check.mjs`, replaced by `scripts/how-it-works-check.mjs`.
- **`RobotEyes.tsx`**: 005 added an optional `cardElement` prop, a pause while the robot sits inside an `inert` element, and a gaze snap on resume. All three exist only for the robot twin. The plan reverts the file to its pre-005 version (`git diff 492ab86^ HEAD -- src/components/RobotEyes.tsx` is reviewed at implementation; if anything else now depends on a change, that part stays and is named), so the hero's own code returns to its finished state.
- ADR-0001 is **kept** as history. Its card hand-off decision stands; its robot-twin parts are superseded. An ADR-0002 is suggested (see plan).

**Rationale**: leaving a second robot, two unused images and a travel layer for a robot that no longer travels would be dead code that still has to work.

---

## R10. Testing and baseline

**Decision**:
- **Baseline first**: before changing anything, record on a production build of this branch (identical to `main`): Lighthouse mobile, 5 runs on `/` (the same method as `shots/005/lh.sh`; feature 005 median was 91), total JS bytes in `.next/static/chunks` (812,850 at 005), and hero screenshots at 1440×900 and 390×844.
- **New check script** `scripts/how-it-works-check.mjs` (Playwright, project convention) with sections: layout at 360, 390, 768, 1024, 1440 (no sideways scroll, column layout), the hand-off (frame-by-frame: one visible set, no gaps; overshoot and settle time; reverse returns the hero), carousel (auto-advance timing, every pause rule, controls, swipe, keys, flip by mouse, touch and keyboard, the Prompt example text), reduced motion, no JavaScript, breathing (period, amplitude, paused off screen), console clean, and tabbing mid-scroll (focus never lands on a hidden element).
- **Hero protection**: `scripts/polish-token-check.mjs` (hash check) and a before/after comparison of hero element positions and screenshots.
- **After**: Lighthouse 5 runs and JS bytes compared with the baseline (SC-010, SC-011).

---

## R11. Risks and unknowns carried into the plan

- **Tablet range (768 to 1023)**: the carousel sits below the robot image in the stacked layout, so the cards travel further than on desktop. `ARRIVE_AT` is measured, not fixed, so it works, but it needs a visual check at 768×1024.
- **Hero markup coupling**: the hand-off finds the hero's card wrappers by `data-hero-card` (already in `Hero.tsx`). A hero change would need this rechecked; the check script covers it.
- **Spring feel**: the starting spring values are a first guess; they are tuned against SC-003 and by eye at implementation.
- **Hover flip on desktop** can feel twitchy when the pointer crosses the card edge; a short hold (about 120 ms) before flipping and a hysteresis on leaving are the planned guard.
