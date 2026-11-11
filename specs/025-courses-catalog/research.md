# Research: Courses and Course Categories

**Feature**: 025-courses-catalog | **Date**: 2026-11-10

There were no open `NEEDS CLARIFICATION` items. The spec clarifications (2026-11-10) and the existing Programs code settle every unknown. Each decision below follows the format: Decision / Rationale / Alternatives considered.

---

## R1. Where course data lives and how it is read

**Decision**: Use two new Mongoose models in `src/lib/courses/model.ts`: `CourseCategory` (collection `course_categories`) and `Course` (collection `courses`, `category` is an ObjectId ref). A server-only module, `src/lib/courses/data.ts`, is the only public reader. It mirrors `src/lib/programs/data.ts`: `unstable_cache` with tags `courses`, `course:<slug>` and `categories`, a 3600 s safety refresh, and a failed read throws so it is never cached. Admin reads go through `src/lib/admin/courses-read.ts` and are not cached, the same as `programs-read.ts`.

**Rationale**: This is the same proven pattern as Programs (015/022). The tag names come from the brief.

**Alternatives considered**: Embedding the category inside each course was rejected, because renaming a category would mean editing every course and FR-005 needs a reference to count. One cached "everything" read with no per-slug tag was rejected, because the brief names `course:<slug>`.

## R2. Public reader signatures and the category join

**Decision**:
- `getCategories()` returns every category sorted by `order`, then `name`. Tag: `categories`.
- `getPublishedCourses({ category?, level? })` returns published courses with `enrollmentStatus` other than `closed`, with category name and slug resolved, sorted by `featured` (desc), then `order` (asc), then `title` (asc). The optional filters apply after the cached read, in memory (the catalogue is tens of courses), so there is one cache entry. Tags: `courses` and `categories`.
- `getCourseBySlug(slug)` returns a published course of any status (closed included, per clarification Q1) with its category, or null. Tags: `courses`, `course:<slug>` and `categories`.
- `getPublishedCourseSlugs()` covers every published slug, closed included, for `generateStaticParams`. It returns `[]` on failure so the build still succeeds.
- `loadPublishedCourses()` returns null on failure outside production runtime, the same as `loadPublishedPrograms`.
- `getOfferedCourseOptions()` returns open and coming-soon published courses grouped by category, for the register form (R9).

The category is resolved with one `CourseCategory.find()` plus a map in memory, not `populate`. That keeps both reads cacheable, and the `categories` tag still covers renames.

**Rationale**: Filters in memory keep a single cache key. Tagging course reads with `categories` means a category rename refreshes every card that shows the name.

**Alternatives considered**: Filtering in the query (a cache key per filter combination) is more entries for no gain at this size. `populate()` would hide the dependency on the categories tag.

## R3. Refresh after admin writes

**Decision**: Use one helper per action file, mirroring `refreshPublicSite` in `programs-actions.ts`:

| Action | Tags expired (`{ expire: 0 }`) | Paths |
|---|---|---|
| course create/update | `courses`, `course:<new>`, `course:<old>` if the slug changed | `/admin/courses` |
| course publish/featured toggle | `courses`, `course:<slug>` | `/admin/courses` |
| course delete | `courses`, `course:<slug>` | `/admin/courses` |
| category create/update/order/delete | `categories`, `courses` | `/admin/courses`, `/admin/courses/categories` |

`/register` renders per request (`connection()`) and reads through the cached `getOfferedCourseOptions()` (tags `courses`, `categories`), so it follows automatically.

**Rationale**: Same semantics as Programs. Stale content is never served after a write.

## R4. Slug generation and collisions (clarification Q3)

**Decision**: Reuse `slugify`, `SLUG_PATTERN` and `SLUG_MAX` from the program modules; they are pure and already tested. The form tracks `slugTouched` exactly as `ProgramForm` does and sends `slugAuto: boolean` (true only when the admin never edited the slug field). On the server:
- `slugAuto === true` and the slug is taken: call `nextFreeSlug(base, taken)`, a pure helper in `src/lib/admin/slug.ts`. It finds the lowest free `-N` (N ≥ 2), trimming `base` so the result fits `SLUG_MAX`. `taken` comes from one query: `{ slug: { $regex: ^base(-\d+)?$ } }`, selecting only `slug`.
- `slugAuto === false` and the slug is taken: return `conflict` with `fieldErrors.slug = "Another course already uses this address. Choose a different one."` (or "category").
- The unique index is the final guard. On E11000 with `slugAuto`, recompute once and retry, then fail with `conflict`.
- The suffix rule applies only on create. On update, a changed slug is always treated as typed.

**Rationale**: Matches the clarified hybrid rule. The admin is never surprised by a renamed slug they typed.

**Alternatives considered**: Always refusing (the Programs behaviour) was rejected in clarification. Always suffixing was rejected because it silently changes typed input.

## R5. Shared validation

**Decision**: Add `src/lib/admin/courses-schema.ts` (pure, `zod/mini`, relative imports only, mirroring `programs-schema.ts`). It exports `courseSchema`, `categorySchema`, `parseCourse` (drops blank outcome and syllabus rows, turns `order` text into a number), `parseCategory`, `LIMITS`, `MESSAGES` and the form value types. The `CourseEditor` client form and the Server Actions both call it. `category` is validated as a 24-hex ObjectId by the schema. The action also checks that the category exists (`invalid` with `fieldErrors.category` otherwise).

**Limits** (mirroring Programs where the field is the same): title 120, summary 240, description 20000, outcome 240, syllabus title 120 and description 1000, durationText/startDateText 120, priceText 120, order ±9999, category name 80, category description 500.

## R6. Description and cover image

**Decision**: Render course descriptions with the existing `ProgramProse` / `renderMarkdown` (marked + sanitize-html allowlist). The cover image uses the program rule: the stored value is empty, `https://…` or a site path (the `isAllowedCoverUrl` validator is reused), and display goes through the existing `ProgramCover`, which shows only `next/image`-allowed hosts (res.cloudinary.com) and otherwise the brand pattern.

**Rationale**: No new dependency (FR-032, Principle IX), and the sanitizer is already tested (`tests/unit/programs-markdown.test.ts`).

## R7. Public /courses filters (category + level, in the URL)

**Decision**: Use the Programs technique (`ProgramFilter` + `ProgramFilterScript`): the server renders every listed course card once, and a small client leaf (`CourseFilter`) only changes attributes on the server-rendered list. Category slugs are data, not a fixed set, so static CSS attribute selectors (the Programs approach) can't express them. Instead, `CourseFilter` sets the `hidden` attribute on each `<li data-category data-level>` in a `useLayoutEffect`. It reads and writes `?category=&level=` with `history.replaceState` and `useSyncExternalStore` (popstate), exactly as `ProgramFilter` does. An inline `CourseFilterScript` applies the same hiding before first paint, so a shared filtered link never flashes. Without JavaScript, every course shows. Unknown values (not in the rendered category slugs or `LEVELS`) are ignored. A `role="status"` live region announces the count. When the count is zero, a "No courses match" message with a "Show all courses" button is shown (spec US2 scenario 4).

**Rationale**: Principle XI: cards stay server-rendered and the client leaf re-renders nothing static. This also meets SC-004 (filtering under 0.5 s, no network).

**Alternatives considered**: `searchParams` on the server would make the page dynamic and need a round trip on each change, which conflicts with "client-side". A client list component would re-render the cards.

## R8. Course card shared by /courses and the admin live preview

**Decision**: Add one presentational component, `src/components/sections/courses/CourseCard.tsx`. It has no `"use client"` and no server-only imports, takes a plain `CourseCardData`, and renders cover/pattern, category, level, format, duration, status chip and price. `/courses` renders it inside a server component. The admin `CoursePreview` (client, because it re-renders from form state on each keystroke) imports the same component, inside the same list markup with `inert`, as `ProgramPreview` does. Coming-soon cards get `data-status="coming-soon"`, which CSS mutes (lower-contrast surface, no hover lift, "Coming soon" chip), but they stay links.

**Rationale**: FR-010. One component, so the preview can't drift (Principle XI: no client twin).

## R9. Register form integration

**Decision**:
- `getCourseOptions()` in `src/content/index.ts` keeps its name and becomes the bridge to `getOfferedCourseOptions()`. It returns `CourseOption[]`, extended with an optional `group` (category name), ordered by category order then course order, and always ends with `{ id: "not-sure", name: "Not sure yet" }` (no group). On a read failure it logs and returns only "Not sure yet", so the form still works and the server accepts only that value (safe degradation). The placeholder `src/content/data/courses.ts` is deleted.
- Course option `id` is the course's ObjectId string. The stored lead keeps `courseId` (string) and `courseName` (snapshot of the title). The model doesn't change, so old leads display unchanged (FR-029).
- `SelectField` gains an optional `group` on options. Consecutive options with the same `group` render inside `<optgroup label>`, and options without a group render bare. Existing callers pass no groups, so nothing they render changes.
- `/register` reads `searchParams.course` (the page is already per-request). If it matches an offered course's **slug**, that course's id becomes the select's `defaultValue`. Otherwise nothing is preselected and no error is shown. So `CourseOption` also carries `slug` (optional; absent on "Not sure yet").
- `submitCourse` already re-reads the options at submit time, which still enforces FR-028.

## R10. Confirmation that depends on the course (clarification Q2)

**Decision**:
- `courseFormLabel` becomes `"Register"` (heading, button, `/courses` and course-page links).
- `LeadCopy.course` gains an `open` variant: `confirmHeading`, `confirmNext` and `whatsappPrefill`. The existing waitlist copy stays as the default for coming-soon and "Not sure yet". New strings are marked DRAFT (owner to confirm; Principle X).
- `CourseOption` gains `status?: "open" | "coming-soon"`.
- `LeadActionState` success gains `variant?: "open" | "waitlist"`. `submitCourse` sets it from the chosen option's status and picks the matching WhatsApp prefill. On the duplicate-submission path, it reads the stored `courseId` and recomputes the variant against the current options (falling back to `waitlist`). The workshop path never sets it.
- `CourseForm` picks the heading and next line from `state.variant`.

**Proposed copy (DRAFT)**:
- open: heading "You're registered"; next "We'll WhatsApp you within 1 working day with dates, fees and how to join."; prefill "Hi Tareeq, I've just registered for {course} on your website (ref {ref}). Please send me the dates and fees."
- waitlist: unchanged.

**Rationale**: The smallest change that fixes the wording mismatch. The page-level and owner-agreed waitlist copy are kept.

## R11. Category delete guard

**Decision**: `deleteCategory` runs `CourseModel.countDocuments({ category: id })`. If the count is above 0, it returns `{ ok: false, code: "in_use", count }` and the UI shows "This category still has N course(s). Move or delete them first." Otherwise it deletes. `createCourse` and `updateCourse` check that the category exists inside the same action. In the narrow race (a course created in a category between the count and the delete), the course is left pointing at a missing category. The readers treat that as "Uncategorised": the card shows no category, it's grouped last in the register form, and a chip is not offered. The admin grid flags it "No category" so it can be fixed.

**Rationale**: MongoDB has no foreign keys. With a single owner admin, transactions aren't justified. The fallback keeps every page working.

**Alternatives considered**: A transaction (needs a replica set, adds complexity). A soft-delete category (more state for no user value).

## R12. Admin screens

**Decision**:
- `/admin/courses` is a server page with `requireAdmin()` and `safeLoad(listAllCourses)`. Filters are server-side via `?category=&status=` links/selects (a GET form, so it works without JS), the same model as the Submissions `FilterBar`, and a "Clear filters" link. The card grid uses `CourseAdminCard` (title, category, level, status chip via the admin `StatusChip` tones: open royal, coming-soon sky, closed grey), a `PublishedToggle` and a `FeaturedToggle`.
- `PublishedToggle` gains an optional `action` prop (a Server Action reference) defaulting to `setProgramPublished`, so Programs behave exactly as before. Courses pass `setCoursePublished`.
- `FeaturedToggle` is a new client leaf (a star button, `aria-pressed`, optimistic, toast on failure, rolls back).
- `/admin/courses/new` and `/admin/courses/[id]/edit` are server pages rendering `CourseEditor` (client: the form, `ListEditor` for outcomes and syllabus, `CoursePreview`). It follows `ProgramForm`'s layout, field focus on error and toasts via `useActionFeedback`. Delete is from the edit page via `ConfirmDialog`.
- `/admin/courses/categories` is a server page listing categories with course counts, plus a `CategoryManager` client leaf: create/edit in the existing `Drawer`, an inline order number input saved on blur or Enter (`setCategoryOrder`), and delete via `ConfirmDialog` that surfaces the `in_use` message.
- Loading uses the existing `(panel)/loading.tsx` skeletons. Errors use the existing `error.tsx` and `UnavailableNotice`.
- `AdminNav` ITEMS gains `{ href: "/admin/courses", label: "Courses", Icon: GraduationCap, isActive: startsWith("/admin/courses") }`. The sliding indicator already works for any count.

## R13. Session checks and the guard test

**Decision**: Every export of `src/lib/admin/courses-actions.ts` and `src/lib/admin/course-categories-actions.ts` is wrapped with `withAdmin`. `scripts/admin-guard-test.mts` already discovers every `*-actions.ts` file and probes each export with no session and a database tripwire, so the new actions are covered by naming. It is extended with a `REQUIRED_ACTIONS` list (the 8 new names plus the existing ones) and fails if any is missing, so a renamed or moved file can't silently drop out. The probe arg set gains `{ id, featured: true, order: 1, values: {} }`.

## R14. Public course page

**Decision**: `/courses/[slug]` mirrors `/programs/[slug]`: `revalidate = 3600`, `generateStaticParams` from `getPublishedCourseSlugs()`, `generateMetadata` (title, summary, canonical, OG/Twitter image = allowed cover or `/robot.png`), `notFound()` for unknown or unpublished. The body is a `CourseHeader` (title h1, summary, category, level, status chip), then `ProgramProse`, `ProgramOutcomes` and `CurriculumTimeline` (syllabus items are `{title, description}`, the same shape as `CurriculumStep`), and a facts grid via `ProgramFacts variant="grid"` built by a pure `courseFacts(course)` (format, duration, start date if set, price, level). The sticky CTA is `CourseCtaCard` (desktop, sticky via the existing `program-booking-card` CSS) and `CourseMobileCtaBar` (reusing the `program-cta-bar` CSS hooks for bottom spacing and lifting the WhatsApp button). Both use `CourseCta`: open and coming-soon show "Register" → `/register?course=<slug>`, and closed shows "Registration closed" → `/register`. Syllabus as a timeline reuses `CurriculumTimeline`, which has no client JS (reduced-motion safe).

**Rationale**: Reusing the Programs components keeps the brand and accessibility already reviewed. The new pieces are only those whose props are `Program`-typed.

## R15. Nav and Online courses card

**Decision**: The public nav already lists Courses → `/courses` (`src/lib/site.ts:5`), so no change. Set `onlineCoursesHref = "/courses"` (`src/lib/site.ts:16`) and change the card CTA label from "Register interest" to "Browse courses" (`src/content/online-courses.ts`). That one constant feeds both /programs and the home section, and Programs data and behaviour are untouched.

## R16. Testing approach

**Decision**:
- Unit tests (`node --test`, pure modules): `courses-schema` (valid course, every field error, blank rows dropped, category schema), `nextFreeSlug` (free base, -2, gaps, length trimming), `courses/view` (sort featured→order→title, listed filter excludes closed, `parseCourseFilters` ignores unknown, `courseFacts` omits empty start date, option grouping and order, variant selection), and `SelectField` grouping logic (pure helper `groupOptions`).
- `npm run test:admin-guard` (extended, R13).
- Browser check (Principle VII) at 360/390 and 1440 for /courses (empty, filtered, coming-soon muted), /courses/[slug] (open and closed CTA, mobile bar), /register?course=, the admin grid, the editor preview and the categories page.
- Existing `tests/unit/programs-*.test.ts` must pass unchanged (SC-008).
