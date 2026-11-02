# Research: Home Page Content and Core Pages

All items resolved. No open NEEDS CLARIFICATION.

## R1. How the hero cards "travel" into the steps

- **Decision**: The step cards are real in-flow elements. On desktop each is moved by `transform` (translate, rotate, scale) so it starts exactly over its hero card and ends at the identity transform. Pointer events are off on them.
- **Rationale**: One copy of the content, so assistive technology sees nothing extra (FR-022). The destination needs no swap, so there is no seam where a clone is replaced by the real card. Transforms never change layout, which gives zero layout shift by construction (FR-021). With the transform removed the section is already correct (FR-019).
- **Alternatives**: Fixed-position clones (second DOM copy, seam at landing, needs aria-hidden and focus handling). A pinned/sticky stage (changes section height and scroll feel, harder to reverse cleanly). CSS scroll-driven animations (browser support varies; the settle is time-based and needs JavaScript anyway).

## R2. Measuring start and end poses

- **Decision**: The start pose comes from each hero card's outer wrapper (`[data-hero-card]`, an absolutely positioned div with no transform). The hero's float, parallax and entrance transforms are on inner elements, so the wrapper rect is the stable rest position. Read once on mount, then on resize (ResizeObserver on the hero section and the step row) and after `document.fonts.ready`. Never during scroll.
- **Rationale**: Layout reads in a scroll handler are the usual cause of jank. Rest positions are all the transform needs.
- **Alternatives**: Reading the live hero card rect each frame (layout thrash, and the float would make the start pose wobble).

## R3. Scroll range and easing

- **Decision**: `progress` runs from scrollY 0 to `stepRowTop − 0.45 × viewportHeight` (document space). Travel uses a sine ease-in-out of progress, with rotation and scale on the same curve. The card reaches identity at progress 1.
- **Rationale**: Travel starts as soon as the visitor scrolls, finishes with the steps near mid-screen, and the card's own motion lags the page scroll a little, which reads as the card "travelling down" relative to the hero text. The ease is gentle at both ends: near arrival the card moves well under a pixel across the 1% hysteresis band (arrive at 1, leave below 0.99), so the threshold cannot be seen, and the start of the travel is gentle too.
- **Alternatives**: Tying the range to the section's own viewport entry (cards would not start until the section appeared, so the hand-off from the hero would be lost).

## R4. The settle

- **Decision**: On `arrived`, each card's `scale` motion value runs `animate(scale, 1, { type: "spring", velocity, stiffness, damping, delay: index × 0.08 })`. The velocity kick yields an overshoot of about 1.03 and a settle. On leaving, the same motion value springs to 1 from its current value.
- **Rationale**: A real spring, interruptible, no pop on reverse. The stagger is 80 ms left to right as specified.
- **Alternatives**: A CSS keyframe with a `linear()` spring curve (looks right going forward, but snaps to 1 if the user reverses mid-settle).

## R5. Text, connector line, glow

- **Decision**: CSS in `how-it-works.css`, selected by the stage wrapper's `data-stage="travel"` and `data-arrived`. Text: opacity 0 to 1 and `translateY(8px)` to 0, transition delay `0.16s + i × 0.08s`. Line: a thin saffron bar, `scaleX(0)` to 1, origin left, delay after the third card (about 0.5 s). Glow: a radial saffron element behind each card, one keyframe animation (opacity 0 to 0.35 to 0, small scale), delay `i × 0.08s`. Leaving removes the attribute and the transitions run back; the glow ends at opacity 0 so removal causes no snap.
- **Rationale**: Keeps those parts as server-rendered markup (Principle XI). CSS transitions reverse smoothly on their own.
- **Alternatives**: Driving them from the client stage (would force the text subtree to be a client component).

## R6. Hand-off at the hero

- **Decision (revised after owner feedback)**: no crossfade. The first design faded the two sets over 4% of progress, which showed two different-looking cards ghosted on top of each other. Now the step card is the hero card's exact design and starts on the hero card's live visible position and tilt (read on each scroll change); the hero card is hidden and the step card shown from the first pixel, so only one is ever visible.
- **Rationale**: Identical pixels in the identical place cannot be told apart. The write goes to three nodes, not the whole document. The one read per scroll change is three `getBoundingClientRect` calls, with no layout writes between frames.
- **Alternatives**: A CSS variable on `<html>` (restyles the whole document each frame); changing the hero to expose a hide prop (Principle VIII).

## R7. Motion modes

- **Decision**: A `useMotionMode` hook returns `travel`, `fade` or `none` from two media queries (`(min-width: 1024px)` and `(prefers-reduced-motion: reduce)`) using `useSyncExternalStore`, with `none` as the server value. The stage applies the mode in the first client render. Reduced motion wins at every width.
- **Rationale**: Server HTML is already the final state, so nothing depends on JavaScript. Same pattern the hero uses for reduced motion.
- **Edge cases handled**: loaded already past the section (progress 1, arrived, no flash since final equals server state); resize across 1024px (mode switches, inline transforms and hero opacity are cleared); a missing hero card (falls back to `fade`).

## R8. Fade mode (below 1024px)

- **Decision**: The stage observes the section with an IntersectionObserver once and sets `data-revealed`. CSS fades the section in (opacity, small rise) only while `data-stage="fade"` and not yet revealed.
- **Alternatives**: A reusable `Reveal` for every section (not asked for; adds client leaves).

## R9. Content layer

- **Decision**: `src/content/types.ts`, `src/content/data/*.ts`, and `src/content/index.ts` with async accessors. `no-restricted-imports` in `eslint.config.mjs` blocks `@/content/data/*` outside `src/content`. Content stays under `src/` because the project alias `@/*` maps to `src/*`; this is the one deviation from the brief's literal `content/*.ts` path.
- **Rationale**: SC-007 becomes checkable by lint, not by trust. Async return types let a future database accessor `await` with no change to callers.
- **Alternatives**: Sync accessors (every caller would change when a database arrives); a top-level `content/` folder (needs a second path alias for no gain).

## R10. Contact configuration

- **Decision**: `NEXT_PUBLIC_WHATSAPP_NUMBER` (existing), `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_LOCATION`. The accessor validates (WhatsApp digits 8 to 15, email shape) and drops what is missing or invalid. `.env.example` gets the two new keys. `getWhatsAppUrl()` stays in `lib/site.ts` and is called by the content file.
- **Rationale**: One place to edit, consistent with the existing key, and the footer's contact block (which only renders when entries exist) fills automatically.
- **Alternatives**: Server-only variables (inconsistent with the existing key; no benefit for public business details).

## R11. Redirect, nav, metadata

- **Decision**: `redirects()` in `next.config.ts` with `permanent: true` for `/about` to `/our-way` (the docs confirm this sends 308). Delete `app/(site)/about`. `navItems` label "Our Way". Root layout `title` becomes `{ default, template: "%s | Tareeq" }`; the template applies to child segments, so the home page keeps its full title. Pages use `generateMetadata` backed by `getPageMeta(slug)`.
- **Alternatives**: Keep `/about` as a page that links onward (duplicate content, extra hop).

## R12. Reusing the hero icons

- **Decision**: Add `export` to `SparkleIcon`, `CodeIcon`, `BulbIcon` in `Hero.tsx`. `StepIcon` maps `prompt | build | learn` to them and passes `on` from the card's `arrived` state.
- **Rationale**: The brief says reuse. Copies would drift. Export-only edits have precedent in feature 002 and need approval under Principle VIII.
- **Cost noted**: The bulb animates `filter` and `fill` (not transform/opacity). Recorded in Complexity Tracking; checked in the scroll test.

## R13. Verification tooling

- **Decision**: Playwright (installed). `transition-check.mjs` scrolls the home page in steps at 1440x900, takes screenshots at 0, 8%, 25%, 50%, 75%, 99%, arrival and arrival + 600 ms, and back up; asserts card rect equals hero card rect at scroll 0, equals the resting step slot at arrival, and that going back returns each card to its start within 1px. A `layout-shift` observer runs across every scroll step. Reduced motion uses `emulateMedia`; "animation disabled" uses a context with JavaScript off, which shows the server HTML. Horizontal scroll is checked at 360, 390, 768, 1024, 1440 and 1920. Lighthouse runs five times before and after.
