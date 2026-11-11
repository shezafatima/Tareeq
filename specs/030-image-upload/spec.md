# Feature Specification: Admin image upload and editable site images

**Feature Branch**: `030-image-upload`
**Created**: 2026-11-11
**Status**: Draft
**Input**: Admin: image upload and editable site images. The owner uploads and replaces images from the admin, with no code change or redeploy.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload a cover image for a program or course (Priority: P1)

The owner edits a program or course in the admin and, instead of pasting a URL, drops an image onto an uploader. They see a preview and upload progress, write a short description of the image (alt text), and save. The public card and detail page then show that image.

**Why this priority**: It replaces the most awkward admin field today and creates the upload foundation everything else depends on.

**Independent Test**: Edit one program, upload a JPG, enter alt text, save, then open the public program card and detail page and confirm the image shows.

**Acceptance Scenarios**:

1. **Given** a program with no image, **When** the owner drops a valid JPG, adds alt text and saves, **Then** the card and detail page show the image.
2. **Given** an uploaded image, **When** the owner replaces it and saves, **Then** the public pages show the new image and the old stored file is removed.
3. **Given** an uploaded image, **When** the owner removes it and saves, **Then** the public pages show the existing brand pattern.
4. **Given** a record that only has an old URL string, **When** the public site renders it, **Then** the image still shows with no migration, and the admin form shows it as the current image that can be replaced.
5. **Given** a chosen image with no alt text, **When** the owner tries to save, **Then** saving is blocked with a clear message at the alt text field.
6. **Given** a file that is not JPG, PNG or WebP, or is over 5 MB, **When** the owner picks it, **Then** it is rejected immediately with a message saying which rule failed, and nothing is uploaded.
7. **Given** a keyboard-only user, **When** they tab through the uploader, **Then** they can choose, replace, remove and describe the image without a mouse.

---

### User Story 2 - Edit named site images (Priority: P2)

From Settings, the owner opens "Site images" and sees a list of named slots (label, recommended size, current preview). They upload a new image into a slot, add alt text and save. The change appears on the public site without a redeploy. An empty slot shows the current file that ships with the site, so a fresh site looks unchanged.

**Why this priority**: It delivers the "no code change" promise for content images such as the founder photo.

**Independent Test**: Replace the founder photo slot, save, and reload the home page to see the new photo; clear the slot and see the original return.

**Acceptance Scenarios**:

1. **Given** a fresh database, **When** the public site renders, **Then** every slot shows its default file and the site looks identical to before.
2. **Given** an uploaded image in a slot, **When** the owner saves, **Then** the public page shows it on the next load.
3. **Given** a slot with an image, **When** the owner clears it and saves, **Then** the default file returns and the old stored file is removed.
4. **Given** a slot image whose address stops working, **When** a visitor loads the page, **Then** the slot's default file is shown, never a broken image.

---

### User Story 3 - Safe, owner-only uploading (Priority: P1)

Only a signed-in owner can start an upload or save an image. Anyone else, including a signed-out visitor calling the same endpoints directly, is refused.

**Why this priority**: Without it, anyone could fill the image storage.

**Independent Test**: Call the upload-signature and save actions with no session and confirm each is refused and nothing is stored.

**Acceptance Scenarios**:

1. **Given** no session, **When** an upload signature is requested, **Then** it is refused.
2. **Given** no session, **When** any program, course or site-image save is attempted, **Then** it is refused.
3. **Given** a signed-in owner and a file that passes client checks but fails server verification (wrong type or too large), **When** saving, **Then** the save is rejected and the record is unchanged.

---

### Edge Cases

- Upload fails midway or loses connection: the uploader shows an error with a retry, and the record is unchanged.
- Old stored file cannot be deleted on replace or remove: the save still succeeds and the failure is logged.
- Owner uploads, then leaves without saving: the previous image stays; the orphaned upload is acceptable and not shown anywhere.
- Image storage is not configured (missing credentials): the uploader shows a clear "uploads are not set up" message, and existing images and defaults keep working.
- Two images with the same file name or an image with very odd proportions: both display without distortion (cover or contain as the slot defines).
- Reduced-motion users: progress and preview changes do not animate.
- A 360px-wide screen: the uploader and the slot list stay fully usable with no horizontal scroll.

## Requirements *(mandatory)*

### Functional Requirements

**Upload foundation**

- **FR-001**: Uploads MUST go to a hosted image service using a server-authorised, time-limited permission that is issued only after a session check; the service's secret MUST never be sent to the browser.
- **FR-002**: The allowed formats MUST be JPG, PNG and WebP, up to 5 MB. Format and size MUST be checked in the browser and verified again on the server before an image is attached to any record.
- **FR-003**: A saved image MUST hold its address, storage identifier, width, height and alt text. Alt text MUST be required before saving.
- **FR-004**: One reusable uploader MUST support drag and drop and click-to-choose, preview, upload progress, replace, remove, an alt text field, and clear error states, and MUST be fully keyboard-operable.
- **FR-005**: Replacing or removing an image MUST delete the previous stored file on a best-effort basis; a failure MUST be logged and MUST NOT block the save.
- **FR-006**: Public pages MUST display uploaded images in an optimised form (automatic format and quality), and the image host MUST be permitted for public rendering.
- **FR-007**: The setup MUST document the three required environment values in `.env.example`.

**Programs and courses**

- **FR-008**: The plain cover-image text field in both the program and course admin forms MUST be replaced by the uploader.
- **FR-009**: Records that have only an old URL string MUST keep rendering, with no migration required.
- **FR-010**: Public cards and detail pages MUST use the uploaded image, and fall back to the existing brand pattern when there is none.

**Site images**

- **FR-011**: A "Site images" page MUST be reachable from Settings, listing named slots, each with a label, a recommended size and a preview.
- **FR-012**: An empty slot MUST fall back to the current file shipped with the site, so a fresh database renders exactly as today.
- **FR-013**: Site image values MUST be read through a server-only, tag-cached read, and saving MUST refresh that cache so the public site updates without a redeploy.
- **FR-014**: If a public image fails to load, the slot's default file MUST be shown instead; a broken image MUST never appear.
- **FR-015**: Only the founder photo has a slot. The following MUST stay as code-owned files and get no slot: hero robot image and its eyes overlay, preloader image, logo and favicon, How it works videos (and their posters and the tablet frame image they sit in).

**Security and tests**

- **FR-016**: Every upload-permission request and every save (program, course, site images) MUST perform a server-side session check, and the existing unauthenticated-action test MUST be extended to cover them.
- **FR-017**: The admin UI MUST follow existing admin patterns, work at 360px wide, and respect reduced motion.

### Approved slot list

Approved: only one slot is editable. Everything else stays as code-owned files.

| Slot | Default file | Where it appears | Recommended size |
|------|--------------|------------------|------------------|
| Founder photo | `/founder.jpeg` | "Meet your mentor" section on the home page | 1122 x 1402 (4:5 portrait) |

Not editable (code-owned): Why Tareeq robot, default share (Open Graph) image, Our Way page (it has no images and none are added), hero robot and eyes overlay, preloader, logo and favicon, How it works videos, posters and tablet frame, and the unused `hero-mockup.png` and `robot-poster.png`. The slot list is a code-defined registry so more slots can be added later without redesign.

### Key Entities

- **Stored image**: address, storage identifier, width, height, alt text. Attached to a program, a course, or a site-image slot.
- **Site image slot**: a fixed, code-defined name, label, recommended size and default file; its current value is either empty or a stored image.
- **Legacy cover URL**: the existing plain text address on older program and course records; read-only fallback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can add a cover image to a program or course in under 1 minute, with no developer help.
- **SC-002**: The owner can replace the home page founder photo and see it live in under 2 minutes, with no redeploy.
- **SC-003**: 100% of existing programs and courses render the same as before the change, with no data migration.
- **SC-004**: 100% of upload and save requests without a valid session are refused (verified by test).
- **SC-005**: No broken image icon appears on any public page when a slot image fails to load.
- **SC-006**: Files that are not JPG/PNG/WebP or exceed 5 MB are rejected 100% of the time, in the browser and on the server.
- **SC-007**: The uploader and slot list are usable at 360px width with keyboard alone.

## Assumptions

- The owner is the only admin user; no per-role permissions are needed.
- Alt text is required per image and is free text, not auto-generated.
- Orphaned uploads (uploaded but never saved) are tolerated and not cleaned up in this feature.
- Existing legacy cover URLs are shown in the admin as the current image but do not get a stored-file identifier, so replacing one only deletes nothing.
- The Site images page starts with one slot (founder photo); it still lives at the same address and is built so slots can be added later.

## Out of Scope

Video upload, an image library browser, cropping or editing tools, gallery, blog, testimonials.
