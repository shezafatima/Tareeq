# Feature Specification: Pricing, Certificate Section and Announcement Bar (admin-managed)

**Feature Branch**: `034-pricing-certificate-announcement`
**Created**: 2026-11-12
**Status**: Draft
**Input**: User description: "Pricing, certificate section and announcement bar (admin-managed) — structured display-only pricing for programs and courses with a shared price block; an admin-managed certificate section on the home page with a sample placeholder; an admin-managed, schedulable, dismissible announcement bar above the navbar. Server-side session checks on every admin action, no new dependencies, mobile at 360px. Out of scope: payments, coupon codes, per-student certificates, multiple simultaneous announcements."

## Clarifications

### Session 2026-11-12

- Q: Whose price does the workshop page show? → A: Both workshop programs, picked by audience ("teachers" and "school-students") among published programs, not by slug. Each entry is labelled with the program title and links to its page. A program in "contact" mode shows "Contact us for pricing". If neither has pricing data, the block is not rendered.

### Planning decisions 2026-11-12

- Q: Server-read dismissal cookie (all public pages dynamic) or an inline script before paint (pages stay static)? → A: Inline script before paint.
- Q: May the signed-off hero's two viewport-fit expressions subtract the bar's height (Principle VIII)? → A: Approved, those two expressions only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitors see clear prices on programs and courses (Priority: P1)

A parent, teacher or school coordinator browsing programs and courses sees a consistent, readable price everywhere the offering appears: "Rs 5,000", an optional unit note ("per participant"), and when there is a discount, the old price struck through next to the new one with an offer label chip. Offerings that are quoted individually show "Contact us for pricing"; free ones show "Free". An administrator sets this per program and per course in the existing edit forms and sees the result in the live preview before saving.

**Why this priority**: Price is the most common question before a booking enquiry; showing it clearly reduces friction and repetitive contact requests. It touches the most pages and carries the most validation rules.

**Independent Test**: In the admin, set a course to "show" with amount 5000, original 7000, offer label "Launch offer", unit "per participant"; save; confirm the course card and course detail page (booking card and mobile bar) show "~~Rs 7,000~~ Rs 5,000 per participant" with a "Launch offer" chip. Set a program to "contact" and confirm "Contact us for pricing". Open an untouched record and confirm it renders exactly as before.

**Acceptance Scenarios**:

1. **Given** a program with pricing mode "show" and amount 5000, **When** a visitor views the program panel, the program detail page booking card or its mobile bar, **Then** each shows "Rs 5,000".
2. **Given** a course with amount 5000 and original amount 7000 and offer label "Launch offer", **When** a visitor views the course card or detail page, **Then** "Rs 7,000" appears struck through, "Rs 5,000" appears as the current price, and "Launch offer" appears as a saffron chip.
3. **Given** a record with mode "contact", **When** displayed, **Then** the price block reads "Contact us for pricing" and no amount is shown.
4. **Given** a record with mode "free", **When** displayed, **Then** the price block reads "Free".
5. **Given** a record that has never had structured pricing saved, **When** displayed, **Then** its existing price text renders exactly as it does today.
6. **Given** an admin editing a program or course, **When** mode is "contact" or "free", **Then** the amount, original amount, unit note, offer label and offer-ends fields are hidden; **When** mode is "show", **Then** they appear.
7. **Given** an admin enters amount 0, a negative amount, or an original amount less than or equal to the amount, **When** saving, **Then** the save is rejected with a field-level message and nothing is stored.
8. **Given** an admin changes any pricing field, **When** looking at the live preview, **Then** the preview's price block updates to match.
9. **Given** a published teachers program priced "show" Rs 8,000 and a published school-students program in "contact" mode, **When** a visitor opens the workshop page, **Then** two labelled entries appear, each titled with its program name and linking to that program's page: one showing "Rs 8,000", the other "Contact us for pricing".
10. **Given** neither the teachers nor the school-students program has structured pricing, **When** a visitor opens the workshop page, **Then** no price block is rendered and the page looks as it does today.

---

### User Story 2 - Visitors can dismiss a timely announcement (Priority: P2)

An administrator publishes a short announcement ("Summer batch registrations open — Apply now") with an optional link, a colour style, an optional start and end time in Pakistan time, and a choice of whether visitors may dismiss it. Visitors see a slim bar above the navigation on every public page while it is active. A visitor who closes it does not see it again on later visits, until the administrator edits it or publishes a new one.

**Why this priority**: A site-wide, time-boxed message drives enrolment for batches and events, and is the only one of the three items that affects every public page's layout.

**Independent Test**: Enable an announcement with a link and a window covering now; load several public pages and confirm the bar is present above the navigation and absent on admin pages. Dismiss it, reload, confirm it stays hidden with no flash. Edit the text, reload, confirm it reappears.

**Acceptance Scenarios**:

1. **Given** an enabled announcement with non-empty text and no date window, **When** a visitor loads any public page, **Then** the bar appears above the navigation in the chosen style.
2. **Given** an announcement whose start time is in the future or whose end time has passed (Asia/Karachi), **When** a visitor loads a page, **Then** no bar is visible and it takes up no space, with no flash and no layout shift.
3. **Given** the announcement is disabled or its text is empty, **When** any page loads, **Then** no bar is in the page at all and no space is reserved for it.
4. **Given** any admin page, **When** it loads, **Then** no announcement bar is rendered regardless of settings.
5. **Given** a dismissible announcement, **When** the visitor presses the close button, **Then** the bar disappears immediately and stays hidden on subsequent page loads with no visible flash or layout shift.
6. **Given** a visitor dismissed an announcement, **When** an admin saves any change to it, **Then** the bar is shown again to that visitor on the next page load.
7. **Given** a non-dismissible announcement, **When** displayed, **Then** no close button is shown.
8. **Given** the bar is visible, **When** a visitor scrolls, opens a page whose hero fits the viewport, or views a page with a mobile sticky bar, **Then** the sticky header, hero and mobile bars do not overlap the announcement and the hero still fits the screen.
9. **Given** a 360px-wide screen and a 120-character announcement, **When** displayed, **Then** the text wraps to no more than 2 lines and nothing scrolls horizontally.
10. **Given** an admin enters text over 120 characters, a link URL that is neither an internal path nor an https address, a link URL without a label (or label without URL), or an end time not after the start time, **When** saving, **Then** the save is rejected with a field-level message.

---

### User Story 3 - Visitors learn about the completion certificate (Priority: P3)

On the home page, just before the final call to action, visitors see a section explaining that participants receive a Tareeq certificate of completion: a heading, a short paragraph, up to four bullet points and a picture of the certificate in a tilted frame with a soft glow that straightens on hover. An administrator manages this text and image, or turns the section off entirely. Until a real certificate image is uploaded, a built-in sample certificate in brand style is shown, clearly marked "Sample".

**Why this priority**: It builds trust and perceived value but is a single, self-contained home section with no effect on booking flows.

**Independent Test**: With nothing configured, open the home page and confirm the section shows default copy and the sample certificate with a visible "Sample" ribbon, placed directly before the final CTA. Upload an image with alt text, edit heading and bullets, save, and confirm the home page reflects it. Turn the toggle off and confirm the section is gone.

**Acceptance Scenarios**:

1. **Given** no certificate settings have been saved, **When** a visitor opens the home page, **Then** the section shows default copy describing a "Tareeq certificate of completion" and the built-in sample certificate with a visible "Sample" ribbon.
2. **Given** an admin uploads a certificate image with alt text and saves, **When** the home page reloads, **Then** the uploaded image appears in the tilted frame with that alt text and no "Sample" ribbon.
3. **Given** the enabled toggle is off, **When** the home page loads, **Then** the section is not rendered at all and the final CTA follows the preceding section directly.
4. **Given** a pointer device, **When** a visitor hovers the certificate, **Then** the frame straightens; **Given** reduced motion is preferred, **Then** the frame is static.
5. **Given** an admin is editing bullets, **When** four bullets exist, **Then** adding another is not possible; empty bullets are not saved.
6. **Given** an image is uploaded without alt text, **When** saving, **Then** the save is rejected with a message asking for alt text.

---

### Edge Cases

- A "show" record whose original amount equals or is below the amount cannot be saved; existing stored data that somehow violates this renders the current price only, without the strike-through.
- Large amounts render with thousands separators (e.g. "Rs 125,000"); amounts are whole rupees.
- Offer label and offer-ends text without an original amount are still shown (offer label as chip, offer-ends text beneath the price).
- Switching a record from "show" to "contact" keeps the hidden amount values out of the public display.
- Workshop page: only one of the two audience programs has structured pricing, or only one is published → only that entry is shown. A program is unpublished or its audience changes → it drops out of the workshop block on the next load.
- Workshop page: two published programs share the "teachers" audience → the first in display order is shown.
- The announcement's start time set with no end time means "from then onwards"; an end time with no start means "until then".
- The visitor's dismissal cookie is unreadable or from an older announcement → the bar is shown.
- The announcement is edited while a visitor is mid-session → the visitor sees the new version on their next page load.
- Admin data cannot be read (database unavailable) → admin pages show the existing "unavailable" notice; public pages render without the bar and with the certificate defaults; program and course pages keep their existing unavailable behaviour, and the workshop page omits the prices block.
- A certificate image upload fails → existing image uploader error handling applies; the section keeps the previous image or the sample.
- An unauthenticated request to any new or changed admin action is rejected server-side and changes nothing.

## Requirements *(mandatory)*

### Functional Requirements

**Pricing**

- **FR-001**: Programs and courses MUST each support optional structured pricing with: mode (show, contact, free), amount in whole Pakistani rupees, optional original amount, optional unit note, optional offer label, optional offer-ends text.
- **FR-002**: Records without structured pricing MUST render their existing price text exactly as today; no data migration is performed.
- **FR-003**: The program and course admin forms MUST include a Pricing section; the amount-related fields MUST be visible only when mode is "show".
- **FR-004**: On save, the system MUST reject (server-side, with field-level messages) an amount that is missing, zero or negative in "show" mode, and an original amount that is not greater than the amount.
- **FR-005**: Unit note, offer label and offer-ends text MUST have sensible length limits (unit note and offer label ≤ 40 characters, offer-ends text ≤ 60 characters).
- **FR-006**: The admin live preview MUST show the price block exactly as the public site will.
- **FR-007**: A single shared price display MUST be used on program panels, course cards, program and course detail pages (booking card and mobile bar), and the workshop page, so the same data looks the same everywhere.
- **FR-008**: Amounts MUST be formatted as "Rs" followed by the amount with thousands separators (e.g. "Rs 5,000"). When an original amount greater than the amount exists, it MUST be shown struck through before the current price, and its meaning MUST be available to screen readers (e.g. "Original price Rs 7,000, now Rs 5,000").
- **FR-009**: The offer label MUST appear as a saffron chip; mode "contact" MUST read "Contact us for pricing"; mode "free" MUST read "Free".
- **FR-010**: The workshop page MUST show a workshop price block listing the published programs whose audience is "teachers" and "school-students" (chosen by audience, never by a fixed slug; if several published programs share an audience, the first in display order is used). Each entry MUST be labelled with its program title, link to that program's page, and show the shared price display (amount, "Contact us for pricing" or "Free"). A program without structured pricing is omitted from the block; if neither program has structured pricing (or neither is published), the block MUST NOT be rendered at all.
- **FR-011**: Prices are display-only; no checkout, payment or coupon behaviour is introduced.

**Certificate section**

- **FR-012**: The home page MUST include a certificate section immediately before the final call to action, showing a heading, short text, bullets and a certificate image in a tilted frame with a soft glow; hover straightens the frame; under reduced-motion preference it is static.
- **FR-013**: Admins MUST manage at a dedicated certificate settings page: enabled toggle, heading (required when enabled, ≤ 80 characters), text (≤ 300 characters), 1–4 bullets (add/remove, each ≤ 100 characters), and certificate image with required alt text using the existing image uploader.
- **FR-014**: Until an image is uploaded, the section MUST show a built-in sample certificate in brand style with a visible "Sample" ribbon.
- **FR-015**: Default copy MUST describe a "Tareeq certificate of completion" with 3 bullets and MUST NOT state or imply government, board or university accreditation.
- **FR-016**: When the toggle is off, the section MUST NOT be rendered at all.
- **FR-017**: Saving certificate settings MUST refresh the cached certificate content so the change appears on the next home page load.

**Announcement bar**

- **FR-018**: Admins MUST manage at a dedicated announcement settings page: enabled toggle, text (≤ 120 characters), optional link (label ≤ 30 characters and URL, both or neither; URL is an internal path starting with "/" or an https address), style (saffron or navy), optional start and end date-time interpreted in Asia/Karachi (end must be after start), and a dismissible toggle.
- **FR-019**: A slim announcement bar MUST render above the navigation on every public page. It is part of the server-rendered HTML, so no extra request is needed, and it is visible only when enabled, text is non-empty and the current time is within the date window. Public pages stay statically cached, so the window is also checked in the visitor's browser before first paint (see plan research R11).
- **FR-020**: The bar MUST never render on admin pages.
- **FR-021**: When dismissible, a close button MUST hide the bar and remember the dismissal in a cookie tied to the announcement's last-updated time. On later page loads the dismissal MUST be applied before first paint, so a dismissed bar causes no flash or layout shift. Any later save of the announcement MUST cause it to show again. (Decided 2026-11-12: the cookie is checked by an inline script before paint, not by the server, so public pages stay static.)
- **FR-022**: The bar's height MUST be accounted for by the sticky header, viewport-fitting heroes and mobile sticky bars so nothing overlaps and the hero still fits the screen with the bar visible; with no bar, layout MUST be identical to today.
- **FR-023**: On a 360px screen, text MUST wrap to at most 2 lines and nothing may scroll horizontally.
- **FR-024**: The bar MUST be a labelled region, meet WCAG AA contrast in both styles (saffron uses dark text), and its close button MUST have an accessible name and a touch target of at least 44×44px.
- **FR-025**: Saving announcement settings MUST refresh the cached announcement so the change appears on the next page load.
- **FR-026**: Only one announcement exists at a time.

**Cross-cutting**

- **FR-027**: Every new or changed admin action MUST verify the admin session on the server and reject unauthenticated requests without changing data; the existing unauthenticated-action test MUST be extended to cover them.
- **FR-028**: The Settings page MUST link to the certificate and announcement settings pages, alongside the existing "Site images" link.
- **FR-029**: New admin screens MUST follow existing admin form patterns (labels, inline errors, save feedback, unavailable notice).
- **FR-030**: No new third-party dependencies are introduced.
- **FR-031**: All new and changed public and admin UI MUST work at 360px width without horizontal scrolling.

### Key Entities

- **Pricing** (part of a Program and of a Course): mode, amount, original amount, unit note, offer label, offer-ends text. Optional; absence means "use existing price text".
- **Certificate settings** (single site-wide record): enabled, heading, text, bullets (≤ 4), image reference with alt text, last updated.
- **Announcement** (single site-wide record): enabled, text, link label, link URL, style, starts at, ends at, dismissible, last updated (used as the dismissal key).
- **Announcement dismissal** (per visitor, stored in the visitor's browser): the last-updated value of the announcement they dismissed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can set or change a program's or course's price, and see it reflected in the preview, in under 1 minute.
- **SC-002**: 100% of program and course records that have no structured pricing render visually unchanged compared with before the feature.
- **SC-003**: The same pricing data renders identically (text and discount treatment) on every surface listed in FR-007.
- **SC-004**: With an active announcement, 0 overlaps between the bar and the header, hero or mobile sticky bars across all public pages at 360px, 768px and 1280px widths, and the home hero still fits a 360×640 screen.
- **SC-005**: After dismissal, the bar stays hidden across reloads with no visible flash; after an admin edit, it reappears on the next load (verified in 100% of manual test runs).
- **SC-006**: Announcement and certificate changes are visible on the public site on the first page load after saving.
- **SC-007**: Both announcement styles and the certificate section pass WCAG AA contrast checks; all new interactive elements are keyboard-operable with visible focus.
- **SC-008**: 100% of new and changed admin actions reject unauthenticated requests in the automated test.

## Assumptions

- Amounts are whole rupees (no paisa); currency is always PKR.
- Offer-ends text is free text (e.g. "Ends 30 November") shown as-is; it does not automatically hide the offer.
- The existing price text field remains editable as the fallback and is shown only when no structured pricing is saved.
- Program panels on /programs gain a price line where they do not have one today. The home page's program cards are unchanged.
- Amounts are limited to 10,000,000 rupees, and announcement link URLs to 300 characters.
- Date-times are entered and shown in Asia/Karachi regardless of the admin's device timezone.
- The dismissal cookie is a functional cookie (no consent banner change needed) and lasts up to 1 year.
- Default certificate copy and the built-in sample image ship with the site and are used until the admin saves settings.

## Out of Scope

- Payments, checkout, coupon codes.
- Per-student certificates, certificate generation or verification.
- Multiple simultaneous announcements or per-page targeting.
