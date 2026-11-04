# Implementation Plan: "How it works" Section With Card Hand-off and Carousel

**Branch**: `007-how-it-works-section` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/007-how-it-works-section/spec.md` (with the four clarifications of 2026-11-04)

## Summary

"How it works" stays the first section after the hero, but its behaviour changes: **the hero robot no longer moves**. The section gets its own robot image (`/how-it-works.png`) that breathes, and **only the three hero cards travel** into a one-card-at-a-time carousel, settling with a short spring. Feature 005's robot travel, pinned robot and coverflow are removed.

The approach reuses what feature 005 got right and removes what it no longer needs:
- **Keep**: the owner-approved twin hand-off (ADR-0001), done for the cards only, so `Hero.tsx` is never edited; CSS-decided layout modes before first paint; the server-rendered cards with a thin client controller.
- **Replace**: the sticky runway and the coverflow with a normal-flow section and a one-card stack; the 4-second timer with the owner's 5-second rules; the robot twin with a lazy `next/image` robot that breathes.
- **Add**: flip cards (front: number, name, one line; back: one example), swipe by pointer events, and one typed content file.
- **Delete**: the robot twin, `RobotFigure*`, the two extra robot images, the coverflow and sticky CSS, `robot-travel-check.mjs`, `data/steps.ts`, and 005's edit to `RobotEyes.tsx`.

No new dependency. Framer Motion (already loaded by the hero) drives the travel spring and the breathing.

## Technical Context

**Language/Version**: TypeScript 5.9, Node 24, Next.js 16.4.3 App Router, React 19.3
**Primary Dependencies**: existing only: next, react, framer-motion 14.7.1, tailwindcss 4, clsx, tailwind-merge. **No new packages.**
**Storage**: none (content in a typed file; in-page state only)
**Testing**: Playwright scripts in `scripts/` (project convention): new `how-it-works-check.mjs` replaces `robot-travel-check.mjs`; existing `polish-token-check.mjs` guards the hero hash; Lighthouse via one-off `npx` (as in feature 005)
**Target Platform**: Vercel; mobile-first browsers from 360px; the travel runs from 768px with motion allowed
**Project Type**: single Next.js web app (`src/`)
**Performance Goals**: hero LCP and hero fit unchanged; home Lighthouse mobile median at least 90 (feature 005 baseline: 91) with 100 accessibility; zero layout shift from the section; JS added by the section kept small (it replaces 005's larger travel and robot code, so total JS should not grow)
**Constraints**: only `transform` and `opacity` animate; section height reserved from first paint; hero files byte-identical; brand tokens only; the robot image never mirrored; no horizontal scroll from 360px
**Scale/Scope**: one section, three cards, about 8 new or rewritten files, about 10 deleted

## Constitution Check

*GATE: checked before Phase 0 and again after Phase 1. Result: **PASS**, with one item for the owner (⚠ VIII).*

| # | Principle | How this plan complies |
|---|---|---|
| I | Mobile-first, always | Stacked layout designed at 360px first, two columns from 1024px; 44px controls (dots, buttons, example button); no horizontal scroll checked at 360, 390, 768, 1024, 1440 |
| II | Everything is a reusable component | Small single-purpose parts: `HowItWorks` (server), `CarouselCard` (server), `StepCarousel`, `TravelStage`, `BreathingRobot` (client leaves); step icons reused (`StepIcon`); reveal reused (`Reveal`); no page-sized file |
| III | One brand system | Brand tokens only. The glow is a radial gradient of the existing saffron and blue tokens at low opacity (decoration, never text); Sora and Inter; the section keeps its existing soft background |
| IV | Accessible by default | Carousel `region` with slide groups and labels; keyboard (arrows, Enter, Space) and visible focus; 44px targets; hidden elements are `inert` and `aria-hidden` so focus never lands on an invisible one; auto-advance never announced; decorative parts hidden from assistive technology; all content readable without animation or scripts |
| V | Protect people's data | Not applicable (no data collected, nothing stored) |
| VI | Fast on a cheap phone | Server-rendered section; image via `next/image` with explicit size and `sizes`, lazy; only `transform` and `opacity`; breathing and auto-advance stop off screen; client leaves only; no new JS dependency; hero LCP element untouched; baseline and comparison recorded |
| VII | Small, verified steps | Milestones below each end with lint, build and a real-browser check at 390 and 1440 (and 768 for the travel) |
| ⚠ VIII | Don't touch what is finished | **Hero impact statement**: `Hero.tsx`, the preloader files and the other protected files are not edited and keep their SHA-256 hashes (checked by `polish-token-check.mjs`). The only runtime effect on the hero is that, while the page is scrolled, its three card wrappers are hidden and inert (`visibility: hidden`, `inert`, `aria-hidden`) and restored exactly at the top, under the binding conditions of ADR-0001. The hero robot is never touched. Feature 005's edit to `RobotEyes.tsx` is **reverted** (R9), so the hero returns closer to its finished state. Owner to approve this impact statement |
| IX | No surprise dependencies | None added. Framer Motion is already in the stack and loaded by the hero |
| X | When unsure, ask or choose the safest option | Four owner clarifications recorded; the rest are conservative defaults written in the spec; placeholder wording marked DRAFT; nothing presented as a real claim |
| XI | Server Components by default, client at the leaves | `HowItWorks` and `CarouselCard` are Server Components with all text in the HTML. Client code is limited to `TravelStage` (scroll and hand-off), `StepCarousel` (timer, swipe, keys, flip) and `BreathingRobot`, taking the server-rendered cards as `children`. No client copy of any markup |

**Post-design re-check (after Phase 1)**: still PASS. The design adds no hero edits and no dependency; the deletions leave the hero more finished than today.

## Project Structure

### Documentation (this feature)

```text
specs/007-how-it-works-section/
├── spec.md
├── plan.md                  # this file
├── research.md              # R1–R11 decisions
├── data-model.md            # content file shape and in-page state
├── quickstart.md            # how to run and verify
├── contracts/
│   ├── travel-stage.md      # the card hand-off
│   └── carousel.md          # carousel, flip and auto-advance rules
├── checklists/requirements.md
└── tasks.md                 # /sp.tasks (not created here)
```

### Source Code

```text
src/
├── content/
│   ├── how-it-works.ts                         # NEW  all section copy (DRAFT), the owner's named file
│   ├── index.ts                                # EDIT add getHowItWorks(); remove getSteps()
│   ├── types.ts                                # EDIT add HowItWorksContent, HowStep; remove Step and HomeCopy.howItWorks
│   └── data/
│       ├── steps.ts                            # DELETE  (replaced by how-it-works.ts)
│       └── cta.ts                              # EDIT  remove homeCopy.howItWorks
├── components/
│   ├── Hero.tsx                                # NOT EDITED (hash-checked)
│   ├── RobotEyes.tsx                           # REVERT to the pre-005 version (R9; diff reviewed first)
│   ├── RobotFigure.tsx                         # DELETE
│   ├── RobotFigureLive.tsx                     # DELETE
│   └── sections/how-it-works/
│       ├── HowItWorks.tsx                      # REWRITE  server: heading block, robot, carousel (grid areas)
│       ├── CarouselCard.tsx                    # REWRITE  server: front, back, compact (hero-look) face
│       ├── StepCarousel.tsx                    # REWRITE  client: one-card stack, controls, swipe, keys, auto-advance rules, flip
│       ├── TravelStage.tsx                     # REWRITE  client: scroll progress, spring, hand-off (cards only)
│       ├── travel-context.ts                   # TRIM     cards only (no robot, no twin registration, no hovered card)
│       ├── BreathingRobot.tsx                  # NEW      client leaf: breathing and glow
│       ├── StepIcon.tsx                        # keep
│       └── TravellingRobot.tsx                 # DELETE
├── hooks/useLayoutMode.ts                      # EDIT  four modes: list, travel, phone, still
└── app/globals.css                             # EDIT  replace feature 005's section (runway, sticky stage, coverflow, robot) with the new layout modes
public/
├── how-it-works.png                            # ADD (already in the folder, untracked)
├── robot-chevron.png                           # DELETE
└── robot-noeyes-nochevron.png                  # DELETE
scripts/
├── how-it-works-check.mjs                      # NEW      Playwright checks (R10)
└── robot-travel-check.mjs                      # DELETE
history/adr/0002-…                              # SUGGESTED  (see below; not created without the owner's consent)
```

**Structure Decision**: single Next.js app, following existing conventions: copy under `src/content`, the section's parts under `src/components/sections/how-it-works/`, checks under `scripts/`. The file count goes down overall because the robot twin and its helpers are removed.

## Key Decisions

1. **Cards-only twin hand-off** (R1): the approved ADR-0001 mechanism without the robot half; the hero is read, never edited.
2. **CSS-decided modes and a reserved-height grid** (R2): four modes plus one column layout in CSS; all cards stacked in one grid cell so the height is known from the HTML.
3. **Scroll progress followed by a spring** (R3): continuous, reversible, with the owner's small overshoot, and no second animation to keep in sync.
4. **One-card stack with CSS transitions and pointer-event swipe** (R4): one mechanism for every mode and width; text server-rendered.
5. **Owner's pause rules, touch stops for good** (R5): written as an explicit list so each rule has a test.
6. **Flip with a real button** (R6): keyboard-operable without hiding the card's heading from screen readers.
7. **Breathing as a client leaf that stops off screen** (R7): Framer Motion, tokens only.
8. **One content file, old step content retired** (R8): a single place to review the wording.
9. **Revert, don't layer** (R9): delete the superseded robot code and revert 005's `RobotEyes.tsx` edit.

## Milestones (each ends with lint, build and a browser check at 390 and 1440)

0. **Baseline**: on a production build of this branch before any change, record Lighthouse mobile (5 runs on `/`), JS bytes, hero screenshots at 1440×900 and 390×844, and the hero hash check. *Check*: written to `specs/007-how-it-works-section/baseline.md`.
1. **Content and the static section**: content file and accessor; the new `HowItWorks` and `CarouselCard` markup and CSS grid layout; robot image; delete the robot twin and its files; revert `RobotEyes.tsx`. *Check*: `list` mode complete without JavaScript; layout at 360, 390, 768, 1024, 1440; hero hash unchanged.
2. **The carousel**: `StepCarousel` (one-card stack, dots, buttons, keys, swipe, auto-advance rules, flip) and the `phone` and `still` modes. *Check*: every pause rule, every control, flip by mouse, touch and keyboard; reduced motion.
3. **The hand-off**: `TravelStage` (progress, spring, hide and show, face swap, arrival). *Check*: frame-by-frame continuity, overshoot and settle time, reverse, load mid-page, resize across 768, tabbing mid-scroll, hero identical at the top.
4. **Breathing**: `BreathingRobot` and glow. *Check*: period, amplitude, paused off screen, still under reduced motion.
5. **Verification and close-out**: full check script, Lighthouse and JS comparison with the baseline, screenshots (1440×900, 390×844, 768×1024 and states), console clean, docs; then ask before merging.

## Risks

1. **A visible pop at the hand-off** (cards swap one frame off from the hero). *Guardrail*: the ADR-0001 conditions (twin placed from live hero geometry, same task swap) and screenshots on either side of the hand-off frame; any visible pop stops the work for reconsideration rather than shipping.
2. **Spring feel or overshoot too large or too floaty**. *Guardrail*: starting values (320 / 24) tuned against SC-003 and by eye; the check script measures overshoot and settle time.
3. **Tablet widths (768 to 1023)**: the longest travel, in the stacked layout. *Guardrail*: `ARRIVE_AT` is measured from the real slot position; checked at 768×1024.
4. **Reverting `RobotEyes.tsx` breaks something that grew to depend on 005's change**. *Guardrail*: review the diff and grep for users first; keep and name any part that is still needed.

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Twin cards instead of moving the real hero cards | The hero is signed off and its cards sit in clipped, parallax layers inside `Hero.tsx` | Editing the hero to let cards escape breaks Principle VIII and risks the finished layout |
| Content file at `src/content/how-it-works.ts`, outside `data/` | The owner named this path | Putting it under `data/` follows the folder convention but ignores the owner's instruction; it is still read through an accessor like all content |

## ADR suggestion

📋 Architectural decision detected: the card-only twin hand-off, the four CSS layout modes and the retirement of the robot travel (this supersedes parts of ADR-0001). Document reasoning and tradeoffs? Run `/sp.adr how-it-works-cards-handoff`. Not created without the owner's consent.
