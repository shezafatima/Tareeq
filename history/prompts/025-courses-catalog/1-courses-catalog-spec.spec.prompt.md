---
id: 1
title: Courses catalog spec
stage: spec
date: 2026-11-10
surface: agent
model: claude-opus-5-5
feature: 025-courses-catalog
branch: 025-courses-catalog
user: shezafatima
command: /sp.specify
labels: ["courses", "categories", "admin", "register-form", "spec"]
links:
  spec: specs/025-courses-catalog/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/025-courses-catalog/spec.md
 - specs/025-courses-catalog/checklists/requirements.md
tests:
 - none (spec stage)
---

## Prompt

/sp.specify Courses and course categories (admin-managed)

Context: reuse the existing admin layout, auth checks, UI components (drawer, toasts, toggles, skeletons, dialogs) and the Programs CRUD patterns. Do not change Programs behaviour.

Data models (Mongoose):
- CourseCategory: name, slug (unique), description (optional), order, timestamps.
- Course: title, slug (unique), category (ref CourseCategory), level (beginner | intermediate | advanced), summary, description (markdown), outcomes (string[]), syllabus ([{title, description}]), format (live | self-paced | recorded), durationText, startDateText (optional), priceText, enrollmentStatus (open | coming-soon | closed), coverImageUrl (optional), featured (boolean), order, published, timestamps.
- Server-only data module: getPublishedCourses({category?, level?}), getCourseBySlug(slug), getCategories(). Cache tags: "courses", "course:<slug>", "categories".

Admin:
- /admin/courses: card grid (title, category, level, enrollment status chip, published toggle, featured star), filters by category and status. Create/edit form with all fields, live preview using the same presentational component as the public course card, shared zod validation, unique slug auto-generated from the title.
- /admin/courses/categories: list, create, edit, reorder (order number), delete. Deleting a category that still has courses is blocked with a clear message.
- Every save, delete or toggle revalidates the relevant tags. Every action has a server-side session check, and the existing unauthenticated-action test is extended to cover these actions.
- Add "Courses" to the admin sidebar.

Public:
- /courses: heading and intro, category filter chips plus a level filter (client-side, in the URL as ?category=&level=), course cards (cover or brand pattern, category, level, format, duration, status chip, price text). Featured courses first, then order. Closed courses are hidden. Coming-soon courses are shown, but quieter.
- /courses/[slug]: header (title, summary, category, level, status), description, outcomes, syllabus as an accordion or timeline, a facts grid, and a sticky CTA ("Register" -> /register?course=<slug>; on mobile a sticky bottom bar). Unpublished or unknown slug -> 404. generateStaticParams and per-course metadata/OG.
- The fixed "Online courses" card on /programs and on the home Programs section now links to /courses.
- Add Courses to the public nav.

Register form integration:
- The course select lists published courses with status open or coming-soon (grouped by category) plus "Not sure yet".
- /register?course=<slug> preselects that course.
- The course submission stores courseId plus a courseTitle snapshot, so old submissions stay readable if the course is renamed or deleted.

Empty states: if there are no published courses, /courses shows a friendly "Courses are coming soon" message with a link to /register, and the register select shows only "Not sure yet".

Constraints: Server Components. Client leaves only for filters, form lists, preview and toggles. Brand tokens, Sora/Inter, existing UI patterns. No new dependencies. Mobile-first at 360px. prefers-reduced-motion respected.

Out of scope: payments, enrolment accounts, lesson content or video hosting, image upload.

## Response snapshot

Created branch 025-courses-catalog and specs/025-courses-catalog/spec.md with 5 prioritized user stories (admin publishes course P1, visitor browses/reads P1, register preselect P2, category management P2, empty catalogue P3), 32 functional requirements, 8 success criteria, edge cases, and assumptions. Key assumptions: reuse the existing courseId + courseName snapshot on leads (no migration); published-but-closed courses keep a reachable page with a "Registration closed" CTA; slugs don't change on title edit; /register keeps "Join the waitlist" wording. Quality checklist passes, with no clarification markers.

## Outcome

- ✅ Impact: Spec ready for /sp.clarify or /sp.plan
- 🧪 Tests: none (spec stage)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.clarify (optional, to confirm closed-course page and label assumptions), /sp.plan
- 🧠 Reflection: Codebase already has the courseName snapshot, the Courses nav link and an onlineCoursesHref constant, so the integration scope is smaller than the request suggests.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 printed a parameter-binding error from the shell profile but still created the branch and spec file
- Graders run and results (PASS/FAIL): spec quality checklist PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
