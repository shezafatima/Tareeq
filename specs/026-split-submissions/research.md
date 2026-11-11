# Research: Separate workshop and course submissions (026)

All decisions below were made against the code as of `main` @ `d37775e`. No `NEEDS CLARIFICATION` remain.

## R1. One parameterised view, not two copied pages

- **Decision**: Two thin route pages (`submissions/workshops/page.tsx`, `submissions/courses/page.tsx`) each pass a `LeadType` and a per-type view config to the same components: `SubmissionsTable`, `FilterBar`, `StatStrip`, `Pagination`, `LeadDrawer`. The components become type-aware through props. Nothing is forked.
- **Rationale**: Principle II (no copy-pasted variants) and the request to reuse the existing table, drawer, filters, stat strip and toasts. The two views differ only in columns, filters, search fields, status labels and drawer rows. All of those are data, not markup.
- **Alternatives**: one dynamic route `submissions/[type]` (rejected: the two addresses are fixed, and two static segments make `notFound` for other values unnecessary and keep the pages readable); forked `WorkshopTable`/`CourseTable` (rejected: Principle II).

## R2. URL parameters per type

- **Decision**: `src/lib/admin/leads-params.ts` stays pure and becomes type-aware:
  - `parseLeadParams(type, raw)` returns `WorkshopParams` (`status, role, month, q, page, lead`) or `CourseParams` (`status, course, category, level, age, q, page, lead`).
  - `leadsHref(type, params)` builds `/admin/submissions/workshops?…` or `/admin/submissions/courses?…`, leaving defaults out.
  - Unknown values are ignored, as today. `role`, `level` and `age` are checked against the existing `ROLE_VALUES`, `LEVEL_VALUES` and `AGE_VALUES`. `month` must match `YYYY-MM`. `course` is `not-sure` or a 24-hex id or a legacy string id (any `[a-z0-9-]{1,64}`), and `category` must be a 24-hex id.
- **Rationale**: FR-016. Pure, so unit-tested like today (`tests/unit/admin-leads-params.test.ts` is rewritten). The `type` parameter is removed from the address because the route decides the type.
- **Alternatives**: keep `?type=` on one route (rejected: the spec fixes two routes, and a query parameter can be edited to cross types).

## R3. Type scoping on every read

- **Decision**: `src/lib/admin/leads-query.ts` functions take `type` first and always put `type` in the filter: `listLeads(type, params)`, `getLeadStats(type)`, `getLead(type, id)` (uses `findOne({ _id, type })`, so a wrong-type id returns null and the drawer stays closed), and `getNewCounts()` (one aggregate, grouped by type, for the sidebar badges).
- **Rationale**: FR-005, SC-001. Putting `type` in the one `buildFilter` helper means no query can forget it. A unit test on the pure filter builder (moved to `leads-filter.ts`, see R10) asserts `type` is always present.
- **Alternatives**: query the discriminator models `WorkshopLead`/`CourseLead` (they add `type` automatically, but `findById` on a discriminator model is less obvious to reviewers and the base `Lead` model is already used everywhere; an explicit `type` field reads plainly).

## R4. Shared actions take the expected type

- **Decision**: `setLeadStatus({ id, type, status })`, `saveLeadNotes({ id, type, notes })`, `deleteLead({ id, type })`. `type` must be one of `LEAD_TYPES`, or the result is `invalid`. Every database call filters on `{ _id: id, type }`: `findOne(...).select("status").lean()` then `updateOne(...)` for status, `updateOne` for notes, `deleteOne` for delete. No match returns the existing `not_found` result and nothing is written. "Mark contacted" calls `setLeadStatus` with `status: "contacted"`. No new action is added.
- **Rationale**: Owner decision 2 (spec Clarifications, FR-006). The guard test's `REQUIRED_ACTIONS` list does not change.
- **Revalidation**: each successful write calls `revalidatePath("/admin", "layout")`, so both views and the sidebar badges in the panel layout refresh.

## R5. Proving the wrong-type check (FR-023)

- **Decision**: Add part D to `scripts/admin-guard-test.mts`, run after parts A–C:
  - Set `sessionResolver.current` to signed in.
  - Replace the model ops the three actions use (`findOne` with chained `select`/`lean`, `updateOne`, `deleteOne`) with an in-memory store holding one course record and one workshop record. The stub matches filters on `_id` and `type` only, and records every write.
  - Call each action with the course record's id and `type: "workshop"`, and the workshop record's id and `type: "course"`. Assert the result is `{ ok:false, code:"not_found" }`, no write was recorded and both records are unchanged.
  - Positive control: the same calls with the right type record exactly one write whose filter includes `type`. The result itself is not asserted, because `revalidatePath` needs a Next request context and throws under `tsx`. The action's catch turns that into `unavailable` after the write. The wrong-type path returns before `revalidatePath`, so its result is exact.
- **Rationale**: No new dependency (an in-memory MongoDB server would be one). It reuses the script that already stubs mongoose and the session, and runs with `--no-http`.
- **Alternatives**: a real database test (rejected: needs a disposable database in CI; still covered by quickstart step 9 by hand).

## R6. Category snapshot on save

- **Decision**:
  - The course lead schema gains `categoryId: String` and `categoryName: String`, with no defaults.
  - **Absent** fields mean an older record with no snapshot, which falls back to the live lookup.
  - **`null`** fields mean the record was saved knowing there is no category ("Not sure yet", or a course whose category is missing). Those never fall back.
  - A string pair is the snapshot.
  - `submitCourse` gets the snapshot from a new server-only helper, `readCategorySnapshot(courseId)` in `src/lib/leads/category-snapshot.ts`. It does one uncached `CourseModel.findById(courseId).select("category")` and one `CourseCategoryModel.findById(...).select("name")`.
  - Results: `not-sure` gives `{ categoryId: null, categoryName: null }` with no query. A course or category that is not found gives nulls. A database error gives `{}`: the fields are omitted so the record falls back to the live lookup, and the error name is logged.
- **Rationale**: Owner decision 1 (FR-014, FR-014a). The read is uncached, so the snapshot is the category at that moment, not up to an hour stale through the public cache. The form's fields, `courseSchema` validation and the client do not change, and nothing about the snapshot comes from the browser. A snapshot lookup failure never blocks a registration (Principle X, safest).
- **Alternatives**: add a category id to `CourseOption` (rejected: `Course.category` carries no id, so public types and 025 tests would change; the cached data is also up to an hour old); backfill older records (rejected: spec says no migration).

## R7. Category column, filter and course link in the course view

- **Decision**: The course view loads its lookup data with the reads 025 already has, `listAllCourses()` and `listAllCategories()` (uncached admin reads), plus one aggregate of distinct snapshot categories: `{ $match: { type: "course", categoryId: { $type: "string" } } }`, grouped by `categoryId` with the latest `categoryName`. A pure module, `src/lib/admin/course-leads.ts`, then:
  - **Category per row**: snapshot if `categoryId` is a string; dash if `null` or the course is `not-sure`; otherwise the live course's current category name; otherwise a dash.
  - **Category filter options**: current categories (current names), then snapshot-only categories (their snapshot name, marked "(removed)"), sorted after them.
  - **Category filter query**: `{ $or: [ { categoryId: X }, { categoryId: { $exists: false }, courseId: { $in: <ids of current courses in X> } } ] }`.
  - **Course filter options**: every current course (published or not) by title, then "Not sure yet". The value is the course id, or `not-sure`.
  - **Drawer link**: if `courseId` is a current course, `/admin/courses/<id>/edit`; if `not-sure`, nothing; otherwise "Course removed". This includes pre-025 legacy ids that were never ObjectIds.
- **Rationale**: FR-011–FR-015, edge cases. All joins happen on at most tens of courses in memory. Only the leads query touches the large collection, and it stays on the type-scoped indexes.

## R8. Status labels per type

- **Decision**: A pure `statusLabels(type)` in `src/lib/admin/lead-status.ts` returns `{ new: "New", contacted: "Contacted", booked: "Booked" | "Enrolled", closed: "Closed" }`. `StatusChip` keeps its tones. `StatStrip`, the filter select, the drawer select, the row chip and toasts all take the labels from this function. Stored values never change.
- **Rationale**: FR-013, with one source so no surface can show "Booked" on a course.

## R9. Row quick action ("Mark contacted")

- **Decision**: A new client leaf, `RowStatus` (`"use client"`: needs optimistic state, a transition and the toast). It renders the status chip and, when the status is `new`, a "Mark contacted" button with a 44px target. It uses `useOptimistic` to show Contacted at once, calls `setLeadStatus({ id, type, status: "contacted" })`, and on success shows a toast, after which `revalidatePath` refreshes the server-rendered row. On failure it rolls back and calls the existing `useActionFeedback` error toast.
  - **Desktop rows**: the existing full-row link overlay (`after:absolute after:inset-0`) stays. `RowStatus` sits above it with `relative z-10`.
  - **Mobile cards** (360px): the card is no longer one `<Link>`, because a button inside a link is invalid HTML. The card becomes an `<li class="relative">` with the name as the overlay link and `RowStatus` above it.
- **Rationale**: FR-017 and Principle XI: only the chip plus button is client code; the table stays a Server Component.
- **Reduced motion**: no animation is added. The chip swap is instant, and toasts already respect reduced motion.

## R10. Pure filter builders

- **Decision**: Move the Mongo filter construction out of `leads-query.ts` (server-only) into pure `src/lib/admin/leads-filter.ts`: `workshopFilter(params)` and `courseFilter(params, liveCourseIdsByCategory)`. Both always set `type`. Search fields: workshop `fullName, email, organization, phone (+digits)`, course `fullName, email, phone (+digits)`, using the existing regex and phone-digit logic.
- **Rationale**: SC-001 is verified by unit tests on these builders without a database.

## R11. Sidebar group and badges

- **Decision**:
  - `PanelLayout` (Server Component) loads `getNewCounts()` through `safeLoad`. On failure the badges are `null` and are not shown.
  - It passes `badges` down through `Sidebar` and `TopBar` to `AdminNav` as a serialisable prop.
  - `AdminNav` becomes a list of entries: a group heading "Submissions" (non-link, `h-8`) with child items "Workshops" (`/admin/submissions/workshops`) and "Course registrations" (`/admin/submissions/courses`), then Programs and Courses.
  - The sliding saffron indicator moves to a precomputed `top` offset per item (transform only), so the group heading's different height is handled.
  - A badge is a small pill after the label, with `aria-label` text like "4 new". It is hidden when the count is 0.
  - Courses stays active only on `/admin/courses...`, which does not clash with `/admin/submissions/courses`.
- **Rationale**: FR-003, US3. The layout re-renders after each action because of `revalidatePath("/admin", "layout")`.

## R12. `/admin` redirect and the removed list

- **Decision**: `src/app/admin/(panel)/page.tsx` becomes `redirect("/admin/submissions/workshops")`. A new `submissions/page.tsx` does the same. Query strings are dropped. The login page's post-sign-in redirect to `/admin` keeps working through it. The old combined page body, `TYPE_OPTIONS` and the `?type=` handling are deleted.
- **Rationale**: FR-002, edge case "old combined address".

## R13. WhatsApp prefill

- **Decision**: `whatsappLink(phone, fullName, topic)`, where `topic` is `{ type: "workshop", organization }` or `{ type: "course", courseName }`. Text (DRAFT, owner sign-off):
  - Workshop: "Assalam o Alaikum {first}, this is Tareeq. Thank you for your workshop request for {organization}. When would be a good time to talk?"
  - Course: "Assalam o Alaikum {first}, this is Tareeq. Thank you for registering for {courseName}. When would be a good time to talk?"
- **Rationale**: FR-018. Pure and unit-tested (`tests/unit/admin-whatsapp.test.ts` extended).

## R14. Indexes

- **Decision**: Keep the existing `{ type: 1, status: 1, createdAt: -1 }` and add `{ type: 1, courseId: 1 }` on the lead schema. They are created by Mongoose's default `autoIndex`, as the existing lead indexes are. A quickstart step confirms both exist with `getIndexes()`.
- **Rationale**: FR-021. The list query sorts by `createdAt` under `type` (+ `status`), and course and category filters hit `type` + `courseId`. No index on `categoryId`: snapshot-category matches are filtered within the type-scoped scan, which is fine at the expected volume (SC-005, 5,000 records). This can be revisited if needed.

## R15. Drawer field labels

- **Decision**: The drawer shows labels instead of raw values for role, level and age group (using `labelFor` with the existing options) and for the preferred month (using `monthLabel`). Course records show Course (stored title, plus a link or "Course removed"), Category (R7), Level, Age group, and an "Under 18" badge (the grey `StatusChip` tone with the label as text) next to the name in the header.
- **Rationale**: FR-010, FR-015. Same data, readable.
