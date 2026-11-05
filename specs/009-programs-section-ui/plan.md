# Implementation Plan: Home Programs Section UI Enhancement

**Branch**: `009-programs-section-ui` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/009-programs-section-ui/spec.md`

## Summary

The home Programs section becomes a five-card bento grid: the teacher workshop is a large navy featured card (2 columns × 2 rows from 1024px), the other four are smaller paper/soft-blue cards, and "Coming soon" cards are visibly quieter. Every card has the same structure: status chip, title, audience line, 2-3 facts, one call to action.

Approach:
- **New typed content, old data untouched**: a new `src/content/home-programs.ts` (same pattern as `how-it-works.ts` and `why-tareeq.ts`) holds the five cards, read through a new `getHomeProgramCards()`. The existing `programs` data, `Program` type, `ProgramCard` and the `/programs` page are not edited, so that page cannot change.
- **No new client code**: the entrance already exists (`Reveal` + `RevealController`), the lift already exists (`.lift`, 4px), and the new glow, border warming and chevron slide are plain CSS. The section is a Server Component end to end.
- **No new dependency, no new colour.**

## Technical Context

**Language/Version**: TypeScript 5.9, Node 24, Next.js 16.4.3 App Router, React 19.3
**Primary Dependencies**: existing only (next, react, tailwindcss 4, clsx, tailwind-merge). Framer Motion is not needed. **No new packages.**
**Storage**: none (typed content file)
**Testing**: Playwright scripts in `scripts/` (project convention): new `programs-check.mjs`; update the existing checks that assume the old three-card section (`home-check.mjs`, `why-tareeq-check.mjs` and any others found by grep for the old program names); Lighthouse by one-off `npx`, compared with the feature 008 baseline
**Target Platform**: Vercel; mobile-first from 360px
**Project Type**: single Next.js web app (`src/`)
**Performance Goals**: mobile Lighthouse no more than 3 points below the 008 baseline; accessibility stays 100; zero layout shift from the section
**Constraints**: only `transform` and `opacity` animate; hero and How it works untouched; `/programs` output unchanged; no whole-card link; no horizontal scroll from 360px
**Scale/Scope**: 1 content file + type + getter, 1 new card component, 1 rewritten section component, about 60 lines of CSS, 1 check script. About 8 files touched.

## Constitution Check

*GATE: checked before Phase 0 and again after Phase 1. Result: **PASS**.*

| # | Principle | How this plan complies |
|---|---|---|
| I | Mobile-first | Designed at 360px (single column), 2 columns from `md`, 4-column bento from `lg`; CTA at least 44px tall; checked at 360, 390, 768, 1024, 1440 |
| II | Reusable components | `ProgramsPreview` (section) renders `HomeProgramCard` (one card, props only); reuses `Reveal`, `Section`, `SectionHeading`, `Button`, `ChevronRight`, `Badge`-style chip; no copy-pasted variants (featured and quiet are variants of one card) |
| III | One brand system | Midnight, royal, soft, paper, white, saffron tokens only; saffron never as text on a light background (saffron is text/accent only on navy); Sora/Inter; glow is a tint of existing tokens |
| IV | Accessible | `ul`/`li` list, `h3` per card, facts as a description list, one tab stop per card (the CTA), CTA names include the program, decoration `aria-hidden`, coming-soon text measured at AA, motion respects reduced motion |
| V | Protect data | No data collected; WhatsApp messages carry no personal data |
| VI | Fast on a cheap phone | No client JS added; only `transform`/`opacity`; glow is one element with `will-change` only on the featured card; no images |
| VII | Small verified steps | Milestones end with lint, build and a browser check at 390 and 1440 |
| VIII | Don't touch what is finished | Hero, How it works, `/programs`, `ProgramCard`, `programs.ts` and `Program` type are not edited. Only `ProgramsPreview` is rewritten (it is the subject of this feature) |
| IX | No surprise dependencies | None |
| X | Ask or choose safest | Placeholders flagged DRAFT in the content file; open points listed in research R9 |
| XI | Server Components by default | Section, card and content are Server Components; `RevealController` is the existing client leaf |

**Post-design re-check**: still PASS. The design adds no client code, no dependency and no edit to a protected file.

## Project Structure

### Documentation (this feature)

```text
specs/009-programs-section-ui/
├── spec.md
├── plan.md              # this file
├── research.md          # R1–R9 decisions
├── data-model.md        # HomeProgramCard content shape
├── quickstart.md        # run and verify
├── contracts/
│   └── program-card.md  # card structure, variants, motion, a11y contract
├── checklists/requirements.md
└── tasks.md             # /sp.tasks (not created here)
```

### Source Code (repository root)

```text
src/
├── content/
│   ├── types.ts                    # + HomeProgramCard, HomeProgramStatus, HomeProgramCta (added; Program untouched)
│   ├── home-programs.ts            # NEW: the five cards (DRAFT placeholders marked)
│   └── index.ts                    # + getHomeProgramCards()
├── components/
│   ├── sections/
│   │   ├── ProgramsPreview.tsx     # REWRITTEN: bento grid, heading/intro/all-programs link kept
│   │   └── HomeProgramCard.tsx     # NEW: one card (featured / active / quiet)
│   └── ui/
│       └── ChevronRight.tsx        # + optional `slide` prop (4px) – default 3px unchanged for other callers
└── app/globals.css                 # + .program-card, .program-glow, border warming, reduced-motion rules
scripts/
└── programs-check.mjs              # NEW: layout, order, links, a11y, contrast, motion, reduced motion
```

**Structure Decision**: single web app. Home cards get their own content type rather than extending `Program`, because the home card needs different fields (status wording, CTA, facts incl. group size, featured flag) and `/programs` must not change.

## Phases and milestones

1. **Content**: types, `home-programs.ts` (5 cards), getter. Build passes.
2. **Card + grid**: `HomeProgramCard`, `ProgramsPreview` rewrite, grid placement at `md`/`lg`, CTA resolution (internal link vs WhatsApp, omitted if no number). Check at 360/768/1024/1440.
3. **Look**: featured navy + saffron accent, active soft-blue/paper, quiet variant; contrast measured.
4. **Motion**: entrance via `Reveal` (stagger), lift via `.lift`, border warm, chevron slide 4px, glow drift, reduced-motion and touch rules.
5. **Verify**: new `programs-check.mjs`, fix older checks, Lighthouse vs 008 baseline, confirm `/programs`, hero and How it works unchanged (existing hero token check + screenshot diff), manual keyboard and screen-reader pass.

## Complexity Tracking

No constitution violations. One deliberate duplication: some strings (teacher audience, "Half a day") are repeated in `home-programs.ts` rather than imported from `programs.ts`, so the later admin feature can replace either source independently (see research R2).
