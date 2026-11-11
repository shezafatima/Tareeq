---
description: "Task list for 025-courses-catalog"
---

# Tasks: Courses and Course Categories (admin-managed)

**Input**: Design documents from `/specs/025-courses-catalog/`
**Prerequisites**: plan.md, spec.md, research.md (R1â€“R16), data-model.md, contracts/ (server-actions.md, data-access.md, routes-and-ui.md), quickstart.md

**Tests**: Included. The spec requires extending the existing unauthenticated-action test (FR-001, SC-002), and research R16 defines unit tests for the pure modules. Unit tests use `node --test` in `tests/unit/*.test.ts` and import pure modules by **relative** path with `.ts` extensions, like the existing tests (e.g. `tests/unit/admin-programs-schema.test.ts`).

**Organization**: Tasks are grouped by user story. Execution order follows the plan's milestones, which differs from spec priority in one place: **US4 (categories, P2) runs before US1 (P1)** because a course cannot be created without a category.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1â€“US5 from spec.md

## Conventions every task must follow

- Mirror the named Programs file. Read it before writing its course counterpart.
- Pure modules (`options.ts`, `view.ts`, `courses-schema.ts`, `slug.ts`) use relative imports only and no `server-only`, so tests and client code can import them.
- Server modules start with `import "server-only";`. Action files start with `"use server";` and every export is `withAdmin(...)`.
- Brand tokens only (no hex). Sora headings, Inter body. 44px touch targets. Animate transform/opacity only, off under `prefers-reduced-motion`.
- `"use client"` only on the components the plan lists, with a one-line comment giving the reason.
- No new dependencies. Do not change Programs behaviour.

---

## Phase 1: Setup (shared infrastructure)

**Purpose**: Confirm a clean baseline before any change.

- [X] T001 Record baseline: run `npm run lint`, `npm run build`, `npm run test:unit` and `npm run test:admin-guard -- --no-http` on branch `025-courses-catalog`. Write the pass/fail results and the guard test's action count in `specs/025-courses-catalog/verification.md` (new file, section "Baseline").

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Vocabulary, models, shared validation and pure helpers used by every story.

**âš ï¸ CRITICAL**: No user story work starts until this phase is done.

- [X] T002 [P] Create `src/lib/courses/options.ts` (pure). Include: `LEVELS`, `FORMATS`, `ENROLLMENT_STATUSES`, `LISTED_STATUSES` as const tuples; types `Level`, `Format`, `EnrollmentStatus`; `LEVEL_LABELS`, `FORMAT_LABELS`, `ENROLLMENT_LABELS` exactly as in data-model.md; re-export `SLUG_PATTERN` and `SLUG_MAX` from `../programs/options.ts`; plain types `CourseCategory`, `Course`, `CourseCardData`, `SyllabusItem` exactly as in data-model.md "Plain shapes".
- [X] T003 [P] Create `src/lib/admin/slug.ts` (pure). Export `nextFreeSlug(base: string, taken: Iterable<string>, max = SLUG_MAX): string`: return `base` if it isn't taken, otherwise the lowest `base-N` (N â‰¥ 2) not in `taken`, trimming `base` (and any trailing hyphen) so the result is at most `max` characters. Import `SLUG_MAX` from `../programs/options.ts`.
- [X] T004 Create `src/lib/courses/model.ts` (`server-only`), mirroring `src/lib/programs/model.ts`. Define `CourseCategoryModel` (collection `course_categories`) and `CourseModel` (collection `courses`, `category: { type: Schema.Types.ObjectId, ref: "CourseCategory", required: true }`, syllabus subdocs `_id: false`) with every field, limit, enum, default and index from data-model.md. Use the same `coverImageUrl` validator as programs. Use the `mongoose.models.X ?? mongoose.model(...)` guard. Depends on T002.
- [X] T005 [P] Create `src/lib/admin/courses-schema.ts` (pure, `zod/mini`), mirroring `src/lib/admin/programs-schema.ts`:
  - export `LIMITS` and `MESSAGES` (slugTaken "Another course already uses this address. Choose a different one.", categorySlugTaken "Another category already uses this address. Choose a different one.", category "Choose a category.", plus level/format/status messages)
  - export `courseSchema`, `categorySchema`, and types `CourseInput`, `CourseFormValues` (`order` as string, `slugAuto: boolean`, `published` and `featured` booleans, `category` an id string), `CategoryInput`, `CategoryFormValues`
  - export `parseCourse` (drops blank outcome and syllabus rows, converts `order` text) and `parseCategory`
  - reuse `slugify` and `isAllowedCoverUrl` from `./programs-schema.ts`; validate `category` with `/^[a-f0-9]{24}$/`
  - Depends on T002.
- [X] T006 [P] Create `src/lib/courses/view.ts` (pure). Implement `isListed`, `sortCourses` (featuredâ†“, orderâ†‘, titleâ†‘, no mutation), `parseCourseFilters(search, categorySlugs)`, `courseFacts(course)` (Format, Duration, Starts only if set, Price only if set, Level â†’ `{label,value}[]`, skipping empty values), `toCardData`, `toCourseOptions(courses, categories)` (open + coming-soon only, grouped by category order with the category name as `group`, uncategorised last, each `{id, name: title, slug, group, status}`) and `confirmationVariant(option?)`, per contracts/data-access.md. Depends on T002.
- [X] T007 Extend `src/lib/admin/result.ts`: add `"in_use"` to `FailureCode` and an optional `count?: number` to `Failure`. Don't change anything else.
- [X] T008 [P] Unit tests in `tests/unit/courses-slug.test.ts` for `nextFreeSlug`: free base, first collision â†’ `-2`, gap filling (`-2`,`-4` taken â†’ `-3`), trimming at `SLUG_MAX`, and no trailing hyphen after a trim. Depends on T003.
- [X] T009 [P] Unit tests in `tests/unit/courses-schema.test.ts`: a valid course parses; each required field produces its message; blank outcome and syllabus rows are dropped; a bad category id fails; a bad cover URL fails; `order` text "" fails and "3" becomes 3; the category schema validates name, slug and order. Depends on T005.
- [X] T010 [P] Unit tests in `tests/unit/courses-view.test.ts`: sort order (featured first, then order, then title); `isListed` excludes closed and unpublished; `parseCourseFilters` drops an unknown category or level; `courseFacts` omits an empty start date and price; `toCourseOptions` groups and orders by category, puts uncategorised last and excludes closed; `confirmationVariant` returns open vs waitlist. Depends on T006.

**Checkpoint**: `npm run test:unit` passes, including the existing Programs tests unchanged.

---

## Phase 3: User Story 4 â€” Admin manages categories (Priority: P2, built first because courses need a category) 

**Goal**: The admin can list, create, edit, reorder and delete categories. A delete is blocked while courses use the category.

**Independent Test**: Sign in, create two categories, change their order numbers and see the list reorder, edit a name, and delete an empty category. (The blocked delete is re-checked in US1 once courses exist.)

- [X] T011 [US4] Create `src/lib/admin/course-categories-actions.ts` (`"use server"`), with `createCategory`, `updateCategory`, `setCategoryOrder` and `deleteCategory`, each wrapped in `withAdmin`, mirroring `src/lib/admin/programs-actions.ts`:
  - re-validate with `parseCategory`, and check `isObjectId` on every id
  - slug collision per research R4: `slugAuto` on create â†’ `nextFreeSlug` over a single `^base(-\d+)?$` query, retry once on E11000; a typed slug â†’ `conflict` + `fieldErrors.slug`
  - `deleteCategory` runs `CourseModel.countDocuments({ category: id })` and returns `{ ok:false, code:"in_use", count }` when the count is above 0
  - after each successful write, refresh: `revalidateTag("categories",{expire:0})`, `revalidateTag("courses",{expire:0})`, `revalidatePath("/admin/courses")`, `revalidatePath("/admin/courses/categories")`
  - log with `logAdmin("category", â€¦)`
- [X] T012 [P] [US4] Create `src/lib/admin/courses-read.ts` (`server-only`, uncached), mirroring `src/lib/admin/programs-read.ts`. Start with `listAllCategories()`: an `AdminCategory[]` sorted by order then name, where `courseCount` comes from one `CourseModel.aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }])`.
- [X] T013 [US4] Extend `scripts/admin-guard-test.mts`:
  - add a `REQUIRED_ACTIONS` set containing every current export of `programs-actions.ts` and `leads-actions.ts` (read the files for their names) plus `createCategory`, `updateCategory`, `setCategoryOrder`, `deleteCategory`, `createCourse`, `updateCourse`, `setCoursePublished`, `setCourseFeatured`, `deleteCourse`
  - fail when any required name was not found among the probed exports
  - add the probe arg `[{ id: "000000000000000000000000", featured: true, order: 1, values: {} }]`
  - Course names are expected to be missing until T019. Run with `-- --no-http` and confirm only those 5 are reported.
- [X] T014 [US4] Create the client component `src/components/admin/CategoryManager.tsx` (reason: drawer, dialog and inline order state). Props: `categories: AdminCategory[]`. It includes:
  - rows (name, slug, course count, an order number input saved with `setCategoryOrder` on blur or Enter, Edit, Delete)
  - a "New category" button opening the existing `Drawer` with fields Name, Web address (slug), Description and Order, using the `slugTouched` â†’ `slugAuto` logic from `ProgramForm.tsx` and `parseCategory` for instant errors
  - delete through `ConfirmDialog`; on `in_use`, show the toast "This category still has {count} course{s}. Move them to another category or delete them first."
  - success and failure toasts via `useActionFeedback`; `router.refresh()` after success
  - on phones, rows stack as cards at 360px
- [X] T015 [US4] Create `src/app/admin/(panel)/courses/categories/page.tsx`: `await requireAdmin()`, `safeLoad(listAllCategories)`, h1 "Course categories", a back link to `/admin/courses`, `UnavailableNotice` when the load fails, an `EmptyState` ("No categories yet. Create one to start adding courses.") together with `CategoryManager` for the create button, `metadata = { title: "Course categories" }`.
- [X] T016 [US4] Add the Courses item to `src/components/admin/AdminNav.tsx`: `{ href: "/admin/courses", label: "Courses", Icon: GraduationCap, isActive: (p) => p.startsWith("/admin/courses") }`, importing `GraduationCap` from `@phosphor-icons/react/dist/ssr`. Check the mobile menu (`src/components/admin/MobileMenu.tsx`) shows it too.

**Checkpoint**: The categories page works end-to-end at 390px and 1440px. The guard test reports only the not-yet-written course actions as missing.

---

## Phase 4: User Story 1 â€” Admin publishes a course (Priority: P1) ðŸŽ¯ MVP

**Goal**: The admin creates, edits, previews, publishes, features, filters and deletes courses.

**Independent Test**: Create and publish a course; check it appears in the admin grid with the right chips and toggles; follow quickstart steps 3â€“5 and 13 (blocked category delete).

- [X] T017 [P] [US1] Create `src/components/sections/courses/CourseStatusChip.tsx` (server-safe, no server imports). Props `{ status: EnrollmentStatus }`. Same pill style as `src/components/sections/programs/StatusChip.tsx`; the saffron dot only for `open`; coming-soon gets a muted dot (`bg-midnight/30`); the label comes from `ENROLLMENT_LABELS`.
- [X] T018 [US1] Create `src/components/sections/courses/CourseCard.tsx` (presentational: no `"use client"`, no server-only imports). Props `{ course: CourseCardData; headingLevel?: "h2"|"h3"; sizes?: string }`. It renders:
  - `ProgramCover` (url, sizes) for the cover or brand pattern
  - a category name eyebrow (omitted when null), the title heading, summary (2-line clamp), and a meta row (level Â· format Â· duration) via `LEVEL_LABELS`/`FORMAT_LABELS`
  - `CourseStatusChip` and the price text (omitted when empty)
  - the whole card as one `next/link` to `/courses/<slug>`, with `data-status={enrollmentStatus}` on the root
  - Add `.course-card` styles in `src/app/globals.css`, tokens only: hover lift with transform and the shadow token, disabled under reduced motion; `[data-status="coming-soon"]` â†’ muted surface (`bg-soft`/reduced emphasis), no lift, text still AA. Depends on T017.
- [X] T019 [US1] Create `src/lib/admin/courses-actions.ts` (`"use server"`), with `createCourse`, `updateCourse`, `setCoursePublished`, `setCourseFeatured` and `deleteCourse`, each wrapped in `withAdmin`, mirroring `programs-actions.ts`:
  - follow contracts/server-actions.md
  - `parseCourse`, then check the category exists (`CourseCategoryModel.exists`) â†’ `invalid` + `fieldErrors.category`
  - slug rule per research R4: suffix only on create when `slugAuto`; on update, conflict only
  - an empty cover is `$unset`
  - refresh after success: `revalidateTag("courses",{expire:0})` plus `course:<slug>` (and the old slug when it changed), `revalidatePath("/admin/courses")`
  - `createCourse` returns `{ ok:true, id, slug }`
  - log with `logAdmin("course", â€¦)`
- [X] T020 [US1] Add to `src/lib/admin/courses-read.ts`: `listAllCourses({ category?, status? })` (`AdminCourse[]`; category name/slug via one category read and a map in memory, `null` when the category is missing; filters only when valid; sort featuredâ†“ orderâ†‘ titleâ†‘) and `getCourseById(id)` (null for a malformed or unknown id).
- [X] T021 [P] [US1] Extend `src/components/admin/PublishedToggle.tsx` with an optional prop `action?: (input: { id: string; published: boolean }) => Promise<ActionResult>`, defaulting to the currently imported `setProgramPublished`. Programs pages pass nothing and behave exactly as before.
- [X] T022 [P] [US1] Create the client component `src/components/admin/FeaturedToggle.tsx` (reason: optimistic pressed state). Props `{ id, title, featured }`. A star button (`Star` from phosphor: `weight="fill"` with saffron fill when on, outline when off) with `aria-pressed` and `aria-label={\`Feature ${title}\`}`, at least 44Ã—44px. It calls `setCourseFeatured` optimistically, rolls back and shows an error toast on failure, then `router.refresh()`. Follow `PublishedToggle.tsx` for the toast and pending handling.
- [X] T023 [US1] Create `src/components/admin/CourseAdminCard.tsx` (server). Props `{ course: AdminCourse }`. It shows:
  - the title (linked to `/admin/courses/<id>/edit`), the category name or a "No category" warning chip, and the level label
  - the enrollment status via the admin `StatusChip` (open â†’ `royal`, coming-soon â†’ `sky`, closed â†’ `grey`)
  - `<PublishedToggle id title published action={setCoursePublished} />` and `<FeaturedToggle â€¦/>`
  - Mirror `src/components/admin/ProgramCard.tsx`. Depends on T021, T022.
- [X] T024 [US1] Create `src/app/admin/(panel)/courses/page.tsx`: `requireAdmin()`. Read `searchParams` `category` and `status` and validate them (category must be one of the loaded category ids; status in `ENROLLMENT_STATUSES`). `safeLoad` the courses (filtered) and categories. It shows:
  - header: h1 "Courses", a "Categories" link and a "New course" link (only when at least one category exists)
  - a GET `<form>` with two `SelectField`s (All categories / each category; All statuses / each status), an Apply button and a "Clear filters" link
  - a grid `ul.grid gap-4 sm:grid-cols-2 xl:grid-cols-3` of `CourseAdminCard`
  - empty states: no categories â†’ `EmptyState` linking to categories; no courses; no matches (with Clear filters)
  - `UnavailableNotice` on a failed load
  - Depends on T020, T023.
- [X] T025 [US1] Create the client component `src/components/admin/CoursePreview.tsx` (reason: re-renders from form state on each keystroke). It maps `CourseFormValues` + the category list to `CourseCardData` with placeholders ("Course title", "A short summary of the course appears here.") and renders `<CourseCard>` inside an `inert` wrapper labelled "Preview of the public Courses page", mirroring `ProgramPreview.tsx`. Depends on T018.
- [X] T026 [US1] Create the client component `src/components/admin/CourseEditor.tsx` (reason: form state). It mirrors `src/components/admin/ProgramForm.tsx` structure, field order, error focus (`ORDER` array) and `useActionFeedback`:
  - props `{ mode: "create" | "edit"; id?: string; initial: CourseFormValues; categories: {id,name}[] }`
  - fields: Title, Web address (slug, with the `slugTouched` logic and the help text "Shown as /courses/â€¦ Changing it later breaks old links to this course."), Category (SelectField), Level, Format, Enrolment status, Summary, Description (help "Markdown works: ## headings, **bold**, - lists."), Outcomes (`ListEditor` string list), Syllabus (`ListEditor` steps), Duration, Start date (optional), Price, Cover image URL, Featured checkbox, Order, Published checkbox
  - submit sends `slugAuto = !slugTouched` (create only); on success, a create navigates to `/admin/courses/<id>/edit` and shows a toast naming the final slug when it got a suffix
  - edit mode adds a Delete button â†’ `ConfirmDialog` â†’ `deleteCourse` â†’ navigate to `/admin/courses`
  - layout: form and `CoursePreview` side by side at `xl`, with the preview below the form on phones
  - Depends on T019, T025.
- [X] T027 [US1] Create `src/app/admin/(panel)/courses/new/page.tsx` (`requireAdmin`, load the categories; if there are none, show an `EmptyState` linking to `/admin/courses/categories`; otherwise render `CourseEditor mode="create"` with defaults: status `coming-soon`, level `beginner`, format `live`, order "0", published false, featured false, category = the first category) and `src/app/admin/(panel)/courses/[id]/edit/page.tsx` (`requireAdmin`, `getCourseById`, `notFound()` when missing, map to `CourseFormValues`), mirroring the programs `new`/`edit` pages. Depends on T026.
- [X] T028 [US1] Run `npm run test:admin-guard -- --no-http`; it must now PASS with all REQUIRED_ACTIONS present and refused. Record the result in `specs/025-courses-catalog/verification.md`.

**Checkpoint**: Quickstart steps 2â€“5 and 13 pass at 390px and 1440px. Programs admin is unchanged.

---

## Phase 5: User Story 2 â€” Visitor browses courses and reads one (Priority: P1)

**Goal**: Public `/courses` with URL filters and `/courses/[slug]` with a sticky CTA; the Online courses card links here.

**Independent Test**: With seeded published courses, run quickstart steps 5â€“7, 10, 12 and 14.

- [X] T029 [US2] Create `src/lib/courses/data.ts` (`server-only`), mirroring `src/lib/programs/data.ts`. Implement `getCategories`, `getPublishedCourses({category?, level?})`, `getCourseBySlug`, `getPublishedCourseSlugs`, `loadPublishedCourses` and `getOfferedCourseOptions`, with the cache keys and tags in contracts/data-access.md. Category names come from a cached category read joined in memory, never `populate`. Use `view.ts` helpers for sorting, listing and options. A malformed slug returns null without a query.
- [X] T030 [P] [US2] Create the client component `src/components/sections/courses/CourseFilter.tsx` (reason: reads and updates the URL, handles chip presses). It mirrors `ProgramFilter.tsx` (`useSyncExternalStore` + popstate + `history.replaceState`):
  - props `{ listId; categories: {slug,name}[]; levels: Level[] }`
  - two labelled chip groups: "Filter courses by category" (All + categories) and "Filter courses by level" (All + levels present)
  - in `useLayoutEffect`, set or remove `hidden` on each `#listId > li` by comparing `data-category`/`data-level`, and mark newly shown items `data-revealed="instant"`
  - a `role="status"` count ("1 course" / "N courses"); when the count is 0, show "No courses match these filters." and a "Show all courses" button that clears both params
  - unknown params are ignored via `parseCourseFilters`
- [X] T031 [P] [US2] Create `src/components/sections/courses/CourseFilterScript.tsx`: an inline pre-paint script like `ProgramFilterScript.tsx`. It reads `category` and `level`, accepts only the passed `categorySlugs` and `LEVELS`, and sets `hidden` on non-matching `li`s of `#listId`.
- [X] T032 [US2] Create `src/components/sections/courses/CourseBrowser.tsx` (server). Props `{ heading, intro, courses: Course[] | null, categories: CourseCategory[] }`:
  - an h1 + intro header in the same style as `ProgramBrowser.tsx`
  - when there are courses: `CourseFilter` with only the categories that have listed courses (category order) and the levels present, then `<ul id="course-list" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" suppressHydrationWarning>` with one `Reveal as="li"` per course carrying `data-category` (slug or `""`) and `data-level`, each rendering `CourseCard headingLevel="h2"`, then `CourseFilterScript`
  - empty (`[]`): "Courses are coming soon" with a sentence and a `Button href="/register"` labelled from `getCourseFormLabel()` passed as a prop, and no filters
  - unavailable (`null`): the same friendly fallback wording as Programs, linking to contact
  - Depends on T018, T030, T031.
- [X] T033 [US2] Replace `src/app/(site)/courses/page.tsx`: `export const revalidate = 3600`; metadata title "Courses" plus a description; load `loadPublishedCourses()` and `getCategories()` (categories failure â†’ `[]`); render `CourseBrowser` with heading "Courses" and the intro "Short online courses in practical AI, taught the Tareeq way. Pick a topic and level that suits you." Mark it `// DRAFT: owner to confirm intro wording.` Remove the placeholder `PlaceholderPage` usage. Depends on T029, T032.
- [X] T034 [P] [US2] Create `src/components/sections/courses/CourseCta.tsx` (server). Props `{ course; className?; variant? }`. When `enrollmentStatus !== "closed"`, a `Button` "Register" â†’ `/register?course=${slug}`; when closed, a secondary `Button` "Registration closed" â†’ `/register`, with the visible note "Registration for this course has closed. Leave your details and we'll tell you about the next one."
- [X] T035 [US2] Create `src/components/sections/courses/CourseHeader.tsx` (h1 title, summary, category, level, `CourseStatusChip`, cover via `ProgramCover` with `priority`; mirror `ProgramHeader.tsx`), `src/components/sections/courses/CourseCtaCard.tsx` (desktop aside using the `program-booking-card` classes: price, `ProgramFacts variant="list"` from `courseFacts`, `CourseCta`) and `src/components/sections/courses/CourseMobileCtaBar.tsx` (copy the `MobileCtaBar.tsx` markup with `data-program-cta-bar` and the `program-cta-bar` class so the existing CSS pads the content and lifts the WhatsApp button; price + `CourseCta`). Depends on T017, T034.
- [X] T036 [US2] Create `src/app/(site)/courses/[slug]/page.tsx`, mirroring `src/app/(site)/programs/[slug]/page.tsx`:
  - `revalidate = 3600`, `generateStaticParams` from `getPublishedCourseSlugs()`
  - `generateMetadata` (title, summary, canonical `/courses/<slug>`, OG + Twitter with the allowed cover or `/robot.png`)
  - `notFound()` when `getCourseBySlug` is null
  - body: `CourseHeader`, then in the grid `ProgramProse`, `ProgramOutcomes`, `CurriculumTimeline steps={course.syllabus}` under an h2 "Syllabus", and an h2 "The details" with `ProgramFacts variant="grid"` from `courseFacts`; `CourseCtaCard` in the desktop column; `CourseMobileCtaBar`
  - Also create `src/app/(site)/courses/[slug]/not-found.tsx`, mirroring the programs one, with a link to `/courses`.
  - Depends on T029, T035.
- [X] T037 [P] [US2] Point the Online courses card at Courses: set `onlineCoursesHref = "/courses"` in `src/lib/site.ts:16` (and update its comment), and change the CTA label in `src/content/online-courses.ts` to "Browse courses" (mark `// DRAFT: owner to confirm`). Check `/programs` and the home Programs section render the new link, and that no Programs data or filter changed.
- [ ] T038 [US2] Seed check data by hand through the admin UI (no seed script): 2 categories and 4 courses (open+featured, open, coming-soon, closed), all published, plus 1 unpublished. Verify quickstart steps 5â€“7, 10, 12 and 14 at 360px, 390px and 1440px, with reduced motion on once. Record the results in `specs/025-courses-catalog/verification.md`.

**Checkpoint**: The public catalogue and course pages work, and the filtered URL survives a reload with no flash.

---

## Phase 6: User Story 5 â€” Empty catalogue (Priority: P3)

**Goal**: Before any course is listed, `/courses` and `/register` still work.

**Independent Test**: With no listed courses (unpublish all or close all), `/courses` shows "Courses are coming soon" with a link to /register.

- [X] T039 [US5] Verify and fix the empty path in `src/components/sections/courses/CourseBrowser.tsx`: `courses.length === 0` (including when every published course is closed) shows only the coming-soon message and the Register link, with no filter chips and no empty `<ul>`. Check at 360px. Record in `specs/025-courses-catalog/verification.md`.

(The empty register select is covered by T044.)

---

## Phase 7: User Story 3 â€” Visitor registers for a specific course (Priority: P2)

**Goal**: The register form lists offered courses grouped by category, preselects from `?course=`, stores the id and title snapshot, and shows confirmation copy that depends on the status.

**Independent Test**: Quickstart steps 8, 9 and 11, plus `/register` with an unknown or closed `?course=` (nothing preselected, no error).

- [X] T040 [P] [US3] Extend `src/components/ui/SelectField.tsx`: options accept an optional `group?: string`. Add the pure exported helper `groupOptions(options)` in `src/components/ui/select-groups.ts`, which returns runs of `{ group?: string; options[] }` that keep the input order. Render a grouped run inside `<optgroup label>` and an ungrouped run as bare `<option>`s. Existing callers (no groups) must render identical markup.
- [X] T041 [P] [US3] Unit tests in `tests/unit/select-groups.test.ts` for `groupOptions`: all ungrouped â†’ one bare run; consecutive same group â†’ one run; order kept; an ungrouped trailing "Not sure yet" â†’ its own bare run. Depends on T040.
- [X] T042 [US3] Update content types and copy:
  - In `src/content/types.ts`, extend `CourseOption` with `slug?`, `group?` and `status?: "open" | "coming-soon"`, and add `open: { confirmHeading; confirmNext; whatsappPrefill }` to `LeadCopy["course"]`.
  - In `src/content/data/leads.ts`, set `courseFormLabel = "Register"` and add `course.open` = heading "You're registered", next "We'll WhatsApp you within 1 working day with dates, fees and how to join.", prefill "Hi Tareeq, I've just registered for {course} on your website (ref {ref}). Please send me the dates and fees." Mark these `// DRAFT: owner to confirm (025)`.
  - Leave the waitlist copy unchanged.
- [X] T043 [US3] Update `src/content/index.ts`:
  - `getCourseOptions()` returns `[...(await getOfferedCourseOptions()), { id: "not-sure", name: "Not sure yet" }]`; on error, log `[courses] options read failed: <ErrorName>` and return only "Not sure yet"
  - update its doc comment
  - remove the `courseList` import and delete `src/content/data/courses.ts`
  - `grep` for any remaining import of `data/courses` and fix it
  - Depends on T029, T042.
- [X] T044 [US3] Update `src/lib/leads/state.ts` (success gains optional `variant?: "open" | "waitlist"`) and `submitCourse` in `src/lib/leads/actions.ts`:
  - compute `variant = confirmationVariant(chosenOption)`
  - the WhatsApp prefill uses `copy.course.open.whatsappPrefill` (replacing `{course}` with the title and `{ref}`) for open, else the existing waitlist prefill
  - on the duplicate paths, read `{ ref, courseId }` and recompute the variant against the current options (default `waitlist`)
  - `courseName` stays the snapshot of the option name (the course title)
  - the workshop path is untouched (`whatsappFor` keeps its signature for workshops; add a course-specific helper rather than changing shared behaviour)
  - Depends on T006, T042, T043.
- [X] T045 [US3] Update `src/components/forms/CourseForm.tsx`:
  - new prop `defaultCourseId?: string`, used as the select default when there are no returned values (`v.courseId ?? defaultCourseId ?? ""`)
  - map `courseOptions` to `{ value: id, label: name, group }`
  - on success, choose heading and next from `state.variant === "open" ? copy.course.open : copy.course`
  - update the "Join the waitlist" doc comment
  - Depends on T040, T042, T044.
- [X] T046 [US3] Update `src/app/(site)/register/page.tsx`:
  - accept `searchParams: Promise<{ course?: string | string[] }>`, take a single string value, find the offered option whose `slug` matches, and pass its `id` as `defaultCourseId` (otherwise undefined, with no error)
  - change the sr-only h2 text to "Online course registration form"
  - check `src/content/data/pages.ts` register meta: title and heading follow `courseFormLabel`; keep the eyebrow "Online courses"; update the intro/description to drop "waitlist" wording ("Leave your details and we'll WhatsApp you about your course, with dates and fees.", marked DRAFT)
  - Depends on T043, T045.
- [ ] T047 [US3] Verify quickstart steps 1 (empty register select), 8, 9 and 11, and `/register?course=<closed-slug>` / `?course=nope`. Check the stored lead (admin Submissions drawer and owner email) shows the course title, and that renaming the course leaves the old lead's title unchanged. Check the workshop form still submits and confirms as before. Record in `specs/025-courses-catalog/verification.md`.

**Checkpoint**: All five stories work on their own and together.

---

## Phase 8: Polish & cross-cutting concerns

- [ ] T048 [P] Accessibility pass on all new pages: one h1 each, chip groups labelled, `aria-pressed` correct, the live count announced, focus visible, the Drawer/Dialog focus trap and return, 44px targets, AA contrast on coming-soon cards and the "No category" chip. Fix in `src/components/sections/courses/*` and `src/components/admin/{CourseEditor,CategoryManager,CourseAdminCard,FeaturedToggle}.tsx`, and record the results in `specs/025-courses-catalog/verification.md`.
- [ ] T049 [P] Reduced-motion and 360px pass: check no horizontal scroll on `/courses`, `/courses/[slug]` (long title, 12 syllabus items), `/register`, `/admin/courses`, the editor and categories; check card hover, Reveal and drawer motion are off with `prefers-reduced-motion: reduce`. Fix styles in `src/app/globals.css` and record the results in `specs/025-courses-catalog/verification.md`.
- [ ] T050 Run mobile Lighthouse on `/courses` and one `/courses/<slug>`: Performance â‰¥ 90, Accessibility â‰¥ 95, SEO â‰¥ 90 (Principle VI). Fix regressions and record the scores in `specs/025-courses-catalog/verification.md`.
- [ ] T051 Final gate: `npm run lint`, `npm run build`, `npm run test:unit` (all existing and new pass, Programs tests unchanged), and `npm run test:admin-guard` with the dev server running. Then click through the Programs regression at `/programs`, `/programs/<slug>`, `/admin/programs` (toggle publish once and revert) to confirm SC-008. Record in `specs/025-courses-catalog/verification.md`.
- [X] T052 List the DRAFT copy for owner sign-off at the end of `specs/025-courses-catalog/verification.md`: the `/courses` intro, the open confirmation, the WhatsApp prefill, the register intro, and "Browse courses".

---

## Dependencies & execution order

### Phase dependencies

- **Setup (P1)** â†’ **Foundational (P2)** â†’ **US4 (P3)** â†’ **US1 (P4)** â†’ **US2 (P5)** â†’ **US5 (P6)** â†’ **US3 (P7)** â†’ **Polish (P8)**

### Story dependencies

- **US4 (categories)**: needs Foundational only.
- **US1 (admin courses)**: needs US4 (a category must exist to create a course).
- **US2 (public catalogue)**: needs US1 for real data, and its `CourseCard` (T018). The code (T029â€“T037) can start in parallel with US1 once T018 is done.
- **US5 (empty)**: needs US2's `CourseBrowser`.
- **US3 (register)**: needs T029 (`getOfferedCourseOptions`) from US2. T040â€“T042 can start any time after Foundational.

### Within each story

Pure helpers â†’ server data/actions â†’ server pages â†’ client leaves â†’ verification.

## Parallel opportunities

- **Foundational**: T002, T003 and T005/T006 (after T002) in parallel; tests T008â€“T010 in parallel once their modules exist.
- **US4**: T012 alongside T011.
- **US1**: T017, T021 and T022 in parallel; T019 and T020 in parallel (different files).
- **US2**: T030, T031, T034 and T037 in parallel after T018.
- **US3**: T040/T041 and T042 in parallel, before T043â€“T046.
- **Polish**: T048 and T049 in parallel.

### Parallel example: User Story 1

```text
Task: "T017 Create CourseStatusChip in src/components/sections/courses/CourseStatusChip.tsx"
Task: "T021 Add optional action prop to src/components/admin/PublishedToggle.tsx"
Task: "T022 Create FeaturedToggle in src/components/admin/FeaturedToggle.tsx"
```

### Parallel example: User Story 2

```text
Task: "T030 Create CourseFilter in src/components/sections/courses/CourseFilter.tsx"
Task: "T031 Create CourseFilterScript in src/components/sections/courses/CourseFilterScript.tsx"
Task: "T034 Create CourseCta in src/components/sections/courses/CourseCta.tsx"
Task: "T037 Point the Online courses card at /courses in src/lib/site.ts and src/content/online-courses.ts"
```

## Implementation strategy

### MVP first

1. Phases 1â€“2 (foundation, unit tests green).
2. Phase 3 (US4) and Phase 4 (US1): the admin can manage the catalogue. **Stop and validate** (quickstart 2â€“5, 13; guard test PASS).
3. Phase 5 (US2): visitors can browse. This is the first public value; deployable here.

### Incremental delivery

4. Phase 6 (US5) empty-state check.
5. Phase 7 (US3) register integration and copy change.
6. Phase 8 polish, Lighthouse and final gate. Then commit, merge to `main`, delete the branch (one feature per branch).

## Notes

- Commit after each phase checkpoint with a conventional message, e.g. `feat(courses): admin categories`.
- Never edit Programs files except the three additive points in the plan: `PublishedToggle` (optional prop), `site.ts` (`onlineCoursesHref`) and `online-courses.ts` (label).
- If a task finds a mismatch with the contracts, stop and update the contract first, then the code.
