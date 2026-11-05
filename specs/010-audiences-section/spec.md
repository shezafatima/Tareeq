# Feature Specification: Home "Who it's for" section UI

**Feature Branch**: `010-audiences-section`
**Created**: 2026-11-05
**Status**: Draft
**Input**: User description: "Home: 'Who it's for' section UI. Let each visitor recognise themselves in under 3 seconds and see one concrete thing Tareeq changes for them, without repeating the Programs section. Five audiences (teachers, school students Grades 6-10, college & university students, online learners, corporate teams), each a card with a duotone icon in a tinted tile, an audience name, one line of benefit and a 'See how' link. Responsive layout, entrance and hover motion, reduced-motion support, content as typed data."

## Context (existing state, read before writing this spec)

- The home page already has a "Who it's for" section with four audience cards (teachers, school students, college students, professionals and teams), a saffron top bar and a generic icon tile. Cards are not links.
- Audience copy is already typed content that the future admin feature can replace; the section heading and intro come from the shared home copy.
- The Programs section (feature 009, still uncommitted) already says WHAT Tareeq offers. This section must say WHO it is for and WHAT CHANGES for them.
- Out of bounds: the hero, How it works and Programs sections must not change.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recognise myself fast (Priority: P1)

A visitor scrolling the home page reaches the section and sees five audience cards. Each shows a distinct icon, a clear audience name and one line describing the concrete change for that person. The visitor finds their own card within about 3 seconds without reading the others.

**Why this priority**: This is the whole purpose of the section. Without it the feature has no value.

**Independent Test**: Show the section to someone for 3 seconds on desktop and on a phone, then ask which card is theirs and what it promises. They answer correctly.

**Acceptance Scenarios**:

1. **Given** the home page, **When** the section is in view, **Then** exactly five cards appear in this order: Teachers, School students (Grades 6-10), College & university students, Online learners, Corporate teams.
2. **Given** any card, **When** read, **Then** it shows the audience name and a single benefit line, and the benefit line states a change for that audience, not a programme description.
3. **Given** the Programs section and this section side by side, **When** compared, **Then** no card repeats programme titles, facts (format, duration, group size) or status labels.

---

### User Story 2 - Go straight to the right next step (Priority: P1)

A visitor who recognises themselves selects the card (or its "See how" link) and lands on the matching next step.

**Why this priority**: Recognition without a path forward wastes the visit; it is the section's only conversion action.

**Independent Test**: Activate each card by mouse, touch and keyboard and confirm the destination.

**Acceptance Scenarios**:

1. **Given** the Teachers or School students card, **When** activated, **Then** the visitor goes to the workshop page.
2. **Given** the Online learners card, **When** activated, **Then** the visitor goes to the registration page.
3. **Given** the College & university or Corporate teams card, **When** activated, **Then** a WhatsApp chat opens with a prefilled message asking about that audience.
4. **Given** a keyboard user, **When** tabbing through the section, **Then** each card is reachable once, in order, shows a visible focus indication, and activates with Enter.

---

### User Story 3 - Comfortable on any screen (Priority: P2)

The section adapts its layout to the screen while keeping every card readable and the section short on phones.

**Why this priority**: Most visitors are likely on phones, but the content works without the polish of the layout.

**Independent Test**: View the section at 360px, tablet and 1024px+ widths and check layout and overflow.

**Acceptance Scenarios**:

1. **Given** a viewport of 1024px or wider, **When** the section renders, **Then** the five cards sit in one row if each card's name and line stay fully visible without clipping; otherwise they form three cards on top and two below, with the second row centred.
2. **Given** a tablet-width viewport, **When** the section renders, **Then** cards form two columns and the fifth card sits centred on its own row.
3. **Given** a 360px-wide phone, **When** the section renders, **Then** cards stack in one column as compact horizontal cards (icon tile on the left, text on the right), and the page has no horizontal scroll.

---

### User Story 4 - Each audience feels distinct and alive (Priority: P2)

Each card has its own colour identity and icon, and responds to attention with small motion that suits what the icon means.

**Why this priority**: Visual distinction aids the 3-second recognition goal; motion is polish.

**Independent Test**: Scroll to the section, then hover or focus each card on a pointer device, then repeat with reduced motion turned on.

**Acceptance Scenarios**:

1. **Given** the section scrolls into view for the first time, **When** it appears, **Then** the cards fade and rise in with a short stagger, once only (scrolling away and back does not replay it).
2. **Given** a pointer device, **When** a card is hovered or keyboard-focused, **Then** it lifts by 4px, its tile tint brightens, and its icon plays one small motion lasting at most 400ms: teacher slight tilt, school student small hop, college graduation cap tilt and settle, online learner laptop lid nudge, corporate briefcase small swing.
3. **Given** the visitor prefers reduced motion, **When** the section appears and a card is hovered or focused, **Then** there is no entrance movement, no lift and no icon motion; only the colour change happens.
4. **Given** a touch-only device, **When** the visitor taps a card, **Then** no sticky hover state remains after navigation or tap release.

---

### Edge Cases

- WhatsApp number not configured: the College & university and Corporate cards fall back to the contact page, so no card is ever a dead link or missing.
- Audience data empty: the section renders nothing (no empty heading).
- Longer audience name or benefit line in future content (for example after owner review or admin edits): text wraps inside the card; cards in a row keep equal height; nothing clips or overflows at 360px.
- Browser zoom to 200% or large text: layout reflows to fewer columns without overlap.
- Cards in a fifth, centred position must stay the same width as the others.
- Icon fails to load or is slow: the tile still shows its tint and the card remains fully usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The section MUST show five audience cards in the order Teachers, School students (Grades 6-10), College & university students, Online learners, Corporate teams.
- **FR-002**: Each card MUST show an icon in a tinted tile, the audience name, one benefit line and a small "See how" link with an arrow.
- **FR-003**: The benefit lines MUST be: Teachers "Plan lessons and make quizzes in minutes, not hours."; School students "Use AI to learn and build, not to copy."; College & university students "Turn AI into a skill employers ask for."; Online learners "Learn at your pace, from beginner to advanced."; Corporate teams "Cut repetitive work with tools your team will actually use." All copy is marked as a draft for owner review.
- **FR-004**: The whole card MUST be one link target; the "See how" label MUST be part of it, not a second link.
- **FR-005**: Link targets MUST be: Teachers and School students to the workshop page; Online learners to the registration page; College & university and Corporate teams to a WhatsApp chat with a prefilled, audience-specific message that carries no personal data.
- **FR-006**: Icons MUST be duotone-style, drawn from one icon family, and meaningful to the audience (classroom teacher, student, graduation cap, laptop, briefcase). Robots, brains and circuit imagery MUST NOT be used.
- **FR-007**: Each icon MUST sit in a 56px rounded tile with its own tint: Teachers saffron, School students sky blue, College & university royal blue, Online learners a soft blue-sky mix, Corporate teams navy with a saffron accent. The icon's main stroke uses the strong tone, its secondary fill the same tone at low opacity, and the tile a soft gradient of that tone.
- **FR-008**: Colours MUST come only from existing brand colours and their tint/opacity variants; no new hues are introduced.
- **FR-009**: All text MUST meet WCAG AA contrast (4.5:1 body text, 3:1 large text and icon strokes against their tile).
- **FR-010**: Icons MUST be hidden from assistive technology; the audience name carries the meaning. The accessible name of each link MUST be the audience name plus its benefit line, with no duplicated or empty links.
- **FR-011**: The audience name MUST use the heading font and the benefit line the body font, as used elsewhere on the home page.
- **FR-012**: Layout MUST follow User Story 3: one row (or 3 + 2 centred) from 1024px, two columns with the last card centred on tablet, and a single column of compact horizontal cards on phones, with no horizontal scroll at 360px.
- **FR-013**: On first view the cards MUST fade and rise with a short stagger, once.
- **FR-014**: On hover and keyboard focus on pointer devices, a card MUST lift 4px, brighten its tile tint and play its icon's own motion (see User Story 4) lasting at most 400ms.
- **FR-015**: With reduced motion requested, the section MUST show no entrance movement, no lift and no icon motion; hover and focus change colour only.
- **FR-016**: Every card MUST show a visible focus indicator that meets contrast requirements and is not hidden by the lift.
- **FR-017**: Audience content MUST be typed, ordered data separate from the display, so the later admin feature can replace it without changing the section's look. Per-audience tint and icon choices are display choices and stay with the section.
- **FR-018**: The section MUST be rendered on the server; only the icon hover motion may need browser-side code, and the section MUST be fully readable and linkable without it.
- **FR-019**: The section MUST NOT add any icon or UI library other than the one icon family named in FR-006, and its icon cost MUST be limited to the five icons used.
- **FR-020**: The hero, How it works and Programs sections, and their content, MUST remain unchanged.
- **FR-021**: The section MUST NOT cause visible layout shift while loading or animating.

### Key Entities

- **Audience**: A group the site speaks to. Has a stable id, a display name, one benefit line, a destination (internal page or WhatsApp ask with a message) and an order. The visual treatment (icon, tint, motion) is derived from the id in the display, not stored with the content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a 3-second glance test, at least 4 of 5 testers can point to the card meant for them on both a phone and a desktop.
- **SC-002**: All five destinations are reachable by mouse, touch and keyboard, and each lands on the correct page or chat (5 of 5).
- **SC-003**: At 360px, 768px and 1280px widths there is no horizontal scroll and no clipped text on any card.
- **SC-004**: On a phone the whole section is no taller than about two screens of scrolling, with cards compact enough that all five are reached without feeling long.
- **SC-005**: Every text and icon pairing in the section passes AA contrast; an automated accessibility scan reports zero serious issues for the section.
- **SC-006**: With reduced motion on, no element in the section moves; with it off, no motion lasts longer than 400ms after hover or focus.
- **SC-007**: The home page's performance and visual-stability scores do not drop by more than a small margin (about 2 points) against the page before this feature.
- **SC-008**: No benefit line or card text repeats programme titles, facts or status labels shown in the Programs section.

## Assumptions

- Audience copy, the "Grades 6-10" label, and the WhatsApp messages are placeholders for owner review, like the other draft home content.
- The section heading and intro keep using the existing shared home copy; wording of those may be adjusted to fit "who it's for and what changes", but no new copy source is added.
- The existing four-audience data is replaced by the five-audience list; no page other than the home page uses it. If another page does, it keeps working.
- The user asked for the content file at `src/content/audiences.ts`; the project currently keeps it at `src/content/data/audiences.ts`. The planning step decides whether to keep the existing location or move it.
- "Existing brand colours" means midnight, royal, sky, saffron, paper and soft. Mixes and opacity variants of these are allowed.
- Corporate teams and College & university cards use the general workshop WhatsApp ask pattern already used by the Programs section.
- Touch devices get no hover effects; only pointer devices do.

## Out of Scope

- New pages and any admin editing of audiences.
- Changes to the hero, How it works, Programs, Why Tareeq or the final call to action.
- Changing the home page section order.
