# Implementation Plan: Home Page Content and Core Pages

**Branch**: `003-home-core-pages` | **Date**: 2026-11-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-home-core-pages/spec.md`

## Summary

Turn the hero-plus-placeholders site into a real one: five new home sections, the Our Way, Programs and Contact pages, and a desktop scroll transition in which the hero's three floating cards travel into the "How it works" steps.

Three ideas carry the design:

1. **A content layer with async accessors.** Typed data lives in `src/content/data/*.ts`. Pages and sections call only `src/content/index.ts` (`getPrograms()` and friends). A lint rule forbids importing the data files directly, so swapping the source to a database touches `src/content/` and nothing else.
2. **The step cards are the travelling cards.** The three cards in "How it works" are real, in-flow elements. On desktop they are moved with `transform` so they start exactly over the hero's cards and slide to identity as the page scrolls. There are no clones and no second copy of the content. Layout never changes, so nothing can shift, and with the transform removed the section is already complete.
3. **Split by what each part needs.** Position and the settle spring are JavaScript (scroll-linked, reversible). Everything else in the sequence (text rise, connector line, glow) is CSS keyed off one attribute, so it stays server-rendered markup. All other sections are Server Components.

The hero is not restyled or refactored. The only edit to a hero file is adding `export` to its three icon components (needs approval, see Constitution Check).

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router), all installed
**Primary Dependencies**: none added. `framer-motion` (already used by the hero) for the scroll value, the settle spring and the reused icons; Tailwind 4 tokens; `next/link`
**Storage**: none. Content is typed files now, shaped like future database rows
**Testing**: Playwright scripts in `scripts/` (installed). New: `home-check.mjs`, `pages-check` updated, `transition-check.mjs`. Layout shift measured with a `layout-shift` PerformanceObserver. Lighthouse through `npx`, several runs before and after
**Target Platform**: Vercel; mobile-first browsers; the transition runs on 1024px and up only
**Project Type**: Web (single Next.js app)
**Performance Goals**: mobile Lighthouse on the home page no worse than the baseline (about 75, runs 66 to 82, median of 5 runs before and after); CLS at or below 0.05; no long frames while scrolling the transition on a laptop
**Constraints**: animate only `transform` and `opacity` (one stated exception, see Complexity Tracking); no layout shift; hero unchanged; no new dependencies; no invented facts
**Scale/Scope**: 5 home sections, 3 pages, about 8 content files, about 14 new components, 1 client stage plus 1 client card, 1 export-only hero edit, 1 redirect

## Constitution Check

*GATE: passes before Phase 0 and re-checked after Phase 1 design.*

| Principle | Status | How the plan meets it |
|---|---|---|
| I Mobile-first | Pass | Sections are single-column from 360px and widen; the transition is off below 1024px; tested at 360, 390, 768, 1024, 1440, 1920 for horizontal scroll and shift |
| II Reusable components | Pass | New shared parts: `Section`, `Badge`, `IconTile`, `FactList`, `CtaBand`, `PageHeader`, `ContactItem`. Section blocks in `components/sections`. Existing `Container`, `SectionHeading`, `Card`, `Button` reused. Repeated card patterns are one component each |
| III One brand system | Pass | Only tokens (`midnight`, `royal`, `saffron`, `soft`, `paper`). Saffron appears only on the line, glow and icon fills, never as text. Sora 600/700 and Inter 400/500/600 only (no new weights). No hex in new files |
| IV Accessible | Pass | One H1 per page, landmarks, visible focus. Line and glow are `aria-hidden`. Step cards are not focusable and carry no duplicate content. Reduced motion shows the final state with no animation |
| V Protect data | Pass | No forms, no personal data. Contact values are public business details in env vars |
| VI Fast on a cheap phone | Pass, one exception, to be measured | Transform and opacity only, except the reused Learn bulb glow (Complexity Tracking). No new images or libraries. Below-the-fold work only. Travel code runs on desktop only |
| VII Small, verified steps | Pass | Milestones in tasks each end with build, lint and a look at 390 and 1440 |
| VIII Don't touch the hero | **Needs approval** | See "Hero impact statement" below. Visual and behavioural change to the hero: none |
| IX No surprise dependencies | Pass | None added |
| X Safest option | Pass | All figures and biography are draft copy for the owner; nothing invented is stated as fact; unconfirmed contact values are omitted |
| XI Server Components by default | Pass | Every section and page is a Server Component. Two client leaves: `HowItWorksStage` (scroll state shared by the cards, needs browser scroll and media APIs; it receives the server-rendered steps as `children`) and `StepCard` (needs motion values and effects). Text, line and glow stay server markup |

### Hero impact statement (Principle VIII, needs your approval)

| Change | Where | Effect on the hero |
|---|---|---|
| Add the word `export` to `SparkleIcon`, `CodeIcon`, `BulbIcon` | `src/components/Hero.tsx` | None. Same precedent as feature 002's export of the eye constants. Needed so the step cards reuse the exact hero icon animations instead of copies that would drift |
| While the transition runs (desktop only), the three `[data-hero-card]` wrapper divs get an inline `opacity` set from outside, and it is cleared when the section unmounts or the mode ends | runtime only, no source change | The hero cards fade out as their travelling twins take over, and fade back in when the visitor scrolls to the top. The hero file does not set `style` on these nodes, so React never fights it |

Not changed, but noted: the hero's "How it works" and "Explore programs" buttons are `href="#"`. Pointing them at the new section and Programs page would be a hero edit, so it is left for you to decide.

## Key Decisions

1. **Real step cards, moved by transform, instead of clones.** At scroll 0 each step card is translated, rotated (hero rest tilt −1.5°) and scaled to sit exactly over its hero card; at the end of the range its transform is the identity. Rejected: (a) fixed-position clones, which need a second copy of the card, a swap at the destination (a visible seam) and aria handling; (b) a pinned sticky stage, which changes the section's height and scroll feel; (c) CSS scroll-driven animations, whose browser support varies and which still need JavaScript for the time-based settle.
2. **Measure rest positions, never live positions.** The start pose is taken from each hero card's outer wrapper (`[data-hero-card]`), whose rect is unaffected by the hero's float, parallax and entrance transforms. Measured once on mount and on resize (ResizeObserver), never during scroll. **Revised after owner feedback:** the step cards use the hero card's exact design, and instead of a crossfade the step card starts on the hero card's live visible position and tilt and swaps in at the first pixel of scroll, so only one card is ever visible.
3. **Progress is a document-space scroll range.** `progress = clamp((scrollY − 0) / (rangeEnd))`, with `rangeEnd = stepRowTop − 0.45 × viewportHeight`, so the cards arrive with the steps near the middle of the screen. Travel is eased out so the last few percent of progress move the card by less than a pixel; this is what makes the arrive and leave threshold free of visible snaps.
4. **Arrive and leave with hysteresis.** `arrived` becomes true at progress ≥ 1 and false below 0.99. Between those the card sits at identity. With the sine ease the position error across that band is about 0.2px.
5. **Settle is a spring with an initial velocity.** On arrival each card runs a spring toward scale 1 with a velocity kick, giving a natural overshoot of about 1.03 and a settle, delayed 0, 80, 160 ms left to right. On leaving, the same motion value springs back to 1 from wherever it is, so there is no pop. Rejected: a CSS keyframe settle, which would snap to 1 if interrupted mid-spring.
6. **Text, line and glow are CSS, keyed off `data-stage`.** The stage wrapper renders `data-stage="travel"` and `data-arrived`. CSS sets the pre-arrival state (text faded and lowered 8px, line `scaleX(0)`, glow hidden) only when `data-stage="travel"`; transitions give the stagger (text after the card, line after the third card at about 330 ms, glow `animation` once). Leaving removes `data-arrived` and the transitions run back. Without the attribute (server render, no JavaScript, reduced motion, narrow screens) the default CSS is the final state.
7. **Three motion modes, decided before paint.** `travel` (width ≥ 1024px and motion allowed), `fade` (narrower, motion allowed: the section fades in once on entering view), `none` (reduced motion: final state, no animation). Server HTML is always the final state; a layout effect picks the mode, so JavaScript failure leaves a complete section.
8. **Async content accessors.** `getPrograms()` and the others return promises. Server Components can `await` a database call later without changing their own signature. Data files live in `src/content/data/` and only `src/content/index.ts` may be imported by components (lint rule).
9. **Contact from one place.** `src/content/data/contact.ts` builds the entries from `NEXT_PUBLIC_WHATSAPP_NUMBER` (existing), `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_CONTACT_LOCATION` (new). The footer's contact block reads the same accessor, so it fills in automatically. Entries without a value are dropped.
10. **`/about` is a permanent redirect** in `next.config.ts` (308), the old placeholder page file is deleted, and `navItems` becomes "Our Way" at `/our-way`.
11. **Metadata from content.** Each page exports `generateMetadata` reading `getPageMeta(slug)`. The root layout gains `title.template: "%s | Tareeq"` (a child-segment template, so the home page keeps its full title).

📋 Architectural decisions detected: (a) the real-card scroll hand-off, and (b) the async content-accessor layer that decouples pages from the data source. Document reasoning and tradeoffs? Run `/sp.adr home-transition-and-content-layer`

## Project Structure

### Documentation (this feature)

```text
specs/003-home-core-pages/
├── plan.md              # This file
├── research.md          # Phase 0: decisions with alternatives
├── data-model.md        # Phase 1: content entities and accessors
├── quickstart.md        # Phase 1: how to run and verify
├── contracts/
│   ├── content-accessors.md       # accessor signatures, errors, ordering
│   └── how-it-works-motion.md     # modes, states, timings, DOM contract
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/sp.tasks, not created here)
```

### Source Code (repository root)

```text
src/
├── content/
│   ├── types.ts                 # Audience, Step, Program, Principle, StorySection, ContactDetail, PageMeta
│   ├── data/
│   │   ├── audiences.ts  steps.ts  programs.ts  principles.ts
│   │   ├── story.ts  contact.ts  pages.ts  cta.ts
│   └── index.ts                 # the only import path for components
├── app/
│   ├── layout.tsx               # + title.template
│   └── (site)/
│       ├── page.tsx             # Hero + five sections
│       ├── our-way/page.tsx     # new (replaces about/)
│       ├── programs/page.tsx    # real page
│       └── contact/page.tsx     # real page
├── components/
│   ├── Hero.tsx                 # EXPORT keywords only (approval)
│   ├── ui/                      # + Badge, IconTile, FactList
│   ├── layout/                  # Footer reads getContactDetails()
│   └── sections/
│       ├── Section.tsx  PageHeader.tsx  CtaBand.tsx  ContactItem.tsx
│       ├── WhoItsFor.tsx  ProgramsPreview.tsx  ProgramCard.tsx  WhyTareeq.tsx  FinalCta.tsx
│       └── how-it-works/
│           ├── HowItWorks.tsx          # server: section, heading, steps from getSteps()
│           ├── HowItWorksStage.tsx     # client: modes, progress, arrived, hero-card fade
│           ├── StepCard.tsx            # client: travel transform, settle spring, icon state
│           ├── StepIcon.tsx            # client: maps step key to the hero's exported icons
│           └── how-it-works.css        # data-stage rules: text rise, line, glow
├── hooks/
│   └── useMotionMode.ts         # "travel" | "fade" | "none"
└── lib/site.ts                  # navItems, joinHref kept; contactDetails removed (moved to content)
next.config.ts                   # /about → /our-way redirect
eslint.config.mjs                # no-restricted-imports for src/content/data
scripts/                         # home-check, transition-check, pages-check (updated)
```

**Structure Decision**: One Next.js app. Content gets its own folder because the whole point is that it can change source without touching components. The scroll stage sits in its own `how-it-works/` folder because it is the only part with client logic.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Principle VI "only transform and opacity": the Learn bulb's glow animates a `filter` drop-shadow and its fill (inherited from the hero's `BulbIcon`) | The brief requires reusing the existing hero icon animations: "the Learn bulb fills with saffron and glows" | A transform-only glow would be a new animation that drifts from the hero's. The paint cost is one 16px icon, once per settle. Measured in the scroll check; if it drops frames it becomes a layered opacity glow |
| Writing inline `opacity` onto hero card wrappers from outside the hero | The hero cards must hand off to the travelling cards without editing hero source | Editing the hero to add a hand-off prop would break Principle VIII more broadly. The write is runtime only and cleared on exit |

## Risks (max 3)

1. **Hand-off mismatch** between the hero card and the step card at scroll 0 (size, float offset). Mitigation: scale from measured widths, 4% crossfade, a screenshot diff at scroll 0 and 1px of scroll.
2. **Layout reads on resize or font load** moving the start pose. Mitigation: ResizeObserver and `document.fonts.ready` re-measure; no reads during scroll.
3. **Draft copy mistaken for final** (program figures, biography). Mitigation: each data file carries a `DRAFT: owner to confirm` header, and quickstart lists them as launch blockers.
