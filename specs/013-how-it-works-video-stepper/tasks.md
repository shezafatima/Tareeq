---

description: "Task list for the How it works tablet video stepper"
---

# Tasks: How it works — Tablet Video Stepper

**Input**: Design documents in `E:\tareeq\specs\013-how-it-works-video-stepper\` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)
**Tests**: Included, because the plan defines them: unit tests for the pure logic (`node --test`) and a Playwright check script for behaviour, layout and network order.
**Organization**: grouped by user story. US1 and US2 are P1, US3–US5 are P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 auto-play sequence, US2 jump to a step, US3 responsible playback, US4 reduced motion / data saver, US5 responsive layout
- All paths are relative to `E:\tareeq`

## Hard rules for every task (from the constitution and spec)

- Do NOT edit `src/components/Hero.tsx`, `src/components/RobotEyes.tsx` or any hero CSS (Principle VIII). Keep `data-hero-card`, `JsFlagScript` and `html[data-js]` (other code uses them).
- Do NOT delete `RobotStage`, `BreathingRobot`, `src/content/robot-image.ts`, the `.robot-*` CSS or `public/how-it-works.png` (the Why Tareeq section uses them).
- No new npm packages. No `framer-motion` import in the new files. Animate only `transform` and `opacity`. Brand tokens only (no hex in components).
- `"use client"` only on `VideoStepper.tsx` and `useStepPlayback.ts`, with a one-line reason at the top.
- Quote any path containing parentheses in shell commands (for example `"src/app/(site)/page.tsx"`).

---

## Phase 1: Setup

- [X] T001 (taken together with T035, back to back, instead of before the work) Record a baseline on `main` before any change, in `specs/013-how-it-works-video-stepper/baseline.md`: production build of `main` (use the `E:\tareeq-main` worktree), hero screenshots at 1440x900 and 390x844 (`scripts/hero-snapshot.mjs`), total JS bytes in `.next/static/chunks`, and 5 mobile Lighthouse runs of `/` (Performance, LCP element and time, TBT)
- [X] T002 Run `node scripts/polish-token-check.mjs` on this branch and note in `baseline.md` that the hero hash guard passes before changes
- [X] T003 [P] Add the script `"posters:how-it-works": "node scripts/make-how-it-works-posters.mjs"` to `package.json` (scripts only, no dependency changes)
- [X] T004 [P] Create `scripts/make-how-it-works-posters.mjs`: with Playwright Chromium open each of `public/videos/how-it-works/{prompt,build,learn}.mp4` via a local file URL, wait for `loadeddata`, seek to 0, screenshot the `<video>` element, convert with `sharp` to `public/videos/how-it-works/{prompt,build,learn}.webp` (width at most 1280, quality about 80), and print for each video: `videoWidth x videoHeight`, `duration`, MP4 size in MB, poster size in KB
- [X] T005 Run `npm run posters:how-it-works`; paste the printed report into `baseline.md` as the before/after size table. Check each video is at most 3 MB and at most 1280 px wide. Note each video's aspect ratio in `research.md` R10 (decides `object-fit: cover` or `contain`, default `cover`)
- [X] T006 (skipped: all under limits) CONDITIONAL, only if T005 shows a video over 3 MB or wider than 1280 px: stop and ask the owner to install ffmpeg, then add an npm script `videos:compress` (ffmpeg, H.264, `-vf scale=-2:720`, `-an`, `-movflags +faststart`, `-crf 26`, writing next to the sources) and report before/after sizes. Otherwise mark this task skipped with the reason "all under limits"

**Checkpoint**: baseline recorded, three posters exist, video limits confirmed.

---

## Phase 2: Foundational (blocks all user stories)

- [X] T007 Update the types in `src/content/types.ts`: `HowStep` becomes `{ id: "prompt" | "build" | "learn"; number: 1 | 2 | 3; name: string; title: string; line: string; video: string; poster: string; videoLabel: string; order: number }`; remove `example`; `HowItWorksContent` keeps `heading`, `intro`, `steps` (see `data-model.md`)
- [X] T008 Rewrite `src/content/how-it-works.ts` to the new shape with the three steps. Titles are the owner's: "Ask AI the right way.", "Make something real.", "Understand what you made, then improve it." Names: Prompt, Build, Learn. One-line `line` per step as DRAFT placeholders (see `data-model.md` copy) with a top-of-file comment saying the lines are drafts for owner review. Paths `/videos/how-it-works/<id>.mp4` and `/videos/how-it-works/<id>.webp`. Check `src/content/index.ts` `getHowItWorks()` still compiles and sorts by `order`; fix only what the type change breaks
- [X] T009 [P] Create `src/lib/stepper.ts` (no React, no DOM): `nextIndex(i, count)` with wrap, `completedIndices(active)` (indices below active), `resolveMode({ reducedMotion, saveData, autoplayBlocked })` returning `"auto" | "manual"`, `shouldPreloadNext(currentTime, duration, thresholdSeconds = 3)`, `PRELOAD_THRESHOLD_S = 3`, `FADE_MS = 400`, `STALL_MS = 8000`, `FAIL_ADVANCE_MS = 4000`
- [X] T010 [P] Create `tests/unit/stepper.test.ts` covering `nextIndex` wrap (2 to 0), `completedIndices(0)` empty and `(2)` equals [0,1], `resolveMode` for each flag, `shouldPreloadNext` false at 10 s of 20, true at 18 s of 20, false when duration is NaN or 0. Run `npm run test:unit` and make it pass
- [X] T011 [P] Create `src/components/sections/how-it-works/TabletFrame.tsx` (no `"use client"`, no hooks): wrapper `.tablet` with `aspect-ratio: 612 / 408`; a screen slot `.tablet-screen` (children go here) positioned at `inset: 7.4% 15.5% 25.0% 15.0%` extended 0.5% under the bezel, `overflow: hidden`, small radius; the frame `next/image` of `/tablet-screen.png` (612x408, `alt=""`, lazy, `sizes="(min-width: 1024px) 60vw, 100vw"`, `pointer-events: none`) layered above the slot
- [X] T012 [P] Create `src/components/sections/how-it-works/StepCard.tsx` (no `"use client"`; it only takes props and callbacks from the client parent): a `<button type="button">` with `aria-current="step"` when active, `data-state="active" | "done" | "idle"`, number, `name`, `title`, `line`, a check icon from `@phosphor-icons/react` plus visually hidden "Completed" when done, a decorative progress element `aria-hidden` that receives a ref prop for the progress bar. Min height 44px, visible `:focus-visible`
- [X] T013 Replace the old `.hiw-*` CSS block in `src/app/globals.css` (the "Feature 007" block from `.hiw {` to the end of the reduced-motion `.hiw` rules, including the travel/hand-off comments) with the new rules, and leave the `.robot-*` block untouched: section background `var(--color-soft)` kept; `.hiw-stage` grid (one column below 1024px; from 1024px `minmax(0, 3fr) minmax(0, 2fr)` with steps vertically centred); `.tablet`, `.tablet-screen`, stacked `.step-layer` (absolute, `opacity 0`, `data-active` gives `opacity 1`, `transition: opacity 400ms`); card states (active: saffron accent bar and `translateY(-2px)`, opacity 1; idle: opacity about 0.55; done: check visible); progress bar with `transform: scaleX()` from 0 and `transform-origin: left`; below 1024px three equal-column compact stepper (number + name) plus a fixed-min-height detail panel for the active step; `.hiw` has `overflow-x: clip`. No hex values; use the tokens already defined

**Checkpoint**: types, content, pure logic (tested), frame, card and CSS exist. `npm run lint` and `npm run test:unit` pass. The home page may not compile until US1 swaps the section.

---

## Phase 3: User Story 1 — Watch the three steps play automatically (P1) 🎯 MVP

**Goal**: Prompt, Build, Learn play in a loop with a 400 ms cross-fade; the active card, checks and progress bar follow.
**Independent test**: scroll the section into view and watch one loop; order, fade, card switch, checks, loop reset and progress all match the spec.

- [X] T014 [US1] Create `src/components/sections/how-it-works/useStepPlayback.ts` (`"use client"`, reason: state, effects and media events): holds `active`; refs to three `<video>` elements and the progress bar element; on `ended` of the active video call `nextIndex`, set the next video's `currentTime = 0`, call `play()`, and change `active` in the same state update (fade and card switch together); `requestAnimationFrame` loop only while playing that writes `scaleX(currentTime / duration)` to the bar ref (no per-frame React state); update the bar once on `seeked`, pause and select; expose `completed = completedIndices(active)` (cleared after the loop returns to 0); when `shouldPreloadNext` becomes true set the next video's `preload = "auto"` once
- [X] T015 [US1] Create `src/components/sections/how-it-works/VideoStepper.tsx` (`"use client"`, reason: state, effects, media events and browser observers): props `{ steps: HowStep[]; regionLabel: string }`. Render `TabletFrame` with, per step, a lazy `next/image` poster layer under a `<video muted playsInline preload="none" aria-label={videoLabel} tabIndex={-1}>` (no `controls`, no `poster` attribute, `src` set to the step's video, `object-fit` per T005) inside `.step-layer`; then `<ol aria-label={regionLabel}>` of `StepCard`s wired to `useStepPlayback`. Playback may start immediately for now (US3 adds gating)
- [X] T016 [US1] Rewrite `src/components/sections/how-it-works/HowItWorks.tsx` as an async Server Component: `getHowItWorks()`, return `null` if `steps.length !== 3`, render `<section id="how-it-works" aria-labelledby="hiw-title" className="hiw">` with `SectionHeading` (`id="hiw-title"`, heading and intro) and `<VideoStepper steps regionLabel>`. Remove the `Reveal`, `RobotStage`, `robotImage`, `StepCarousel` and `CarouselCard` imports. Keep `src/app/(site)/page.tsx` unchanged (it already renders `<HowItWorks />`)
- [X] T017 [US1] Delete `src/components/sections/how-it-works/CarouselCard.tsx`, `StepCarousel.tsx`, `StepIcon.tsx` and `src/hooks/useLayoutMode.ts`. Then run a search for `useLayoutMode`, `StepIcon`, `StepCarousel`, `CarouselCard`, `hiw-track`, `hiw-card`, `hiw-robot` across `src`, `scripts` and `tests` and fix every leftover reference (the old `scripts/how-it-works-check.mjs` is rewritten in T018). Confirm `RobotStage`, `BreathingRobot`, `robot-image.ts` and the `.robot-*` CSS still exist and `WhyTareeq.tsx` still builds
- [X] T018 [US1] Rewrite `scripts/how-it-works-check.mjs` (Playwright, against `npm run start` on port 3000): scroll to `#how-it-works`; assert the Prompt video plays first and the Prompt card has `aria-current="step"`; fast-forward each video near its end (set `currentTime = duration - 0.3`) and assert order Prompt, Build, Learn, Prompt; assert the active card changes within 100 ms of the active layer opacity change and the fade lasts about 400 ms (computed style transition); assert done cards show the check and checks clear after the loop; assert the progress bar `scaleX` increases with `currentTime`
- [X] T019 [US1] Run `npm run lint`, `npm run build`, `npm run start` and `node scripts/how-it-works-check.mjs`; look at the section in a real browser at 390px and 1440px (Principle VII) and fix what breaks

**Checkpoint**: US1 works alone and the old section is gone. Demo here.

---

## Phase 4: User Story 2 — Jump to a step (P1)

**Goal**: click, tap or keyboard on a card restarts that step from 0.
**Independent test**: activate each card by mouse, touch and Tab + Enter/Space; the matching video restarts and the cards update.

- [X] T020 [US2] In `src/components/sections/how-it-works/useStepPlayback.ts` add `select(i)`: pause the others, set `active = i`, `currentTime = 0`, `play()`, update completed and the bar immediately; selecting the already-active card restarts it; rapid selects leave only the last one playing (cancel any pending advance or fallback timer). Wire `onClick` from each `StepCard` in `VideoStepper.tsx`
- [X] T021 [US2] Confirm keyboard operation in `StepCard.tsx`: native `<button>` gives Tab order 1, 2, 3 and Enter/Space; check `:focus-visible` ring is visible against the soft background in `globals.css`; min touch height 44px
- [X] T022 [US2] Extend `scripts/how-it-works-check.mjs`: click card 3 and assert Learn is active, its video `currentTime` is below 0.5 and cards 1 and 2 show checks; press Tab to focus card 2, press Enter, assert Build restarts; press Space on card 1; click the active card and assert restart; click cards 1, 2, 3 within 200 ms and assert only the Learn video is playing; touch tap with `page.touchscreen.tap`

**Checkpoint**: US1 and US2 both work.

---

## Phase 5: User Story 3 — Responsible playback (P2)

**Goal**: video plays only when visible; nothing loads before the hero has rendered.
**Independent test**: scroll away and switch tabs to confirm pause and resume; check the network log order on a fresh load.

- [X] T023 [US3] In `useStepPlayback.ts` / `VideoStepper.tsx` add the visibility rules: an `IntersectionObserver` (threshold 0.35) on the tablet sets `inView`; a `visibilitychange` listener sets `tabVisible`; playing is allowed only when both are true: otherwise pause the active video, and on return call `play()` without resetting `currentTime`. Stop the progress `requestAnimationFrame` loop while paused
- [X] T024 [US3] Add the load gating: `<video>` elements render with `preload="none"` and no network `src` effect; set `preload="metadata"` on all three only when (a) a second `IntersectionObserver` with `rootMargin` of about 100% viewport reports near view, and (b) the window `load` event has fired and a `requestIdleCallback` (fallback `setTimeout` 200 ms) has run. Poster layers stay lazy `next/image`. Verify with the network log that no `.mp4` or poster request starts before the hero has painted
- [X] T025 [US3] Add the failure fallback in `useStepPlayback.ts`: on a video `error`, or no `playing` event within `STALL_MS`, mark the step failed (its poster stays visible) and advance after `FAIL_ADVANCE_MS` in auto mode; clear the timers on select and unmount
- [X] T026 [US3] Extend `scripts/how-it-works-check.mjs`: on a fresh page load at the top, record requests and assert zero requests for `/videos/how-it-works/*` and `/tablet-screen.png` before scrolling; scroll toward the section and assert requests then start; once playing, scroll away and assert all videos are `paused`; scroll back and assert resume without `currentTime` reset; emit a hidden `visibilitychange` (override `document.visibilityState`) and assert pause; abort the `build.mp4` request with `page.route` and assert the sequence still advances past Build

**Checkpoint**: US1 to US3 work; the hero's loading order is protected.

---

## Phase 6: User Story 4 — Reduced motion and data saver (P2)

**Goal**: no autoplay in those modes; poster plus play button.
**Independent test**: with reduced motion (and separately Save-Data), nothing plays until the play button is pressed.

- [X] T027 [US4] In `useStepPlayback.ts` add `mode` using `useSyncExternalStore` with server snapshot `"manual"`: subscribe to `matchMedia("(prefers-reduced-motion: reduce)")` changes and read `navigator.connection?.saveData` (guarded, since the API is not in all browsers), combine through `resolveMode`; a rejected `play()` promise sets `autoplayBlocked` so `mode` becomes `"manual"`. In manual mode: no autoplay, no auto-advance, no fallback advance, the poster of the active step shows
- [X] T028 [US4] In `VideoStepper.tsx` render, only in manual mode, a centred `<button type="button" aria-label="Play {name}">` over the tablet screen (44px or larger, Phosphor play icon, brand tokens) that plays the active step once from its start; cards still select a step (show its poster) without playing; when the video ends, stay on the last frame and show the play button again. Style it in `globals.css`
- [X] T029 [US4] Extend `scripts/how-it-works-check.mjs`: with Playwright `reducedMotion: "reduce"` assert no video is playing after scrolling the section into view, the poster is visible, pressing Play starts the active step and the card shows progress; with `navigator.connection.saveData` forced true through `addInitScript`, assert the same; with `HTMLMediaElement.prototype.play` stubbed to reject, assert the play button appears

**Checkpoint**: US4 works without breaking US1 to US3.

---

## Phase 7: User Story 5 — Works on phones and tablets (P2)

**Goal**: correct layouts at every width; no horizontal scroll at 360px.
**Independent test**: view at 360, 768 and 1280px.

- [X] T030 [US5] Tune the section CSS in `src/app/globals.css`: at 1024px and up the tablet column is about 60% (`3fr / 2fr`) and the three cards stack vertically with number, name, title and line each; below 1024px the tablet is full width on top and the cards are three equal tabs (number + name) with the active step's title, line and progress bar in a fixed-min-height detail panel below; the detail panel content comes from the same `StepCard` data and must not duplicate the markup (render the active card's text once, with CSS choosing placement) — if that is not possible without a duplicate, show the active card's own title, line and progress inside the card and let the other two cards show number + name only, still equal columns. Verify nothing shifts when the active step changes
- [X] T031 [US5] Extend `scripts/how-it-works-check.mjs`: at 360x740, 768x1024 and 1280x800 assert `document.documentElement.scrollWidth <= window.innerWidth`; at 1280 assert the tablet box is between 55% and 65% of the stage width and the cards are stacked vertically on the right; at 360 and 768 assert the tablet is above the cards and spans the stage width; assert every card is at least 44px tall; assert the layout height of the stepper does not change between steps (no layout shift)
- [X] T032 [P] [US5] (computed by hand, see baseline.md) Run `node scripts/contrast.mjs` (or compute by hand if it does not cover this): card text on the dimmed (idle) state must be at least 4.5:1 on `--color-soft`; if the opacity-based dimming fails, dim the card surface and keep the text colour. Saffron is never used as text on a light background

**Checkpoint**: all five user stories work on their own and together.

---

## Phase 8: Polish and cross-cutting

- [X] T033 Hero guard: run `node scripts/polish-token-check.mjs` (hash check must pass), and `git diff main -- src/components/Hero.tsx src/components/RobotEyes.tsx` must be empty; take hero screenshots at 1440x900 and 390x844 and compare with the T001 baseline
- [X] T034 Run `npm run lint`, `npm run test:unit`, `npm run build`, then `node scripts/how-it-works-check.mjs` and the existing `scripts/why-tareeq-check.mjs` and `scripts/home-check.mjs` (the removed section must not break them; update only assertions that referred to the old carousel)
- [X] T035 Back-to-back mobile Lighthouse of this branch against `main` (same machine, alternating, 5 runs each, as in features 005, 007 and 008); compare Performance, LCP element and time, TBT and total JS; record in `baseline.md`. The hero LCP element and time must be unchanged and no new regression versus `main`; if the run-to-run noise hides a difference, say so plainly in the notes
- [X] T036 Walk through every step in `quickstart.md` in a real browser at 390px and 1440px; fix what fails
- [X] T037 Update `specs/013-how-it-works-video-stepper/checklists/requirements.md` notes with the final video sizes and posters; add a short "owner review" list at the end of `baseline.md`: draft step lines, low resolution of `tablet-screen.png` (a 2x file with the same proportions drops in), mobile detail panel decision
- [X] T038 When the owner approves: commit this feature (including `public/videos/how-it-works/*.mp4`, the new `*.webp` posters and `public/tablet-screen.png`), merge to `main`, delete the branch and leave `main` clean before the next feature (project memory: one feature per branch). Do not push or merge without the owner's go-ahead

---

## Dependencies and order

- Phase 1 (T001–T006) first; T003 and T004 are parallel; T005 needs both; T006 only if T005 says so.
- Phase 2: T007 then T008; T009, T010, T011, T012 can run in parallel with them (different files); T013 needs T011 and T012 class names.
- US1 needs all of Phase 2. US2 needs US1 (same hook and component). US3, US4 and US5 each need US1; US3 and US4 touch the same two files as US1 and US2, so do them one after the other (US3 then US4). US5 is mostly CSS and the check script and can run alongside US3 or US4 if a different person or agent edits `globals.css` last.
- Phase 8 after all stories.

```text
Setup ─► Foundational ─► US1 ─► US2 ─► US3 ─► US4 ─► Polish
                           └──────────────► US5 ─────────┘
```

## Parallel examples

- Phase 1: T003 and T004 together.
- Phase 2: T009, T010, T011, T012 together (T007 and T008 sequential beside them).
- Checks: T032 any time after T013.

## Implementation strategy

- **MVP**: Phases 1 to 3 (US1). The section already plays the three videos with synced cards and the old section is removed.
- **Then**: US2 (control), US3 (performance and visibility safety), US4 (accessibility), US5 (layout polish). Do not ship without US3 and US4: they protect the hero and respect users' settings.
- Verify at each checkpoint (build, lint, look at 390px and 1440px) before starting the next phase (Principle VII).

## Owner changes during implementation

Order Learn, Prompt, Build; whole section fits one desktop screen; centred heading; background vectors in `HowItWorksBackdrop.tsx`. See `baseline.md`. References above to the order Prompt, Build, Learn are from before that change.

## Summary

- 38 tasks: Setup 6, Foundational 7, US1 6, US2 3, US3 4, US4 3, US5 3, Polish 6.
