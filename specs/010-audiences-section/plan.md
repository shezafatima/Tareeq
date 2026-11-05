# Implementation Plan: Home "Who it's for" section UI

**Branch**: `010-audiences-section` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-audiences-section/spec.md`

## Summary

Replace the four plain cards of the existing `WhoItsFor` section with five audience cards: a duotone icon in a 56px brand-tinted tile, name, one benefit line and a "See how" arrow, the whole card being one link. Layout is a centred wrapping row (1 column on phones, 2 on tablet, 3+2 at `lg`, 5 at `xl` if it fits). Entrance reuses the existing `Reveal`. Hover/focus motion (lift, tile brighten, per-icon motion) is **CSS only**, so the section needs no client component at all. Content moves to typed data in `src/content/audiences.ts`.

## Technical Context

**Language/Version**: TypeScript, Next.js 16.4.3 (App Router), React 19.3.1
**Primary Dependencies**: existing Tailwind tokens, `Reveal` and `.lift` utilities; **new**: `@phosphor-icons/react` 2.1.10 (requested by the owner; pinned exactly like the other dependencies)
**Storage**: typed content module (same shape as `home-programs.ts`); no database
**Testing**: Playwright script `scripts/audiences-check.mjs` (same style as `programs-check.mjs`), update `scripts/home-check.mjs` audience assertion; `npm run lint` and `npm run build`
**Target Platform**: mobile-first web, 360px up
**Project Type**: single Next.js web app
**Performance Goals**: Lighthouse mobile Performance 90+, Accessibility 95+; home score not lower than before by more than about 2 points (SC-007)
**Constraints**: animate only `transform`/`opacity`; no hardcoded hex; icon stroke 3:1 on its tile; no new hues
**Scale/Scope**: 1 section, 5 cards, 5 icons

## Constitution Check

| Principle | Result |
|---|---|
| I Mobile-first | Pass. Base styles are the 360px compact horizontal card; the whole card is the touch target (at least 44px). |
| II Reusable components | Pass. New `AudienceCard` in `components/sections`; `WhoItsFor` stays the thin section. |
| III Brand tokens | Pass with one derived tone: saffron on a saffron tile is 1.6:1, so the teacher icon uses saffron mixed with midnight (about 55/45, about 4:1). Built with `color-mix` of existing tokens; no new hue, no hex. |
| IV Accessible | Pass. Icons `aria-hidden`; visible focus ring; reduced motion removes lift and icon motion. |
| V Data | N/A (no forms). The WhatsApp message carries no personal data. |
| VI Fast | Pass. Five icons only, server-rendered, zero client JS; `transform`/`opacity` animation only (tile "brighten" is an overlay fading in, not a background-colour transition). |
| VII Small steps | Tasks end with build, lint, 390px and 1440px visual check. |
| VIII Finished work | Pass. Hero, How it works, Programs untouched. Shared CSS only gains new `.aud-*` rules. |
| IX Dependencies | Pass. One new dependency, explicitly requested by the owner; per-icon imports, bundle verified (see Complexity Tracking). |
| X Ask/safest | Pass. Copy stays marked DRAFT for owner review. |
| XI Server by default | Pass. No `"use client"` needed (research R2); stricter than the spec allows. |

Post-design re-check: still pass.

## Project Structure

### Documentation (this feature)

```text
specs/010-audiences-section/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/audience-card.md
├── checklists/requirements.md
└── tasks.md            # /sp.tasks
```

### Source Code

```text
src/
├── content/
│   ├── audiences.ts            # NEW location (moved from data/audiences.ts): 5 audiences, DRAFT
│   ├── types.ts                # Audience gains `cta`
│   └── index.ts                # import path of getAudiences updated
├── components/sections/
│   ├── WhoItsFor.tsx           # rewritten: list + CTA resolution
│   └── AudienceCard.tsx        # NEW: one card (icon tile, name, line, See how)
└── app/globals.css             # NEW .aud-* rules: tile tints, icon keyframes, reduced motion
scripts/
├── audiences-check.mjs         # NEW
└── home-check.mjs              # audience assertion updated to 5 names
```

`src/content/data/audiences.ts` is deleted. The old `IconTile` icon names (`teacher`, `student`, `graduate`, `team`) stay in `components/ui/icons`, since other sections may use them (checked at task time; not removed).

## Key Decisions

1. **Phosphor via the server entry** (`@phosphor-icons/react/dist/ssr`), one named import per icon: `ChalkboardTeacher`, `Student`, `GraduationCap`, `Laptop`, `Briefcase`, `weight="duotone"`. Server-safe, no client boundary.
2. **CSS-only motion**: each card carries `data-audience`; keyframes per audience run on card `:hover` (under `@media (hover: hover)`) and `:focus-visible`, all inside `@media (prefers-reduced-motion: no-preference)`. The laptop "lid nudge" and cap "tilt and settle" are rotations of the whole glyph with a suitable transform-origin (Phosphor glyphs are single SVGs, so a true lid is not separable; accepted).
3. **Layout** with a wrapping flex row: `justify-center`, card basis computed from the gap: 100% (base), 50% (`sm`), 33% (`lg`), 20% (`xl`). The last row centres itself for both the tablet and the 3+2 cases. 5-in-one-row starts at `xl` (1280px) because at 1024px each card is about 180px wide; this is the spec's allowed 3+2 fallback, confirmed by the browser check.
4. **Tint brighten** with a second gradient layer inside the tile whose `opacity` rises on hover/focus.
5. **Card = one `<a>`**: `next/link` for internal links; plain anchor with `target="_blank" rel="noopener noreferrer"` and an sr-only "(opens in a new tab)" for WhatsApp. The name is an `h3` inside the link. The accessible name is the whole card text (name, line, "See how"), a superset of what FR-010 asks for.
6. **No-WhatsApp fallback**: CTA data is `{ kind: "whatsapp", message }`; the section resolves it and falls back to `/contact` when no number is set.
7. **Content location**: `src/content/audiences.ts`, as requested and matching the newer files (`home-programs.ts`, `how-it-works.ts`).

## Tones (strong tone / contrast on tile)

| Audience | Icon | Strong tone | Contrast on tile |
|---|---|---|---|
| Teachers | ChalkboardTeacher | saffron 55% + midnight | about 4:1 |
| School students | Student | sky | 3.3:1 (tile tint capped at 30% to keep it) |
| College & university | GraduationCap | royal | 5.9:1 |
| Online learners | Laptop | sky 50% + royal | 4.4:1 |
| Corporate teams | Briefcase | midnight, plus a small saffron dot on the tile corner | 8.7:1 |

Values come from research R3 and are re-measured in the browser check.

## Complexity Tracking

| Item | Why needed | Simpler alternative rejected |
|---|---|---|
| New dependency `@phosphor-icons/react` | Owner asked for it by name | Extending the existing hand-drawn icon set: no duotone, and the owner chose Phosphor |

## Risks

- Phosphor tree-shaking in Next: check the build's route size; fall back to deep imports (`dist/ssr/Student`) if the bundle grows by more than five icons.
- The sky icon on a sky tile is only 3.3:1; if the hover-brightened tile drops below 3:1, lower the tile tint.
- `home-check.mjs` lives in the uncommitted 009 work; edits to it will mix with 009's edits until 009 is committed.
