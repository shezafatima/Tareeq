# Contract: routes and UI

## Routes

| Route | Change |
|---|---|
| `/admin` | `src/app/admin/(panel)/page.tsx` (redirect) is **deleted**. It is replaced by `src/app/admin/(panel)/(home)/page.tsx`, which is the dashboard. `export const dynamic = "force-dynamic"`, `metadata.title = "Dashboard"`. Calls `requireAdmin()` before any read. |
| `/admin` loading | New `src/app/admin/(panel)/(home)/loading.tsx`: skeletons in the dashboard grid's shape, `role="status" aria-label="Loading"` |
| `/admin/submissions/{workshops,courses}?lead=<id>` | Unchanged. This is where the dashboard's open links go. |

Signed out: `/admin` → 307 to `/admin/login`, from the layout's and the page's `requireAdmin()`.

## Links out of the dashboard

| Element | Target |
|---|---|
| Card "New workshop requests" | `leadsHref("workshop", { status: "new" })` |
| Card "New course registrations" | `leadsHref("course", { status: "new" })` |
| Card "Leads this week" | `leadsHref("workshop", {})` |
| Card "Booked / enrolled this month" | `leadsHref("workshop", { status: "booked" })` |
| Attention row "Open" / recent row | `leadsHref(type, { lead: id })` |
| Attention "View all new" (when total > 10) | `leadsHref("workshop", { status: "new" })` and `leadsHref("course", { status: "new" })` |
| Top course row | `leadsHref("course", { course: courseId })` |
| Content: programs / courses / categories | `/admin/programs`, `/admin/courses`, `/admin/courses/categories` |
| Quick actions | `/admin/programs/new`, `/admin/courses/new`, `/admin/settings` |

## Components (new, in `src/components/admin/dashboard/`)

`"use client"` is marked ⚡. Everything else is a Server Component.

| Component | Props | Notes |
|---|---|---|
| `Greeting` | `greeting: string; name: string; date: string` | The page's single `<h1>` is "Good morning, Sheza". The date is a `<p>` under it. |
| `DashboardCard` | `title: string; action?: ReactNode; children; className?` | A soft-blue `section` with an `h2`, reused by every panel. This is the one card shell (Principle II). |
| `NeedsAttention` | `rows: AttentionRow[]; total: number` | A list, or an `EmptyState` reading "You're all caught up." Shows "Showing 10 of N" plus the two "View all new" links when `total > 10`. |
| ⚡ `AttentionItem` | `id; type; name; children` | Needs optimistic state, a transition and the toast. Renders `<li>{children}<button>Mark contacted</button></li>`, hides itself with `useOptimistic`, and calls `setLeadStatus`. The button has `aria-label="Mark {name} contacted"`, `min-h-11`. |
| `TypeChip` | `type: LeadType` | "Workshop" / "Course" via `StatusChip` tones (royal / sky). The label is always shown. |
| `DashboardStats` | `summary: DashboardSummary` | Four link cards using the existing `CountUp`. The week card shows `deltaText`, with an arrow icon `aria-hidden` and the text carrying the meaning. |
| `LeadsChart` | `daily: DaySeries[]` | Server SVG + legend + `sr-only` table (research R8). Shows an `EmptyState` when the total is 0. |
| `RecentActivity` | `rows: RecentRow[]` | Each row is a stretched link to `href`, showing name, `TypeChip`, context (truncated), `StatusChip` (course "booked" reads "Enrolled", via `statusLabels`), and when. |
| `TopCourses` | `rows: TopCourse[]` | An ordered list with name, count and a proportional bar (`aria-hidden`). Shows an `EmptyState` when empty. |
| `ContentSummary` | `content: ContentCounts` | Three count links plus three quick-action buttons (44px). |

## Layout (FR-020)

```text
≥ lg (12-col grid, gap-4/6)
┌──────────── Greeting (col 1–12) ─────────────┐
│ NeedsAttention (col 1–5) │ Stats 2×2 (col 6–12) │
│ LeadsChart (col 1–7)     │ RecentActivity (8–12)│
│ TopCourses (col 1–6)     │ ContentSummary (7–12)│
└───────────────────────────────────────────────┘
< lg: one column in this order: Greeting, NeedsAttention, Stats (2×2 grid), Chart, Recent, Top courses, Content.
```

- From 360px: no horizontal scroll, long text truncates (`min-w-0 truncate`), all controls are at least 44px.
- Motion: only `CountUp`, which is skipped under reduced motion, plus the existing hover shadow transitions.

## Sidebar

`AdminNav` `ENTRIES[0]` = `{ kind: "link", href: "/admin", label: "Dashboard", Icon: SquaresFour, isActive: (p) => p === "/admin" }`. It is marked active only on `/admin`.

## Unavailable

When `safeLoad` fails, the page shows the `Greeting` (it needs no data) followed by `UnavailableNotice`. No numbers or zeros are shown.
