# Feature Specification: Courses and Course Categories (admin-managed)

**Feature Branch**: `025-courses-catalog`
**Created**: 2026-11-10
**Status**: Draft
**Input**: User description: "Courses and course categories (admin-managed). Admins manage categories and courses; visitors browse /courses and /courses/[slug]; the register form lists published courses and can preselect one from the URL. Reuse the existing admin layout, auth checks, UI components and Programs CRUD patterns without changing Programs behaviour. Out of scope: payments, enrolment accounts, lesson content or video hosting, image upload."

## Clarifications

### Session 2026-11-10

- Q: What should a published-but-closed course's own page do? → A: Stay reachable with a "Registration closed" call to action linking to /register without a preselection.
- Q: Should /register wording and the confirmation change now that real courses exist? → A: Heading and button become "Register". The confirmation depends on the choice: open course → "We'll WhatsApp you with dates and fees"; coming-soon course or "Not sure yet" → the existing "when it opens" message.
- Q: How should a slug collision be handled for courses and categories? → A: Hybrid. A slug filled in from the title and never edited gets a numeric suffix (`-2`, `-3`…) automatically. A slug the admin typed is refused with "Another course/category already uses this address. Choose a different one."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin publishes a course (Priority: P1)

A signed-in admin creates a course category, then creates a course in it: title, category, level, summary, a long description, outcomes, a syllabus, format, duration, optional start date, price text, enrolment status, an optional cover image link, featured flag and display order. While editing, they see a live preview of the course exactly as visitors will see its card. When they publish, the course appears on the public site.

**Why this priority**: Nothing else in the feature shows anything until courses exist. This is the content source for every other story.

**Independent Test**: Sign in, create a category, create and publish a course, then confirm it is stored, shown in the admin grid with the right chips, and reachable at its public address.

**Acceptance Scenarios**:

1. **Given** a signed-in admin and at least one category, **When** they fill in the course form and save, **Then** the course is stored with a unique web address (slug) generated from its title and appears in the admin course grid.
2. **Given** a new course whose slug was filled in from its title (not edited) and is already used, **When** the admin saves, **Then** the course is saved with a numeric suffix (e.g. `intro-to-ai-2`) and no existing course is overwritten. **But when** the admin typed the taken slug themselves, **Then** the save is refused with "Another course already uses this address. Choose a different one." on the slug field.
3. **Given** the course form, **When** the admin types into any field shown on the public card, **Then** the live preview updates immediately and matches the public card's look.
4. **Given** a required field is empty or a value is invalid, **When** the admin saves, **Then** the save is refused and the same field-level messages are shown that the server would return.
5. **Given** a course in the grid, **When** the admin flips the published toggle or the featured star, **Then** the change is saved, a confirmation toast is shown, and the public pages reflect it on the next visit.
6. **Given** the admin course grid, **When** the admin filters by category and/or enrolment status, **Then** only matching courses are shown.
7. **Given** an existing course, **When** the admin deletes it after confirming in a dialog, **Then** it disappears from the grid and from the public site, and earlier course sign-ups that named it still show its title.

---

### User Story 2 - Visitor browses courses and reads one (Priority: P1)

A visitor opens Courses from the site navigation (or the "Online courses" card on the home page or /programs), sees published courses with featured ones first, narrows the list by category and level, opens a course, reads its description, outcomes, syllabus and key facts, and presses "Register".

**Why this priority**: This is the public value of the feature: it replaces the waitlist-only dead end with real course information.

**Independent Test**: With a few published courses seeded, open /courses, filter, open a course page, and follow the Register button to the register form.

**Acceptance Scenarios**:

1. **Given** published courses with different statuses, **When** a visitor opens /courses, **Then** open and coming-soon courses are listed (featured first, then by display order), closed and unpublished courses are not listed, and coming-soon courses look visibly quieter than open ones.
2. **Given** /courses, **When** the visitor picks a category chip and/or a level, **Then** the list narrows at once without a full page reload, and the address bar records the choice as `?category=<slug>&level=<level>`.
3. **Given** a shared link with `?category=` and/or `?level=`, **When** it is opened, **Then** the same filters are pre-applied. Unknown filter values are ignored and the unfiltered list is shown.
4. **Given** filters that match nothing, **When** applied, **Then** a short "no courses match" message is shown with a way to clear the filters.
5. **Given** each course card, **Then** it shows the cover image (or a brand pattern when there is none), category, level, format, duration, status chip and price text, and links to the course page.
6. **Given** a published course, **When** the visitor opens /courses/<slug>, **Then** they see a header (title, summary, category, level, status), the description, outcomes, the syllabus as an expandable list or timeline, a facts grid (format, duration, start date when set, price, level), and a "Register" call to action that stays in view while scrolling (a bottom bar on small screens).
7. **Given** a published closed course, **When** the visitor opens its page, **Then** the page shows normally, but the call to action reads "Registration closed" and links to /register with no course selected.
8. **Given** an unpublished course or an unknown slug, **When** /courses/<slug> is requested, **Then** a "not found" page is shown.
9. **Given** a course page is shared on social media or messaging apps, **Then** the link preview shows that course's title and summary.
10. **Given** the home page Programs section and /programs, **When** the visitor clicks the "Online courses" card, **Then** they land on /courses.

---

### User Story 3 - Visitor registers for a specific course (Priority: P2)

From a course page, the visitor presses "Register" and arrives at the register form with that course already chosen. Without a preselection, the course list shows published open and coming-soon courses grouped by category, plus "Not sure yet". The stored sign-up keeps the course title as it was at submission time.

**Why this priority**: It turns browsing into a lead, but the existing form already works with "Not sure yet", so this builds on P1 rather than being required for it.

**Independent Test**: Open /register?course=<slug> for an open course, confirm it is preselected, submit, and confirm the stored sign-up has both the course reference and the title snapshot.

**Acceptance Scenarios**:

1. **Given** published open and coming-soon courses, **When** the visitor opens /register, **Then** the course choice lists them grouped under their category names, followed by "Not sure yet". Closed and unpublished courses are not offered.
2. **Given** /register?course=<slug> for an offered course, **When** the page loads, **Then** that course is already selected.
3. **Given** /register?course=<slug> for a closed, unpublished or unknown course, **When** the page loads, **Then** nothing is preselected and no error is shown.
4. **Given** a sign-up for a course, **When** it is stored, **Then** it records the course reference and the course title at that moment. **And when** the course is later renamed or deleted, **Then** the admin still sees the original title on that sign-up.
5. **Given** a successful sign-up, **When** the confirmation is shown, **Then** for an open course it says Tareeq will WhatsApp the visitor with dates and fees. For a coming-soon course or "Not sure yet" it says Tareeq will WhatsApp them when the course opens.
6. **Given** a submitted course value that is not currently offered (tampered, or the course was closed while the form was open), **When** submitted, **Then** the server refuses it with the existing "choose a course" message.

---

### User Story 4 - Admin manages categories (Priority: P2)

The admin lists, creates, edits and deletes course categories and sets their display order with an order number.

**Why this priority**: Needed before the first course can be created, but it is a small, simple screen.

**Independent Test**: Create two categories, change their order numbers, confirm the new order on /admin/courses/categories and in the /courses chips, then try to delete a category that has a course.

**Acceptance Scenarios**:

1. **Given** the categories screen, **When** the admin creates a category with a name, **Then** it gets a unique slug generated from the name and appears in the list.
2. **Given** categories with order numbers, **When** the admin changes an order number and saves, **Then** the list, the /courses chips and the register form groups follow the new order.
3. **Given** a category with one or more courses (published or not), **When** the admin tries to delete it, **Then** the delete is refused with a clear message naming how many courses still use it.
4. **Given** a category with no courses, **When** the admin confirms deletion, **Then** it is removed.

---

### User Story 5 - Empty catalogue (Priority: P3)

Before any course is published, the public site still works and points visitors to the register form.

**Why this priority**: This is the launch-day state, but it is a small fallback.

**Independent Test**: With no published courses, open /courses and /register.

**Acceptance Scenarios**:

1. **Given** no published courses (or only closed ones), **When** a visitor opens /courses, **Then** they see a friendly "Courses are coming soon" message with a link to /register, and no filters.
2. **Given** no offered courses, **When** a visitor opens /register, **Then** the course choice offers only "Not sure yet" and the form still submits.

---

### Edge Cases

- A visitor requests a non-admin action, or an anonymous request calls any course or category admin action directly: the server refuses it and nothing changes.
- Two courses (or categories) have titles that produce the same slug: a slug filled in from the title gets a numeric suffix; a slug the admin typed is refused with a "choose a different one" message.
- Two admins save courses with the same slug at the same moment: the uniqueness rule still holds. One save succeeds, and the other gets a suffix (auto slug) or the "choose a different one" message (typed slug).
- A course's title is edited after publishing: [assumption] its slug stays the same so shared links keep working. The admin can change the slug by hand, and the old address then returns "not found".
- A course is unpublished or closed while a visitor has its page open: their next navigation or form submit follows the new state (page becomes "not found"; register submit is refused for a no-longer-offered course).
- A category with no published courses: its chip is not shown on /courses.
- A cover image link that fails to load: the card falls back to the brand pattern.
- Very long titles, summaries or many syllabus items at 360px width: text wraps, no horizontal scrolling.
- A visitor who prefers reduced motion: syllabus expand/collapse, preview updates and sticky bar have no animated motion.
- Saving or deleting fails (database unreachable): the admin sees an error toast and the form keeps their input.

## Requirements *(mandatory)*

### Functional Requirements

**Access and safety**

- **FR-001**: Every course and category create, edit, delete, publish toggle, featured toggle and reorder MUST check for a signed-in admin on the server and refuse otherwise. The existing check that anonymous calls to admin actions are refused MUST cover every new action.
- **FR-002**: Existing Programs pages, admin screens and behaviour MUST NOT change, apart from the "Online courses" card link (FR-024).

**Categories**

- **FR-003**: A category MUST have a name, a unique slug generated from the name (collisions handled as in FR-007), an optional description and a display order number.
- **FR-004**: Admins MUST be able to list, create, edit, reorder (by order number) and delete categories at /admin/courses/categories.
- **FR-005**: Deleting a category that any course still uses MUST be refused with a message saying so and how many courses use it.

**Courses (admin)**

- **FR-006**: A course MUST have: title, unique slug, category, level (beginner, intermediate or advanced), summary, description (supports basic formatting: headings, lists, links, emphasis), outcomes (a list of short lines), syllabus (an ordered list of items, each with a title and description), format (live, self-paced or recorded), duration text, optional start date text, price text, enrolment status (open, coming soon or closed), optional cover image link, featured flag, display order and published flag.
- **FR-007**: The slug MUST be generated from the title when the course is created, MUST be unique across courses, and MUST stay unchanged when the title is later edited unless the admin edits it. If a slug filled in from the title (never edited by the admin) is taken, the system MUST add the lowest free numeric suffix (`-2`, `-3`…). If a slug the admin typed is taken, the save MUST be refused with a field message telling them to choose a different one. The slug field MUST warn that changing it later breaks old links.
- **FR-008**: The same validation rules MUST apply in the browser form and on the server, with the same messages.
- **FR-009**: /admin/courses MUST show courses as a card grid with title, category, level, enrolment status chip, published toggle and featured star, and MUST allow filtering by category and by enrolment status.
- **FR-010**: The course form MUST show a live preview built from the same card that visitors see on /courses.
- **FR-011**: Admins MUST be able to delete a course after a confirmation dialog.
- **FR-012**: "Courses" MUST appear in the admin sidebar.
- **FR-013**: Every save, delete or toggle MUST refresh the affected public pages (course list, the course's own page, register course choices, category chips) so visitors see the change on their next visit without a redeploy.
- **FR-014**: Admin screens MUST reuse the existing admin patterns: drawer or page form, toasts, toggles, loading skeletons and confirm dialogs.

**Public catalogue**

- **FR-015**: /courses MUST show a heading and intro, category chips (only categories with at least one listed course, in category order), a level filter, and the course cards.
- **FR-016**: /courses MUST list only published courses whose status is open or coming soon, featured first, then by display order. Coming-soon courses MUST look visibly quieter (for example muted card and a "Coming soon" chip) but stay clickable.
- **FR-017**: Category and level filters MUST apply without a full page reload and MUST be reflected in and restored from the address (`?category=&level=`). Unknown values MUST be ignored.
- **FR-018**: Each card MUST show cover image or brand pattern, category, level, format, duration, status chip and price text.
- **FR-019**: /courses/<slug> MUST show header (title, summary, category, level, status), description, outcomes, syllabus as an expandable list or timeline, and a facts grid. The "Register" action MUST link to /register?course=<slug> and stay in view while scrolling (a bottom bar on small screens).
- **FR-020**: Closed but published courses MUST still have a reachable course page, and their call to action MUST say registration is closed and link to /register without a preselection.
- **FR-021**: Unpublished or unknown course slugs MUST return a "not found" page.
- **FR-022**: Course pages MUST be prebuilt for published courses and MUST each have their own page title, description and social link preview.
- **FR-023**: "Courses" MUST appear in the public navigation.
- **FR-024**: The fixed "Online courses" card on /programs and on the home Programs section MUST link to /courses.
- **FR-025**: With no listed courses, /courses MUST show a friendly "Courses are coming soon" message with a link to /register.

**Register form**

- **FR-026**: The register form's course choice MUST list published courses with status open or coming soon, grouped by category in category order, followed by "Not sure yet". With none, only "Not sure yet" is offered.
- **FR-027**: /register?course=<slug> MUST preselect that course when it is offered, and silently ignore it otherwise.
- **FR-027a**: The /register heading, page title and submit button MUST read "Register" (replacing "Join the waitlist"), and links that use this label MUST follow it.
- **FR-027b**: The confirmation after a course sign-up (on-page text and the prefilled WhatsApp message) MUST depend on the choice: an open course says Tareeq will be in touch with dates and fees; a coming-soon course or "Not sure yet" keeps the existing "we'll WhatsApp you when it opens" wording.
- **FR-028**: The server MUST accept only offered courses or "Not sure yet" as the submitted course.
- **FR-029**: A stored course sign-up MUST keep the course reference and a snapshot of the course title at submission time. Admin views and notifications MUST show the snapshot, so sign-ups stay readable after a rename or delete. Sign-ups made before this feature MUST keep displaying as they do today.

**Quality**

- **FR-030**: All new pages MUST work at 360px width with no horizontal scrolling, use the existing brand colours, fonts and components, and respect the visitor's reduced-motion preference.
- **FR-031**: Only the filters, form lists, live preview and toggles may run interactive code in the browser. Everything else is rendered on the server.
- **FR-032**: No new third-party packages may be added.

### Key Entities

- **Course Category**: A grouping shown as a filter chip and a group label in the register form. Name, unique slug, optional description, display order, created/updated times. Has many courses.
- **Course**: A public course listing. Title, unique slug, one category, level, summary, formatted description, outcomes, syllabus items (title + description), format, duration text, optional start date text, price text, enrolment status, optional cover image link, featured, display order, published, created/updated times.
- **Course sign-up (existing lead)**: An existing record type. For course sign-ups it references the chosen course (or "Not sure yet") and keeps a title snapshot taken at submission.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can create a category and publish a fully filled-in course in under 5 minutes, and see it on /courses on the next page load without a redeploy.
- **SC-002**: 100% of course and category admin actions refuse anonymous calls (verified by the automated anonymous-action check).
- **SC-003**: A visitor can get from the home page to a specific course's register form, with the course preselected, in 3 clicks or fewer.
- **SC-004**: Filtering /courses updates the list in under 0.5 seconds on a mid-range phone, and a copied filtered link reopens with the same filters 100% of the time.
- **SC-005**: Every course sign-up shows its course title in admin, including after the course has been renamed or deleted (0 blank course names).
- **SC-006**: All new public and admin pages render without horizontal scrolling at 360px width and pass the project's existing accessibility checks.
- **SC-007**: Closed and unpublished courses never appear in the /courses list or the register course choice (0 occurrences in automated checks).
- **SC-008**: Existing Programs pages and tests pass unchanged.

## Assumptions

- **Title snapshot field**: Course sign-ups already store a course reference and a course-name snapshot. The "courseTitle snapshot" in the request is met by keeping that existing snapshot (filled from the course title), not by a new field, so old sign-ups need no migration.
- **Course reference value**: The stored course reference is the course's database id. Older sign-ups keep their current placeholder ids, and "Not sure yet" keeps its existing id.
- **Coming-soon registration**: Coming-soon courses can be chosen on the register form. The sign-up counts as interest and gets the "when it opens" confirmation (FR-027b).
- **Slug on rename**: Slugs do not change automatically when a title is edited, so published links don't break. Admins can edit the slug manually.
- **Description formatting**: Same rules as program descriptions: basic formatting (headings, paragraphs, lists, links, bold/italic), cleaned so only safe markup survives. Raw HTML is not rendered.
- **Cover image**: Same rule as program cover images. An optional link that is either a secure (https) web address or a path on this site. Images from the site's approved image host are shown; any other link falls back to the brand pattern. No uploads.
- **Display order ties**: Courses (or categories) with equal order numbers are sorted by title.
- **Public nav**: The "Courses" nav link already exists and points at /courses. This feature makes the target real.
- **Seed data**: No real courses are seeded. The placeholder course list used by the register form today is removed in favour of published courses.

## Out of Scope

- Payments, checkout or fees collection
- Student accounts, enrolment tracking or seat limits
- Lesson content, video hosting or a learning platform
- Image upload (cover images are links only)
- Any change to Programs behaviour beyond the "Online courses" card link

## Dependencies

- Existing admin sign-in, session check and admin layout (feature 022/024)
- Existing lead capture and register form (feature 006)
- Existing Programs pages and the fixed "Online courses" card (feature 015)
