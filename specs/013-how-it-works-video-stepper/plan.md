# Implementation Plan: How it works — Tablet Video Stepper

**Branch**: `013-how-it-works-video-stepper` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-how-it-works-video-stepper/spec.md`

## Summary

> Owner changes during implementation (order Learn, Prompt, Build; one-screen fit on desktop; centred heading; background vectors) are recorded in [baseline.md](./baseline.md) and spec FR-003, FR-006, FR-018, FR-019.

Replace the home "How it works" section (card carousel + breathing robot) with a tablet that plays three step videos in sequence, beside/above three synced step cards. The section stays a Server Component that renders the heading and layout; one client leaf (`VideoStepper`) owns playback state, the tablet screen, the cards, the progress bar and the visibility/reduced-motion rules. Videos are plain `<video>` elements stacked behind the supplied tablet frame image (`public/tablet-screen.png`, transparent screen) and cross-faded with opacity. No new libraries. Posters are small WebP stills generated once from the existing videos by a script that reuses Playwright and sharp, which the project already has. Research: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router), Tailwind 4 + plain CSS in `globals.css`
**Primary Dependencies**: existing only (`next/image`, `clsx`, `@phosphor-icons/react` for the check/play icons). `framer-motion` is NOT used by the new code. No new packages.
**Storage**: static files in `public/videos/how-it-works/`; step copy in `src/content/how-it-works.ts` (typed, read through `getHowItWorks()`)
**Testing**: `node --test` unit tests for the pure stepper logic (`tests/unit/`); a Playwright check script `scripts/how-it-works-check.mjs` (rewritten) for behaviour, layout, network order; Lighthouse back-to-back vs `main` as in features 005/007/008
**Target Platform**: mobile-first web (360px phones on slow connections, up to desktop); evergreen browsers
**Project Type**: single Next.js web app
**Performance Goals**: hero LCP and hero-time JS unchanged versus `main`; no video/poster request before the hero has rendered; Lighthouse mobile Performance does not drop versus the same-machine back-to-back run of `main` (target 90+, Principle VI)
**Constraints**: videos ≤ 3 MB each (current 1.5–1.65 MB), 720p max, no audio; animate only `transform`/`opacity`; no horizontal scroll at 360px; hero files untouched (Principle VIII)
**Scale/Scope**: 3 steps, 3 videos (~4.7 MB total, loaded lazily), 1 client component tree, ~6 files added, ~5 removed

## Constitution Check

*GATE: passes before research; re-checked after design (still passes).*

| Principle | Result | Notes |
|---|---|---|
| I Mobile-first | PASS | Designed at 360px: tablet full width, compact 3-up stepper; cards are 44px+ tap targets |
| II Reusable components | PASS | `TabletFrame` (image frame + screen slot), `StepCard`, `VideoStepper` (+ `useStepPlayback` hook), each single-purpose, in `components/sections/how-it-works/` |
| III Brand tokens | PASS | Only existing tokens (midnight/royal/saffron/soft/paper, Sora/Inter, radius/shadow/dur tokens). Saffron is used for the accent bar/border/ring, never as text on light |
| IV Accessible | PASS | Cards are real buttons in an ordered list, `aria-current="step"`, visible focus, check has a text alternative, play button labelled, decorative frame `aria-hidden`, video has no audio |
| V Data | N/A | No data collected |
| VI Fast | PASS (to be verified) | Below the fold; videos/posters load only near view and after hero render; `transform`/`opacity` only; poster layers via `next/image` lazy |
| VII Small verified steps | PASS | Milestones with build, lint, 390px/1440px visual check (see quickstart) |
| VIII Hero untouched | PASS | `Hero.tsx`, `RobotEyes.tsx`, hero CSS are not edited. Hero cards already stay in the hero (the old section never moved them). Guard: `scripts/polish-token-check.mjs` hash must still pass |
| IX No new deps | PASS | Playwright and sharp already installed; ffmpeg not required (files already under limit) |
| X Safe defaults | PASS | Step lines are marked draft placeholders; no invented stats |
| XI Server first | PASS | `HowItWorks` stays a Server Component; `"use client"` only on `VideoStepper` (state, effects, media events, IntersectionObserver, matchMedia). `TabletFrame` has no directive and is plain markup |

No violations; Complexity Tracking not needed.

## Findings that change the brief

1. **`RobotStage`, `BreathingRobot` and `content/robot-image.ts` are shared with "Why Tareeq"** (`WhyTareeq.tsx:6,9,35`). They are NOT deleted. Only "How it works" stops using them. Deleting would break another section.
2. **Hero already has no hand-off code.** `Hero.tsx` has not changed since feature 006; the travelling cards lived in the How-it-works client code and CSS. `data-hero-card` stays because `RobotEyes` and the hero's own tap handling use it. The hero is not edited.
3. **`JsFlagScript` / `html[data-js]` stay**: `WorkshopForm.tsx` and form CSS use them.
4. **A tablet frame asset now exists**: `public/tablet-screen.png` (612×408 PNG, transparent screen and background, robot hands holding a tablet). It is used per the brief instead of a CSS frame. Measured screen opening: x 92–517, y 30–305 (426×276 px, ratio 1.54), i.e. left 15.0%, right 15.5%, top 7.4%, bottom 25.0% of the image. Videos sit behind the image inside that opening, extended 0.5% under the bezel so no gap shows. The image is only 612px wide, so it is upscaled at desktop widths (~700px) and may look slightly soft; flagged for the owner to supply a 2× version (drop-in replacement, same file name and proportions).
5. **Posters do not exist and ffmpeg is not installed.** Generated with a small script using Playwright (already a dev dependency, Chromium installed) and sharp. No compression script is added because every video is under 3 MB; if a source turns out larger than 720p, the plan adds a `videos:compress` script then (see research R6).

## Project Structure

### Documentation (this feature)

```text
specs/013-how-it-works-video-stepper/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── video-stepper.md      # props, DOM/ARIA, events, states
│   └── content.md            # HowItWorksContent shape
└── tasks.md                  # /sp.tasks (not created here)
```

### Source Code (repository root)

```text
src/
├── content/
│   ├── how-it-works.ts                 # EDIT: new copy + video/poster paths (placeholder lines)
│   └── types.ts                        # EDIT: HowStep / HowItWorksContent
├── lib/
│   └── stepper.ts                      # NEW: pure logic (next index, completion, playback mode)
├── components/sections/how-it-works/
│   ├── HowItWorks.tsx                  # EDIT: server; heading + <VideoStepper>
│   ├── VideoStepper.tsx                # NEW: "use client" leaf (state, observers, media events)
│   ├── useStepPlayback.ts              # NEW: hook used only by VideoStepper
│   ├── StepCard.tsx                    # NEW: card button (number, name, title, line, check, progress)
│   ├── TabletFrame.tsx                 # NEW: frame image over a screen slot; pure markup (no hooks)
│   ├── CarouselCard.tsx                # DELETE
│   ├── StepCarousel.tsx                # DELETE
│   └── StepIcon.tsx                    # DELETE (only used by the carousel)
├── hooks/useLayoutMode.ts              # DELETE (only used by the carousel)
└── app/globals.css                     # EDIT: replace the `.hiw-*` block; keep `.robot-*` (Why Tareeq)

public/tablet-screen.png               # existing frame (untracked; commit with this feature)
public/videos/how-it-works/
├── prompt.mp4, build.mp4, learn.mp4    # existing (committed; already ≤ 1.65 MB)
└── prompt.webp, build.webp, learn.webp # NEW posters (first frame, ~20–40 KB each)

scripts/
├── make-how-it-works-posters.mjs       # NEW: Playwright + sharp, writes the posters
└── how-it-works-check.mjs              # REWRITE for the new behaviour

tests/unit/stepper.test.ts              # NEW
package.json                            # EDIT: "posters:how-it-works" script only
```

**Structure Decision**: single Next.js app; section-level components live in `components/sections/how-it-works/` (Principle II). Pure logic is split into `src/lib/stepper.ts` so it can be unit-tested with the existing `node --test` setup, since the browser behaviour cannot be.

## Design

### Server / client split
- `HowItWorks` (server, async): fetches content, renders `<section id="how-it-works" aria-labelledby>`, `SectionHeading`, and `<VideoStepper steps=… />` (serialisable props). Section background stays `bg-soft` as now ("existing background").
- `VideoStepper` (client): renders `TabletFrame` with three stacked layers per step (poster `<Image loading="lazy">` under a `<video>`) positioned in the frame's screen opening, the `<ol>` of `StepCard`s, and the play button (manual mode). The video layers need live refs, so they cannot arrive as server children; `TabletFrame` is plain markup with no hooks, so it can be used inside the client tree without duplicating anything.
- Without JavaScript or before hydration: poster of step 1 and all three cards render (manual mode look). No video requests.

### Playback state machine (`useStepPlayback`)
State: `active` (0–2), `completed` (derived: indices < active, reset on loop), `mode` (`auto` | `manual`), `inView`, `tabVisible`, `nearView`.
- **mode**: `manual` if `prefers-reduced-motion`, `Save-Data`, or a `play()` rejection (autoplay blocked); else `auto`. Read with `useSyncExternalStore`, server value `manual`.
- **nearView** (IntersectionObserver, rootMargin ≈ 100% viewport) AND `window` `load` has fired AND hero painted (`requestIdleCallback` after load) → videos get `preload="metadata"`. Before that: `preload="none"`, no `src` fetch for posters (lazy images).
- **inView** (IntersectionObserver threshold 0.35 on the tablet) AND `document.visibilityState === "visible"` → playing allowed. Leaving either condition → `pause()`; returning → `play()` from the same `currentTime`.
- **Advance**: `ended` on the active video → `active = (active+1) % 3`; the next video's `currentTime = 0`; `play()`; the card switch and the fade (opacity, 400 ms) are triggered in the same state update.
- **Preload next**: on `timeupdate` when `duration - currentTime < 3 s`, set the next video's `preload="auto"` once.
- **Select** (click/Enter/Space): same as advance but to the chosen index; rapid selects are safe because only `active` drives which layer is visible and other videos are paused.
- **Progress**: a `requestAnimationFrame` loop runs only while playing; it writes `transform: scaleX(currentTime/duration)` straight onto the active bar via a ref (no per-frame React render).
- **Failure**: `error` or no `playing` event within 8 s → show that step's poster, then advance after 4 s so the section never freezes.
- **Manual mode**: nothing plays on its own. Cards select a step (poster shown). The play button plays that step once; the card shows progress; at the end it stays on the last frame and the button returns. No auto-advance in manual mode.

### Layout (CSS, `globals.css`)
- Grid on `.hiw-stage`: one column below 1024px (heading, tablet, steps); from 1024px `grid-template-columns: minmax(0, 3fr) minmax(0, 2fr)` (tablet ≈ 60%) with steps stacked at the right and vertically centred.
- Steps below 1024px: three equal columns of buttons (number + name, each ≥ 44px tall). The active step's title, line and progress bar sit in a detail panel directly under the row, inside the same `<ol>` item grouping, with a fixed minimum height so nothing shifts or overflows at 360px. Each card is ~105px wide at 360px, too narrow for a line of copy, so this is the closest fit to "the active one shows its line and progress bar" (research R5; flagged for owner review).
- Active: saffron top/left accent bar, `translateY(-2px)` lift, opacity 1; inactive `opacity: 0.55`. Only transform/opacity change. Reduced motion: the site disables transitions globally, so state changes are instant.

### Assets
- Frame: `next/image` of `/tablet-screen.png` (612×408, `sizes="(min-width:1024px) 60vw, 100vw"`, lazy, `alt=""` because the robot and tablet are decoration; `pointer-events: none`) layered ABOVE the videos. Screen opening as CSS percentages: `inset: 7.4% 15.5% 25.0% 15.0%` (+0.5% under the bezel), small corner radius to match. Videos use `object-fit: cover` (final choice after the script reports their real aspect ratio).
- Videos stay where they are. Posters: `node scripts/make-how-it-works-posters.mjs` loads each video in headless Chromium, seeks to 0, grabs the frame, saves WebP (width ≤ 1280). Also prints each video's resolution and size (before/after report; this is where the 720p limit is checked).

## Risks

1. **LCP / Lighthouse regression** from a new client bundle or early media requests. Mitigation: lazy gating above, no `framer-motion` in the new code, back-to-back Lighthouse vs `main`, Playwright network assertion. Kill switch: revert to previous section commit.
2. **iOS/Safari autoplay and inline playback quirks** (muted + `playsInline` required; `play()` can reject). Mitigation: rejection falls back to manual mode with the play button.
3. **Low-resolution frame image** (612px wide, upscaled to ~700px at desktop). Mitigation: owner supplies a 2× file with the same name and proportions; the screen opening percentages above are the only values to re-measure.
4. **Sources larger than 720p** (unknown until the poster script runs). Mitigation: script reports resolution; if over, add the ffmpeg `videos:compress` script then, which needs ffmpeg installed.

📋 Architectural decision detected: one client stepper owning stacked `<video>` layers and the cards, with pure logic split into `lib/stepper.ts` — Document reasoning and tradeoffs? Run `/sp.adr how-it-works-video-stepper-architecture`
