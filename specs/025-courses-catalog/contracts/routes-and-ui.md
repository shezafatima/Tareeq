# Contract: Routes and UI components

## Public routes

| Route | Render | Data | Behaviour |
|---|---|---|---|
| `/courses` | static, `revalidate = 3600`, refreshed by tags | `loadPublishedCourses()`, `getCategories()` | Heading + intro. Category chips (only categories with listed courses) + level chips. Cards in public sort. Filters client-side via `?category=&level=`. Empty → "Courses are coming soon" + link to /register, no filters. Unavailable (dev/build) → the same friendly copy as Programs. |
| `/courses/[slug]` | static per slug, `generateStaticParams`, `revalidate = 3600` | `getCourseBySlug()` | Header, description, outcomes, syllabus timeline, facts grid, sticky CTA (desktop card / mobile bottom bar). Closed → "Registration closed" → /register. Unpublished or unknown → `notFound()` (course-specific not-found page with a link to /courses). Per-course metadata + OG. |
| `/register` | per request (unchanged) | `getCourseOptions()`, `searchParams.course` | Heading and button "Register". Grouped select + "Not sure yet". `?course=<slug>` preselects when offered, else nothing. |
| `/programs`, `/` | unchanged | | The "Online courses" card links to `/courses` (via `onlineCoursesHref`). |

## Admin routes (all inside `app/admin/(panel)`, each calls `requireAdmin()`)

| Route | Content |
|---|---|
| `/admin/courses` | Title + "New course" + "Categories" links. Filter form (`category`, `status`; GET, no JS needed) + "Clear filters". Card grid of `CourseAdminCard`. Empty states: no categories yet ("Create a category first" → categories), no courses, no matches. |
| `/admin/courses/new` | `CourseEditor` (create). Requires at least one category; otherwise shows an empty state linking to categories. |
| `/admin/courses/[id]/edit` | `CourseEditor` (edit) + delete with confirm. Unknown id → admin not-found. |
| `/admin/courses/categories` | `CategoryManager`: rows (name, slug, course count, order input, edit, delete), "New category" drawer. |

Sidebar: "Courses" (icon `GraduationCap`), active for `/admin/courses*`.

## Components

Server unless marked **client** (each client leaf states why, per Principle XI).

### Public (`src/components/sections/courses/`)

| Component | Props | Notes |
|---|---|---|
| `CourseCard` | `{ course: CourseCardData; headingLevel?: "h2" \| "h3"; sizes?: string }` | Presentational, no server-only imports, used by `/courses` and `CoursePreview`. Cover via `ProgramCover` (brand pattern fallback). Category, level, format, duration, status chip, price. Whole card is one link to `/courses/<slug>`. |
| `CourseStatusChip` | `{ status: EnrollmentStatus }` | Same visual language as the programs `StatusChip` (saffron dot only for open; muted for coming soon). |
| `CourseBrowser` | `{ heading; intro; courses: Course[] \| null; categories: CourseCategory[] }` | Holds the h1, chips, list `<ul id="course-list">` with `data-category`/`data-level` on each `<li>`, `CourseFilterScript`, and the empty and unavailable states. |
| `CourseFilter` **client** | `{ listId; categories: {slug,name}[]; counts }` | URL state and chip presses; sets `hidden` on list items; live count; "no match" + "Show all courses". |
| `CourseFilterScript` | `{ listId; categorySlugs: string[] }` | Inline pre-paint script; same hiding rules. |
| `CourseHeader` | `{ course: Course }` | h1 title, summary, category, level, status chip; cover or pattern. |
| `CourseCta` | `{ course; className?; variant? }` | "Register" → `/register?course=<slug>`, or "Registration closed" → `/register` (secondary style). |
| `CourseCtaCard` | `{ course }` | Desktop sticky aside: price, facts list, `CourseCta`. Reuses the `program-booking-card` styles. |
| `CourseMobileCtaBar` | `{ course }` | Fixed bottom bar under `lg`. Reuses the `program-cta-bar` CSS hooks (content padding, WhatsApp lift). |

Reused unchanged: `ProgramProse`, `ProgramOutcomes`, `CurriculumTimeline`, `ProgramFacts`, `ProgramCover`, `Reveal`, `Container`, `Button`.

### Admin (`src/components/admin/`)

| Component | Notes |
|---|---|
| `CourseAdminCard` | Title, category (or "No category" warning), level, status chip (admin `StatusChip`: open=royal, coming-soon=sky, closed=grey), `PublishedToggle action={setCoursePublished}`, `FeaturedToggle`, edit link. |
| `PublishedToggle` **client** (existing) | + optional `action` prop, defaulting to `setProgramPublished`. No change for Programs. |
| `FeaturedToggle` **client** | Star button, `aria-pressed`, `aria-label="Feature {title}"`, optimistic with rollback + toast; 44px target. |
| `CourseEditor` **client** | Form state, `slugTouched` → `slugAuto`, `ListEditor` for outcomes and syllabus, error focus, `useActionFeedback` toasts, delete via `ConfirmDialog` (edit mode). Side-by-side preview at ≥ xl, preview below the form on phones. |
| `CoursePreview` **client** | Re-renders `CourseCard` from form values inside `inert` list markup (keystroke updates). |
| `CategoryManager` **client** | Drawer form (create/edit), inline order input (`setCategoryOrder` on blur/Enter), delete with `ConfirmDialog` + `in_use` message, toasts. |

### Changed shared UI

| Component | Change |
|---|---|
| `src/components/ui/SelectField.tsx` | Options may carry `group?: string`; consecutive same-group options render inside `<optgroup label>`. Ungrouped callers render identically. |
| `src/components/forms/CourseForm.tsx` | Accepts `defaultCourseId?: string`; picks confirmation copy from `state.variant`. |

## Motion and accessibility

- Card hover lift, chip colour and drawer slide only animate transform/opacity/colour at 150–250 ms, and are off under `prefers-reduced-motion` (existing tokens and `Reveal`).
- One h1 per page. Chips are `button[aria-pressed]` in labelled groups (`Filter courses by category` and `Filter courses by level`). The count is announced via `role="status"`.
- Mobile CTA bar is ≥ 44px tall with a 44px button. Content is padded so nothing is hidden behind it.
- Coming-soon muting keeps AA contrast for every text (it lowers surface emphasis, not text contrast below 4.5:1).
