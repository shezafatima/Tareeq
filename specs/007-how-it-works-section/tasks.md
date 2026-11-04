---
description: "Task list for feature 007: How it works section with card hand-off and carousel"
---

# Tasks: "How it works" Section With Card Hand-off and Carousel

**Input**: Design documents from `specs/007-how-it-works-section/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (travel-stage.md, carousel.md), quickstart.md

**Tests**: Included. The spec's success criteria (SC-001 to SC-012) are measurable and the plan (R10) defines a Playwright check script, `scripts/how-it-works-check.mjs`, built up section by section as each story lands.

**Organization**: grouped by user story (spec.md). **Order note**: US2 (the carousel) is built before US1 (the hand-off) because the travelling cards land in the carousel. Both are P1. US4 (phones, tablets, reduced motion, no scripts) follows, then US3 (breathing).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 to US4, mapped to spec.md
- Paths are relative to the repository root `E:\tareeq`

## Ground rules for every task

- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code (AGENTS.md).
- **Do not edit `src/components/Hero.tsx` or any file listed in `specs/004-site-visual-polish/protected.sha.json`.** After any task that touches the section, `node scripts/polish-token-check.mjs` must still pass.
- Only `transform` and `opacity` may animate. Colours come from tokens (no hex values in components). No new dependencies.
- Class names (decided here so tasks agree): `.hiw` (section), `.hiw-card` (grid cell, carries `data-step`, `data-pos`), `.hiw-card-travel` (scroll-driven transform), `.hiw-card-pose` (slide between cards), `.hiw-card-flip` (flip), `.hiw-face-compact` (the hero card's look), `.hiw-face-front`, `.hiw-face-back`, `.hiw-controls`, `.hiw-track`, `.hiw-robot`, `.hiw-glow`.
- Every milestone ends with `npm run lint`, `npm run build` and a look in a real browser at 390 and 1440 (constitution VII).
- Test emails: none are sent by this feature.

---

## Phase 1: Setup and baseline (milestone 0)

**Purpose**: record "before" numbers from a production build that is still identical to `main`. Do this before changing any code.

- [X] T001 Create `shots/007/` (it is git-ignored like the other `shots/` folders) and `shots/007/lh.sh`, a copy of `shots/005/lh.sh` that takes `before` or `after` as its argument, runs 5 Lighthouse mobile runs on `http://localhost:3107/` (same flags as 005: `--form-factor=mobile --only-categories=performance,accessibility,best-practices,seo`, one-off `npx --yes lighthouse`, Chromium path as in 005) and saves JSON to `shots/007/lh-<argument>/run-home-N.json`.
- [X] T002 Record the baseline: `npm run build`, start `npx next start -p 3107`, run `bash shots/007/lh.sh before`, then note (a) the median Lighthouse scores and the LCP element and time from the JSON, (b) total bytes of `.next/static/chunks/*.js`, (c) hero screenshots at 1440×900 and 390×844 saved to `shots/007/hero-before/`, (d) `node scripts/polish-token-check.mjs` passing. Write everything to `specs/007-how-it-works-section/baseline.md` in the style of `specs/005-robot-travel-carousel/baseline.md`. Stop the server afterwards.

---

## Phase 2: Foundational (blocking prerequisites): content, deletions, static section

**Purpose**: replace feature 005's section with a complete, correct, static one (list mode, no behaviour), with the old robot code gone. Nothing in the user stories can start until this builds.

**⚠️ CRITICAL**: no user-story work starts until this phase is complete.

- [X] T003 Add the content types to `src/content/types.ts` exactly as in `data-model.md`: `HowStep` (`id: StepId`, `number`, `name`, `line`, `example`, `order`) and `HowItWorksContent` (`heading`, `intro`, `image: { src; width; height; alt }`, `steps: HowStep[]`). Keep the existing `Step` type for now (removed in T014).
- [X] T004 Create `src/content/how-it-works.ts`, headed `// DRAFT: owner to confirm before launch (only the Prompt example is the owner's)`, exporting `howItWorks: HowItWorksContent` with the draft values from `data-model.md`: heading "How it works"; intro "Every session follows the same three steps."; image `/how-it-works.png`, 407 × 612, alt "The Tareeq robot assistant, smiling, with one hand held out as if presenting the steps."; steps: (1, Prompt, "Say what you need", "Turn a lesson plan into 5 quiz questions in 2 minutes"), (2, Build, "Make something that works", "A marking helper you set up in 20 minutes"), (3, Learn, "Understand why it works", "Teach your class to check AI answers"). Depends on T003.
- [X] T005 Add `export async function getHowItWorks(): Promise<HowItWorksContent>` to `src/content/index.ts` (import from `./how-it-works`, follow the style of the other getters; steps sorted by `order`). Do not remove `getSteps` yet. Depends on T004.
- [X] T006 [P] Delete feature 005's robot twin: `git rm src/components/sections/how-it-works/TravellingRobot.tsx src/components/RobotFigure.tsx src/components/RobotFigureLive.tsx public/robot-chevron.png public/robot-noeyes-nochevron.png scripts/robot-travel-check.mjs`. Before deleting the images, `grep -rn "robot-chevron\|robot-noeyes-nochevron" src scripts` must show only the files being deleted. **Keep** `public/robot-noeyes.png` (the hero uses it). Check `public/robot.png`: if only `RobotFigure.tsx` used it, keep the file anyway (the preloader and metadata may use it); do not delete it in this task.
- [X] T007 Revert 005's edit to the hero's eyes component: first review `git diff 492ab86^ HEAD -- src/components/RobotEyes.tsx` (it adds `cardElement`, `mirrored` and a pause-while-`inert` hand-off, all used only by the deleted robot twin), run `grep -rn "cardElement\|mirrored" src` to confirm nothing else uses them, then `git checkout 492ab86^ -- src/components/RobotEyes.tsx`. If anything else still needs a part of the change, keep that part and say so in the commit. Depends on T006.
- [X] T008 [P] Update `src/hooks/useLayoutMode.ts`: `LayoutMode = "list" | "travel" | "phone" | "still"`. `getSnapshot`: no `html[data-js]` → `list`; `(prefers-reduced-motion: reduce)` → `still`; width `(min-width: 768px)` → `travel`; otherwise `phone`. Subscribe to both media queries; server snapshot `list`. Update the file's comment (CSS decides first; this only reads it).
- [X] T009 Trim `src/components/sections/how-it-works/travel-context.ts` to cards only: `HeroParts = { cards: HTMLElement[] }`; `findHeroParts()` returns only the three `[data-hero-card]` wrappers (same lookup as now, no robot parts); keep `setHidden`, `ease`, `clamp01`; remove `registerTwin`, `hoverCard`, `setHoverCard` and the `CardId` import from the context value; keep `mode`, `progress`, `arrived`, `hero`, `active`, `setActive`. Then reduce `TravelStage.tsx` to a pass-through that provides the context (`progress = useMotionValue(0)`, `arrived = false`, `active` state) and renders `<div className="hiw-stage">{children}</div>`, and reduce `StepCarousel.tsx` to a pass-through that renders `<div className="hiw-track">{children}</div>` (both are rewritten in US2 and US1). The tree must typecheck. Depends on T006 and T008.
- [X] T010 Rewrite `src/components/sections/how-it-works/CarouselCard.tsx` (Server Component) per `contracts/carousel.md`: `.hiw-card[data-step]` > `.hiw-card-travel` > `.hiw-card-pose` > `.hiw-card-flip` containing `.hiw-face-compact` (the hero card's look: copy the existing compact markup, `aria-hidden`), `.hiw-face-front` (`<article>`: step icon via the existing `StepIcon`, "Step {number}", the name as `<h3>`, the one-line explanation, and a `<button type="button" class="hiw-flip-btn">See an example</button>`) and `.hiw-face-back` (the example text and a `<button class="hiw-flip-btn">Back</button>`). Props: `step: HowStep`. No wording in the component beyond the two button labels. Depends on T003.
- [X] T011 Rewrite `src/components/sections/how-it-works/HowItWorks.tsx` (Server Component): `const content = await getHowItWorks()`; `<section id="how-it-works" aria-labelledby="hiw-title" className="hiw">` containing, **in this DOM order** inside `TravelStage`: the heading block (`SectionHeading` with `id="hiw-title"`, the heading and intro), the robot (`<div className="hiw-robot">` with `next/image` for `content.image`: explicit `width` and `height`, lazy (no `priority`), `sizes="(min-width: 1024px) 340px, 200px"`, the alt text, class `h-auto w-full select-none`, never mirrored), and the carousel (`StepCarousel` with `labels` and `regionLabel` props as today, children = one `CarouselCard` per step). Remove the imports of the deleted files. Depends on T005, T009, T010.
- [X] T012 Replace feature 005's CSS in `src/app/globals.css` (the block from the comment "Feature 005: "How it works" layouts" to just before the comment "Workshop form steps (feature 006)") with the new base styles: `.hiw` keeps `position: relative`, `background: var(--color-soft)`, `overflow-x: clip`; `.hiw-stage` is a grid with `max-width: 80rem`, `margin: 0 auto`, `padding: 4rem var(--spacing-gutter)`, `gap`, and named grid areas `"head" "robot" "carousel"` stacked below 1024px with the robot centred and about 200px wide; from `min-width: 1024px` areas `"robot head" "robot carousel"` with columns `minmax(0, 0.8fr) minmax(0, 1.2fr)` and the robot about 340px wide, centred in its column; grid children `min-width: 0`. **List mode** (the default, which is what shows without JavaScript): `.hiw-track` is a grid whose three `.hiw-card` children are laid out together (one column below 1024px, three columns from 1024px); both card faces are shown (back below front as plain text); `.hiw-controls`, `.hiw-flip-btn` and `.hiw-face-compact` are `display: none`. Nothing else yet: carousel, flip, travel, breathing and mode CSS arrive in their stories. Use tokens only. Depends on T011.
- [X] T013 Track the new image and retire the old step content: `git add public/how-it-works.png`; delete `src/content/data/steps.ts`; remove `getSteps()` and its import from `src/content/index.ts`; remove the `Step` type and `HomeCopy.howItWorks` from `src/content/types.ts`; remove `howItWorks` from `homeCopy` in `src/content/data/cta.ts`. `grep -rn "getSteps\|steps'\|homeCopy.howItWorks\|copy.howItWorks" src` must return nothing. Depends on T011.
- [X] T014 Update the other check scripts that read the section so they match the new markup: `scripts/home-check.mjs` lines about `#how-it-works` (step count via `.hiw-card h3`, "only the carousel controls take keyboard focus", labels via `.hiw-face-full span.uppercase`): count `.hiw-card h3`, expect the three names Prompt, Build, Learn from `.hiw-face-front h3`, and allow the new `.hiw-flip-btn` buttons as focusable; leave `scripts/polish-reveal-check.mjs` and `scripts/polish-token-check.mjs` alone unless they fail in T016 (then fix the minimum). Depends on T013.
- [X] T015 Create the check script skeleton `scripts/how-it-works-check.mjs` in the style of `scripts/leads-check.mjs`: env `CHROME`, `BASE`, optional `ONLY=a,b`; helpers `newPage(w, h, { js, reducedMotion })` (Playwright context with `reducedMotion: "reduce"` when asked), `open(p, path)` (goto, `networkidle`, wait until `document.documentElement.getAttribute("data-preloader") !== "run"`), `check(name, ok, extra)`, `shot(p, file)` into `shots/007/`, `noHScroll(p)`, and `heroSnapshot(p)` returning rounded bounding rects of the hero robot image (`img[alt="Tareeq robot assistant"]`), the three `[data-hero-card]` wrappers, the hero `h1` and the hero root, with `SNAPSHOT=write` saving `shots/007/hero-before.json` and normal runs comparing against it. Add the sections `layout` (at 360×740, 390×844, 768×1024, 1024×768, 1440×900: no sideways scroll; at 1024 and 1440 the robot is left of the heading and the carousel; below 1024 the order is heading, robot, carousel; the image is lazy, has `width`, `height` and non-empty `alt`) and `nojs` (JavaScript disabled: all three step names and all three examples are readable text, no `.hiw-controls` visible). Depends on T011.
- [X] T016 Checkpoint: `npm run lint && npm run build`; with a production server, run `SNAPSHOT=write node scripts/how-it-works-check.mjs` once on `main`'s hero (take the snapshot from a build **before** T011 if possible; otherwise accept the current hero, which is unchanged by this feature) and then `ONLY=layout,nojs` normally; confirm `node scripts/polish-token-check.mjs` passes, `git diff 492ab86^ HEAD -- src/components/RobotEyes.tsx` is now empty, and `git status` shows no change to `src/components/Hero.tsx`. Look at the section in the browser at 390 and 1440.

**Checkpoint**: a complete, static "How it works" (list mode) on the new layout, the old robot code gone, the hero untouched.

---

## Phase 3: User Story 2 - Reading the three steps in a carousel (Priority: P1) 🎯 MVP

**Goal**: one card in focus at a time, driven by dots, previous/next, swipe and keys, auto-advancing every 5 seconds under the owner's pause rules, with flip cards.

**Independent Test**: with the section in view (no hand-off needed), let it auto-advance, then use each control and flip every card by mouse, touch and keyboard; the Prompt back reads the owner's example.

- [X] T017 [US2] Add the carousel CSS to `src/app/globals.css`, active only under `html[data-js]` (list mode is untouched without JavaScript): `.hiw-track` becomes one grid cell (`display: grid`; every `.hiw-card` at `grid-area: 1 / 1`) so the height is the tallest card; `.hiw-card[data-pos="active"]` is `opacity: 1; transform: none`, `[data-pos="before"]` is `opacity: 0; transform: translateX(-40px)`, `[data-pos="after"]` is `opacity: 0; transform: translateX(40px)`, with `transition: transform var(--dur-base) var(--ease-soft), opacity var(--dur-base) var(--ease-soft)` on `.hiw-card-pose`; non-active cards `pointer-events: none`; `.hiw-controls` shown as a flex row (dots and buttons ≥ 44px, as 005's controls); the track has `touch-action: pan-y`. **Reduced motion**: the site's global rule in `globals.css` (`@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0.01ms !important … } }`) would remove these transitions, which the owner wants kept: add `@media (prefers-reduced-motion: reduce) { html[data-js] .hiw .hiw-card-pose, html[data-js] .hiw .hiw-card-flip { transition-duration: var(--dur-base) !important; } }` (higher specificity than the universal selector, so it wins). Depends on T016.
- [X] T018 [US2] Add the flip CSS to `src/app/globals.css` under `html[data-js]`: `.hiw-card-flip` is `position: relative; transform-style: preserve-3d; transition: transform var(--dur-slow, 0.5s) var(--ease-soft)`; `.hiw-card[data-flipped] .hiw-card-flip { transform: rotateY(180deg) }`; `.hiw-face-front` and `.hiw-face-back` are stacked in one grid cell with `backface-visibility: hidden`, the back pre-rotated `rotateY(180deg)`; the `.hiw-flip-btn` is a small text button at the card's bottom edge with a 44px tall target and a visible focus ring; the face not showing is hidden from pointer events. (Perspective on `.hiw-card-pose`.) Only `transform` animates. Depends on T017.
- [X] T019 [US2] Rewrite `src/components/sections/how-it-works/StepCarousel.tsx` part 1 (state and attributes): client component taking `labels`, `regionLabel`, `children`; `active` index in the travel context; on every change set on each `.hiw-card`: `data-pos` (`active`/`before`/`after` by cyclic offset), `role="group"`, `aria-roledescription="slide"`, `aria-label` "`{i}` of `{n}`: `{label}`", and `inert` plus `aria-hidden="true"` on cards not in focus; wrap in `role="region"` with `aria-roledescription="carousel"` and `aria-label={regionLabel}` (only when the mode is not `list`); render `.hiw-controls` with Previous, one dot per card (`aria-label` "Show step `{i}`: `{label}`", `aria-current` on the current one) and Next, each at least 44px, visible focus; `go(i)` cycles; Left and Right arrow keys while focus is inside; the track's `aria-live` is `off` until the visitor interacts, then `polite`. In `list` mode set none of these attributes. Depends on T017.
- [X] T020 [US2] Add swipe to `StepCarousel.tsx` with pointer events on the track (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`): track the drag on the card in focus (`.hiw-card-pose`, inline `transform: translateX(dx)` while dragging, cleared on release so the CSS transition takes over); a release with `|dx| > 50px` or a fast flick (velocity over 0.5 px/ms) moves one card (left drag = next); a mostly vertical gesture is ignored (the page scrolls; CSS `touch-action: pan-y` already allows it); movement under 8px counts as a tap, not a swipe; a swipe or tap with `pointerType === "touch"` sets `stopped` (see T022). Depends on T019.
- [X] T021 [US2] Add the flip controller to `StepCarousel.tsx` (state per card, `data-flipped` set on the `.hiw-card`): pointer **hover** on the card in focus (only `(hover: hover) and (pointer: fine)`) flips after a 120 ms hold and flips back when the pointer leaves; a **tap** (touch) toggles; the **`.hiw-flip-btn`** (click, Enter, Space) toggles; a card flipped by tap or key flips back when focus leaves the carousel or when it is no longer in focus; the face that is not showing gets `inert` and `aria-hidden="true"`; `aria-pressed` is not used (the button label changes: "See an example" / "Back"); while a card is flipped, auto-advance is held (T022). Depends on T019 and T018.
- [X] T022 [US2] Add auto-advance to `StepCarousel.tsx` per `contracts/carousel.md`: `INTERVAL = 5000`; run a `setTimeout` for the next card only when none of these hold: pointer over the **card in focus** (not the whole section), keyboard focus inside the carousel, `document.visibilityState === "hidden"`, the region is off screen (`IntersectionObserver`), a card is flipped, the mode is `still` or `list`, `stopped` is true, or (mode `travel`) the cards have not arrived (`arrived` from the context; until T028 it is simply `true`). `stopped` is set for the rest of the visit by a touch swipe or a tap on a card or control (not by mouse or keyboard use). Nothing is stored. Depends on T019 to T021.
- [X] T023 [US2] Add sections to `scripts/how-it-works-check.mjs`: `carousel` (auto-advance happens every 5 s ± 0.5 s; holds with the pointer over the card in focus, with focus inside, with the tab hidden (emulate `visibilitychange`), with the section scrolled out of view, and while a card is flipped; **keeps running** with the pointer elsewhere in the section, e.g. over the heading), `controls` (each dot, previous, next and the arrow keys move one card and update `aria-current`; every control is at least 44px; a touch swipe via `touchscreen`/pointer events moves one card and a mostly vertical drag does not), `touch-stop` (after a touch swipe or tap, no further auto-advance for 12 s), and `flip` (hover with a mouse, tap with a touch context, Enter and Space on `.hiw-flip-btn`: all three cards; the Prompt back reads exactly "Turn a lesson plan into 5 quiz questions in 2 minutes"; the hidden face is `inert`). Depends on T022.
- [X] T024 [US2] Run `ONLY=carousel,controls,touch-stop,flip` at 1440×900 and 390×844 and fix every FAIL; screenshots to `shots/007/carousel-{1440,390}.png` and a flipped card; `npm run lint && npm run build`; `node scripts/polish-token-check.mjs`. Depends on T023.

**Checkpoint**: the section is fully usable on its own (MVP): the three steps in a one-card carousel with flip.

---

## Phase 4: User Story 1 - The hero's cards travel into "How it works" (Priority: P1)

**Goal**: from 768px up, scrolling out of the hero moves the three hero cards into the carousel slot with a short spring and slight overshoot; one set of cards is visible at all times; scrolling back restores the hero exactly; the hero robot never moves.

**Independent Test**: at 1440×900, 1024×768 and 768×1024 scroll slowly down and back: one set of cards in every frame, a smooth settle, the exact hero on return.

- [ ] T025 [US1] Add the travel CSS to `src/app/globals.css` inside `@media (min-width: 768px) and (prefers-reduced-motion: no-preference)` under `html[data-js]`: `.hiw-card-travel` starts `opacity: 0; will-change: transform` (the twin is hidden until the stage shows it, so it can never flash before scripts run); `.hiw-face-compact` and `.hiw-face-front` are stacked in one grid cell and positioned for the face swap (compact on top at the start, front revealed by opacity); `.hiw[data-arrived]` marks arrival; **switch off the reveal entrance for the carousel** here (`.hiw [data-reveal] { opacity: 1; transform: none; }`, because the cards come from the hero). Depends on T024.
- [ ] T026 [US1] Rewrite `src/components/sections/how-it-works/TravelStage.tsx` (client; children are the server-rendered section): in `travel` mode only, `useLayoutEffect` measures `range` (the scroll distance at which the carousel slot's centre reaches `ARRIVE_AT = 0.6` of the viewport height: `slotCenterDocY - 0.6 * innerHeight`, using the carousel track's rect; recompute on `resize`, `ResizeObserver` on the section and the hero root, and `document.fonts.ready`); on scroll set `rawProgress = clamp01(scrollY / range)`; follow it with `useSpring(rawProgress, { stiffness: 320, damping: 24 })` (the starting values from research R3) as the context's `progress` (it may pass 1 slightly: that is the overshoot); **hand-off**: when `rawProgress > 0` call `setHidden(card, true)` on the three hero card wrappers and show the twin cards (visibility, remove `inert`/`aria-hidden`) in the same task; at 0 reverse both; arrival with hysteresis (arrive when the followed value reaches 1, leave below 0.99) sets `arrived` and `data-arrived` on `.hiw`; on leaving `travel` mode or unmount restore the hero exactly (no inline style, `inert` or `aria-hidden` left); **load mid-page**: if the first measurement has `rawProgress >= 1`, mark arrived and place the twins at arrival at once. Never touch the hero robot. Depends on T025 and T009.
- [ ] T027 [US1] Add the twin placement to `StepCarousel.tsx` (travel mode only), as a `useMotionValueEvent` on `progress`: for each card read the hero card's visible box (`.backdrop-blur-md` inside the wrapper) and its parent's tilt (as 005's `placeCards` did), read the slot from the `.hiw-card`'s own layout box (never transformed), then set on `.hiw-card-travel`: `opacity` (0 only at progress 0), `transform: translate(dx*(1-e), dy*(1-e)) rotate(tilt*(1-e))` where `e` is the **unclamped** eased value so it can pass the target slightly; set `.hiw-face-compact`'s width to the hero card's rendered width; crossfade compact → front from progress 0.65 to 1 and scale the front from the hero card's width to full size; **fade out the two cards that are not in focus** as progress passes about 0.7 so only the card in focus remains at arrival, and fade them back in when reversing. Outside travel mode clear every inline style. Depends on T026.
- [ ] T028 [US1] Wire arrival into the carousel: `StepCarousel.tsx` reads `arrived` from the context in `travel` mode so auto-advance (T022) starts only after arrival, and the slide transitions (T017) only apply once arrived (during travel the three cards are positioned only by T027). Depends on T027.
- [ ] T029 [US1] Add the `handoff` section to `scripts/how-it-works-check.mjs` at 1440×900, 1024×768 and 768×1024: scroll from the top to the section in small steps and back, sampling in `requestAnimationFrame`/each step: (a) **exactly one set of three cards visible** (hero wrappers visible XOR twins visible, never both, never neither, using computed `visibility` and bounding boxes), (b) the hero robot's position relative to the hero root never changes, (c) overshoot and settle: after a fast scroll to the arrival point, record the twin's position over time and assert it settles within 0.8 s with overshoot under 10% of the distance, (d) scrolling back to 0 restores `heroSnapshot` equal to `shots/007/hero-before.json` (rects within 1px; no `inert`/`aria-hidden`/inline `visibility` left on hero elements), (e) **load mid-page**: open `/#how-it-works` and a scrolled reload: the twins are at arrival at once, (f) **resize across 768px** while mid-travel ends in the right mode with nothing stuck, (g) **tab mid-scroll**: pressing Tab never focuses an element with `visibility: hidden` or inside `[inert]`. Depends on T028.
- [ ] T030 [US1] Take the ADR-0001 screenshots: with `shots/007/handoff-*.png`, capture the viewport one scroll step before the hand-off, the first frame after it, one mid-travel, and the arrived state at 1440×900 and 1024×768; look at the pair around the hand-off frame by eye. **If any visible pop, jump or size change appears, stop and raise it with the owner instead of shipping.** Depends on T029.
- [ ] T031 [US1] Run `ONLY=handoff` and fix every FAIL; `node scripts/polish-token-check.mjs` (hero hashes unchanged); `git status` shows no change to `src/components/Hero.tsx`; `npm run lint && npm run build`. Depends on T030.

**Checkpoint**: the cards travel from the hero into the carousel and back; the hero robot never moves; the hero is identical at the top.

---

## Phase 5: User Story 4 - Phones, tablets and reduced motion (Priority: P2)

**Goal**: the right behaviour at every width and preference: phone entrance (under 768px), tablet travel (768 to 1023px), reduced motion keeps the carousel and flip animation but nothing moves by itself, and no scripts shows everything as plain text.

**Independent Test**: at 360×740 and 390×844 scroll through the section; at 768×1024 watch the travel; then repeat with reduced motion on and with scripts disabled.

- [ ] T032 [US4] `phone` mode: in `src/components/sections/how-it-works/HowItWorks.tsx` wrap the carousel in the existing `Reveal` (`src/components/ui/Reveal.tsx`) so below 768px the carousel fades and rises in as the section enters the screen (the site's existing mechanism, which already respects reduced motion); T025's CSS already neutralises it from 768px up. Confirm in the browser that at 390px the entrance plays once and at 1440px the carousel is not hidden by `data-reveal` before the cards arrive. Depends on T031.
- [ ] T033 [US4] `still` mode (reduced motion at any width): ensure `useLayoutMode` returns `still`; `TravelStage` does nothing; `StepCarousel` shows the one-card carousel with controls, never auto-advances, and the slide and flip keep their transitions (T017's override); the `Reveal` entrance and the breathing do not run (T038 handles breathing); no `.hiw-card-travel` inline styles. Verify in the browser with `prefers-reduced-motion: reduce` emulated. Depends on T031.
- [ ] T034 [US4] `list` mode (no JavaScript): confirm T012's list styles still hold after T017 and T018 (CSS for the carousel and flip is only under `html[data-js]`): all three cards together (one column below 1024px, three from 1024px), both faces as plain text, no controls, no flip buttons. Fix any leak of carousel CSS into list mode. Depends on T031.
- [ ] T035 [US4] Tablet range (768 to 1023px): at 768×1024 and 1000×800 confirm the stacked layout (heading, robot, carousel), that `ARRIVE_AT` (T026) lands the cards in the visible slot (not too late, not off screen), and that nothing overflows sideways. Adjust `ARRIVE_AT` only if the measured arrival looks wrong, and write the chosen value in `plan.md` Key Decisions. Depends on T031.
- [ ] T036 [US4] Add sections to `scripts/how-it-works-check.mjs`: `reduced-motion` (with `reducedMotion: "reduce"` at 1440 and 390: no hero card is ever hidden while scrolling, no `.hiw-card-travel` inline transform, no auto-advance over 12 s, no running breathing animation; using Next/Previous still moves the card **with a running transition** on `.hiw-card-pose`, and the flip toggles with a running transition on `.hiw-card-flip`), `phone` (at 360×740 and 390×844: no sideways scroll, the carousel reveals once on entering the screen, controls at least 44px), `tablet` (768×1024: the hand-off sections run and settle in the visible slot). Depends on T033 and T035.
- [ ] T037 [US4] Run `ONLY=reduced-motion,phone,tablet,nojs,layout` and fix every FAIL; screenshots `shots/007/{phone-390,tablet-768,still-1440,nojs-390}.png`; `npm run lint && npm run build`. Depends on T036.

**Checkpoint**: the section is complete and correct on phones, tablets, with reduced motion and without scripts.

---

## Phase 6: User Story 3 - The section's robot image breathes (Priority: P3)

**Goal**: the section's robot image gently breathes in a loop of about 4 seconds with a pulsing glow behind it, only while the section is on screen, and is still under reduced motion.

**Independent Test**: watch the image for several loops, scroll the section out of view and back, then repeat with reduced motion on.

- [ ] T038 [US3] Create `src/components/sections/how-it-works/BreathingRobot.tsx` (client leaf; the server-rendered `next/image` is passed in as `children`): `useInView` on the wrapper (`amount: 0.1`) and `useReducedMotion`; a `motion.div` around the children with `transformOrigin: "50% 100%"` animating `scale: [1, 1.02, 1]` and `y: [0, -5, 0]` with `transition: { duration: 4, ease: "easeInOut", repeat: Infinity }` only while in view and not reduced (otherwise animate to rest, `scale: 1, y: 0`); behind it a `.hiw-glow` `motion.div` (`aria-hidden`) animating `opacity: [0.35, 0.7, 0.35]` and `scale: [1, 1.04, 1]` on the same 4 s cycle. Only `transform` and `opacity`. Update `HowItWorks.tsx` to wrap the robot image in `BreathingRobot`. Depends on T037.
- [ ] T039 [US3] Add the glow style to `src/app/globals.css`: `.hiw-glow` is an absolutely positioned circle behind the image (`inset` around the image, `border-radius: 9999px`, `pointer-events: none`) with `background: radial-gradient(closest-side, color-mix(in srgb, var(--color-saffron) 40%, transparent), color-mix(in srgb, var(--color-sky) 25%, transparent) 60%, transparent)` (existing tokens only, no hex, low opacity); `.hiw-robot` is `position: relative` and clips nothing (`overflow-x: clip` on `.hiw` keeps the page from scrolling sideways). Depends on T038.
- [ ] T040 [US3] Add the `breathing` section to `scripts/how-it-works-check.mjs`: measure the wrapper's computed transform over 12 s at 100 ms steps: period 4 s ± 0.5, maximum scale 1.02 ± 0.003, vertical drift 4 to 6 px, `transform-origin` at the bottom; the glow's opacity cycles in step; after scrolling the section out of view the transform stops changing for 3 s and resumes when it returns; with `reducedMotion: "reduce"` the transform and glow stay constant; the image is never mirrored (no negative `scaleX`). Depends on T039.
- [ ] T041 [US3] Run `ONLY=breathing` and fix every FAIL; `node scripts/polish-token-check.mjs` (no hard-coded colours); screenshots `shots/007/breathing-{1440,390}.png`; `npm run lint && npm run build`. Depends on T040.

**Checkpoint**: all four stories complete.

---

## Phase 7: Polish and cross-cutting concerns

- [ ] T042 Full run: build and start a production server, run `node scripts/how-it-works-check.mjs` with every section, plus the existing `scripts/home-check.mjs`, `scripts/polish-token-check.mjs`, `scripts/polish-reveal-check.mjs` and `scripts/whatsapp-check.mjs`; fix any FAIL (the reveal check mentions `hiw-glow` and the position of `#how-it-works`: update only what the new section legitimately changes). Depends on T041.
- [ ] T043 Compare with the baseline: `bash shots/007/lh.sh after` (5 runs) and total JS bytes in `.next/static/chunks`; record in `specs/007-how-it-works-section/baseline.md`. Pass if the median performance is at least 90 with accessibility 100, the hero's LCP element and time are no worse than the baseline (within noise), CLS is 0, and total JS is no larger than the baseline (this feature removes 005's larger travel and robot code). Also compare the hero screenshots at 1440×900 and 390×844 with `shots/007/hero-before/`. Depends on T042.
- [ ] T044 [P] Accessibility pass: a keyboard-only walk through the section (Tab to controls, arrows, Enter and Space on the example buttons, no focus on hidden cards) and a screen-reader pass with NVDA (the carousel announces as a carousel with slides, a change caused by the visitor is announced politely, auto-advance is silent, decorative parts are hidden). Note the results in `specs/007-how-it-works-section/quickstart.md` under "Results". Depends on T042.
- [ ] T045 [P] Screenshots for review in `shots/007/` at 1440×900, 390×844 and 768×1024: hero at the top, mid-travel, arrived with each card in focus, a flipped card, reduced motion, no scripts, and the stacked layout. Depends on T042.
- [ ] T046 Hand-off notes appended to `specs/007-how-it-works-section/quickstart.md` ("Owner open items"): the wording marked DRAFT to confirm or replace (the line and example for Build and Learn, the intro, the image description; only the Prompt example is the owner's), the chosen `ARRIVE_AT` and spring values, what was deleted from feature 005, and (if the owner agreed) the ADR for the hand-off. Depends on T043.
- [ ] T047 Close out per the one-feature-per-branch rule: `git status` shows `Hero.tsx` and the protected files unchanged, no secrets, `public/how-it-works.png` tracked; commit on `007-how-it-works-section`; **ask the owner before merging** to `main`, then merge, delete the branch and leave `main` clean. Depends on T043 to T046.

---

## Dependencies and Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies. Do it first, on the untouched branch.
- **Foundational (Phase 2)**: after Setup. Blocks all stories.
- **US2 carousel (Phase 3)**: after Foundational. The MVP.
- **US1 hand-off (Phase 4)**: after US2 (the cards land in the carousel).
- **US4 modes (Phase 5)**: after US1 (it verifies `phone`, `still`, `list` and the tablet travel against the finished pieces).
- **US3 breathing (Phase 6)**: only needs Foundational, but is placed last because it is P3 and must also be checked in `still` mode.
- **Polish (Phase 7)**: after all stories.

```text
Setup ──► Foundational ──► US2 (carousel, MVP) ──► US1 (hand-off) ──► US4 (modes) ──► US3 (breathing) ──► Polish
```

### Within each story

- CSS before the component that sets its attributes; components before the check section; the check section before the "run and fix" task.
- Any task that edits `src/app/globals.css` runs alone (same file).

---

## Parallel Opportunities

- **Foundational**: T006 (delete the robot twin) and T008 (the layout-mode hook) can run together after T003; T004 and T010 after T003.
- **Polish**: T044 (accessibility pass) and T045 (screenshots) together after T042.
- Most other tasks touch the same few files (`StepCarousel.tsx`, `TravelStage.tsx`, `globals.css`, the check script), so they run in order.

### Parallel example: Foundational

```text
Task: "T006 Delete the robot twin files and images (git rm ...)"
Task: "T008 Update src/hooks/useLayoutMode.ts to the four modes"
```

---

## Implementation Strategy

### MVP first (US2)

1. Phase 1 baseline, then Phase 2 (a complete static section with the old robot code gone).
2. Phase 3 (US2): the one-card carousel with flip and the owner's auto-advance rules.
3. **Stop and validate** (T024). The section already explains the method on every device, with no travel.

### Incremental delivery (matches the plan's milestones)

1. M0 baseline = Phase 1 · M1 static section = Phase 2 · M2 carousel = Phase 3 · M3 hand-off = Phase 4 (plus US4 verification in Phase 5) · M4 breathing = Phase 6 · M5 close-out = Phase 7.

Each milestone ends with lint, build and a browser check at 390 and 1440 before the next starts (constitution VII). The hand-off (Phase 4) carries the one risk that can stop the feature: a visible pop at the swap (T030).

---

## Notes

- `[P]` means different files with no dependency on an unfinished task.
- Never edit `Hero.tsx`; if a task seems to need it, stop and ask the owner.
- Placeholder wording is marked DRAFT in the content file; only the Prompt example is the owner's.
- Feature 006 (lead capture) is merged and untouched by this feature.
