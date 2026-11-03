# Implementation Plan: Robot Travels Into "How It Works" as a Carousel

**Branch**: `005-robot-travel-carousel` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-robot-travel-carousel/spec.md`

## Summary

"How it works" moves directly under the hero. On desktop, scrolling out of the hero carries the robot and its three cards into a **sticky stage** inside a tall (not pinned) "How it works" section: the robot settles on the left, the cards fan out into a coverflow carousel on the right. Below 1024px the section is a plain swipeable carousel; with reduced motion or no JavaScript it is a plain list. Feature 003's card travel is deleted.

Five ideas carry the design:

1. **Layout is decided by CSS before first paint, not by JavaScript after it.** A one-line inline script marks `<html data-js>`. CSS then picks the layout from `data-js`, the viewport width and `prefers-reduced-motion`: *travel* (≥1024px, motion allowed), *swipe* (<1024px, motion allowed) or *list* (no JavaScript, or reduced motion). Each layout reserves its own height from the first paint, so nothing reflows when the scripts arrive.
2. **A travelling twin, handed off invisibly.** The hero's robot and cards stay exactly where they are in the hero's own code. The section's sticky stage holds a second robot (same image, same eye component) and the three carousel cards. At scroll 0 these are invisible; from the first pixel of scroll the hero's robot and cards are hidden (an inline opacity set from outside, as feature 003 already did for the hero cards) and the stage's copies are shown at the hero items' live positions, then moved by `transform` to their places in the stage. This is the only way to keep the finished hero pixel-identical without restructuring it.
3. **Travel ends exactly when the stage starts sticking.** The stage is `position: sticky` inside a section that is taller than the screen (a reading "runway"). Travel progress runs from scroll 0 to the moment the stage reaches its sticky position; after that the robot and cards are at rest in the stage, which stays in view for the runway and releases at the section's end. All of it is plain scroll.
4. **The carousel only takes over on arrival.** While travelling, the three cards converge on the carousel's centre and their compact "hero" face crossfades to the full readable face. On arrival (with hysteresis) they fan out into coverflow positions with a CSS transition, and autoplay may start. Leaving reverses it. This keeps scroll-driven transforms and time-based transitions on separate elements so they never fight.
5. **The robot's eyes are reused, not re-created.** `RobotEyes` is used for the twin. One small, default-preserving option is added to it (which element counts as "the card" to look at), so the twin can look at carousel cards. "Looks toward the active card" is done by aiming the twin's own cursor input at the active card, so the eyes glance without switching to the happy expression; hovering or focusing a card gives the same happy reaction as in the hero.

6. **One reusable robot component with the image hardcoded** (owner request, 2026-11-02). `RobotFigure` (`src/components/RobotFigure.tsx`) owns the robot image itself: its source files, alt text, intrinsic size and `sizes` are fixed inside the component, never passed in. It takes only layout props (`className`, `priority`) and `eyes`:
   - `eyes="live"`: `robot-noeyes.png` plus the existing `RobotEyes` overlay (tracking, blink, happy), used for the travelling robot on desktop;
   - `eyes="painted"`: `robot.png`, the same robot with its eyes drawn in, fully static, used in the swipe and list layouts and with no JavaScript.
   The section uses `RobotFigure` everywhere it shows the robot; future pages can reuse it. The hero keeps its own robot code untouched (Principle VIII); `RobotFigure` mirrors its image settings so the hand-off is pixel-identical. Never mirrored: the component has no flip option.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router), all installed
**Primary Dependencies**: none added. `framer-motion` (already used by the hero) for the twin's motion values and the existing `RobotEyes`; CSS for layouts, coverflow and swipe (scroll snap)
**Storage**: none. Steps come from the existing content accessors
**Testing**: Playwright scripts in `scripts/`. New `robot-travel-check.mjs` replaces `transition-check.mjs`; `polish-reveal-check.mjs`, `home-check.mjs`, `pages-check.mjs`, the hero snapshot and compare, and the token guard are re-run and updated where they referenced feature 003. Lighthouse 5 runs on `/` before and after
**Target Platform**: Vercel; mobile-first browsers; travel only at ≥1024px
**Project Type**: Web (single Next.js app)
**Performance Goals**: home Performance no more than 3 points below the "before" median (noise about 5); CLS at or below 0.05; no long tasks added while scrolling the travel at 4x CPU slowdown compared with today
**Constraints**: hero pixel-identical at the top; robot never mirrored; transform and opacity only; no pinning; section height reserved from first paint; no new dependency
**Scale/Scope**: 1 section rewritten, about 6 new components and 1 hook, 1 inline flag script, 1 small option added to `RobotEyes.tsx`, feature 003's stage files and styles deleted

## Constitution Check

*GATE: passes before Phase 0 and re-checked after Phase 1 design.*

| Principle | Status | How the plan meets it |
|---|---|---|
| I Mobile-first | Pass | Below 1024px no travel; a swipe carousel at full width with 44px dots; list fallback; checked at 360 to 1920 |
| II Reusable components | Pass | `RobotFigure` (reusable robot with the image built in; live or painted eyes), `StepCarousel` (one component, three layouts by CSS), `TravelStage`, `CarouselCard`, `CarouselDots`; `StepIcon` and `RobotEyes` reused |
| III One brand system | Pass | Existing tokens, motion tokens from feature 004, the hero card's glass look for the compact face; no new colours or fonts |
| IV Accessible | Pass | Carousel follows the WAI pattern (region with a label, slide labels, previous/next and dot buttons, live region off while autoplaying); side cards `aria-hidden` and `inert`; autoplay pauses on hover and focus and stops on interaction; reduced motion shows the list |
| V Protect data | Pass | No data |
| VI Fast on a cheap phone | Pass, to be measured | Only transform and opacity; scroll handled by a passive listener (no per-frame measuring); the twin's eyes pause off screen (existing `RobotEyes` behaviour); travel code runs only at ≥1024px; Lighthouse before and after |
| VII Small, verified steps | Pass | Milestones each end with build, lint, the checks and screenshots at 390 and 1440 |
| VIII Don't touch the hero | **Approved 2026-11-02, with conditions** | See the hero impact statement and the owner's conditions below; ADR-0001. `Hero.tsx` is not edited |
| IX No surprise dependencies | Pass | None added; swipe uses native scroll snap |
| X Safest option | Pass | No new copy; robot never mirrored; the twin is an explicit, stated deviation from the spec's "same robot" assumption |
| XI Server Components by default | Pass | Section markup and step content are server-rendered and complete; client leaves: `TravelStage` (scroll position, measuring), `TravellingRobot` (eyes need motion values), `CarouselController` (autoplay, keys, swipe) with the cards passed in as server children |

### Hero impact statement (Principle VIII), approved 2026-11-02 with conditions (ADR-0001)

| Change | Where | Effect on the hero |
|---|---|---|
| While scrolled (desktop travel layout only), the hero's robot layer and its three card wrappers get `visibility: hidden`, `inert` and `aria-hidden` (owner fix: not opacity alone), all cleared at scroll 0 and when the layout changes | runtime only; `Hero.tsx` not edited | At the top of the page: none. From the first pixel of scroll the stage's identical copies are shown in the same places; the hidden originals are not focusable or announced |
| `RobotEyes.tsx` gains one optional prop, `cardElement(id)`, used to find the card to look at. Its default is today's `[data-hero-card=…]` lookup | `src/components/RobotEyes.tsx` | None: the hero passes nothing (approved as described) |
| `RobotEyes.tsx` pauses its frame loop (gaze and blink) while it is inside an `inert` element, and on resuming snaps its gaze to the current target and opens the eyes | `src/components/RobotEyes.tsx` | Needed by owner condition 3 (the hidden robot's eyes pause; no visible eye swing at the swap). At the top of the page the hero is never inert, so it behaves as now; proven by the hero compare |

**Owner conditions for the twin (binding, condition 3):** the twin appears at exactly the hero robot's position, size and rotation at the hand-off (no pop, jump or scale change); only one robot is visible at any time and the hidden one is not focusable or announced; the hidden robot's eye tracking and blink pause while hidden; the twin reuses the same image file and `sizes` (served from cache); screenshots on either side of the hand-off frame and one during it; **any visible pop stops the feature for reconsideration rather than shipping**. Known limit, stated to the owner: the hero's parallax springs live in `Hero.tsx` and cannot be paused without editing it; they compute only on pointer movement and paint nothing while the robot is hidden.

Spec deviation to note (approved): the spec assumes "the same robot, not a second copy". A literal move of the hero's robot element into the section would mean restructuring the finished hero (its robot sits inside clipped, parallax and entrance layers). The plan uses a visually identical twin with an invisible hand-off instead. If you would rather have the hero restructured, that is a much larger hero change and would need its own approval.

## Key Decisions

1. **CSS-decided layouts with a `data-js` flag** (inline script, before paint). Rejected: choosing the layout in React after hydration (the section's height would change on load, causing layout shift and a visible jump).
2. **Twin robot and cards with an invisible hand-off.** Start poses are read live from the hero's robot image and card elements (as feature 003 did for the cards), so the copies sit exactly on the originals at the moment of the swap. The twin's eyes are mounted from load so their gaze follows the same cursor input as the hero's; their blink timing is independent (a blink lasts 0.14 s, so a mismatch at the swap is not noticeable). Rejected: portalling or moving the hero's robot (hero rewrite); fading between the two (a ghosted double robot, the problem the owner flagged in feature 003).
3. **Sticky stage in a runway, travel ending at sticky engagement.** Runway: stage height = viewport minus header; section height = stage height plus 90% of the viewport (reading time for about three autoplay steps at typical scroll speed); tuned in implementation by screenshots. Travel range: scroll 0 to (stage's natural top minus the sticky top). Rejected: pinning (owner said no) and scroll-scrubbed carousel steps (not asked for).
4. **Card faces and coverflow on separate elements.** Outer element: scroll-driven travel transform (from the hero card's live pose to the carousel centre). Inner element: CSS coverflow pose by position (centre; left and right behind at scale 0.82, `rotateY` ±28° with perspective, opacity 0.55), transitioned over `--dur-reveal` on arrival and on every active change. Faces: compact face (the hero card's look) and full face crossfade over the last 35% of travel.
5. **Arrival hysteresis** as in feature 003: arrived at progress 1, left below 0.99. Autoplay runs only when arrived, in view, tab visible, not hovered, no focus inside, and never interacted.
6. **Swipe carousel below 1024px** uses a horizontal scroll-snap track (native swipe, momentum and snapping); autoplay scrolls the track; the first touch, wheel or key on it stops autoplay. Rejected: a custom drag handler (more code, worse feel).
7. **"Looks toward the active card"**: on each active change the twin's cursor input is set to the active card's centre (eyes glance, no happy expression). Real pointer movement takes over as usual. Hover and focus on a card set `activeCard` (happy plus look), with the new `cardElement` option pointing at the carousel card.
8. **Delete feature 003's stage**: `HowItWorksStage.tsx`, `StepCard.tsx`, `stage-context.ts`, the `.hiw-*` rules in `globals.css`, `scripts/transition-check.mjs`; `HowItWorks.tsx` rewritten; `StepIcon.tsx` kept. The token guard's protected list drops `how-it-works/`.
9. **Page order**: `How it works` then `Who it's for`; the hero's scroll cue targets `#how-it-works`.
10. **Mobile and list robot**: `RobotFigure eyes="painted"` (`public/robot.png`, the robot with painted eyes, already in the project), so the list and swipe layouts need no eye script. The travelling robot is `RobotFigure eyes="live"`.

Recorded as [ADR-0001: Twin Hand-off and CSS-Decided Layout Modes](../../history/adr/0001-twin-handoff-and-css-layout-modes.md).

## Project Structure

### Documentation (this feature)

```text
specs/005-robot-travel-carousel/
├── plan.md
├── research.md
├── data-model.md        # layout modes, travel progress, carousel state machine
├── quickstart.md
├── contracts/
│   ├── travel-stage.md  # modes, DOM, measuring, hand-off, timings, invariants
│   └── carousel.md      # states, controls, keyboard, swipe, a11y, timings
├── checklists/requirements.md
└── tasks.md             # /sp.tasks
```

### Source Code

```text
src/
├── app/
│   ├── layout.tsx                         # + inline data-js flag script
│   ├── globals.css                        # - .hiw-* rules; + layout modes, runway, coverflow, swipe track
│   └── (site)/page.tsx                    # order: Hero, HeroExtras, HowItWorks, WhoItsFor, ...
├── components/
│   ├── RobotFigure.tsx                    # NEW reusable robot: image hardcoded; eyes="live" | "painted"
│   ├── Hero.tsx                           # NOT EDITED
│   ├── RobotEyes.tsx                      # + optional cardElement(id) (approval)
│   └── sections/
│       ├── HeroExtras.tsx                 # cue -> #how-it-works
│       └── how-it-works/
│           ├── HowItWorks.tsx             # rewritten (server): section, runway, stage, list markup
│           ├── TravelStage.tsx            # client: progress, measuring, hand-off, arrival
│           ├── TravellingRobot.tsx        # client: positions RobotFigure eyes="live", feeds gaze input
│           ├── StepCarousel.tsx           # client controller: active, autoplay, keys, dots, swipe
│           ├── CarouselCard.tsx           # server: compact face + full face for one step
│           ├── CarouselDots.tsx           # client leaf (buttons)
│           ├── StepIcon.tsx               # kept
│           ├── HowItWorksStage.tsx        # DELETED
│           ├── StepCard.tsx               # DELETED
│           └── stage-context.ts           # DELETED
scripts/
├── robot-travel-check.mjs                 # new; replaces transition-check.mjs (deleted)
└── (home-check, polish-reveal-check, pages-check, polish-token-check updated)
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Inline opacity written onto the hero's robot layer and card wrappers from outside | Hand off to the travelling copies without editing the finished hero | Editing `Hero.tsx` to expose a hide prop or move the robot is a broader hero change |
| A second robot instance (twin) on desktop | Keeps the hero untouched while the robot appears to travel | Moving the real element needs a hero rewrite; noted as a spec deviation |
| Existing exception still applies: the reused Learn bulb icon animates `filter` and `fill` | The carousel's Learn card uses the hero's icon | Unchanged from features 003 and 004 |

## Risks (max 3)

1. **Visible seam at the hand-off** (robot or card not exactly on the original, eyes out of sync). Mitigation: live start poses, twin eyes mounted from load, a check that compares positions at 1px and 3px of scroll and a close-up screenshot.
2. **Runway length feels wrong** (too short to read, or too much empty scrolling). Mitigation: one constant, tuned with scroll-sequence screenshots; recorded in the contract.
3. **Performance** (a second eye loop, sticky stage, larger cards). Mitigation: eyes pause off screen, passive scroll listener, Lighthouse before and after; the idle cost of the hero itself is out of scope and unchanged.
