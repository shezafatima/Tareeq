# Data model: 026-split-submissions

One collection, `leads`, unchanged except for two optional fields on course records and one index. Nothing is migrated or backfilled.

## Lead (base, collection `leads`, discriminator key `type`)

Unchanged. Shared fields: `ref`, `submissionKey`, `status` (`new | contacted | booked | closed`), `statusChangedAt`, `adminNotes`, `fullName`, `phone`, `email`, `message`, `consent`, `notification`, `createdAt`, `updatedAt`.

### Status labels (display only)

| Stored | Workshop label | Course label |
|---|---|---|
| `new` | New | New |
| `contacted` | Contacted | Contacted |
| `booked` | Booked | **Enrolled** |
| `closed` | Closed | Closed |

The transitions are unchanged: any status can be set from any status in the drawer. The row quick action only offers `new → contacted`.

## Workshop lead (`type: "workshop"`)

Unchanged: `role` (`school | teacher`), `organization`, `city`, `participants` (1–1000), `preferredMonth` (`YYYY-MM` or null).

## Course lead (`type: "course"`)

| Field | Type | Notes |
|---|---|---|
| `courseId` | string, required | Course ObjectId as a string, `not-sure`, or a legacy pre-025 id |
| `courseName` | string, required | Title snapshot at sign-up (the spec's "courseTitle snapshot"); never rewritten |
| `level` | `beginner \| some-experience` | Applicant's answer |
| `ageGroup` | `under-18 \| 18-plus` | Applicant's answer |
| **`categoryId`** | string \| null, **new, optional** | Category ObjectId as a string at sign-up |
| **`categoryName`** | string \| null, **new, optional** | Category name at sign-up |

### Snapshot states

| `categoryId` / `categoryName` | Meaning | Category shown | Category filter matches by |
|---|---|---|---|
| both strings | Snapshot taken | snapshot name | `categoryId` |
| both `null` | Saved with no category ("Not sure yet", or the course or category was missing) | — | never |
| field absent | Saved before 026, or the snapshot read failed | live: current course → current category name, else — | `courseId ∈ current courses of that category` |

Rules:
- The server writes the snapshot in `submitCourse`. Nothing comes from the form.
- `courseId === "not-sure"` always shows a dash, whatever the snapshot fields hold.

## Indexes on `leads`

| Index | Status | Serves |
|---|---|---|
| `{ type: 1, status: 1, createdAt: -1 }` | exists | list + stat strip + badges, per type |
| `{ type: 1, courseId: 1 }` | **new** | course filter, live category fallback |
| others (`createdAt`, `status+createdAt`, `notification.state`, `email`, `phone`, text `lead_search`) | unchanged | — |

## Derived view shapes (serialisable, built server-side)

```ts
type LeadType = "workshop" | "course";

type WorkshopRow = { id; fullName; ref; status; role; organization; participants; preferredMonth: string | null; createdAt };
type CourseRow   = { id; fullName; ref; status; courseId; courseName; category: string | null; level; ageGroup; createdAt };

type CourseLink =
  | { kind: "edit"; href: `/admin/courses/${string}/edit` }
  | { kind: "removed" }        // courseId is not a current course and is not "not-sure"
  | { kind: "none" };          // "not-sure"

type LeadDetail = shared fields & (
  | { type: "workshop"; workshop: { role; organization; city; participants; preferredMonth } }
  | { type: "course"; course: { courseId; courseName; category: string | null; level; ageGroup; link: CourseLink } }
);

type StatusCounts = Record<"new" | "contacted" | "booked" | "closed", number>;   // per type
type NewCounts = { workshop: number; course: number };                           // sidebar badges
```

## Course/category lookup (course view only)

Built from `listAllCourses()` and `listAllCategories()` (025, uncached) plus a snapshot aggregate:
- `courseById: Map<courseId, { title, categoryId, categoryName | null }>`
- `categoryOptions: { value: categoryId, label }[]`: current categories, then snapshot-only ones labelled "<name> (removed)"
- `courseOptions: { value: courseId | "not-sure", label }[]`: current courses by title, then "Not sure yet"
