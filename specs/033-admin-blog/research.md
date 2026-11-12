# Research: Admin-managed blog

Decisions for `specs/033-admin-blog/spec.md`. Each one was checked against the current code. The paths named are the ones inspected.

## R1. Module layout mirrors gallery and courses

- **Decision**: `src/lib/blog/` holds `model.ts`, `data.ts` (cached public reads), `view.ts` (pure rules) and `markdown.ts` (renderer). `src/lib/admin/blog-*.ts` holds `blog-schema.ts`, `blog-read.ts`, `blog-actions.ts` and `blog-categories-actions.ts`. Public components go in `src/components/sections/blog/`, admin components in `src/components/admin/`.
- **Rationale**: This matches `src/lib/gallery/*` + `src/lib/admin/gallery-*` (032) and `src/lib/courses/*` (025). Pure modules use relative `.ts` imports, so `node --test` can load them, as `src/lib/admin/slug.ts` does.
- **Alternatives**: one `src/lib/blog/` folder holding the admin code too. Rejected because it breaks the convention the guard test relies on: it scans `src/lib/admin/*-actions.ts`.

## R2. Renderer: extend the existing one, don't fork it

- **Decision**: `src/lib/programs/markdown.ts` exports its allowlist as `BASE_SANITIZE` (a pure extraction; `renderMarkdown` output is unchanged). `src/lib/blog/markdown.ts` builds on it with the same `marked` + `sanitize-html`:
  - **Added tags**: `img`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `div` (class `blog-table` only), `del`.
  - **Added attributes**: `id` on `h2`–`h4`, `align` on `th`/`td` (`left|center|right`), `class` on `code` (`language-*` only), `src`/`alt`/`width`/`height`/`loading`/`decoding`/`srcset`/`sizes` on `img`.
  - **Image filter**: `exclusiveFilter` drops any `img` whose `src` is not `https://res.cloudinary.com/<cloud>/image/upload/…/tareeq/…`.
  - **Raw HTML**: still never rendered. `marked`'s `html` tokens are replaced with an empty string by a renderer override, so the sanitizer only ever sees our own output.
- **Rationale**: The spec requires "reuse the existing renderer and sanitizer" and program output must not change (FR-020). One allowlist base means a later security fix applies to both.
- **Alternatives**: changing `renderMarkdown` itself. Rejected because it would change program pages. A new sanitizer such as DOMPurify was also rejected: it is a new dependency (Principle IX).

## R3. Body images through `next/image`: render to segments

- **Decision**: `renderBlogMarkdown(markdown, sizes)` returns `{ segments, headings }`.
  - The renderer walks `marked.lexer()` top-level tokens.
  - A paragraph made of exactly one image becomes `{ kind: "image", src, alt, width, height }` when its size is known.
  - Every other token is rendered with `marked.parser([token])`, sanitized, and merged into adjacent `{ kind: "html", html }` segments.
  - `BlogProse` (no `"use client"`, no hooks, so it works in server and client trees) renders HTML segments in `display: contents` wrappers and image segments with `next/image` (`sizes="(min-width: 1024px) 720px, 100vw"`, lazy).
  - Inline images inside text, or images of unknown size, fall back to a sanitizer-produced `<img loading="lazy" decoding="async">` with `optimizedUrl()` and a `srcset`.
- **Rationale**: The input and Principle VI both ask for `next/image`. Splitting at top-level tokens keeps paragraphs intact, and stand-alone images are the normal case (the image button inserts on its own line).
- **Alternatives**: turning `<img>` into an optimised `<img srcset>` inside one HTML string. Simpler, but it skips `next/image` and would need a Principle VI exception. Writing a full markdown-to-React renderer was rejected as too much code.

## R4. Image sizes come from the server, stored per post

- **Decision**: The post stores `contentImages: [{ url, width, height }]`. On save, `saveBlogPost` extracts image URLs from the content and keeps the stored sizes of URLs it already knows.
  - For new URLs in our cloud and under `tareeq/`, it calls the new `lookupAssetSize(publicId)` in `src/lib/cloudinary/server.ts`. This is read-only: unlike `verifyAsset` it never destroys anything.
  - It caps lookups at 20 per save.
  - A failed lookup is logged by error name and the image falls back (R3); the save still succeeds.
  - URLs no longer in the content are dropped from the list.
- **Live preview**: the client passes a `sizes` map made of the stored sizes plus the sizes of images uploaded in this session (known from the upload response). The preview is display-only, so a hint cannot corrupt stored data.
- **Rationale**: Stored data stays verified, the Cloudinary admin API is only called for genuinely new images, and preview and public page render identically (SC-006).
- **Alternatives**: trusting client-sent sizes on save (unverified data in the store), or a lookup on every render (API rate limits).

## R5. Live preview through an admin Server Action

- **Decision**: `renderBlogPreview({ markdown, sizes })` (`withAdmin`) returns `{ segments, headings }`. The editor calls it 400 ms after typing stops, drops stale responses with a request counter, and keeps showing the last good preview while a request is in flight. Markdown is limited to 100,000 characters.
- **Rationale**: "Same renderer and styles" (FR-010) is guaranteed because it *is* the same server function. `sanitize-html` depends on `postcss`/`htmlparser2` and is not meant for the browser bundle.
- **Alternatives**: bundling `marked` + `sanitize-html` into the admin client. Rejected for bundle size and `postcss` Node built-ins, and because the two sides could drift.

## R6. Headings, anchors and table of contents

- **Decision**: A heading renderer override:
  - turns `h1` into `h2` (as `renderMarkdown` does);
  - gives `h2`/`h3`/`h4` an `id` from `slugify(text)`, made unique with `-2`, `-3`, … and prefixed `s-` when empty or when it starts with a digit;
  - collects `{ id, text, level }` for `h2`/`h3` into `headings`.
- `BlogToc` (server) renders the list at `lg` and up when there are 2 or more headings. `TocHighlight` (client: `IntersectionObserver`) marks the current section with `aria-current="location"`. Jumps use CSS `scroll-behavior: smooth` only under `prefers-reduced-motion: no-preference`, with `scroll-margin-top` clearing the sticky header.
- **Rationale**: one pass produces both anchors and the table of contents, so they cannot disagree.

## R7. One cached list of published post cards

- **Decision**: `readPublishedCards()` (`unstable_cache`, key `blog:cards`, tags `["blog"]`, revalidate 3600) returns every published post without its content. Category is populated as `{ name, slug, order }`. Sorted by `publishedAt` descending, then `createdAt` descending.
  - Built from it in memory: `getPublishedPosts({ category, tag, page })`, the featured hero, `getRelatedPosts`, `getBlogCategories()` (with published counts), `hasPublishedPosts`, the sitemap and RSS.
  - `getPostBySlug(slug)` is cached separately under the tags `["blog", "post:<slug>"]` and includes content.
- **Rationale**: The scale is tens to low hundreds of posts, and one owner. A single cache entry keeps the hero, the filters, related posts and the nav consistent with each other. Reads are cheap.
- **Alternatives**: separate Mongo queries per view. More code, more cache keys that can disagree for a moment, and no benefit at this scale. Revisit above about 1,000 posts.

## R8. Hero and pagination arithmetic

- **Decision**: The hero is the newest published post with `featured: true`, shown only on unfiltered page 1. When no filter is active, the hero post is removed from the grid list on every page, so totals and page counts stay consistent.
  - `?page` is parsed as an integer: non-numeric means 1, and out of range shows "No posts found".
  - Tags are matched case-insensitively, since they are stored lower-cased.
  - An unknown category or tag shows "No posts found".
- **Rationale**: This follows the spec (User Story 6). Pure functions in `view.ts` make it unit-testable.

## R9. Save, publish and unpublish are one action

- **Decision**: `saveBlogPost({ id: string | null, values })`, where `values.status` is the *target* status. The editor buttons map to it:
  - **Save draft / Save changes** keep the current status.
  - **Publish** sends `"published"`.
  - **Unpublish** sends `"draft"`.
  - Publishing re-runs the publish rules on the server (FR-014).
  - `publishedAt` is set to now on the first publish and otherwise kept.
  - An edited date `YYYY-MM-DD` is stored at 09:00 Asia/Karachi (04:00Z) of that day, and an unchanged date keeps its exact timestamp.
  - Create returns `{ id }`; the editor then replaces the address `/admin/blog/new` with `/admin/blog/<id>`.
- **Rationale**: Publish always saves what is on screen, so it never publishes stale fields. There are fewer endpoints to guard.
- **Alternatives**: a separate `setBlogPostPublished`. Rejected because it could publish an older saved version than the one on screen.

## R10. Cover image and deletion

- **Decision**: The cover uses the existing `ImageUploader` with the new `"blog"` scope plus `resolveImageChange` and `deleteReplaced` from `src/lib/admin/images-verify.ts`, as programs and courses do: verified at Cloudinary, and the replaced file is deleted after the write.
  - Deleting a post removes its cover file, best effort, like `deleteProgram` and `deleteCourse`.
  - Body images are **kept**, because an image URL may have been reused in another post.
- **Spec correction**: The spec assumed covers were never deleted; existing actions do delete them. The spec assumption is updated to match.
- **Upload scope**: `UPLOAD_SCOPES` gains `"blog"` (folder `tareeq/blog`). The in-body image button uses the same `signUpload` + `uploadToCloudinary` helpers.

## R11. Categories: generalise `CategoryManager`, don't copy it

- **Decision**: `CategoryManager` takes `actions` (`create`, `update`, `setOrder`, `remove`, passed as Server Action props from the page), `noun` (`["course", "courses"]` / `["post", "posts"]`) and `withDescription` (true for courses). The course categories page passes its existing actions unchanged.
  - The blog category actions accept the same `CategoryFormValues` and parse with the same `parseCategory`. `description` is ignored, because the blog category has none (spec FR-001).
  - `deleteBlogCategory` counts posts of both statuses and returns `in_use` with `count`.
- **Rationale**: Principle II: the second use is the time to extract. Behaviour for courses is unchanged.

## R12. Admin list filters: generalise `FilterBar`

- **Decision**: Extract `listHref(basePath, keys, params)` from `leadsHref` in `src/lib/admin/leads-params.ts`; `leadsHref` becomes a thin wrapper, so its output is unchanged and existing tests guard it. `FilterBar` takes `basePath` + `keys` in place of `type`, and the two leads pages pass `SUBMISSIONS_PATH[type]` and `KEYS[type]`. The blog list uses `status`, `category` and `q`.
  - The admin blog list is not paginated: it shows up to 200 posts, newest updated first, a size one owner will not exceed soon.
- **Rationale**: This reuses the search debounce, the URL sync and the "Clear filters" behaviour without a copy.

## R13. Editor building blocks (client leaves)

- **Decision**:
  - **`BlogPostEditor`**: form state, dirty tracking, save/publish/delete and restore.
  - **`MarkdownEditor`**: a textarea with a toolbar. It handles keyboard shortcuts (Ctrl/⌘+B, I, K) and keeps the selection and focus after each action. Its text transforms are pure, in `src/lib/blog/editor-format.ts`: wrap the selection, prefix lines, insert at the cursor.
  - **`MarkdownImageButton`**: pick a file, `validateFile`, sign and upload, then an alt-text dialog built on `ConfirmDialog`/`Drawer` patterns with `useFocusTrap`, then insert.
  - **`TagInput`**: chips added on Enter or comma, Backspace on an empty input removes the last chip, de-duplicated and lower-cased.
  - **`SeoPanel`**: counters at 60/160 with soft warnings, hard limits 70/200, and a snippet preview.
  - **`BlogPreviewPane`**: R5. Side by side from `lg`; below it, Write/Preview tabs built as an ARIA tablist.
- **Unsaved changes**: the existing `useUnsavedChanges(dirty)`.
- **Rationale**: Each needs state or browser APIs (Principle XI), and the pure parts are testable.

## R14. Browser draft copy

- **Decision**: `src/lib/blog/draft-storage.ts` (pure, every access wrapped in `try/catch`):
  - The key is `tareeq:blog-draft:<id|new>` and the value is `{ v: 1, savedAt, values }`. It is written 2 s after the last change while the form is dirty.
  - On load, restore is offered when the copy is valid, differs from the server values, and `savedAt` is later than the post's `updatedAt`.
  - Discard removes it, and so does a successful save. A copy for an id that no longer exists is dropped when its editor 404s.
  - "new" copies are moved to the id key after the first save.
- **Rationale**: FR-015 and User Story 4. Storage failures are silent.

## R15. Preview route

- **Decision**: `src/app/(site)/blog/preview/[id]/page.tsx`:
  - It is `dynamic = "force-dynamic"` and calls `requireAdmin()` first, so a signed-out visitor is redirected before any read.
  - It sets `robots: { index: false, follow: false }`.
  - It reads uncached with `getAdminPost(id)` and renders the same `BlogPostView` as `/blog/[slug]`, plus `PreviewBanner`.
  - `robots.ts` also disallows `/blog/preview`.
  - The slug `preview` is reserved, so `/blog/preview` can never be a post.
- **Rationale**: Being inside `(site)` gives the real header, footer and styles: "exactly as the public page".

## R16. Sitemap, robots and RSS

- **Decision**:
  - **Sitemap**: new `src/app/sitemap.ts` (a metadata route, `revalidate = 3600`). It lists `/`, `/programs`, `/courses`, `/workshop`, `/our-way`, `/register`, `/gallery` (only when it has content) and `/blog` (only when it has posts), plus published programs, courses, gallery albums and blog posts through the existing safe slug readers. Blog entries carry `lastModified = updatedAt`.
  - **Robots**: `robots.ts` adds `sitemap` and `/blog/preview` to the disallow list.
  - **RSS**: a Route Handler at `src/app/(site)/blog/rss.xml/route.ts` (GET only, `revalidate = 3600`) builds RSS 2.0 by hand with XML escaping, newest 20 published posts, excerpt as the description. The blog pages link it with `alternates.types["application/rss+xml"]`.
  - **Guard test**: part B allow-lists the RSS route as a **public read-only** route and asserts the file exports only `GET` and imports nothing from `src/lib/admin/`.
  - **Base URL**: all absolute URLs come from `NEXT_PUBLIC_SITE_URL`, already used for `metadataBase`, via a small `siteUrl(path)` helper in `src/lib/seo.ts`.
- **Rationale**: No sitemap exists today (spec Assumptions). The guard test fails on any unlisted Route Handler, so the allow-list entry is required.

## R17. Navigation

- **Decision**: `navItemsFor({ gallery, blog })` adds Blog last: Programs, Courses, Gallery, Our Way, Blog. `SiteLayout` reads `hasPublishedPostsSafe()` alongside `hasPublicGallerySafe()` (`Promise.all`); a failed read returns false. `Header`, `DesktopNav`, `MobileMenuContent` and `Footer` already take `items` (032), so they need no edit.
- **Rationale**: Principle VIII: no change to the Header or hero.

## R18. Public post page details

- **Decision**:
  - **Author line**: "Sheza Fatima" plus `getSiteImages().founderPhoto` (falls back to `/founder.jpeg`).
  - **Share**: WhatsApp `https://wa.me/?text=<title + url>` and LinkedIn `https://www.linkedin.com/sharing/share-offsite/?url=<url>` as plain links (`target="_blank" rel="noopener noreferrer"`). `CopyLinkButton` is a client leaf using `navigator.clipboard`, with a fallback message and a polite live region.
  - **JSON-LD Article**: a `<script type="application/ld+json">` with `<` escaped as `<`. Publisher "Tareeq" with logo `/icon.svg`.
  - **End CTA**: "Book a workshop" goes to `joinHref` (`/workshop?book=1`, the site-wide booking target) and "Explore courses" to `/courses`.
  - **Static generation**: `generateStaticParams` comes from published slugs (empty on a failed read) with `dynamicParams = true`.
  - **Typography**: `.blog-prose` styles in `globals.css` use the brand tokens: headings Sora, body Inter, code blocks and tables scroll horizontally inside themselves.
- **Rationale**: These follow FR-019 and FR-024 and match existing patterns (`joinHref`, `SafeImage`, tokens).

## R19. Validation and limits (server is the source of truth)

- **Decision**: `blog-schema.ts` (zod/mini, pure) sets these limits:
  - title 1–120
  - slug `SLUG_PATTERN`, at most `SLUG_MAX` (80), not `preview`
  - excerpt at most 200
  - content at most 100,000
  - tags at most 10, each 1–30 after trim and lower-casing, de-duplicated
  - meta title at most 70, meta description at most 200
  - `publishedAt` as `YYYY-MM-DD` or empty
  - category is an ObjectId that exists (checked in the action)
  - status `draft | published`
  - **Publish rule**: `publishIssues(values)` returns a field error map for title, slug, excerpt, category, cover with alt and content.
- **Reading time**: `readingMinutes(markdown)` strips code fences' markers, link and image syntax and punctuation markers, counts words, and returns `max(1, ceil(words / 200))`.
- **Rationale**: FR-002, FR-003, FR-014 and FR-029.
