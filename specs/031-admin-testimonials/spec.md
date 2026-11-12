# Feature Specification: Admin testimonial videos

**Feature Branch**: `031-admin-testimonials`
**Created**: 2026-11-12
**Status**: Draft
**Input**: Admin: testimonial videos. The home Testimonials section moves from a static content file to owner-managed records edited in the admin. The section's look, its click-to-load player, the "hide when empty" production rule and the development placeholders stay exactly as they are.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a testimonial video and show it on the home page (Priority: P1)

The owner opens Testimonials in the admin, chooses "New", pastes a YouTube link (Shorts, watch or short youtu.be form), sees the video's thumbnail appear as soon as the link is valid, fills in the person's name, role, optional organization and a one-line quote, ticks "I have this person's permission to show this video", turns Published on and saves. The video then appears in the home Testimonials section.

**Why this priority**: It is the whole point of the feature: real testimonials reach the site without a code change.

**Independent Test**: On an empty database, create one testimonial with consent and published on, then load the home page in a production build and confirm the section appears with that one video.

**Acceptance Scenarios**:

1. **Given** no testimonials, **When** the owner saves one with consent and published both on, **Then** the home page shows the Testimonials section with that item on the next load.
2. **Given** the form, **When** the owner pastes a valid Shorts, watch or youtu.be link, **Then** a thumbnail preview of that video appears without saving.
3. **Given** the form, **When** the owner enters a link that is not a recognizable YouTube video link, **Then** an inline error appears at the link field and saving is blocked.
4. **Given** the quote field, **When** the owner types, **Then** a counter shows characters used out of 140 and saving is blocked above 140.
5. **Given** a missing name, role, link or quote, **When** the owner saves, **Then** saving is blocked with a message at each missing field.
6. **Given** an existing testimonial, **When** the owner edits any field and saves, **Then** the home page reflects the change on the next load.

---

### User Story 2 - Consent gate on publishing (Priority: P1)

A testimonial can only be published when the owner has confirmed the person's permission. Until consent is ticked, the Published control is disabled and explains why on hover or focus. Even if a request tries to publish without consent, the server refuses.

**Why this priority**: Showing a person's face and words without permission is a privacy and trust risk; this is a hard rule, not a convenience.

**Independent Test**: Try to publish an item without consent through the form (control disabled) and through a direct save request (refused); confirm the item never appears publicly.

**Acceptance Scenarios**:

1. **Given** consent is unticked, **When** the owner looks at the Published control (form or card), **Then** it is disabled and a tooltip says consent is required first.
2. **Given** a save or toggle request with published on and consent off, **When** it reaches the server, **Then** it is refused with a clear message and the stored record is unchanged.
3. **Given** a published item, **When** the owner unticks consent and saves, **Then** the item is saved as unpublished and disappears from the home page.
4. **Given** an item with consent on and published off, **When** the home page renders, **Then** the item is not shown.

---

### User Story 3 - Manage the list: toggle, reorder, delete (Priority: P2)

The owner sees all testimonials as a grid of tall (9:16) cards, each showing the video thumbnail, name, role, quote, a consent badge and a Published toggle. They can publish or unpublish from the card, change the display order by editing an order number, and delete an item after confirming.

**Why this priority**: Day-to-day curation; the site works without it once items exist, but it keeps managing them quick.

**Independent Test**: With three items, change their order numbers, toggle one off and delete one; confirm the home page order, visibility and count match.

**Acceptance Scenarios**:

1. **Given** several items, **When** the admin list loads, **Then** each card shows thumbnail, name, role, quote, consent badge and Published toggle, sorted by order.
2. **Given** items with order numbers 1, 2, 3, **When** the owner changes one to 0 and saves, **Then** both the admin grid and the home section show it first.
3. **Given** a published item, **When** the owner turns its card toggle off, **Then** it disappears from the home page on the next load.
4. **Given** an item, **When** the owner chooses Delete, **Then** a confirmation is required; on confirm the item is removed from the admin and the home page; on cancel nothing changes.
5. **Given** no items, **When** the admin list loads, **Then** an empty state invites the owner to add the first testimonial.

---

### User Story 4 - Owner-only access (Priority: P1)

Only a signed-in owner can view the testimonials admin or create, edit, toggle, reorder or delete a testimonial. Direct requests without a session are refused.

**Why this priority**: Without it, anyone could put videos and quotes on the home page.

**Independent Test**: Extend the existing unauthenticated-action test so every testimonial action is called with no session and each is refused with nothing changed.

**Acceptance Scenarios**:

1. **Given** no session, **When** any testimonial create, update, toggle or delete action is called, **Then** it is refused and no record changes.
2. **Given** no session, **When** the testimonials admin page is visited, **Then** the visitor is sent to sign in.

---

### Edge Cases

- A link with extra parameters (timestamps, playlist, tracking) still resolves to the right video.
- A link whose video was later removed from YouTube: the card and the public player show the existing "unavailable" fallback behaviour of the section; the admin still lets the owner edit or delete it.
- Two items with the same order number: they are shown in a stable order (oldest first).
- The same video added twice: allowed; it is the owner's choice.
- Production with zero published-and-consented items: the section is not rendered at all.
- Development with zero real items: the existing development placeholders render; they never render in production.
- Development with real items: real items are shown (existing selection rule unchanged).
- Saving fails because the data store is unreachable: the form keeps the owner's input and shows a retryable error.
- Narrow screens (360px): the card grid and form stay usable with no horizontal scroll.
- Reduced-motion users: no animated transitions in the admin grid or toggles beyond what existing admin pages allow.

## Requirements *(mandatory)*

### Functional Requirements

**Public site**

- **FR-001**: The home Testimonials section MUST read testimonials from the stored records instead of the static content file, and the static content file MUST be removed.
- **FR-002**: The public site MUST show only items whose consent and published are both true, sorted by order (ties: oldest first).
- **FR-003**: The section's layout, card design, click-to-load player and "render nothing when there are zero items in production" rule MUST remain unchanged.
- **FR-004**: The existing development placeholders MUST remain in code and render only outside production, under the same rule as today.
- **FR-005**: Every create, edit, toggle, reorder or delete MUST refresh the public section so the change is visible on the next page load, without a redeploy.
- **FR-006**: No seed data is created; a fresh production site shows no Testimonials section.

**Admin**

- **FR-007**: The admin MUST have a Testimonials page, listed in the admin sidebar, following the existing admin page patterns.
- **FR-008**: The page MUST show all testimonials (published or not) as a grid of 9:16 cards with thumbnail, name, role, quote, consent badge and Published toggle, sorted by order.
- **FR-009**: The owner MUST be able to create and edit a testimonial with: YouTube link, name, role, organization (optional), quote, consent, order and published.
- **FR-010**: The link field MUST accept YouTube Shorts, watch and youtu.be links; the video identifier MUST be extracted from it on save using the existing link helper; an unrecognized link MUST show an inline error and block saving.
- **FR-011**: Once the link is valid, the form MUST show a live thumbnail preview of the video.
- **FR-012**: The quote MUST be one line of at most 140 characters, with a visible character counter; name, role, link and quote are required.
- **FR-013**: The consent checkbox MUST read "I have this person's permission to show this video".
- **FR-014**: The Published control (form and card) MUST be disabled, with an explanatory tooltip available on hover and keyboard focus, while consent is off.
- **FR-015**: The server MUST refuse any save or toggle that would leave an item published without consent; unticking consent on a published item MUST save it as unpublished.
- **FR-016**: The owner MUST be able to delete a testimonial after an explicit confirmation.
- **FR-017**: The owner MUST be able to change display order by editing the item's order number.

**Security and quality**

- **FR-018**: Every testimonial action and the admin page MUST check for a signed-in owner on the server; the existing unauthenticated-action test MUST be extended to cover each new action.
- **FR-019**: Thumbnails MUST load from YouTube's image host, which the site already allows; no new external hosts are added.
- **FR-020**: The feature MUST add no new third-party dependencies.
- **FR-021**: The admin page and form MUST be usable at 360px width and keyboard-only, and MUST respect reduced-motion preferences.

### Key Entities

- **Testimonial**: A short video endorsement from a real person. Attributes: YouTube link, extracted video identifier, name, role (e.g. "Teacher", "Student"), organization (optional), quote (one line, max 140 characters), consent (the person agreed to be shown), published (the owner approved it for the site), order (display position), created and updated times. Visible publicly only when consent and published are both true.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can add a new testimonial and see it on the home page in under 2 minutes, with no code change or redeploy.
- **SC-002**: 0 items without consent ever appear on the public site, whether attempted through the form or a direct request.
- **SC-003**: 100% of testimonial actions are refused without a signed-in owner (verified by the extended unauthenticated-action test).
- **SC-004**: With the same items, the public Testimonials section looks and behaves identically to before (same layout, player, empty-state rule and development placeholders).
- **SC-005**: Admin changes (save, toggle, reorder, delete) are visible on the next public page load in 100% of cases.
- **SC-006**: The admin testimonials page and form have no horizontal scroll at 360px and can be fully operated by keyboard.

## Assumptions

- "Owner" means any signed-in admin user, as for the other admin pages.
- Reordering is by editing the order number only (no drag and drop); new items default to the end of the list.
- Published defaults to off for new items; consent defaults to unticked.
- Role is free text with suggestions such as "Teacher" and "Student", not a fixed list.
- The existing link helper and thumbnail address format used by the public section are reused unchanged.
- Delete is permanent (no trash or undo), matching other admin delete actions.

## Out of Scope

- Uploading video files; only YouTube links are supported.
- Written-only testimonials without a video.
- A testimonials gallery or separate page, and a blog.
- Drag-and-drop reordering.
