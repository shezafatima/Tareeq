# Verification: 025-courses-catalog

## Baseline (T001, 2026-11-10, before any change)

| Check | Result |
|---|---|
| `npm run lint` | PASS (no output) |
| `npm run test:unit` | PASS, 130/130 |
| `npm run test:admin-guard -- --no-http` | PASS, 2 action files, 7 actions |
| `npm run build` | PASS, 19 static pages. The database was reachable (4 program pages prerendered). |

## Foundation (T002-T010)

| Check | Result |
|---|---|
| New unit tests (courses-slug, courses-schema, courses-view) | PASS, 20/20 |
| Full lint/build after foundation | Not yet run (do this at the start of the next session) |


## Categories + admin courses (T011-T028)

| Check | Result |
|---|---|
| Full unit suite before this phase | PASS, 150/150 |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS (two unused-variable warnings fixed) |
| `npm run test:admin-guard -- --no-http` | PASS: 4 action files, 16 actions, all refused with no database access; REQUIRED_ACTIONS all present |
| Browser walkthrough (quickstart 2-5, 13) | Pending: needs an admin sign-in, done in the final check |

Extra additive change not named in tasks.md: `CurriculumEditor` (src/components/admin/ListEditor.tsx) gained optional `legend`, `hint` and `errorKey` props so the course syllabus reuses it. The defaults are the program values, so Programs render unchanged.

## Public catalogue + register (T029-T046), checked 2026-11-11

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run test:unit` | PASS, 154/154 (adds select-groups tests) |
| `npm run build` | PASS, 22 static pages; `/courses` static (1h + tags), `/courses/[slug]` SSG |
| `npm run test:admin-guard` (with server, parts A-C) | PASS: 4 files, 16 actions; session endpoint empty with no cookie |
| `/admin/courses`, `/admin/courses/categories` signed out | 307 → /admin/login |
| `/courses` with no published courses (US5, T039) | "Courses are coming soon" + Register → /register, no filters. Screenshots at 360 and 1440 look right. |
| `/register` with no courses | Dropdown offers only "Not sure yet"; heading and button read "Register" |
| `/register?course=nope` | Nothing preselected, no error |
| `/courses/nope` | 404 with "We couldn't find that course" + "See all courses" |
| `/programs` and home Online courses card | "Browse courses" → /courses |
| Horizontal overflow at 360 / 1440 (courses, register, 404, programs) | none |

Programs test change: `tests/unit/programs-seed.test.ts:42-43` pinned the Online courses card to `/register` and "Register interest". The spec changes exactly that link, so those two assertions now expect `/courses` and "Browse courses". No other Programs test changed.

Additive change: `CurriculumTimeline` gained an optional `heading` (default unchanged) so the course page titles it "Syllabus".

### Still to verify (needs an admin sign-in and real course data)

- T038: create 2 categories and 4-5 courses in admin, then check /courses filters, featured order, muted coming-soon card, course page CTA (open vs closed), mobile bar, 404 when unpublished (quickstart 2-7, 10, 12-14)
- T047: register with ?course=<slug> preselected, grouped dropdown, open vs waitlist confirmation, title snapshot after rename, workshop form unchanged (quickstart 8, 9, 11)
- T048-T050: accessibility pass, reduced motion with real cards, Lighthouse on /courses and a course page
- T051: final click-through of Programs admin after the above

## Final automated gate (T051, 2026-11-11)

| Check | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run test:unit` | PASS, 154/154 (Programs tests unchanged apart from the two card assertions noted above) |
| `npm run build` | PASS, 22 static pages |
| `npm run test:admin-guard -- --no-http` | PASS: 4 action files, 16 actions, 1 route handler allow-listed |

Still pending at merge (owner chose to merge with these open): T038, T047, T048, T049, T050 and the T051 Programs admin click-through. They need an admin sign-in and real course data.

## DRAFT copy for owner sign-off (T052)

| Where | Text |
|---|---|
| `/courses` intro (`src/app/(site)/courses/page.tsx`) | "Short online courses in practical AI, taught the Tareeq way. Pick a topic and a level that suits you." |
| Open-course confirmation heading (`src/content/data/leads.ts`) | "You're registered" |
| Open-course confirmation next line | "We'll WhatsApp you within 1 working day with dates, fees and how to join." |
| Open-course WhatsApp prefill | "Hi Tareeq, I've just registered for {course} on your website (ref {ref}). Please send me the dates and fees." |
| `/register` intro and description (`src/content/data/pages.ts`) | "Leave your details and we'll WhatsApp you about your course, with dates and fees." / "Register for a Tareeq online AI course. Leave your details and we'll WhatsApp you with dates and fees." |
| Online courses card button (`src/content/online-courses.ts`) | "Browse courses" |
| Closed-course note (`CourseCta.tsx`) | "Registration for this course has closed. Leave your details and we'll tell you about the next one." |
