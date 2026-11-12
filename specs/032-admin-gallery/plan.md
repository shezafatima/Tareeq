# Implementation Plan: Admin gallery

**Branch**: `032-admin-gallery` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/032-admin-gallery/spec.md`

## Summary

This adds two MongoDB collections, `GalleryAlbum` and `GalleryPhoto`, managed at `/admin/gallery`, and shows them at `/gallery`, `/gallery/[slug]` and in a new latest-photos section on `/workshop`.

- **Uploads** reuse the 030 signed flow with a new `"gallery"` scope. The XHR upload is extracted into a shared client helper, so the new multi-file `GalleryUploader` (3 parallel uploads, per-file state, retry) and the existing `ImageUploader` share it. Every file is verified at Cloudinary on the server before its record is created.
- **Alt-text gate**: alt text is required to publish, enforced in the UI, the action filter, the update action and the model, as with the 031 consent gate.
- **Public reads** are cached under one tag, `"gallery"`, which every action refreshes.
- **Navigation**: the nav shows Gallery only when an album is visible, through one read in `SiteLayout` passed down as props.
- **Lightbox**: built in-house on the existing `useFocusTrap`, wrapping a server-rendered grid. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 5, Node 22
**Primary Dependencies**: Next.js 16.4 (App Router, Server Actions, `unstable_cache`), React 19.3, Mongoose 9.11, zod 4.6 (`zod/mini`), cloudinary 2.11 (server only), next-auth 5 beta, `@phosphor-icons/react`, Tailwind 4. **No new dependencies.**
**Storage**: MongoDB, new collections `galleryalbums` and `galleryphotos`. Image files in Cloudinary under `tareeq/gallery/`.
**Testing**: `node --test` unit tests (`npm run test:unit`), `npm run test:admin-guard`, manual browser checks (quickstart.md)
**Target Platform**: Web, mobile-first (360px+)
**Project Type**: Single Next.js web app (`src/`)
**Performance Goals**: Mobile Lighthouse targets of Principle VI on `/gallery` and `/gallery/[slug]`; LCP under 2.5s (SC-008). Public pages are static and refreshed by tag.
**Constraints**: Existing admin UI patterns; in-house lightbox; 360px with no horizontal scroll; reduced motion respected; 44px targets; no personal data in logs
**Scale/Scope**: Tens of albums, hundreds of photos, one owner

## Constitution Check

*GATE: passed before Phase 0. Re-checked after Phase 1 design: still passes.*

| Principle | Status | How |
|-----------|--------|-----|
| I Mobile-first | ✅ | Album cards 1 column, grid 2 columns, admin cards 1 column at 360px; lightbox controls 44px; swipe support |
| II Reusable components | ✅ | Upload XHR extracted to `upload-client.ts` (now used twice); reuses `PublishedToggle`, `StatusChip`, `ConfirmDialog`, `EmptyState`, `UnavailableNotice`, `SafeImage`, `PageHeader`, `Button`, `useFocusTrap`; `storedImageSchema` becomes a factory instead of being copied |
| III Brand tokens | ✅ | Existing token classes only (midnight overlay, white text on dark, saffron only as accent) |
| IV Accessible | ✅ | Alt text is required to publish; one H1 per page; the lightbox is a labelled modal dialog with focus trap and focus return; Esc and arrows work; the caption is announced through a live region; the upload status uses a progressbar |
| V Protect data | ✅ | `requireAdmin()` on pages; `withAdmin` on every action and on the upload signature; server re-validation; assets verified at Cloudinary; consent notice shown on upload; logs carry ids and error names only |
| VI Fast | ✅ | `next/image` with explicit `sizes`, `f_auto,q_auto`, lazy below the fold, `priority` only above it; static pages with tag refresh; the workshop section adds no client JS |
| VII Small verified steps | ✅ | Four milestones below, each ending with lint, build, tests and a browser check |
| VIII Hero untouched | ⚠️ stated | `Header` gains an `items` prop (research R9). Header markup and styles are unchanged, and the hero itself is not touched. **Flagged for approval.** |
| IX No surprise deps | ✅ | None added |
| X Safest option | ✅ | No seed data; unpublished by default; gallery hidden when empty; nav failure hides the link; consent notice on upload |
| XI Server components by default | ✅ | Pages, cards, grid and workshop section are server components. Client leaves: `GalleryUploader` (file events, queue, XHR), `PhotoDetailsForm` (input state), `GalleryAlbumForm` (form state), `GalleryLightbox` (keys, pointer, focus; wraps the server grid as `children`), `AlbumDeleteButton` (confirm dialog state) |

## Project Structure

### Documentation (this feature)

```text
specs/032-admin-gallery/
├── plan.md
├── research.md          # R1–R18 decisions
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── data-access.md   # reads + Server Actions + guard test
│   └── routes-and-ui.md # pages, sidebar, components, lightbox
└── tasks.md             # /sp.tasks
```

### Source Code

```text
src/lib/gallery/
├── model.ts                 # NEW  GalleryAlbumModel, GalleryPhotoModel
├── data.ts                  # NEW  cached public reads (tag "gallery")
└── view.ts                  # NEW  pure: visibility, resolveCover, sorting, toPublicPhoto
src/lib/images/
├── schema.ts                # EDIT imageSubSchema({ altRequired }) factory; storedImageSchema unchanged
└── upload-client.ts         # NEW  uploadToCloudinary() (extracted from ImageUploader)
src/lib/cloudinary/server.ts # EDIT UPLOAD_SCOPES += "gallery"
src/lib/admin/
├── gallery-schema.ts        # NEW  pure rules for forms + actions
├── gallery-read.ts          # NEW  uncached admin reads
├── gallery-actions.ts       # NEW  9 actions (contracts/data-access.md)
└── log.ts                   # EDIT AdminEvent += "gallery"
src/lib/site.ts              # EDIT navItemsFor({ gallery })
src/app/admin/(panel)/gallery/
├── page.tsx, new/page.tsx, [id]/page.tsx       # NEW
src/app/(site)/gallery/
├── page.tsx                                    # NEW
└── [slug]/page.tsx, [slug]/not-found.tsx       # NEW
src/app/(site)/layout.tsx    # EDIT async; read hasPublicGallery once, pass nav items
src/app/(site)/workshop/page.tsx                # EDIT render <WorkshopGallery />
src/components/admin/
├── GalleryAlbumAdminCard.tsx  # NEW (server)
├── AlbumDeleteButton.tsx      # NEW (client)
├── GalleryAlbumForm.tsx       # NEW (client)
├── GalleryUploader.tsx        # NEW (client)
├── GalleryPhotoCard.tsx       # NEW (server)
├── PhotoDetailsForm.tsx       # NEW (client)
├── ImageUploader.tsx          # EDIT use uploadToCloudinary (behaviour unchanged)
└── AdminNav.tsx               # EDIT Gallery entry
src/components/sections/gallery/
├── GalleryAlbumCard.tsx       # NEW (server)
├── GalleryGrid.tsx            # NEW (server)
├── GalleryLightbox.tsx        # NEW (client)
└── GalleryEmpty.tsx           # NEW (server)
src/components/sections/WorkshopGallery.tsx     # NEW (server)
src/components/layout/{Header,DesktopNav,MobileMenuContent,Footer}.tsx  # EDIT take `items` prop
scripts/admin-guard-test.mts                    # EDIT REQUIRED_ACTIONS + arg sets
tests/unit/gallery-schema.test.ts               # NEW
tests/unit/gallery-view.test.ts                 # NEW
tests/unit/site-links.test.ts                   # EDIT navItemsFor cases
```

**Structure Decision**: Single Next.js project. It mirrors `src/lib/testimonials/` + `src/lib/admin/testimonials-*` (research R1), with public gallery components grouped under `components/sections/gallery/`, like `sections/programs/`.

## Milestones

1. **Data, rules and public reads**:
   - `imageSubSchema` factory, models, `view.ts`, `gallery-schema.ts`, `data.ts`, `gallery-read.ts`, `log.ts`.
   - Check: unit tests (visibility, cover fallback, sorting, limits, alt-gate rules) pass; build is clean; existing program, course and site-image saves still work.
2. **Actions, upload scope and guard**:
   - `"gallery"` scope, `upload-client.ts` extraction (with `ImageUploader` refactored, behaviour unchanged), the 9 actions, guard-test entries.
   - Check: `test:admin-guard` passes; replacing the founder photo in Settings → Images still works with progress.
3. **Admin UI**:
   - Sidebar entry, albums page and card, album form, new and album pages, `GalleryUploader`, photo cards with details, toggle, cover and delete.
   - Check: quickstart steps 2–11, 15–16 at 360/390/1440px.
4. **Public site**:
   - `navItemsFor` and nav props, `/gallery`, `/gallery/[slug]` with grid, lightbox and metadata, 404, `WorkshopGallery`.
   - Check: quickstart steps 1, 8–9, 12–14, 17. Lighthouse mobile on `/gallery/<slug>`. The home hero looks identical.

## Risks

- **Header and nav prop change touches the shell around the hero** (Principle VIII). Mitigation: no markup or style change, and a visual diff of the home page at 390/1440 in milestone 4. It is flagged here for approval.
- **`ImageUploader` refactor regresses existing uploads**. Mitigation: a pure extraction with the same callbacks; re-test program cover, course cover and founder photo in milestone 2.
- **The layout becoming async adds a database read to every public render**. Mitigation: the read is cached under the `"gallery"` tag (hourly plus on change), and a failure returns `false` without throwing.

## Follow-ups

- Album sort is `createdAt` descending as the spec states (FR-016), so the album order number only breaks ties. If the owner should control album order, change the sort to `order` ascending, then `createdAt` descending (a one-line change in `view.ts`/`data.ts`).
- The input named the cover field `coverImage` (an embedded image). The plan stores `coverPhoto` (a photo reference) instead (research R4); the behaviour is unchanged.

## Complexity Tracking

No constitution violations. Principle VIII is not violated (the hero is unchanged), but the shared Header change is stated as the constitution requires.
