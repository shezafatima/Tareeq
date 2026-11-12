# Implementation Plan: Admin testimonial videos

**Branch**: `031-admin-testimonials` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/031-admin-testimonials/spec.md`

## Summary

Move home-page testimonials from the static `src/content/testimonials.ts` to a MongoDB `Testimonial` collection managed at
`/admin/testimonials`. The public section keeps its components and selection rule untouched: `getTestimonials()` now
feeds `selectTestimonials()` from a cached `getPublishedTestimonials()` (tag `"testimonials"`) instead of the array. The
admin copies the Programs pattern (read module, zod-mini schema shared by form and server, `withAdmin` Server Actions,
card grid, form with `ConfirmDialog`), adds a consent gate enforced at schema, action (conditional update) and model, and
extends `PublishedToggle` with a keyboard-reachable "locked" tooltip.

## Technical Context

**Language/Version**: TypeScript 5, Node 22
**Primary Dependencies**: Next.js 16.4 (App Router, Server Actions, `unstable_cache`), React 19.3, Mongoose 9.11, zod 4.6 (`zod/mini`), next-auth 5 beta, `@phosphor-icons/react`, Tailwind 4. No new dependencies.
**Storage**: MongoDB, new collection `testimonials`
**Testing**: `node --test` unit tests (`npm run test:unit`), `npm run test:admin-guard`, manual browser checks (quickstart)
**Target Platform**: Web, mobile-first (360px+)
**Project Type**: Single Next.js web app (`src/`)
**Performance Goals**: Home page unchanged (cached read, no extra client JS); Lighthouse targets of Principle VI hold
**Constraints**: Section UI, click-to-load player, production empty rule and dev placeholders unchanged; i.ytimg.com via `unoptimized` images (no config change); reduced motion respected
**Scale/Scope**: Tens of items, one owner

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 design: still passes.*

| Principle | Status | How |
|-----------|--------|-----|
| I Mobile-first | ✅ | 2-column 9:16 grid at 360px; form single column; 44px targets |
| II Reusable components | ✅ | Reuses `PublishedToggle` (one new prop), `StatusChip`, `EmptyState`, `ConfirmDialog`, `UnavailableNotice`; no copied variants |
| III Brand tokens | ✅ | Existing admin classes/tokens only |
| IV Accessible | ✅ | Labels + `aria-describedby` errors, live counter, tooltip on focus, one H1 per page |
| V Protect data | ✅ | `requireAdmin()` on pages, `withAdmin` on every action, server re-validation, consent enforced server-side, logs carry ids/error names only |
| VI Fast | ✅ | Public read cached; no new client code on the home page; thumbnails via `next/image` |
| VII Small verified steps | ✅ | Milestones below, each ends with lint/build/browser check |
| VIII Hero untouched | ✅ | No hero, token or Header change |
| IX No surprise deps | ✅ | None added |
| X Safest option / no invented people | ✅ | No seed; dev placeholders stay obviously fake and dev-only |
| XI Server components by default | ✅ | Pages and cards are server; client only for `TestimonialForm` (form state, live preview) and `PublishedToggle` (already client) |

## Project Structure

### Documentation (this feature)

```text
specs/031-admin-testimonials/
├── plan.md
├── research.md          # R1–R10 decisions
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── data-access.md   # reads + Server Actions
│   └── routes-and-ui.md # pages, sidebar, components
└── tasks.md             # /sp.tasks
```

### Source Code

```text
src/lib/testimonials/
├── model.ts             # NEW  Mongoose "Testimonial"
├── data.ts              # NEW  getPublishedTestimonials() (cached, tag "testimonials")
└── select.ts            # MOVED from src/lib/testimonials.ts (import paths only)
src/lib/admin/
├── testimonials-schema.ts   # NEW  pure rules shared by form + actions
├── testimonials-read.ts     # NEW  uncached admin reads
└── testimonials-actions.ts  # NEW  create / update / setPublished / delete
src/app/admin/(panel)/testimonials/
├── page.tsx, new/page.tsx, [id]/edit/page.tsx   # NEW
src/components/admin/
├── TestimonialAdminCard.tsx # NEW  (server)
├── TestimonialForm.tsx      # NEW  (client)
├── PublishedToggle.tsx      # EDIT add lockedReason
└── AdminNav.tsx             # EDIT add Testimonials entry
src/content/
├── index.ts             # EDIT getTestimonials() reads the DB
├── types.ts             # EDIT comment only (contract now written by the admin)
└── testimonials.ts      # DELETE
scripts/admin-guard-test.mts                    # EDIT REQUIRED_ACTIONS
tests/unit/admin-testimonials-schema.test.ts    # NEW
tests/unit/testimonials.test.ts                 # EDIT import path
```

**Structure Decision**: Single Next.js project; mirror `src/lib/programs/` + `src/lib/admin/programs-*` (research R1).

## Milestones

1. **Data + public read**: model, `data.ts`, move selector, rewire `getTestimonials()`, delete static file. Check: unit
   tests pass; home page in dev still shows placeholders; production build with empty DB hides the section.
2. **Schema + actions + guard**: `testimonials-schema.ts` (+ unit tests: link forms, 140 limit, line breaks, consent
   rule, order), reads, actions, guard-test entries. Check: `test:unit`, `test:admin-guard`.
3. **Admin UI**: sidebar entry, list page + card, `PublishedToggle.lockedReason`, form with preview/counter/consent lock,
   new/edit pages, delete. Check: quickstart steps 1–13 at 360/390/1440px; programs and courses toggles unchanged.

## Risks

- **Moving `src/lib/testimonials.ts`** breaks an import elsewhere → grep shows only two importers; build catches any miss.
- **DB outage hides testimonials silently** → logged by error name; acceptable trade-off (R2), same as settings.
- **`PublishedToggle` change regresses programs/courses** → new prop is optional; default path unchanged; verify both pages.

## Complexity Tracking

No constitution violations.
