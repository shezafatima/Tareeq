# Quickstart: verify the admin dashboard

Prerequisites: `.env.local` pointing at the **dev** database (`tareeq_dev`), `npm run dev` running on :3000, and the owner able to sign in.

## 1. Static checks

```bash
npm run lint && npx tsc --noEmit && npm run test:unit && npm run build && npm run test:admin-guard
```

Expected: all clean. The build lists `/admin` as dynamic (ƒ). The guard test's action count is unchanged, because no new action was added.

## 2. Signed out

`curl -sI http://localhost:3000/admin` → `307` with `location: /admin/login`. No dashboard markup in the body.

## 3. Seed a known data set (dev only)

`npx tsx --conditions=react-server scripts/dashboard-seed.mts` inserts leads tagged with `ref` prefix `DASH-` and refuses to run unless the database name ends in `_dev`. It prints the expected counts:

- 2 overdue new leads (a workshop from last Thursday, a course from last Saturday 18:00) and 1 new lead from yesterday (not overdue)
- 1 overdue lead already marked "contacted" (not listed)
- leads on 6 of the last 14 days, including one at 23:30 Karachi time
- 6 courses with registrations in the last 30 days, plus 1 registration 40 days ago
- 1 workshop marked booked and 1 course marked enrolled this month

## 4. Check the dashboard (signed in, `/admin`)

| Check | Expected |
|---|---|
| Greeting | Matches the Karachi hour, followed by today's long date |
| Needs attention | Exactly the 2 overdue new leads, oldest first, with type chips and "N days ago" |
| Cards | Each number matches the seed output. Each card opens the right filtered list. |
| Week delta | Matches the seed output ("+N vs last week") |
| Chart | 14 slots. The 23:30 lead is on its Karachi day. Hovering a bar shows its title. Days with zero leads have an empty slot. |
| Chart for screen readers | A screen reader (or the accessibility tree) reads "Tue 10 Nov: 2 workshop, 1 course" and reaches the table |
| Recent | The 8 newest, newest first. Course rows show the course name. Clicking a row opens the drawer on the right page. |
| Top courses | The top 5 by count. The 40-day-old registration is not counted. |
| Content | The counts match `/admin/programs` and `/admin/courses` (published only) and the categories page |
| Sidebar | "Dashboard" is first and active, and inactive on other pages |

## 5. Mark contacted

Press "Mark contacted" on an overdue row. The row disappears, a "Marked contacted" toast shows, and after the refresh the "New …" card and the sidebar badge are one lower. With the dev server's database stopped, try again on another row: the row comes back and an error toast shows.

## 6. Empty and unavailable

- After the seeded leads are deleted (step 8), on an empty dev database: "You're all caught up.", plus empty states for the chart, recent activity and top courses. Cards show 0.
- With the database unreachable, the page shows the unavailable notice and no numbers.

## 7. Responsive and accessibility (Principle VII)

At 360px, 390px and 1440px: no horizontal scroll, the order and grid match `contracts/routes-and-ui.md`, every button and link is at least 44px, focus is visible on every control, there is one H1, and with reduced motion on the numbers appear without counting.

## 8. Clean up

`npx tsx --conditions=react-server scripts/dashboard-seed.mts --remove` deletes every `DASH-` lead.
