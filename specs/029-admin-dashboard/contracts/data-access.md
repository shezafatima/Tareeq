# Contract: dashboard data access

## Pure modules (no server imports; loadable by `node --test`)

### `src/lib/admin/dashboard-time.ts`

```ts
export const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000;   // UTC+05:00, no DST (research R1)
export const KARACHI_TZ_OFFSET = "+05:00";              // the same offset, for MongoDB $dateToString
export const REPLY_WINDOW_WORKING_HOURS = 48;           // 2 working days (spec FR-006)

export function dashboardBounds(now: Date): DashboardBounds;
export function workingMsBetween(from: Date, to: Date): number;     // excludes Karachi Sundays; 0 if to <= from
export function subtractWorkingHours(now: Date, hours: number): Date;
export function isOverdue(createdAt: Date, now: Date): boolean;     // workingMsBetween > 48h
export function karachiDayKey(d: Date): string;                     // "YYYY-MM-DD"
export function chartDays(now: Date): { day: string; label: string }[]; // 14, oldest first
export function greetingFor(now: Date): "Good morning" | "Good afternoon" | "Good evening";
export function formatLongDate(now: Date): string;                  // "Wednesday, 11 November 2026"
export function relativeDays(then: Date, now: Date): string;        // "today" | "1 day ago" | "N days ago"
```

**Invariants (unit-tested)**:
- `isOverdue(c, now) === (c < subtractWorkingHours(now, 48))` for every pair `(c, now)` in the test grid.
- `karachiDayKey(new Date("2026-11-10T18:30:00Z")) === "2026-11-10"`, and `"2026-11-10T19:00:00Z"` gives `"2026-11-11"`.
- `dashboardBounds` for Wednesday 2026-11-11 10:00 Karachi: `weekStart` is Monday 2026-11-09 00:00 Karachi (2026-11-08T19:00Z), and `monthStart` is 2026-10-31T19:00Z.
- A lead arriving Saturday 18:00 is not overdue on Monday 09:00, and is overdue on Tuesday 18:01.
- A lead arriving Sunday 10:00 is not overdue on Tuesday 23:59, and is overdue on Wednesday 00:01.

### `src/lib/admin/dashboard-shape.ts`

```ts
export function toSummary(facet: FacetResult, now: Date): DashboardSummary; // zero-fills days, builds deltaText
export function weekDeltaText(thisWeek: number, lastWeek: number): string;  // "+2 vs last week" | "−1 vs last week" | "No change vs last week"
export function niceMax(n: number): number;                                 // 0→1, 3→5, 7→10, 12→20, 45→50
```

`FacetResult` is the raw output of the aggregation's single document: `{ newByType: {_id, n}[], week: {_id: "this"|"last", n}[], booked: {n}[], daily: {_id: {day, type}, n}[], topCourses: {_id, name, n}[] }`. Every array may be empty.

## Server module

### `src/lib/admin/dashboard-query.ts` (`import "server-only"`)

```ts
export async function getDashboardData(now?: Date): Promise<DashboardData>;
```

- Calls `connectDb()`, then runs one `Promise.all`:
  1. `Lead.aggregate([narrowingMatch, { $facet: {...} }])` (research R3/R4).
  2. `Lead.find({}).sort({ createdAt: -1 }).limit(8).select("type fullName status createdAt organization courseName").lean()`.
  3. `Lead.find({ status: "new", createdAt: { $lt: cutoff } }).sort({ createdAt: 1 }).limit(4).select("type fullName createdAt").lean()`.
  4. `Lead.countDocuments({ status: "new", createdAt: { $lt: cutoff } })`.
  5. `Program.countDocuments({ published: true })`, `Course.countDocuments({ published: true })`, `CourseCategory.countDocuments({})`.
- Shapes the results with the pure modules and returns only serialisable data: strings and numbers, no `Date`, `ObjectId` or Mongoose document.
- **Errors**: throws on any database failure. The page wraps the call in `safeLoad` and shows `UnavailableNotice`. Nothing is logged here, and `safeLoad` logs the error name only.
- **Privacy**: projections never include phone, email, message, notes, consent or notification (FR-023).

## Write path (existing, unchanged)

`setLeadStatus({ id, type, status: "contacted" })`, from `src/lib/admin/leads-actions.ts`.

| Result | Dashboard behaviour |
|---|---|
| `{ ok: true }` | Row stays hidden, toast "Marked contacted". The layout revalidates, so the cards and badges update. |
| `{ ok:false, code:"unauthorized" }` | Row comes back, existing "signed out" feedback (`useActionFeedback`) |
| `{ ok:false, code:"not_found" }` | Row comes back, existing "not found" feedback. The next render drops it if it was deleted. |
| `{ ok:false, code:"invalid" \| "unavailable" }` | Row comes back, existing error feedback: "Couldn't update the status" |
