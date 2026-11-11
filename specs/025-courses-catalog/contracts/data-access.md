# Contract: Course data access

## Public readers: `src/lib/courses/data.ts` (`import "server-only"`)

Cached with `unstable_cache` and a 3600 s safety refresh. A failed read throws, so it is never cached.

| Function | Returns | Cache key / tags | Notes |
|---|---|---|---|
| `getCategories()` | `CourseCategory[]` sorted by order, name | `["course-categories"]` / `categories` | |
| `getPublishedCourses({ category?, level? } = {})` | `Course[]`: published, status ≠ closed, sorted featured↓ order↑ title↑ | `["courses:listed"]` / `courses`, `categories` | Filters apply in memory after the cached read. An unknown category or level returns `[]` for that filter, and pages validate filters before calling. |
| `getCourseBySlug(slug)` | `Course \| null`: published, any status | `["course", slug]` / `courses`, `course:<slug>`, `categories` | A malformed slug (`SLUG_PATTERN` / `SLUG_MAX`) returns null without a query. |
| `getPublishedCourseSlugs()` | `string[]`, every published slug (closed included) | via a cached read of published slugs / `courses` | Never throws: `[]` on failure, so the build passes. |
| `loadPublishedCourses()` | `Course[] \| null` | wraps `getPublishedCourses()` | `null` = unavailable (dev/build only). In production runtime it rethrows, so the last good page is kept (same as `loadPublishedPrograms`). |
| `getOfferedCourseOptions()` | `CourseOption[]` without "Not sure yet": open + coming-soon, grouped by category order, then course sort | via the two cached reads above | Used only by `getCourseOptions()` in `src/content/index.ts`. |

## Content bridge: `src/content/index.ts`

`getCourseOptions(): Promise<CourseOption[]>`. The signature is unchanged and the result shape is extended.
- returns `[...await getOfferedCourseOptions(), { id: "not-sure", name: "Not sure yet" }]`
- on a read failure: logs `[courses] options read failed: <ErrorName>` and returns `[{ id: "not-sure", name: "Not sure yet" }]`

`getCourseFormLabel()` returns `"Register"`.

## Admin readers: `src/lib/admin/courses-read.ts` (`import "server-only"`, uncached)

| Function | Returns |
|---|---|
| `listAllCourses({ category?, status? })` | `AdminCourse[]` (published or not), sorted featured↓ order↑ title↑, filtered by category id and status when given and valid |
| `getCourseById(id)` | `AdminCourse \| null` (null for a malformed id) |
| `listAllCategories()` | `AdminCategory[]` with `courseCount` (one aggregate on `courses` grouped by category) |

## Pure helpers: `src/lib/courses/view.ts` (no server imports; unit-tested)

| Function | Purpose |
|---|---|
| `isListed(course)` | published and status in `LISTED_STATUSES` |
| `sortCourses(courses)` | featured↓ order↑ title↑ (copies, never mutates) |
| `parseCourseFilters(search, categorySlugs)` | `{ category?: string; level?: Level }`, unknown values dropped |
| `courseFacts(course)` | `{label, value}[]` for `ProgramFacts`: Format, Duration, Starts (only if set), Price (only if set), Level |
| `toCardData(course)` | `CourseCardData` |
| `toCourseOptions(courses, categories)` | grouped, ordered `CourseOption[]` (uncategorised last) |
| `confirmationVariant(option?)` | `"open"` when `status === "open"`, else `"waitlist"` |

`src/lib/admin/slug.ts`: `nextFreeSlug(base: string, taken: Iterable<string>, max = SLUG_MAX): string` (pure).
