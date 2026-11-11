# Feature Specification: Admin dashboard home

**Feature Branch**: `029-admin-dashboard`
**Created**: 2026-11-11
**Status**: Draft
**Input**: User description: "Admin: dashboard home (/admin). One screen that tells the owner what needs attention today. Replaces the temporary redirect from /admin to workshop submissions." (Full description: `history/prompts/029-admin-dashboard/1-admin-dashboard-spec.spec.prompt.md`.)

## Context

Today `/admin` redirects to the workshop requests list (a stopgap from specs/026-split-submissions FR-002). The owner has to open two lists to see whether anyone is waiting for a reply. This feature replaces the redirect with a dashboard home page: overdue leads first, then a few numbers, a 14-day trend, recent activity, top courses and a content summary.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See who is waiting too long and act (Priority: P1)

The owner signs in and lands on `/admin`. A greeting shows the time of day and today's date. Below it, a "Needs attention" list shows every lead still marked "new" that has waited longer than the promised reply time. Each row shows the name, the type (workshop or course), and how long ago it arrived ("3 days ago"). The owner can mark a lead contacted from the row, or open it in the existing drawer on its submissions page.

**Why this priority**: Replying on time is the promise made on the public forms. Missing a lead is the most costly mistake this page can prevent.

**Independent Test**: Seed one overdue new lead of each type, one recent new lead, and one overdue contacted lead. Open `/admin`. Only the two overdue new leads are listed. "Mark contacted" removes a row and updates its status. "Open" goes to the matching submissions page with that lead's drawer open.

**Acceptance Scenarios**:

1. **Given** a new workshop lead created 3 working days ago, **When** the owner opens `/admin`, **Then** it appears under Needs attention with its name, a "Workshop" type chip and "3 days ago".
2. **Given** a new lead created within the reply window, **When** the owner opens `/admin`, **Then** it does not appear under Needs attention.
3. **Given** an overdue lead with status "contacted", "booked" or "closed", **When** the owner opens `/admin`, **Then** it does not appear.
4. **Given** an overdue lead in the list, **When** the owner presses "Mark contacted", **Then** the lead's status becomes "contacted", the row leaves the list, a confirmation is shown, and the stat cards and sidebar badges reflect the change on the next render.
5. **Given** the action fails (for example, the database is unreachable or the session has expired), **When** the owner presses "Mark contacted", **Then** the row stays, an error message is shown, and nothing changes.
6. **Given** an overdue course lead, **When** the owner presses its open link, **Then** the course registrations page opens with that lead's drawer open.
7. **Given** no overdue new leads, **When** the owner opens `/admin`, **Then** the section reads "You're all caught up."
8. **Given** it is 09:00 in Karachi, **When** the owner opens `/admin`, **Then** the greeting reads "Good morning, Sheza", followed by today's date.

---

### User Story 2 - Read the numbers at a glance (Priority: P2)

The owner sees four stat cards: new workshop requests, new course registrations, leads this week (both types) with the change from last week, and leads booked or enrolled this month. Each card links to the matching filtered list.

**Why this priority**: These numbers show workload and momentum without opening any list. They are useful, but less urgent than overdue replies.

**Independent Test**: Seed known leads over the last three weeks. Each card's number matches a hand count, and each link opens the list with the matching filter.

**Acceptance Scenarios**:

1. **Given** 4 workshop leads with status "new", **When** the dashboard loads, **Then** the "New workshop requests" card shows 4 and links to the workshop list filtered to status "new".
2. **Given** 6 leads this week and 4 last week, **When** the dashboard loads, **Then** "Leads this week" shows 6 with "+2 vs last week" marked as an increase.
3. **Given** 0 leads last week and 3 this week, **When** the dashboard loads, **Then** the change reads "+3 vs last week". No percentage or division-by-zero text is shown.
4. **Given** 2 workshop leads booked and 1 course lead enrolled this month, **When** the dashboard loads, **Then** "Booked / enrolled this month" shows 3.
5. **Given** reduced motion is set, **When** the numbers render, **Then** they appear at their final value with no count-up.

---

### User Story 3 - See the trend and recent activity (Priority: P2)

The owner sees a stacked bar chart of daily leads for the last 14 days, split into workshop and course, and a list of the 8 most recent submissions of both types. Each recent row shows the name, a type chip, the course or organization, the status and the time. Pressing a row opens the lead in its drawer on the matching submissions page.

**Why this priority**: The trend shows whether demand is rising or falling. Recent activity is a quick way into the latest leads.

**Independent Test**: Seed leads on known days. Each bar's two parts match the counts for that Karachi day. A screen reader can reach a table with the same numbers. The recent list shows the 8 newest in order, and each row opens the right drawer.

**Acceptance Scenarios**:

1. **Given** 2 workshop leads and 1 course lead created on one Karachi day, **When** the chart renders, **Then** that day's bar has a workshop part of 2 and a course part of 1, and its accessible label reads, for example, "Tue 10 Nov: 2 workshop, 1 course".
2. **Given** a lead created at 23:30 Karachi time (18:30 UTC), **When** the chart renders, **Then** it is counted on that Karachi day, not on the UTC day.
3. **Given** a day with no leads, **When** the chart renders, **Then** that day still has a slot on the axis, with an empty bar and the label "0 leads".
4. **Given** no leads in the 14 days, **When** the chart renders, **Then** an empty state replaces the chart.
5. **Given** 10 leads exist, **When** the recent list renders, **Then** it shows the 8 newest, newest first. Course rows show the course name from the stored snapshot, and workshop rows show the organization (or "—").
6. **Given** a recent row, **When** the owner presses it, **Then** the matching submissions page opens with that lead's drawer open.

---

### User Story 4 - Top courses and content summary (Priority: P3)

The owner sees the 5 courses with the most registrations in the last 30 days, and a content summary: published programs, published courses and categories, each with a count and a link. Quick actions are available for New program, New course and Settings.

**Why this priority**: This is helpful context and saves a click or two, but nothing on it is urgent.

**Independent Test**: Seed registrations across 6 courses in the last 30 days and one older registration. The top 5 are listed in order with correct counts, and the older one is not counted. Content counts match the published items, and the links work.

**Acceptance Scenarios**:

1. **Given** registrations for 6 courses in the last 30 days, **When** the dashboard loads, **Then** the top 5 by count are listed, highest first, each with its count.
2. **Given** a course that has since been renamed or deleted, **When** it ranks in the top 5, **Then** it is listed under the name stored with the registrations.
3. **Given** no course registrations in 30 days, **When** the section renders, **Then** an empty state is shown.
4. **Given** 3 published and 1 draft program, **When** the content summary renders, **Then** "Published programs" shows 3 and links to the programs list.

---

### User Story 5 - A founder's note each day (Priority: P3)

Under the greeting, in a card of its own, the owner sees one short, personal line, written in the founder's own voice and drawn from her real story: school, quizzes, drawing, code, AI, content, overthinking and "let's just try". It is the same all day and changes the next day.

**Why this priority**: It makes the page feel like hers. Nothing depends on it.

**Independent Test**: Open `/admin` twice on the same Karachi day: the same note. Open it after Karachi midnight: a different note. With the database stopped, the note still shows.

**Acceptance Scenarios**:

1. **Given** any time on one Karachi day, **When** the owner opens `/admin`, **Then** the same note shows each time.
2. **Given** the day has changed in Karachi (00:00), **When** the owner opens `/admin`, **Then** a different note shows, and no note repeats before every note has been shown once.
3. **Given** the database cannot be read, **When** the owner opens `/admin`, **Then** the greeting and the note still show.

---

### Edge Cases

- **Database unavailable**: the page shows the existing "unavailable" notice instead of any numbers. It never shows zeros that look real.
- **Signed out or expired session**: `/admin` redirects to the login page before any data is read. The quick action refuses with no session.
- **Working-day boundary**: a lead created on Saturday evening is not overdue on Monday morning, because Sunday is not counted (see FR-007).
- **Week and month boundaries**: "this week" starts on Monday 00:00 Karachi time, and "this month" starts on the 1st at 00:00 Karachi time.
- **Long names**: names and course or organization text are truncated on one line and never cause horizontal scroll at 360px.
- **Many overdue leads**: the list shows the oldest 4 first and links to the full list of new leads by type (see FR-006).
- **Old links**: anything that links to `/admin` now lands on the dashboard. Bookmarks to the submissions pages are unchanged.
- **Late night**: at 01:00 Karachi time the greeting reads "Good evening".

## Requirements *(mandatory)*

### Functional Requirements

**Page and access**

- **FR-001**: `/admin` MUST show the dashboard instead of redirecting to workshop requests. Signed-out visitors MUST be redirected to the login page, checked on the server before any data is read.
- **FR-002**: The page MUST show current numbers on every visit. It is never served from a cache.
- **FR-003**: All counts, lists and the chart MUST be in the first page response. Nothing is loaded by the browser afterwards for the first view.
- **FR-004**: The sidebar MUST list "Dashboard" as its first item, marked active on `/admin`.

**Greeting**

- **FR-005**: The greeting MUST read "Good morning", "Good afternoon" or "Good evening", followed by ", Sheza", based on Asia/Karachi time: morning 05:00–11:59, afternoon 12:00–16:59, evening 17:00–04:59. Today's date is shown in Karachi time (for example, "Wednesday, 11 November 2026").

**Needs attention**

- **FR-006**: The section MUST list leads of both types with status "new" whose age is more than **2** working days. It is sorted oldest first and shows at most 4 rows. When more exist, the section shows the total and links to the new-status lists for each type.
- **FR-007**: Working days MUST count Monday to Saturday in Asia/Karachi time. Sunday is excluded. Public holidays are not considered.
- **FR-008**: Each row MUST show only the name, a type chip, a relative age ("today", "1 day ago", "3 days ago"), a "Mark contacted" action, and an open link to the lead's drawer on its submissions page. No phone, email or message.
- **FR-009**: "Mark contacted" MUST use the existing guarded status change for that lead's type. On success the row is removed and a confirmation shown. On failure the row stays and an error is shown.
- **FR-010**: With no overdue leads, the section MUST read "You're all caught up."

**Stat cards**

- **FR-011**: The page MUST show four cards:
  - New workshop requests: all workshop leads with status "new". Links to the workshop list filtered to "new".
  - New course registrations: all course leads with status "new". Links to the course list filtered to "new".
  - Leads this week: both types created since Monday 00:00 Karachi time, with the signed difference from the whole of last week ("+2", "−1" or "no change"). Links to the workshop list.
  - Booked / enrolled this month: leads of both types whose current status is "booked" and whose status changed this calendar month (Karachi time). Links to the workshop list filtered to "booked".
- **FR-012**: Stat numbers MUST count up from zero on first view, unless reduced motion is set, in which case they show their final value at once.

**Leads chart**

- **FR-013**: The page MUST show a stacked bar chart of leads per Karachi day for the last 14 days including today, split into workshop and course. Every day has a slot, including days with zero leads.
- **FR-014**: Each bar MUST have an accessible label giving the date and both counts. A table with the same data MUST be available to screen readers. The two series MUST be distinguishable by more than colour alone (a legend plus the labels).
- **FR-015**: The chart MUST be drawn without adding any charting library.

**Recent activity**

- **FR-016**: The page MUST list the 8 newest leads of both types, newest first. Each row shows the name, type chip, course name (from the stored snapshot) or organization, status chip (with "Enrolled" wording for course leads), and relative time.
- **FR-017**: Pressing a row MUST open that lead's drawer on the matching submissions page.

**Top courses**

- **FR-018**: The page MUST list up to 5 courses by registration count over the last 30 days (Karachi time), highest first, using the course name stored with each registration. Ties are ordered by name.

**Content summary**

- **FR-019**: The page MUST show counts with links for published programs, published courses and categories, plus quick links to New program, New course and Settings.

**Layout, states and privacy**

- **FR-020**: On wide screens the page MUST use a 12-column grid: the greeting and the founder's note side by side on top, the four number cards in one row across the full width, then two independent columns below (needs attention and recent activity on the left; the chart, top courses and content on the right). On narrow screens it is a single column: greeting, founder's note, numbers, needs attention, chart, recent activity, top courses, content. There is no horizontal scroll from 360px up. (Revised by the owner after the first review; the original order put needs attention beside the numbers.)
- **FR-021**: Every section MUST have an empty state. The page MUST show skeletons while loading, and the existing unavailable notice if the data cannot be read.
- **FR-022**: The page MUST use the existing admin visual patterns (soft-blue cards, status and type chips, count-up, skeletons, empty states).
- **FR-023**: No personal data other than the lead's name may appear on the dashboard.
- **FR-024**: The page MUST NOT add new dependencies.
- **FR-025**: The dashboard MUST show one founder's note in its own card under the greeting. The notes are a fixed list of original lines in the founder's voice, based only on what she has said about herself, with no invented achievements and no generic motivation. The note is the same for the whole Karachi day and changes at Karachi midnight; every note is shown once before any repeats, and it never needs the database. Notes appear only in the admin panel.

### Key Entities

- **Lead** (existing): type (workshop or course), name, status, created time, status-changed time, organization (workshop), course snapshot (course). Read only, except for the status change from the quick action.
- **Program, Course, Course category** (existing): counted for the content summary.
- **Dashboard summary** (derived, not stored): the stat counts, the 14-day series, the top 5 courses, the overdue list and the recent list, computed for each visit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From sign-in, the owner can see every overdue lead and mark one contacted in under 10 seconds and two clicks, without opening any list page.
- **SC-002**: For a seeded data set, every stat card, chart bar, top-course count and list matches a hand count, including leads near midnight Karachi time and across a Sunday.
- **SC-003**: The dashboard is usable within 2 seconds on a normal connection with 5,000 leads stored.
- **SC-004**: At 360px, 390px and 1440px, every section is readable with no horizontal scroll, and every control has a touch target of at least 44px.
- **SC-005**: A screen-reader user can hear each chart day's counts and reach every action by keyboard, with visible focus.
- **SC-006**: Signed out, `/admin` shows no data and redirects to login. The quick action refuses with no session.

## Assumptions

- The owner's display name "Sheza" is fixed for now (there is one admin account). It is shown as given, not read from personal data.
- "This week" is Monday to Sunday. "Last week" is the full previous Monday-to-Sunday week, so early in the week the comparison is with a full week.
- "Booked this month" uses the date the status last changed, because no separate booking date is stored. A lead that is booked, then changed and re-booked, counts in the month of its latest change.
- "Leads this week" and "Booked / enrolled" link to the workshop list as the default view, because there is no combined list (specs/026).
- Relative ages use calendar days in Karachi time ("3 days ago"), while overdue status uses working days. A lead can read "2 days ago" and still not be overdue across a Sunday.
- Public holidays are not considered.
- "A new note after 24 hours" is read as a new note each Karachi day, changing at midnight, not 24 hours after the first view. The list is written into the code, so adding or changing notes is a code edit.
- The overdue threshold is 2 working days, chosen by the owner on 2026-11-11. This is one day more than the "within 1 working day" promised on the public forms. The public copy is not changed by this feature.

## Out of Scope

- Date-range pickers, exports, traffic analytics and email reports.
- A combined list of both lead types.
- Editing anything other than lead status from the dashboard.

## Dependencies

- Existing lead model, status change action and type-scoped submissions pages with the drawer (specs/026).
- Existing program, course and category data (specs/025 and earlier).
- Existing admin session check, sidebar, chips, count-up, skeleton, empty state and unavailable notice components.
