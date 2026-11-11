# Contract: Admin Server Actions (courses and categories)

Every action is a public POST endpoint. Every action is:
- exported from `src/lib/admin/courses-actions.ts` or `src/lib/admin/course-categories-actions.ts` (`"use server"`)
- wrapped in `withAdmin()`. With no session it returns `{ ok: false, code: "unauthorized" }` before any database access (checked by `npm run test:admin-guard`).
- re-validated with `courses-schema.ts`, whatever the client already checked
- followed by the tag refresh in research R3, **only after** the write succeeded
- logged with `logAdmin("course" | "category", outcome, id)`, with no personal data

Result type: the existing `ActionResult<T>` from `src/lib/admin/result.ts`:

```ts
type Failure = { ok: false; code: "unauthorized" | "invalid" | "not_found" | "conflict" | "unavailable" | "in_use";
                 fieldErrors?: Record<string, string>; count?: number };
type ActionResult<T = {}> = ({ ok: true } & T) | Failure;
```

`in_use` (with `count`) is a new code, added to the existing union. Existing callers ignore unknown codes and show the generic toast.

## courses-actions.ts

| Action | Input | Success | Failures |
|---|---|---|---|
| `createCourse` | `CourseFormValues` (incl. `slugAuto`) | `{ ok: true, id, slug }`, where `slug` may carry a suffix | `invalid` (fieldErrors), `invalid` + `fieldErrors.category` (unknown category), `conflict` + `fieldErrors.slug` (typed slug taken, or an auto retry exhausted), `unavailable` |
| `updateCourse` | `{ id, values: CourseFormValues }` | `{ ok: true }` | `invalid` (bad id or fields), `not_found`, `conflict` (slug taken by another course; a typed slug, no suffixing on update), `unavailable` |
| `setCoursePublished` | `{ id, published: boolean }` | `{ ok: true }` | `invalid`, `not_found`, `unavailable` |
| `setCourseFeatured` | `{ id, featured: boolean }` | `{ ok: true }` | `invalid`, `not_found`, `unavailable` |
| `deleteCourse` | `{ id }` | `{ ok: true }` | `invalid`, `not_found`, `unavailable` |

Notes:
- `id` must pass `isObjectId`, otherwise `invalid`.
- An empty `coverImageUrl` is `$unset`, the same as programs.
- Slug collisions on create follow research R4. On update, the old slug's tag is also expired when the slug changed.
- Deleting a course does not touch leads (FR-029: the `courseName` snapshot keeps them readable).

## course-categories-actions.ts

| Action | Input | Success | Failures |
|---|---|---|---|
| `createCategory` | `CategoryFormValues` (incl. `slugAuto`) | `{ ok: true, id, slug }` | `invalid`, `conflict` + `fieldErrors.slug`, `unavailable` |
| `updateCategory` | `{ id, values: CategoryFormValues }` | `{ ok: true }` | `invalid`, `not_found`, `conflict`, `unavailable` |
| `setCategoryOrder` | `{ id, order: number }` (integer ±9999) | `{ ok: true }` | `invalid`, `not_found`, `unavailable` |
| `deleteCategory` | `{ id }` | `{ ok: true }` | `invalid`, `not_found`, **`in_use` + `count`** (any course references it), `unavailable` |

UI message for `in_use`: "This category still has {count} course{s}. Move them to another category or delete them first."

## Changed existing action: `submitCourse` (src/lib/leads/actions.ts)

| Aspect | Before | After |
|---|---|---|
| Allowed `courseId` values | placeholder ids + `not-sure` | offered course ids (published, open or coming-soon) + `not-sure`, read at submit time |
| `courseName` stored | placeholder name | course title snapshot |
| Success state | `{ status, attempt, ref, whatsappUrl }` | plus `variant: "open" \| "waitlist"` |
| WhatsApp prefill | waitlist text | `open` text (course title + ref) or the waitlist text |
| Duplicate replay | returns first ref | returns first ref; variant recomputed from the stored `courseId` against current options, `waitlist` if no longer open |

Every other step (honeypot, rate limit, consent, notify, logging) is unchanged.

## Guard test (`scripts/admin-guard-test.mts`)

- It already discovers every `src/lib/admin/*-actions.ts`. The new files are probed automatically.
- New: a `REQUIRED_ACTIONS` set naming all program, lead, course and category actions. A missing name fails the run.
- New probe input: `{ id: "000000000000000000000000", featured: true, order: 1, values: {} }`.
- Pass condition is unchanged: every call returns `unauthorized` and touches no model or connection.
