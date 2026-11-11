# Data model: Admin dashboard home

No schema changes, no new collections, no migration. Everything is read from existing collections. The only write is the existing status change.

## Stored (existing, read)

| Collection | Fields used | Index used |
|---|---|---|
| `leads` (both types) | `_id`, `type`, `fullName`, `status`, `statusChangedAt`, `createdAt`; workshop `organization`; course `courseId`, `courseName` | `{createdAt:-1}`, `{status:1, createdAt:-1}`, `{type:1, status:1, createdAt:-1}` |
| `programs` | `published` | `{published:1, order:1}` |
| `courses` | `published` | `{published:1, …}` |
| `coursecategories` | (count only) | `_id` |

Never read for the dashboard: `phone`, `email`, `message`, `adminNotes`, `consent`, `notification`. Projections list only the fields above (FR-023).

## Stored (existing, written)

- `leads.status` → `"contacted"` and `leads.statusChangedAt` → now, through the existing `setLeadStatus` and only for `{ _id, type }`. There is no other write.

## Derived (computed per request, never stored)

```ts
// src/lib/admin/dashboard-shape.ts (pure, serialisable)
type LeadType = "workshop" | "course";

type DashboardBounds = {        // from dashboard-time.ts, all UTC Dates
  now: Date;
  todayStart: Date;             // Karachi 00:00 today
  chartStart: Date;             // todayStart − 13 days
  weekStart: Date;              // Karachi Monday 00:00
  lastWeekStart: Date;          // weekStart − 7 days
  monthStart: Date;             // Karachi 1st 00:00
  start30: Date;                // todayStart − 29 days
  overdueCutoff: Date;          // subtractWorkingHours(now, 48)
};

type DaySeries = { day: string /* YYYY-MM-DD Karachi */; label: string /* "Tue 10 Nov" */; workshop: number; course: number };

type DashboardSummary = {
  newCounts: Record<LeadType, number>;
  week: { thisWeek: number; lastWeek: number; delta: number; deltaText: string /* "+2 vs last week" | "−1 vs last week" | "No change vs last week" */ };
  bookedThisMonth: number;
  daily: DaySeries[];          // always exactly 14, oldest first, zero-filled
  topCourses: { courseId: string; name: string; count: number }[];  // ≤ 5, count desc, name asc
};

type AttentionRow = { id: string; type: LeadType; name: string; age: string /* "3 days ago" */; href: string };
type RecentRow = {
  id: string; type: LeadType; name: string;
  context: string;             // course: courseName; workshop: organization or "—"
  status: "new" | "contacted" | "booked" | "closed";
  when: string;                // "today, 14:05" | "1 day ago" | "N days ago"
  href: string;                // leadsHref(type, { lead: id })
};

type ContentCounts = { programs: number; courses: number; categories: number };

type DashboardData = {
  summary: DashboardSummary;
  attention: { rows: AttentionRow[] /* ≤ 4, oldest first */; total: number };
  recent: RecentRow[];         // ≤ 8, newest first
  content: ContentCounts;
};
```

## Rules

- **Overdue**: `status === "new" && createdAt < overdueCutoff`. `overdueCutoff` is 48 working hours (Karachi Sundays excluded) before `now` (research R2).
- **Week**: Monday 00:00 to next Monday 00:00 Karachi time. `lastWeek` is the full previous week.
- **Booked this month**: `status === "booked" && statusChangedAt ≥ monthStart`.
- **Top courses**: course leads with `createdAt ≥ start30` and `courseId !== "not-sure"`, grouped by `courseId`, named by the newest stored `courseName`.
- **Daily series**: Karachi date buckets from `chartStart` to today inclusive, 14 entries, missing days filled with 0.
- **Greeting**: Karachi hour 05–11 "Good morning", 12–16 "Good afternoon", otherwise "Good evening".

## State transitions

Only one transition is triggered from the dashboard: `new → contacted`, the same one already available in the lists. After it, the lead leaves "Needs attention" and the "New …" card and sidebar badge go down by one on the next render.
