# Feature Specification: Home Programs Section UI Enhancement

**Feature Branch**: `009-programs-section-ui`
**Created**: 2026-11-05
**Status**: Draft
**Input**: User description: "Home: Programs section UI enhancement. Keep existing data and links, change presentation only. Bento layout of five programs with a featured teacher workshop, status chips, facts, one CTA per card, subtle motion, reduced-motion support. Do not touch the hero or How it works."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand what Tareeq offers at a glance (Priority: P1)

A visitor scrolls to the Programs section on the home page. Within a few seconds they can see the five programs, which one is the main offer, who each is for, and whether it is bookable now, open for interest, or coming later.

**Why this priority**: This is the section's whole purpose; without it the redesign has no value.

**Independent Test**: Show the section to a first-time visitor for 5 seconds, then ask them to name the main offer, one other program, and which programs they can act on today.

**Acceptance Scenarios**:

1. **Given** the home page, **When** the Programs section is in view on desktop, **Then** the teacher workshop is visibly the largest card, and the other four are smaller and equal in weight to each other.
2. **Given** any card, **When** a visitor reads it, **Then** it shows a status chip, a title, an audience line, 2-3 short facts (format, duration, group size) and one call to action, in the same order on every card.
3. **Given** the five cards, **When** compared, **Then** "Booking now" and "Register interest" cards look active, and "Coming soon" cards look visibly quieter yet remain fully readable.

---

### User Story 2 - Take the right next step (Priority: P1)

A visitor decides what they want and acts directly from the card.

**Why this priority**: Converting interest into a booking, registration or question is the business outcome.

**Independent Test**: From the home page, activate each card's call to action and confirm the destination.

**Acceptance Scenarios**:

1. **Given** the teacher workshop card, **When** the visitor activates "Book a workshop", **Then** they land on the workshop page with booking opened (`/workshop?book=1`).
2. **Given** the school student workshops card, **When** the visitor activates its call to action, **Then** they land on the same booking destination.
3. **Given** the online courses card, **When** the visitor activates its call to action, **Then** they land on the registration page (`/register`).
4. **Given** a college & university or corporate teams card, **When** the visitor activates "Ask on WhatsApp", **Then** WhatsApp opens in a new tab with a message prefilled for that specific program.
5. **Given** WhatsApp contact is not configured, **When** the section renders, **Then** coming-soon cards show no broken link (the call to action is omitted or replaced by non-interactive text) and the layout stays intact.

---

### User Story 3 - Use the section on any device and input method (Priority: P2)

Visitors on phones, tablets, desktops, keyboards and screen readers get a clean, usable section.

**Why this priority**: Many visitors are on mobile; accessibility is a baseline site promise.

**Independent Test**: View at 360px, ~768px and ≥1024px widths; tab through with a keyboard; run a screen reader and an automated contrast check.

**Acceptance Scenarios**:

1. **Given** viewport ≥1024px, **Then** a bento grid shows the featured card spanning 2 columns × 2 rows beside the other four cards.
2. **Given** a tablet width, **Then** a 2-column grid shows the featured card at full width, followed by the rest.
3. **Given** a 360px width, **Then** a single column shows the featured card first, then Teacher, School students, Online courses, College & university, Corporate teams, with no horizontal scrolling.
4. **Given** keyboard navigation, **Then** focus moves through one stop per card (its call to action) in visual order, with a clearly visible focus indicator; the card as a whole is not a link.
5. **Given** a screen reader, **Then** each card is announced with its title, status, audience, facts and a call to action whose name makes the program clear.

---

### User Story 4 - Subtle, consistent motion (Priority: P3)

The section feels alive but calm, matching the rest of the site.

**Why this priority**: Polish; the section works without it.

**Independent Test**: Scroll to the section, hover and focus cards, then repeat with reduced-motion enabled.

**Acceptance Scenarios**:

1. **Given** the section scrolls into view for the first time, **Then** the cards rise and fade in with a short stagger, once only.
2. **Given** a pointer device, **When** the visitor hovers or focuses a card, **Then** it lifts 4px, its border warms toward saffron, and the saffron chevron in the call to action slides 4px right.
3. **Given** the featured card, **Then** a slow soft glow drifts across its navy surface.
4. **Given** the visitor prefers reduced motion, **Then** there is no entrance animation and no glow drift, and hover/focus only changes colour.
5. **Given** a touch-only device, **Then** the lift and chevron slide do not fire on tap.

### Edge Cases

- A program has fewer than 3 facts or an empty value (current teams data has empty duration and format): empty facts are omitted, never shown as blank rows; the card keeps the same structure.
- Very long titles or audience lines wrap without overflowing at 360px.
- Fewer or more than five programs supplied: the section still renders a sensible grid, with the featured item as the large card; with no programs the section is hidden.
- No program is marked featured: all cards render at normal size.
- JavaScript disabled or slow: all content and links are visible and usable; only the entrance animation is lost (cards must never stay invisible).
- Browser zoom to 200% and large text: no clipped or overlapping content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home Programs section MUST present five programs in this order: Teacher workshop, School student workshops (Grades 6-10), Online courses, College & university, Corporate teams.
- **FR-002**: The Teacher workshop MUST be flagged as featured, status "Booking now", call to action "Book a workshop" to `/workshop?book=1`.
- **FR-003**: School student workshops MUST have status "Booking now" with its call to action to `/workshop?book=1`.
- **FR-004**: Online courses MUST have status "Register interest" with its call to action to `/register`.
- **FR-005**: College & university and Corporate teams MUST have status "Coming soon" with the call to action "Ask on WhatsApp", opening WhatsApp with a message prefilled for that program.
- **FR-006**: Every card MUST contain, in the same order: status chip, title, audience line, 2-3 short facts (format, duration, group size), and one call to action.
- **FR-007**: At ≥1024px the featured card MUST span 2 columns and 2 rows on a navy surface with a saffron accent; other cards MUST be smaller, on paper or soft-blue surfaces.
- **FR-008**: Coming-soon cards MUST be visually quieter (muted, no strong colour) while text and interactive elements still meet WCAG AA contrast (4.5:1 text, 3:1 UI components and focus indicators).
- **FR-009**: At tablet widths the layout MUST be 2 columns with the featured card full width; at mobile widths a single column in the order in FR-001, with no horizontal scroll at 360px.
- **FR-010**: Only the call to action MUST be interactive; the card as a whole MUST NOT be a link. Each call to action MUST have an accessible name that identifies its program.
- **FR-011**: Entrance, hover/focus and glow motion MUST behave as in User Story 4, using only properties that do not affect layout so the page does not shift or jank.
- **FR-012**: Under reduced-motion preference, entrance animation and glow drift MUST be disabled and hover MUST change colour only.
- **FR-013**: The section MUST use existing brand colours, fonts (Sora headings, Inter body) and the existing section background; no new colours, no stock imagery, and only simple line icons or none.
- **FR-014**: All program content (names, audience, facts, status, call-to-action label and destination, featured flag, WhatsApp message) MUST come from typed content data separate from presentation, so a later admin feature can replace the data source without changing the components.
- **FR-015**: Existing copy and links MUST be kept where present; new or changed values MUST be placeholders in the program content file, clearly marked for owner review.
- **FR-016**: The hero, the How it works section, the `/programs` page and its presentation, admin editing, and any new forms MUST NOT be changed. The existing section heading, intro and "all programs" link MUST remain.
- **FR-017**: Client-side code MUST be limited to what motion requires; content and structure MUST render without it.

### Key Entities

- **Program (home card)**: a titled offer with an audience line, up to three short facts (format, duration, group size), a status (Booking now / Register interest / Coming soon), an optional featured flag, a display order, and one call to action.
- **Call to action**: a label plus either an internal destination or a WhatsApp enquiry with a program-specific prefilled message.
- **Status**: the visitor-facing availability of a program, which also drives how active or quiet the card looks.

## Assumptions

- The content source is `src/content/data/programs.ts` (the brief's `src/content/programs.ts` does not exist). It currently holds three programs with only two statuses (available, coming soon) and is shared with the `/programs` page; the new fields and the two extra programs must not change what `/programs` displays.
- Existing teacher/student/teams copy is kept where it fits (e.g. teacher audience and "Half a day"). "School student workshops (Grades 6-10)" is the home-card audience per the brief; the owner confirms it against the existing "School and college students". All other facts (group size, online courses, college & university, corporate) are placeholders pending owner review.
- WhatsApp links use the existing site WhatsApp helper; prefilled messages contain no personal data.
- "Register interest" uses an active (non-quiet) look because the visitor can act now.
- No-horizontal-scroll, contrast and motion are verified manually plus the Lighthouse/axe checks used on previous features.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a 5-second test, at least 4 of 5 first-time visitors can name the main offer and at least one program they can act on today.
- **SC-002**: Every call to action reaches its correct destination on the first activation (5 of 5 cards, including WhatsApp with the right prefilled message).
- **SC-003**: No horizontal scrolling at 360px, and no clipped content at 200% zoom.
- **SC-004**: All text and interactive elements, including quiet coming-soon cards, pass AA contrast; the automated accessibility check reports zero new violations on the home page.
- **SC-005**: Keyboard users reach each of the five calls to action with exactly one tab stop per card and a visible focus indicator.
- **SC-006**: With reduced motion on, no animated movement occurs in the section; with it off, the entrance plays once per page view.
- **SC-007**: Home page mobile performance score does not drop by more than 3 points versus the feature 008 baseline, and the section causes no visible layout shift.
- **SC-008**: Replacing the program data with a different set of valid entries changes the rendered cards without any presentation changes.
