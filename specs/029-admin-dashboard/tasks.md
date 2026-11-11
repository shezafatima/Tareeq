---
description: "Task list for 029-admin-dashboard"
---

# Tasks: Admin dashboard home

**Input**: Design documents from `/specs/029-admin-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md (R1–R12), data-model.md, contracts/ (data-access.md, routes-and-ui.md), quickstart.md

**Tests**: Included. The plan (research R12, milestone 1) asks for unit tests of the pure date and shaping modules, because counting by Karachi day and by working hours is easy to get subtly wrong. Unit tests use `node --test` in `tests/unit/*.test.ts` and import pure modules by **relative** path with `.ts` extensions (as in `tests/unit/settings-merge.test.ts`). The admin guard test needs no change, because no new Server Action is added.

**Organization**: Tasks are grouped by user story in spec order.
- **US1**: needs attention + greeting (P1)
- **US2**: stat cards (P2)
- **US3**: chart + recent activity (P2)
- **US4**: top courses + content summary (P3)

Every story depends only on the Foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US4 from spec.md

## Conventions every task must follow

- **Read the file first.** Read an existing file before changing it, and keep its comment style (a short header comment citing the spec and research ids, e.g. `// specs/029-admin-dashboard research R2`).
- **Pure modules use relative imports only.** `src/lib/admin/dashboard-time.ts` and `src/lib/admin/dashboard-shape.ts` use relative imports with `.ts` extensions (e.g. `import { leadsHref } from "./leads-params.ts"`), with no `server-only` and no `@/` alias.
- **Server modules start with `import "server-only";`** (`dashboard-query.ts`).
- **Serialisable props only.** Components receive strings and numbers, never `Date`, `ObjectId` or Mongoose documents.
- **Privacy (FR-023).** Never select or render phone, email, message, adminNotes, consent or notification. Only opaque ids go in URLs.
- **Styling and motion.** Use brand tokens only (`bg-soft`, `text-midnight`, `fill-royal`, `fill-saffron`, `ring-midnight/10`), with no hex values. Saffron is never used for text. Touch targets are at least 44px (`min-h-11`). Use `min-w-0 truncate` on long text. The only motion is `CountUp`, which is already skipped under reduced motion.
- **`"use client"` goes only on `AttentionItem.tsx`**, with a one-line reason comment. Reuse the existing `CountUp`, and add no other client components.
- **No new dependencies.** Don't touch the public site, the hero, the tokens, or `leads-actions.ts`.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline.

- [X] T001 Record the baseline on branch `029-admin-dashboard`:
  - Run `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build` and `npm run test:admin-guard -- --no-http`.
  - Write the results, the unit test count (expected 198) and the guard test's action count to `specs/029-admin-dashboard/verification.md` (new file, section "Baseline").

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Pure date and shaping logic with tests, the data read, the route and its skeleton, the shared card shell and type chip, the sidebar entry, and the seed script. Every story depends on these.

**⚠️ CRITICAL**: No user story work starts until this phase is done.

- [X] T002 [P] Create `src/lib/admin/dashboard-time.ts` (pure, no imports from server code), per contracts/data-access.md and research R1, R2, R9 and R10.
  - Export the constants: `KARACHI_OFFSET_MS = 5*60*60*1000`, `KARACHI_TZ_OFFSET = "+05:00"`, `REPLY_WINDOW_WORKING_HOURS = 48`.
  - Export `type DashboardBounds` (data-model.md) and the functions below.
  - Shift-and-read helper: `const k = (d: Date) => new Date(d.getTime() + KARACHI_OFFSET_MS)`, then read the `getUTC*` fields. Build Karachi midnight as `Date.UTC(y,m,d) - KARACHI_OFFSET_MS`.
  - `karachiDayKey(d)` → `"YYYY-MM-DD"`.
  - `dashboardBounds(now)` returns:
    - `todayStart`
    - `chartStart` = todayStart − 13 days
    - `weekStart` = most recent Karachi Monday 00:00 (`(getUTCDay()+6)%7` days back)
    - `lastWeekStart` = weekStart − 7 days
    - `monthStart` = Karachi 1st 00:00
    - `start30` = todayStart − 29 days
    - `overdueCutoff` = `subtractWorkingHours(now, 48)`
  - `workingMsBetween(from, to)` → milliseconds in `[from, to)`, minus the part of every Karachi Sunday (00:00–24:00) that falls inside the range. Returns 0 when `to <= from`. Walk Karachi day by day; the range is short.
  - `subtractWorkingHours(now, hours)` walks back from `now`, skipping Sunday spans, until `hours` of working time is used. If `now` is inside a Sunday, start from that Sunday's 00:00.
  - `isOverdue(createdAt, now)` = `workingMsBetween(createdAt, now) > hours*3600000`.
  - `chartDays(now)` returns 14 `{ day, label }`, oldest first. The label comes from `Intl.DateTimeFormat("en-GB", { weekday:"short", day:"numeric", month:"short", timeZone:"Asia/Karachi" })` with commas removed, giving "Tue 10 Nov".
  - `greetingFor(now)`: Karachi hour 5–11 → "Good morning", 12–16 → "Good afternoon", else "Good evening".
  - `formatLongDate(now)` → "Wednesday, 11 November 2026" (`en-GB`, `Asia/Karachi`, weekday long, day numeric, month long, year numeric). Normalise it so the output is exactly "Weekday, D Month YYYY".
  - `relativeDays(then, now)`: difference of Karachi day keys in whole days. 0 → "today", 1 → "1 day ago", n → "n days ago".
  - `karachiTime(d)` → "14:05" (`en-GB`, `hour:"2-digit", minute:"2-digit", hourCycle:"h23"`, `Asia/Karachi`).

- [X] T003 [P] Create `tests/unit/dashboard-time.test.ts` covering:
  - `karachiDayKey`: `2026-11-10T18:30:00Z` → `"2026-11-10"`; `2026-11-10T19:00:00Z` → `"2026-11-11"`.
  - `dashboardBounds` at `2026-11-11T05:00:00Z` (Wednesday 10:00 Karachi): `weekStart` = `2026-11-08T19:00:00Z`, `lastWeekStart` = `2026-11-01T19:00:00Z`, `monthStart` = `2026-10-31T19:00:00Z`, `todayStart` = `2026-11-10T19:00:00Z`, `chartStart` = `2026-10-28T19:00:00Z`, `start30` = `2026-10-12T19:00:00Z`.
  - On a Monday 00:30 Karachi, `weekStart` is that same Monday 00:00. On a Sunday 23:00 Karachi, it is the Monday six days earlier.
  - Overdue (Karachi local times converted to UTC in the test):
    - Arrival Saturday 2026-11-07 18:00: not overdue at Monday 2026-11-09 09:00 or at Tuesday 2026-11-10 18:00 exactly; overdue at Tuesday 18:01.
    - Arrival Sunday 2026-11-08 10:00: not overdue at Tuesday 23:59; overdue at Wednesday 2026-11-11 00:01.
    - Arrival Wednesday 10:00: overdue at Friday 10:01.
  - Invariant: for a grid of arrivals (every 5 hours over 3 weeks) and `now` values (every 7 hours over the same span), `isOverdue(c, now) === (c < subtractWorkingHours(now, 48))`.
  - `workingMsBetween` of a range lying entirely within a Sunday → 0.
  - `chartDays(2026-11-11T05:00Z)`: length 14, first `day` `"2026-10-29"`, last `"2026-11-11"`, last label `"Wed 11 Nov"`.
  - `greetingFor` at Karachi 04:59 → evening, 05:00 → morning, 11:59 → morning, 12:00 → afternoon, 16:59 → afternoon, 17:00 → evening, 01:00 → evening.
  - `formatLongDate(2026-11-11T05:00Z)` → `"Wednesday, 11 November 2026"`.
  - `relativeDays`: same Karachi day → "today"; `2026-11-10T18:59Z` vs `2026-11-10T19:01Z` → "1 day ago" (crosses Karachi midnight); 3 days → "3 days ago".

- [X] T004 [P] Create `src/lib/admin/dashboard-shape.ts` (pure; imports only `./dashboard-time.ts`, `./leads-params.ts` and types), per data-model.md and contracts/data-access.md.
  - Export the types `FacetResult`, `DaySeries`, `DashboardSummary`, `AttentionRow`, `RecentRow`, `TopCourse`, `ContentCounts`, `DashboardData`.
  - `weekDeltaText(thisWeek, lastWeek)` → `"+2 vs last week"`, `"−1 vs last week"` (U+2212 minus) or `"No change vs last week"`.
  - `niceMax(n)`: the smallest of 1, 2, 5 × 10ᵏ that is ≥ n. `niceMax(0)` = 1.
  - `toSummary(facet, now)`:
    - `newCounts` defaults to 0 per type.
    - `week` is built from `"this"` and `"last"` rows, with `delta` and `deltaText`.
    - `bookedThisMonth` = `facet.booked[0]?.n ?? 0`.
    - `daily` maps `chartDays(now)` and fills workshop and course from `facet.daily`, with 0 when missing.
    - `topCourses` maps `{ _id, name, n }` → `{ courseId, name, count }`, preserving the order.
  - `toAttentionRow(raw, now)` and `toRecentRow(raw, now)`:
    - `raw` is `{ _id: {toString()}, type, fullName, createdAt: Date, status?, organization?, courseName? }`.
    - `age`/`when` comes from `relativeDays`. For a recent row on the same day, `when` = `"today, " + karachiTime(createdAt)`.
    - `context`: course → `courseName || "—"`; workshop → `organization || "—"`.
    - `href` = `leadsHref(type, { lead: id })` on both `AttentionRow` and `RecentRow`.

- [X] T005 [P] Create `tests/unit/dashboard-shape.test.ts` covering:
  - `weekDeltaText(6,4)` → "+2 vs last week"; `(3,0)` → "+3 vs last week"; `(2,3)` → "−1 vs last week"; `(4,4)` → "No change vs last week".
  - `niceMax`: 0→1, 1→1, 3→5, 7→10, 12→20, 45→50, 100→100.
  - `toSummary` with an all-empty facet: zeros everywhere, 14 daily entries, `topCourses` `[]`.
  - `toSummary` with sample rows: day `"2026-11-10"` workshop 2, course 1 lands on that entry; others stay 0; the week delta is right.
  - `toRecentRow`: a course row uses `courseName`, a workshop row with an empty organization gives `"—"`, `href` is `/admin/submissions/courses?lead=<id>`, and a same-day `when` starts with "today, ".
  - Neither output includes keys such as `phone` or `email`, even when `raw` contains them (assert with `Object.keys`).

- [X] T006 Create `src/lib/admin/dashboard-query.ts` (`import "server-only"`), exporting `getDashboardData(now = new Date()): Promise<DashboardData>`, per contracts/data-access.md and research R3/R4.
  - `await connectDb()`, then `const b = dashboardBounds(now)` and one `Promise.all`:
    1. `Lead.aggregate([...])`:
       - First a `$match` with `$or: [{ createdAt: { $gte: min(b.lastWeekStart, b.start30, b.chartStart) } }, { status: "new" }, { status: "booked", statusChangedAt: { $gte: b.monthStart } }]`.
       - Then `$facet` with:
         - `newByType`: `$match status:"new"`, `$group _id:"$type", n:{$sum:1}`.
         - `week`: `$match createdAt ≥ lastWeekStart`, `$group _id:{ $cond:[{ $gte:["$createdAt", b.weekStart] }, "this", "last"] }`, n.
         - `booked`: `$match status:"booked", statusChangedAt ≥ monthStart`, `$count:"n"`.
         - `daily`: `$match createdAt ≥ chartStart`, `$group _id:{ day:{ $dateToString:{ format:"%Y-%m-%d", date:"$createdAt", timezone: KARACHI_TZ_OFFSET } }, type:"$type" }`, n.
         - `topCourses`: `$match type:"course", createdAt ≥ start30, courseId:{ $ne:"not-sure" }`, `$sort createdAt:-1`, `$group _id:"$courseId", name:{ $first:"$courseName" }, n`, `$sort { n:-1, name:1 }`, `$limit 5`.
    2. `Lead.find({}).sort({ createdAt: -1 }).limit(8).select("type fullName status createdAt organization courseName").lean()`.
    3. `Lead.find({ status: "new", createdAt: { $lt: b.overdueCutoff } }).sort({ createdAt: 1 }).limit(10).select("type fullName createdAt").lean()`.
    4. `Lead.countDocuments({ status: "new", createdAt: { $lt: b.overdueCutoff } })`.
    5. `Program.countDocuments({ published: true })`, `Course.countDocuments({ published: true })`, `CourseCategory.countDocuments({})`.
  - Import the models from `@/lib/leads/model`, `@/lib/programs/model` and `@/lib/courses/model`, after checking their export names.
  - Shape everything with `dashboard-shape.ts`. Return `{ summary, attention: { rows, total }, recent, content }`.
  - Throw on failure (the page uses `safeLoad`). Don't log here.

- [X] T007 Move the route, per contracts/routes-and-ui.md and research R7.
  - Delete `src/app/admin/(panel)/page.tsx` (the temporary redirect).
  - Create `src/app/admin/(panel)/(home)/page.tsx`:
    - `export const dynamic = "force-dynamic"` and `export const metadata = { title: "Dashboard" }`.
    - `await requireAdmin()` first, then `const now = new Date()` and `const loaded = await safeLoad(() => getDashboardData(now))`.
    - Render `<Greeting>` (T010). When `!loaded.ok`, render `<UnavailableNotice />` under it and stop.
    - Otherwise render a placeholder `<div className="grid gap-4 lg:grid-cols-12 lg:gap-6">` with comment slots for the panels that later tasks fill in.
  - Run `npm run build` and confirm `/admin` is listed as dynamic (ƒ) and only one route serves `/admin`.

- [X] T008 [P] Create `src/app/admin/(panel)/(home)/loading.tsx`: a dashboard-shaped skeleton using `Skeleton`, wrapped in `role="status" aria-label="Loading"`. It contains:
  - a greeting bar (`h-9 w-64`)
  - a 12-column grid with an attention block (`lg:col-span-5 h-64`) and a 2×2 stat grid (`lg:col-span-7`, 4 × `h-28`)
  - a chart block (`lg:col-span-7 h-72`) and a recent block (`lg:col-span-5 h-72`)
  - two lower blocks (`lg:col-span-6 h-56`)
  - single column below `lg`

- [X] T009 [P] Create `src/components/admin/dashboard/DashboardCard.tsx` (server). It takes props `{ title: string; action?: ReactNode; className?: string; children }` and renders `<section aria-labelledby={id} className={cn("rounded-2xl bg-soft p-4 shadow-sm ring-1 ring-midnight/10 sm:p-5", className)}>`. Inside are a header row (an `h2 id` in `font-heading text-lg font-semibold text-midnight`, plus an optional `action` on the right) and `children`. The id comes from `useId()`; it is allowed in Server Components.

- [X] T010 [P] Create `src/components/admin/dashboard/Greeting.tsx` (server).
  - Props: `{ greeting: string; name: string; date: string }`.
  - Renders the page's single `<h1 className="font-heading text-2xl font-bold text-midnight">{greeting}, {name}</h1>` and a `<p className="text-sm text-midnight/70">{date}</p>`.
  - Add `export const OWNER_NAME = "Sheza"` in `src/lib/admin/dashboard-time.ts`, or in a small constant at the top of the page. Document the choice (spec Assumptions).

- [X] T011 [P] Create `src/components/admin/dashboard/TypeChip.tsx` (server): `{ type: LeadType }` → `<StatusChip label={type === "workshop" ? "Workshop" : "Course"} tone={type === "workshop" ? "royal" : "sky"} />`.

- [X] T012 [P] Add the "Dashboard" entry in `src/components/admin/AdminNav.tsx`.
  - Import `SquaresFour` from `@phosphor-icons/react/dist/ssr`.
  - Insert `{ kind: "link", href: "/admin", label: "Dashboard", Icon: SquaresFour, isActive: (p) => p === "/admin" }` as `ENTRIES[0]`, before the "Submissions" heading. Leave `TOPS` as is; it is derived.
  - Check the sliding indicator lands correctly on `/admin` and on the other pages.

- [X] T013 [P] Create `scripts/dashboard-seed.mts`, run with `npx tsx --conditions=react-server scripts/dashboard-seed.mts [--remove]`. Load `.env.local` the way `scripts/leads-check.mjs` or `seed-programs.ts` does.
  - **Guard**: after connecting, refuse and exit 1 unless `mongoose.connection.db.databaseName` ends with `_dev`.
  - **Insert** with `Lead.collection.insertMany`, setting `createdAt`, `updatedAt` and `statusChangedAt` explicitly. Every doc has `ref: "DASH-<n>"`, a unique `submissionKey`, valid consent and notification fields, and fake names "Test Lead N". The set follows quickstart §3, with dates computed from `dashboardBounds(new Date())`:
    - 2 overdue new leads (a workshop 6 days ago; a course from last Saturday 18:00 Karachi, or 4+ working days ago, whichever is older)
    - 1 new lead from yesterday
    - 1 overdue contacted lead
    - leads on 6 of the last 14 days, including one at 23:30 Karachi time
    - course leads for 6 distinct real course ids (read from `Course.find().limit(6)`, falling back to fake ids with the names "Seed Course A–F")
    - 1 course lead 40 days ago
    - 1 workshop booked and 1 course booked this month
  - **Print** the expected numbers, computed from the inserted set with the same rules: new per type, this and last week, booked this month, overdue total, top 5.
  - **`--remove`** deletes `{ ref: /^DASH-/ }` and prints the count.

**Checkpoint**: run `npm run test:unit` (all pass, +2 files) and `npm run build`. Open `/admin` signed in: the greeting shows, the sidebar shows "Dashboard" as active, and the skeleton appears on a slow load. Signed out: 307 → `/admin/login`.

---

## Phase 3: User Story 1 - See who is waiting too long and act (Priority: P1) 🎯 MVP

**Goal**: Overdue new leads of both types, oldest first, with one-tap "Mark contacted" and a link that opens the drawer. "You're all caught up." when there are none.

**Independent Test**: With the seed loaded, only the 2 overdue new leads are listed. "Mark contacted" removes a row and lowers the badge. "Open" goes to the right submissions page with the drawer open. With the database stopped, the action shows an error and the row comes back.

- [X] T014 [US1] Create `src/components/admin/dashboard/AttentionItem.tsx` with `"use client"` and the comment `// needs optimistic state, a transition and the toast (research R5)`.
  - Props: `{ id: string; type: LeadType; name: string; children: ReactNode }`.
  - Use `useOptimistic(false)` for `hidden`, plus `useTransition`, `useToast()` and `useActionFeedback()`, the same way `RowStatus.tsx` does.
  - On click: `startTransition(async () => { setHidden(true); const r = await setLeadStatus({ id, type, status: "contacted" }); r.ok ? toast.success("Marked contacted") : fail(r, "update the status"); })`.
  - When hidden, return `null`.
  - Otherwise render `<li className="flex items-center gap-3 py-3">`, containing a `<div className="min-w-0 flex-1">{children}</div>` and a button.
  - The button: `type="button"`, `disabled={pending}`, `aria-label={\`Mark ${name} contacted\`}`, with the same classes as the `RowStatus` button (`min-h-11`).

- [X] T015 [US1] Create `src/components/admin/dashboard/NeedsAttention.tsx` (server). Props: `{ rows: AttentionRow[]; total: number }`.
  - Wrap it in `DashboardCard` with the title "Needs attention" and a subtitle line: "New leads waiting more than 2 working days".
  - **Empty**: `<EmptyState icon={CheckCircle} title="You're all caught up." />`.
  - **Otherwise**: a `<ul className="divide-y divide-midnight/10">` where each row is `<AttentionItem id type name>`. Its children are:
    - a line with the name (`font-semibold truncate`), `TypeChip` and age (`text-sm text-midnight/70`)
    - an "Open" `Link` to `row.href`, with `aria-label={\`Open ${name}\`}`, `min-h-11 inline-flex items-center`, and the sky link style
  - When `total > rows.length`, add a footer: "Showing {rows.length} of {total}", plus links to "All new workshop requests" (`leadsHref("workshop", { status: "new" })`) and "All new course registrations".

- [X] T016 [US1] In `src/app/admin/(panel)/(home)/page.tsx`, render `<NeedsAttention rows={data.attention.rows} total={data.attention.total} className="lg:col-span-5" />`. Pass `className` through to `DashboardCard`. Pass the greeting props from `greetingFor(now)`, `OWNER_NAME` and `formatLongDate(now)`.

**Checkpoint (quickstart §4 rows "Greeting" and "Needs attention", §5)**: seed, sign in, check the list against the seed output, mark one contacted (the row disappears, then a toast, then the badge goes down by 1 after the refresh), and run the database-stopped failure path. Check at 390px and 1440px.

---

## Phase 4: User Story 2 - Read the numbers at a glance (Priority: P2)

**Goal**: Four stat cards with count-up, each linking to its filtered list. The week card shows the signed change.

**Independent Test**: The numbers match the seed script's printed expectations, the links open the right filters, and with reduced motion on the final numbers show immediately.

- [X] T017 [P] [US2] Create `src/components/admin/dashboard/DashboardStats.tsx` (server). Props: `{ summary: DashboardSummary; className?: string }`.
  - Render `<ul aria-label="Lead numbers" className="grid grid-cols-2 gap-3 sm:gap-4">` with 4 `<li>`, each a `Link` card in the `StatStrip` style: `block min-h-11 rounded-2xl bg-soft p-4 shadow-sm ring-1 ring-midnight/10 hover:shadow-md transition-[box-shadow] duration-150`.
  - Each card has a label (`text-sm font-semibold`) and `<CountUp value={n} className="mt-2 block font-heading text-3xl font-bold" />`.
  - The cards and links (contracts/routes-and-ui.md):
    - "New workshop requests" → `leadsHref("workshop", { status: "new" })`
    - "New course registrations" → `leadsHref("course", { status: "new" })`
    - "Leads this week" → `leadsHref("workshop", {})`, with an extra `<p className="mt-1 text-xs text-midnight/70">` containing an `aria-hidden` `TrendUp`, `TrendDown` or `Minus` icon followed by `deltaText`
    - "Booked / enrolled this month" → `leadsHref("workshop", { status: "booked" })`

- [X] T018 [US2] Render `<DashboardStats summary={data.summary} className="lg:col-span-7" />` in `page.tsx`, beside `NeedsAttention`.

**Checkpoint (quickstart §4 rows "Cards" and "Week delta")**: compare with the seed output. Click each card. Turn on reduced motion and confirm the numbers don't count up.

---

## Phase 5: User Story 3 - See the trend and recent activity (Priority: P2)

**Goal**: The 14-day stacked SVG chart with accessible labels and an `sr-only` table, and the 8 most recent leads, each row opening its drawer.

**Independent Test**: The 23:30 Karachi seed lead is counted on its Karachi day. Zero days keep their slot. The accessibility tree exposes "Tue 10 Nov: 2 workshop, 1 course" and the table. The recent list shows 8, newest first, and each row opens the right drawer.

- [X] T019 [P] [US3] Create `src/components/admin/dashboard/LeadsChart.tsx` (server), per research R8. Props: `{ daily: DaySeries[]; className?: string }`.
  - Wrap it in `DashboardCard` with the title "Leads, last 14 days".
  - **Empty**: if the total is 0, show `<EmptyState icon={ChartBar} title="No leads in the last 14 days" />`.
  - **Otherwise**, render the parts below.
  - **Legend**: a `<ul>` above the chart with two items, a `size-3 rounded-sm bg-royal` swatch with "Workshop" and a `bg-saffron` swatch with "Course". The swatches are `aria-hidden`.
  - **SVG**: `<svg viewBox="0 0 W H" className="h-56 w-full" role="group" aria-label="Daily leads, last 14 days">` with W=560, H=220, and an inner plot area with padding for axis labels.
    - `max = niceMax(max total)`.
    - 3 horizontal gridlines at 0, max/2 and max (`stroke-midnight/10`), with y labels (`fill-midnight/60 text-[10px]`).
    - Per day, a `<g role="img" aria-label={\`${label}: ${w} workshop, ${c} course\`}>` holding a `<title>` with the same text and, for a zero day, the label "{label}: 0 leads".
    - Workshop rect at the bottom (`fill-royal`), course rect above it (`fill-saffron`) with a 2px gap. Use `rx=3` on the top segment. Bar width is about 60% of the slot.
    - X labels show the day number. Every other day carries `className="max-sm:hidden"`, so labels alternate below 640px.
  - **Table**: an `sr-only` `<table>` with `<caption>Daily leads, last 14 days</caption>` and the columns Date, Workshop, Course, Total.
  - The chart uses no client code and no hex values. Use Tailwind `fill-*` and `stroke-*` token classes; check they exist in the theme, and add nothing to tokens.

- [X] T020 [P] [US3] Create `src/components/admin/dashboard/RecentActivity.tsx` (server). Props: `{ rows: RecentRow[]; className?: string }`.
  - Wrap it in `DashboardCard` with the title "Recent activity".
  - **Empty**: `<EmptyState icon={Tray} title="No submissions yet" />`.
  - **Otherwise**: a `<ul className="divide-y divide-midnight/10">`. Each `<li className="relative py-3">` contains:
    - a stretched `Link` (`href={row.href}`, with `after:absolute after:inset-0` and a visible focus ring) whose text is the name (`font-semibold truncate`)
    - a meta line with `TypeChip`, context (`truncate text-sm text-midnight/70`), `StatusChip` (`label={statusLabels(row.type)[row.status]}`, `tone={LEAD_STATUS_TONE[row.status]}`) and `when`
  - Every row is at least 44px tall.

- [X] T021 [US3] In `page.tsx`, render `<LeadsChart daily={data.summary.daily} className="lg:col-span-7" />` and `<RecentActivity rows={data.recent} className="lg:col-span-5" />`.

**Checkpoint (quickstart §4 rows "Chart", "Chart for screen readers" and "Recent")**: check day placement against the seed and inspect the accessibility tree in DevTools. Click 2 recent rows of different types. At 360px there is no overflow and the x labels alternate.

---

## Phase 6: User Story 4 - Top courses and content summary (Priority: P3)

**Goal**: The top 5 courses over 30 days (by the stored name) and the content counts with quick actions.

**Independent Test**: With the seed loaded, 5 courses are listed in count order and the 40-day-old registration isn't counted. The content counts match the published programs and courses and the categories, and every link works.

- [X] T022 [P] [US4] Create `src/components/admin/dashboard/TopCourses.tsx` (server). Props: `{ rows: TopCourse[]; className?: string }`.
  - Wrap it in `DashboardCard` with the title "Top courses, last 30 days".
  - **Empty**: `<EmptyState icon={GraduationCap} title="No course registrations in the last 30 days" />`.
  - **Otherwise**: an `<ol>` where each item is a `Link` to `leadsHref("course", { course: row.courseId })` (`min-h-11`). It shows the name (`truncate`), the count ("{n} registrations" / "1 registration") and an `aria-hidden` bar: `h-1.5 rounded-full bg-royal` with `style={{ width: \`${(n / rows[0].count) * 100}%\` }}`. That inline width is the one allowed inline style; it is a data value, not a colour.

- [X] T023 [P] [US4] Create `src/components/admin/dashboard/ContentSummary.tsx` (server). Props: `{ content: ContentCounts; className?: string }`.
  - Wrap it in `DashboardCard` with the title "Content".
  - A `<ul className="grid grid-cols-3 gap-3">` of 3 count links: "Published programs" → `/admin/programs`, "Published courses" → `/admin/courses`, "Categories" → `/admin/courses/categories`. Each shows a number (`font-heading text-2xl font-bold`, with no count-up, to keep motion to the stat cards) and a label.
  - Below, a `flex flex-wrap gap-2` row of 3 quick-action links styled as buttons (`min-h-11`): "New program" → `/admin/programs/new` (Plus icon), "New course" → `/admin/courses/new`, and "Settings" → `/admin/settings` (GearSix icon). Icons are `aria-hidden`.

- [X] T024 [US4] In `page.tsx`, render `<TopCourses rows={data.summary.topCourses} className="lg:col-span-6" />` and `<ContentSummary content={data.content} className="lg:col-span-6" />`. Remove the placeholder comments. The final order in the DOM matches the spec order (greeting, attention, stats, chart, recent, top courses, content), so the single-column mobile order is correct with no `order-*` classes.

**Checkpoint (quickstart §4 rows "Top courses" and "Content")**: check against the seed output and the admin lists.

---

## Phase 7: Polish & cross-cutting concerns

- [X] T025 Run `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build` and `npm run test:admin-guard`.
  - Record the results in `specs/029-admin-dashboard/verification.md`.
  - Expect: the unit count = baseline + the new tests, the guard test's action count unchanged, and `/admin` dynamic (ƒ).
  - Grep `src/components/admin/dashboard` and `dashboard-query.ts` for `phone`, `email`, `message` and `adminNotes`. There should be no matches (FR-023).
- [ ] T026 Walk through `quickstart.md` §2–§6 in a real browser at 360px, 390px and 1440px (Principle VII), with the seed loaded. Record pass or fail per row in `verification.md`, including no horizontal scroll, 44px targets, the empty state on an empty database, and the unavailable notice with the database stopped.
- [ ] T027 Accessibility pass on `/admin`, recorded in `verification.md`:
  - one H1, an `h2` per card, a keyboard-only walk through every link and button with visible focus
  - the chart's `aria-label`s and the `sr-only` table read correctly in the accessibility tree
  - "Mark contacted" announces through the toast
  - the numbers are static with reduced motion on
  - saffron bars are readable (research R8 risk: if not, switch the course series to `fill-sky` and note it)
- [ ] T028 Clean up: run `npx tsx --conditions=react-server scripts/dashboard-seed.mts --remove`, confirm 0 `DASH-` leads remain, then grep `src/` for `until the dashboard` and remove or reword any leftover comments about the temporary redirect.
- [ ] T029 End of feature (one feature per branch): commit, merge `029-admin-dashboard` into `main`, delete the branch, and confirm `git status` is clean on `main`.

---

## Phase 8: Founder's note (added after the first review; US5, spec FR-025)

- [X] T030 [US5] Add `karachiDayNumber` to `src/lib/admin/dashboard-time.ts`, and create `src/lib/admin/founder-quotes.ts`: 40 original notes in the founder's voice and `quoteOfTheDay(now)`, which walks the list with a step that shares no factor with its length.
- [X] T031 [US5] Create `tests/unit/founder-quotes.test.ts`: list size and length, no repeats, full cycle, neighbouring days differ, the same all day, changes at Karachi midnight (19:00 UTC).
- [X] T032 [US5] Create `src/components/admin/dashboard/FounderNote.tsx` (its own warm card: soft saffron glow, a gently beating heart, "Just for you, Sheza", brand tokens only; the beat is in `globals.css` and stops under reduced motion) and render it under the greeting in `src/app/admin/(panel)/(home)/page.tsx`, outside the data check so it shows even when the numbers cannot load.

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T013)** → US1, US2, US3 and US4 can each start.
- **Within Foundational**:
  - T002 → T003 and T004.
  - T004 → T005 and T006.
  - T006 → T007.
  - T009, T010 and T011 are independent of the lib tasks.
  - T007 needs T010 (Greeting).
  - T013 needs T002.
- **US1**: T014 → T015 → T016. T015 needs T009, T011 and T004.
- **US2**: T017 → T018.
- **US3**: T019 and T020 in parallel → T021.
- **US4**: T022 and T023 in parallel → T024.
- **The page.tsx tasks** (T016, T018, T021, T024) all edit the same file, so do them one after another.
- **Polish** comes after all stories. T029 is last.

## Parallel Opportunities

- **Phase 2**: T002, T009, T010, T011, T012 and T013 touch different files. After T002: T003 ∥ T004. After T004: T005 ∥ T006. T008 is independent.
- **Across stories**: the components T014/T015, T017, T019, T020, T022 and T023 are all separate files and can be built in parallel. Only their `page.tsx` wiring tasks are sequential.

```text
# Component fan-out after Phase 2:
T014+T015 NeedsAttention | T017 DashboardStats | T019 LeadsChart | T020 RecentActivity | T022 TopCourses | T023 ContentSummary
# then wire one at a time: T016 → T018 → T021 → T024
```

## Implementation Strategy

- **MVP**: Foundational + US1. `/admin` greets the owner and shows overdue leads with "Mark contacted". That alone fixes the "who's waiting" problem and removes the redirect.
- **Then US2 → US3 → US4**, in priority order. Each adds one or two panels to the grid and can be shown on its own.
- **Stop at each phase checkpoint** and check in the browser at 390px and 1440px before moving on (Principle VII).
- **At the end**: commit, merge into `main`, delete the branch, and leave `main` clean.
