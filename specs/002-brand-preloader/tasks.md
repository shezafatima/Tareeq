# Tasks: Brand Preloader

**Input**: Design documents in `/specs/002-brand-preloader/` (plan.md, spec.md, research.md, data-model.md, contracts/preloader.md, quickstart.md)
**Prerequisites**: plan.md and spec.md (both present)
**Tests**: The spec's "Verify" section asks for specific checks, so verification tasks are included. They live in one script, `scripts/preloader-check.mjs`, that grows story by story. Each phase ends with a checkpoint that must pass before the next phase starts (constitution Principle VII).

## Format: `- [ ] T### [P?] [Story?] Description with file path`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[US#]**: user story from spec.md (US1 first-visit animation, US2 never slows the site, US3 skip cases, US4 accessibility)

## Rules that apply to every task

- Animate only `transform` and `opacity`. No animated blur or filter. A static SVG glow on the eyes is allowed (the hero does the same).
- No hex or `rgba(` values in new files: use `var(--color-midnight)`, `var(--color-saffron)` and `bg-white`. The eye colour comes from the hero's exported constant.
- No new dependencies. Do not use Framer Motion in the preloader.
- Do not change `public/robot-head.png`. Do not change the hero except the export-only edit in T004.
- `"use client"` only in `PreloaderEyes.tsx`, with a one-line reason comment (constitution XI).
- **Environment hygiene (lessons from the last feature):**
  - Before starting any server, confirm the port is free: `Get-NetTCPConnection -LocalPort 3100 -State Listen` must return nothing. Stop servers with `taskkill /PID <pid> /T /F` and re-check.
  - Never create junctions or symlinks to `node_modules`, and never run `rm -rf` on a folder that might contain one.
  - Only clear `.next` (`rm -rf .next`) when no dev or production server is running.
  - Run Lighthouse only after confirming the page's CSS and JS assets return HTTP 200 from the server being measured.
  - Always run a production build (`npm run build`, then `next start -p 3100`) for timing and Lighthouse work.

---

## Phase 1: Setup (baselines before any change)

- [X] T001 Confirm the branch is `002-brand-preloader`, the working tree has only the new spec files and `public/robot-head.png`, and `npm run lint`, `npx tsc --noEmit` and `npm run build` pass; record the commit hash in `specs/002-brand-preloader/baseline.md`
- [X] T002 Capture the hero baseline on a fresh production build: `node scripts/hero-snapshot.mjs shots/hero-pre-export` (see `scripts/hero-snapshot.mjs`; needs `CHROME` set and `BASE=http://localhost:3100`)
- [X] T003 Take the **before** Lighthouse numbers: on the same production build run mobile Lighthouse on `http://localhost:3100/` five times (`npx --yes lighthouse@12.8.2 ... --only-categories=performance`), and write each run's Performance, LCP, TBT and the LCP element, plus median and range, to `specs/002-brand-preloader/baseline.md`

**Checkpoint**: baseline file exists with 5 runs; hero baseline snapshot exists.

---

## Phase 2: Foundational (blocks all user stories)

**Purpose**: the hero export edit, shared numbers, the state model, and the mount points.

- [X] T004 In `src/components/RobotEyes.tsx` add the `export` keyword (and nothing else) to these constants: `EYE_COLOR`, `EYE_W`, `EYE_H`, `EYE_GAP`, `EYE_CY`, `ARC_W`, `ARC_STROKE`, `GLOW_BLUR`, `CLIP_INSET`, `VISOR_RADIUS`, `MORPH_DURATION`. Do not change any value, order or behaviour.
- [X] T005 Prove the hero is unchanged after T004: rebuild, restart the production server on a free port 3100, run `node scripts/hero-snapshot.mjs shots/hero-post-export`, then `python scripts/hero-compare.py shots/hero-pre-export shots/hero-post-export`; it must print `IDENTICAL`. If not, revert T004 and stop.
- [X] T006 [P] Create `src/components/layout/preloader/visor.ts` with the measured numbers for `public/robot-head.png`: image 241 x 195; `VISOR_CX = 50.22` (% of width), `VISOR_CY = 57.74` (% of height), `VISOR_ANGLE = 0`, `VISOR_W = 69.32` (% of width), `VISOR_H = 62.11` (% of height); a comment citing the measurement method (rotated extents of the dark visor region with holes filled; the same method reproduces the hero's constants)
- [X] T007 [P] Create `src/components/layout/preloader/preloader.css` with the state rules only: `#preloader` hidden by default (`display: none`); `html[data-preloader="run"] #preloader` visible (fixed, inset 0, white, high z-index, `pointer-events: none`, centred column); a `prefers-reduced-motion: reduce` media rule that hides it; `html[data-preloader="done"] #preloader` hidden. Use tokens only. (Done ahead of T020: this file also contains the CSS-only hard-maximum fade, so a half-built preloader can never cover the site for more than 1.5 s. T020 then only adds the `leave` rule.)
- [X] T008 Create `src/components/layout/preloader/init.ts` exporting `PRELOADER_SEQUENCE_MS = 1200`, `PRELOADER_FADE_MS = 300`, and a plain function `initPreloader()` (ES2020, no imports) that, for now, only sets `document.documentElement.dataset.preloader = "run"`. Create `src/components/layout/preloader/PreloaderScript.tsx` (server component) that renders `<script dangerouslySetInnerHTML={{ __html: "(" + initPreloader.toString() + ")()" }} />`.
- [X] T009 Create `src/components/layout/preloader/Preloader.tsx` (server component) rendering only `<div id="preloader" aria-hidden="true">` containing an empty `data-part="head"` wrapper for now, and import `./preloader.css`
- [X] T010 In `src/app/layout.tsx` add `suppressHydrationWarning` to the `<html>` element (the script changes its `data-preloader` attribute before React hydrates). In `src/app/(site)/layout.tsx` render `<PreloaderScript />` then `<Preloader />` as the first two children of the wrapper `div`, before the skip link.
- [X] T011 Run `npm run lint`, `npx tsc --noEmit`, `npm run build`; start the production server and confirm `/` shows a white full-screen overlay briefly, that `/gradient-demo` shows none, and that `document.documentElement.dataset.preloader` is `run` on `/`; confirm there is no React hydration error in the console

**Checkpoint**: hero identical; overlay mounts only in the `(site)` shell; build and lint clean.

---

## Phase 3: User Story 1 - A short branded moment on the first visit (Priority: P1) MVP

**Goal**: the head, the three eye expressions and the chevron fill play once, in sync, inside 1.2 s.
**Independent Test**: open the site in a fresh session on a normal connection; the sequence runs in order and ends.

- [X] T012 [P] [US1] Create `src/components/layout/preloader/ChevronProgress.tsx` (server component): an SVG row of 7 chevrons (same chevron shape as the logo, `currentColor`) rendered twice: a base row coloured `var(--color-midnight)` and a saffron row (`var(--color-saffron)`) inside a clipping window that translates in from the left while the saffron row translates the opposite way (so it stays in place), with a soft gradient mask on the window's right edge; plus a white copy of the last chevron (`data-part="last-chevron"`) for the brighten effect. Add `data-part="progress"`. No width or height animation, only transforms.
- [X] T013 [P] [US1] Create `src/components/layout/preloader/PreloaderEyes.tsx` with `"use client"` and the one-line reason comment ("imports constants from RobotEyes, a client module"). Build the SVG in the head image's pixel space (`viewBox="0 0 241 195"`), `data-part="eyes"`, `aria-hidden`, `focusable="false"`: import the exported constants from `@/components/RobotEyes` and the visor numbers from `./visor`; recompute the pixel sizes exactly as `RobotEyes.tsx` does (eye width, height, spacing, vertical offset, arc width and path, clip rectangle inset by `CLIP_INSET` with corner radius from `VISOR_RADIUS`, placement `translate(cx cy) rotate(angle)`); draw per eye an open pill and a happy arc (class names `eye-open` and `eye-happy`) inside the clipped, rotated group with the same static glow filter; use `useId` for the clip and filter ids.
- [X] T014 [US1] Complete `src/components/layout/preloader/Preloader.tsx`: inside `data-part="head"` render `next/image` of `/robot-head.png` (`width={241} height={195}`, `alt=""`, `priority`, class for responsive size `clamp(140px, 42vw, 200px)` wide, never above 241 px) with `<PreloaderEyes />` absolutely positioned over it (same box), then `<ChevronProgress />` below with a fixed gap. Centre the stack. Use `bg-white`.
- [X] T015 [US1] Add the timeline keyframes to `src/components/layout/preloader/preloader.css`, all within 1.2 s and starting when the overlay shows (`html[data-preloader="run"]`): `.eye-open` opacity 1, scale 1 to opacity 0, scale 0.7 at 0.30 to 0.50 s, back to opacity 1, scale 1 at 0.80 to 1.00 s; `.eye-happy` the inverse; chevron saffron window from 0% to 100% over 0 to 1.00 s with an ease; `[data-part="last-chevron"]` opacity 0 to 0.7 to 0 with a small scale pulse at 1.00 to 1.20 s; `transform-box: fill-box; transform-origin: center` for the eye layers. Only `transform` and `opacity`. Use `animation-fill-mode: both`.
- [X] T016 [US1] Create `scripts/preloader-check.mjs` (Playwright, same style as `scripts/footer-check.mjs`) with a `frames` section: load `/` in a fresh context at 390x844 and 1440x900, immediately pause every animation under `#preloader` (`document.getAnimations()`) and set `currentTime` to fixed values to capture to `shots/preloader/`: eyes normal at 0.15 s, eyes happy at 0.65 s, eyes normal at 1.10 s; chevron bar at 0 s (0%), 0.55 s (about 50%) and 1.10 s (100%). Also assert, by sampling the eye element's bounding box against the visor outline, that the eyes stay inside the visor at 360, 390, 768 and 1440 wide (add a `?preloader-debug` outline only inside the script by drawing the measured visor rectangle over a screenshot, no source change).
- [X] T017 [US1] Run `node scripts/preloader-check.mjs frames`; look at all captured images (three expressions, three chevron states, both widths) and confirm: no text anywhere, head not stretched, eyes inside the visor and matching its level angle, saffron fills left to right with a soft edge, last chevron brightens. Run lint, tsc and build.

**Checkpoint**: US1 works alone: a first visit shows the full sequence once.

---

## Phase 4: User Story 2 - The preloader never slows the site down (Priority: P1)

**Goal**: early finish when the page has loaded, hard 1.5 s limit, 300 ms fade, no layout shift, no delay to the hero.
**Independent Test**: time the overlay on a fast load and on a throttled network.

- [X] T018 [US2] Extend `initPreloader()` in `src/components/layout/preloader/init.ts`: on window `load`, if `data-preloader` is `run`, get the overlay's running animations (`document.getElementById("preloader").getAnimations({ subtree: true })`), compute the elapsed time from the first animation's `currentTime`, set `updatePlaybackRate` so the remaining sequence finishes in about 100 ms (rate at least 1), wait for them to finish (or 150 ms), then set `data-preloader="leave"`. If `load` already fired when the script runs, treat it as ready immediately. Wrap every step in `try/catch` so an error never throws and never leaves the overlay stuck.
- [X] T019 [US2] In `init.ts` add: on the end of the fade (`animationend` on the overlay for the `leave` animation) set `data-preloader="done"`; a backup timer at 1600 ms that forces `done`; and a `pageshow` listener that sets `done` when `event.persisted` is true.
- [X] T020 [US2] In `preloader.css` add the leave and fail-safe rules: `html[data-preloader="run"] #preloader` runs a fade-out animation (opacity 1 to 0, 300 ms) with a delay of 1200 ms and `forwards` (the CSS-only hard maximum, independent of JavaScript; built with a 1.1 s delay, not 1.2 s, to leave 0.1 s of margin for animation start latency on a busy page); `html[data-preloader="leave"] #preloader` runs the same fade with no delay; `done` stays hidden. Use `visibility: hidden` at the end of the fade so it cannot intercept anything. No `will-change` left on after the fade.
- [X] T021 [US2] Add a `timing` section to `scripts/preloader-check.mjs`: (a) on a throttled network (CDP `Network.emulateNetworkConditions`, high latency) measure the time from the first frame with `data-preloader="run"` to `display: none` or opacity 0 and require 1.5 s or less (allow 100 ms of measurement slack); (b) on a fast local load, measure the time from the `load` event to the overlay being gone and require 400 ms or less; (c) a `layout-shift` `PerformanceObserver` across the fade must sum to 0; (d) a `largest-contentful-paint` observer: the final LCP element must not be an `img` whose `src` contains `robot-head`; (e) record when the hero heading first paints with and without the overlay (the `preloader` state forced to never run in the second case through the skip override) and require no later than the other within 150 ms.
- [X] T022 [US2] Run `node scripts/preloader-check.mjs timing` against a fresh production build with a verified-free port; fix anything failing. Also confirm in the page that clicking or tapping through the overlay works (`pointer-events: none`) and the hero content is interactive while it fades.

**Checkpoint**: US2 works alone and the hard limits hold.

**Added at the owner's request during this phase**: a review-only preview mode, `?preloader-preview[=seconds]` (default 10 s), implemented in `init.ts` and `preloader.css` (`--pl-seq`) and covered by `scripts/preloader-check.mjs preview` (9 checks). It stretches the sequence and turns off the early finish; production timing is unchanged.

---

## Phase 5: User Story 3 - It stays out of the way when it should (Priority: P2)

**Goal**: skip entirely, with no flash, in every skip case.
**Independent Test**: second load in a session, reduced motion, slow connection or data saver, blocked storage, no scripting.

- [X] T023 [US3] Extend `initPreloader()` in `init.ts` to evaluate skip rules before setting `run`: skip if `sessionStorage.getItem("tareeq:preloader-seen")` is set; skip if reading or writing throws; skip if `matchMedia("(prefers-reduced-motion: reduce)").matches`; skip if `navigator.connection` exists and (`saveData` is true or `effectiveType` is one of `slow-2g`, `2g`, `3g`); ignore the connection rule if the API is missing. When showing, write the flag (`"1"`) first, then set `run`. Keep the slow-type list in one constant at the top of the file. Skipping means leaving `data-preloader` unset.
- [X] T024 [US3] Add a `skip` section to `scripts/preloader-check.mjs` covering: second page load in the same session (and a reload); reduced motion (`reducedMotion: "reduce"`); `saveData: true` and `effectiveType` of `2g` and `3g` (injected with `addInitScript` before load); storage blocked (override `Storage.prototype.getItem` and `setItem` to throw); JavaScript disabled (`javaScriptEnabled: false`: page visible, no white cover); API missing (delete `navigator.connection`: preloader shows); a first load on a deep link (`/about`) shows it. In every skip case record `getComputedStyle(#preloader).display` and `opacity` on every animation frame from the first frame until `load` (via an `addInitScript` `requestAnimationFrame` loop) and require it was never visible.
- [X] T025 [US3] Run `node scripts/preloader-check.mjs skip`; fix anything failing; confirm no hydration warnings and no console errors in any case.

**Checkpoint**: US3 works alone: every skip case is flash-free.

**Further changes (owner, 2026-11-01)**: the preloader now shows on every load and refresh (`oncePerSession: false`), the eye swaps are quick and clean (about 0.2 s, no overlap), and two expressions were added (Curious and Wink) for a seven-step sequence. Checks: `frames` 47, `skip` 28, `preview` 11.

**Change of direction (owner, 2026-10-31)**: the preloader now stays on screen for at least 6 seconds. The sequence is 6 s (`--pl-seq` in `preloader.css`, `sequenceMs` in `init.ts`), the early finish from T018 is switched off (`earlyFinish: false`; one switch to turn it back on), and the CSS fade starts at 5.9 s (over by 6.2 s). The Phase 4 checks were updated: "gone within 400 ms of load" became "stays 6 to 6.5 s even though the page loaded early". The skip rules from this phase are unchanged and matter more now. T030 (after-numbers) must be taken on the final build.

---

## Phase 6: User Story 4 - Safe for assistive technology and keyboards (Priority: P2)

**Goal**: not announced, never focused, never trapping.
**Independent Test**: accessibility snapshot and keyboard walk during the overlay.

- [X] T026 [US4] Add an `a11y` section to `scripts/preloader-check.mjs`: with the overlay visible, assert `#preloader` has `aria-hidden="true"`, contains no focusable elements (links, buttons, inputs, `[tabindex]`), has `pointer-events: none`; the Playwright accessibility snapshot contains nothing from the overlay; pressing Tab from the very start reaches the skip link first and the focus order afterwards matches the same page with the preloader skipped; `document.activeElement` is unchanged across the fade.
- [X] T027 [US4] Run `node scripts/preloader-check.mjs a11y`; fix anything failing.

**Checkpoint**: US4 works alone.

---

## Phase 7: Polish and cross-cutting

- [X] T028 Bundle check: after a production build, confirm the hero's eye component code is not shipped in the layout's shared JavaScript for `/about` (search the built chunks listed for `/about` for strings that exist only in `RobotEyes.tsx`, for example `eyes-debug`). If it is, stop and report to the user before changing anything (the fallback is moving the constants to a plain file, which needs approval).
- [X] T029 Run the full regression suite on a fresh production build: `menu-check`, `desktop-check`, `pages-check`, `whatsapp-check`, `footer-check`, `polish-check` (the preloader must not break any of them; set the skip override or use a context that has already seen the preloader where a test needs the page ready immediately), plus `hero-snapshot` and `hero-compare` against `shots/hero-pre-export` for the final hero proof
- [X] T030 Take the **after** Lighthouse numbers: five mobile runs on the home page of the final build, with no skip override and no flag set (fresh context each run); add each run's Performance, LCP, TBT and LCP element, plus median and range, to `specs/002-brand-preloader/baseline.md` next to the before numbers, and state whether the after median is within the before range
- [X] T031 Check `npm run lint`, `npx tsc --noEmit` and `npm run build` are clean after clearing `.next` with no server running; stop all servers; confirm the port is free
- [X] T032 Update this file's checkboxes, write the prompt record for the implementation phases under `history/prompts/002-brand-preloader/`, and report to the user: before and after Lighthouse numbers, the screenshots in `shots/preloader/`, the skip-case results, layout shift, the bundle check, and the hero proof. Ask the user to view it on a real phone and whether to commit. Do not commit without being asked.

---

## Dependencies and execution order

- Phase 1 then Phase 2 (blocking). T005 must pass before any later phase.
- Within Phase 2: T006 and T007 can run in parallel; T008 to T010 follow; T011 ends the phase.
- US1 (Phase 3) first: it provides the visible overlay that the other stories test.
- US2 (Phase 4) and US3 (Phase 5) both extend `init.ts`, so do them in sequence (US2 then US3) to avoid conflicting edits. US3's skip rules do not depend on US2's timing code.
- US4 (Phase 6) needs US1 only for something to inspect, but is best run last of the stories because it checks the finished behaviour.
- Polish needs all stories. US1 alone is **not** releasable: it has no early finish (US2) and no skip rules (US3).

## Parallel opportunities

- T006 and T007 (Phase 2).
- T012 and T013 (Phase 3; different files).
- Nothing else in `init.ts` or `preloader.css` is safe to parallelise.

## Implementation strategy

- **First usable slice**: Phases 1 to 4 (US1 + US2): the animation with the timing guarantees. Stop and look at it in a browser at 390 and 1440 before continuing.
- **Then** US3 (skip cases) and US4 (accessibility), verifying after each.
- **Finally** Polish: bundle check, regression, Lighthouse after, and the report. Performance is judged against the before numbers from T003, not against 90.

## Summary

- Total tasks: 32
- Per phase: Setup 3, Foundational 8, US1 6, US2 5, US3 3, US4 2, Polish 5
- Independent test per story: US1 fresh-session sequence; US2 timing on fast and throttled loads, zero layout shift; US3 flash-free skip in every case; US4 no announcement and no focus in the overlay.

## Outcome notes for the Polish phase (2026-11-01)

- **T028**: the bundle check found the hero eye component in every page's JavaScript. Reported to the owner, who approved moving the constants to a plain file; fixed and re-verified.
- **T029**: 119 preloader checks (smoke 8, frames 47, timing 11, preview 11, skip 28, a11y 14) and 435 existing checks all pass; hero identical to its pre-preloader baseline.
- **T030**: final Lighthouse recorded in `baseline.md` (Performance median 90 against 92 before; rule met).
- **T031**: `.next` cleared with no server running; `npx tsc --noEmit`, `npm run lint` and `npm run build` clean.
- **T032**: final report given to the owner; nothing committed.
