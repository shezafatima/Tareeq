---
description: "Task list for 026-split-submissions"
---

# Tasks: Separate workshop and course submissions in admin

**Input**: Design documents from `/specs/026-split-submissions/`
**Prerequisites**: plan.md, spec.md (with Clarifications 2026-11-11), research.md (R1–R15), data-model.md, contracts/ (server-actions.md, routes-and-ui.md, data-access.md), quickstart.md

**Tests**: Included. The spec requires:
- extending the unauthenticated-action test (FR-022)
- the wrong-type tests (FR-023)
- verifying type scoping with an automated test (SC-001)

Unit tests use `node --test` in `tests/unit/*.test.ts` and import pure modules by **relative** path with `.ts` extensions, like `tests/unit/admin-leads-params.test.ts` does today.

**Organization**: Tasks are grouped by user story, in spec order: US1 (workshops, P1), US2 (courses, P1), US3 (sidebar, P2), US4 (Mark contacted, P2). US1 makes the shared components type-aware; US2 adds the course configuration on top.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US4 from spec.md

## Conventions every task must follow

- Read the existing file before changing it. Keep its comment style (a short header comment citing the spec).
- Pure modules (`leads-params.ts`, `leads-filter.ts`, `lead-status.ts`, `course-leads.ts`, `whatsapp.ts`) use relative imports only and no `server-only`, so tests and client code can import them. To reuse lead vocabulary, import from `../leads/options.ts` (it is pure).
- Server modules start with `import "server-only";`. `leads-actions.ts` stays `"use server"` and every export stays wrapped in `withAdmin(...)`.
- Every lead read and write MUST include `type` in its filter (FR-005, FR-006).
- Brand tokens only (no hex). 44px touch targets. Transform/opacity motion only, off under `prefers-reduced-motion`.
- `"use client"` only on `RowStatus` (new) and the existing client components, each with a one-line reason comment.
- No new dependencies. Don't change the public forms' fields, validation or UI, or the notification email.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before any change.

- [X] T001 Record baseline on branch `026-split-submissions`: run `npm run lint`, `npm run test:unit`, `npm run build` and `npm run test:admin-guard -- --no-http`. Write the results, the unit test count and the guard test's action count in `specs/026-split-submissions/verification.md` (new file, section "Baseline").

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Data fields, the snapshot, type-first pure helpers, type-first reads and type-scoped actions. Every story depends on these.

**⚠️ CRITICAL**: No user story work starts until this phase is done.

### Data and snapshot

- [X] T002 In `src/lib/leads/model.ts`:
  - Add `categoryId: { type: String }` and `categoryName: { type: String }` to `courseSchema`, with **no** `default`, so an absent field stays absent and `null` can be stored.
  - Add `leadSchema.index({ type: 1, courseId: 1 })` next to the existing indexes.
  - Leave `{ type: 1, status: 1, createdAt: -1 }` as it is.
  - Add a comment citing data-model.md "Snapshot states" (absent = older record, null = no category, string = snapshot).
- [X] T003 Create `src/lib/leads/category-snapshot.ts` (`server-only`). Export `readCategorySnapshot(courseId: string)` returning `Promise<{ categoryId: string | null; categoryName: string | null } | Record<string, never>>`:
  - `"not-sure"`: return nulls with no query.
  - Not a 24-hex id: return nulls.
  - Otherwise `await connectDb()`, then `CourseModel.findById(courseId).select("category").lean()`. If the course is missing, return nulls. Then `CourseCategoryModel.findById(course.category).select("name").lean()`. If the category is missing, return nulls. Otherwise return `{ categoryId: String(cat._id), categoryName: cat.name }`.
  - Wrap the reads in try/catch. On error, log `[leads] category snapshot failed: <err.name>` (no personal data) and return `{}`.
  - Import the models from `@/lib/courses/model`.
  - Depends on T002.
- [X] T004 In `src/lib/leads/actions.ts`, `submitCourse`: inside `create`, `await readCategorySnapshot(data.courseId)` and spread the result into `CourseLead.create({...})` after `ageGroup`. Make `create` async if needed. Change nothing else: inputs, validation, `respond`, notification. Add a comment citing spec FR-014 ("server-side only; nothing comes from the form"). Depends on T003.

### Pure helpers

- [X] T005 [P] Rewrite `src/lib/admin/leads-params.ts` (pure) per contracts/routes-and-ui.md "Query parameters":
  - Keep `LEAD_TYPES`, `LEAD_STATUS_VALUES`, `PAGE_SIZE`, `SEARCH_MAX`, `isObjectId`, `escapeRegex` and `clampPage`.
  - Add types `WorkshopParams = { status, role, month, q, page, lead }` and `CourseParams = { status, course, category, level, age, q, page, lead }`, with `LeadParamsFor<T>` mapping the type to its params.
  - `parseLeadParams(type, raw)`:
    - `role` must be in `ROLE_VALUES`; `month` must match `/^\d{4}-\d{2}$/`.
    - `course` must be `not-sure`, a 24-hex id, or `/^[a-z0-9-]{1,64}$/`; `category` must be 24-hex; `level` must be in `LEVEL_VALUES`; `age` must be in `AGE_VALUES`.
    - Import the value lists from `../leads/options.ts`.
    - Unknown values become null. Repeated params take the first value. `q` is trimmed to 100 characters.
  - `leadsHref(type, params)` builds `/admin/submissions/workshops?…` or `/admin/submissions/courses?…` in a fixed key order, leaving defaults out (page 1, nulls, empty q).
  - Export `SUBMISSIONS_PATH: Record<LeadType, string>`.
  - Remove the `type` param entirely.
- [X] T006 [P] Create `src/lib/admin/lead-status.ts` (pure). Export `statusLabels(type: LeadType): Record<LeadStatusValue, string>`, returning `booked: "Enrolled"` for `course` and `"Booked"` for `workshop`; the other labels are New, Contacted, Closed. Also export `TYPE_NOUN = { workshop: "Workshop request", course: "Course registration" }`. Import the types from `./leads-params.ts`.
- [X] T007 Create `src/lib/admin/leads-filter.ts` (pure). Use the existing regex and phone-digit logic from `src/lib/admin/leads-query.ts` `buildFilter`, then delete it from there in T010.
  - `workshopFilter(p: WorkshopParams)` returns `{ type: "workshop", ...status, role, preferredMonth: month, $or: [fullName, email, organization, phone, +digits] }`.
  - `courseFilter(p: CourseParams, liveCourseIds: string[] | null)` returns `{ type: "course", status, courseId: course, level, ageGroup: age, $or: [fullName, email, phone, +digits] }`.
  - When `category` is set, add `$and: [{ $or: [ { categoryId: category }, { categoryId: { $exists: false }, courseId: { $in: liveCourseIds ?? [] } } ] }]`, so it doesn't collide with the search `$or`.
  - Every returned filter has `type`. Depends on T005.
- [X] T008 [P] Create `src/lib/admin/course-leads.ts` (pure) per research R7 and data-model.md. Types: `CourseRef = { id, title, categoryId, categoryName: string | null }`, `CategoryRef = { id, name }`. Exports:
  - `categoryFor(lead: { courseId: string; categoryId?: string | null; categoryName?: string | null }, courseById: Map<string, CourseRef>): string | null`: `not-sure` → null; `categoryId` a string → `categoryName`; `categoryId === null` → null; otherwise the live `courseById.get(courseId)?.categoryName ?? null`. Check whether the field is present with `"categoryId" in lead` or `!== undefined`.
  - `courseLinkFor(courseId, courseById)`: `{kind:"none"}` for `not-sure`, `{kind:"edit", href:"/admin/courses/<id>/edit"}` when found, else `{kind:"removed"}`.
  - `categoryOptions(current: CategoryRef[], snapshots: CategoryRef[])`: current ones in their order, then snapshot ids not in current, labelled `"<name> (removed)"` and sorted by name.
  - `courseOptions(courses: CourseRef[])`: by title, then `{ value: "not-sure", label: "Not sure yet" }`.
  - `courseIdsByCategory(courses): Map<categoryId, string[]>`.
- [X] T009 [P] In `src/lib/admin/whatsapp.ts`, change `whatsappLink(phone, fullName, topic)` where `topic` is `{ type: "workshop"; organization: string } | { type: "course"; courseName: string }`. Use the DRAFT texts in contracts/routes-and-ui.md "WhatsApp prefill". Keep the digit rules and the null return.

### Type-first reads and type-scoped actions

- [X] T010 Rewrite `src/lib/admin/leads-query.ts` (`server-only`) per contracts/data-access.md:
  - **Shapes**: `WorkshopRow`, `CourseRow` and `LeadDetail` (a union with `workshop` or `course` blocks; the course block has `courseId, courseName, category, level, ageGroup, link`). `toDetail` takes an optional lookup for the course block.
  - **List and count reads**:
    - `listLeads(type, params, lookup?)` uses `workshopFilter` or `courseFilter(p, lookup?.courseIdsByCategory.get(p.category) ?? null)`, with the existing sort, clamp and page size.
    - `getLeadStats(type)` aggregates with `{ $match: { type } }` first.
    - `getNewCounts()` returns `{ workshop, course }` from one aggregate on `{ status: "new" }`, grouped by `type`.
  - **Single record**: `getLead(type, id, lookup?)` uses `Lead.findOne({ _id: id, type })` and returns null for a malformed id or wrong type.
  - **Lookups**:
    - `getWorkshopMonths()` uses `Lead.distinct("preferredMonth", { type: "workshop", preferredMonth: { $ne: null } })`, sorted descending.
    - `getCourseLeadLookup()` uses `listAllCourses()` + `listAllCategories()` from `./courses-read`, plus `Lead.aggregate([{ $match: { type: "course", categoryId: { $type: "string" } } }, { $sort: { createdAt: -1 } }, { $group: { _id: "$categoryId", name: { $first: "$categoryName" } } }])`. It returns `{ courseById, courseOptions, categoryOptions, courseIdsByCategory }` built with T008.
  - Delete `buildFilter` and the old untyped signatures.
  - Depends on T002, T005, T007, T008.
- [X] T011 In `src/lib/admin/leads-actions.ts`, per contracts/server-actions.md:
  - Each action takes `type`, returning `invalid` when `type` isn't in `LEAD_TYPES`.
  - `setLeadStatus` uses `Lead.findOne({ _id: id, type }).select("status").lean()` then `Lead.updateOne({ _id: id, type }, …)`.
  - `saveLeadNotes` uses `Lead.updateOne({ _id: id, type }, …)`.
  - `deleteLead` uses `Lead.deleteOne({ _id: id, type })`.
  - No match returns `not_found`.
  - Replace `revalidatePath("/admin")` with `revalidatePath("/admin", "layout")`.
  - Don't add any export. Depends on T005.

### Tests for the foundation

- [X] T012 [P] Rewrite `tests/unit/admin-leads-params.test.ts` for the new API:
  - Both types accept their known values.
  - Workshop ignores course params and vice versa.
  - Unknown or malformed values become null or the default; a repeated param takes the first value; `q` is trimmed to 100.
  - `leadsHref` gives each type's path, leaves defaults out and keeps a fixed key order.
  - `clampPage` and `escapeRegex` cases are kept.
  - Depends on T005.
- [X] T013 [P] Create `tests/unit/admin-leads-filter.test.ts`. Depends on T007.
  - **SC-001**: every filter has `type` set to its view's type, with any params, including a crafted params object carrying a foreign field.
  - **Search fields**: the workshop search `$or` includes `organization`; the course search `$or` doesn't. A phone `0300 1234567` adds the digits match.
  - **Category**: on courses, produces the `$and`/`$or` with `categoryId` and with `$exists: false` + `$in` live ids; `null` live ids give `$in: []`.
  - **Other filters**: status, role, month, course, level and age map to `status`, `role`, `preferredMonth`, `courseId`, `level` and `ageGroup`.
- [X] T014 [P] Create `tests/unit/admin-lead-status.test.ts`: course `booked` → "Enrolled", workshop `booked` → "Booked", the other three labels are the same for both. Depends on T006.
- [X] T015 [P] Create `tests/unit/admin-course-leads.test.ts`. Depends on T008.
  - **`categoryFor`**: string snapshot → snapshot name, even when the live course has moved category; `null` snapshot → null and no fallback; absent fields → live name; absent fields with the course removed → null; `not-sure` → null whatever the fields hold.
  - **`courseLinkFor`**: edit / removed / none, including a legacy non-ObjectId id → removed.
  - **Options**: `categoryOptions` appends "(removed)" snapshot-only categories after the current ones and doesn't duplicate current ids; `courseOptions` ends with "Not sure yet".
- [X] T016 [P] Extend `tests/unit/admin-whatsapp.test.ts`: the workshop text includes the organization, the course text includes the course name, both are URL-encoded, and the existing digit and null cases still pass with a topic argument. Depends on T009.
- [X] T017 In `scripts/admin-guard-test.mts`:
  - **Part A**: add `type: "workshop"` to the probe argument objects that carry an `id`. `REQUIRED_ACTIONS` stays the same.
  - **New part D** (after part C, also run under `--no-http`), per research R5:
    - Set `sessionResolver.current = async () => true`.
    - Build an in-memory store with one course record and one workshop record (24-hex ids, `status: "new"`, `adminNotes: ""`).
    - Replace `mongoose.Model.findOne` (returning a chain object whose `select()` returns itself and whose `lean()` resolves to a copy of the matching record), `updateOne` (returns `{ matchedCount }` and records writes) and `deleteOne` (returns `{ deletedCount }` and records deletes). The fakes match only when both `_id` and `type` in the filter equal the record's.
    - Replace `connectDb`'s `mongoose.connect` stub with a resolving no-op for part D only.
    - For `setLeadStatus` (status `closed`), `saveLeadNotes` (notes `"x"`) and `deleteLead`, call with the course id + `type:"workshop"` and the workshop id + `type:"course"`. Assert `{ ok:false, code:"not_found" }`, zero recorded writes and both records deep-equal their originals.
    - Positive control: the same calls with the right type record exactly one write whose filter has `type`. Don't assert the result, because `revalidatePath` throws outside Next (R5).
    - Print `D. Wrong-type checks: N passed`.
  - Depends on T011.

**Checkpoint**: `npm run test:unit` and `npm run test:admin-guard -- --no-http` pass. `npx tsc --noEmit` will fail in the pages and components still using the old signatures. That's expected until Phase 3; note it in verification.md.

---

## Phase 3: User Story 1 - Work through workshop requests on their own (Priority: P1) 🎯 MVP

**Goal**: `/admin/submissions/workshops` shows only workshop records, with its columns, filters, search, stat strip and drawer. `/admin` redirects there and the old list is gone.

**Independent Test**: With mixed records, the workshop view shows only workshop rows; filters and search live in the URL; the stat strip counts workshops only; the drawer shows every workshop field; `?lead=<course id>` doesn't open the drawer (quickstart 2, 4, 9).

- [X] T018 [US1] Make `src/components/admin/StatStrip.tsx` type-aware: props `{ type, counts, params, labels }`. Links use `leadsHref(type, …)` and the labels come from `labels`. Markup and styles don't change.
- [X] T019 [P] [US1] Make `src/components/admin/Pagination.tsx` type-aware: props `{ type, page, pages, total, params, noun }`. `noun` is `["request","requests"]` or `["registration","registrations"]` and replaces the "submission(s)" text. Hrefs use `leadsHref(type, …)`.
- [X] T020 [US1] Generalise `src/components/admin/FilterBar.tsx` (client, keep its reason comment).
  - **Props**: `{ type, params, selects: { name: string; label: string; allLabel: string; options: { value: string; label: string }[] }[], searchLabel: string }`.
  - **Behaviour**: remove `TYPE_OPTIONS` and the hard-coded status select. Render one labelled `<select>` per entry (ids `lead-filter-<name>`, `sr-only` labels kept). `go()` and the debounce use `leadsHref(type, …)`. "Clear filters" links to `leadsHref(type, {})`, and `filtered` is true when any select value or `q` is set.
  - **Layout**: search spans the full width on its own row. The selects sit in a wrapping grid below it: one column at 360px, `sm:grid-cols-2`, `lg:grid-cols-3`, then 5 columns at `xl` for the course view. No horizontal scroll at 360px.
- [X] T021 [US1] Generalise `src/components/admin/SubmissionsTable.tsx` (stays a Server Component) per research R9.
  - **Props**: `{ type, rows: { id; fullName; ref; status }[] & Record<string, unknown>, params, columns: { header: string; cell: (row) => ReactNode }[], card: (row) => { line1: ReactNode; line2: ReactNode }, labels }`. The pages define `columns` and `card`; both are server code, so render functions are fine.
  - **Desktop**: Name (+ ref, with the overlay link) first, then `columns`, then Status, then Received.
  - **Mobile**: restructure the card to `<li className="relative …">` with the name as an `<Link>` overlay (`after:absolute after:inset-0`), so later interactive children can sit above it.
  - **Status cell**: render the chip with `labels[status]` for now. T035 swaps in `RowStatus`.
  - Remove the "Type" column and the `TYPE_LABEL` use.
- [X] T022 [US1] Update `src/components/admin/LeadDrawer.tsx` for type-aware use:
  - **Props**: `{ lead: LeadDetail | null; closeHref: string; labels: Record<LeadStatusValue,string> }`.
  - **Actions**: pass `type: lead.type` to `setLeadStatus`, `saveLeadNotes` and `deleteLead`.
  - **Labels**: the status select options, chip and toast use `labels`, and the header shows `TYPE_NOUN[lead.type]`.
  - **Workshop rows**: Role via `labelFor(ROLE_OPTIONS, …)`, Preferred month via `monthLabel`, Participants.
  - **WhatsApp**: `whatsappLink(lead.phone, lead.fullName, topic)`, where the topic comes from `lead.workshop.organization` or `lead.course.courseName`.
  - Keep the course block compiling. US2 completes it.
- [X] T023 [US1] Create `src/app/admin/(panel)/submissions/workshops/page.tsx` (Server Component, `metadata.title = "Workshop requests"`):
  - **Data**: `await requireAdmin()`, then `parseLeadParams("workshop", await searchParams)`. One `safeLoad` with `Promise.all([getLeadStats("workshop"), listLeads("workshop", p), getWorkshopMonths(), p.lead ? getLead("workshop", p.lead) : null])`.
  - **Page**: H1 "Workshop requests", then `StatStrip`, then `FilterBar` with selects Status (workshop labels), Role (`ROLE_OPTIONS`) and Preferred month (months → `monthLabel`), and search label "Search name, phone, email or organization".
  - **List**: an empty state using the copy in contracts/routes-and-ui.md, or `SubmissionsTable` with columns Role (label), Organization, Participants, Preferred month (label or "—"), and the card per the contract. Then `Pagination` and `LeadDrawer`.
  - On a load failure, show `UnavailableNotice` with the H1, like the old page.
- [X] T024 [US1] Replace `src/app/admin/(panel)/page.tsx` with `import { redirect } from "next/navigation"; export default function AdminHome() { redirect("/admin/submissions/workshops"); }`, with a comment saying it's temporary until the dashboard feature. Create `src/app/admin/(panel)/submissions/page.tsx` with the same redirect. This deletes the old combined list body.
- [X] T025 (superseded: the final nav from T032 landed in the same session, so the temporary link was never needed) [US1] Temporarily point the "Submissions" item in `src/components/admin/AdminNav.tsx` at `/admin/submissions/workshops`, active on `p.startsWith("/admin/submissions")`, so navigation works until US3 replaces it.
- [X] T026 [US1] Run `npx tsc --noEmit`, `npm run lint` and `npm run build`, and fix any error in the US1 files. Walk quickstart steps 2, 4 and 9 at 390px and 1440px. Record the results in `specs/026-split-submissions/verification.md`.

**Checkpoint**: The workshop view works end to end. The course records are temporarily not visible anywhere (US2 adds them).

---

## Phase 4: User Story 2 - Work through course registrations on their own (Priority: P1)

**Goal**: `/admin/submissions/courses` shows only course records with the course, category (snapshot first), level and age group. "Enrolled" replaces "Booked". The drawer shows the Under 18 badge and the course link or "Course removed".

**Independent Test**: Quickstart steps 5–8. Only course rows show, all five filters and search work, the snapshot survives a course move or delete, and older records fall back to the live lookup.

- [X] T027 [US2] Complete the course block in `src/components/admin/LeadDrawer.tsx`:
  - **Rows**: Course shows the stored `courseName`, then:
    - when `link.kind === "edit"`, a "Edit course" `next/link` to `link.href` (min-h-11, royal underline)
    - when `"removed"`, the text "Course removed" in a grey `StatusChip`
    - nothing for `"none"`
  - Category (`category ?? "—"`), Level via `labelFor(LEVEL_OPTIONS, …)`, Age group via `labelFor(AGE_OPTIONS, …)`.
  - **Header**: when `ageGroup === "under-18"`, add `<StatusChip label="Under 18" tone="grey" />`.
- [X] T028 [US2] Create `src/app/admin/(panel)/submissions/courses/page.tsx` (Server Component, `metadata.title = "Course registrations"`):
  - **Data**: `await requireAdmin()`, then `parseLeadParams("course", …)`. In one `safeLoad`, first `getCourseLeadLookup()`, then `Promise.all([getLeadStats("course"), listLeads("course", p, lookup), p.lead ? getLead("course", p.lead, lookup) : null])`.
  - **Page**: H1 "Course registrations", `StatStrip` with `statusLabels("course")`, and `FilterBar` with selects:
    - Status (course labels)
    - Course (`lookup.courseOptions`)
    - Category (`lookup.categoryOptions`)
    - Level (`LEVEL_OPTIONS`)
    - Age group (`AGE_OPTIONS`)

    Search label "Search name, phone or email".
  - **List**: `SubmissionsTable` with columns Course (`courseName`), Category (`category ?? "—"`), Level (label) and Age group (label), and the card per the contract. Then empty states, `Pagination` with the registration noun, and `LeadDrawer`.
- [X] T029 [US2] Run `npx tsc --noEmit`, `npm run lint`, `npm run build` and `npm run test:unit`. Walk quickstart steps 5–8 (this needs a real registration through `/register` for step 7) at 390px and 1440px. Record the results in `verification.md`.

**Checkpoint**: Both views work. Navigation to the course view is by URL until US3.

---

## Phase 5: User Story 3 - Navigate and triage from the sidebar (Priority: P2)

**Goal**: A "Submissions" group with "Workshops" and "Course registrations", each with a new-count badge, in the sidebar and the mobile menu.

**Independent Test**: Quickstart step 3. The badges match the new counts, are hidden at 0 and when the database is down, and drop after a status change.

- [X] T030 [US3] In `src/app/admin/(panel)/layout.tsx`, after `requireAdmin()`, load `const counts = await safeLoad(getNewCounts)`. Pass `badges={counts.ok ? counts.data : null}` to `<Sidebar>` and `<TopBar>`.
- [X] T031 [P] [US3] Thread a `badges: { workshop: number; course: number } | null` prop through `src/components/admin/Sidebar.tsx` and `src/components/admin/TopBar.tsx` to `<AdminNav badges={badges} />`. Both stay Server Components.
- [X] T032 [US3] Rewrite the item list in `src/components/admin/AdminNav.tsx` (client, keep its reason comment) per contracts/routes-and-ui.md "Sidebar":
  - **Structure**: a non-link group heading "Submissions" (`h-8`, small uppercase `text-white/60`, `Tray` icon), then indented child links:
    - Workshops → `/admin/submissions/workshops`, active on that prefix
    - Course registrations → `/admin/submissions/courses`, active on that prefix

    Then Programs and Courses, active on `/admin/courses` exactly or `/admin/courses/` as a prefix, never on `/admin/submissions/courses`.
  - **Badges**: a badge pill after a child's label when `badges?.[type] > 0`: `ml-auto rounded-full bg-saffron px-2 text-xs font-semibold text-midnight`, visible number, plus `<span className="sr-only"> new</span>`.
  - **Indicator**: replace `active * ROW` with a precomputed `top` offset per link that accounts for the 32px heading and the 4px gaps. Animate with transform only, and add `motion-reduce:transition-none`.
  - Remove the temporary item from T025.
- [X] T033 [US3] Check the badges refresh after a status change from the drawer: `revalidatePath("/admin","layout")` from T011 should re-render the layout. If it doesn't in dev, add `router.refresh()` after a successful action in `LeadDrawer`, and note the outcome in verification.md. Walk quickstart step 3 at 360px (mobile menu) and 1440px.

**Checkpoint**: Navigation is complete. Both views are reachable from the sidebar and the mobile menu.

---

## Phase 6: User Story 4 - One-tap "Mark contacted" (Priority: P2)

**Goal**: Each `new` row has a "Mark contacted" button that updates at once, toasts, and rolls back on failure.

**Independent Test**: Quickstart step 10. One tap shows Contacted immediately, the toast appears, the change survives a reload, and a failure rolls back with an error toast.

- [X] T034 [US4] Create `src/components/admin/RowStatus.tsx` with `"use client"` and the comment `// needs optimistic state, a transition and the toast`:
  - **Props**: `{ id: string; type: LeadType; status: LeadStatusValue; name: string; labels: Record<LeadStatusValue,string> }`.
  - **Optimistic update**: `const [shown, setShown] = useOptimistic(status)` and `useTransition`. It renders `StatusChip` with `labels[shown]` and the tone from `LEAD_STATUS_TONE`.
  - **Button**: when `shown === "new"`, a `<button type="button" className="relative z-10 inline-flex min-h-11 min-w-11 items-center rounded-full border border-midnight/70 px-3 text-xs font-semibold text-midnight hover:bg-midnight/5 disabled:opacity-50">` with the visible text "Mark contacted" and the `aria-label` `Mark ${name} contacted`.
  - **On click**: `startTransition(async () => { setShown("contacted"); const r = await setLeadStatus({ id, type, status: "contacted" }); if (r.ok) toast.success("Marked contacted"); else fail(r, "update the status"); })`. `useOptimistic` reverts automatically when the transition ends without a server update.
  - The button is disabled while pending.
- [X] T035 [US4] Use `RowStatus` in `src/components/admin/SubmissionsTable.tsx` in both the desktop Status cell (wrapped in `relative z-10` so it sits above the row overlay) and the mobile card (status area plus button above the overlay link). Pass `type`, `labels` and `name={row.fullName}`. The table stays a Server Component.
- [X] T036 [US4] Walk quickstart step 10, including the failure path (stop `mongod` or point `MONGODB_URI` at a bad host after the page loads), at 360px and 1440px. Check keyboard order: Tab reaches the row link and then the button, with focus visible. Record the results in `verification.md`.

**Checkpoint**: All four stories work independently.

---

## Phase 7: Polish & cross-cutting concerns

- [ ] T037 [P] Accessibility pass on both views and the drawer:
  - one h1 each, labelled selects, the badge's screen-reader text, the button names
  - `aria-current` on the nav, focus visible, 44px targets
  - the Under 18 and "Course removed" chips meet AA contrast
  
  Fix in the touched components and record the results in `verification.md`.
- [X] T038 [P] 360px and reduced-motion pass: no horizontal scroll on either view (5 filter selects stacked, long course titles and organizations wrap), the drawer, or the mobile menu. With `prefers-reduced-motion: reduce`, the nav indicator and drawer don't animate (quickstart 13). Fix styles in `src/app/globals.css` or the components, and record the results.
- [ ] T039 Indexes: with the dev server having connected once, run `db.leads.getIndexes()` in `mongosh` and confirm `{type:1,status:1,createdAt:-1}` and `{type:1,courseId:1}` (quickstart 12). Record the output in `verification.md`.
- [ ] T040 Regression (quickstart 11, 14): the `/register` and `/workshop` forms submit and confirm as before, and the owner email is unchanged. Row actions (WhatsApp text per type, copy, notes, delete with confirmation) work in both views. Programs and Courses admin pages work. Login still lands on the workshop view.
- [X] T041 Final gate: `npm run lint`, `npm run build`, `npm run test:unit` (all pass; record the count) and `npm run test:admin-guard` with the dev server running (parts A–D). Record the results in `verification.md`.
- [X] T042 List the DRAFT copy for owner sign-off at the end of `specs/026-split-submissions/verification.md`: both WhatsApp prefills, the empty-state texts, the H1s, "Mark contacted" / "Marked contacted", and "Course removed".

---

## Dependencies & execution order

### Phase dependencies

- **Setup (P1)** → **Foundational (P2)** → **US1 (P3)** → **US2 (P4)** → **US3 (P5)** → **US4 (P6)** → **Polish (P7)**

### Story dependencies

- **US1**: needs all of Foundational. It generalises the shared components.
- **US2**: needs US1's generalised `FilterBar`, `SubmissionsTable`, `StatStrip`, `Pagination` and `LeadDrawer` (T018–T022).
- **US3**: needs Foundational (`getNewCounts`, layout revalidation). It's independent of US2 apart from linking to the course route; it can start after US1.
- **US4**: needs `SubmissionsTable` with the overlay card structure (T021) and the type-scoped `setLeadStatus` (T011). It can start after US1, in parallel with US2 or US3.

### Within Foundational

- T002 → T003 → T004
- T005 → T007 → T010; T008 → T010; T005 → T011 → T017
- T006, T008 and T009 are independent of each other
- Each test task depends on its module (T012←T005, T013←T007, T014←T006, T015←T008, T016←T009)

### Parallel opportunities

- **Foundational**: T005, T006, T008 and T009 together, then T012–T016 together once their modules exist. T002–T004 (snapshot) run alongside the pure helpers.
- **US1**: T019 alongside T018/T020; T018–T022 touch different files and can be split across workers, but T023 needs all of them.
- **US3**: T031 alongside T030.
- **Polish**: T037 and T038 together.

## Parallel example: Foundational

```text
T005 leads-params.ts      T006 lead-status.ts      T008 course-leads.ts      T009 whatsapp.ts
        ↓                        ↓                        ↓                        ↓
T007 leads-filter.ts     T014 test               T015 test                 T016 test
        ↓
T012 test, T013 test, T010 leads-query.ts
```

## Implementation strategy

### MVP (US1 only)

Phases 1–3 give the owner a focused workshop view with type-scoped, safe actions, and the category snapshot starts being recorded on every new registration from that point on. Course records are temporarily only reachable once US2 lands, so ship US1 and US2 together if the release goes out mid-feature.

### Incremental delivery

1. Foundation (data, snapshot, helpers, reads, actions, tests). Guard test part D proves the wrong-type checks.
2. US1 workshop view, then US2 course view. Release point.
3. US3 sidebar badges.
4. US4 Mark contacted.
5. Polish and final gate. Commit, merge to `main`, delete the branch (project rule).
