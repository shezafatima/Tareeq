# Contract: data access, Server Actions and guard

All Server Actions return `ActionResult` from `src/lib/admin/result.ts`, are defined through `withAdmin` and re-validate on the server.

- **Failure codes** (existing): `unauthorized`, `invalid` (+`fieldErrors`), `not_found`, `conflict` (+`fieldErrors.slug`), `unavailable`, `in_use` (+`count`), `not_configured`, `image_rejected`.
- **Logging**: `logAdmin("blog", outcome, id)` only (AdminEvent gains `"blog"`). Titles, content and search text are never logged.

## Public reads — `src/lib/blog/data.ts` (`import "server-only"`)

| Function | Returns | Cache |
|----------|---------|-------|
| `getPublishedPosts({ category?, tag?, page })` | `{ hero: PublicPostCard \| null; posts: PublicPostCard[]; page; pages; total; filter: { category: PublicCategory \| null; tag: string \| null; unknown: boolean } }`. 9 per page. The hero appears only when unfiltered and page = 1, and is excluded from `posts` when unfiltered (research R8). | derived from `blog:cards` (tag `blog`) |
| `getPostBySlug(slug)` | `PublicPost \| null` (null for a malformed, unknown or draft slug) | key `["blog:post", slug]`, tags `["blog", "post:<slug>"]` |
| `getRelatedPosts(post, n = 3)` | `PublicPostCard[]` (`rankRelated`) | derived from `blog:cards` |
| `getBlogCategories()` | `PublicCategory[]` with `postCount ≥ 1`, in order then by name | key `blog:categories`, tag `blog` |
| `getPublishedPostSlugs()` | `string[]`; `[]` on a failed read (build-safe) | derived |
| `getFeedPosts(n = 20)` / `getSitemapPosts()` | cards newest first / `{ slug, updatedAt }[]` | derived |
| `hasPublishedPostsSafe()` | `boolean`; false on a failed read (nav) | derived |
| `loadPublishedPosts(args)` | as `getPublishedPosts` or `null` when unavailable. In production a failed read rethrows, so the last good page is kept (same rule as `loadPublishedAlbums`). | — |

All cached reads use `revalidate: 3600`. A failed read throws inside the cache function, so the failure is never cached.

## Admin reads — `src/lib/admin/blog-read.ts` (uncached, called after `requireAdmin()`)

- `listAdminPosts({ status?, category?, q? }) → AdminPostRow[]` (≤ 200, `updatedAt` desc; `q` is regex-escaped, case-insensitive on the title)
- `getAdminPost(id) → (BlogPostFormValues & { id; status; updatedAt; publishedAt: string | null; contentImages }) | null`
- `listAdminBlogCategories() → AdminCategory[]` (with `postCount` of all statuses; same shape `CategoryManager` takes)

## Server Actions

### `src/lib/admin/blog-actions.ts`

**`saveBlogPost({ id: string | null, values: BlogPostFormValues })` → `ActionResult<{ id: string; slug: string; status; publishedAt: string | null; updatedAt: string; readingTime: number }>`**

1. Validate the input: `parseBlogPost(values)` gives `invalid` + `fieldErrors`. If `values.status === "published"`, `publishIssues` must also be empty, otherwise `invalid` + `fieldErrors`.
2. Check the category exists when given, otherwise `invalid` with `fieldErrors.categoryId`.
3. Resolve the slug:
   - **Slug**: on create with `slugAuto`, use `nextFreeSlug` on a collision; on create without it, or on update, a slug used by another post gives `conflict` with `fieldErrors.slug`. A duplicate-key race gives the same result.
4. Verify the images:
   - **Cover**: `resolveImageChange(current?.coverImage, values.coverImage)`. A Cloudinary rejection gives `image_rejected`, an outage gives `unavailable`, and missing configuration gives `not_configured`.
   - **Body images**: rebuild `contentImages` (research R4). A failed lookup is logged and never fails the save.
5. Write the post:
   - **Write**: `readingTime` is recomputed. `publishedAt` follows the data-model rules. Create uses `create`; update uses `updateOne({ _id: id }, …, { runValidators: true })`, and an unknown id gives `not_found`.
   - **After the write**: `deleteReplaced(coverChange)`, then `revalidateTag("blog")`, `revalidateTag("post:<new slug>")`, `revalidateTag("post:<old slug>")` when it changed, and `revalidatePath("/admin/blog")`.

**`deleteBlogPost({ id })` → `ActionResult`**

- An invalid id gives `invalid`, and a missing post gives `not_found`.
- Deletes the post, then destroys the cover file (best effort, logged on failure) and refreshes the `blog` and `post:<slug>` tags and `/admin/blog`. Body images are kept.

**`renderBlogPreview({ markdown, sizes })` → `ActionResult<RenderedContent>`**

- Input limits: `markdown` ≤ 100,000 characters, otherwise `invalid`. `sizes` is `Record<url, { width, height }>` with ≤ 100 entries; only positive integers ≤ 10,000 are used and the rest are ignored.
- There is no database or Cloudinary access. It is a pure call to `renderBlogMarkdown`.

### `src/lib/admin/blog-categories-actions.ts`

These mirror `course-categories-actions.ts`: `createBlogCategory(values)`, `updateBlogCategory({ id, values })`, `setBlogCategoryOrder({ id, order })`, `deleteBlogCategory({ id })`.

- Each refreshes the `blog` tag, `/admin/blog` and `/admin/blog/categories`. Category names appear on every card, so every post tag is covered by `blog`.
- `deleteBlogCategory` returns `in_use` with `count` (posts of any status).

### `src/lib/admin/images-actions.ts` (existing)

`signUpload({ scope: "blog" })` works once `UPLOAD_SCOPES` includes `"blog"`, and is refused without a session like every scope.

## Renderer — `src/lib/blog/markdown.ts` (pure; relative imports)

`renderBlogMarkdown(markdown: string, sizes: Record<string, { width; height }>) → RenderedContent`. Its guarantees, each with a unit test in `tests/unit/blog-markdown.test.ts`:

- [ ] `<script>`, `<iframe>`, `<img onerror>` and inline `<div>` raw HTML produce no HTML output. Raw HTML text is dropped, never rendered.
- [ ] `[x](javascript:alert(1))` and `data:` links lose their `href`. Allowed schemes are `http`, `https` and `mailto`.
- [ ] An image from another host is dropped, and an image from our cloud under `tareeq/` is kept.
- [ ] A stand-alone image paragraph with a known size becomes an `image` segment. An unknown size or an inline image becomes a lazy `<img>` with `alt` inside an HTML segment.
- [ ] `# A` renders as `<h2 id="a">`. Duplicate headings get unique ids (`a`, `a-2`), and `headings` lists only h2/h3, in order.
- [ ] A GFM table is wrapped in `<div class="blog-table">`. `class` values other than `blog-table` and `language-*` are stripped.
- [ ] Links get `rel="noopener noreferrer"`.
- [ ] `renderMarkdown` (programs) output is unchanged for the existing test cases.

## Guard test — `scripts/admin-guard-test.mts` (edit)

- **`REQUIRED_ACTIONS`**: add `saveBlogPost`, `deleteBlogPost`, `renderBlogPreview`, `createBlogCategory`, `updateBlogCategory`, `setBlogCategoryOrder` and `deleteBlogCategory`. Each must return `{ ok:false, code:"unauthorized" }` with no session and no database or Cloudinary call.
- **Argument sets**: add `[{ id: null, values: { title: "x", status: "published" } }]`, `[{ markdown: "# x", sizes: {} }]` and `[{ scope: "blog" }]`.
- **Part B**: add `PUBLIC_ROUTES = new Set(["src/app/(site)/blog/rss.xml/route.ts"])`. For each public route, assert that the source exports only `GET` and has no import from `@/lib/admin` or `src/lib/admin`. Any other route still fails.
- **Preview pages** are pages, not actions. They are protected by `requireAdmin()` and checked manually (quickstart.md step 14).
