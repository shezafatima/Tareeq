# Implementation Plan: "Why Tareeq" Section and New Home Page Order

**Branch**: `008-why-tareeq-section` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/008-why-tareeq-section/spec.md`. This branch starts from feature 007's work-in-progress commit (`3cf04c9`) because the new section reuses its robot, cards and breathing.

## Summary

The home page order becomes Hero, Programs, Why Tareeq, How it works, Who it's for, Final call to action. "Why Tareeq" is rebuilt as laid out like "How it works" (owner decision after build: robot on the left, card on the right at 1024px and up): the robot standing on the straight light blue card with the tilted saffron card behind it, breathing, beside one navy card with white text holding the owner's four numbered points, each with a modern icon, framed by saffron vector decorations.

The plan:
- **Share, don't copy**: the robot-on-cards-breathing piece becomes one shared `RobotStage` used by both sections.
- **Simplify 007**: because "How it works" no longer sits under the hero, **the hero-to-section card travel is removed** (the owner left this decision to the plan). That also makes the hero completely untouched at runtime. This is the one decision for the owner to confirm; the working travel stays in git history (`3cf04c9`).
- **No new dependency**: four new inline icons in the site's own icon style, three small inline-SVG saffron motifs, and the existing Framer Motion breathing.
- **One place for the words**: `src/content/why-tareeq.ts`; the old principles are retired.

## Technical Context

**Language/Version**: TypeScript 5.9, Node 24, Next.js 16.4.3 App Router, React 19.3
**Primary Dependencies**: existing only: next, react, framer-motion 14.7.1, tailwindcss 4, clsx, tailwind-merge (mongoose, zod, resend are already in from 006 and not used here). **No new packages.**
**Storage**: none (content in a typed file)
**Testing**: Playwright scripts in `scripts/` (project convention): new `why-tareeq-check.mjs`; `how-it-works-check.mjs` trimmed; `polish-token-check.mjs` guards the hero; Lighthouse by one-off `npx`, compared back to back against a build of `main`
**Target Platform**: Vercel; mobile-first browsers from 360px
**Project Type**: single Next.js web app (`src/`)
**Performance Goals**: no regression on the home page (back-to-back Lighthouse within noise, accessibility 100, no layout shift from the section); one download of the robot image for both sections
**Constraints**: only `transform` and `opacity` animate; no new colours or dependencies; hero files byte-identical; the robot never mirrored; no sideways scroll from 360px
**Scale/Scope**: one new section, one shared piece, four icons, three motifs, about 10 files touched, about 8 files deleted

## Constitution Check

*GATE: checked before Phase 0 and again after Phase 1. Result: **PASS**.*

| # | Principle | How this plan complies |
|---|---|---|
| I | Mobile-first, always | Stacked layout designed at 360px first (heading, robot, navy card), two columns from 1024px; no sideways scroll checked at 360, 390, 768, 1024 and 1440; the navy card and its icons wrap cleanly |
| II | Everything is a reusable component | The robot-on-cards-breathing becomes one shared `RobotStage`; the icon tile gains a tone instead of a second tile component; the saffron motifs are small separate components; no page-sized file |
| III | One brand system | Midnight, white, saffron and the sky-based light blue only (all existing tokens; the light blue is a mix of the sky token and white); saffron is used as text only on the dark navy card (never on a light background); Sora and Inter |
| IV | Accessible by default | One `h2` and `h3` points inside an ordered list; decorations, icons, numbers and the cards behind the robot are `aria-hidden`; every text measured at AA contrast or better; nothing animates under reduced motion; the section needs no script to be read |
| V | Protect people's data | Not applicable (no data) |
| VI | Fast on a cheap phone | Server-rendered section; the robot image is lazy, has declared size and is shared (one request); only the breathing leaf is client code, and it stops off screen; only `transform` and `opacity`; removing the hand-off removes scroll-handler work from the home page |
| VII | Small, verified steps | Milestones below each end with lint, build and a browser check at 390 and 1440 |
| VIII | Don't touch what is finished | `Hero.tsx` and the other protected files are **not edited** and, because the hand-off is removed, **nothing reads or changes the hero at runtime** any more. The only neighbouring edit is the scroll cue's target in `HeroExtras.tsx` (a section after the hero, not the hero file). 007's `RobotEyes.tsx` revert stays |
| IX | No surprise dependencies | None added. Icons and illustrations are inline SVG in the site's own style; Framer Motion is already in the stack |
| X | When unsure, ask or choose the safest option | The owner decisions are recorded; the hand-off removal is flagged for confirmation and is reversible from git; non-owner wording (the intro) is marked DRAFT |
| XI | Server Components by default, client at the leaves | `WhyTareeq`, `RobotStage` and the accents are Server Components; the only client code is the existing `BreathingRobot` leaf. No client copy of any markup |

**Post-design re-check (after Phase 1)**: still PASS. The design adds no hero edit and no dependency, and deletes more than it adds.

## Project Structure

### Documentation (this feature)

```text
specs/008-why-tareeq-section/
├── spec.md
├── plan.md                  # this file
├── research.md              # R1–R10 decisions
├── data-model.md            # content shape and the shared image constant
├── quickstart.md            # how to run and verify
├── contracts/
│   ├── robot-stage.md       # the shared robot-on-cards-breathing piece
│   └── why-section.md       # markup, layout, navy card, decorations, page order
├── checklists/requirements.md
└── tasks.md                 # /sp.tasks (not created here)
```

### Source Code

```text
src/
├── content/
│   ├── why-tareeq.ts                          # NEW  heading, intro (DRAFT) and the four points
│   ├── robot-image.ts                         # NEW  the robot image constant used by both sections
│   ├── index.ts                               # EDIT add getWhyTareeq(); remove getPrinciples()
│   ├── types.ts                               # EDIT add WhyPoint, WhyTareeqContent; remove Principle and HomeCopy.why; HowItWorksContent loses image
│   ├── how-it-works.ts                        # EDIT use the shared robot image constant
│   └── data/
│       ├── principles.ts                      # DELETE
│       └── cta.ts                             # EDIT remove homeCopy.why
├── components/
│   ├── ui/
│   │   ├── RobotStage.tsx                     # NEW  server: the shared robot-on-cards piece
│   │   ├── BreathingRobot.tsx                 # MOVE from sections/how-it-works/ (client leaf, unchanged behaviour)
│   │   ├── IconTile.tsx                       # EDIT add tone "onDark"
│   │   └── icons.tsx                          # EDIT add hand, brain, users, shieldCheck
│   ├── sections/
│   │   ├── WhyTareeq.tsx                      # REWRITE  navy card, points, mirrored layout
│   │   ├── SaffronAccents.tsx                 # NEW  sparkle, dot grid and wavy line (inline SVG, decorative)
│   │   ├── ProgramsPreview.tsx                # EDIT id="programs" on its section
│   │   ├── HeroExtras.tsx                     # EDIT the scroll cue targets #programs
│   │   └── how-it-works/
│   │       ├── HowItWorks.tsx                 # EDIT use RobotStage; no TravelStage
│   │       ├── CarouselCard.tsx               # SIMPLIFY remove the travel wrapper and the hero-look face
│   │       ├── StepCarousel.tsx               # EDIT own the active-card state; no travel context
│   │       ├── TravelStage.tsx                # DELETE
│   │       ├── travel-context.ts              # DELETE
│   │       └── BreathingRobot.tsx             # (moved, see above)
│   └── Hero.tsx                               # NOT EDITED (hash-checked)
├── hooks/useLayoutMode.ts                     # EDIT three modes: list, live, still
├── app/(site)/page.tsx                        # EDIT the new section order
└── app/globals.css                            # EDIT shared robot-stage classes; Why section layout; remove the travel CSS
scripts/
├── why-tareeq-check.mjs                       # NEW  Playwright checks (R9)
└── how-it-works-check.mjs                     # EDIT remove handoff and tablet sections; rename the robot selectors
history/adr/0002-…                             # SUGGESTED  (see below; not created without the owner's consent)
```

**Structure Decision**: single Next.js app, following existing conventions: copy under `src/content`, shared presentation under `src/components/ui`, sections under `src/components/sections`, checks under `scripts/`. The file count goes down overall because the hand-off and the old principles are removed.

## Key Decisions

1. **Remove the hero-to-section card travel** (R1): the owner's delegated decision; the hero becomes untouched at runtime; reversible from git.
2. **One shared `RobotStage`** (R2): the two sections cannot drift.
3. **Mirror with CSS grid areas** (R3): no script decides layout; the same stacked order as How it works on phones.
4. **One navy card with an ordered list** (R4): accessible numbering, AA contrast, saffron only on the dark surface.
5. **Four new inline icons and three saffron motifs, no library** (R5, R6): the site's own style; decorations kept outside the text area and checked.
6. **One content file, old principles retired** (R7).
7. **New order, scroll cue to Programs, alternating tones** (R8).
8. **Merge after 007** (R10).

## Milestones (each ends with lint, build and a browser check at 390 and 1440)

0. **Baseline**: build `main` in a second working copy and record Lighthouse (back to back later), JS size, the hero screenshots and the hero guard.
1. **Shared piece and the 007 simplification**: move `BreathingRobot`, add `RobotStage`, rename the robot CSS, remove the hand-off, simplify the carousel and cards, update the How it works check. *Check*: How it works still passes its remaining sections; the hero is untouched.
2. **Why Tareeq**: content file and accessor, icons, the icon tile tone, saffron accents, the rewritten section and its CSS; retire the old principles. *Check*: the content, layout, contrast and decoration checks.
3. **Page order**: reorder `page.tsx`, the scroll cue and `id="programs"`. *Check*: the order, the cue, the hero unchanged.
4. **Verification and close-out**: full check run, back-to-back Lighthouse, screenshots at 1440×900, 390×844 and 360, hand-off notes; then ask before merging (after 007).

## Risks

1. **Removing the travel disappoints** (it was a requested effect). *Guardrail*: flagged for confirmation; the working code is in git history and restorable.
2. **Saffron decorations touch text on a small screen**. *Guardrail*: decorations sit outside the text area, are sized down on phones, and a check compares their boxes with every text box at 360, 390 and 1440.
3. **Merge order with 007** (008 contains 007's unfinished work; 007's remaining tasks mention the removed hand-off). *Guardrail*: merge 007 first; a note in 007's tasks; ask before any merge.

## Complexity Tracking

No deviations from the constitution. The shared `RobotStage` is a reduction in duplication, not added complexity.

## ADR suggestion

📋 Architectural decision detected: removing the hero-to-section card travel (and with it the runtime link between the hero and How it works) and sharing one robot-stage piece between two sections; this supersedes the card hand-off part of ADR-0001. Document reasoning and tradeoffs? Run `/sp.adr remove-hero-card-handoff`. Not created without the owner's consent.
