# Implementation Plan: Separate workshop and course submissions in admin

**Branch**: `026-split-submissions` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/026-split-submissions/spec.md`

## Summary

The combined Submissions list at `/admin` is replaced by two type-scoped views, `/admin/submissions/workshops` and `/admin/submissions/courses`. `/admin` redirects to the workshop view until the dashboard ships.

The existing components (`SubmissionsTable`, `FilterBar`, `StatStrip`, `Pagination`, `LeadDrawer`, `Toast`, `EmptyState`) become type-aware through props, so both views share one implementation. The pure URL helper and a new pure filter builder take the type first and always put it in the query.

The three shared lead actions (status, notes, delete) gain a required `type` and match on `{ _id, type }`, so a wrong-type record behaves as not found. "Mark contacted" is a small client leaf, `RowStatus`, that calls the same status action optimistically.

New course registrations store a server-side category snapshot (`categoryId`, `categoryName`). The course view shows and filters categories from the snapshot first and falls back to the live course lookup for older records. The sidebar gets a "Submissions" group with new-count badges loaded in the panel layout. One index, `{ type, courseId }`, is added. Nothing is migrated.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4.3 (App Router)
**Primary Dependencies**: existing only: mongoose 9.11, zod 4 (`zod/mini`), next-auth 5 beta, `@phosphor-icons/react`, tailwind 4, clsx. **No new dependencies.**
**Storage**: MongoDB `leads` collection (discriminator `type`). Two optional fields on course records and one new index. `courses` and `course_categories` (025) are read only.
**Testing**: `node --test` unit tests for the pure modules (params, filters, status labels, course-lead helpers, WhatsApp). `npm run test:admin-guard` gains a part D for the wrong-type checks. Manual quickstart at 360/390/1440.
**Target Platform**: Vercel-style serverless; admin used on phones from 360px and on laptops.
**Project Type**: Web, single Next.js project.
**Performance Goals**: each view loads in under 2 s with 5,000 leads (SC-005); Mark contacted shows in under 1 s (optimistic, SC-003).
**Constraints**: Server Components by default; client leaves only for filters, nav, drawer and row status. Brand tokens. Reduced motion respected. No personal data in logs or URLs (only ids and the owner's search text in the address, as today). The public forms' fields, validation and UI are unchanged.
**Scale/Scope**: one admin; hundreds to low thousands of leads; tens of courses.

No `NEEDS CLARIFICATION` remain (spec Clarifications 2026-11-11 + research.md R1–R15).

## Constitution Check

*GATE: passed before research; re-checked after design (Phase 1) and still passes.*

| Principle | Status | How |
|---|---|---|
| I Mobile-first | PASS | Cards below md at 360px. The card is restructured to an overlay link so the 44px "Mark contacted" button is valid HTML. The filter bar stacks. The drawer is full screen on phones (existing). |
| II Reusable components | PASS | One table, filter bar, stat strip, pagination and drawer, parameterised by type and column/filter config. No `WorkshopTable`/`CourseTable` forks. `RowStatus` is used by both views. |
| III Brand tokens | PASS | Existing chip tones and tokens. The badge uses saffron as a background with midnight text, never saffron text on light. |
| IV Accessible | PASS | One h1 per view. Labelled selects. The badge has "{n} new" screen-reader text. The button's accessible name includes the person's name. `aria-current` on nav. Focus is visible. |
| V Protect data | PASS | Every page goes through `requireAdmin()`. Every action uses `withAdmin` plus the `{_id, type}` scope. The guard test is extended (parts A and D). The snapshot is computed server-side; the browser sends nothing new. Logs carry ids and error names only. |
| VI Fast | PASS | Type-scoped indexed queries. The lookups join tens of courses in memory. Admin pages are not public, so Lighthouse gates don't apply, but no heavy client code is added. |
| VII Small verified steps | PASS | Milestones per user story (below), each with lint, build and a visual check. |
| VIII Don't touch the hero | PASS | Admin only, plus a server-side line in `submitCourse`. No public UI, token or Header change. |
| IX No surprise dependencies | PASS | None. Part D uses an in-memory stub instead of an in-memory MongoDB package. |
| X Safest option | PASS | A failed snapshot read never blocks a registration (it falls back to the live lookup). WhatsApp copy is marked DRAFT for owner sign-off. |
| XI Server Components default | PASS | New client code: `RowStatus` only (optimistic state, transition, toast). Existing client leaves stay: `FilterBar` (router + debounce), `AdminNav` (pathname), `LeadDrawer` (state, clipboard, dialogs). Table, stat strip, pagination and pages stay Server Components. |

**Gate result**: PASS. No Complexity Tracking entries.

## Project Structure

### Documentation (this feature)

```text
specs/026-split-submissions/
├── spec.md
├── plan.md                  # this file
├── research.md              # R1–R15
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   ├── routes-and-ui.md
│   └── data-access.md
├── checklists/requirements.md
└── tasks.md                 # /sp.tasks (not created here)
```

### Source Code (repository root)

```text
src/app/admin/(panel)/
├── layout.tsx                         # CHANGED: loads getNewCounts() via safeLoad, passes badges to Sidebar/TopBar
├── page.tsx                           # CHANGED: redirect → /admin/submissions/workshops (old list removed)
└── submissions/
    ├── page.tsx                       # NEW: redirect → workshops
    ├── workshops/page.tsx             # NEW: workshop view
    └── courses/page.tsx               # NEW: course view

src/components/admin/
├── AdminNav.tsx                       # CHANGED: Submissions group, badges, offset-based indicator
├── Sidebar.tsx, TopBar.tsx            # CHANGED: pass badges through
├── SubmissionsTable.tsx               # CHANGED: generic columns + card slots, RowStatus cell
├── RowStatus.tsx                      # NEW (client): chip + optimistic "Mark contacted"
├── FilterBar.tsx                      # CHANGED: type-driven selects and search label; no type select
├── StatStrip.tsx                      # CHANGED: type + labels
├── Pagination.tsx                     # CHANGED: type-aware href
└── LeadDrawer.tsx                     # CHANGED: type passed to actions, labels, Under 18, course link, category

src/lib/admin/
├── leads-params.ts                    # CHANGED: parseLeadParams(type, raw), leadsHref(type, p)
├── leads-filter.ts                    # NEW (pure): workshopFilter, courseFilter (always scoped by type)
├── lead-status.ts                     # NEW (pure): statusLabels(type)
├── course-leads.ts                    # NEW (pure): categoryFor, courseLinkFor, category/course options
├── leads-query.ts                     # CHANGED: type-first reads, getNewCounts, getWorkshopMonths, getCourseLeadLookup
├── leads-actions.ts                   # CHANGED: required type, {_id, type} filters, revalidatePath("/admin","layout")
└── whatsapp.ts                        # CHANGED: topic-aware prefill

src/lib/leads/
├── model.ts                           # CHANGED: categoryId/categoryName on course schema; {type, courseId} index
├── category-snapshot.ts               # NEW (server-only): readCategorySnapshot(courseId)
└── actions.ts                         # CHANGED: submitCourse adds the snapshot to CourseLead.create

scripts/admin-guard-test.mts           # CHANGED: probes include type; new part D (wrong-type, in-memory store)

tests/unit/
├── admin-leads-params.test.ts         # REWRITTEN for the type-first API
├── admin-leads-filter.test.ts         # NEW: type always present, search fields per type, category $or
├── admin-lead-status.test.ts          # NEW: Booked vs Enrolled
├── admin-course-leads.test.ts         # NEW: snapshot / null / absent / not-sure / removed
└── admin-whatsapp.test.ts             # EXTENDED: workshop and course text
```

**Structure Decision**: Single Next.js project, following the existing admin layout (`src/app/admin/(panel)`, `src/components/admin`, `src/lib/admin`). Pure helpers sit next to their server-only counterparts so they can be unit-tested with `node --test`.

## Milestones (each: lint, build, unit tests, visual check at 390/1440)

1. **Foundation**: model fields + index, the snapshot helper wired into `submitCourse`, the pure modules (params, filter, labels, course-leads, WhatsApp) with unit tests, and type-first `leads-query`.
2. **US1 Workshop view + US2 Course view**: routes, redirects, generalised table, filter bar, stat strip, pagination and drawer. Old list removed.
3. **Type-scoped actions**: `type` on all three actions, guard test parts A + D.
4. **US4 Mark contacted**: `RowStatus` in table rows and cards.
5. **US3 Sidebar group + badges**: layout counts, `AdminNav` group, mobile menu.
6. **Polish**: 360px and reduced-motion pass, quickstart 1–14, DRAFT copy listed for sign-off.

## Key risks

- **Removing the `type` param breaks bookmarks.** Old `/admin?…` addresses lose their filters (accepted in the spec). They land on the workshop view.
- **`revalidatePath` in part D.** Outside Next it throws, so the positive control asserts the write and not the result (R5). The wrong-type assertions are exact.
- **Sliding nav indicator with a group heading.** The offsets are hand-computed. A wrong offset is visible straight away in the visual check.

## Complexity Tracking

None.
