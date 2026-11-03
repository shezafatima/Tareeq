# Research: Robot Travels Into "How It Works" as a Carousel

All items resolved; no open NEEDS CLARIFICATION.

## R1. How the robot can leave the hero without changing the hero

- **Decision**: A visually identical twin in the section's sticky stage, shown from the first pixel of scroll at the hero robot's live position while the hero's robot layer is hidden with an inline opacity; the twin then moves by `transform`.
- **Rationale**: The hero's robot sits inside clipped (`overflow-hidden`), parallax and entrance layers inside `Hero.tsx`; it cannot visually leave without restructuring that file. Identical pixels in the same place make the swap invisible. Feature 003 already proved the technique for the cards (one card visible at a time, hand-off checked within 3px).
- **Alternatives**: React portal or DOM move of the hero's robot (hero rewrite); fading between hero and twin (ghosted double, rejected by the owner in feature 003); a canvas snapshot (not interactive, no eyes).

## R2. Making the twin's eyes match at the swap

- **Decision**: Mount the twin and its `RobotEyes` from load (invisible), feed it the same pointer input logic as the hero, and drop parallax for the twin.
- **Rationale**: `RobotEyes` springs its gaze toward the aim computed from the cursor; two instances fed the same cursor converge to the same gaze. Each instance already pauses its frame loop when its SVG is off screen or the tab is hidden, so the twin costs nothing while not visible. Blink timing is random per instance; a blink lasts 0.14 s, so a mismatch at the swap is not perceptible.
- **Alternatives**: Mounting the twin only when needed (its gaze would start at the centre and visibly swing).

## R3. Looking at carousel cards

- **Decision**: Add an optional `cardElement(id)` prop to `RobotEyes` (default: today's `[data-hero-card=id]` lookup). The twin passes a function returning the carousel card. For "look toward the active card" without the happy expression, the twin sets its own cursor motion values to the active card's centre on each change.
- **Rationale**: Today's lookup would find the hidden hero card above the screen and aim the wrong way. The default keeps the hero identical. Using the cursor input reuses the existing gaze logic and keeps "happy" for hover and focus, as in the hero.
- **Alternatives**: A copy of `RobotEyes` (two drifting implementations, Principle II); a `data-hero-card` attribute on carousel cards (would collide with the hero's own lookups).

## R4. Layout modes without layout shift

- **Decision**: Inline script `document.documentElement.setAttribute("data-js","")` in the root layout before content. CSS selects: travel = `html[data-js]` and `(min-width:1024px)` and `(prefers-reduced-motion: no-preference)`; swipe = `html[data-js]`, below 1024px, no-preference; list otherwise. Each mode has fixed height rules.
- **Rationale**: Runs before first paint, so the server HTML is painted in the right layout. Without JavaScript the attribute never appears and the list shows.
- **Alternatives**: `useMotionMode` deciding in React (height changes after hydration: CLS and a jump).

## R5. Sticky stage and runway

- **Decision**: The section at travel mode: `height: calc(var(--stage-h) + 90svh)` with `--stage-h: calc(100svh - var(--header-h))`; the stage inside is `position: sticky; top: var(--header-h); height: var(--stage-h)`, a two-column grid (robot left, heading and carousel right). Travel progress = `clamp(scrollY / (stageNaturalTop - headerH), 0, 1)`.
- **Rationale**: Travel completes exactly as the stage begins to stick, so the copies arrive at rest relative to a stage that then stays still on screen; no pin, plain scroll; the stage releases when the section ends.
- **Alternatives**: Scroll-scrubbed carousel steps or a pinned scene (owner said not pinned).

## R6. Card travel and coverflow

- **Decision**: Each carousel card has an outer element (travel transform from the hero card's live pose to the carousel centre, eased) and an inner element (coverflow pose by position, CSS transition). Faces: compact (hero card look, sized to match at the start scale) and full (icon, label, heading, body), crossfading over progress 0.65 to 1. Coverflow: centre (scale 1, opacity 1); sides `translateX(±62%) scale(0.82) rotateY(∓28deg)`, opacity 0.55, behind (`z-index`), with `perspective` on the track.
- **Rationale**: Scroll-driven and time-driven transforms never share an element; reversible; transform and opacity only.

## R7. Carousel behaviour and accessibility

- **Decision**: WAI-ARIA carousel pattern: `section` with `aria-roledescription="carousel"` and a label; each card `role="group"` `aria-roledescription="slide"` `aria-label="2 of 3: Build"`; previous/next buttons and dots (buttons with `aria-label` and `aria-current`); the slide container `aria-live="off"` while autoplaying, `polite` after manual use; side cards `aria-hidden` and `inert`. Arrow keys on the carousel move one card. Autoplay 4 s; pause on hover, focus inside, `document.hidden`, section out of view (IntersectionObserver), not arrived (travel); resume 1 s after; stop for good on any manual action; no catch-up after a hidden tab.
- **Rationale**: Matches the spec and the WAI guidance; the skill's `auto-rotation-controls` rule.

## R8. Swipe below 1024px

- **Decision**: Horizontal `scroll-snap-type: x mandatory` track of full-width cards, `overscroll-behavior-x: contain`, contained in the section so the page never scrolls sideways. Autoplay calls `scrollTo({ left, behavior: "smooth" })`; the active card is derived from scroll position on `scrollend` (fallback: debounced scroll). Touch, wheel or keys on the track stop autoplay.
- **Alternatives**: Custom pointer-drag code (more code, worse feel, no momentum).

## R9. Removing feature 003

- **Decision**: Delete `HowItWorksStage.tsx`, `StepCard.tsx`, `stage-context.ts`, the `.hiw-text`, `.hiw-line`, `.hiw-glow` rules and keyframes, `scripts/transition-check.mjs`; drop `how-it-works/` from the token guard's protected list; update `home-check.mjs` and `polish-reveal-check.mjs` where they assume the old stage.

## R10. Verification

- **Decision**: New `robot-travel-check.mjs`: hero identical at scroll 0 (pixels, styles), hand-off at 1px and 3px (robot and each card on the original within 3px, originals hidden, one visible copy), mid-travel, arrival at sticky engagement, robot fully in view across the runway and released after, reverse to within 1px, carousel autoplay timing and pauses, keys and dots, robot gaze change, swipe at 390, list mode with reduced motion and with JavaScript off, CLS, widths. Screenshots as listed in the spec. Lighthouse 5 runs before and after.
