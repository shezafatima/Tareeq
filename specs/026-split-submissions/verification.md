# Verification: 026-split-submissions

## Baseline (T001, 2026-11-11)

Branch `026-split-submissions` was created from `main` @ `d37775e` with no code changes. The gate below ran on that same commit as the 025 final gate, earlier on 2026-11-11, so it stands as this feature's baseline.

| Check | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run test:unit` | PASS, 154/154 |
| `npm run build` | PASS, 22 static pages |
| `npm run test:admin-guard -- --no-http` | PASS: 4 action files, 16 actions, 1 route handler allow-listed |

## Foundation (T002-T017)

| Check | Result |
|---|---|
| `npm run test:unit` | PASS, 176/176 (was 154; adds the filter, status, course-leads tests and extends the params and WhatsApp tests) |
| `npm run test:admin-guard -- --no-http` | PASS: parts A-B, plus part D "Wrong-type checks: 12 of 12 passed" |

Part D also guards against a regression: if an action went back to `findById`, it would hit part A's throwing stub, return `unavailable`, and fail the not_found assertion.

## Views, nav and quick action (T018-T035)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS, 25 pages; `/admin/submissions`, `/admin/submissions/workshops` and `/admin/submissions/courses` are dynamic |
| Signed out, against the running dev server: `/admin`, `/admin?type=course&status=new`, `/admin/submissions`, `.../workshops`, `.../courses` | each 307 -> `/admin/login` |

Deviations from tasks.md:
- `listLeads(type, ...)` is split into `listWorkshopLeads(p)` and `listCourseLeads(p, lookup)` for clearer row types. Both are still type-scoped through the filter builders, and contracts/data-access.md is updated.
- T025's temporary nav link was skipped because the final nav (T032) landed in the same session.
- T027 (course block in the drawer) was done together with T022, since both edit the same file.
- `TYPE_LABEL` was removed from `src/lib/admin/format.ts`; its only users were the old combined table and drawer.

## Final automated gate (T041, 2026-11-11)

| Check | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run test:unit` | PASS, 176/176 |
| `npm run build` | PASS, 25 pages |
| `npm run test:admin-guard` (with dev server) | PASS: A 4 files / 16 actions, B 1 route allow-listed, C empty session, D 12/12 |

## Dev server note (2026-11-11)

The owner's dev server, already running during implementation, stopped picking up file changes partway through. It kept serving the old combined `/admin` page against the new components, which showed the admin error page ("KEYS[type] is not iterable", "reading 'map'"). A restart fixed it; the owner confirmed the pages work. There was no code change. Type check and build were already passing.

## Owner walkthrough (2026-11-11)

Signed in on the restarted dev server, the owner confirmed all of these pass:
- the sidebar group and badges
- each view shows only its own type, with filters and search kept in the address and across pages
- "Enrolled", the "Under 18" badge, and "Edit course" / "Course removed" in the course view
- the category snapshot is kept after moving the course
- "Mark contacted", including the badge dropping
- both views at 360px

This closes T026, T029, T033, T036 and T038.

## Still to verify (needs an admin sign-in and real data)

The agent has no admin password, so these are open for the owner:
- T026 / T029: quickstart 2, 4-9 at 390px and 1440px. This includes a real `/register` submission for the snapshot (step 7) and a course delete (step 8).
- T033: sidebar badges refresh after a status change. Closed by code check (027 follow-up, 2026-11-11): all three lead actions call `revalidatePath("/admin", "layout")` (`src/lib/admin/leads-actions.ts:21,41,60,75`), and `getNewCounts` in the panel layout isn't cached, so the action response includes fresh badges. No `router.refresh()` needed. One visual look during the owner walkthrough is still worthwhile.
- T036: Mark contacted, including the failure path and keyboard order.
- T037 / T038: accessibility, 360px and reduced-motion pass.
- ~~T039~~: done (027 follow-up, 2026-11-11). A read-only `indexes()` call on the live `leads` collection lists both `{type:1,status:1,createdAt:-1}` and `{type:1,courseId:1}`. Both are declared in `src/lib/leads/model.ts:42-43`.
- T040: regression (forms, owner email, Programs and Courses admin, login landing).

## DRAFT copy for owner sign-off (T042)

| Where | Text |
|---|---|
| WhatsApp, workshop (`src/lib/admin/whatsapp.ts`) | "Assalam o Alaikum {first}, this is Tareeq. Thank you for your workshop request for {organization}. When would be a good time to talk?" |
| WhatsApp, course | "Assalam o Alaikum {first}, this is Tareeq. Thank you for registering for {courseName}. When would be a good time to talk?" |
| H1s | "Workshop requests" / "Course registrations" |
| Empty states | "No workshop requests yet." + "New workshop requests will show up here." / "No course registrations yet." + "New course registrations will show up here." / "No … match these filters." + Clear filters |
| Row quick action | Button "Mark contacted"; toast "Marked contacted" |
| Drawer | "Edit course", "Course removed", "Under 18" |
| Sidebar | "Submissions" > "Workshops", "Course registrations" |
