# Data Model: Courses and Course Categories

**Feature**: 025-courses-catalog | **Date**: 2026-11-10

Storage is MongoDB through Mongoose 9. There are two new collections. The existing `leads` collection keeps its schema unchanged.

## Vocabulary (`src/lib/courses/options.ts`, pure)

```ts
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const FORMATS = ["live", "self-paced", "recorded"] as const;
export const ENROLLMENT_STATUSES = ["open", "coming-soon", "closed"] as const;
export const LISTED_STATUSES = ["open", "coming-soon"] as const; // shown on /courses and offered on /register

export const LEVEL_LABELS     = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
export const FORMAT_LABELS    = { live: "Live online", "self-paced": "Self-paced", recorded: "Recorded" };
export const ENROLLMENT_LABELS = { open: "Open", "coming-soon": "Coming soon", closed: "Registration closed" };
// SLUG_PATTERN and SLUG_MAX are re-exported from ../programs/options (same rule for every slug on the site)
```

## CourseCategory (collection `course_categories`)

| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | |
| `name` | string | required, trimmed, 1–80 |
| `slug` | string | required, **unique index**, `SLUG_PATTERN`, ≤ `SLUG_MAX` |
| `description` | string | optional, trimmed, ≤ 500, default `""` |
| `order` | number | required, integer −9999…9999, default 0 |
| `createdAt` / `updatedAt` | Date | `timestamps: true` |

Indexes: `{ slug: 1 }` unique, `{ order: 1, name: 1 }`.
Sort everywhere: `order` asc, then `name` asc.

## Course (collection `courses`)

| Field | Type | Rules |
|---|---|---|
| `_id` | ObjectId | Also the value stored as `courseId` on leads |
| `title` | string | required, trimmed, 1–120 |
| `slug` | string | required, **unique index**, `SLUG_PATTERN`, ≤ `SLUG_MAX`; stays the same when the title is edited |
| `category` | ObjectId → CourseCategory | required. Must exist at write time (checked by the action). |
| `level` | enum `LEVELS` | required |
| `summary` | string | required, trimmed, 1–240 |
| `description` | string (markdown) | default `""`, ≤ 20000. Rendered through `renderMarkdown` (sanitised). |
| `outcomes` | string[] | each trimmed, 1–240; default `[]` |
| `syllabus` | `{ title, description }[]` (`_id: false`) | title required 1–120; description ≤ 1000, default `""`; default `[]` |
| `format` | enum `FORMATS` | required |
| `durationText` | string | trimmed, ≤ 120, default `""` |
| `startDateText` | string | optional, trimmed, ≤ 120, default `""` |
| `priceText` | string | trimmed, ≤ 120, default `""` |
| `enrollmentStatus` | enum `ENROLLMENT_STATUSES` | required, default `"coming-soon"` |
| `coverImageUrl` | string | optional; `https://…` or a site path (not `//`). The field is left out when empty. |
| `featured` | boolean | required, default `false` |
| `order` | number | required, integer −9999…9999, default 0 |
| `published` | boolean | required, default `false` |
| `createdAt` / `updatedAt` | Date | `timestamps: true` |

Indexes: `{ slug: 1 }` unique, `{ published: 1, enrollmentStatus: 1, featured: -1, order: 1 }`, `{ category: 1 }` (for the delete guard count and admin filter).

### Visibility rules (derived, `src/lib/courses/view.ts`)

| State | /courses list | /courses/[slug] | /register select | sitemap/static params |
|---|---|---|---|---|
| unpublished (any status) | hidden | 404 | not offered | no |
| published + open | shown | page, "Register" CTA | offered (open variant) | yes |
| published + coming-soon | shown, muted | page, "Register" CTA | offered (waitlist variant) | yes |
| published + closed | hidden | page, "Registration closed" CTA → /register | not offered | yes |

Public sort: `featured` desc, `order` asc, `title` asc.
Category chips: categories with ≥ 1 listed course, in category order.
A course whose category is missing (R11 race) is treated as uncategorised: no chip, grouped last in the register select, flagged "No category" in admin.

### State transitions

`published` and `enrollmentStatus` change independently: published is a toggle on the admin card or in the form, and status is set in the form. `featured` is a toggle on the admin card or in the form. Every transition refreshes tags per research R3. Nothing is archived; delete is a hard delete after confirmation.

## Plain shapes passed to pages (JSON-safe)

```ts
type CourseCategory = { id: string; name: string; slug: string; description: string; order: number };

type Course = {
  id: string; title: string; slug: string;
  category: { name: string; slug: string } | null;   // null = missing (R11)
  level: Level; summary: string; description: string;
  outcomes: string[]; syllabus: { title: string; description: string }[];
  format: Format; durationText: string; startDateText: string; priceText: string;
  enrollmentStatus: EnrollmentStatus; coverImageUrl?: string;
  featured: boolean; order: number; published: boolean;
  createdAt: string; updatedAt: string;
};

/** What CourseCard renders: shared by /courses and the admin preview. */
type CourseCardData = Pick<Course, "title" | "slug" | "category" | "level" | "format" | "durationText"
  | "enrollmentStatus" | "priceText" | "coverImageUrl" | "summary">;

type AdminCourse = Course & { categoryId: string };       // admin reads, uncached
type AdminCategory = CourseCategory & { courseCount: number };
```

## Lead (existing `leads` collection, course discriminator) — no schema change

| Field | Before | After this feature |
|---|---|---|
| `courseId` | placeholder id from `content/data/courses.ts` or `"not-sure"` | Course `_id` string, or `"not-sure"` |
| `courseName` | snapshot of the placeholder name | snapshot of the course **title** at submission (the "courseTitle snapshot" from the brief) |

Old leads keep their old ids and names, and admin and email show `courseName`, so they display unchanged. No migration.

## Register option shape (`src/content/types.ts`, extended)

```ts
export type CourseOption = {
  id: string;            // Course _id, or "not-sure"
  name: string;          // course title, or "Not sure yet"
  slug?: string;         // for ?course=<slug> preselection
  group?: string;        // category name (→ <optgroup>)
  status?: "open" | "coming-soon"; // picks the confirmation variant
};
```

## Validation (`src/lib/admin/courses-schema.ts`, shared by the form and the server)

- **Course form values**: every text field is a string, `order` is text, `slugAuto` is a boolean (create only), and `published`/`featured` are booleans. Blank outcome and syllabus rows are dropped before checking.
- **Category form values**: `name`, `slug`, `slugAuto`, `description`, `order` (text).
- **Messages**: these follow `programs-schema.ts` wording. Two are new: `slugTaken` "Another course already uses this address. Choose a different one." / "Another category already uses this address. Choose a different one.", and `category` "Choose a category."
