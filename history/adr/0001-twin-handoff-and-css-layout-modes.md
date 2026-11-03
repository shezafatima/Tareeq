# ADR-0001: Twin Hand-off and CSS-Decided Layout Modes for Animating Out of the Finished Hero

> **Scope**: One decision cluster: how the home page animates the robot and cards out of the signed-off hero into "How it works" without editing the hero, and how the section picks its layout without layout shift.

- **Status:** Accepted (owner approved 2026-11-02, with conditions recorded below)
- **Date:** 2026-11-02
- **Feature:** 005-robot-travel-carousel
- **Context:** The hero (robot, eye tracking, floating cards, gradient) is finished and protected by constitution Principle VIII. Feature 005 wants the robot and its three cards to travel out of the hero into a sticky "How it works" stage on desktop, become a coverflow carousel, and fall back to a swipe carousel on phones and a plain list with reduced motion or no JavaScript. The hero's robot sits inside clipped (`overflow-hidden`), parallax and entrance layers inside `Hero.tsx`, so it cannot visually leave the hero without restructuring that file. The section must also reserve its height from the first paint (no layout shift) even though its layout depends on width, motion preference and whether JavaScript runs.

## Decision

1. **Layout modes decided by CSS before first paint.** A one-line inline script in the root layout sets `<html data-js>`. CSS chooses the section's layout and height:
   - `travel`: `html[data-js]`, width at least 1024px, `prefers-reduced-motion: no-preference` (tall unpinned runway with a sticky stage);
   - `swipe`: `html[data-js]`, width below 1024px, motion allowed (scroll-snap track);
   - `list`: no JavaScript, or reduced motion (all steps visible).
   Client code only attaches behaviour to the mode CSS already chose; it never changes layout.
2. **Twin hand-off instead of moving the hero's elements.** The sticky stage holds a visually identical robot (`RobotFigure eyes="live"`, same image file and settings as the hero) and the three carousel cards. At scroll 0 they are hidden; from the first pixel of scroll the hero's robot layer and card wrappers are hidden and the twins are shown at the hero items' live positions, then moved by `transform` to the stage. `Hero.tsx` is not edited.
3. **Owner conditions (binding):**
   - Hidden elements are fully hidden, not just transparent: `visibility: hidden` plus `inert` (and `aria-hidden`) on the hero's card wrappers and robot layer while scrolled, and on the twin robot at scroll 0; restored at the top. Focus must never land on an invisible element (checked by tabbing mid-scroll).
   - The twin appears at exactly the hero robot's position, size and rotation at the hand-off moment (start pose read live from the hero's robot image), so there is no pop, jump or scale change. Only one robot is visible at any time.
   - The hidden robot's eye tracking and blink loop pause while hidden. `RobotEyes` pauses its frame loop while it is inside an `inert` element and, on resuming, snaps its gaze to the current target (and opens the eyes), so the visible robot's eyes match at the swap without a visible swing. This is in addition to the approved optional `cardElement(id)` prop (default unchanged).
   - The twin reuses the same image file and `sizes` as the hero, so it is served from cache, not fetched twice.
   - Verified with screenshots on either side of the hand-off frame and one during it; any visible pop stops the feature for reconsideration rather than shipping.
4. **Arrival-gated carousel.** Scroll-driven travel transforms and time-driven coverflow transitions live on separate elements; the coverflow only takes over when travel has arrived (hysteresis 1 / 0.99), when the stage begins to stick.

## Consequences

### Positive

- The hero stays pixel-identical at the top without touching `Hero.tsx`; Principle VIII is respected with two small, approved runtime and `RobotEyes` changes.
- No layout shift: every mode's height is known before the first paint; without JavaScript the list renders correctly.
- The pattern is reusable for any future "animate out of a finished component" need, and `RobotFigure` gives the site one robot component.
- Hidden copies are removed from focus and the accessibility tree, and paused, so there is no double announcement and no double animation cost.

### Negative

- Two robot instances exist on desktop; correctness depends on the hand-off measuring the hero's live pose each scroll frame during early travel.
- Blink timing of the two instances is independent; a blink exactly at the swap could differ for up to 0.14 s.
- The hero's parallax springs (inside `Hero.tsx`) cannot be paused without editing the hero; they compute only on pointer movement and paint nothing while the robot is hidden.
- The selectors used to find the hero's robot layer and cards rely on the hero's current markup; a hero change would need this checked (covered by the travel check script).
- `RobotEyes.tsx` (a hero file) gains behaviour: an optional prop and an inert-pause with gaze snap on resume. Default hero behaviour at the top is unchanged, proven by the hero compare.

## Alternatives Considered

- **Move the real robot (portal or DOM move) and restructure the hero's layers.** One robot, no hand-off, but a large rewrite of the signed-off hero, with high risk to its look and eye behaviour. Rejected under Principle VIII.
- **Crossfade between the hero robot and a copy.** Simpler timing, but shows a ghosted double robot during the fade, the exact problem the owner rejected in feature 003. Rejected.
- **Choose the layout in React after hydration (`useMotionMode`).** Simpler code, but the section's height would change after load, causing layout shift and a visible jump. Rejected.
- **Pinned, scroll-scrubbed scene.** Precise choreography, but the owner asked for no pinning and normal scroll. Rejected.

## References

- Feature Spec: [specs/005-robot-travel-carousel/spec.md](../../specs/005-robot-travel-carousel/spec.md)
- Implementation Plan: [specs/005-robot-travel-carousel/plan.md](../../specs/005-robot-travel-carousel/plan.md)
- Research and contracts: [research.md](../../specs/005-robot-travel-carousel/research.md), [contracts/travel-stage.md](../../specs/005-robot-travel-carousel/contracts/travel-stage.md), [contracts/carousel.md](../../specs/005-robot-travel-carousel/contracts/carousel.md)
- Related ADRs: none (first ADR in this project)
- Evaluator Evidence: [history/prompts/005-robot-travel-carousel/3-twin-handoff-adr.misc.prompt.md](../prompts/005-robot-travel-carousel/3-twin-handoff-adr.misc.prompt.md)
