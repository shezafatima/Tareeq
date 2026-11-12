# Contract: routes and UI

## Admin routes (all call `requireAdmin()` first; data via `safeLoad`, with `UnavailableNotice` on failure)

| Route | Content |
|-------|---------|
| `/admin/gallery` | H1 "Gallery", "New album" button. Grid of `GalleryAlbumAdminCard` (cover or placeholder, title, date label, "N photos", `PublishedToggle`, Edit link, Delete with `ConfirmDialog`: "Delete this album and its N photos? This cannot be undone." or "Delete this album?" when empty). `EmptyState` "No albums yet." |
| `/admin/gallery/new` | `GalleryAlbumForm` (title, date label, description, order, published). On success it goes to `/admin/gallery/<id>` |
| `/admin/gallery/[id]` | `notFound()` for an unknown id. Sections, top to bottom: album details (`GalleryAlbumForm`, edit mode, address shown read-only); consent notice, then `GalleryUploader`; photo grid of `GalleryPhotoCard` |

Sidebar (`AdminNav` `ENTRIES`): `{ href: "/admin/gallery", label: "Gallery", Icon: Images, isActive: under("/admin/gallery") }`, placed after Testimonials. Log event type: add `"gallery"` to `AdminEvent`.

### `GalleryUploader` (client: file and drag events, queue state, XHR progress, beforeunload)

- A notice above the zone reads "Only upload photos of children with parent/school consent." It uses a styled, static `role="note"` (not dismissible).
- The zone is a button that opens a `<input type="file" multiple accept="image/jpeg,image/png,image/webp">`, and it also accepts drops of many files. The hint is "JPG, PNG or WebP, up to 5 MB each."
- There is one row per file: name, state chip (Waiting / Uploading NN% with a `progressbar` / Done / Failed: reason), and Retry for failures. Done rows clear after the list refreshes, and a "Clear finished" button is offered.
- Uploads run 3 at a time. A file that fails `validateFile` fails at once with that message. An expired session shows "Your session has ended. Please sign in again."
- Not configured: the zone is disabled and shows `IMAGE_MESSAGES.notConfigured`.

### `GalleryPhotoCard` (server shell)

- The thumbnail is drawn at its proportions, with a "Cover" chip on the current cover and a "Missing alt text" warning chip (`StatusChip`, warning tone) when alt is blank.
- `PhotoDetailsForm` (client: input state and save feedback) has alt text (required-for-publish hint, 200 counter), caption (300), order, and Save.
- `PublishedToggle` takes `lockedReason="Add alt text before publishing."` when alt is blank.
- "Set as cover" is hidden on the current cover. Delete uses `ConfirmDialog` ("Delete this photo? This cannot be undone.").
- Grid: 1 column at 360px, 2 from `sm`, 3 from `xl`.

## Public routes

| Route | Rendering | Content |
|-------|-----------|---------|
| `/gallery` | static, `revalidate = 3600`, tag refresh | `PageHeader` (H1 "Gallery", with a short intro saying these are photos from our workshops). If there are albums, a grid of `GalleryAlbumCard` (cover 4:3 `object-cover`, title as a link to `/gallery/<slug>` covering the card, date label, "N photos"): 1 column at 360px, 2 from `sm`, 3 from `lg`. If there are none, a friendly panel: "Photos coming after our first workshop", plus a link to `/workshop` |
| `/gallery/[slug]` | `generateStaticParams` from `getPublishedAlbumSlugs()`, `revalidate = 3600`, unknown slugs rendered on demand | `notFound()` when `getAlbumBySlug` returns null. Header: H1 title, date label, description, "Back to all albums" link. `GalleryLightbox` wrapping `GalleryGrid` |
| `/gallery/[slug]` 404 | `not-found.tsx` | "We couldn't find that album", with a "See all photos" button to `/gallery` (same pattern as programs) |
| `/workshop` | unchanged rendering | `WorkshopGallery` after the booking button: H2 "From our workshops", 6 photos (2 columns, 3 from `sm`, square crops), and a "See all photos" button to `/gallery`. Renders nothing when there are no photos |

`generateMetadata` for `/gallery/[slug]`: `title` = album title, `description` = album description or "Photos from <title>, <dateText>.", `alternates.canonical`, and `openGraph.images` = `[{ url: optimizedUrl(cover.src, 1200), width, height, alt }]`; also Twitter `summary_large_image`. `/gallery` has static metadata.

### Navigation

`navItemsFor({ gallery: boolean })` in `src/lib/site.ts` (pure, unit-tested) returns Programs, Courses, [Gallery], Our Way. `SiteLayout` (async) passes the result to `Header` (to `DesktopNav` and `MobileMenuContent`) and to `Footer`. A failed read hides Gallery.

### `GalleryGrid` (server)

- `<ul class="columns-2 gap-3 sm:columns-3 lg:columns-4">`. Each `<li class="mb-3 break-inside-avoid">` holds a `<button type="button" data-photo-index={i} aria-label="Open photo i+1 of N: <alt>">` that wraps `SafeImage` (width and height from the record, grid `sizes`; `priority` for i < 2).
- Captions are not shown in the grid, only in the viewer.

### `GalleryLightbox` (client: state, key, pointer and focus handling, scroll lock)

- Props: `photos: PublicPhoto[]`, `children` (the server grid).
- Opens on click or activation of `[data-photo-index]`.
- Overlay: `fixed inset-0 z-50 bg-midnight/95`, `role="dialog" aria-modal="true" aria-label="Photo N of M"`.
- Controls (44px, visible focus): Close (top right), Previous and Next (sides; disabled at the ends), and a counter "N of M". The caption sits below the image in white text and is announced through an `aria-live="polite"` region.
- Keys: Escape closes, Left and Right move. A horizontal pointer swipe over 50px moves; a vertical gesture is ignored.
- Focus is trapped (`useFocusTrap`) and returns to the opening button. The body is scroll-locked while open.
- A fade on open and change, which `motion-reduce:transition-none` removes.
