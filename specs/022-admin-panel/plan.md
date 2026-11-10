# Implementation Plan: Admin Panel (Launch Scope)

**Branch**: `022-admin-panel` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-admin-panel/spec.md`

## Summary

A private, single-owner panel under `/admin` for working leads and managing programs. Sign-in uses Auth.js (credentials provider, JWT session, 7-day lifetime) against one email and bcrypt hash held in environment variables. Every admin page, Server Action and Route Handler re-checks the session on the server through one `requireAdmin()` helper; `src/proxy.ts` (Next 16's name for middleware) only adds an early redirect. Failed logins are counted per hashed address in the existing `rate_limits` collection (5 per 15 minutes). Leads are read and edited through the existing `Lead` model, programs through the existing `ProgramModel`, with one shared zod schema for the form and the server. Program writes call `revalidateTag` so the public pages update with no redeploy. The UI is Server Components with small client leaves, brand tokens and CSS-only motion; no UI library.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4.3 (App Router)
**Primary Dependencies**: existing: mongoose 9, zod 4 (`zod/mini`), `@phosphor-icons/react`, tailwind 4, clsx. **New (named in the brief)**: `next-auth@5.0.0-beta.32` (Auth.js v5; peer range includes Next 16) and `bcryptjs@3.0.3`. Nothing else.
**Storage**: MongoDB, existing `leads`, `programs`, `rate_limits` collections. No new collections, no schema changes.
**Testing**: existing `node --test` unit tests in `tests/unit` for pure logic (slug, schema, login-limit window, URL query parsing, WhatsApp link); a browser check script in `scripts/` (existing pattern) for auth guards, 360px layout and persistence.
**Target Platform**: Vercel-style serverless hosting; mobile-first browsers from 360px.
**Project Type**: Web, single Next.js project.
**Performance Goals**: Submissions list renders in under 1 s on a warm server with up to ~10k leads (indexes exist); toggle and status changes feel instant (optimistic).
**Constraints**: transform/opacity-only interaction motion, 150-250 ms (the stat count-up is exempt, up to 800 ms), off under `prefers-reduced-motion`; no personal data in logs; no UI library; no dependency beyond Auth.js and bcryptjs.
**Scale/Scope**: one admin; hundreds to low thousands of leads; tens of programs.

No `NEEDS CLARIFICATION` remain: the five spec clarifications plus research.md cover them.

## Constitution Check

*GATE: passes before research; re-checked after design, still passes.*

| Principle | Status | How |
|---|---|---|
| I Mobile-first | PASS | Table collapses to cards, drawers go full-screen at 360px, 44px targets. |
| II Reusable components | PASS | Small components in `components/admin/*`; reuse of `components/ui` (Field, TextareaField, SelectField, Button, Card). Dialog, Drawer, Toast, StatusChip, Skeleton, EmptyState extracted once. |
| III Brand tokens | PASS | Existing tokens only. Saffron is a chip background and indicator bar, never text on light. |
| IV Accessible | PASS | Existing `useFocusTrap`, Esc closes, focus returns, labelled fields, reduced motion respected. |
| V Protect data | PASS | `requireAdmin()` on every page, action and route; server-side validation; no personal data in logs or URLs (owner's own search text is the clarified exception); secrets in env. |
| VI Fast | PASS with one tracked exception | Public pages untouched. Admin pages are held to the same Lighthouse gates: Performance 90+ and Accessibility 95+ must be met (task T061), SEO 90+ is checked too. Because the spec requires `noindex` (FR-007), Lighthouse's "page is blocked from indexing" audit fails by design and caps the SEO score below 90; this is the one justified violation, recorded under Complexity Tracking, using the constitution's own process. The constitution is not amended. |
| VII Small verified steps | PASS | Tasks split by user story with build, lint and visual check each. |
| VIII Don't touch the hero | PASS | No change to hero, Header or Footer; admin has its own layout outside `(site)`. |
| IX No surprise dependencies | PASS (justified) | Two dependencies, both named in the brief. `framer-motion` is installed but not used here. |
| X Safest option | PASS | Assumptions recorded in spec and research. |
| XI Server Components default | PASS | Client leaves listed in research R8, each with a reason. |

**Gate result**: PASS, with one Complexity Tracking entry (Principle VI, SEO score on `noindex` pages).

## Project Structure

### Documentation (this feature)

```text
specs/022-admin-panel/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── auth-and-routes.md
│   ├── server-actions.md
│   └── env.md
├── checklists/requirements.md
└── tasks.md            # created later by /sp.tasks
```

### Source Code (repository root)

```text
scripts/hash-password.mjs                 # npm run hash-password
src/
├── proxy.ts                              # optimistic redirect for /admin/* (not a security boundary)
├── auth.ts                               # Auth.js config: credentials provider, JWT 7d, rate-limited authorize
├── app/
│   ├── api/auth/[...nextauth]/route.ts   # Auth.js handlers (the only route handler added)
│   ├── robots.ts                         # Disallow /admin (create or extend)
│   └── admin/
│       ├── layout.tsx                    # admin root: noindex metadata
│       ├── login/page.tsx                # the only unauthenticated admin page
│       └── (panel)/
│           ├── layout.tsx                # requireAdmin(), sidebar/top bar, toasts
│           ├── error.tsx                 # error boundary, Retry, DB-down message
│           ├── loading.tsx               # skeletons
│           ├── page.tsx                  # Submissions
│           └── programs/
│               ├── page.tsx              # card grid
│               ├── new/page.tsx
│               └── [id]/edit/page.tsx
├── components/admin/                     # Sidebar, TopBar, NavItem, StatStrip, CountUp, SubmissionsTable,
│                                         # SubmissionCard, LeadDrawer, StatusSelect, StatusChip, FilterBar,
│                                         # ProgramCard, PublishedToggle, ProgramForm, ListEditor,
│                                         # ProgramPreview, ConfirmDialog, Drawer, Toast(Provider),
│                                         # Skeleton, EmptyState, LoginForm
└── lib/admin/
    ├── session.ts                        # requireAdmin(), withAdmin(handler, resolver?) (server-only)
    ├── login-window.ts                   # pure: window start, isOverLimit(count) (unit-tested)
    ├── leads-params.ts                   # pure: parse URL params, escape search text (unit-tested)
    ├── login-limit.ts                    # 5 failed / 15 min / address, on the RateLimit model
    ├── leads-query.ts                    # parse URL params, build filter, stats aggregate
    ├── leads-actions.ts                  # "use server": setStatus, saveNotes, deleteLead
    ├── programs-schema.ts                # shared zod schema (client + server), slugify
    ├── programs-actions.ts               # "use server": create, update, setPublished, delete (+ revalidate)
    ├── whatsapp.ts                       # pure wa.me link builder
    └── log.ts                            # one logging call, accepts no personal data
tests/unit/admin-*.test.ts                # pure modules
scripts/admin-guard-test.ts               # run with tsx: every Server Action and Route Handler rejects with no session
scripts/admin-check.mjs                   # guards, 360px layout, persistence
.env.example                              # + AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH
```

**Structure Decision**: single Next.js project. `/admin` is a top-level route tree outside `(site)`, so it gets none of the public Header, Footer, WhatsApp button or preloader, and the hero and site shell are untouched. The `(panel)` route group separates the authenticated shell from `/admin/login`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle VI SEO 90+ cannot be met on admin pages | FR-007 (and the owner's brief) require `noindex`, a `robots.txt` Disallow and `X-Robots-Tag` on `/admin`. Lighthouse's crawlability audit fails for exactly that, which lowers the SEO score below 90. | Dropping `noindex` to score 90 would let private pages be indexed, a worse outcome than the lower score. Performance 90+ and Accessibility 95+ remain hard gates, and every other SEO audit (title, status code, link text, viewport) must still pass. |

## Key Decisions (detail in research.md)

1. Auth.js v5 beta, credentials provider, JWT sessions; `5.0.0-beta.32` peers with Next 16.
2. `bcryptjs` (pure JS, serverless-safe).
3. `src/proxy.ts` for early redirects; real checks in `requireAdmin()` on every page, action and route.
4. Login limit reuses `RateLimit` with a namespaced hashed key; only failures count; checked before comparing the password.
5. `revalidateTag(tag, { expire: 0 })` for program changes, for both old and new slug on rename.
6. One shared `zod/mini` schema for client form and Server Actions.
7. Filters, search and page live in the URL; one aggregate for the four stat counts.
8. Drawers and dialogs on the existing `useFocusTrap`; CSS transitions only (150-250 ms); the stat count-up is exempt and capped at 800 ms; all motion off under reduced motion.
9. Every Server Action goes through one `withAdmin()` wrapper with an injectable session resolver, so a guard test can call every action with no session and prove it is rejected before any database access (research R15).
10. The live preview renders the public `ProgramPanel` component with form state; if that needs more than a small refactor the preview is dropped (research R16).
11. `trustHost: true` in the Auth.js config, so no extra host variable is needed (research R17).

📋 Architectural decision detected: authentication approach (Auth.js v5 beta, JWT, single env-held admin, layered server-side checks). Document reasoning and tradeoffs? Run `/sp.adr admin-authentication`

## Risks

1. **Auth.js v5 is still a beta tag.** Pin the exact version and keep the integration in `src/auth.ts` plus `session.ts` so it can be swapped.
2. **Spoofed client address weakens the login limit** off a trusted proxy. Use the same trusted `x-forwarded-for` rule as lead capture and note it in quickstart.
3. **Public pages might lag after a program change** if tags and page caching interact unexpectedly. Quickstart step 7 verifies it; a `revalidatePath` fallback is described in research R6.
