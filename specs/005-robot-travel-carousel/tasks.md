# Tasks: Robot Travels Into "How It Works" as a Carousel

**Input**: Design documents in `/specs/005-robot-travel-carousel/` (plan.md, spec.md, research.md, data-model.md, contracts/travel-stage.md, contracts/carousel.md, quickstart.md) and [ADR-0001](../../history/adr/0001-twin-handoff-and-css-layout-modes.md)
**Prerequisites**: plan.md and spec.md. Hero impact statement **approved 2026-11-02 with conditions** (ADR-0001): hidden hero items get `visibility: hidden` + `inert` + `aria-hidden`; optional `cardElement` prop on `RobotEyes`; `RobotEyes` pauses while inert and snaps its gaze on resume; the twin hand-off must be imperceptible, and **any visible pop stops the feature for the owner to reconsider rather than shipping**.
**Tests**: The spec's "Verify" section asks for specific checks, so verification tasks are included. They live in a new `scripts/robot-travel-check.mjs` (replacing `transition-check.mjs`) plus the existing scripts. Each phase ends with a checkpoint that must pass before the next starts (Principle VII).

## Format: `- [ ] T### [P?] [Story?] Description with file path`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[US#]**: user story from spec.md. US1 travel, US2 carousel, US3 robot stays alive, US4 phones and tablets, US5 always readable, US6 page order

## Rules that apply to every task

- `src/components/Hero.tsx` is **not edited**. `src/components/RobotEyes.tsx` gets only the two approved changes (T009, T010). The preloader is not touched.
- The robot image is never mirrored: no negative `scaleX`, no `scale(-1, 1)`, no flip option anywhere.
- Animate only `transform` and `opacity`; durations and curves from the feature 004 tokens (`--dur-*`, `--ease-soft`); no hex or `rgb(` in components; Sora and Inter only.
- Server Components by default; `"use client"` only in `TravelStage.tsx`, `TravellingRobot.tsx`, `StepCarousel.tsx`, `CarouselDots.tsx` and `RobotFigure.tsx`'s live part, each with a one-line reason comment.
- No new dependencies. No copy in components: steps come from `getSteps()`.
- Read `node_modules/next/dist/docs/01-app/` before using any Next API not already used in this repo.
- Environment: the port must be free before starting a server; stop with `taskkill /PID <pid> /T /F`; production build for screenshots; the preloader plays on every load (wait for `html[data-preloader]` to leave `run`); set `CHROME="C:/Users/skytech laptopstore/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"` on each Playwright command; write multi-line files with the Write tool, not shell heredocs; screenshots in `shots/005/` (git-ignored).
- End of feature (owner's routine): commit, merge into `main`, delete the branch, confirm `main` is clean.

## Phase 1: Setup

- [ ] T001 Confirm the branch is `005-robot-travel-carousel`, `main` was clean when it was created, and port 3100 is free
- [ ] T002 Baseline on the current build before any change: `npm run build`, `npm run lint`, start `next start -p 3100`, wait for the robot image to load, then `node scripts/hero-snapshot.mjs shots/005/hero-before` (check the 1440 reduced-motion screenshot shows the robot; retake if not, as the feature 004 cold-start capture did not) and `node scripts/text-snapshot.mjs shots/005/text-before`
- [ ] T003 Lighthouse "before": 5 mobile runs on `/` with `shots/004/lh-variant.sh` adapted to a `shots/005/lh-before` folder (performance, accessibility, best practices, SEO); record median Performance, CLS, TBT, LCP in `specs/005-robot-travel-carousel/baseline.md`
- [ ] T004 [P] Record the current JS chunk total from `.next/static/chunks` and the home route's script list in `specs/005-robot-travel-carousel/baseline.md`

**Checkpoint**: baseline numbers, hero reference and text reference saved.

## Phase 2: Foundational (blocks every story)

**Layout modes before first paint**

- [ ] T005 Add a tiny inline script to `src/app/layout.tsx` (inside `<body>` before the site, like `PreloaderScript`, or as a dedicated `JsFlagScript` component in `src/components/layout/JsFlagScript.tsx`) that runs `document.documentElement.setAttribute("data-js","")`; `<html>` already has `suppressHydrationWarning`
- [ ] T006 In `src/app/globals.css` remove feature 003's `.hiw-glow`, `.hiw-text`, `.hiw-line` rules and the `hiw-glow` keyframes, and add the three layout modes from `data-model.md`: `.hiw` and its children default to the **list** layout; `html[data-js]` + `@media (min-width:1024px) and (prefers-reduced-motion: no-preference)` gives **travel** (section `height: calc(var(--stage-h) + 90svh)`, `--stage-h: calc(100svh - var(--header-h))`, `.hiw-stage { position: sticky; top: var(--header-h); height: var(--stage-h) }`, two-column grid); `html[data-js]` + `@media (max-width:1023.98px) and (prefers-reduced-motion: no-preference)` gives **swipe**; each mode fixes its own heights so nothing reflows when scripts arrive
- [ ] T007 Create `src/hooks/useLayoutMode.ts` (client): returns `"travel" | "swipe" | "list"` from the same media queries plus the `data-js` flag, server value `"list"`; delete `src/hooks/useMotionMode.ts` if nothing else uses it (check with Grep)

**Reusable robot (owner request)**

- [ ] T008 Create `src/components/RobotFigure.tsx` per `contracts/travel-stage.md` § RobotFigure: image paths, alt text "Tareeq robot assistant", intrinsic sizes and `sizes` hardcoded inside; `eyes="live"` renders `robot-noeyes.png` (same `sizes` as the hero, `(min-width: 1024px) 400px, 50vw`, so the same file is served from cache) plus `RobotEyes` with pass-through `cursorX`, `cursorY`, `activeCard`, `cardElement`, `reduce`; `eyes="painted"` renders `robot.png` statically (server-safe, no script); props only `eyes`, `className`, `priority`, gaze inputs; no flip option. Split so the painted variant needs no client code (e.g. `RobotFigure` server wrapper choosing `RobotFigureLive` as the client leaf)

**RobotEyes, the two approved changes**

- [ ] T009 In `src/components/RobotEyes.tsx` add optional prop `cardElement?: (id: CardId) => Element | null`; `aimAtCard` uses it when given, otherwise today's `document.querySelector('[data-hero-card=…]')`. No other change in this task
- [ ] T010 In `src/components/RobotEyes.tsx` pause the frame loop while the SVG is inside an `inert` element (check `svgRef.current?.closest('[inert]')` at the start of the frame callback, treat as `run.current = false`), and on the first frame after resuming from that pause: recompute the aim from the current cursor (or the active card), `gx.jump()`/`gy.jump()` to it, and set `blink` to 1. Resuming from the existing off-screen or hidden-tab pause keeps today's behaviour
- [ ] T011 Rebuild, then run the hero snapshot to `shots/005/hero-foundation` and `python scripts/hero-compare.py shots/005/hero-before shots/005/hero-foundation`: must be identical (styles on every element, pixels at 390 and 1440). Stop and report if not

**Remove feature 003's stage**

- [ ] T012 Delete `src/components/sections/how-it-works/HowItWorksStage.tsx`, `StepCard.tsx`, `stage-context.ts` and `scripts/transition-check.mjs`; keep `StepIcon.tsx`
- [ ] T013 In `scripts/polish-token-check.mjs` drop `src/components/sections/how-it-works` from the protected list, add `src/components/RobotEyes.tsx` to a "changed only by approval" note, add the new files to the scanned list, and re-record hashes (`--record`) for `Hero.tsx` and `preloader/`

**Checkpoint**: build and lint clean; hero identical; layout-mode CSS in place; feature 003 stage gone (the section temporarily renders in list mode).

## Phase 3: User Story 6 - The page order changes (Priority: P2, done first because travel lands in the section right below the hero)

**Goal**: hero, "How it works", "Who it's for", Programs, "Why Tareeq", call to action; cue goes to "How it works".
**Independent test**: `home-check.mjs` reads the new order; the cue scrolls to `#how-it-works`.

- [ ] T014 [US6] In `src/app/(site)/page.tsx` render `<HowItWorks />` before `<WhoItsFor />`
- [ ] T015 [US6] In `src/components/sections/HeroExtras.tsx` point the cue at `#how-it-works` (label unchanged)
- [ ] T016 [US6] Update `scripts/home-check.mjs` section-order assertion to How it works, Who it's for, Programs, Why Tareeq; replace the old step-label check (`[data-step-slot]`) with one reading the carousel cards' labels (Prompt, Build, Learn); update `scripts/polish-reveal-check.mjs` where it targets `#how-it-works` internals or the old stage (hero-extras cue target, `who` anchor)

**Checkpoint**: US6 passes; build and lint clean.

## Phase 4: User Story 5 - The steps are always readable (Priority: P1)

**Goal**: the section's server markup and list layout, complete without JavaScript and under reduced motion.
**Independent test**: with JavaScript off and with reduced motion, all three steps (icon, heading, body) are visible as a list with a static robot, at 390 and 1440.

- [ ] T017 [P] [US5] Create `src/components/sections/how-it-works/CarouselCard.tsx` (server): one step as a card with two stacked faces: `.face-compact` (the hero card's glass look: icon, label, placeholder lines; sized so it matches the hero card at the travel start scale) and `.face-full` (icon tile, label, `h3` heading, body); in list and swipe modes only the full face shows (CSS); `data-step={id}`
- [ ] T018 [US5] Rewrite `src/components/sections/how-it-works/HowItWorks.tsx` (server) per the DOM in `contracts/travel-stage.md`: `section#how-it-works.hiw` > `.hiw-stage` > `.hiw-robot-col` (travel slot for the twin, plus `<RobotFigure eyes="painted" className="hiw-robot-static" />`) and `.hiw-content-col` (`SectionHeading`, then the cards inside a list container that becomes the carousel later); steps from `getSteps()`
- [ ] T019 [US5] List-mode CSS in `src/app/globals.css`: static robot sized to fit (above the cards on phones, beside on wide screens), cards stacked, three columns from 1024px; the compact face hidden; no transforms
- [ ] T020 [US5] Create `scripts/robot-travel-check.mjs` (Playwright) with helpers (hero element, robot layer via `img[alt="Tareeq robot assistant"]` closest `.absolute`, `[data-hero-card]`, layout-shift observer, six widths) and the first checks: JavaScript off and reduced motion at 390 and 1440 show three steps with heading and body visible, no carousel controls, the static robot visible and not mirrored (computed transform has no negative x scale), no horizontal scroll; screenshots `shots/005/list-nojs-*.png`, `list-reduced-*.png`
- [ ] T021 [US5] Run build, lint, `robot-travel-check.mjs`, hero compare (identical); look at the screenshots

**Checkpoint**: the section is complete and correct with no animation.

## Phase 5: User Story 1 - The robot and its cards travel (Priority: P1) - MVP

**Goal**: the twin hand-off and the scroll-driven travel into the sticky stage on desktop. Build the hand-off first and stop if it shows a pop.
**Independent test**: `robot-travel-check.mjs` travel group at 1440x900, plus the before, during and after hand-off screenshots.

- [ ] T022 [US1] Create `src/components/sections/how-it-works/TravelStage.tsx` (client; reason: scroll position, measuring, DOM attributes on the hero): attaches only when `useLayoutMode()` is `travel`; measures `rangeEnd` (stage's natural document top minus `--header-h`) on mount, resize (ResizeObserver on the hero and the section) and `document.fonts.ready`; `progress` from a passive `scroll` listener into a motion value; `arrived` with hysteresis (1 / 0.99); exposes progress, arrived and live start poses through context
- [ ] T023 [US1] In `TravelStage.tsx` implement the hand-off per the contract table: at progress 0 the hero robot layer and card wrappers have no inline style or attributes, and the twin robot has `visibility: hidden` + `inert`; at progress > 0 set `visibility: hidden`, `inert`, `aria-hidden="true"` on the hero robot layer and the three card wrappers and remove them from the twin; clear everything when the mode leaves travel and on unmount
- [ ] T024 [US1] Create `src/components/sections/how-it-works/TravellingRobot.tsx` (client; reason: motion values for the transform and the eye inputs): renders `<RobotFigure eyes="live" />` sized exactly as the hero robot image; its transform = (hero robot image live rect, read each scroll change while 0 < progress < 1) eased to (its slot in `.hiw-robot-col`, scale about 0.8 of the hero size) with the sine ease from feature 003; no parallax; owns its own `cursorX`/`cursorY` motion values fed by a rAF-throttled `pointermove` listener (fine pointer only), mounted from load so its gaze tracks the same input as the hero
- [ ] T025 [US1] Card travel in `src/components/sections/how-it-works/StepCarousel.tsx` (client; reason: travel transforms, carousel state) wrapping the server `CarouselCard`s: outer element per card = travel transform from the hero card's live visible pose (centre, width, tilt, as in feature 003) to the carousel centre slot; card opacity 0 at progress 0 and 1 above it; compact and full faces crossfade over progress 0.65 to 1; inner element reserved for the coverflow pose (US2)
- [ ] T026 [US1] Extend `scripts/robot-travel-check.mjs` with the **hand-off gate** at 1440x900: at scroll 0 the twin is `visibility: hidden` and `inert` and the hero is untouched; at 1px and 3px of scroll the twin robot's rect matches the hero robot image's last rect (centre within 1px, width within 1px, no rotation difference) and each card matches within 3px / 6px; exactly one robot is visible (computed `visibility` and on-screen rect) at 0, 1, 3, 20 and 200px; screenshots `shots/005/handoff-before.png` (0px), `handoff-during.png` (1px), `handoff-after.png` (3px) clipped to the hero visual at 2x device scale
- [ ] T027 [US1] Run the hand-off gate; open the three screenshots side by side and look for any pop, jump, scale change, double robot or eye swing. **If anything is visible, stop here and report to the owner with the screenshots instead of continuing** (ADR-0001 condition)
- [ ] T028 [US1] Extend the check with the travel: screenshots at 0, about 25%, 50% (mid-travel), 99% and arrival (`shots/005/seq-*.png`); at arrival the stage's top equals `--header-h` within 1px and the twin and centre card are at rest in it within 1px; across the runway the robot stays fully inside the viewport, and after the section ends it scrolls away (released); scroll back to 0 in 20px steps and assert the hero is restored (originals visible, no inline attributes, copies hidden, positions within 1px) with no frame jump beyond the scroll delta; layout shift at or below 0.05
- [ ] T029 [US1] Extend the check with focus and a11y while scrolled: at 25% and 60% of travel, tab through the page from the top; assert focus never lands on an element with computed `visibility: hidden`, inside `[inert]` or inside the hidden hero; assert hidden hero items are not in the accessibility tree (`page.accessibility.snapshot()` contains no hero card names while scrolled)
- [ ] T030 [US1] Extend the check with edge cases: reload while scrolled into and past the section (correct settled or released state), End and Home jumps, resize 1440 to 900 and back (mode switch clears all attributes; hero restored; no stuck twin), the robot never mirrored, the twin image request served from cache (no second network response for `robot-noeyes` with a non-cache status)
- [ ] T031 [US1] Run build, lint, the full check, the hero compare (identical at 390 and 1440, including hover); look at all screenshots

**Checkpoint**: US1 passes and the hand-off is imperceptible; otherwise stopped and reported.

## Phase 6: User Story 2 - The carousel (Priority: P1)

**Goal**: coverflow on arrival, 4 s autoplay with the pause and stop rules, keys, dots, previous/next, WAI pattern.
**Independent test**: the carousel group of the check at 1440.

- [ ] T032 [P] [US2] Create `src/components/sections/how-it-works/CarouselDots.tsx` (client; reason: click handlers): one button per step (44px target, visible focus, `aria-label="Show step N: Label"`, `aria-current`), plus previous and next buttons
- [ ] T033 [US2] In `StepCarousel.tsx` add the state machine from `data-model.md`: `active`, autoplay `running | paused | stopped`, pause reasons (hover, focus within, `document.hidden`, out of view via IntersectionObserver, travel mode not arrived), resume 1 s after all clear, stop for good on any key, dot, previous/next, swipe, touch or wheel; no catch-up after a hidden tab; never starts under reduced motion
- [ ] T034 [US2] In `StepCarousel.tsx` and `globals.css` apply the coverflow pose on each card's inner element by `offset` (centre; sides `translateX(±62%) scale(0.82) rotateY(∓28deg)`, opacity 0.55, behind, `perspective` on the track), transitioned over `--dur-reveal` with `--ease-soft`; poses apply only when `arrived` (cards collapse to centre while travelling)
- [ ] T035 [US2] Accessibility per `contracts/carousel.md`: region with `aria-roledescription="carousel"` and label; slides `role="group"` `aria-roledescription="slide"` `aria-label="N of 3: Label"`; side cards `aria-hidden` + `inert`; track `aria-live="off"` while autoplaying, `polite` after interaction; Left/Right keys on the region move one card
- [ ] T036 [US2] Extend `scripts/robot-travel-check.mjs` carousel group at 1440: after arrival the three cards are in coverflow (one centred, readable; two sides scaled and dimmed); idle advance every 4 s plus or minus 0.5 s through all three (screenshots `shots/005/carousel-1.png`, `-2.png`, `-3.png`); paused for 6 s while hovered, while a dot has focus, while the tab is hidden (`page.evaluate` dispatching `visibilitychange` with `document.hidden` stubbed) and while scrolled out of view; Left/Right move one card; a dot selects its card and stops autoplay for good (no change after 10 s); focus visible; side cards not focusable
- [ ] T037 [US2] Run build, lint, the full check and the hero compare; look at the screenshots

**Checkpoint**: US2 passes.

## Phase 7: User Story 3 - The robot stays alive (Priority: P2)

**Goal**: the twin's eyes track, blink, react to card hover and focus, and glance toward each new active card.
**Independent test**: the robot group of the check.

- [ ] T038 [US3] In `TravellingRobot.tsx` pass `cardElement={(id) => document.querySelector('[data-step="' + id + '"]')}` (the carousel card) and an `activeCard` driven by hover or focus on a carousel card (happy plus look, as in the hero)
- [ ] T039 [US3] On each carousel `active` change (and when not hovered), set the twin's `cursorX`/`cursorY` to the new centred card's centre so the eyes glance toward it without the happy expression; real pointer movement takes over as usual
- [ ] T040 [US3] Extend the check: with the robot settled, moving the pointer changes the eye group's transform (gaze), blinks occur within 7 s (eye `scaleY` dips), hovering a carousel card switches to the happy arc and the gaze points toward that card's side, an autoplay change moves the gaze toward the new centre card; the hidden hero robot's eye loop is paused while scrolled (its eye group transform does not change while the pointer moves)
- [ ] T041 [US3] Run build, lint, the full check and the hero compare

**Checkpoint**: US3 passes.

## Phase 8: User Story 4 - Phones and tablets (Priority: P1)

**Goal**: below 1024px no travel; the robot stays in the hero; a swipeable full-width carousel with dots.
**Independent test**: the swipe group of the check at 390x844 and 768x1024.

- [ ] T042 [US4] Swipe-mode CSS in `src/app/globals.css`: horizontal scroll-snap track (`scroll-snap-type: x mandatory`, `overscroll-behavior-x: contain`), one full-width full-face card per view, the static robot above the cards (beside them from 768px if it fits), contained so the page never scrolls sideways
- [ ] T043 [US4] In `StepCarousel.tsx` swipe behaviour: active card from scroll position (`scrollend`, fallback debounced `scroll`); autoplay uses `scrollTo({ behavior: "smooth" })`; touch, wheel or keys on the track stop autoplay; dots scroll to their card
- [ ] T044 [US4] Extend the check at 390x844 and 768x1024: no travel attributes on the hero, hero robot untouched and visible, swipe (touch-emulated drag or `scrollBy`) moves to the next card and snaps, dots reflect position, autoplay advances and stops after a swipe, no horizontal page scroll, layout shift at or below 0.05; screenshots `shots/005/mobile-hero-390.png`, `mobile-section-390.png`
- [ ] T045 [US4] Run build, lint, the full check, `home-check.mjs` and the hero compare at 390

**Checkpoint**: US4 passes.

## Phase 9: Polish and cross-cutting

- [ ] T046 [P] Accessibility pass: one `h1`, heading order, landmarks, visible focus never under the sticky header, AA contrast for the full face text and dots, decorative copies hidden; record the lowest contrast ratio
- [ ] T047 [P] Width sweep 360, 390, 768, 1024, 1440, 1920: no horizontal scroll and CLS at or below 0.05 through the whole home scroll; add to `robot-travel-check.mjs`
- [ ] T048 Search the project for leftovers of feature 003's stage (`HowItWorksStage`, `StepCard`, `data-step-slot`, `hiw-line`, `hiw-glow`, `hiw-text`, `stage-context`) and remove any found; update docs that describe the old behaviour only by adding a superseded note in `specs/003-home-core-pages/contracts/how-it-works-motion.md`
- [ ] T049 Full regression: `npm run build`, `npm run lint`, `robot-travel-check`, `home-check`, `pages-check`, `polish-reveal-check`, `polish-token-check`, `menu-check`, `desktop-check`, `footer-check`, `whatsapp-check`, `preloader-check`; record results
- [ ] T050 Lighthouse "after": same setup as T003, 5 runs on `/`; record Performance, CLS, TBT, LCP before and after in `baseline.md`; Performance must be no more than 3 points below the before median, CLS at or below 0.05
- [ ] T051 Final hero proof: `hero-snapshot` to `shots/005/hero-after`, compare against `shots/005/hero-before` (identical), `git diff --stat main -- src/components/Hero.tsx` empty, `git diff main -- src/components/RobotEyes.tsx` shows only T009 and T010
- [ ] T052 [P] Final screenshots: 1440x900 top of hero, mid-travel, settled, each carousel position; 390x844 hero and section; into `shots/005/final/`; look at each
- [ ] T053 Update `quickstart.md` if needed; create the implementation PHR in `history/prompts/005-robot-travel-carousel/`; then commit, merge into `main`, delete the branch and confirm `main` is clean (owner's routine)

## Dependencies and order

- Phase 1, then Phase 2 (blocks everything). T009 and T010 before T024 and T038.
- US6 (Phase 3) before the rest: travel needs "How it works" directly under the hero.
- US5 (Phase 4) builds the section markup the other stories animate.
- US1 (Phase 5) needs US5; T027 is a **stop gate**: no further work if the hand-off shows a pop.
- US2 (Phase 6) needs US1's arrival; US3 (Phase 7) needs US2's active card.
- US4 (Phase 8) needs US5 and the carousel state from US2 (T033) but not the travel.
- Polish needs everything.

```text
Setup -> Foundational -> US6 -> US5 -> US1 (stop gate T027) -> US2 -> US3 --\
                                   \-> (after T033) US4 -----------------------+-> Polish
```

## Parallel opportunities

- Phase 2: T005, T007, T008 (different files); T009 and T010 are the same file (sequential).
- US5: T017 alongside T019. US2: T032 alongside T033.
- Polish: T046, T047, T052.

## Implementation strategy

1. **MVP**: Phases 1 to 5: the new order, a section that is complete without animation, and the robot and cards travelling with an imperceptible hand-off. Stop at T027 if the hand-off is visible.
2. Then the carousel (US2) and the living robot (US3), then phones (US4).
3. After every phase: build, lint, the checks, a look at the screenshots at 390 and 1440, and the hero compare.

## Summary

53 tasks: Setup 4 (T001 to T004), Foundational 9 (T005 to T013), US6 3 (T014 to T016), US5 5 (T017 to T021), US1 10 (T022 to T031), US2 6 (T032 to T037), US3 4 (T038 to T041), US4 4 (T042 to T045), Polish 8 (T046 to T053).
