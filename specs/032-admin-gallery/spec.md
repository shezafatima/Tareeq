# Feature Specification: Admin gallery

**Feature Branch**: `032-admin-gallery`
**Created**: 2026-11-12
**Status**: Draft
**Input**: Admin: gallery. The owner uploads workshop photos in the admin, grouped into albums (one per event), and they appear on the public site: a /gallery index of albums, a page per album with a lightbox, and the latest photos on /workshop. Photos of children are uploaded only with parent/school consent.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an album and upload photos (Priority: P1)

The owner opens Gallery in the admin, chooses "New album", enters a title (e.g. "Teacher workshop, Karachi"), a date label (e.g. "November 2026") and an optional description, and saves. On the album page they drag several photos onto the upload area at once (or pick them with a file chooser). Each file shows its own progress and ends as a photo card, or as a clear error for that file only. Above the upload area a notice reads "Only upload photos of children with parent/school consent."

**Why this priority**: Without albums and photos nothing else in the feature exists.

**Independent Test**: Create an album, drop five images at once, and confirm five photo cards appear with individual progress, and that one deliberately invalid file fails alone without blocking the other four.

**Acceptance Scenarios**:

1. **Given** the albums page, **When** the owner creates an album with a title and date label, **Then** it appears in the albums grid, unpublished, with a photo count of 0.
2. **Given** an album page, **When** the owner drops several images at once, **Then** each file shows its own progress state (waiting, uploading, done or failed) and each successful file becomes a photo in the album.
3. **Given** a drop containing a non-image or oversized file, **When** uploads run, **Then** only that file shows an error with the reason; the others complete.
4. **Given** the upload area, **When** it is visible, **Then** the consent notice "Only upload photos of children with parent/school consent." is shown with it.
5. **Given** a missing title or date label, **When** the owner saves the album, **Then** saving is blocked with a message at each missing field.
6. **Given** two albums whose titles would produce the same address, **When** the second is saved, **Then** it receives a distinct address automatically (the owner is never blocked by a collision).

---

### User Story 2 - Describe, publish and curate photos (Priority: P1)

Each photo card has an alt text field, an optional caption, an order number, a Published toggle, "Set as cover" and Delete. A photo with no alt text shows a warning badge and cannot be published. The owner publishes the album from the albums grid; the album cover is the chosen photo, or the first photo by order when none is chosen.

**Why this priority**: Accessibility (alt text) and owner approval are the gate between an upload and the public site.

**Independent Test**: Upload three photos, try to publish one without alt text (refused, badge visible), add alt text and publish two, set the second as cover, reorder, delete the third; confirm the admin and public album match.

**Acceptance Scenarios**:

1. **Given** a photo with empty alt text, **When** the album page renders, **Then** that card shows a "Missing alt text" warning badge and its Published toggle is disabled with an explanation on hover and focus.
2. **Given** a publish request for a photo without alt text, **When** it reaches the server, **Then** it is refused with a clear message and the photo stays unpublished.
3. **Given** a published photo, **When** the owner clears its alt text and saves, **Then** the photo is saved as unpublished.
4. **Given** photos with order numbers, **When** the owner changes one and saves, **Then** the admin grid and public album both show the new order (ties: oldest first).
5. **Given** a photo, **When** the owner chooses "Set as cover", **Then** it becomes the album's cover in the admin grid, on the public album card and as the album's share image.
6. **Given** the cover photo is deleted or unpublished, **When** the album is shown publicly, **Then** the cover falls back to the first published photo by order.
7. **Given** a photo, **When** the owner chooses Delete and confirms, **Then** it is removed from the album and its stored image file is removed (best effort); on cancel nothing changes.
8. **Given** the albums grid, **When** the owner turns an album's Published toggle on or off, **Then** the public gallery reflects it on the next load.

---

### User Story 3 - Visitors browse albums and photos (Priority: P1)

A visitor opens /gallery and sees album cards (cover, title, date label, photo count), newest first. Opening an album shows its photos in a responsive grid; selecting a photo opens a full-screen viewer with the caption, which can be navigated with arrow keys or swiping and closed with Esc or a close button.

**Why this priority**: This is the visible value for parents, schools and teachers.

**Independent Test**: With one published album of four published photos (and one unpublished), visit /gallery and the album page on desktop and on a 360px touch screen; open the viewer, move through all four photos by keyboard and by swipe, close it, and confirm focus returns to the photo that was opened.

**Acceptance Scenarios**:

1. **Given** published albums, **When** a visitor opens /gallery, **Then** each published album with at least one published photo appears as a card with cover, title, date label and published-photo count, newest first.
2. **Given** an album page, **When** it loads, **Then** only published photos appear, in order, in a grid that keeps each photo's proportions and has no horizontal scroll at 360px.
3. **Given** the album page, **When** the visitor activates a photo (click, tap, Enter or Space), **Then** a viewer opens showing that photo large with its caption (if any) and its position (e.g. "3 of 12").
4. **Given** the open viewer, **When** the visitor presses Right/Left arrow or swipes left/right, **Then** the next/previous photo is shown; at the ends navigation stops (no wrap).
5. **Given** the open viewer, **When** the visitor presses Esc or the close button, **Then** the viewer closes and keyboard focus returns to the photo that opened it.
6. **Given** the open viewer, **When** the visitor presses Tab repeatedly, **Then** focus stays within the viewer's controls.
7. **Given** a visitor who prefers reduced motion, **When** the viewer opens or changes photo, **Then** no sliding or zoom animation plays.
8. **Given** an unknown album address, or an album that is unpublished, **When** it is requested, **Then** the site's standard "not found" page is shown.
9. **Given** an album page is shared, **When** a link preview is generated, **Then** it uses the album's title, description (or a default) and cover image.

---

### User Story 4 - Empty states and navigation (Priority: P2)

Before the first workshop there are no published albums. /gallery then shows a friendly "Photos coming after our first workshop" message, and Gallery is not listed in the site navigation. As soon as one album is published with at least one published photo, Gallery appears in the navigation.

**Why this priority**: Avoids an empty, unfinished-looking section on a new site; secondary to the core flows.

**Independent Test**: On an empty database, confirm the nav has no Gallery link and /gallery shows the message; publish one album with one published photo and confirm the nav link appears on the next load.

**Acceptance Scenarios**:

1. **Given** no published album with a published photo, **When** /gallery loads, **Then** it shows "Photos coming after our first workshop" and no album cards.
2. **Given** the same state, **When** any public page loads, **Then** Gallery appears in neither the desktop navigation, the mobile menu nor the footer.
3. **Given** at least one published album with a published photo, **When** any public page loads, **Then** Gallery appears in the navigation.

---

### User Story 5 - Latest photos on the workshop page (Priority: P2)

The /workshop page shows a "Gallery" section with the latest 6 published photos (from published albums) and a "See all photos" link to /gallery. When there are none, the section is not rendered.

**Why this priority**: Social proof on the booking page; depends on Stories 1–3.

**Independent Test**: With 0, 3 and 8 eligible photos, load /workshop and confirm the section is absent, shows 3, and shows the newest 6 respectively.

**Acceptance Scenarios**:

1. **Given** no published photos in published albums, **When** /workshop loads, **Then** no gallery section or heading is rendered.
2. **Given** 8 eligible photos, **When** /workshop loads, **Then** the 6 most recently added are shown with a "See all photos" link to /gallery.
3. **Given** a photo in an unpublished album, **When** /workshop loads, **Then** it is not shown even if the photo itself is published.

---

### User Story 6 - Delete an album (Priority: P2)

The owner deletes an album from the albums grid. If it contains photos, a confirmation states how many photos will also be deleted. On confirm, the album, its photos and their stored image files are removed (file removal is best effort and never blocks the delete).

**Why this priority**: Housekeeping; needed but not on the critical path.

**Acceptance Scenarios**:

1. **Given** an album with 12 photos, **When** the owner chooses Delete, **Then** a confirmation says the 12 photos will be deleted too; cancel changes nothing.
2. **Given** the owner confirms, **When** the delete completes, **Then** the album and its photos are gone from the admin and public site, and the album address returns "not found".
3. **Given** the image store fails to remove some files, **When** the delete runs, **Then** the album and photo records are still deleted and the failure is logged.
4. **Given** an empty album, **When** the owner chooses Delete, **Then** a simple confirmation is still required.

---

### User Story 7 - Owner-only access (Priority: P1)

Only a signed-in owner can view the gallery admin, request an upload signature for gallery photos, or create, edit, publish, reorder, set cover or delete albums and photos.

**Why this priority**: Without it, anyone could publish photos (potentially of children) on the site.

**Independent Test**: Extend the existing unauthenticated-action test so every new gallery action, and the gallery upload signature, is called without a session and each is refused with nothing changed.

**Acceptance Scenarios**:

1. **Given** no session, **When** any gallery album or photo action is called, **Then** it is refused and no record or file changes.
2. **Given** no session, **When** an upload signature for the gallery is requested, **Then** it is refused.
3. **Given** no session, **When** /admin/gallery or an album admin page is visited, **Then** the visitor is sent to sign in.

---

### Edge Cases

- A photo whose stored file was removed from the image store outside the admin: the public page must not break; the admin still allows deleting the record.
- An upload completes in the image store but saving the photo record fails: the file shows "failed" with a retry, and the orphaned file is cleaned up best effort.
- The owner leaves the album page while uploads are in progress: the browser warns before leaving; completed photos are kept.
- A very large drop (e.g. 40 files): files upload a few at a time, not all at once, and every file still reports its own state.
- A published album with zero published photos: hidden from /gallery and its address returns "not found", and it does not make the Gallery nav link appear.
- Two albums with the same date label: newest first is decided by creation time (then order number), so the result is stable.
- Changing an album's title does not change its address once created, so shared links keep working.
- Very tall or very wide photos: shown uncropped in the viewer and without distortion in the grid.
- A caption or alt text that is very long: wraps without breaking layout; length limits apply (see FR-014).
- The image store is not configured (e.g. local development without keys): the upload area shows that uploads are unavailable rather than failing silently, matching the existing upload behaviour.
- Saving fails because the data store is unreachable: the form keeps the owner's input and shows a retryable error.
- Touch swipe that is mostly vertical: treated as page scroll, not as next/previous.

## Requirements *(mandatory)*

### Functional Requirements

**Albums and photos (data)**

- **FR-001**: The system MUST store albums with: title, unique address slug (generated from the title on creation, made unique automatically, not changed by later title edits), date label (free text, e.g. "November 2026"), optional description, optional chosen cover photo, order number, published flag and created/updated times.
- **FR-002**: The system MUST store photos with: their album, the image (address, image-store identifier, width, height, alt text — the same shape as existing site images), optional caption, order number, published flag and created/updated times.
- **FR-003**: An album's displayed cover MUST be its chosen cover photo when that photo exists and is eligible to show; otherwise the first published photo by order (in the admin: the first photo by order).
- **FR-004**: A photo is publicly visible only when the photo is published, has non-empty alt text, and its album is published. An album is publicly visible only when it is published and has at least one publicly visible photo.

**Admin**

- **FR-005**: The admin MUST have a Gallery page, listed in the admin sidebar, following existing admin page patterns.
- **FR-006**: The Gallery page MUST show all albums as a grid of cards with cover, title, date label, photo count and Published toggle, and an empty state inviting the owner to create the first album.
- **FR-007**: The owner MUST be able to create and edit an album (title, date label, description, order, published) and delete it per User Story 6.
- **FR-008**: Each album MUST have an admin page with a multi-file upload area accepting drag-and-drop of several images at once and a file chooser, reusing the existing signed-upload flow and its file-type and size limits.
- **FR-009**: Each file in an upload batch MUST show its own state (waiting, uploading with progress, done, failed with reason), and one file's failure MUST NOT affect the others. Failed files MUST offer a retry.
- **FR-010**: The upload area MUST display the notice "Only upload photos of children with parent/school consent."
- **FR-011**: Each photo card MUST allow editing alt text, caption and order number, toggling Published, "Set as cover", and Delete with confirmation.
- **FR-012**: A photo without alt text MUST show a warning badge, and its Published toggle MUST be disabled with an explanation on hover and keyboard focus. The server MUST refuse publishing a photo without alt text, and clearing the alt text of a published photo MUST save it as unpublished.
- **FR-013**: New albums and new photos MUST default to unpublished, and new photos MUST be added at the end of the album's order.
- **FR-014**: Alt text MUST be at most 200 characters and captions at most 300 characters, with the limit enforced on the server.
- **FR-015**: Deleting a photo or an album MUST remove the related image files from the image store on a best-effort basis; file-removal failures MUST be logged and MUST NOT block the delete.

**Public site**

- **FR-016**: /gallery MUST list publicly visible albums (FR-004) as cards with cover, title, date label and count of publicly visible photos, newest first (created time descending, then order).
- **FR-017**: When no album is publicly visible, /gallery MUST show the message "Photos coming after our first workshop", and Gallery MUST NOT appear in the site navigation (desktop, mobile menu, footer). Otherwise Gallery MUST appear in the navigation.
- **FR-018**: /gallery/[album address] MUST show the album's title, date label, description and its publicly visible photos in order, in a responsive grid that preserves each photo's proportions.
- **FR-019**: An unknown address, or an album that is not publicly visible, MUST return the site's standard "not found" response.
- **FR-020**: Each album page MUST have its own page title, description and share image (the album cover).
- **FR-021**: Album photos MUST open in an in-page viewer that: shows the photo large with caption and position; supports Left/Right arrow keys and horizontal swipe; closes with Esc and a visible close button; keeps keyboard focus inside while open; returns focus to the opening photo on close; announces itself to assistive technology as a dialog; and prevents the page behind from scrolling.
- **FR-022**: The /workshop page MUST show a Gallery section with the 6 most recently added publicly visible photos and a "See all photos" link to /gallery, and MUST render nothing for this section when there are none.
- **FR-023**: Public photos MUST be served in an automatically chosen modern format and quality, sized for the space they occupy, and loaded only as they approach the viewport (except where they are the first visible content).

**Freshness, security and quality**

- **FR-024**: Every gallery create, edit, publish, reorder, set-cover, upload and delete MUST refresh all public gallery views (/gallery, album pages, /workshop section, navigation) so the change is visible on the next page load without a redeploy.
- **FR-025**: Every gallery action, every gallery admin page and the gallery upload signature MUST check for a signed-in owner on the server; the existing unauthenticated-action test MUST be extended to cover each new action and the signature.
- **FR-026**: The feature MUST add no new third-party dependencies; the viewer is built in-house.
- **FR-027**: All admin and public gallery screens MUST be usable at 360px width with no horizontal scroll, operable by keyboard alone, and MUST respect reduced-motion preferences.

### Key Entities

- **Gallery album**: One event's set of photos (e.g. "Teacher workshop, Karachi", "November 2026"). Attributes: title, address slug, date label, description, chosen cover photo, order, published, created/updated times. Has many photos.
- **Gallery photo**: One image in an album. Attributes: album, image (address, image-store identifier, width, height, alt text), caption, order, published, created/updated times. Belongs to exactly one album; deleted with its album.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can create an album, upload 10 photos in one drop, add alt text, publish and see the album on /gallery in under 10 minutes, with no code change or redeploy.
- **SC-002**: 0 photos without alt text, and 0 photos from unpublished albums, ever appear on the public site, whether attempted through the admin or a direct request.
- **SC-003**: 100% of gallery actions and the gallery upload signature are refused without a signed-in owner (verified by the extended unauthenticated-action test).
- **SC-004**: In a batch of 10 files containing 1 invalid file, the other 9 upload successfully and the invalid one shows a specific reason.
- **SC-005**: A visitor can open the viewer, move through every photo of an album and close it using only the keyboard, and using only touch on a 360px screen.
- **SC-006**: Admin changes are visible on the next public page load in 100% of cases.
- **SC-007**: On a fresh site with no published albums, no public page shows a Gallery link or an empty gallery grid.
- **SC-008**: Public gallery and album pages have no horizontal scroll at 360px, and an album page's above-the-fold content appears in under 2.5 seconds on a typical mobile connection.

## Assumptions

- "Owner" means any signed-in admin user, as for the other admin pages.
- **The /workshop page currently has no gallery section** (it is a minimal page; its code notes the gallery as a later feature). This feature adds the section new, hidden when empty, placed after the booking button.
- Album "newest first" is by creation time, since the date label is free text and cannot be sorted reliably; the order number breaks ties and lets the owner adjust.
- The existing signed-upload flow gains a gallery destination; existing file-type and size limits apply unchanged.
- Reordering is by editing order numbers only (no drag-and-drop reordering), consistent with other admin pages.
- Uploads in a batch run a few at a time (about 3 in parallel).
- "Latest 6 photos" on /workshop means most recently added, across all publicly visible albums.
- The album address is fixed at creation; editing it is not offered.
- Delete is permanent (no trash or undo), matching other admin delete actions.
- No seed data is created.

## Out of Scope

- Video in the gallery.
- A blog.
- Image editing (cropping, rotating, filters) in the admin.
- Drag-and-drop reordering of photos or albums.
- Bulk actions on photos (bulk publish, bulk delete, bulk alt text).
- Moving photos between albums.
- Downloading original photos from the public site.
- Automated face detection or consent tracking per photo; consent is the owner's responsibility, reinforced by the upload notice.
