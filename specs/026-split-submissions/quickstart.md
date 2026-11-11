# Quickstart: verify 026-split-submissions

Prerequisites: `.env` with `MONGODB_URI` and the admin credentials. `npm run dev`. Sign in at `/admin/login`. You need at least 2 categories and 2 courses (from 025), 3 workshop requests, and 3 course registrations: one under 18, one "Not sure yet", and one for a course you will delete in step 8.

1. **Gates**: `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:admin-guard` (parts A–D pass; D prints the wrong-type checks).
2. **Redirect**: open `/admin` and `/admin?type=course&status=new`. Both land on `/admin/submissions/workshops` with no filters.
3. **Sidebar**: the "Submissions" group shows "Workshops" and "Course registrations" with badges equal to the new counts of each type. Open the mobile menu at 360px and check the same.
4. **Workshops view**: only workshop records show. Check the columns. Filter by status, role and month, then search by part of an organization, a phone written as `0300…`, and an email. Reload: the filters are kept. Page 2 (with more than 25 records) keeps the filters.
5. **Course view**: only course records show. Check the columns. Filter by course, category, level and age group, and search. The stat strip reads "Enrolled". Set a record to that status in the drawer: the chip, toast and select all read "Enrolled".
6. **Drawer**: the under-18 record shows the "Under 18" badge. An existing course shows an "Edit course" link that opens `/admin/courses/<id>/edit`. "Not sure yet" shows neither a link nor "Course removed".
7. **Category snapshot**: submit a new registration on `/register` for course A (category X). In admin it shows category X. In `/admin/courses`, move course A to category Y. The registration still shows X, and filtering by X still finds it.
8. **Deleted course**: delete course A. Its registration shows the stored title with "Course removed", category X (snapshot) is still filterable (marked "(removed)" if X was also deleted), and search finds it. An older registration without a snapshot shows a dash for category.
9. **Cross-type**: copy a course record's id into `/admin/submissions/workshops?lead=<id>`. The drawer does not open.
10. **Mark contacted**: on a new row, press "Mark contacted". The chip changes at once, a toast appears, and the sidebar badge drops by 1 after the refresh. Stop the database (or disconnect) and try again: the chip rolls back and an error toast appears.
11. **Row actions**: WhatsApp opens with the workshop or course text, copy phone and email work, notes save, and delete asks for confirmation.
12. **Indexes**: in `mongosh`, `db.leads.getIndexes()` includes `{type:1,status:1,createdAt:-1}` and `{type:1,courseId:1}`.
13. **360px and reduced motion**: both views and the drawer have no horizontal scroll at 360px, cards show Mark contacted with a 44px target, and with `prefers-reduced-motion: reduce` the nav indicator and drawer don't animate.
14. **Regression**: `/register` and `/workshop` forms submit and confirm as before. Programs and Courses admin pages work.
