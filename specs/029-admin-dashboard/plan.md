# Implementation Plan: Admin dashboard home

**Branch**: `029-admin-dashboard` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/029-admin-dashboard/spec.md`

## Summary

`/admin` stops redirecting and becomes a dashboard, rendered on the server and never cached. The page shows:

- a greeting
- leads waiting more than 2 working days, with a one-tap "Mark contacted"
- four stat cards
- a 14-day stacked SVG chart
- the 8 most recent leads
- the top 5 courses over 30 days
- a content summary with quick actions

Each request runs one `Promise.all` inside one `safeLoad`: a single narrowed `$facet` aggregation (stats, chart, top courses), two small indexed `find`s (recent, overdue) plus a count, and three content counts. All Karachi date arithmetic lives in a pure, unit-tested module with a fixed `+05:00` offset, and the aggregation uses the same offset.

The one write reuses the existing guarded `setLeadStatus`. Only the attention row's button and its optimistic hide are client-side, plus the existing `CountUp`.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router)
**Primary Dependencies**: mongoose 9, next-auth 5 beta, `@phosphor-icons/react` (all existing; **no new dependencies**, no chart library)
**Storage**: MongoDB Atlas, existing collections `leads`, `programs`, `courses` and `coursecategories`. Read only, apart from the existing status change. No schema change or migration.
**Testing**: `node --test` unit tests (`tests/unit`), `npm run test:admin-guard` (unchanged list), a dev-only seed script, and manual browser checks per `quickstart.md`
**Target Platform**: Node runtime, dynamic admin route (`force-dynamic`)
**Project Type**: Single Next.js web app (`src/`)
**Performance Goals**: `/admin` server work in under 300 ms with 5,000 leads (one aggregation and five cheap indexed reads in parallel). Usable in under 2 s on a normal connection (SC-003). JavaScript for the chart: none.
**Constraints**: 360px mobile first, 44px targets, Server Components by default, reduced motion, only the name as personal data (FR-023), Asia/Karachi days, Sunday not a working day
**Scale/Scope**: 1 route (moved into a route group), 1 loading skeleton, about 10 small components, 3 lib modules, 1 seed script, 2 unit test files, 1 sidebar entry

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: still passes.*

| Principle | Status | How |
|---|---|---|
| I. Mobile first | ✅ | Single column below `lg` in the spec's order. Chart `viewBox` scales and labels every other day below 640px. 44px buttons and links. `truncate` on long text. |
| II. Reusable components | ✅ | One `DashboardCard` shell for every panel. Reuses `CountUp`, `StatusChip`, `EmptyState`, `Skeleton`, `UnavailableNotice`, `Toast`, `useActionFeedback`, `leadsHref`, `statusLabels`. `TypeChip` is extracted because it is used in two panels. |
| III. Brand system | ✅ | Tokens only (`bg-soft`, `fill-royal`, `fill-saffron`, `text-midnight`). Saffron is a bar fill, never text. Plain, warm wording ("You're all caught up."). |
| IV. Accessible | ✅ | One H1 (the greeting), an `h2` per card. Each chart bar has `role="img"` and an `aria-label`, plus an `sr-only` data table. Legend and labels, not colour alone. Visible focus. `CountUp` is skipped under reduced motion. |
| V. Protect data | ✅ | `requireAdmin()` on the page (and the layout). The write goes through the existing `withAdmin` action. Projections exclude phone, email, message and notes. Only opaque ids in URLs. No logging beyond `safeLoad`'s error name. |
| VI. Fast | ✅ | Server-rendered, with no client fetch for the first view. Indexed reads, and the facet input is narrowed. SVG with no library. |
| VII. Small steps | ✅ | Milestones below, each ending with lint, types, tests, build and a browser check at 390/1440. |
| VIII. Don't touch the hero | ✅ | Admin only. No token, Header or public change. |
| IX. No surprise dependencies | ✅ | None. The chart is hand-drawn SVG. |
| X. Safest option | ✅ | Unreadable data shows the unavailable notice, never fake zeros. The "booked this month" reading is stated in the spec Assumptions. |
| XI. Server Components | ✅ | Client only for `AttentionItem` (optimistic state + action + toast) and the existing `CountUp` (effect + animation frames). Row markup passes into `AttentionItem` as `children`. |

## Project Structure

### Documentation (this feature)

```text
specs/029-admin-dashboard/
├── spec.md
├── plan.md               # this file
├── research.md           # R1–R12
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── data-access.md
│   └── routes-and-ui.md
├── checklists/requirements.md
└── tasks.md              # /sp.tasks
```

### Source Code

```text
src/lib/admin/
├── dashboard-time.ts        NEW pure: Karachi bounds, working-hours cutoff, greeting, relative days, chart days
├── dashboard-shape.ts       NEW pure: facet → summary, zero-fill, week delta text, niceMax
└── dashboard-query.ts       NEW server-only: getDashboardData() (facet + finds + counts)
src/app/admin/(panel)/
├── page.tsx                 DELETE (temporary redirect)
└── (home)/
    ├── page.tsx             NEW dashboard (requireAdmin, force-dynamic, safeLoad)
    └── loading.tsx          NEW dashboard-shaped skeleton
src/components/admin/dashboard/   NEW
├── Greeting.tsx  DashboardCard.tsx  TypeChip.tsx
├── NeedsAttention.tsx  AttentionItem.tsx (client)
├── DashboardStats.tsx  LeadsChart.tsx  RecentActivity.tsx
└── TopCourses.tsx  ContentSummary.tsx
src/components/admin/AdminNav.tsx      + "Dashboard" first entry (exact-match active)
scripts/dashboard-seed.mts             NEW dev-only seed/remove (refuses unless the db name ends in _dev)
tests/unit/dashboard-time.test.ts, dashboard-shape.test.ts   NEW
```

**Structure Decision**: Single Next.js app. The `(home)` route group keeps the URL `/admin` and gives the dashboard its own skeleton without changing the shared `(panel)/loading.tsx`. Dashboard panels sit in their own subfolder so the flat `components/admin` list stays readable.

## Milestones

1. **Pure logic + tests**: `dashboard-time.ts` and `dashboard-shape.ts` with full unit coverage (Karachi midnight, Saturday → Monday, Sunday arrival, week and month starts, empty facet). Nothing visible changes yet.
2. **Data + page skeleton**: `dashboard-query.ts`, route move, `loading.tsx`, greeting, unavailable state, sidebar entry. Seed script. Check signed-out redirect and the unavailable notice.
3. **P1: Needs attention**: `NeedsAttention`, `AttentionItem`, `TypeChip`. Check against seed data, including mark contacted (success and failure).
4. **P2: Stats, chart, recent**: `DashboardStats`, `LeadsChart` (with SR table), `RecentActivity`.
5. **P3: Top courses + content summary**, then the 12-column grid.
6. **Verify**: full `quickstart.md` at 360/390/1440 with reduced motion and the accessibility pass. Remove seed data. Commit, merge, delete the branch (one feature per branch).

## Key Decisions (see research.md)

- Fixed `+05:00` offset on both the JS and the MongoDB side (R1).
- Overdue = more than 48 working hours (Sundays excluded), queried as a single cutoff on an existing index (R2).
- One narrowed `$facet` for stats, chart and top courses. Recent and overdue are indexed `find`s, because `$facet` sub-pipelines can't use indexes (R3).
- Reuse `setLeadStatus` with a self-hiding client row instead of adding a new action (R5).
- `(home)` route group for a dashboard-shaped skeleton. `force-dynamic` (R7).
- Server SVG chart, royal and saffron stacked, with labels and an `sr-only` table (R8).

## Risks

- **Saffron bars fall below 3:1 non-text contrast** on white. This is mitigated by the stacking order, legend, per-bar labels and the data table. The browser check confirms the bars are readable. If they aren't, switch the course series to `fill-sky` and tell the owner.
- **"Booked this month" depends on `statusChangedAt`.** A lead moved away from "booked" and back counts in the month of its latest change, which the spec accepts. Old leads with a null `statusChangedAt` don't count, which is the correct answer.
- **Seed script against the wrong database.** It is guarded: it refuses unless the database name ends in `_dev`, only touches `DASH-` refs, and `--remove` deletes only those.

## Complexity Tracking

No violations.
