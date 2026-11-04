# Implementation Plan: Lead Capture

**Branch**: `006-lead-capture` | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/006-lead-capture/spec.md`, plus the owner's /sp.plan direction (MongoDB Atlas + Mongoose, zod, Resend approved; one collection for both form types; admin-ready schema; no form, auth, CDN or UI libraries)

## Summary

This feature adds two lead forms: Book a Workshop as a **modal dialog on a minimal `/workshop` page** (opened by `/workshop?book=1`; amendments A1–A6, 2026-11-03), and the online course waitlist at `/register`.
- **Pages**: Server Components that render a small client form.
- **Submission**: Next.js **Server Actions** (chosen over Route Handlers because they work without JavaScript, have a built-in CSRF check, give one typed contract and a free pending state; research R1).
- **Validation**: one shared `zod/mini` schema per form, run on the server as the source of truth and mirrored on the client.
- **Storage**: valid submissions go into a single MongoDB `leads` collection (Mongoose discriminators on `type`), with indexes ready for the later admin feature.
- **Notification**: the owner is emailed through Resend in `after()`, so the visitor's confirmation never waits on email.
- **Spam**: a honeypot, plus a 5-per-hour limit counted in a self-expiring `rate_limits` collection keyed by an HMAC of the address.
- **Entry points**: existing CTAs are re-pointed through the existing `joinHref` constant and one hero `href`.

## Technical Context

**Language/Version**: TypeScript 5.9, Node 24 (local), Next.js 16.4.3 App Router, React 19.3
**Primary Dependencies**: existing: next, react, tailwindcss 4, clsx, tailwind-merge, framer-motion (not used here). **New (approved)**: `mongoose@9.11.4`, `zod@4.6.7` (imported as `zod/mini`), `resend@6.36.1`. Exact pins, no ranges.
**Storage**: MongoDB Atlas (M0, AWS Mumbai), databases `tareeq_dev` / `tareeq`; collections `leads` and `rate_limits` (data-model.md)
**Testing**: `node --test` unit tests (`tests/unit/`, no new dependency); Playwright scripts `scripts/leads-check.mjs` and `scripts/leads-db-check.mjs` (project convention)
**Target Platform**: Vercel (region `bom1`); mobile-first browsers from 360px; must work with JavaScript disabled
**Project Type**: single Next.js web app (`src/`)
**Performance Goals**: confirmation within 3 s of submit on 4G (SC-001); form-page client JS kept to the form island + `zod/mini`; mobile Lighthouse Performance 90+, Accessibility 95+ on both form pages
**Constraints**: no personal data in logs, URLs or errors; server is the source of truth; values survive every failure; DB connect fails fast (5 s); hero untouched apart from one `href`
**Scale/Scope**: pilot volume (tens of leads per week); 2 pages, 2 actions, about 20 new files, about 8 edited files

## Constitution Check

*GATE: checked before Phase 0 and again after Phase 1. Result: **PASS**, with two items for the owner to note (marked ⚠).*

| # | Principle | How this plan complies |
|---|---|---|
| I | Mobile-first, always | Single-column forms designed at 360px first and widened inside a Card at `sm`+; all controls ≥ 44px (existing `min-h-11`); no horizontal scroll checked at 360/390/1440 |
| II | Everything is a reusable component | New controls (`SelectField`, `TextareaField`, `ChoiceGroup`, `CheckboxField`) share one `FieldFrame` with the existing `Field` instead of copy-pasting label/error markup; both forms share `useLeadForm`, `ErrorSummary`, `FormAlert`, `Honeypot`, `Confirmation`; shared UI in `components/ui`, form pieces in `components/forms`; copy in `src/content` |
| III | Brand tokens, voice | Forms use existing tokens (`text-midnight`, `border-danger`, `rounded-control`, `rounded-card`); no hex values; copy is plain and warm, no hype words; Saffron never used as text |
| IV | Accessible by default | One H1 per page; every control labelled; radios in `<fieldset>`/`<legend>`; errors tied by `aria-describedby`, an error summary with `role="alert"` and focus; confirmation heading focused; honeypot removed from the accessibility tree and tab order; visible focus via existing styles |
| V | Protect people's data | Server validation always; only the listed fields stored; explicit consent with privacy note and stored `consent.at`/`noteVersion`; no IP stored (HMAC counter only, auto-expires); `logLead` logs type/ref/outcome/code only; secrets in env only; no admin routes yet |
| VI | Fast on a cheap phone | Server Components by default; one client island per form; `zod/mini`; Mongoose/Resend server-only (`import "server-only"`); email moved off the critical path with `after()`; no images added |
| VII | Small, verified steps | Milestones below each end with build + lint + browser check at 390 and 1440 |
| ⚠ VIII | Don't touch what is finished | **Hero impact statement**: in `src/components/Hero.tsx`, the "Explore programs" anchor's `href="#"` becomes `href="/workshop?book=1"`. No class, markup, element type, animation or other attribute changes. The "How it works" hero button is **not** touched (not a listed CTA). The owner's instruction counts as approval for this single attribute; hero screenshots before and after must match pixel for pixel |
| IX | No surprise dependencies | mongoose, zod and resend are owner-approved. **Beyond the request, approved by the owner 2026-11-03**: the `rate_limits` collection (not a lead store) and the `RATE_LIMIT_SECRET` env var (R5), and the optional `LEAD_EMAIL_FROM` (R7). No other packages; `server-only` is handled natively by Next 16 and is not installed |
| X | When unsure, choose the safest option | Conservative readings recorded in spec Assumptions (shared rate limit, under-18 allowed with note); the confirmation headings ("Your request is in" / "You’re on the waitlist") are drafted, marked DRAFT, and approved by the owner 2026-11-03 |
| XI | Server Components by default, client at the leaves | Pages, headers, intros, privacy note, Contact/Courses/footer links stay server-rendered. The client boundary is the `<form>` itself, because `useActionState` must own the form to drive errors, values and the confirmation swap; see Complexity Tracking. Field building blocks are not duplicated: the same `Field` components render inside the island |

**Post-design re-check (after Phase 1)**: still PASS. The data model adds no personal fields beyond the spec. Contracts expose no internals. The only client modules are the two forms, their small shared pieces, and `schema.ts`/`phone.ts`, which are pure.

## Project Structure

### Documentation (this feature)

```text
specs/006-lead-capture/
├── spec.md
├── plan.md                  # this file
├── research.md              # R1–R12 decisions
├── data-model.md            # leads + rate_limits
├── quickstart.md            # setup and verification
├── contracts/
│   ├── server-actions.md    # inputs, processing order, states, confirmation copy
│   ├── notification-email.md
│   └── env.md
├── checklists/requirements.md
└── tasks.md                 # /sp.tasks (not created here)
```

### Source Code

```text
src/
├── app/(site)/
│   ├── workshop/page.tsx               # NEW  minimal server page (H1, intro, Book button); reads ?book=1; renders BookingDialog
│   ├── register/page.tsx               # NEW  server page; heading = courseFormLabel; renders CourseForm
│   ├── contact/page.tsx                # EDIT add "Book a workshop" (primary) + courseFormLabel (secondary) Cards
│   └── courses/page.tsx                # EDIT add link to /register using courseFormLabel
├── components/
│   ├── Hero.tsx                        # EDIT one href (see VIII)
│   ├── layout/Footer.tsx               # EDIT add /register link (footer only)
│   ├── ui/
│   │   ├── Field.tsx                   # EDIT extract shared label/help/error frame; rendered output unchanged
│   │   ├── FieldFrame.tsx              # NEW  label + help + error wiring shared by all controls
│   │   ├── SelectField.tsx             # NEW  same frame, <select>
│   │   ├── TextareaField.tsx           # NEW  same frame, <textarea> with counter
│   │   ├── ChoiceGroup.tsx             # NEW  fieldset/legend radio group
│   │   └── CheckboxField.tsx           # NEW  consent checkbox + privacy note slot
│   └── forms/
│       ├── BookingDialog.tsx           # NEW  'use client' modal leaf: URL-driven open/close, focus trap, Esc, scroll lock
│       ├── WorkshopForm.tsx            # NEW  'use client' form island (Form A), rendered inside BookingDialog
│       ├── CourseForm.tsx              # NEW  'use client' form island (Form B, under-18 note)
│       ├── useLeadForm.ts              # NEW  shared client hook: useActionState, client validation, focus
│       ├── ErrorSummary.tsx            # NEW
│       ├── FormAlert.tsx               # NEW  rate_limited / error messages
│       ├── Honeypot.tsx                # NEW
│       └── Confirmation.tsx            # NEW  next step + ref + WhatsApp Button
├── content/
│   ├── index.ts                        # EDIT add getCourseOptions(), getLeadCopy(), getCourseFormLabel(); page meta
│   ├── types.ts                        # EDIT CourseOption, LeadCopy; PageSlug += "book-a-workshop" | "register"
│   └── data/
│       ├── courses.ts                  # NEW  DRAFT hardcoded course list (only getCourseOptions reads it)
│       ├── leads.ts                    # NEW  courseFormLabel, confirmations, WhatsApp prefills, privacy note (DRAFT), messages
│       └── pages.ts                    # EDIT meta for the two new pages
└── lib/
    ├── site.ts                         # EDIT joinHref = "/workshop?book=1"; whatsapp URL helper accepts a message
    ├── env.ts                          # NEW  server-only env reader (contracts/env.md)
    ├── db/mongoose.ts                  # NEW  cached connection (R8)
    └── leads/
        ├── schema.ts                   # NEW  shared zod/mini schemas (pure; client + server)
        ├── phone.ts                    # NEW  normalisePhone (pure)
        ├── options.ts                  # NEW  role/level/ageGroup labels; monthOptions(now) (pure)
        ├── reference.ts                # NEW  TQ-XXXXXX generator (pure)
        ├── model.ts                    # NEW  Lead + discriminators, RateLimit model (server-only)
        ├── rate-limit.ts               # NEW  clientKey(headers), checkAndCount() (server-only)
        ├── notify.ts                   # NEW  Resend email (server-only)
        ├── log.ts                      # NEW  logLead() (server-only)
        └── actions.ts                  # NEW  'use server' submitWorkshop / submitCourse / handleSubmission

tests/unit/                             # NEW  phone, schema, options, reference, rate-limit key
scripts/leads-check.mjs                 # NEW  Playwright e2e + screenshots
scripts/leads-db-check.mjs              # NEW  record + delivery confirmation by ref
.env.example                            # EDIT add server variables (empty)
tsconfig.json                           # EDIT allowImportingTsExtensions (R11)
package.json                            # EDIT 3 deps (exact), "test:unit" script
next.config.ts                          # no change expected (default 1 MB action body limit is ample)
```

**Structure Decision**: single Next.js app, following existing conventions. Content and copy go in `src/content`, shared UI in `src/components/ui`, server logic in `src/lib`, and checks in `scripts/`. Feature-specific client pieces are grouped under `src/components/forms/`.

**Entry points through existing constants**: changing `joinHref` re-points the header "Book a workshop", the mobile menu button, the home final CTA (`homeCopy.cta.href`) and the Programs page "Join this workshop" buttons in one line. None of them is restyled. The hero anchor is the only hard-coded one.

## Key Decisions

0. **Workshop form as a URL-driven dialog** (amendments A1–A6): `BookingDialog` reads `book=1` from the URL (`useSearchParams`), so every CTA is a plain link to `/workshop?book=1` and closing is a `replace` to `/workshop`. It is rendered on the server already open when the parameter is present, so it works before hydration and without JavaScript (the close control is a real link). It reuses the project's `useFocusTrap` (with a fallback focus target) and the MobileNav pattern for Esc and body scroll lock. City comes from the `WORKSHOP_CITY` constant in `src/lib/leads/config.ts` and is set by the server.

1. **Server Actions, not Route Handlers** (R1): progressive enhancement and the built-in CSRF check are decisive for a phone-first form that must not lose input.
2. **One `leads` collection with Mongoose discriminators** (data-model): this is what the owner asked for. Shared fields sit at the top level, so admin filters, search and date sort work across both types. `schemaVersion` leaves room for change.
3. **Email in `after()`** (R7): the save is the commit point. Email failure is recorded, never shown to the visitor.
4. **Rate limit in MongoDB with TTL plus HMAC key** (R5): the only stateless-safe store already approved, and no personal data at rest.
5. **`zod/mini`, shared** (R2): one rule set, small client cost.
6. **Hand-written phone normaliser** (R3): precise for Pakistan, shape-checked elsewhere, no unapproved dependency.

## Milestones (each ends with lint + build + browser check at 390 and 1440)

1. **Foundations**: deps, env reader, `.env.example`, Mongo connection, models and indexes, pure modules + unit tests. *Check*: unit tests green; a scratch script inserts and reads one test lead in `tareeq_dev`.
2. **Form A end to end**: UI building blocks, `/workshop?book=1`, action pipeline, Resend in `after()`, confirmation. *Check*: happy path stored + emailed; every rejection; JS-off value preservation; screenshots.
3. **Form B**: `getCourseOptions()`, `courseFormLabel`, `/register`, under-18 note, waitlist confirmation. *Check*: same as M2 for Form B.
4. **Entry points**: `joinHref`, hero `href`, footer, Courses, Contact. *Check*: every CTA lands correctly; before/after screenshots of the hero and the CTAs show no visual change.
5. **Hardening and verification**: rate limit, honeypot, duplicate key, privacy log sweep, Lighthouse on both pages, full `leads-check.mjs` + `leads-db-check.mjs`. *Check*: quickstart sections 3–7 all ticked.

## Risks

1. **The form reset behaviour of React 19 changes**, and values are lost with JS on (R4). *Guardrail*: `defaultValue` from state + `key` per attempt; asserted by the e2e check at both JS on and off.
2. **Atlas cold connection exceeds the 3 s budget** on a cold function. *Guardrail*: same region as the functions (`bom1` / ap-south-1), cached connection, 5 s fail-fast with the friendly error and values kept; measured in M5.
3. **Emails only reach the Resend account owner** until a domain is verified (R7). *Guardrail*: the pilot uses that address; `notification.state` shows any failure; domain setup is listed in the quickstart.

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Client boundary is the whole `<form>`, not only individual inputs (XI) | `useActionState` must own the form element to receive server state (errors, values, success) and to drive the in-place confirmation and focus | Rendering fields on the server and passing them as children cannot show per-field server errors or restore values without a second component copy, which XI forbids |
| Second collection `rate_limits` | Stateless functions need a shared counter; it holds no lead data and expires within the hour | In-memory counters do not hold across Vercel instances; a new KV service is not approved |
| Extra env var `RATE_LIMIT_SECRET` | Keeps the counter key non-reversible, so no personal data is stored | An unsalted hash of an IPv4 address can be brute-forced quickly |
