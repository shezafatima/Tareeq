# Implementation Plan: Brand Preloader

> **Update 2026-11-01 (owner decisions): the preloader shows on every load and refresh (once-per-session kept behind the `oncePerSession` switch, off), and the eye sequence is now seven steps: Normal, Happy, Normal, Curious, Normal, Wink, Normal, each change a clean 0.2 s swap. Timeline in `preloader.css`.**
>
> **Update 2026-10-31 (owner decision): the preloader now stays on screen for a full 6 seconds on a first visit.** The sequence is 6 s, the early finish is off (one switch, `earlyFinish`), the CSS fade starts at 5.9 s and is over by 6.2 s, and the review-only preview mode remains. Where this plan below says 1.2 s, 1.5 s, "never delays content" or describes the early finish, the 6 s behaviour applies; the skip rules, the CSS-timeline design and everything else are unchanged. The original 1.2 s / 1.5 s numbers are kept below as the design history.

**Branch**: `002-brand-preloader` | **Date**: 2026-10-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-brand-preloader/spec.md`

## Summary

A full-screen white overlay with the robot head, code-drawn eyes and a chevron progress bar, shown once per browser session. The timeline runs in **CSS** (transform and opacity only), so it starts at first paint and does not wait for React to hydrate. A tiny **inline script**, run before the first paint, decides whether to show it, sets one state attribute on `<html>`, ends it early when the page has loaded (by speeding up the running animations), and enforces the hard maximum. The overlay markup is a Server Component; the only client component is the eyes, because it reuses constants exported from the hero's client-side eye file. No new dependencies, and Framer Motion is not needed by the preloader.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router), already installed
**Primary Dependencies**: none added. Uses `next/image`, plain CSS keyframes and SVG. Framer Motion stays for the hero and the mobile nav only.
**Storage**: one `sessionStorage` key (`tareeq:preloader-seen` = `"1"`), no personal data
**Testing**: Playwright scripts (`@playwright/test` already installed), plus Lighthouse through `npx`. New script: `scripts/preloader-check.mjs`.
**Target Platform**: Vercel, mobile-first browsers
**Project Type**: Web (single Next.js app)
**Performance Goals**: mobile Lighthouse on the home page no worse than today within noise (baseline about 75, runs 66 to 82; measure 5 runs before and after); LCP element is never the head image; zero layout shift on fade-out
**Constraints**: on screen at most 1.5 s (sequence 1.2 s + fade 0.3 s); animate only transform and opacity; no animated blur; `aria-hidden`; no focus trap; no flash in skip cases; hero unchanged
**Scale/Scope**: 1 overlay, 1 inline script, 1 client leaf, about 6 small files, 1 export-only edit to a hero file

## Constitution Check

*GATE: passes before Phase 0 and re-checked after Phase 1 design.*

| Principle | Status | How the plan meets it |
|---|---|---|
| I Mobile-first | Pass | Head width is a clamp from a phone size up; the overlay is `position: fixed` and cannot cause scroll; tested at 360, 390, 768, 1440 |
| II Reusable components | Pass | Split into `Preloader`, `PreloaderEyes`, `ChevronProgress`, `PreloaderScript`; lives in `components/layout/preloader/` (it is part of the shell) |
| III One brand system | Pass | Overlay is white; chevrons use `var(--color-midnight)` and `var(--color-saffron)`; the eye colour is the hero's exported constant. No hex values in the new files |
| IV Accessible | Pass | `aria-hidden`, `pointer-events: none`, no focusable children; reduced motion skips it (script) and hides it (CSS safeguard) |
| V Protect data | Pass | Only a boolean session flag; nothing personal stored or logged |
| VI Fast on a cheap phone | Pass, to be measured | Transform and opacity only; CSS timeline (no hydration wait); one small `next/image` with explicit size; LCP and TBT compared before and after |
| VII Small, verified steps | Pass | Tasks end each milestone with build, lint, and a look at 390 and 1440 |
| VIII Don't touch the hero | Pass (approved) | Only `export` keywords added to `RobotEyes.tsx`; proven with `hero-snapshot` / `hero-compare` |
| IX No surprise dependencies | Pass | None added |
| X Safest option | Pass | Ambiguities were asked first; defaults are conservative (skip when storage is unavailable) |
| XI Server Components by default | Pass | The whole preloader is Server Components: overlay, eyes and chevrons. There is no client component at all; the page logic is one inline script (updated 2026-11-01: `PreloaderEyes` stopped being a client component once the shared eye constants moved to a plain file) |

**Update 2026-11-01**: `PreloaderEyes` was a client component only because it imported its constants from `RobotEyes.tsx`, a `"use client"` file; that import also shipped the hero's eye component to every page. The 11 shared constants now live in the plain file `src/components/eyeConstants.ts`, imported by both, so the preloader has no client component.

## Key Decisions

1. **CSS timeline, not Framer Motion.** The sequence is keyframes on opacity and scale (the same pill-to-arc technique the hero uses), so it needs no JavaScript to run and cannot be delayed by hydration. Alternative rejected: a Framer Motion timeline, which would only start after hydration and add work on the main thread.
2. **Inline script before first paint** decides skip, sets `data-preloader` on `<html>`, handles early finish, and cleans up. Written as a normal typed function and serialised into the script, so it is type-checked. Alternative rejected: a client component doing this after hydration, which would flash the overlay in skip cases.
3. **Hide by default in CSS.** Without JavaScript the overlay never shows (no stuck white cover). The script turns it on.
4. **Hard maximum by CSS.** A CSS animation starts fading the overlay out at 1.1 s regardless of JavaScript (done by 1.4 s), so 1.5 s is guaranteed even if the script or the page stalls. It starts at 1.1 s, not 1.2 s, because on a throttled, busy page the animation clock can start about 170 ms after the overlay is first drawn; measured.
5. **Early finish by speeding up, not cutting.** When the page has loaded, the script sets the running animations' playback rate so the rest of the sequence completes in about 100 ms (eyes settle on normal, chevrons fill, last chevron brightens), then fades (300 ms). Total about 400 ms after "ready".
6. **"Page ready" = the window `load` event** (all initial resources, including fonts and the above-the-fold images, are in). No minimum display time, per the spec.
7. **Slow connection** = `effectiveType` of `slow-2g`, `2g` or `3g`, or `saveData`. Showing on 3g would put a branded cover over the slowest users of the target audience.
8. **Reuse of the hero's eye logic by exporting its constants** (approved). Visor numbers for the head image are measured separately in `visor.ts`.
9. **Review-only preview mode.** `?preloader-preview` (10 s) or `?preloader-preview=15` stretches the whole sequence (one CSS variable, `--pl-seq`) and turns off the early finish, so the animation can be watched properly. Added at the owner's request because on a fast connection the real animation ends in well under a second. Normal visits never have the parameter; production timing is unchanged.
10. **State lives on `<html>`** (`data-preloader`), never on React-owned nodes, so React hydration never sees a changed or missing node. `<html>` gets `suppressHydrationWarning`.

## Timeline (seconds from when the overlay first shows)

| Time | Eyes | Chevron bar |
|---|---|---|
| 0.00 to 0.30 | Normal open | Filling from 0% |
| 0.30 to 0.50 | Morph to happy (opacity and scale, 0.2 s like the hero) | About 30% to 50% |
| 0.50 to 0.80 | Happy (hold) | About 50% to 80% |
| 0.80 to 1.00 | Morph back to normal | 80% to 100% |
| 1.00 to 1.20 | Normal open (settle) | 100%; last chevron brightens |
| 1.10 to 1.40 | Overlay fades out (300 ms), started by CSS on its own; the sequence finishes underneath it. The 0.1 s margin absorbs the animation starting a little after the overlay is first drawn on a busy page, so the overlay is on screen 1.5 s at most. | |

## Project Structure

### Documentation (this feature)

```text
specs/002-brand-preloader/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── preloader.md
├── checklists/requirements.md
└── tasks.md              # created later by /sp.tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                           # edit: suppressHydrationWarning on <html>
│   └── (site)/layout.tsx                    # edit: render <PreloaderScript /> then <Preloader /> first
├── components/
│   ├── eyeConstants.ts                      # new: the 11 shared eye constants (plain file)
│   ├── RobotEyes.tsx                        # edit: imports those constants instead of declaring them (values unchanged)
│   └── layout/preloader/
│       ├── Preloader.tsx                    # server: fixed overlay, head Image, eyes, chevrons
│       ├── PreloaderEyes.tsx                # server: SVG eyes from the shared constants (src/components/eyeConstants.ts)
│       ├── ChevronProgress.tsx              # server: navy base row + saffron revealed row
│       ├── PreloaderScript.tsx              # server: renders the inline script
│       ├── init.ts                          # the typed function serialised into the script + timing constants
│       ├── visor.ts                         # visor numbers measured from robot-head.png
│       └── preloader.css                    # state rules and keyframes (uses design tokens)
└── ...
public/robot-head.png                        # existing; not modified
scripts/preloader-check.mjs                  # new: skip cases, timing, frames, CLS, LCP, focus
```

**Structure Decision**: one folder under `components/layout/preloader/`, because the preloader is part of the site shell. It is mounted only in the `(site)` layout, so `/gradient-demo` is unaffected.

## Verification Plan

- Lint, type-check and build clean at every milestone.
- **Skip cases** (Playwright): second page load in a session, reduced motion, `saveData` and `2g`/`3g` (injected `navigator.connection`), storage blocked, no JavaScript. In each, a frame-by-frame capture shows no preloader frame.
- **Timing**: on-screen time is at most 1.5 s on a deliberately throttled network; with a fast load it is gone within 400 ms of `load`.
- **Frames**: animations paused at fixed times for deterministic screenshots of the three expressions and the chevron bar at 0%, 50% and 100%, at 390 and 1440.
- **Eye alignment**: overlay check at 360, 390, 768 and 1440 (eyes inside the visor, debug outline).
- **Layout shift** during fade-out via a `layout-shift` observer (expect 0).
- **LCP element** is not the head image (Lighthouse and `PerformanceObserver`).
- **Hero unchanged**: `hero-snapshot` and `hero-compare` before and after the export-only edit.
- **Accessibility**: no focusable elements inside the overlay, `aria-hidden`, Tab order unchanged.
- **Lighthouse mobile, home page, 5 runs before (current commit) and 5 after**, reported as median and range for Performance, LCP and TBT. Also check the layout bundle for accidental inclusion of the hero's eye component.

## Risks

1. **Hero eye module pulled into every page's bundle** by importing its constants. **Happened and fixed (2026-11-01, with the owner's approval)** by moving the constants into a plain shared file; verified in the built JavaScript.
2. **Serialising a function into the inline script** could be altered by the build tooling. Keep the function to plain ES2020 with no imports, test it in dev and production builds, and fall back to a hand-written string if needed.
3. **Very fast loads make the preloader a short flash** because there is no minimum display time (spec decision). The first paint already shows it, so the visible time is the time to `load`. Flagged for your call after you see it on a real phone.

## Complexity Tracking

No constitution violations to justify.
