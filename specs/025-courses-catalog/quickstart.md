# Quickstart: Courses and Course Categories

## Prerequisites

- `.env.local` with the existing `MONGODB_URI`, admin credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `AUTH_SECRET`) and lead settings. **No new environment variables.**
- `npm install` (no new packages).

## Run

```bash
npm run dev
```

## Walkthrough (acceptance smoke test)

1. **Empty state**: with no courses, open `/courses`. You should see "Courses are coming soon" and a link to `/register`. `/register` offers only "Not sure yet".
2. **Categories**: sign in at `/admin/login` → sidebar **Courses** → **Categories**. Create "AI Basics" (slug `ai-basics`) and "For Teachers". Set their order numbers to 2 and 1 and check the list reorders.
3. **Course**: go to **Courses → New course**. Type a title and watch the slug fill in and the preview card update with each keystroke. Fill in the fields, set status **Open**, and save. Check the grid card shows the category, level and "Open" chip.
4. **Slug collision**: create a second course with the same title, without touching the slug. It saves as `<slug>-2`. Then create one and *type* an existing slug: the save is refused with "Another course already uses this address…".
5. **Publish**: turn on the published toggle and star it as featured. Open `/courses`: the course is listed first.
6. **Filters**: on `/courses`, pick a category chip and a level. The URL shows `?category=…&level=…`. Reload the page, and the filters should still be applied. Try a non-matching combination: you should see "No courses match" and a "Show all courses" button.
7. **Course page**: open the course. Check the header, description, outcomes, syllabus, facts grid and the "Register" button: a sticky card on desktop, a bottom bar at 360px.
8. **Register**: press **Register** → `/register?course=<slug>` has the course preselected under its category group. Submit. The confirmation says "You're registered…". In admin Submissions, the lead shows the course title.
9. **Snapshot**: rename the course in admin. The earlier sign-up still shows the old title.
10. **Closed**: set the course to **Closed**. It disappears from `/courses` and the register select. Its page still opens with "Registration closed" → `/register`.
11. **Coming soon**: a coming-soon course is listed, looks muted, and its sign-up confirmation is the waitlist message.
12. **Unpublish**: `/courses/<slug>` returns 404.
13. **Delete guard**: try to delete a category that still has courses. The delete is refused with the count. Delete an empty category: it is removed.
14. **Online courses card**: on `/programs` and the home page, the card links to `/courses`.

## Checks

```bash
npm run lint
npm run build
npm run test:unit
npm run test:admin-guard          # dev server running, or add -- --no-http
```

Visual check (Principle VII): `/courses`, `/courses/<slug>`, `/register?course=…`, `/admin/courses`, the editor and categories at **360px, 390px and 1440px**, once with reduced motion turned on.
