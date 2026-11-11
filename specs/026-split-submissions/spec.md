# Feature Specification: Separate workshop and course submissions in admin

**Feature Branch**: `026-split-submissions`
**Created**: 2026-11-11
**Status**: Draft
**Input**: User description: "Admin: separate workshop and course submissions" (full text recorded in `history/prompts/026-split-submissions/`).

## Clarifications

### Session 2026-11-11

- Q: Course registrations store no category, so how should category be shown and filtered? → A: When a course registration is saved, the server also stores the course's current category id and name (a snapshot). The form's fields and UI do not change. The category column and filter use the snapshot first and fall back to the live course lookup for older records without one. "Not sure yet" still shows a dash.
- Q: How are row actions kept to the right type? → A: Keep the shared status, notes and delete actions. Each takes the expected type and finds the record by id and type together, so a record of the other type behaves as not found. No duplicate per-type actions. Tests cover a course record acted on as "workshop": it fails and nothing changes.
- The owner accepted the rest of the gap handling as written.

## Context

Today the admin home (`/admin`) shows one combined Submissions list holding both workshop requests and course registrations, with a type filter. The two kinds of submission carry different fields and are handled by different follow-up work, so the owner wants each in its own view. Both kinds already live in one store, told apart by their type; this feature changes how the admin reads and shows them. The only change to what is stored is a category snapshot added on save to new course registrations. Existing records are left as they are and nothing is migrated.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Work through workshop requests on their own (Priority: P1)

The owner opens Workshops under Submissions and sees only workshop requests, with the columns that matter for a workshop (role, organization, participants, preferred month). They filter, search, open a request, and mark it contacted.

**Why this priority**: Workshop requests are the main source of booked work. A focused view is the core of the feature and replaces the admin home.

**Independent Test**: With a mix of workshop and course records stored, open the Workshops view; only workshop records appear, and all filters, search, the stat strip and row actions work.

**Acceptance Scenarios**:

1. **Given** 3 workshop and 2 course records, **When** the owner opens the Workshops view, **Then** exactly 3 rows show, each with name, role, organization, participants, preferred month, status and received date.
2. **Given** the Workshops view, **When** the owner filters by status "new", role "teacher" and a preferred month, **Then** only matching workshop rows show and the filters appear in the page address.
3. **Given** the Workshops view, **When** the owner searches for part of an organization name, phone number, email or person's name, **Then** only matching workshop rows show.
4. **Given** the Workshops view, **Then** the stat strip shows New, Contacted, Booked and Closed counts for workshop records only.
5. **Given** a workshop row, **When** the owner opens it, **Then** the drawer shows every workshop field (name, phone, email, role, organization, city, participants, preferred month, message, reference, status, notes, received date).
6. **Given** someone signs in and goes to `/admin`, **Then** they land on the Workshops view.

---

### User Story 2 - Work through course registrations on their own (Priority: P1)

The owner opens Course registrations and sees only course sign-ups, with the course, its category, the applicant's level and age group. Statuses read "Enrolled" where workshops read "Booked".

**Why this priority**: Course registrations started arriving with feature 025 and are currently mixed in with workshops. Equal priority with Story 1; either can ship first.

**Independent Test**: With mixed records stored, open the Course registrations view; only course records appear, with the course-specific columns, filters, stat strip and drawer.

**Acceptance Scenarios**:

1. **Given** 3 workshop and 2 course records, **When** the owner opens Course registrations, **Then** exactly 2 rows show, each with name, course title (as stored at sign-up), category, level, age group, status and received date.
2. **Given** the course view, **When** the owner filters by status, course, category, level and age group in any combination, **Then** only matching course rows show and the filters appear in the page address.
3. **Given** the course view, **When** the owner searches by name, phone or email, **Then** only matching course rows show.
4. **Given** the course view, **Then** the stat strip reads New, Contacted, Enrolled, Closed, counting course records only, and a record whose stored status is "booked" shows as "Enrolled" everywhere in this view (row, drawer, status picker, filter, toast).
5. **Given** a course record with age group under 18, **When** the owner opens it, **Then** the drawer shows an "Under 18" badge.
6. **Given** a course record whose course still exists, **When** the owner opens it, **Then** the drawer links to that course's admin edit page.
7. **Given** a course record whose course has since been deleted, **When** the owner opens it, **Then** the drawer shows the stored title with "Course removed" beside it and no link.

---

### User Story 3 - Navigate and triage from the sidebar (Priority: P2)

The sidebar groups the two views under "Submissions". Each item shows how many records of its kind are still "new", so the owner sees at a glance where work is waiting.

**Why this priority**: Makes the split usable, but the views work without the badges.

**Independent Test**: With 4 new workshop and 1 new course record, the sidebar shows "Workshops 4" and "Course registrations 1"; marking one contacted lowers the right badge.

**Acceptance Scenarios**:

1. **Given** any admin page, **Then** the sidebar shows a "Submissions" group with "Workshops" and "Course registrations", and the current view is marked active.
2. **Given** 4 new workshop and 1 new course record, **Then** the badges read 4 and 1.
3. **Given** a count of zero, **Then** that item shows no badge.
4. **Given** the mobile menu at 360px, **Then** the same group, items and badges show.

---

### User Story 4 - One-tap "Mark contacted" (Priority: P2)

Each row has a "Mark contacted" quick action, so the owner can clear new submissions without opening each one.

**Why this priority**: Saves time on the most common status change; the drawer status picker already covers it more slowly.

**Independent Test**: Click "Mark contacted" on a new row; the row shows Contacted at once, a toast confirms, and the change survives a reload.

**Acceptance Scenarios**:

1. **Given** a row with status "new", **When** the owner taps "Mark contacted", **Then** the row shows "Contacted" immediately and a success toast appears.
2. **Given** the save fails, **Then** the row returns to its previous status and an error toast explains that nothing changed.
3. **Given** a row already "contacted" or later, **Then** the quick action is not offered (or is shown disabled).

---

### Edge Cases

- A record id of the other type is put in the address (e.g. a course record opened via the Workshops view's drawer parameter): the drawer does not open, as if the record did not exist.
- A row action (status, notes, delete, mark contacted) is sent for a record of the other type from a view: it is refused and nothing changes.
- A filter value that is not allowed (unknown status, role, month, course, category, level or age group) is ignored, as unknown values are today.
- A page number past the end clamps to the last page, as today.
- A course record saved with "Not sure yet" has no real course: its course column shows the stored title ("Not sure yet"), category shows a dash, and the drawer shows no edit link and no "Course removed" note.
- A course registration saved after this feature keeps its category snapshot even if the course is later moved to another category, or the course or category is deleted. The column and filter show the category as it was at sign-up.
- An older course registration (no snapshot) whose course still exists but has no category (its category was deleted): category shows a dash.
- An older course registration (no snapshot) whose course was deleted: category shows a dash and the record cannot be found by the category filter. It can still be found by search, status, level and age group.
- A course with no category at sign-up: the registration stores an empty snapshot and shows a dash. It does not fall back to the live lookup later.
- Course filter choices list the courses that exist now. Category filter choices list the categories that exist now, plus any category name found only in snapshots, so registrations for deleted courses or categories stay findable.
- The old combined address with query strings (e.g. `/admin?type=course&status=new`) goes to the Workshops view without carrying filters over.
- The database is unreachable: each view shows the existing "unavailable" notice, and the sidebar shows no badges rather than failing.
- Reduced motion: the optimistic status change, toasts and drawer appear without animation.

## Requirements *(mandatory)*

### Functional Requirements

**Routes and navigation**

- **FR-001**: The admin MUST provide a Workshops submissions view at `/admin/submissions/workshops` and a Course registrations view at `/admin/submissions/courses`.
- **FR-002**: `/admin` MUST redirect to `/admin/submissions/workshops`. This is temporary until the dashboard feature replaces it. The combined Submissions list MUST be removed.
- **FR-003**: The sidebar and mobile menu MUST show a "Submissions" group with items "Workshops" and "Course registrations", each with a badge giving its count of status "new" records of that type, hidden when zero.
- **FR-004**: Both views and all their actions MUST require a signed-in admin, as every admin page and action does today.

**Type scoping**

- **FR-005**: Every read and every count for a view MUST be limited to that view's type on the server. A workshop view MUST never return, count or open a course record, and the course view MUST never do so for a workshop record.
- **FR-006**: The existing shared row actions (status change, notes, delete) MUST stay shared, one of each, and MUST each take the expected type. They MUST find the record by id and type together, so a record of the other type behaves exactly as a missing record: the action fails with the existing "not found" result and changes nothing. "Mark contacted" MUST use the same status action with the same check. No per-type copies of these actions are added.

**Workshop view**

- **FR-007**: Rows MUST show name, role, organization, participants, preferred month, status and received date.
- **FR-008**: Filters MUST be status, role and preferred month. Search MUST match name, phone, email and organization.
- **FR-009**: The stat strip MUST show New, Contacted, Booked and Closed counts for workshop records only; each figure MUST act as a status filter, as today.
- **FR-010**: The drawer MUST show all stored workshop fields.

**Course view**

- **FR-011**: Rows MUST show name, course title as stored at sign-up, category, applicant level, age group, status and received date.
- **FR-012**: Filters MUST be status, course, category, level and age group. Search MUST match name, phone and email.
- **FR-013**: The stat strip MUST show New, Contacted, Enrolled and Closed for course records only. The stored value "booked" MUST be labelled "Enrolled" throughout the course view. No new status value is added and no record is rewritten.
- **FR-014**: When a course registration is saved, the server MUST also store the chosen course's current category id and category name as a snapshot. The register form's fields, validation and UI MUST NOT change, and nothing about the snapshot comes from the browser. For "Not sure yet", or a course with no category at sign-up, the record MUST be saved marked as "no category", distinguishable from an older record that has no snapshot, so it never falls back to the live lookup.
- **FR-014a**: The category column and category filter MUST use the snapshot when the record has one. Older records without a snapshot MUST fall back to the current category of the course they point to. Category shows a dash when neither gives a category, and always for "Not sure yet".
- **FR-015**: The drawer MUST show all stored course fields, an "Under 18" badge when the age group is under 18, and either a link to the course's admin edit page (course exists) or "Course removed" beside the stored title (course gone; not shown for "Not sure yet").

**Both views**

- **FR-016**: Filters, search, page number and the open record MUST live in the page address, so a view can be bookmarked, shared and restored with the back button.
- **FR-017**: Each row MUST offer "Mark contacted" on records with status "new". It MUST update the row at once, confirm with a toast, and roll back with an error toast if the save fails.
- **FR-018**: Existing row actions MUST keep working as today: status, notes, WhatsApp, copy phone/email, delete with confirmation. The WhatsApp prefilled message MUST name the workshop (organization) for workshop records and the course title for course records.
- **FR-019**: Both views MUST reuse the existing table, drawer, filter bar, stat strip, toast, empty state and pagination patterns, and MUST show records as cards at 360px with no horizontal scroll.
- **FR-020**: Motion MUST respect the reduced-motion setting.
- **FR-021**: The store MUST have lookup support for type + status + received date and for type + course, so both views stay fast as records grow. Existing records are not changed.
- **FR-022**: The automated check that every admin action refuses a signed-out caller MUST include any new action this feature adds.
- **FR-023**: Automated tests MUST show that a course record acted on with type "workshop" (status, notes, delete) fails and leaves the record unchanged, and the same the other way round.

### Key Entities

- **Submission (lead)**: one record per form submission, shared fields (reference, name, phone, email, message, status, notes, received date) plus a type of either workshop or course. Status is one of new, contacted, booked, closed.
- **Workshop submission**: adds role, organization, city, participants, preferred month.
- **Course registration**: adds the chosen course's id, the course title as it was at sign-up (stored as the course name), applicant level and age group. New registrations also carry a category snapshot (category id and name as at sign-up); records saved before this feature have none.
- **Course and category**: managed in admin since feature 025. A registration points at a course by id; the course may since have been edited, re-categorised or deleted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With mixed records stored, 100% of rows, counts, badges and drawers in the Workshops view are workshop records, and 100% in the Course registrations view are course records, verified by an automated test of the server reads.
- **SC-002**: The owner can find a specific registration by course and age group in under 15 seconds from signing in.
- **SC-003**: Marking a new submission contacted takes one tap and shows the change in under 1 second.
- **SC-004**: Every new or changed admin action refuses a signed-out caller and changes nothing, checked by the automated guard test. Every row action given the wrong type fails and changes nothing, checked by an automated test.
- **SC-008**: 100% of course registrations saved after release carry the course's category as at sign-up, and stay findable by that category after the course is deleted.
- **SC-005**: Both views load in under 2 seconds with 5,000 stored submissions.
- **SC-006**: At 360px width both views, the drawer and the sidebar group show without horizontal scroll.
- **SC-007**: Reloading or sharing any filtered, paged view address shows the same results.

## Assumptions

- "courseTitle snapshot" in the request is the course name stored on each registration at sign-up (`courseName` today). It is shown as stored and never rewritten.
- "Level" and "age group" in the course view are the applicant's answers on the register form (beginner / some experience; under 18 / 18 plus), not the course's own level.
- Older registrations are not backfilled with a category snapshot; they use the live lookup (no data migration).
- The owner notification email does not change and does not show the category.
- The "Under 18" badge appears in the drawer as specified; a small marker in the row is optional and not required.
- The quick action is offered only on "new" records; other status changes stay in the drawer.
- Search keeps today's matching behaviour (case-insensitive, partial).
- Page size stays as today (25).
- The old `/admin?…` filter addresses are not mapped to the new views.

## Out of Scope

- CSV export.
- The admin dashboard (the `/admin` redirect is a placeholder for it).
- Changes to the owner notification emails.
- Changes to the public workshop or register forms' fields, validation or UI. The only change on save is the server-side category snapshot on course registrations.
- Adding a new status value, or migrating or backfilling stored records.
