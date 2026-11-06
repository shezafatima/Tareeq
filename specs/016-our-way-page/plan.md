# Implementation Plan: Our Way Page

**Branch**: `016-our-way-page` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/016-our-way-page/spec.md`

## Summary

Replace the current draft `/our-way` page with a six-section editorial page that explains why Tareeq exists and how it teaches. Its signature is a saffron line that draws as you scroll, with a marker for each section.

The page stays static and server-rendered. The line is server-rendered SVG, complete and correct with no scripts. A small client controller that renders nothing adds the scroll drawing, only when motion is allowed. The Urdu word uses an 11 KB font subset that only this page downloads.

## Technical Context

**Language/Version**: TypeScript, React 19, Next.js 16.4.3 (App Router)
**Primary Dependencies**: Existing only: Tailwind CSS 4, `next/font`. No new packages
**Storage**: None. Typed content file, `src/content/our-way.ts`
**Testing**: `node --test` unit tests for the geometry and content; a Playwright check script, `scripts/our-way-check.mjs`; Lighthouse
**Target Platform**: Web. Mobile first from 360px. Chromium is the only browser available for local testing
**Project Type**: Next.js web app, single project
**Performance Goals**: Mobile Lighthouse Accessibility 95+, SEO 90+, Performance 90+ (see research R6 for how a local shortfall is handled); layout shift under 0.1; no long task over 50 ms from the controller; Urdu font about 11 KB
**Constraints**: Static route; `"use client"` only on the controller; no horizontal scroll from 360px; brand tokens only; reduced motion and no-script get a complete, static line at first paint
**Scale/Scope**: One page, six sections, about ten small components, one client file

## Constitution Check

*Gate re-checked after Phase 1 design: passes, with the two exceptions in Complexity Tracking.*

| Principle | Status | How |
|---|---|---|
| I. Mobile-first | Pass | Built from a 360px straight rail upward; checked at five widths; 44px targets |
| II. Reusable components | Pass | Small section components with one shared section wrapper; reuses `Section`, `Reveal`, `Button` |
| III. One brand system | **Exception** | Tokens only, no saffron text on light, Midnight about 25–35%. Adds one typeface for one word |
| IV. Accessible | Pass | One H1, logical headings, decoration `aria-hidden`, reduced motion, AA contrast checked on both tones |
| V. Protect data | N/A | No forms or personal data on this page |
| VI. Fast on a cheap phone | **Exception** | Static page, text LCP, 11 KB font, one frame write. `stroke-dashoffset` is not transform or opacity |
| VII. Small verified steps | Pass | Five milestones, each built and viewed at 390px and 1440px |
| VIII. Don't touch finished work | Pass | Hero, Header and tokens unchanged. `globals.css` only gains a new `way-` block. The root layout gains one unused-elsewhere CSS variable, with no visual effect on the hero |
| IX. No surprise dependencies | Pass | No packages. Font tools are used once, outside the project |
| X. Ask or choose safest | Pass | Assumptions are listed in the spec; copy is marked draft; no invented facts |
| XI. Server components by default | Pass | `WayPathController` needs browser scroll, resize and media query APIs. It renders nothing, so no markup is duplicated |

## Project Structure

### Documentation (this feature)

```text
specs/016-our-way-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/way-path.md
├── checklists/requirements.md
└── tasks.md             # from /sp.tasks
```

### Source Code

```text
src/
├── app/layout.tsx                    # declares the Urdu font: research R1
├── app/(site)/our-way/
│   ├── page.tsx                      # replaced; metadata with Open Graph
│   └── fonts/
│       ├── noto-nastaliq-urdu-tareeq-700.woff2   # new, about 11 KB
│       └── OFL.txt                   # new, the font's licence
├── components/sections/our-way/      # new
│   ├── OurWaySection.tsx             # Section + track + marker + side and tone
│   ├── WayTrack.tsx                  # the SVG pieces for one section
│   ├── WayNode.tsx
│   ├── WayHeading.tsx
│   ├── WayPathController.tsx         # the only "use client"; renders null
│   ├── OurWayOpening.tsx
│   ├── OurWayProblem.tsx
│   ├── OurWayPrinciples.tsx
│   ├── OurWaySession.tsx
│   ├── OurWayPurpose.tsx
│   ├── OurWayClosing.tsx
├── content/
│   ├── our-way.ts                    # new; all copy, marked DRAFT
│   ├── types.ts                      # add OurWayContent; remove story types
│   ├── index.ts                      # add getOurWay(); remove getStorySections()
│   └── data/pages.ts                 # our-way metadata
├── lib/
│   ├── our-way/path.ts               # new; pure geometry
│   └── site.ts                       # add mentorHref
└── app/globals.css                   # add a way- block

Removed: src/content/data/story.ts, src/components/sections/StorySection.tsx

tests/unit/our-way.test.ts            # new; geometry and content rules
scripts/our-way-check.mjs             # new; browser checks
scripts/pages-check.mjs               # update Our Way rows
scripts/polish-reveal-check.mjs       # update its Urdu and story checks
```

**Structure Decision**: This follows the feature-folder pattern of `sections/how-it-works/` and `sections/programs/`, with CSS in `globals.css` as other sections do. See `contracts/way-path.md`.

## Key Decisions

Details and evidence are in `research.md`.

1. **Font: `next/font/local` with a committed subset**, not `next/font/google`, which cannot limit to named characters and would send about 158 KB. Google's `text=` subset was tested and renders the word wrongly.
2. **Line: server SVG, enhanced by a controller.** Reduced motion and no-script run no path code and still show the complete line at first paint.
3. **Curves stay off text by layout**: rails in a reserved column, crossings in reserved bottom padding.
4. **Scroll mapping** always reaches the end at the bottom of the page.
5. **Tones**: paper, midnight, paper, midnight, paper, midnight, with the tall sections on paper.

## Milestones

Each is detailed in `quickstart.md`, and each is safe to stop after.

1. **Content and static page**: the full message and both links, with no path. Delivers User Stories 1 and 2.
2. **Static path**: all SVG pieces and markers, complete at first paint.
3. **Scroll drawing**: the controller.
4. **Craft**: type scale, numerals, timeline echo, spacing, entrances.
5. **Release gates**: checks, Lighthouse, draft review.

Take the baseline before Milestone 1: run `pages-check`, `polish-reveal-check`, `footer-check` and Lighthouse on `/programs`, and record them in `baseline.md`.

## Interfaces

No HTTP API is added or changed. The page's contracts are the two link targets, `/#mentor` and `/workshop?book=1`, and the markup and controller rules in `contracts/way-path.md`.

## Non-Functional Requirements

- **Reliability**: all content is in the initial HTML. If the controller fails, only the decoration is lost.
- **Security**: no input, data or secrets. Static output.
- **Cost**: none. No new services.
- **Licensing**: the font is under the SIL Open Font License, and the licence file ships beside it. The subset is a permitted modification.

## Risks

| Risk | Blast radius | Guard |
|---|---|---|
| Safari or Firefox differ in font shaping or SVG behaviour; neither is available here | Visual only: wrong letter shape or a line glitch | Layout features retained; no `pathLength` used. Owner to view the deployed page on an iPhone and in Firefox before sign-off |
| Scroll-linked painting is slow on cheap phones, since `stroke-dashoffset` repaints | Janky line on low-end devices; content unaffected | One write per frame, pieces no taller than a section, a 4x CPU check, and a 50 ms long-task limit. If the limit can't be met, ship the static line and tell the owner |
| Local Performance stays under 90 because of site-wide scripts | Target missed on this page, as on others | Measured against `/programs` as in R6, reported plainly, and re-measured when deployed. Fixing the site shell is a separate feature |

**Rollback**: revert the merge. No data or settings change.

## Follow-ups Outside This Feature

- Feature 013's `.step-progress` rule hides "Step 1 of 2" on the desktop workshop form.
- Site-wide total blocking time keeps Performance below target.

## Complexity Tracking

| Exception | Why needed | Simpler alternative rejected because |
|---|---|---|
| Principle III: a third typeface, Noto Nastaliq Urdu | The owner's brief. Sora and Inter have no Urdu script, and the name's meaning is the page's opening | A system fallback looks different on each device and may have no Nastaliq form at all |
| Principle VI: `stroke-dashoffset` animates a non-transform, non-opacity property | The owner's brief, and a line that follows its own curve cannot be drawn with transform or opacity | A clip or mask reveal can't follow the curve. A pure-transform version loses the drawn effect. Cost is limited as in R4 and checked at milestone 3 |
