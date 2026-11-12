# Data Model: Admin-managed blog

Two new MongoDB collections. Both models are in `src/lib/blog/model.ts` (`import "server-only"`), using the same patterns as `src/lib/courses/model.ts` and `src/lib/gallery/model.ts`.

## BlogCategory (collection `blog_categories`)

| Field | Type | Rules |
|-------|------|-------|
| `name` | String | required, trim, 1–60 |
| `slug` | String | required, **unique**, `SLUG_PATTERN`, ≤ `SLUG_MAX` (80). Generated from the name on create and made unique automatically (`nextFreeSlug`); an explicit slug is editable on update. |
| `order` | Number | required, integer, −9999…9999, default 0 |
| `createdAt` / `updatedAt` | Date | timestamps |

- **Index**: `{ order: 1, name: 1 }`.
- **Delete**: refused while `BlogPost.countDocuments({ category: id }) > 0` (drafts included), with `{ code: "in_use", count }`.

## BlogPost (collection `blog_posts`)

| Field | Type | Rules |
|-------|------|-------|
| `title` | String | required, trim, 1–120 |
| `slug` | String | required, **unique**, `SLUG_PATTERN`, ≤ 80, not `preview` |
| `excerpt` | String | trim, ≤ 200, default "" |
| `coverImage` | `imageSubSchema({ altRequired: false })` | optional; `{ url, publicId, width, height, alt }`. The url must be a Cloudinary URL. Alt is required to **publish**. |
| `content` | String | markdown, ≤ 100,000, default "" |
| `contentImages` | `[{ url, width, height }]` | sizes of body images in our image store (research R4); rebuilt on every save; ≤ 100 entries |
| `category` | ObjectId → BlogCategory | optional on a draft, required to publish |
| `tags` | [String] | ≤ 10; each trim, lower-case, 1–30; de-duplicated |
| `status` | String | enum `draft`, `published`; default `draft` |
| `publishedAt` | Date \| null | null until first publish; then kept (see transitions) |
| `readingTime` | Number | integer ≥ 1; recomputed on every save from `content` (200 words per minute, rounded up) |
| `seo.metaTitle` | String | trim, ≤ 70, default "" |
| `seo.metaDescription` | String | trim, ≤ 200, default "" |
| `featured` | Boolean | default false |
| `createdAt` / `updatedAt` | Date | timestamps |

**Indexes**: `{ status: 1, publishedAt: -1 }`, `{ category: 1 }`, `{ tags: 1 }`, `{ updatedAt: -1 }`. `slug` is unique.

**Model-level guard** (last line of defence; the action is the real check): a document saved with `status: "published"` must have a non-empty title, slug, excerpt and content, a category, and a cover with non-empty alt text. Update queries are guarded by the action, as with the gallery's alt gate.

### State transitions

```text
          save (status kept)                 save (status kept)
          ┌──────┐                           ┌──────┐
          ▼      │     publish               ▼      │
 (new) → DRAFT ──┴──────────────────────→ PUBLISHED ┘
          ▲   publishIssues(values) == {}      │
          │   publishedAt ??= now              │
          └────────────── unpublish ───────────┘
                          (publishedAt kept)
 DRAFT | PUBLISHED ── delete (confirmed) ──→ removed; cover file destroyed (best effort)
```

- **Publish** is refused with `{ code: "invalid", fieldErrors }` when `publishIssues` is not empty. The post keeps its previous status and nothing is written.
- **Publish date edit**:
  - When the owner submits a `publishedAt` date (`YYYY-MM-DD`) that differs from the stored date's Asia/Karachi calendar day, it is stored as 09:00 Asia/Karachi (04:00Z) of that day. The same day keeps the stored timestamp.
  - On a post that was never published, the date is stored and kept at first publish.
  - The spec excludes future-dated (scheduled) publishing. A future date is accepted but has no effect on visibility, so a published post with a future date shows immediately.
  - Validation rejects dates more than one year ahead to catch typos.

### Derived values (pure, `src/lib/blog/view.ts`)

- `readingMinutes(markdown) → number`
- `isPubliclyVisible(post) → status === "published"` (the spec has no other gates)
- `pickHero(cards) → newest card with featured`, or null
- `filterCards(cards, { category, tag })`, `paginate(list, page, 9) → { items, page, pages, total }`
- `rankRelated(post, cards, 3)` puts the same category first (newest first), then others by shared-tag count (descending), then newest. It excludes the post itself.
- `effectiveSeo(post) → { title: seo.metaTitle || title, description: seo.metaDescription || excerpt }`

## Shapes passed to pages (plain, JSON-safe; `src/lib/blog/view.ts`)

```ts
type BlogCategoryRef = { name: string; slug: string };
type PublicPostCard = {
  slug: string; title: string; excerpt: string;
  cover: StoredImage | null; category: BlogCategoryRef | null; tags: string[];
  publishedAt: string; updatedAt: string; readingTime: number; featured: boolean;
};
type PublicPost = PublicPostCard & {
  content: string;
  contentImages: { url: string; width: number; height: number }[];
  seo: { metaTitle: string; metaDescription: string };
};
type PublicCategory = BlogCategoryRef & { order: number; postCount: number }; // published posts only
type RenderedContent = {
  segments: ({ kind: "html"; html: string } | { kind: "image"; src: string; alt: string; width: number; height: number })[];
  headings: { id: string; text: string; level: 2 | 3 }[];
};
```

## Admin form values (`src/lib/admin/blog-schema.ts`)

```ts
type BlogPostFormValues = {
  title: string; slug: string; slugAuto: boolean; excerpt: string;
  categoryId: string;              // "" = none
  tags: string[]; coverImage: StoredImage | null; featured: boolean;
  publishedAt: string;             // "YYYY-MM-DD" or ""
  content: string;
  metaTitle: string; metaDescription: string;
  status: "draft" | "published";   // the TARGET status (research R9)
};
// Blog categories reuse CategoryFormValues / parseCategory from courses-schema (description ignored), research R11.
```

## Browser draft copy (not stored on the server)

- **Key**: `localStorage["tareeq:blog-draft:<postId | 'new'>"]`
- **Value**: `{ v: 1, savedAt: ISO string, values: BlogPostFormValues }`

The copy is only read back when `v === 1` and the values pass a shape check. Anything else is ignored and removed.

## Migration and rollback

- **Migration**: none. The collections are new and empty, with no seed data.
- **Rollback**: remove the routes and the nav flag. The collections can be dropped without affecting other features.
- **Existing code edits** (`BASE_SANITIZE` export, `CategoryManager`/`FilterBar` props, `UPLOAD_SCOPES`) leave current output unchanged. This is verified by the existing unit tests plus manual checks in quickstart.md.
