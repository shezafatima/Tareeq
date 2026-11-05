# Feature Specification: Home Testimonials Section (4:5 Video Cards)

**Feature Branch**: `012-testimonials-section`  
**Created**: 2026-11-05  
**Status**: Draft  
**Input**: User description: "Home: Testimonials section (4:5 video cards). Show real people (teachers, students) talking about Tareeq in short vertical videos. Reuse the hero's glass card style, do not touch other sections. Data typed in `src/content/testimonials.ts` with a stable shape (the admin will replace it later): youtubeUrl, name, role, organization (optional), quote, consent, published, order. Accept YouTube Shorts, watch and youtu.be URLs; extract the video ID with a tested helper; invalid URLs are skipped and logged in development only. Only consent === true and published === true items are shown. Three placeholder items are rendered only in development."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Watch real people talk about Tareeq (Priority: P1)

A visitor scrolling the home page reaches a testimonials section and sees a row of tall (4:5) cards, each showing a person's video, their name, role (and organization when given) and a one-line quote. They can play a video right on the page and hear a teacher or student describe their experience in their own words.

**Why this priority**: This is the whole point of the section: social proof from real people, in video.

**Independent Test**: With at least one approved testimonial in the data, open the home page, scroll to the section, and play a video from a card.

**Acceptance Scenarios**:

1. **Given** approved testimonials exist, **When** the visitor reaches the section, **Then** each appears as a 4:5 card in the same glass look as the hero cards, with name, role, optional organization and quote visible.
2. **Given** a card is visible, **When** the visitor activates its play control, **Then** that video plays in place without leaving the page.
3. **Given** one video is playing, **When** the visitor plays another, **Then** the first stops so only one plays at a time.
4. **Given** a phone-sized screen, **When** the visitor views the section, **Then** cards are fully usable (swipeable or stacked) with no horizontal page scroll.

---

### User Story 2 - Only approved testimonials are ever public (Priority: P1)

The site owner needs certainty that nobody appears on the site without their consent and without the owner's approval.

**Why this priority**: A privacy and trust requirement; showing an unapproved person is the worst failure mode.

**Independent Test**: Provide items with every combination of consent and published; confirm only the true/true items appear on the live site.

**Acceptance Scenarios**:

1. **Given** an item with consent false or published false, **When** the home page renders, **Then** it is not shown, in any environment.
2. **Given** several approved items with different order values, **When** the section renders, **Then** they appear in ascending order.
3. **Given** no approved items exist in the live site, **When** the home page renders, **Then** the whole section (heading included) is absent, with no empty frame.

---

### User Story 3 - Accept any common YouTube link (Priority: P2)

The owner pastes whichever YouTube link they have (Shorts, normal watch, or short youtu.be link) and the right video shows up.

**Why this priority**: Removes friction for whoever fills the data; a bad link must not break the page.

**Independent Test**: Run the link-parsing helper against valid and invalid URLs and confirm the video ID or a rejection.

**Acceptance Scenarios**:

1. **Given** a Shorts, watch or youtu.be URL (with or without extra parameters such as timestamps), **When** parsed, **Then** the same 11-character video ID is returned.
2. **Given** an invalid or non-YouTube URL, **When** the section renders, **Then** that item is skipped, the rest still show, and a warning is logged in development only (nothing logged in production).

---

### User Story 4 - Preview the layout before real testimonials exist (Priority: P3)

While developing, the team sees three placeholder cards so the section can be designed and checked, but visitors to the live site never see them.

**Why this priority**: Supports building and reviewing; has no visitor value itself.

**Independent Test**: Run the site in development mode and in a production build, with no real approved testimonials.

**Acceptance Scenarios**:

1. **Given** development mode and no real approved items, **When** the home page renders, **Then** three clearly labelled placeholder cards appear.
2. **Given** a production build, **When** the home page renders, **Then** no placeholder is shown or included in the page output.

### Edge Cases

- A video is removed, private or unavailable on YouTube: the card shows YouTube's own unavailable message in place; the page is not broken.
- A name, role or quote is very long: text is contained within the card without breaking the layout (quote kept to one short line, truncated if needed).
- Two items share the same video or the same order value: both still render, in a stable order.
- Only one or two approved items: the layout looks intentional, not like a broken grid.
- Right-to-left / Urdu text in a quote or name displays correctly.
- Visitor prefers reduced motion: no autoplay and no decorative motion beyond what they allow.
- Videos must not load or play until the visitor asks, so the section does not slow the initial page load.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home page MUST include a testimonials section placed after the mentor section and before the final call to action, without altering any other section.
- **FR-002**: Each testimonial MUST be shown as a 4:5 card using the hero's glass card look.
- **FR-003**: Each card MUST show the person's name, role, optional organization (omitted cleanly when absent) and a one-line quote.
- **FR-004**: Each card MUST let the visitor play the video in place, only on the visitor's action, one video at a time.
- **FR-005**: Testimonial data MUST be a typed list where each item has: video link, name, role, optional organization, quote, consent flag, published flag and order number. This shape MUST stay stable so a future admin can replace the source.
- **FR-006**: The system MUST accept YouTube Shorts, watch and youtu.be links and derive the video ID through a single helper covered by automated tests (valid forms, extra parameters, invalid input).
- **FR-007**: Items whose link is invalid MUST be skipped without affecting others, and a warning MUST be logged in development only.
- **FR-008**: Only items with consent true AND published true MUST be shown; no environment may override this for real items.
- **FR-009**: Shown items MUST be sorted by ascending order.
- **FR-010**: Three placeholder items MUST appear only in development and MUST NOT be shown or shipped in production; they must be visibly labelled as placeholders.
- **FR-011**: If no items would be shown, the whole section MUST be omitted.
- **FR-012**: Each video MUST have an accessible name (e.g. the person's name) and the cards MUST be operable by keyboard.
- **FR-013**: The section MUST work from phone to desktop widths with no horizontal page scroll and meet existing site contrast and reduced-motion standards.

### Key Entities

- **Testimonial**: One person's video story. Attributes: video link, name, role, optional organization, one-line quote, consent flag, published flag, display order.
- **Video ID**: The 11-character YouTube identifier derived from a Testimonial's link; used to show the video.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With three approved items, a visitor can start playing any testimonial within two actions (scroll, then one tap/click).
- **SC-002**: 100% of items lacking consent or approval are absent from the live page across all test combinations.
- **SC-003**: 100% of supported link forms in the helper's test set resolve to the correct video ID, and 100% of invalid forms are rejected.
- **SC-004**: Production output contains zero placeholder testimonials and zero testimonial warnings.
- **SC-005**: The section adds no measurable regression to the home page's initial load: no video loads before the visitor interacts.
- **SC-006**: At 360px, 768px and 1280px widths there is no horizontal page scroll and no clipped text on any card.

## Assumptions

- The data file is `src/content/testimonials.ts`, following the existing content-module pattern used by the mentor and audiences sections.
- Section placement is after "Meet your mentor" and before the final call to action (editable later).
- Section heading and intro copy are short and neutral; final wording can be supplied by the owner. No invented testimonials, names or statistics ever appear in production.
- "Play in place" means the visitor sees YouTube's embedded player inside the card after pressing play, with a poster image shown beforehand.
- Order ties are resolved by original list position.
- The branch is based on a clean main after merging feature 011.

## Out of Scope

- The admin interface that will later replace the data file.
- Uploading or hosting videos outside YouTube.
- Likes, comments, filtering or pagination of testimonials.
- Any change to other home sections or pages.
