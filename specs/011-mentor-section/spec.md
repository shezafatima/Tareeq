# Feature Specification: Home "Meet your mentor" section

**Feature Branch**: `011-mentor-section`
**Created**: 2026-11-05
**Status**: Draft
**Input**: User description: "Home: 'Meet your mentor' section. Build trust by showing the real person behind Tareeq: who she is, why she teaches, and proof she is credible. One large rounded card with her photo, name and role, a short bio, a pull quote, an optional credentials row and data-driven social link cards (YouTube 1.7k subscribers, LinkedIn 2k+ followers). Entrance and hover motion, reduced-motion support, content as typed data. Real copy and URLs are supplied by the owner; use clearly marked placeholders and invent no facts or numbers."

## Context (existing state, read before writing this spec)

- The home page already has the hero, How it works, Why Tareeq, Programs and Who it's for sections. Cards across these sections share a rounded, softly tinted look with a saffron accent.
- Content for home sections lives as typed data separate from the display, so a later admin feature can replace it.
- The founder photo exists in the public assets as `founder.jpeg` (the brief said `founder.png`; the existing file is used and the path is the only difference).
- Features 009 (Programs) and 010 (Who it's for) are still uncommitted on the working tree at the time of writing. This feature was started on top of them at the owner's instruction.
- Out of bounds: the hero, How it works, Programs and Who it's for sections must not change.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Know who is behind Tareeq (Priority: P1)

A visitor scrolling the home page reaches a section headed "Meet your mentor" and sees a real photo of the founder, her name, her role, and a short bio saying what she does with AI, who she has taught and why she cares about practical AI. The visitor leaves the section feeling there is a real, credible person behind the programmes.

**Why this priority**: Trust is the whole purpose of the section. Without the person, photo and story it has no value.

**Independent Test**: Show the section to someone for 10 seconds, then ask who runs Tareeq and what she does. They name her and describe her role.

**Acceptance Scenarios**:

1. **Given** the home page, **When** the section is in view, **Then** it shows the eyebrow "Your mentor", the heading "Meet your mentor", the founder photo, the line "Hi, I'm Sheza Fatima", a role line starting "Founder of Tareeq" and a two-paragraph bio.
2. **Given** the photo, **When** it is read by assistive technology, **Then** its description is "Sheza Fatima, founder of Tareeq".
3. **Given** a pull quote is provided in the content, **When** the section renders, **Then** it appears as one sentence in a soft-tinted block with a saffron left border.

---

### User Story 2 - Check she is real and reachable (Priority: P1)

A visitor who wants proof opens her YouTube channel or LinkedIn profile from compact link cards in the section. Each card shows the platform icon, platform name, handle and a small follower count.

**Why this priority**: Verifiable public profiles are the strongest proof of credibility for a small brand, and are the section's only outbound action.

**Independent Test**: Activate each social card by mouse, touch and keyboard and confirm it opens the right profile in a new tab without leaving the site.

**Acceptance Scenarios**:

1. **Given** the section, **When** it renders, **Then** exactly three social cards appear, YouTube ("Sheza Fatima", 1.7k subscribers), LinkedIn (2k+ followers) and Instagram (@talksbysheza, no follower count supplied so none shown), and no TikTok or X card.
2. **Given** a social card, **When** activated, **Then** the profile opens in a new tab and the Tareeq page stays open.
3. **Given** a screen-reader user, **When** focusing a social card, **Then** its accessible name reads like "Sheza Fatima on YouTube, 1.7k subscribers", with no empty or duplicate links.
4. **Given** the follower counts, **When** read visually, **Then** they appear as small secondary text inside each card, not as large stats.
5. **Given** a platform is added to or removed from the content, **When** the page rebuilds, **Then** the grid shows exactly the platforms in the content with no other change needed.

---

### User Story 3 - See proof at a glance (Priority: P2)

A visitor who skims sees a short row of up to three small credential facts (for example years teaching, workshops run, students taught) that back up the bio.

**Why this priority**: Concrete proof strengthens trust, but only if it is real; the section works without it.

**Independent Test**: Provide 0, 1, 2 and 3 facts in the content and check the row appears only for 2 or 3.

**Acceptance Scenarios**:

1. **Given** two or three facts with real values, **When** the section renders, **Then** the row shows each fact as a small value-and-label pair.
2. **Given** fewer than two facts with real values, **When** the section renders, **Then** the whole row is hidden with no empty space left behind.
3. **Given** a fact that has no real value (still a placeholder), **When** the section renders, **Then** that fact is not shown.

---

### User Story 4 - Comfortable on any screen (Priority: P2)

The section adapts to the screen: photo beside the text on large screens, photo above the text on phones.

**Why this priority**: Most visitors are likely on phones, but the content works without the layout polish.

**Independent Test**: View the section at 360px, tablet and 1024px+ widths and check layout and overflow.

**Acceptance Scenarios**:

1. **Given** a desktop-width viewport, **When** the section renders, **Then** one large rounded card shows the photo on the left (about 40% of the card width, rounded, with a soft brand glow behind it) and the text on the right.
2. **Given** a phone-width viewport, **When** the section renders, **Then** the photo sits on top shown as a small 4:5 portrait (about 13rem wide, centred; face, laptop, mug and table in frame), the text below it, and the page has no horizontal scroll at 360px.
3. **Given** a viewport of 400px or wider, **When** the social cards render, **Then** they form two columns; **Given** a viewport narrower than 400px, **Then** they form one column.

---

### User Story 5 - Feels warm and alive (Priority: P3)

The section enters gently and responds to attention with small motion.

**Why this priority**: Polish only; the section is complete without it.

**Independent Test**: Scroll to the section, hover and focus the social cards, then repeat with reduced motion turned on.

**Acceptance Scenarios**:

1. **Given** the section scrolls into view for the first time, **When** it appears, **Then** the photo fades in while growing slightly from 97% size and the text blocks follow one after another, once only (scrolling away and back does not replay it).
2. **Given** the photo, **When** the section is visible, **Then** the glow behind it drifts slowly and subtly, never distracting from reading.
3. **Given** a pointer device or keyboard, **When** a social card is hovered or focused, **Then** it lifts 2px and its border warms toward saffron.
4. **Given** the visitor prefers reduced motion, **When** the section appears and cards are hovered or focused, **Then** there is no entrance movement, no glow drift and no lift; only the colour change happens.

---

### Edge Cases

- Owner has not yet supplied a URL for a platform: that platform's card is not shown, so no placeholder or dead link ever ships.
- All social platforms removed from content: the social grid is omitted with no empty space.
- Pull quote missing: the quote block is omitted.
- Bio has one paragraph instead of two, or longer text in future: text wraps, the card grows, nothing clips.
- Handle or platform name is long: it wraps or truncates inside the card without overflow at 360px.
- Photo slow to load or fails: the card keeps its reserved photo area and tinted background so the layout does not jump; the text stays fully usable.
- Browser zoom to 200% or large text: layout reflows to a single column without overlap.
- Touch-only device: no sticky hover state remains after tapping a card.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The section MUST show the eyebrow "Your mentor" and the heading "Meet your mentor".
- **FR-002**: The section MUST show the founder photo with the description "Sheza Fatima, founder of Tareeq", loaded only when near view, with reserved dimensions so the page does not shift.
- **FR-003**: The section MUST show the name line "Hi, I'm Sheza Fatima" and a role line of the form "Founder of Tareeq · [role]", where the role comes from owner-supplied content.
- **FR-004**: The section MUST show a bio of two short paragraphs covering what she does with AI, whom she has taught and why practical AI matters, using owner-supplied text.
- **FR-005**: The section MUST show one pull quote sentence about her teaching belief, in a soft-tinted block with a saffron left border, using owner-supplied text; it MUST be omitted if no quote is provided.
- **FR-006**: The section MUST show a credentials row of at most three facts, each rendered only when it has a real owner-supplied value; the whole row MUST be hidden when fewer than two real facts exist.
- **FR-007**: The section MUST show one compact link card per social platform in the content, each with the official platform icon, platform name, handle and follower count; the platforms are YouTube (handle "Sheza Fatima", 1.7k subscribers), LinkedIn (2k+ followers) and Instagram (@talksbysheza; added at the owner's request after the first draft excluded it; no follower count is shown because none was supplied). No other platform is shown.
- **FR-008**: Follower counts MUST appear as small secondary text inside each social card, not as prominent statistics.
- **FR-009**: A social platform without a real, owner-supplied URL MUST NOT be rendered. No placeholder URL may ship.
- **FR-010**: Social links MUST open in a new tab without giving the opened page access to the Tareeq tab, and each MUST have an accessible name of the form "Sheza Fatima on YouTube, 1.7k subscribers". Icons MUST be hidden from assistive technology.
- **FR-011**: All placeholder copy MUST be clearly marked as a placeholder in the content so it cannot be mistaken for real facts; no invented numbers, claims or credentials may appear in any shipped copy.
- **FR-012**: Layout MUST follow User Story 4: one large rounded card with photo left (about 40%) and text right on desktop; photo on top cropped to 4:5 with text below on phones; social cards in two columns, one column below 400px; no horizontal scroll at 360px.
- **FR-013**: The photo MUST have a soft brand-coloured glow behind it.
- **FR-014**: Entrance motion MUST follow User Story 5 (photo fade and scale from 97%, text stagger, once). The glow drift MUST be slow and subtle. Social cards MUST lift 2px and warm their border toward saffron on hover and keyboard focus.
- **FR-015**: With reduced motion requested, the section MUST show no entrance movement, no glow drift and no lift; hover and focus change colour only.
- **FR-016**: Every interactive element MUST show a visible focus indicator that meets contrast requirements and is not hidden by the lift.
- **FR-017**: All text MUST meet WCAG AA contrast (4.5:1 body text, 3:1 large text and icons). Brand colours, the heading and body fonts and the existing page background MUST be used; official platform colours are allowed only inside the small social icons.
- **FR-018**: Section content (copy, photo reference, credential facts, social platforms with URL, handle, follower text) MUST be typed data separate from the display, so adding or removing a platform or fact is a content change only.
- **FR-019**: The section MUST be rendered on the server; browser-side code may be used only where motion needs it, and the section MUST be fully readable and linkable without it.
- **FR-020**: The hero, How it works, Programs and Who it's for sections, and their content, MUST remain unchanged.
- **FR-021**: The section MUST NOT cause visible layout shift while loading or animating.
- **FR-022**: Out of scope: a full About / Our Way page and any admin editing UI.

### Key Entities

- **Mentor profile**: The person shown. Has a name line, role line, photo reference with description, two bio paragraphs, an optional pull quote and a list of credential facts. Every text field is marked real or placeholder.
- **Credential fact**: A short value and label (for example a number and what it counts). Shown only when real.
- **Social platform**: A public profile link. Has a platform id, display name, handle, follower text, URL and accessible label. Shown only when it has a real URL.

## Assumptions

- The owner supplies the following before the section ships, and the implementation phase asks for them first: YouTube URL, LinkedIn URL, real bio copy, role line, pull quote and credential facts. Until then, placeholders are clearly marked in the content, and platforms without a URL are not rendered.
- The follower figures given in the brief (1.7k YouTube subscribers, 2k+ LinkedIn followers) are owner-supplied facts and may be shown once the matching URLs are provided.
- The existing `founder.jpeg` is the photo; if the owner prefers a PNG, only the content reference changes.
- The section sits on the home page after Who it's for; the exact position among sections is confirmed in planning and must not alter existing sections.
- Placeholder bio/quote text displayed in development is acceptable, but a placeholder must never be published to production as if it were real.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a 10-second viewing, at least 4 of 5 test visitors can name the founder and her role afterwards.
- **SC-002**: A visitor can reach either social profile in one action (one click or tap) from the section, in a new tab, 100% of the time across mouse, touch and keyboard.
- **SC-003**: The page has no horizontal scroll at 360px, 768px and 1280px, and the layout does not shift while the section loads or animates.
- **SC-004**: Zero placeholder URLs, invented numbers or unmarked placeholder facts appear in the shipped section; a content review confirms every fact is owner-supplied.
- **SC-005**: With reduced motion on, nothing in the section moves; with it off, entrance plays once and no animation runs longer than a subtle, slow drift.
- **SC-006**: All text and icons pass WCAG AA contrast, and every interactive element is reachable by keyboard with a visible focus indicator.
- **SC-007**: Adding or removing a social platform or credential fact requires changing content only, verified by doing both with no display change.
