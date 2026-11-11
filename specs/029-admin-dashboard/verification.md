# Verification: 029-admin-dashboard

## Baseline (T001, branch 029-admin-dashboard, before any change)

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npx tsc --noEmit` | clean |
| `npm run test:unit` | 198 pass, 0 fail |
| `npm run build` | success |
| `npm run test:admin-guard -- --no-http` | PASS: 5 files, 17 actions, D 12/12 |

## After implementation (T025, 2026-11-11)

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npx tsc --noEmit` | clean |
| `npm run test:unit` | 222 pass, 0 fail (+24: dashboard-time 16, dashboard-shape 8) |
| `npm run build` | success; `/admin` is dynamic (ƒ), and there is one route for `/admin` |
| `npm run test:admin-guard -- --no-http` | PASS: 5 files, 17 actions (unchanged: no new action), D 12/12 |
| Privacy grep (`phone`, `email`, `message`, `adminNotes`, `consent`, `notification`) over `src/components/admin/dashboard`, `dashboard-query.ts`, `dashboard-shape.ts` | no matches outside comments |
| Signed out: `curl -I /admin` | 307 → `/admin/login`, no dashboard markup |

## Data layer against the dev database (T006, `tareeq_dev`)

`getDashboardData` compared with a plain-JavaScript count over every lead (74 at the time: 33 seeded `DASH-` plus 41 existing). The JavaScript side used the working-hours function for "overdue" and `karachiDayKey` for days, so it is independent of the cutoff query and of MongoDB's date grouping.

| Item | Result |
|---|---|
| New workshop / new course | match |
| Leads this week / last week | match |
| Booked this month | match |
| Daily series (14 Karachi days, workshop / course) | match |
| Top 5 courses (id, name, count, tie order) | match |
| Needs attention: total, and the first 10 oldest first (the limit was later lowered to 4) | match |
| Recent 8, newest first | match |

The throwaway check script was deleted after the run.

## Rendered panels (T019, T020, T022, T023)

Panels rendered to static HTML from the real dev data (no browser):

- Chart: 14 bars with `role="img"` and an `aria-label` (for example "Thu 29 Oct: 0 workshop, 2 course"), 14 `<title>` tooltips, 14 table rows, 7 x-labels hidden below 640px, `viewBox` 400×200, no hex colours. With no leads the empty state shows and no chart is drawn.
- Recent activity: 8 rows, each linking to `?lead=<id>`.
- Top courses: counts 7, 6, 5, 4, 3 in order; empty state works.
- Content summary: all six links point where the contract says.

## Not verified yet (needs the owner's admin sign-in)

I have no admin password, and I did not mint a session with the project's secret to get around the login. These are still open:

- T026: the quickstart walkthrough in a real browser at 360px, 390px and 1440px: grid and stacking order, no horizontal scroll, 44px targets, the skeleton, the empty states, the unavailable notice with the database stopped.
- "Mark contacted" end to end in the browser: row hides, toast, the card and sidebar badge go down by one, and the failure path (row comes back with an error toast).
- T027: the accessibility pass: keyboard walk with visible focus, a screen reader on the chart, reduced motion (numbers do not count up), and whether the saffron bars read clearly (research R8 risk; if not, switch the course series to `fill-sky`).
- T028: seeded test leads (`DASH-001` to `DASH-033`) are still in `tareeq_dev` so the dashboard has something to show. Remove them with `npx tsx --conditions=react-server scripts/dashboard-seed.mts --remove`.
