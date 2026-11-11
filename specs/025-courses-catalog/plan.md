# Implementation Plan: Courses and Course Categories (admin-managed)

**Branch**: `025-courses-catalog` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-courses-catalog/spec.md`

## Summary

The owner manages course categories and courses in `/admin/courses`. Visitors browse `/courses`, which filters client-side by category and level in the URL, read `/courses/[slug]`, and register through the existing `/register` form, now with grouped real courses, `?course=<slug>` preselection and a confirmation that depends on the course status. The build copies the Programs architecture almost one-to-one:
- two Mongoose models
- a server-only cached reader tagged `courses` / `course:<slug>` / `categories`
- `withAdmin`-wrapped Server Actions that re-validate with one shared zod schema and expire tags after writes
- Server Component pages with small client leaves (filters, editor, preview, toggles)

The existing Programs components for description, outcomes, timeline, facts and cover are reused. The lead model doesn't change, because course sign-ups already store `courseId` plus a `courseName` snapshot.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4.3 (App Router)
**Primary Dependencies**: existing only: mongoose 9.11, zod 4.6 (`zod/mini`), marked 18 + sanitize-html 2.18, next-auth 5 beta (session), `@phosphor-icons/react`, tailwind 4, clsx. **No new dependencies.**
**Storage**: MongoDB. New collections `course_categories` and `courses`. Existing `leads` unchanged.
**Testing**: `node --test` unit tests in `tests/unit` for the pure modules (schema, slug suffix, view helpers, option grouping); `npm run test:admin-guard` (extended); browser visual check at 360/390/1440.
**Target Platform**: Vercel-style serverless; mobile browsers from 360px.
**Project Type**: Web, single Next.js project.
**Performance Goals**: `/courses` and course pages static (ISR + tags), LCP is text. Filter response under 0.5 s with no network (SC-004). Mobile Lighthouse Performance 90+, Accessibility 95+, SEO 90+ on public pages.
**Constraints**: Server Components by default. Client only for filters, editor/list editors, preview and toggles. Brand tokens, Sora/Inter. Transform/opacity motion off under reduced motion. No personal data in logs. Programs behaviour unchanged.
**Scale/Scope**: one admin; tens of courses; under 20 categories; leads unchanged in volume.

No `NEEDS CLARIFICATION` remain (spec clarifications 2026-11-10 + research.md R1–R16).

## Constitution Check

*GATE: passed before research; re-checked after design (Phase 1) and still passes.*

| Principle | Status | How |
|---|---|---|
| I Mobile-first | PASS | Card grid is one column at 360px. Mobile sticky CTA bar with 44px targets. Chips wrap. Editor stacks preview below the form on phones. |
| II Reusable components | PASS | Reuses `ProgramProse`, `ProgramOutcomes`, `CurriculumTimeline`, `ProgramFacts`, `ProgramCover`, `Drawer`, `ConfirmDialog`, `ListEditor`, `Toast`, `StatusChip` (admin), `EmptyState`, `UnavailableNotice`. `PublishedToggle` gains an `action` prop instead of being copied. One `CourseCard` serves the public page and the preview. `SelectField` gains optgroup support instead of a second select. |
| III Brand tokens | PASS | Existing tokens and CSS hooks only. Saffron as a status dot or star fill, never text on light. |
| IV Accessible | PASS | One h1 per page; `aria-pressed` chips in labelled groups; live count; labelled fields; focus on first error; reduced motion. |
| V Protect data | PASS | Every action goes through `withAdmin` (guard test proves it), every admin page through `requireAdmin()`. Server re-validation. Register still validates the course server-side at submit time. No personal data in logs. No new secrets. |
| VI Fast | PASS | Static pages with tag revalidation. Images through `next/image` via `ProgramCover`. Filters change attributes only; no client re-render of cards. |
| VII Small verified steps | PASS | Milestones per user story (see below), each with lint, build and a visual check. |
| VIII Don't touch the hero | PASS | No change to hero, Header, Footer or tokens. Public nav already has Courses. |
| IX No surprise dependencies | PASS | None added. |
| X Safest option | PASS | New confirmation copy and `/courses` intro marked DRAFT for owner sign-off. No invented courses or placeholder people; the placeholder course list is removed. |
| XI Server Components default | PASS | Client leaves and their reasons: `CourseFilter` (URL + presses), `CourseEditor` (form state), `CoursePreview` (re-renders per keystroke), `FeaturedToggle` / `PublishedToggle` (optimistic state), `CategoryManager` (drawer/dialog/inline order state). `CourseCard` is a single shared component with no client twin. |

**Gate result**: PASS. No Complexity Tracking entries.

## Project Structure

### Documentation (this feature)

```text
specs/025-courses-catalog/
├── spec.md
├── plan.md                  # this file
├── research.md              # R1–R16 decisions
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   ├── data-access.md
│   └── routes-and-ui.md
├── checklists/requirements.md
└── tasks.md                 # created by /sp.tasks
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── courses/
│   │   ├── options.ts                    NEW  vocabulary, labels, plain types (pure)
│   │   ├── model.ts                      NEW  CourseCategoryModel, CourseModel (server-only)
│   │   ├── data.ts                       NEW  cached public readers (server-only)
│   │   └── view.ts                       NEW  sort, listed, filters, facts, card data, options, variant (pure)
│   ├── admin/
│   │   ├── courses-schema.ts             NEW  shared zod: course + category (pure)
│   │   ├── slug.ts                       NEW  nextFreeSlug (pure)
│   │   ├── courses-read.ts               NEW  uncached admin reads
│   │   ├── courses-actions.ts            NEW  create/update/publish/featured/delete
│   │   ├── course-categories-actions.ts  NEW  create/update/order/delete
│   │   └── result.ts                     EDIT add "in_use" code + count
│   ├── leads/
│   │   ├── actions.ts                    EDIT submitCourse: variant + open prefill
│   │   └── state.ts                      EDIT success.variant
│   └── site.ts                           EDIT onlineCoursesHref = "/courses"
├── content/
│   ├── index.ts                          EDIT getCourseOptions → courses data; label "Register"
│   ├── types.ts                          EDIT CourseOption {slug, group, status}; LeadCopy.course.open
│   ├── data/leads.ts                     EDIT courseFormLabel, open copy (DRAFT)
│   ├── data/courses.ts                   DELETE placeholder list
│   └── online-courses.ts                 EDIT CTA label "Browse courses"
├── components/
│   ├── sections/courses/                 NEW  CourseCard, CourseStatusChip, CourseBrowser, CourseFilter (client),
│   │                                          CourseFilterScript, CourseHeader, CourseCta, CourseCtaCard, CourseMobileCtaBar
│   ├── admin/
│   │   ├── AdminNav.tsx                  EDIT + Courses item
│   │   ├── PublishedToggle.tsx           EDIT optional action prop (default unchanged)
│   │   ├── CourseAdminCard.tsx           NEW
│   │   ├── FeaturedToggle.tsx            NEW  client
│   │   ├── CourseEditor.tsx              NEW  client
│   │   ├── CoursePreview.tsx             NEW  client
│   │   └── CategoryManager.tsx           NEW  client
│   ├── ui/SelectField.tsx                EDIT optional option groups
│   └── forms/CourseForm.tsx              EDIT defaultCourseId, variant copy
├── app/
│   ├── (site)/courses/page.tsx           REPLACE placeholder → CourseBrowser
│   ├── (site)/courses/[slug]/page.tsx    NEW
│   ├── (site)/courses/[slug]/not-found.tsx NEW
│   ├── (site)/register/page.tsx          EDIT read ?course=, pass defaultCourseId
│   └── admin/(panel)/courses/
│       ├── page.tsx                      NEW  grid + filters
│       ├── new/page.tsx                  NEW
│       ├── [id]/edit/page.tsx            NEW
│       └── categories/page.tsx           NEW
└── app/globals.css                       EDIT course card + coming-soon muted styles (tokens only)

scripts/admin-guard-test.mts              EDIT REQUIRED_ACTIONS + probe args
tests/unit/
├── courses-schema.test.ts                NEW
├── courses-slug.test.ts                  NEW
├── courses-view.test.ts                  NEW
└── select-groups.test.ts                 NEW
```

**Structure Decision**: Single Next.js project. Courses get their own `src/lib/courses` and `src/components/sections/courses`, in parallel to Programs. Admin code sits beside the program admin code in `src/lib/admin` and `src/components/admin`, so the guard test discovers it by file name.

## Milestones (each ends with lint, build, unit tests and a 390/1440 visual check)

1. **Foundation**: options, models, schema, slug helper, view helpers and unit tests (no UI).
2. **Admin categories (US4)**: actions, read, categories page, sidebar item, guard test extension.
3. **Admin courses (US1)**: actions, read, grid with filters and toggles, editor with live preview (`CourseCard` built here).
4. **Public catalogue (US2 + US5)**: data module, `/courses` with filters and empty state, `/courses/[slug]` with CTA, metadata and static params, Online courses link.
5. **Register integration (US3)**: options bridge, optgroups, preselection, label, variant confirmation; remove the placeholder list.

## Interfaces (summary; details in contracts/)

- **Readers**: `getPublishedCourses({category?, level?})`, `getCourseBySlug(slug)`, `getCategories()`, plus `getPublishedCourseSlugs()`, `loadPublishedCourses()`, `getOfferedCourseOptions()`.
- **Actions**: `createCourse`, `updateCourse`, `setCoursePublished`, `setCourseFeatured`, `deleteCourse`, `createCategory`, `updateCategory`, `setCategoryOrder`, `deleteCategory`. All return `ActionResult`; error taxonomy: `unauthorized | invalid | not_found | conflict | unavailable | in_use`.
- **Cache tags**: `courses`, `course:<slug>`, `categories` (expiry table in research R3).

## Risks and mitigations

1. **The category join drifts from the cached course list after a rename.** Mitigation: course reads also carry the `categories` tag, and category writes expire `courses` too (R2/R3).
2. **Changing the shared register flow (`submitCourse`, `SelectField`, `LeadActionState`) breaks the workshop form or existing leads.** Mitigation: all changes are additive and optional. The workshop path never sets `variant`, ungrouped selects render identically, the lead schema is unchanged, and the existing `schema.test.ts` and `options-reference.test.ts` must pass.
3. **A filter flash or a hydration mismatch on `/courses` with a shared filtered link.** Mitigation: the pre-paint inline script plus `suppressHydrationWarning` on the list, the same proven approach as `/programs`.

## Follow-ups

- Owner to confirm DRAFT copy: the `/courses` intro, the "open" confirmation and WhatsApp prefill, and the "Browse courses" card label.
- Optional later: a course filter on admin Submissions; add courses to the sitemap if one is added.

## Complexity Tracking

No violations.
