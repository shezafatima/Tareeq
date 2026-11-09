# Feature Specification: Admin Panel (Launch Scope)

**Feature Branch**: `022-admin-panel`
**Created**: 2026-11-09
**Status**: Draft
**Input**: User description: "Admin panel (launch scope): a private panel for a single owner to manage leads (submissions) and programs. Polished UI built with styling and light motion only, no new UI libraries." (full brief recorded in the PHR for this feature)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure sign-in for the owner (Priority: P1)

The site owner opens the admin area, signs in with their email and password, and reaches the panel. Nobody else can see or change anything behind it.

**Why this priority**: Everything else exposes personal data (leads) and controls public content (programs). Without trustworthy access control nothing can ship.

**Independent Test**: With the panel's other pages stubbed, a logged-out visitor is sent to the sign-in page from every admin address, wrong credentials are refused, correct credentials open the panel, and the sixth failed attempt from one network address inside 15 minutes is blocked.

**Acceptance Scenarios**:

1. **Given** a logged-out visitor, **When** they open any admin page, **Then** they land on the sign-in page.
2. **Given** the sign-in page, **When** the owner enters the correct email and password, **Then** they see a loading state and arrive in the panel.
3. **Given** the sign-in page, **When** wrong credentials are entered (wrong email or wrong password), **Then** the same generic message "Invalid credentials" is shown, revealing nothing about which part was wrong.
4. **Given** five failed attempts from one network address within 15 minutes, **When** a sixth attempt is made (even with correct credentials), **Then** it is blocked with a clear "try again later" message.
5. **Given** a logged-out caller, **When** any admin data action or admin endpoint is called directly (not through the page), **Then** it is refused (unauthorised or redirect) and changes nothing.
6. **Given** search engines and the site map, **When** they look for admin pages, **Then** admin pages are not listed, are disallowed for crawlers, and carry a no-index instruction.

---

### User Story 2 - Review and work leads (Priority: P1)

The owner sees at a glance how many leads are new, contacted, booked and closed, finds a specific lead, opens its details, moves it through the pipeline, jots private notes, and contacts the person on WhatsApp.

**Why this priority**: Leads are the business outcome of the site; this is the main reason the panel exists.

**Independent Test**: With some leads in the system, filter by status and type, search, open a lead, change its status and notes, refresh, and confirm the changes persist.

**Acceptance Scenarios**:

1. **Given** leads exist, **When** the owner opens the Submissions page, **Then** four stat cards (New, Contacted, Booked, Closed) show the correct counts (numbers animate up once on load) above a newest-first table of 25 leads per page.
2. **Given** the stat strip, **When** the owner clicks a card, **Then** the list is filtered to that status and the filter is reflected in the page address.
3. **Given** the list, **When** the owner filters by type (workshop or course) and/or status, or searches by name, phone, email or organization, **Then** only matching leads show, and a refresh keeps the same filters and results.
4. **Given** a lead row, **When** the owner clicks it, **Then** a detail panel slides in from the right showing every field of the lead.
5. **Given** the detail panel, **When** the owner changes the status, **Then** the new status appears immediately and is still there after a refresh; if saving fails, the previous status is restored and an error is shown.
6. **Given** the detail panel, **When** the owner edits the admin notes and saves, **Then** a confirmation appears and the notes are still there after a refresh.
7. **Given** the detail panel, **When** the owner chooses "Open in WhatsApp", **Then** a chat with the lead's number opens with a short prefilled greeting.
8. **Given** the detail panel, **When** the owner copies the phone or email, **Then** it is placed on the clipboard and a confirmation appears.
9. **Given** the detail panel, **When** the owner chooses delete, **Then** an in-app confirmation dialog appears; only on confirming is the lead removed and the list updated.
10. **Given** a phone-width screen (360 px), **When** the owner views the list, **Then** rows appear as stacked cards and the detail panel fills the screen.

---

### User Story 3 - Manage programs shown on the public site (Priority: P1)

The owner creates, edits, reorders, publishes, unpublishes and deletes programs, seeing a live preview of how a program will look, and the public Programs pages and home Programs section update right away.

**Why this priority**: It lets the owner run the public catalogue without a developer or a redeploy.

**Independent Test**: Create a program, publish it, and confirm it appears on the public Programs page and home section; unpublish or delete it and confirm it disappears; all without redeploying.

**Acceptance Scenarios**:

1. **Given** programs exist, **When** the owner opens the Programs page, **Then** a card grid in display order shows each program's title, audience, status and a published toggle.
2. **Given** a program card, **When** the owner flips the published toggle, **Then** it saves instantly with a confirmation, and the public site reflects it.
3. **Given** the "New program" button, **When** the owner fills the form (title, slug, audience, status, call-to-action type, summary, description, outcomes, curriculum steps, facts, price text, optional cover image address, order, published) and saves, **Then** the program is created.
4. **Given** the title field, **When** the owner types a title, **Then** a slug is suggested automatically and remains editable; a slug already in use is rejected with a message next to the slug field.
5. **Given** the form on a wide screen, **When** the owner edits any field, **Then** a preview card beside the form updates to show how the program will look on the public site.
6. **Given** invalid input (missing or too-long values, bad slug, bad image address), **When** the owner saves, **Then** the problems are shown next to the specific fields and nothing is saved.
7. **Given** an existing program, **When** the owner edits it, changes its slug, unpublishes it or deletes it (after an in-app confirmation), **Then** the public Programs pages, including the old and new addresses of a renamed program, and the home section reflect the change without a redeploy.
8. **Given** a phone-width screen (360 px), **When** the owner uses the form, **Then** the form is a single column and fully usable.

---

### User Story 4 - Comfortable, polished admin experience (Priority: P2)

The panel feels consistent with the brand: a navigation sidebar on desktop, a top bar with slide-in menu on mobile, toasts for outcomes, skeletons while loading, friendly empty states, and graceful failure.

**Why this priority**: It makes the panel pleasant and trustworthy, but the panel is still functional without the polish.

**Independent Test**: Navigate between pages on desktop and mobile, trigger a save, a copy and a failure, view an empty list, and simulate the database being unreachable.

**Acceptance Scenarios**:

1. **Given** desktop width, **When** the owner views any admin page, **Then** a glass-style sidebar shows the wordmark and Submissions, Programs and Log out, with an indicator that slides to the current item.
2. **Given** mobile width, **When** the owner taps the menu button in the top bar, **Then** a drawer slides in with the same navigation and can be closed by tapping outside or pressing Escape.
3. **Given** data is loading, **When** a page renders, **Then** skeleton placeholders show instead of blank space.
4. **Given** no leads (or no matching leads, or no programs), **When** the list renders, **Then** an icon and a short friendly line are shown, e.g. "No submissions yet."
5. **Given** the database is unreachable or a page fails, **When** the owner opens an admin page, **Then** a clear message and a Retry button are shown instead of a crash, and Retry reloads the page.
6. **Given** any action succeeds or fails (save, delete, copy), **When** it finishes, **Then** a brief toast announces the result.
7. **Given** the owner chooses Log out, **When** it completes, **Then** they are signed out and sent to the sign-in page, and the back button does not reveal admin content.
8. **Given** the visitor's system asks for reduced motion, **When** any animation would play (count-up, slide-in, toggle, indicator), **Then** it does not animate.

---

### Edge Cases

- A lead is deleted or changed elsewhere while the detail panel is open: saving shows a clear "not found / out of date" error rather than silently succeeding.
- Two programs given the same slug (including a race between two saves): only one succeeds; the other shows the slug error.
- Renaming a program's slug: both the old and new public addresses refresh; the old address no longer shows the program.
- Search with no matches, a page number past the last page, or an unknown status/type in the address: shows the empty state or falls back to the first page / no filter, never an error.
- Very long notes, names or descriptions: limits are enforced with inline messages; the layout does not break.
- Leads with missing optional data (e.g. no email for a workshop request): copy-email is disabled or hidden and the field shows a dash.
- Phone numbers in varied formats: the WhatsApp link uses digits only.
- Session expires while the panel is open: the next action sends the owner to sign-in; unsaved edits are not falsely reported as saved.
- Pasting a cover image address that is not a safe web address (not https and not a site path): rejected with an inline message.
- Personal data (names, phones, emails) never appears in page addresses, logs or error messages; only an opaque record identifier may appear in an address.

## Requirements *(mandatory)*

### Functional Requirements

**Access control**
- **FR-001**: The system MUST support exactly one administrator, whose email and password verifier come from private configuration, never from source control.
- **FR-002**: The system MUST provide a command that turns a chosen password into the stored verifier, so the owner can set up credentials without exposing the password.
- **FR-003**: Sign-in MUST show only the generic message "Invalid credentials" for any wrong email or password.
- **FR-004**: Sign-in MUST block a sixth failed attempt from the same network address within 15 minutes, using the site's existing short-lived attempt tracking, and MUST show a clear retry-later message.
- **FR-005**: Every admin page, every admin data change and every admin endpoint MUST verify the owner's session on the server; access control MUST NOT depend on hidden buttons or browser-side checks.
- **FR-006**: Requests without a valid session MUST be redirected to sign-in (pages) or refused as unauthorised (direct data calls), with no data returned and no change made.
- **FR-007**: Admin pages MUST be excluded from the site map, disallowed for crawlers and marked no-index.
- **FR-008**: The owner MUST be able to log out, ending the session.
- **FR-009**: Configuration examples MUST list the new settings with placeholder values only.

**Sign-in page**
- **FR-010**: The sign-in page MUST show a centred card over the existing animated background with the wordmark (and the robot head image), labelled email and password fields, and a visible loading state while submitting.

**Layout and navigation**
- **FR-011**: All admin pages MUST share a layout: sidebar on desktop (wordmark, Submissions, Programs, Log out, sliding current-page indicator), top bar with slide-in drawer on mobile, and a light content area with card surfaces.

**Submissions**
- **FR-012**: The system MUST show counts of leads per status (New, Contacted, Booked, Closed) in a stat strip; clicking a card MUST apply that status filter.
- **FR-013**: The system MUST list leads newest first, 25 per page, with paging controls.
- **FR-014**: The owner MUST be able to filter by type and status and search by name, phone, email or organization; filters, search and page MUST be stored in the page address so they survive refresh, without putting personal data in that address beyond the search term the owner typed. [Assumption A4]
- **FR-015**: Each lead's status MUST be shown as a colour-coded chip (new = saffron, contacted = sky, booked = royal blue, closed = muted grey) meeting AA text contrast.
- **FR-016**: Opening a lead MUST show a detail panel with all stored fields, a status selector with immediate (optimistic) feedback, a notes box with explicit save, an "Open in WhatsApp" link with a short prefilled greeting, copy-phone and copy-email buttons, and delete behind an in-app confirmation dialog.
- **FR-017**: Status and notes changes MUST persist and be visible after refresh; the status change time MUST be recorded.
- **FR-018**: Deleting a lead MUST be permanent only after explicit confirmation.

**Programs**
- **FR-019**: The system MUST list all programs (published and unpublished) as cards in display order showing title, audience, status chip and a published toggle that saves instantly.
- **FR-020**: The owner MUST be able to create, edit and delete programs with the fields: title, slug, audience, status, call-to-action type, summary, description (markdown), outcomes list, curriculum list (title + description), facts (format, duration, groupSize, location), price text, optional cover image address, order, published.
- **FR-021**: The slug MUST be auto-suggested from the title, remain editable, be unique and follow the site's existing slug rules.
- **FR-022**: The same validation rules MUST apply in the browser (for instant feedback) and on the server (for safety); server-side errors MUST appear next to the relevant fields.
- **FR-023**: On wide screens the form MUST show a live preview card of how the program will appear on the public site.
- **FR-024**: Any program create, edit, delete or published change MUST refresh the public Programs list and that program's page (old and new slug when renamed) so visitors see it without a redeploy.
- **FR-025**: Deleting a program MUST require in-app confirmation.

**Feedback and resilience**
- **FR-026**: The system MUST show toasts for save, delete, copy and error outcomes.
- **FR-027**: The system MUST show skeleton placeholders while data loads and friendly empty states (icon + short line) when there is nothing to list.
- **FR-028**: Admin pages MUST show a clear message with a Retry button on failure, including database unavailability, instead of crashing.

**Motion, accessibility, privacy, scope**
- **FR-029**: Animations (count-up, panel slide, toggle, sidebar indicator) MUST be short (150–250 ms), limited to movement and fade, and MUST be disabled when the visitor prefers reduced motion.
- **FR-030**: Detail panel, drawers and dialogs MUST be fully keyboard-operable: focus moves in on open, stays inside while open, Escape closes, and focus returns to where it was. All fields MUST have labels and all interactive elements a visible focus state.
- **FR-031**: Personal data MUST NOT be written to logs or placed in page addresses (except the search text the owner types and an opaque record identifier).
- **FR-032**: All admin screens MUST be usable at 360 px width without horizontal page scrolling.
- **FR-033**: The panel MUST follow the site's existing brand look (colours, fonts, icon style) and MUST NOT add a UI component library.

### Key Entities

- **Administrator**: The single owner. Has an email and a password verifier held in private configuration. Not stored as a user record; there is no sign-up, multiple users or password reset.
- **Session**: A signed-in state for the administrator, checked on every admin request.
- **Sign-in attempt record**: A short-lived record of failed attempts per network address, expiring after the 15-minute window.
- **Lead (submission)**: An existing record created by the public workshop-request and course sign-up forms: reference, type, status (new/contacted/booked/closed), status change time, admin notes, name, phone, optional email, message, consent record, type-specific details (organization, role, city, participants, preferred month for workshops; course, level, age group for courses), notification state, timestamps. The panel reads all of it and edits only status and notes, or deletes it.
- **Program**: An existing record behind the public Programs pages: title, slug, audience, status, call-to-action type, summary, description, outcomes, curriculum steps, facts, price text, cover image address, order, published flag, timestamps. The panel creates, edits and deletes these.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of admin pages and admin actions refuse a logged-out caller (redirect or unauthorised response) with zero data returned, verified for every admin address and every admin action.
- **SC-002**: The 6th failed sign-in within 15 minutes from one network address is blocked in 100% of attempts, while the first five are processed normally.
- **SC-003**: The owner can find a specific lead by name, phone, email or organization and see its details in under 15 seconds.
- **SC-004**: A status or notes change is still present after a page refresh in 100% of successful saves, and the owner sees the new status within 0.5 seconds of choosing it.
- **SC-005**: A program created, edited, unpublished or deleted by the owner is reflected on the public Programs page and the home Programs section within 10 seconds, with no redeploy.
- **SC-006**: The owner can create a complete new program in under 5 minutes on first use.
- **SC-007**: Every admin screen is fully usable at 360 px width with no horizontal page scrolling.
- **SC-008**: All admin dialogs and panels can be opened, operated and closed using only the keyboard, with focus returning to the trigger.
- **SC-009**: All status chip and body text colour pairs meet AA contrast (4.5:1 for normal text).
- **SC-010**: With reduced motion enabled, zero admin animations play.
- **SC-011**: When the database is unreachable, 100% of admin pages show the friendly message and Retry button rather than a crash or blank page.
- **SC-012**: No personal data (names, phones, emails) appears in logs or page addresses, apart from the search text the owner types.

## Assumptions

- **A1**: The panel manages the existing lead and program records created by features 006 (lead capture) and 015 (programs pages); no data-shape changes are needed beyond what those already store.
- **A2**: There is one owner; no roles, invitations, multiple accounts or password reset. Changing the password means regenerating the verifier and updating private configuration.
- **A3**: The panel is for English-language desktop and mobile use; it is not translated.
- **A4**: The search text appears in the page address so it survives refresh; the brief's rule against personal data in addresses is read as applying to lead records (details shown by opaque identifier only), and the owner's own search term is allowed in the address.
- **A5**: Lead deletion is permanent (no recycle bin) in the launch scope, protected by the confirmation dialog.
- **A6**: Technology constraints from the brief are carried into planning, not this spec: the site's current framework with server-rendered pages and server-side actions, an established sign-in library with signed session tokens, password hashing via a standard library, and no other new dependencies.
- **A7**: "Instant" public updates rely on the site's existing cache-refresh mechanism for programs.

## Out of Scope

Dashboard charts, CSV export, site settings, courses management, testimonials management, image upload (cover images are a pasted address only), multiple administrators, password reset.
