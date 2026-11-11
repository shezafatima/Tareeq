# Research: Admin dashboard home

All decisions below are grounded in the current code (paths cited). No open NEEDS CLARIFICATION items remain.

## R1. Karachi day boundaries: fixed +05:00 offset on both sides

- **Decision**: Compute every boundary (today, chart start, week start, last week start, month start, 30-day start) in a pure module as UTC `Date`s using a fixed `+05:00` offset. Bucket days in MongoDB with `$dateToString { format: "%Y-%m-%d", timezone: "+05:00" }`.
- **Rationale**: Pakistan has had no daylight saving since 2009, so a fixed offset is exact. Using the same literal offset in JS and in the aggregation means the two sides cannot disagree. A pure module is unit-testable with no server imports, which fits the `tests/unit` + `node --test` setup. The existing display helpers (`src/lib/admin/format.ts`) already show times in `Asia/Karachi`. Display keeps using `Intl` with `Asia/Karachi`, and only the arithmetic uses the offset.
- **Alternatives**: `Asia/Karachi` by name in both places. This is equivalent today, but it relies on the server's ICU data and MongoDB's tz database matching. `$dateTrunc` works but is not needed. Computing days in JS after loading every lead was rejected: it does more work than needed and goes against the spec's single-aggregation intent.

## R2. "Older than 2 working days" means more than 48 working hours have passed

- **Decision**: A lead is overdue when the time between `createdAt` and now, excluding all Karachi Sundays (00:00–24:00), is more than 48 hours. The query uses its inverse: `cutoff = subtractWorkingHours(now, 48)`, and a lead is overdue when `createdAt < cutoff`. Both functions are pure and are tested against each other.
- **Rationale**: This gives the expected answers. Saturday 18:00 → not overdue on Monday morning (14 working hours) → overdue after Tuesday 18:00. A lead that arrives on Sunday starts its clock at Monday 00:00 and is overdue after Wednesday 00:00. Because the rule is monotonic in `createdAt`, a single cutoff is exact, so the database filters with the existing `{ status: 1, createdAt: -1 }` index (`src/lib/leads/model.ts:44`) instead of loading every new lead.
- **Alternatives**: Counting whole calendar working days ("2 days after the arrival day") makes Saturday-night and Saturday-morning leads behave the same and gives odd edges at midnight. Filtering in JS after fetching every new lead is simpler, but it doesn't scale and duplicates the rule.
- **Threshold**: 2 working days, the owner's choice (spec Assumptions). The value is one constant, `REPLY_WINDOW_WORKING_HOURS = 48`.

## R3. Query shape: one `$facet` and two small indexed reads, run in parallel

- **Decision**:
  1. **Summary**: a single `Lead.aggregate`. The first stage is a narrowing `$match` with `$or: [{ createdAt ≥ earliestBoundary }, { status: "new" }, { status: "booked", statusChangedAt ≥ monthStart }]`, followed by one `$facet` with the sub-pipelines `newByType`, `week`, `booked`, `daily` and `topCourses`.
  2. **Lists**: `Lead.find` for the 8 newest (index `{ createdAt: -1 }`), plus `Lead.find` for `{ status: "new", createdAt: { $lt: cutoff } }` sorted oldest first, limit 4, with a `countDocuments` for the total (index `{ status: 1, createdAt: -1 }`).
  3. **Content**: three `countDocuments` (programs published, courses published, categories).

  All of these run in one `Promise.all` inside one `safeLoad`.
- **Rationale**: The description asks for "one aggregation for stats, chart and top courses; a second small query for recent and needs-attention". Sub-pipelines inside `$facet` can't use indexes, so the recent and overdue lists are kept out of the facet: as plain `find`s they use existing indexes and stay fast however many leads are stored. Together they are still the "second small query" step. The narrowing `$match` before `$facet` limits the facet's input to recent, new or recently booked leads.
- **Alternatives**: Putting everything in one `$facet` scans the whole collection for "recent". Making separate count queries per card means about 10 round trips.

## R4. Facet details

- `newByType`: `$match status:"new"` → `$group _id:"$type"`. This is the same number as the sidebar badges (`getNewCounts`, `src/lib/admin/leads-query.ts`), so the cards and badges always agree.
- `week`: `$match createdAt ≥ lastWeekStart` → `$group` on `$cond(createdAt ≥ weekStart, "this", "last")`. The week is Monday 00:00 to Sunday 24:00 Karachi time.
- `booked`: `$match status:"booked", statusChangedAt ≥ monthStart` → `$count`. Both types count. "Enrolled" is the course wording for the same stored value (`src/lib/admin/lead-status.ts`).
- `daily`: `$match createdAt ≥ chartStart` (Karachi midnight 13 days ago) → `$group { day: $dateToString(+05:00), type }`. Days with no leads are filled with zeros in a pure shaping function, so there are always 14 slots.
- `topCourses`: `$match type:"course", createdAt ≥ start30 (Karachi midnight 29 days ago), courseId ≠ "not-sure"` → `$sort createdAt:-1` → `$group _id:"$courseId", name: $first "$courseName", n` → `$sort n:-1, name:1` → `$limit 5`. The name is the newest stored snapshot (FR-018, spec US4-2). "Not sure yet" sign-ups are not a course (`src/lib/leads/category-snapshot.ts:18`), so they are excluded.
- **Change vs last week**: shown as a signed difference ("+2", "−1", "No change"). A percentage is never shown, so there is no division by zero (spec US2-3).

## R5. Mark contacted: reuse `setLeadStatus` with a self-hiding client row

- **Decision**: Call the existing `setLeadStatus({ id, type, status: "contacted" })` (`src/lib/admin/leads-actions.ts`). It is already wrapped by `withAdmin`, type-scoped, logged and covered by the admin guard test. A new client leaf, `AttentionItem`, takes `{ id, type, name }` plus the server-rendered row content as `children`. It hides itself optimistically with `useOptimistic`, then shows a toast (`useToast`) on success or the existing `useActionFeedback` message on failure. On failure the optimistic state falls away and the row comes back.
- **Rationale**: No new action means no new attack surface and no change to the guard test list. `refresh()` already revalidates `/admin` at layout level, so the dashboard numbers and sidebar badges update after the action. Following Principle XI, only the button and the hide state are client-side, and the row markup stays on the server.
- **Alternatives**: Reusing `RowStatus` as is. It keeps the row and swaps the chip, which is right for lists but wrong for a "to do" list. A client copy of the whole list was rejected because it would duplicate markup (Principle XI).

## R6. Opening a lead: the existing `?lead=` drawer

- **Decision**: Links are `leadsHref(type, { lead: id })` (`src/lib/admin/leads-params.ts`), for example `/admin/submissions/courses?lead=<id>`. The submissions pages already read `params.lead` and open `LeadDrawer`.
- **Rationale**: No new route, and only the opaque id goes in the URL (Principle V).

## R7. Route, dynamic rendering and a dashboard-shaped skeleton

- **Decision**: Move the page to `src/app/admin/(panel)/(home)/page.tsx` with its own `(home)/loading.tsx` (a skeleton in the dashboard's shape), and delete `(panel)/page.tsx`. The page calls `requireAdmin()` first and sets `export const dynamic = "force-dynamic"`.
- **Rationale**: A route group keeps the URL `/admin` while giving the page its own loading UI, without changing the generic `(panel)/loading.tsx` that the other pages use. The page is already dynamic because the session reads cookies. `force-dynamic` states the "never cached" requirement (FR-002) explicitly and protects it from future refactors.
- **Alternatives**: `<Suspense>` per section with streaming. Because one `safeLoad` serves every section, streaming gains little and would split the single read.

## R8. Chart: server-rendered SVG, royal and saffron, with a screen-reader table

- **Decision**: `LeadsChart` is a Server Component. It draws an inline `<svg viewBox>` that scales to the card width, with 14 stacked bars (workshop at the bottom in `fill-royal`, course on top in `fill-saffron`) separated by a 2px gap. Each day is a `<g role="img" aria-label="Tue 10 Nov: 2 workshop, 1 course">` with a `<title>` for hover. A visible legend sits above the chart. An `sr-only` `<table>` (Date, Workshop, Course, Total) follows. The y-axis has 3 gridlines with a "nice" max (1, 2, 5 × 10ⁿ). On the x-axis, every other day is labelled below 640px and every day above it. An empty state replaces the chart when all 14 days are zero.
- **Rationale**: No chart library is allowed (FR-015, Principle IX). Server rendering means no JavaScript for the chart. The colours are brand tokens (Principle III). Saffron is used as a fill, never as text. The series are told apart by position (always stacked in the same order), the legend, labels and the table, not by colour alone (FR-014).
- **Contrast note**: Saffron on white is below the 3:1 non-text contrast ratio. This is acceptable because the bar values are always available in the accessible labels and the table. The plan's browser check confirms the bars read clearly.
- **Alternatives**: A grouped (side-by-side) bar chart. With 28 bars it is too dense at 360px.

## R9. Greeting and dates

- **Decision**: These are computed on the server at request time in Karachi time, with pure helpers `greetingFor(now)` (05–11 morning, 12–16 afternoon, else evening) and `formatLongDate(now)` (for example "Wednesday, 11 November 2026" via `Intl` `en-GB`, `Asia/Karachi`). The name "Sheza" is a constant in the dashboard content module.
- **Rationale**: The page is dynamic, so the server time is current. A client clock would cause a hydration mismatch and add a client boundary for no benefit. The owner is in Karachi.

## R10. Relative ages

- **Decision**: `relativeDays(createdAt, now)` counts Karachi calendar days between the two dates: "today", "1 day ago", "N days ago". Recent activity shows the same, plus the time for today's leads ("today, 14:05"), using `Asia/Karachi`.
- **Rationale**: This matches the spec's "3 days ago". Overdue status uses working hours (R2), so a lead can read "2 days ago" and still not be overdue across a Sunday, as noted in the spec Assumptions.

## R11. Sidebar "Dashboard" entry

- **Decision**: Add `{ href: "/admin", label: "Dashboard", Icon: SquaresFour, isActive: (p) => p === "/admin" }` as the first entry in `ENTRIES` (`src/components/admin/AdminNav.tsx`). The active check is exact, because `under("/admin")` would match every page. The indicator positions (`TOPS`) are derived from `ENTRIES`, so they need no change.
- **Rationale**: This is the smallest change. Sidebar and TopBar both render `AdminNav`.

## R12. Testing approach

- **Unit (`node --test`)**: a pure `src/lib/admin/dashboard-time.ts` (boundaries, `workingMsBetween`, `subtractWorkingHours`, `greetingFor`, `relativeDays`, `chartDays`) and a pure `src/lib/admin/dashboard-shape.ts` (zero-filled series, week delta text, nice axis max, facet output → summary). Cases cover Karachi midnight vs UTC, Saturday → Monday, Sunday arrival, month start, Monday week start, and empty input.
- **Guard**: No new Server Action, so part A is unchanged. The dashboard page calls `requireAdmin()`. The quickstart checks that `/admin` redirects to `/admin/login` (307) when signed out.
- **Running app**: Seed a known set into `tareeq_dev` with a script (`scripts/dashboard-seed.mts`, dev database only, with refuse-on-production guard), compare against hand counts, then delete the seeded leads.
