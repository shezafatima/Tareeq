# Implementation Plan: Programs Pages (Database-Driven)

**Branch**: `015-programs-pages` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-programs-pages/spec.md`

## Summary

> Owner changes during implementation: Online courses became a fixed card, and the Contact page was removed. See spec FR-029 to FR-035 and research R13 and R14.

Programs move from two static files into a MongoDB `Program` collection, loaded by an insert-only seed and read through one server-only module with tagged caching. The home section, a new editorial `/programs` index and a new `/programs/[slug]` detail page all read from that module. All three stay statically generated with an hourly refresh, so the home page stays fast and a database outage never replaces a good page.

Filtering is CSS-driven: one small client leaf sets an attribute, and the server-rendered panels never re-render. Hover reveal, the sticky booking card and the mobile bar need no JavaScript, so **the filter is the only feature client leaf**, plus the error boundary Next requires. Settings validation splits per module, and an explicit check in the lead action keeps lead capture's behaviour exactly as it is.

**Markdown renderer: `marked`. Sanitizer: `sanitize-html`.** Both run on the server only and add nothing to the client bundle. Research: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router, without Cache Components), Tailwind 4 plus plain CSS in `globals.css`
**Primary Dependencies**: existing `mongoose`, `next/image`, `zod/mini`, `clsx`, `@phosphor-icons/react`. New runtime: `marked` 18.1.3, `sanitize-html` 2.18.1. New dev: `tsx` 4.23.15, `dotenv` 18.0.9, `server-only` 0.0.1, `@types/sanitize-html` 2.16.2
**Storage**: MongoDB Atlas, new `programs` collection in the existing database ([data-model.md](./data-model.md))
**Testing**: `node --test` unit tests for pure logic; new Playwright check `scripts/programs-pages-check.mjs`; existing `scripts/programs-check.mjs` (home section) and lead checks as regression guards; Lighthouse
**Target Platform**: mobile-first web, 360px to 1440px+, on Vercel; browser baseline already set by Tailwind 4 (Chrome 111+, Safari 16.4+, Firefox 128+)
**Project Type**: single Next.js web app
**Performance Goals**: filter response under 100ms; home page stays static with hero LCP unchanged against `main`; mobile Lighthouse 90+/95+/90+ on both new pages
**Constraints**: animate only `transform`/`opacity`; zero layout shift on hover; no horizontal scroll at 360px; hero files untouched; no secret in any output
**Scale/Scope**: 4 stored programs plus a fixed card (low tens at most), 3 routes, about 20 files added, 5 removed

## Constitution Check

*GATE: passes before research; re-checked after design (still passes).*

| Principle | Result | Notes |
|---|---|---|
| I Mobile-first | PASS | Stacked cards at 360px, wrapping chips, 44px targets, fixed bottom bar with safe-area padding |
| II Reusable components | PASS | Small components in `components/sections/programs/`; `ProgramFacts`, `StatusChip` and `ProgramCta` are shared by panel and detail page |
| III Brand tokens | PASS | Tokens only. Saffron numerals on navy only; paper panels use a saffron shape with dark numerals (FR-012) |
| IV Accessible | PASS | One H1, `aria-pressed` chips, polite result count, focus gives the same reveal as hover, decorative layers `aria-hidden`, AA contrast checked by script |
| V Data | PASS | No personal data collected. Lead capture is unchanged (R7). Prefilled WhatsApp text names only the program |
| VI Fast | PASS (to verify) | Static pages, server-only markdown, one small client leaf, images through `next/image` |
| VII Small steps | PASS | Milestones below, each with build, lint and 390/1440px checks |
| VIII Hero untouched | PASS | `Hero.tsx` and hero CSS are not edited. `(site)/page.tsx` gains only a `revalidate` export. `polish-token-check` guards this |
| IX Dependencies | PASS | `tsx` and `dotenv` were named by the owner; a renderer and sanitizer were requested, with `marked` and `sanitize-html` named here. `server-only` and the types package are small and dev-only. No UI library |
| X Safe defaults | PASS | Seed copy is marked DRAFT for owner confirmation (clarified in spec); no invented statistics, people or testimonials |
| XI Server first | PASS | `"use client"` only on `ProgramFilter` (URL state, click handlers) and `error.tsx` (Next requires it). Panels are never re-rendered by the client |

## Project Structure

### Documentation (this feature)

```text
specs/015-programs-pages/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── data-access.md
│   ├── seed.md
│   ├── env.md
│   └── routes.md
└── tasks.md             # /sp.tasks
```

### Source Code

```text
scripts/
├── seed-programs.ts              # NEW: npm run seed:programs
├── data/programs.seed.ts         # NEW: DRAFT seed content; no page may import it
└── programs-pages-check.mjs      # NEW: Playwright check

src/lib/
├── env.ts                        # CHANGED: only ConfigError and a generic readEnv helper
├── db/mongoose.ts                # CHANGED: validates only MONGODB_URI
├── leads/notify.ts               # CHANGED: validates its own Resend settings
├── leads/rate-limit.ts           # CHANGED: validates RATE_LIMIT_SECRET
├── leads/actions.ts              # CHANGED: settings check immediately before connectDb()
└── programs/
    ├── options.ts                # NEW, pure: enums, labels, Program type, filter values
    ├── view.ts                   # NEW, pure: index sort, facts, CTA resolution, home card, cover check
    ├── markdown.ts               # NEW, pure: marked + sanitize-html
    ├── model.ts                  # NEW, server-only: Mongoose schema
    └── data.ts                   # NEW, server-only: the one read module

src/app/(site)/
├── page.tsx                      # CHANGED: revalidate export only
├── error.tsx                     # NEW: friendly error state (client, required by Next)
└── programs/
    ├── page.tsx                  # REWRITTEN
    └── [slug]/
        ├── page.tsx              # NEW
        └── not-found.tsx         # NEW

src/components/sections/
├── ProgramsPreview.tsx           # CHANGED: reads the data module, maps through view.ts
├── ProgramCard.tsx               # REMOVED
└── programs/                     # NEW
    ├── ProgramBrowser.tsx        # hero, filter, list wrapper
    ├── ProgramFilter.tsx         # "use client": the only feature client leaf
    ├── ProgramFilterScript.tsx   # inline: applies ?for= before first paint
    ├── ProgramPanel.tsx
    ├── ProgramCover.tsx          # next/image over the brand pattern
    ├── StatusChip.tsx
    ├── ProgramFacts.tsx          # inline and grid variants
    ├── ProgramCta.tsx
    ├── ProgramHeader.tsx
    ├── ProgramProse.tsx          # the only dangerouslySetInnerHTML of stored content
    ├── ProgramOutcomes.tsx
    ├── CurriculumTimeline.tsx
    ├── BookingCard.tsx
    └── MobileCtaBar.tsx

src/content/
├── home-programs.ts              # REMOVED
├── data/programs.ts              # REMOVED
├── data/pages.ts                 # CHANGED: new /programs heading, intro and description
├── data/courses.ts               # CHANGED: stale comment only
├── index.ts, types.ts            # CHANGED: drop Program accessors and types; keep HomeProgramCard type
src/components/layout/WhatsAppButton.tsx  # CHANGED: data attribute so the bar can raise it
src/components/ui/FactList.tsx    # REMOVED if ProgramCard was its last user (confirm in tasks)
src/app/globals.css               # CHANGED: .program-* rules
next.config.ts                    # CHANGED: images.remotePatterns for res.cloudinary.com
tests/unit/programs-*.test.ts     # NEW
specs/006-lead-capture/contracts/env.md  # CHANGED: points to the per-module contract
```

**Structure Decision**: single app, following existing patterns. Programs live in `src/lib/programs/` like `src/lib/leads/`. Pure modules stay free of `server-only` so `node --test` can run them. `src/content/index.ts` no longer serves programs; its header comment is updated to say so.

## Key Decisions

Full reasoning is in [research.md](./research.md).

1. **`unstable_cache` with tags, not `use cache`**: `use cache` needs the global Cache Components flag, which would change how every page renders, hero included.
2. **Static pages, hourly refresh, keep the last good page**: production reads that fail during regeneration throw, so Next keeps serving the last good page. Only the build and dev degrade to the unavailable state.
3. **CSS-driven filter**: no `useSearchParams` (it would drop panels from the server HTML), no client re-render of panels. Counters number visible panels and `:nth-child(of)` alternates them.
4. **Insert-only seed with `timestamps: false`**: otherwise Mongoose adds `$set: { updatedAt }` to the upsert and touches every existing document on each run.
5. **Lead action settings check**: preserves today's error outcome that the combined env check gave as a side effect.

## Risks

Each has a guard in [quickstart.md](./quickstart.md).

1. **Keep-last-good behaviour differs on the host.** It is documented, but untested here. Blast radius: home or `/programs` could show an error state during an outage. Guard: Milestone 1 tests it under `next start` before pages are built on it; fallback is to degrade at runtime too and accept up to an hour of the unavailable state.
2. **Lead capture regression from the env split.** Blast radius: leads saved with no owner email. Guard: missing-setting test per variable, compared with `main`; Milestone 2 stands alone and can be reverted alone.
3. **Static files removed before production is seeded.** Blast radius: empty Programs surfaces after deploy. Guard: deploy notes below, and the hourly refresh recovers within about two hours without a redeploy.

## Deploy Notes

1. **Run the seed against production before deploying**: `MONGODB_URI="<production uri>" npm run seed:programs`. A value already in the environment wins over `.env.local`. Check that the printed database name is `tareeq`.
2. Set `NEXT_PUBLIC_CONTACT_EMAIL` for the build, or the footer shows no email and WhatsApp fallbacks go to its contact block.
3. Confirm the DRAFT seed copy first. The seed never changes stored programs, so later copy edits need the record deleted and re-seeded, or the admin feature.
4. `MONGODB_URI` must be available to the Vercel **build** step, as well as at runtime, or pages are generated in the unavailable state.
5. **Rollback**: revert the deployment. The `programs` collection is inert to the older code and can stay.
6. No new secrets. No feature flag: the change ships as one merge after the milestones.

## Handover to the Admin Feature

- Call `revalidateTag("programs", ...)` and `revalidateTag("program:<slug>", ...)` on save. Calling it without a second argument is deprecated in this Next version.
- Decide the profile per action: `"max"` serves stale once and is safe during an outage. `updateTag` in a Server Action gives immediate results, which suits unpublish.
- Add `coverImageUrl` hosts to `images.remotePatterns` if anything other than Cloudinary is used.

## Complexity Tracking

No constitution violations to justify.

📋 Architectural decision detected: static generation with tagged data caching and keep-last-good failure handling for database-backed content. It will shape the admin and courses features. Document reasoning and tradeoffs? Run `/sp.adr database-content-caching-strategy`
