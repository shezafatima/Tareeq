# Feature Specification: Lead Capture (Book a Workshop and Online Course Registration)

**Feature Branch**: `006-lead-capture`
**Created**: 2026-11-03
**Status**: Draft
**Input**: User description: "Feature: lead capture. Two forms that turn visitors into leads, stored in the database and sent to the owner immediately. The pilot workshop depends on this, so it must work reliably on a mid-range phone. Form A: Book a Workshop (at /workshop?book=1). Form B: Online course registration (at /register). Both forms: server validation mirrored on the client, phone normalised to international format defaulting to Pakistan (+92), honeypot plus 5 submissions per IP per hour, saved + owner emailed + confirmation with a prefilled 'Message us on WhatsApp' button, failures keep what was typed, stored with type / fields / status / admin notes / timestamps, nothing collected beyond the listed fields. Entry points: every 'Join a workshop' and 'Explore programs' call to action goes to /workshop?book=1 without restyling; /register is linked from the footer and course-related areas only; the Contact page links to both. Mobile-first from 360px, accessible, reuse existing Field, Button and Card components, Server Components by default, no personal data in logs, URLs or error messages." (full text recorded in the PHR for this spec)

## Clarifications

### Session 2026-11-03

- Q: The input says "Feature 005 will replace the course list source". Feature 005 is already used (`005-robot-travel-carousel`). -> A: **Assumed** this means "the later feature that publishes courses from the database", whatever its number. The requirement is unchanged: only the course-options function knows where the list comes from.
- Q: The hero's "Explore programs" button is part of the finished, signed-off hero (constitution Principle VIII). -> A: The owner explicitly asked for its link target to change, and nothing else. Only the destination changes; styling, markup structure and behaviour stay exactly as they are. The plan must still carry a one-line hero impact statement.
- Q: What happens next after a workshop request, and roughly when? -> A: **Owner decision:** "We'll call or WhatsApp you within 1 working day to agree a date and format."
- Q: Is the online course form a registration (place reserved) or an expression of interest, and what happens next? -> A: **Owner decision:** expression of interest (a waitlist). Confirmation: "We'll WhatsApp you when this course opens for enrolment, with dates and fees." No place is held and no timeframe is promised.
- Q: What do the Form B heading and button say? -> A: **Owner decision:** the visible button label and page heading must match the confirmation's promise, so both read "Join the waitlist" until courses exist. The label lives in one constant so the later courses feature can change it to "Register" once courses and dates are real. The /register address stays.

### Session 2026-11-03 (amendments, owner)

- **A1 (supersedes the /workshop?book=1 route):** there is no /workshop?book=1 page. Form A opens as a **modal dialog on /workshop**. Every "Book a workshop" / "Join a workshop" call to action site-wide links to **/workshop?book=1**, which opens the dialog on load. Closing the dialog removes the query parameter (the address becomes /workshop).
- **A2:** the dialog is accessible: focus is trapped inside it, Esc closes it, focus returns to whatever opened it (or to the page's "Book a workshop" button when it was opened on page load from another page), the page behind does not scroll, and it is fully usable at 360px.
- **A3:** city is fixed to **Karachi**. It is shown as read-only text, not an input, comes from one configuration constant, and is stored on every workshop submission.
- **A4:** Form A roles are only **School** and **Teacher**. "Student group" is removed.
- **A5 (scope):** this feature includes only the dialog form, its submission/email/WhatsApp flow, and a **minimal /workshop page** (headline, short intro, "Book a workshop" button). The full workshop page (curriculum, gallery, testimonial videos) is a separate later feature.
- **A6:** the dialog is a small client leaf; the /workshop page itself stays a Server Component.
- **A7:** email is **optional on Form A** (phone is the required way to reach the visitor). Required on Form A: role, full name, phone, organization, participants, consent. Email stays required on Form B. If an email is given it must be valid.
- **A8:** the dialog is a **centred dialog from 640px up** and a **full-screen sheet below 640px**.
- **A9:** Form A has **two steps**. Step 1: role, name, phone, email. Step 2: organization, city (read-only), participants, preferred month, message, consent. Step 1 is validated before "Next". Going Back keeps everything typed. Without JavaScript both steps show at once.
- **A10:** each step fits the viewport **without scrolling** at 1280x720 (desktop) and 360x640 (mobile), keyboard closed: tight field gaps, 12–13px labels, reduced padding.
- **A11:** two fields per row from 640px up; below 640px one per row, except participants + preferred month, which stay paired. Input text is never below 16px at any width (prevents iOS zoom).
- **A12:** the Back/Next/Send buttons stay at the bottom of the dialog. The dialog is never taller than 100svh and its content scrolls internally only as a fallback.
- **A13:** the message is a 2-row text box that grows with the text up to 4 rows and then scrolls.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A school or teacher requests a workshop (Priority: P1)

A school coordinator or teacher taps "Join a workshop" (or "Explore programs") anywhere on the site, lands on /workshop with the booking dialog already open, fills in a short form on their phone, and submits it. They immediately see a confirmation that tells them exactly what happens next and roughly when, with a "Message us on WhatsApp" button that opens a chat with a ready-written message. At the same moment, the owner receives an email with the request.

**Why this priority**: The pilot workshop depends on this. It is the main way the business gets bookings, and every primary call to action on the site points here.

**Independent Test**: Open /workshop?book=1 on a 390px-wide phone viewport, submit a complete valid request, and confirm (a) the confirmation appears, (b) the record is stored with status "new", and (c) the owner's notification email arrives.

**Acceptance Scenarios**:

1. **Given** a visitor on /workshop?book=1, **When** they fill every required field correctly, tick consent and submit, **Then** the request is saved, the owner is emailed, and the visitor sees the confirmation with the WhatsApp button.
2. **Given** a visitor who chooses role "school", **When** the form is shown, **Then** the same field set applies (role does not hide or add fields), and the city is shown as "Karachi" without an input.
6. **Given** the dialog is open, **When** the visitor presses Esc or the close button, **Then** the dialog closes, the address becomes /workshop, and focus returns to the control that opened it.
7. **Given** the dialog is open, **When** the visitor presses Tab repeatedly, **Then** focus cycles inside the dialog and the page behind does not scroll.
3. **Given** a visitor who leaves "preferred month" and "message" empty, **When** they submit an otherwise valid form, **Then** the submission succeeds.
4. **Given** a visitor who enters a local Pakistani number such as "0300 1234567", **When** they submit, **Then** it is stored as "+923001234567".
5. **Given** the confirmation is shown, **When** the visitor taps "Message us on WhatsApp", **Then** WhatsApp opens with a prefilled message that matches what the confirmation said, and contains no personal details.

---

### User Story 2 - A visitor makes a mistake and fixes it without retyping (Priority: P1)

A visitor submits a form with something wrong (no consent, a phone number that is not a real number, a mistyped email, a missing required field). They see a clear message next to each problem, a screen reader announces the errors, and everything they typed is still there so they only fix what is wrong. If the problem is on our side (the save fails, the service is down), they see a plain, friendly error with no technical detail, and their input is still there to try again.

**Why this priority**: On a phone, losing a half-filled form is the most common reason people give up. A lost lead during the pilot is a lost workshop.

**Independent Test**: Submit each invalid case in turn and confirm the specific message appears, focus moves to the first error, the error is announced, and every typed value is preserved.

**Acceptance Scenarios**:

1. **Given** a filled form with consent unticked, **When** the visitor submits, **Then** submission is refused with a message on the consent field and all other values remain.
2. **Given** a phone value that cannot be a valid number, **When** the visitor submits, **Then** submission is refused with "Please enter a valid phone number, for example 0300 1234567 or +44 7700 900123" (or equivalent clear wording) and the typed value is kept for editing.
3. **Given** an email without a valid shape, **When** the visitor submits, **Then** submission is refused with a clear email message.
4. **Given** client-side checks are bypassed (scripts disabled or tampered request), **When** invalid data reaches the server, **Then** the server rejects it with the same messages; nothing invalid is ever stored.
5. **Given** the save fails for an internal reason, **When** the visitor submits, **Then** they see "Something went wrong on our side. Your details are still here. Please try again, or message us on WhatsApp." (or equivalent) with no internal detail, and their input is preserved.
6. **Given** a screen-reader user submits a form with errors, **When** the errors appear, **Then** a summary is announced and each field's error is linked to its input.

---

### User Story 3 - A learner registers interest in an online course (Priority: P2)

An individual learner finds the online course form from the footer or a course-related area, picks a course from the list (or "Not sure yet"), states their level and age group, and submits. If they choose "Under 18", a note asks a parent or guardian to submit the form. They see a confirmation describing what happens next, with a WhatsApp button.

**Why this priority**: Online courses are secondary to workshops for the pilot. The form must exist and work, but it must not compete with the workshop call to action.

**Independent Test**: Open /register, submit a valid registration, and confirm it is saved with type "course registration", the owner email arrives, and the confirmation appears. Switch the age group to "Under 18" and confirm the guardian note appears.

**Acceptance Scenarios**:

1. **Given** a visitor on /register, **When** they submit a valid form, **Then** it is saved as a course registration, the owner is emailed, and the confirmation is shown.
2. **Given** the course field, **When** the visitor opens it, **Then** it lists every course option plus "Not sure yet".
3. **Given** the visitor selects "Under 18", **When** the selection changes, **Then** the note "Please have a parent or guardian submit this form." appears next to the age group field and is announced to screen readers; it disappears if they switch back.
4. **Given** the visitor selects "Under 18", **When** they submit, **Then** submission is still allowed (the note is guidance, not a block).
5. **Given** the /register page, **When** it is rendered, **Then** its page heading and submit button both read "Join the waitlist", and the confirmation says "We'll WhatsApp you when this course opens for enrolment, with dates and fees." Nothing on the page implies a place is held.

---

### User Story 4 - Visitors reach the forms from wherever they are (Priority: P2)

Every existing "Join a workshop" and "Explore programs" call to action (hero, header, mobile menu, Programs page, home page final section) takes the visitor to /workshop?book=1. The online course form is reachable from the footer and from course-related areas, but not from the header. The Contact page offers both forms.

**Why this priority**: Without working entry points the forms receive no traffic. The CTAs currently point at the Contact page or at nothing.

**Independent Test**: Click every listed CTA at 1440px and 390px and confirm it lands on /workshop?book=1; confirm the footer, the Courses page and the Contact page link to /register; confirm the header does not.

**Acceptance Scenarios**:

1. **Given** any listed workshop CTA, **When** it is activated, **Then** the visitor lands on /workshop?book=1.
2. **Given** the CTAs before and after this feature, **When** compared visually, **Then** they look identical (only the destination changed).
3. **Given** the header and mobile menu, **When** inspected, **Then** neither links to /register.
4. **Given** the footer, the Courses page and the Contact page, **When** inspected, **Then** each links to /register; the Contact page also links to /workshop?book=1.

---

### User Story 5 - Spam and abuse are kept out (Priority: P3)

Automated bots that fill every field, and anyone submitting repeatedly, are stopped without bothering real visitors.

**Why this priority**: Protects the owner's inbox and data quality, but the forms deliver value without it on day one.

**Independent Test**: Submit with the hidden trap field filled and confirm nothing is stored or emailed; submit six valid forms from one address within an hour and confirm the sixth is refused with a clear message.

**Acceptance Scenarios**:

1. **Given** the hidden trap field is filled, **When** the form is submitted, **Then** nothing is stored and no email is sent, and the response gives a bot no signal that it was caught.
2. **Given** five submissions from the same network address within the last hour, **When** a sixth arrives, **Then** it is refused with "You've sent several requests in a short time. Please try again in an hour, or message us on WhatsApp." (or equivalent), and the typed values are kept.
3. **Given** the trap field, **When** a keyboard or screen-reader user moves through the form, **Then** they never reach it.

### Edge Cases

- **Owner email fails but the save succeeds**: the visitor still sees success (their request is safe); the record is kept and the failed notification is recorded so it can be resent. No personal data appears in the failure record or logs.
- **Save fails**: no email is sent for a record that does not exist; the visitor sees the friendly failure message and keeps their input.
- **Double submit** (double tap, slow network): the submit button is disabled while sending and shows a sending state; a repeated identical submission within a short window creates one record, not two.
- **Slow or flaky mobile connection**: the form works without client-side scripts (plain submission), so a slow script load never blocks submitting.
- **Phone formats**: local ("03001234567", "0300-1234567"), with country code ("+92 300 1234567", "923001234567", "0092…"), and foreign numbers with a "+" prefix are accepted when valid and stored in international format; landlines are accepted if valid.
- **Participant count**: must be a whole number from 1 to 1000; zero, negatives, decimals and text are rejected with a clear message.
- **Preferred month**: optional; offered as a choice of the current month and the following 11 months, plus "Not sure yet" (empty).
- **Very long input**: free text is capped (name 100, organization 150, message 1000 characters) with a visible counter or clear message; over-long input is rejected, not silently cut.
- **Leading/trailing spaces and odd casing**: trimmed; email stored lower-case.
- **Course list changes later**: a stored registration keeps the course name as it was when submitted, so later list changes do not rewrite history.
- **WhatsApp number not configured**: the confirmation still states the next step; the WhatsApp button is hidden rather than broken.
- **Rate limit reached by a shared network** (a school's single connection): the refusal message offers WhatsApp as an alternative so a real school is never stuck.

## Requirements *(mandatory)*

### Functional Requirements

**Form A: Book a Workshop (/workshop?book=1)**

- **FR-001**: The site MUST provide Form A as a modal dialog on /workshop, opened by /workshop?book=1, with exactly these fields: role (school / teacher; required), full name (required), phone (required), email (optional), organization name (required), approximate number of participants (required), preferred month (optional), message (optional), consent (required checkbox). City is shown as read-only "Karachi" and is not an input.
- **FR-001a**: The city MUST come from a single configuration constant and MUST be set by the server on every workshop submission (any city value sent by the browser is ignored).
- **FR-001b**: The dialog MUST trap focus, close on Esc and on its close control, return focus to the control that opened it (falling back to the page's "Book a workshop" button), lock page scroll while open, label itself with its heading, and be usable from 360px. Closing MUST remove the `book` query parameter. With scripts unavailable, /workshop?book=1 MUST still show the form and the close control MUST be a working link to /workshop.
- **FR-001c**: /workshop MUST be a minimal Server Component page: one H1 headline, a short intro and a "Book a workshop" button linking to /workshop?book=1. No other workshop content in this feature.
- **FR-002**: The submit button label MUST describe sending a request (it must not imply the workshop is already booked), and the confirmation MUST use the same framing.

**Form B: Online course registration (/register)**

- **FR-003**: The site MUST provide an online course registration page at /register with exactly these fields: full name, phone, email, interested course, current level (beginner / some experience), age group (under 18 / 18 or over), message (optional), consent (required checkbox). All except message are required.
- **FR-004**: The course options MUST be read through a single course-options function, backed for now by one hardcoded list in one file, with "Not sure yet" always appended. Nothing outside that function may know or depend on where the list comes from.
- **FR-005**: When age group is "under 18", the form MUST show "Please have a parent or guardian submit this form." beside the age group field, announced to assistive technology. With scripts unavailable, the note MUST be shown as static guidance under the age group field.
- **FR-006**: Form B's page heading and submit button label MUST both read "Join the waitlist", taken from a single shared label constant, so the later courses feature can change it to "Register" in one place. The /register address does not change. Any other link to this form that names the action (footer, Courses page, Contact page) MUST use the same constant.

**Validation (both forms)**

- **FR-007**: Every rule MUST be enforced on the server, which is the source of truth. The same rules MUST be mirrored on the client for instant feedback, from one shared definition so the two cannot drift.
- **FR-008**: Phone numbers MUST be normalised to international format (E.164), assuming Pakistan (+92) when no country code is given. Numbers that cannot be valid MUST be rejected with a clear message that includes an example of an accepted format.
- **FR-009**: Emails MUST be checked for a valid shape and stored trimmed and lower-case.
- **FR-010**: Submission MUST be refused unless consent is ticked.
- **FR-011**: Fields not listed in FR-001 or FR-003 MUST be ignored and never stored (the honeypot is checked, then discarded).

**Spam protection**

- **FR-012**: Each form MUST include a hidden honeypot field that real visitors cannot see or reach by keyboard or screen reader. A submission with it filled MUST NOT be stored or emailed, and MUST receive a response that looks like success.
- **FR-013**: Each network address MUST be limited to 5 submissions per rolling hour across both forms. Further submissions MUST be refused with a clear, friendly message that keeps the visitor's input and offers WhatsApp. The network address MUST NOT be stored with the submission.

**On success**

- **FR-014**: A valid submission MUST be saved before anything else happens, and then the owner MUST be sent an email notification containing the submission type, all submitted fields and the time received.
- **FR-015**: The visitor MUST then see a confirmation that states what actually happens next and roughly when. Vague wording such as "we'll be in touch" is not acceptable. Agreed wording:
  - Workshop: "We'll call or WhatsApp you within 1 working day to agree a date and format."
  - Course (waitlist): "We'll WhatsApp you when this course opens for enrolment, with dates and fees."
- **FR-016**: The confirmation MUST include a "Message us on WhatsApp" button that opens a chat with a prefilled message. The prefilled message MUST match what the confirmation says (same next step, same form type) and MUST contain no personal data, because it travels in a link. It MAY include a short, non-personal reference code that is also shown on the confirmation so the owner can match the chat to the record.
- **FR-017**: The confirmation MUST be shown in place (inside the dialog for Form A, on the page for Form B) (no redirect carrying data in the address), and its heading MUST receive focus so screen-reader and keyboard users know the submission worked.

**On failure**

- **FR-018**: Any failure (validation, rate limit, internal) MUST keep every value the visitor typed, including when scripts are unavailable.
- **FR-019**: Error messages MUST be plain language, never expose internal details (no codes, stack traces, service names), and never repeat the visitor's personal data back inside the message.
- **FR-020**: If the owner email fails after a successful save, the visitor MUST still see success, and the failed notification MUST be recorded against the submission so it can be resent.

**Storage**

- **FR-021**: Each submission MUST be stored with: type (workshop booking / course registration), all its form fields, phone in normalised form, a status (new / contacted / booked / closed; defaults to "new"), an admin notes field (empty), a notification state (sent / failed), a short reference code, and created and updated timestamps.
- **FR-022**: Status and admin notes MUST exist but MUST NOT be shown or editable anywhere until the admin feature is built.

**Privacy**

- **FR-023**: A short privacy note MUST sit beside the consent checkbox, saying what is collected, why (to reply about the workshop or course), and that it is not shared or sold.
- **FR-024**: Personal data MUST NOT appear in logs, URLs, analytics events or error messages. Logs MAY record the submission type, reference code and outcome only.

**Entry points**

- **FR-025**: Every existing "Join a workshop" and "Explore programs" call to action, in the hero, header (desktop and mobile menu), Programs page and the home page's final section, MUST link to /workshop?book=1. Their appearance MUST NOT change.
- **FR-026**: /register MUST be linked from the footer and from course-related areas (at minimum the Courses page), and MUST NOT be linked from the header or mobile menu.
- **FR-027**: The Contact page MUST link to both /workshop?book=1 and /register, with the workshop link given more prominence.

**Experience and accessibility**

- **FR-028**: Both pages MUST be laid out mobile-first and be fully usable from 360px wide, with no horizontal scrolling and touch targets of at least 44px.
- **FR-029**: Every input MUST have a visible label tied to it; required fields MUST be marked; errors MUST be linked to their inputs and announced; on a failed submit focus MUST move to the first invalid field (or an error summary).
- **FR-030**: Both forms MUST be fully operable by keyboard alone with visible focus states, and grouped choices (role, level, age group) MUST be grouped and labelled as a set.
- **FR-031**: Both forms MUST be built from the site's existing field, button and card building blocks; new building blocks are added only where none exists (for example a choice list or checkbox), in the same visual style.
- **FR-032**: Pages MUST be rendered on the server by default; only the interactive part of each form (live validation, the under-18 note, the sending state) may run in the browser.
- **FR-033**: Each page MUST have exactly one H1 and its own page title and description.

### Key Entities

- **Submission (lead)**: One form submitted by a visitor. Attributes: type (workshop booking / course registration), reference code, the form's fields as listed (see below), status (new / contacted / booked / closed), admin notes, notification state (sent / failed), created at, updated at. No network address, device or tracking data.
  - Workshop booking fields: role (school / teacher), full name, phone (international format), email, organization name, city, approximate participants, preferred month (optional), message (optional), consent given (true) and the time it was given.
  - Course registration fields: full name, phone (international format), email, interested course (name as shown at submission, or "Not sure yet"), current level, age group, message (optional), consent given (true) and the time it was given.
- **Course option**: A course a visitor can pick on Form B. For now a fixed list in one place; later supplied by published courses. Attributes: identifier, display name.
- **Rate-limit counter**: Short-lived tally of submissions per network address in the last hour. Not linked to any submission and discarded after the window.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor on a mid-range phone can complete and send the workshop form in under 2 minutes, and the confirmation appears within 3 seconds of tapping submit on a typical 4G connection.
- **SC-002**: 100% of valid test submissions (both forms) are stored and produce an owner email that arrives within 1 minute.
- **SC-003**: 100% of the rejection paths (missing consent, invalid phone, invalid email, missing required field, honeypot filled, sixth submission in an hour) are refused, and in every visible case all typed values are preserved.
- **SC-004**: 0 occurrences of personal data in server logs, page addresses or error messages during the full verification run.
- **SC-005**: Every listed CTA (hero, header, mobile menu, Programs page, home final section) lands on /workshop?book=1, and side-by-side screenshots show no visual change to any of them.
- **SC-006**: Both form pages score 95+ for accessibility in an automated audit, and a keyboard-only run can complete each form and reach the confirmation.
- **SC-007**: Both form pages, their error states and their confirmations render without horizontal scroll at 360px, 390px and 1440px; screenshots are captured at 1440×900 and 390×844.
- **SC-008**: The site builds and lints clean, and no console errors appear on either page.

## Scope

**In scope**: the workshop dialog on a minimal /workshop page, the /register page, both forms, server validation with client mirroring, phone normalisation, honeypot, rate limiting, storage, owner email notification, confirmation with WhatsApp handoff, privacy note, CTA re-pointing, footer / Courses / Contact links.

**Out of scope**: the full /workshop page content (curriculum, gallery, testimonial videos; a later feature), cities other than Karachi, the admin area (viewing or changing status and notes), resending failed notifications through a screen (the record is kept; resending is manual or a later feature), confirmation emails to the visitor, payments, calendars or scheduling, publishing courses from a data store (later feature), analytics, translations, CAPTCHA.

## Dependencies

- **Data store**: the project does not yet have one. A place to store submissions is required.
- **Email delivery**: the project does not yet send email. A way to send the owner notification is required, plus the owner's notification address as a setting.
- Both are new dependencies under constitution Principle IX (no new paid services without asking). The choice, cost and free-tier limits MUST be put to the owner at the planning stage before anything is added.
- **WhatsApp number**: already configured as a site setting; reused for the confirmation button.

## Assumptions

- Organization name is required for every role; for a teacher it means their school. The label reads "School or organization name".
- City is fixed to Karachi (amendment A3); it is stored so later cities need no migration.
- "Approximate number of participants" is a whole number from 1 to 1000.
- Preferred month offers the current month plus the next 11, or blank.
- The rate limit is shared across both forms (5 per network address per rolling hour in total), which is the more conservative reading.
- "Under 18" does not block submission; it only shows the guardian note.
- A short non-personal reference code is generated per submission to link the WhatsApp chat to the record; it is not a collected field.
- Owner email is sent to a single address held in settings, never in code.
- Submissions are kept until the admin feature defines a retention policy; no automatic deletion in this feature.
- The privacy note wording is drafted in the site's voice and marked "DRAFT: owner to confirm before launch", like other draft copy in the project.
