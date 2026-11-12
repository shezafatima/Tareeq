# Data model: Admin gallery

## GalleryAlbum (collection `galleryalbums`)

| Field | Type | Rules |
|-------|------|-------|
| `_id` | ObjectId | |
| `title` | string | required, trimmed, 1–120 |
| `slug` | string | required, unique index, `SLUG_PATTERN`, ≤ 80; set on create from the title (made unique), never changed |
| `dateText` | string | required, trimmed, 1–40 (free text, e.g. "November 2026") |
| `description` | string? | trimmed, ≤ 500; unset when blank |
| `coverPhoto` | ObjectId? ref `GalleryPhoto` | optional; cleared when that photo is deleted (research R4) |
| `order` | number | integer 0–9999, default 0 |
| `published` | boolean | default false |
| `createdAt` / `updatedAt` | Date | timestamps |

Indexes: `{ slug: 1 }` unique; `{ published: 1, createdAt: -1 }`.

## GalleryPhoto (collection `galleryphotos`)

| Field | Type | Rules |
|-------|------|-------|
| `_id` | ObjectId | |
| `album` | ObjectId ref `GalleryAlbum` | required |
| `image` | sub-document | `imageSubSchema({ altRequired: false })`: `url` (Cloudinary https, from the server's verification), `publicId` (under `tareeq/gallery/`), `width`, `height` (positive integers from Cloudinary), `alt` (trimmed, ≤ 200, default `""`) |
| `caption` | string? | trimmed, ≤ 300; unset when blank |
| `order` | number | integer 0–9999; new photo = album max + 1 (1 when empty) |
| `published` | boolean | default false; validator: `true` requires non-blank `image.alt` (research R5) |
| `createdAt` / `updatedAt` | Date | timestamps |

Indexes: `{ album: 1, order: 1, createdAt: 1 }`; `{ published: 1, createdAt: -1 }`.

## Derived rules (pure, `src/lib/gallery/view.ts`, unit-tested)

- `isPhotoVisible(photo, album)`: the photo is published, its `image.alt` is non-blank after trimming, and its album is published.
- `isAlbumVisible(album, photos)`: the album is published and at least one photo passes `isPhotoVisible`.
- `resolveCover(album, photos, { publicOnly })`: returns the chosen `coverPhoto` when it is in `photos` (and visible when `publicOnly`). Otherwise it returns the first photo by `order, createdAt` that qualifies, or `null`.
- Photo sort: `order` ascending, then `createdAt` ascending. Album sort: `createdAt` descending, then `order` ascending. Latest: `createdAt` descending.

## State transitions

```text
Photo: uploaded (published=false, alt="")
  ├─ alt set ─────────► describable (published=false, alt≠"")
  │                       └─ publish ─► published (visible if album published)
  ├─ publish ─────────► REFUSED (alt required)
  published ─ alt cleared on save ─► published=false
  any ─ delete ─► record removed; album.coverPhoto unset if it pointed here; Cloudinary asset destroyed (best effort)

Album: created (published=false, no photos)
  ├─ publish ─► published (publicly visible only once ≥1 visible photo)
  └─ delete ─► photos deleted → album deleted → assets destroyed (best effort)
```

## Public view shapes (serialisable, returned by `src/lib/gallery/data.ts`)

```ts
type PublicPhoto = { id: string; src: string; width: number; height: number; alt: string; caption?: string };
type PublicAlbumCard = { slug: string; title: string; dateText: string; photoCount: number; cover: PublicPhoto };
type PublicAlbum = PublicAlbumCard & { description?: string; photos: PublicPhoto[] };
```

## Admin view shapes (`src/lib/admin/gallery-read.ts`, uncached)

```ts
type AdminAlbumCard = { id: string; slug: string; title: string; dateText: string; published: boolean; photoCount: number; cover: PublicPhoto | null };
type AdminAlbum = AdminAlbumCard & { description?: string; order: number; coverPhotoId: string | null; photos: AdminPhoto[] };
type AdminPhoto = { id: string; image: StoredImage; caption?: string; order: number; published: boolean; missingAlt: boolean; isCover: boolean };
```

## Migration

There are no existing records, so no migration or seed data is needed. The `storedImageSchema` refactor (research R3) produces an identical schema for the existing collections.
