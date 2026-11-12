---
description: "Task list for 033-admin-blog"
---

# Tasks: Admin-managed blog

**Input**: Design documents from `/specs/033-admin-blog/`
**Prerequisites**: plan.md, spec.md, research.md (R1–R19), data-model.md, contracts/ (data-access.md, routes-and-ui.md), quickstart.md

**Tests**: Included.
- FR-028 requires extending the unauthenticated-action test (`scripts/admin-guard-test.mts`).
- plan.md lists unit tests for the pure modules. They use `node --test` in `tests/unit/*.test.ts` and import pure modules by **relative** path with `.ts` extensions (see `tests/unit/gallery-view.test.ts`, `tests/unit/programs-markdown.test.ts`).
- Write each test before its module and see it fail first.

**Organization**: by user story from spec.md. P1 stories come first, then P2.

| Story | What it covers | Priority |
|-------|----------------|----------|
| US1 | Write and save a draft (editor, toolbar, live preview) | P1 |
| US2 | Insert images into the body | P1 |
| US3 | Publish, unpublish, preview page, delete | P1 |
| US4 | Never lose work (unsaved warning, browser copy, restore) | P1 |
| US6 | Readers browse /blog (hero, grid, filters, pagination, empty) | P1 |
| US7 | Read a post (/blog/[slug], TOC, share, related, CTA) | P1 |
| US10 | Owner-only access (final guard verification) | P1 |
| US5 | Manage posts (list filters/search) and categories | P2 |
| US8 | SEO and feeds (SEO panel, metadata, JSON-LD, sitemap, RSS) | P2 |
| US9 | Blog in nav/footer only when a post is published | P2 |

**Note on categories**: publishing (US3) needs a category, so category data, actions and the categories page are built in Phase 2. US5 adds the posts list filters and verifies the category delete guard.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US10 from spec.md

## Conventions every task must follow

- **Read the file first.** Read an existing file before changing it, and keep its comment style: a short header comment citing the spec and research ids, e.g. `// specs/033-admin-blog research R3`.
- **Reference files to copy patterns from.** Match their naming, error handling and message tone:
  - `src/lib/gallery/{model,data,view}.ts`
  - `src/lib/courses/model.ts`
  - `src/lib/admin/course-categories-actions.ts`
  - `src/lib/admin/courses-actions.ts` (slug with `nextFreeSlug`, cover with `resolveImageChange`/`deleteReplaced`)
  - `src/lib/admin/gallery-{schema,read,actions}.ts`
  - `src/app/admin/(panel)/gallery/**`
  - `src/app/(site)/gallery/[slug]/{page,not-found}.tsx`
  - `src/components/admin/CourseEditor.tsx` (editor shell, toasts, unsaved changes)
- **Pure modules use relative imports only**, with `.ts` extensions and no `server-only` or `@/` alias:
  - `src/lib/blog/{view,markdown,editor-format,draft-storage}.ts`
  - `src/lib/admin/blog-schema.ts`
  - `src/lib/site.ts`
  - `src/lib/seo.ts`
- **Server modules start with `import "server-only";`**: `src/lib/blog/model.ts`, `src/lib/blog/data.ts`, `src/lib/admin/blog-read.ts`.
- **Every Server Action is wrapped with `withAdmin`** and returns `ActionResult`.
  - Successful writes call `revalidateTag("blog", { expire: 0 })`, `revalidateTag("post:<slug>", { expire: 0 })` for each affected slug, and `revalidatePath("/admin/blog")`.
  - Logs use `logAdmin("blog", …)` with ids only. Never log titles, content, tags or search text.
  - Outages return `unavailable`, logged by error name only.
- **Every admin page and the preview page call `await requireAdmin()` first.** Admin pages load through `safeLoad` and show `UnavailableNotice` on failure.
- **Styling and motion**: brand tokens only, no hex. Saffron is never used as text on a light background. Touch targets are `min-h-11`. Animate only `transform`/`opacity`, and every transition gets `motion-reduce:transition-none`.
- **`"use client"`** goes only on the files plan.md lists as client components, each with a one-line reason comment (Principle XI).
- **No new dependencies.** Do not touch the hero, the tokens, `Header` or `Footer` markup.

---

## Phase 1: Setup

- [X] T001 Record the baseline on branch `033-admin-blog`: run `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build` and `npm run test:admin-guard -- --no-http`. Write the results (pass/fail and counts) to `specs/033-admin-blog/verification.md` under "Baseline".
- [X] T002 [P] Add `"blog"` to the `AdminEvent` union in `src/lib/admin/log.ts`.
- [X] T003 [P] Edit `src/lib/cloudinary/server.ts` (research R4, R10):
  - Add `"blog"` to `UPLOAD_SCOPES`.
  - Add `export async function lookupAssetSize(publicId: string): Promise<{ width: number; height: number } | null>`. It returns null when Cloudinary is not configured or `!isImageFolderId(publicId)`, and calls `api.resource(publicId, { resource_type: "image", type: "upload" })`. It returns the integer width and height, or null on a 404. Any other error is rethrown, and it **never** destroys anything.
  - Add the pure helper `publicIdFromUrl(url, cloudName)` to `src/lib/images/shared.ts`. It strips `https://res.cloudinary.com/<cloud>/image/upload/`, an optional transformation segment and `v<digits>/`, plus the extension, and returns null unless the result starts with `tareeq/`.
- [X] T004 [P] Create `src/lib/seo.ts` (pure):
  - `siteUrl(path = "/")` builds an absolute URL from `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"` without a trailing slash.
  - `jsonLd(data: object): string` returns `JSON.stringify(data).replace(/</g, "\\u003c")`.

---

## Phase 2: Foundational (blocks every story)

**Purpose**: data, rules, the renderer, cached reads and categories. No user-facing post UI yet.

### Tests first

- [X] T005 [P] Write `tests/unit/blog-schema.test.ts` for `src/lib/admin/blog-schema.ts`:
  - **Limits**: title 1–120, excerpt ≤ 200, content ≤ 100,000, meta title ≤ 70, meta description ≤ 200.
  - **Slug**: `SLUG_PATTERN`, ≤ 80, `preview` rejected.
  - **Tags**: trim, lower-case and de-duplicate (`["AI","ai "," Python"]` gives `["ai","python"]`), at most 10, each 1–30.
  - **`publishedAt`**: `YYYY-MM-DD` or empty, and a date more than 1 year ahead is rejected.
  - **`publishIssues`**: returns an error for each of title, slug, excerpt, categoryId, coverImage (missing, or alt empty) and content, and `{}` when everything is present.
- [X] T006 [P] Write `tests/unit/blog-view.test.ts` for `src/lib/blog/view.ts`:
  - **`readingMinutes`**: `""` gives 1, 200 words give 1, 201 words give 2, and code fence markers and `![alt](url)` URLs are not counted as words.
  - **`pickHero`**: picks the newest featured card and ignores the rest.
  - **`filterCards`**: by category slug, and by tag case-insensitively.
  - **`paginate`**: 9 per page, non-numeric page gives 1, out-of-range page gives empty items with the correct `pages`.
  - **`listForPage`**: the hero is excluded on every page when unfiltered (research R8).
  - **`rankRelated`**: same category newest first, then shared-tag count, then newest; never the post itself; at most n.
  - **`effectiveSeo`**: falls back to title and excerpt.
- [X] T007 [P] Write `tests/unit/blog-markdown.test.ts` covering every checkbox under "Renderer" in `specs/033-admin-blog/contracts/data-access.md`:
  - `<script>`, raw `<img onerror>` and `<iframe>` produce no HTML.
  - `javascript:` and `data:` hrefs are removed.
  - An external image is dropped, and an image under `https://res.cloudinary.com/<cloud>/image/upload/v1/tareeq/blog/x.jpg` is kept.
  - A stand-alone image with a size in `sizes` becomes an `image` segment; with no size it becomes an `<img loading="lazy">` inside an HTML segment.
  - `# A` gives `<h2 id="a">`, duplicate headings get `a`/`a-2`, and `headings` holds only h2/h3.
  - A table is wrapped in `div.blog-table`, and foreign `class` values are stripped.
  - Links get `rel="noopener noreferrer"`.
  - Do not depend on environment variables: pass the cloud name as an argument (see T011).

### Implementation

- [X] T008 Edit `src/lib/programs/markdown.ts`: rename `OPTIONS` to `export const BASE_SANITIZE` and keep `renderMarkdown` identical (research R2). Run `npm run test:unit`: `tests/unit/programs-markdown.test.ts` must pass unchanged.
- [X] T009 [P] Create `src/lib/blog/view.ts` with the types `BlogCategoryRef`, `PublicPostCard`, `PublicPost`, `PublicCategory` and `RenderedContent` from data-model.md. It exports `POSTS_PER_PAGE = 9`, `readingMinutes`, `pickHero`, `filterCards`, `paginate`, `listForPage({ cards, category, tag, page })` (returns `{ hero, posts, page, pages, total, unknown }`), `rankRelated` and `effectiveSeo`. Make T006 pass.
- [X] T010 [P] Create `src/lib/admin/blog-schema.ts` (zod/mini, pure):
  - Exports: `BlogPostFormValues`, `EMPTY_POST`, `LIMITS`, `MESSAGES`, `RESERVED_SLUGS = ["preview"]`, `parseBlogPost(values)` (returns `{ success, data } | { success: false, errors }`), `publishIssues(values)` and `normaliseTags(tags)`.
  - Reuse `slugify` from `src/lib/admin/courses-schema.ts` and `imageSchema` from `src/lib/images/shared.ts`. The cover's alt may be empty in a draft, so make a draft-tolerant variant.
  - Make T005 pass.
- [X] T011 Create `src/lib/blog/markdown.ts` (research R2, R3, R6). Depends on T008.
  - Signature: `renderBlogMarkdown(markdown: string, sizes: Record<string, {width:number;height:number}>, opts: { cloudName?: string } = {}): RenderedContent`. `cloudName` defaults to `process.env.CLOUDINARY_CLOUD_NAME`, and with none set, any `res.cloudinary.com` URL under `/tareeq/` is accepted.
  - **Marked renderer overrides**:
    - `html` returns `""`.
    - `heading` turns h1 into h2 and adds a unique `id` from `slugify`, prefixed `s-` when the slug is empty or starts with a digit. h2/h3 are collected into `headings`.
    - `table` is wrapped in `<div class="blog-table">`.
    - `image` renders `<img src=optimizedUrl(src, 1200) srcset="… 480w, … 800w, … 1200w" sizes="(min-width: 1024px) 720px, 100vw" alt loading="lazy" decoding="async" [width height]>`.
  - **Sanitizer**: `{ ...BASE_SANITIZE }` extended per research R2, with `allowedClasses` `{ div: ["blog-table"], code: ["language-*"] }`, `allowedSchemesByTag: { img: ["https"] }`, and `exclusiveFilter` dropping an `img` whose src is not our cloud under `tareeq/`.
  - **Segments**: walk `marked.lexer(markdown, { gfm: true })` top-level tokens. A `paragraph` whose only child token is an `image` with a known size (looked up by the original URL in `sizes`) that passes the cloud check becomes `{ kind: "image" }`. Everything else goes through `marked.parser([token])` then `sanitizeHtml`, and adjacent HTML segments are merged.
  - Make T007 pass.
- [X] T012 Create `src/lib/blog/model.ts` (data-model.md):
  - `BlogCategoryModel` (collection `blog_categories`, index `{order:1,name:1}`).
  - `BlogPostModel` (collection `blog_posts`) with the fields, limits and indexes from data-model.md, `coverImage: imageSubSchema({ altRequired: false })`, `contentImages` sub-documents `{url,width,height}` (`_id: false`), `seo` sub-document, and a document-save validator for `status: "published"` (as in `src/lib/gallery/model.ts`).
  - Use the `mongoose.models.X ??` guard.
- [X] T013 Create `src/lib/blog/data.ts` (`contracts/data-access.md` "Public reads"; research R7):
  - **`readPublishedCards`**: `unstable_cache`, key `["blog:cards"]`, tags `["blog"]`, revalidate 3600. It finds `{status:"published"}` with `.select("-content -contentImages")`, populates the category name/slug/order, sorts by `publishedAt` then `createdAt` descending, and maps to `PublicPostCard` (ISO strings).
  - **Built on it**: `getPublishedPosts`, `getRelatedPosts`, `getPublishedPostSlugs` (`[]` on error), `getFeedPosts(20)`, `getSitemapPosts()` and `hasPublishedPostsSafe()` (false on error).
  - **`loadPublishedPosts`**: in production a failed read rethrows; the build and dev get null (copy `loadPublishedAlbums`).
  - **`getPostBySlug(slug)`**: returns null for a malformed slug; otherwise a per-slug `unstable_cache`, key `["blog:post", slug]`, tags `["blog", \`post:${slug}\`]`.
  - **`getBlogCategories()`**: key `["blog:categories"]`, tag `blog`, only categories with ≥ 1 published post, plus `postCount`.
  - Log failures as `[blog] <where> failed: <ErrorName>`.
- [X] T014 Create `src/lib/admin/blog-read.ts` (uncached, `server-only`):
  - **`listAdminPosts({status, category, q})`**: ≤ 200, sorted by `updatedAt` descending, `q` escaped and case-insensitive on the title. Rows: `{id,title,slug,status,publishedAt,featured,updatedAt,category:{id,name}|null,cover:StoredImage|null}`.
  - **`getAdminPost(id)`**: returns null for an invalid ObjectId or a missing post; otherwise `BlogPostFormValues` + `{ id, status, publishedAt, updatedAt, contentImages }`, with `publishedAt` formatted as the Asia/Karachi `YYYY-MM-DD`.
  - **`listAdminBlogCategories()`**: the `AdminCategory` shape from `src/lib/admin/courses-read.ts`, with `postCount` across all statuses and an empty description.
- [X] T015 Create `src/lib/admin/blog-categories-actions.ts` by mirroring `src/lib/admin/course-categories-actions.ts`: `createBlogCategory`, `updateBlogCategory`, `setBlogCategoryOrder` and `deleteBlogCategory` (the last returns `in_use` + `count` when any post uses it). Parse with `parseCategory` and drop `description`. `refresh()` revalidates the `blog` tag, `/admin/blog` and `/admin/blog/categories`.
- [X] T016 Generalise `src/components/admin/CategoryManager.tsx` (research R11):
  - New props: `actions: { create; update; setOrder; remove }` (Server Action references), `noun: readonly [string, string]` and `withDescription: boolean`.
  - The description field is hidden when false. The in-use message becomes `Used by ${n} ${noun} — move them to another category first.`
  - Update `src/app/admin/(panel)/courses/categories/page.tsx` to pass the four course actions, `["course","courses"]` and `withDescription`.
  - Verify course categories behave exactly as before at `/admin/courses/categories`.
- [X] T017 Create `src/app/admin/(panel)/blog/categories/page.tsx`. It calls `requireAdmin()`, loads `listAdminBlogCategories` through `safeLoad`, shows `PageHeader` "Blog categories" with a back link to `/admin/blog`, and renders `CategoryManager` with the blog actions, `["post","posts"]` and `withDescription={false}`.
- [X] T018 [P] Add the Blog entry to `src/components/admin/AdminNav.tsx` after Gallery: `href: "/admin/blog"`, `label: "Blog"`, `Icon: Article` (from `@phosphor-icons/react`), `isActive: under("/admin/blog")`.

**Checkpoint**: `npm run test:unit` is green (T005–T007 and programs-markdown), `npx tsc --noEmit` is clean, blog categories can be created, reordered and deleted, and course categories are unchanged.

---

## Phase 3: User Story 1 — Write and save a draft (P1) 🎯 MVP

**Goal**: The owner writes a post with every field, sees a live preview identical to the public page, and saves it as a draft.

**Independent Test**: Create a post with all fields, save the draft, reload the editor, and confirm every field is restored. The post is listed as Draft, and `/blog/<slug>` is not reachable (quickstart steps 4, 5 and 8).

- [X] T019 [P] [US1] Write `tests/unit/blog-editor-format.test.ts` for `src/lib/blog/editor-format.ts`. Each function takes `{ value, start, end }` and returns `{ value, start, end }`.
  - `wrap("**")` with a selection wraps it and keeps the inner text selected; with an empty selection it inserts `****` with the cursor in the middle; on an already-wrapped selection it unwraps.
  - `prefixLines("## " | "- " | "> ")` prefixes every selected line and toggles off when all lines already have the prefix.
  - `link()` turns a selection into `[sel](https://)` with `https://` selected.
  - `codeBlock()` uses a fenced block for multi-line selections and backticks for inline.
  - `insertAt(text)` replaces the selection and puts the cursor after the insertion.
- [X] T020 [P] [US1] Create `src/lib/blog/editor-format.ts` (pure) and make T019 pass.
- [X] T021 [US1] Create `src/lib/admin/blog-actions.ts` with `saveBlogPost` (`contracts/data-access.md`) for the **draft/save path**:
  - Parse the input, and check the category exists when given.
  - **Slug**: `nextFreeSlug` on create with `slugAuto`, otherwise `conflict`; a duplicate key (11000) also gives `conflict`.
  - **Cover**: `resolveImageChange` / `imageFailure` / `deleteReplaced` as in `courses-actions.ts`.
  - **Fields**: `readingTime = readingMinutes(content)`, normalised tags, `seo`.
  - **Status**: `status` is kept as stored (new posts are `"draft"`). The publish transition is added in T036.
  - **Result**: `{ id, slug, status, publishedAt, updatedAt, readingTime }`, after the revalidation from the conventions.
- [X] T022 [US1] Add `renderBlogPreview({ markdown, sizes })` to `src/lib/admin/blog-actions.ts`. A string longer than 100,000 characters gives `invalid`. Keep at most 100 `sizes` entries, with integer width and height in 1..10000. It returns `{ ok: true, ...renderBlogMarkdown(markdown, sizes) }` with no DB or Cloudinary access.
- [X] T023 [P] [US1] Add `.blog-prose` typography to `src/app/globals.css` using tokens:
  - **Text**: h2/h3/h4 in Sora with `scroll-margin-top` clearing the sticky header; p/ul/ol/li/blockquote (royal left border, soft-blue surface); links in sky blue, underlined.
  - **Code**: inline `code`, and `pre` with `overflow-x:auto` on a midnight background with white text.
  - **Tables**: `.blog-table` with `overflow-x:auto` and bordered cells.
  - **Images and words**: `img` with `max-width:100%; height:auto`, rounded corners; `overflow-wrap:anywhere`.
  - **Motion**: `html { scroll-behavior: smooth }` only inside `@media (prefers-reduced-motion: no-preference)`.
- [X] T024 [P] [US1] Create `src/components/sections/blog/BlogProse.tsx` (server-safe: no hooks and no `"use client"`). It renders `segments` inside `<div className="blog-prose">`: HTML segments as `<div style={{display:"contents"}} dangerouslySetInnerHTML>`, and image segments as `next/image` with `width`, `height`, `alt`, `sizes="(min-width: 1024px) 720px, 100vw"` and lazy loading, with the src via `optimizedUrl`. Add the comment that this is the only raw HTML from stored blog content, sanitised in `renderBlogMarkdown`.
- [X] T025 [P] [US1] Create `src/components/sections/blog/AuthorLine.tsx` (server-safe). It takes `photo: { src, width, height, alt }` and renders a 40px round `SafeImage` plus "Sheza Fatima" and an optional date and reading time slot.
- [X] T026 [US1] Create `src/components/sections/blog/BlogPostView.tsx` (server-safe):
  - **Props**: `{ post: { title, category, publishedAt, readingTime, cover, tags }, content: RenderedContent, authorPhoto, mode: "public" | "editor", slots?: { toc?, afterContent? } }`.
  - **Renders**: an `article` with the header (cover via `SafeImage` with `priority` in public mode, h1 title, a category link to `/blog?category=<slug>`, the date formatted `d MMM yyyy` in en-GB, "N min read", `AuthorLine`), then `BlogProse`, then tag links to `/blog?tag=<tag>`.
  - **Layout**: a 2-column grid at `lg` when `slots.toc` is given. US7 fills the slots.
  - **Missing values**: a missing cover, category or date renders nothing for that item, so drafts preview cleanly.
- [X] T027 [P] [US1] Create `src/components/admin/TagInput.tsx` (client: chip state and key handling). It adds a tag on Enter or comma, Backspace on an empty input removes the last chip, and it uses `normaliseTags`. It enforces the 10-tag and 30-character limits with inline messages. The chips are buttons with `aria-label="Remove tag <x>"`.
- [X] T028 [P] [US1] Create `src/components/admin/MarkdownEditor.tsx` (client: selection and keyboard):
  - **Textarea**: labelled "Content (markdown)", monospace, `min-h-[60vh]` at `lg`.
  - **Toolbar**: `role="toolbar" aria-label="Formatting"` with roving tabindex (arrow keys). The buttons are Heading, Bold, Italic, Link, Bulleted list, Numbered list, Quote and Code, using Phosphor icons, `aria-label`s and 44px targets.
  - **Shortcuts**: Ctrl/⌘+B, I and K.
  - **Selection**: each action applies `editor-format` and restores the selection with `setSelectionRange` after the state update, keeping focus in the textarea.
  - **Image button**: exposes an `imageButton?: ReactNode` slot for US2.
  - **Props**: `{ value, onChange, id, error }`.
- [X] T029 [P] [US1] Create `src/components/admin/BlogPreviewPane.tsx` (client: debounced Server Action calls):
  - **Props**: `{ values, sizes, authorPhoto, categories }`.
  - **Behaviour**: 400 ms after `values.content` changes it calls `renderBlogPreview`, drops stale responses with a request counter, keeps the last good result while loading, and shows a small "Updating…" status.
  - **Renders**: `BlogPostView` with `mode="editor"`, mapping `categoryId` to a category ref and `coverImage` to the cover. A failed call keeps the last preview and shows "Preview unavailable".
- [X] T030 [US1] Create `src/components/admin/BlogPostEditor.tsx` (client: form state, transitions, router, toasts). Copy the shell from `CourseEditor.tsx`.
  - **Fields**: title; slug (auto from `slugify(title)` while `slugAuto`, and typing in the slug sets `slugAuto=false`); excerpt with a live "N left" counter and `maxLength=200`; a category `SelectField` with a "No category" option and a link "Manage categories"; `TagInput`; cover via `ImageUploader` with `scope="blog"`; a featured checkbox; a published date `<input type="date">`.
  - **Editor and preview**: `MarkdownEditor` plus `BlogPreviewPane`, side by side at `lg`. Below `lg`, they become Write/Preview tabs: `role="tablist"`, arrow keys, `aria-controls`.
  - **Save draft**: calls `saveBlogPost`, shows field errors from `fieldErrors`, and toasts "Draft saved". On create it calls `router.replace(\`/admin/blog/${id}\`)`.
  - **Action bar**: a sticky bottom bar on mobile, and in the page header at `lg`.
- [X] T031 [US1] Create the editor pages:
  - `src/app/admin/(panel)/blog/new/page.tsx`: `requireAdmin`, load categories plus `getSiteImages().founderPhoto`, render `BlogPostEditor` with `EMPTY_POST`.
  - `src/app/admin/(panel)/blog/[id]/page.tsx`: `requireAdmin`, `getAdminPost(id)`, `notFound()` when null, render `BlogPostEditor` with the post.
  - Both use `PageHeader` with a back link to `/admin/blog`.
- [X] T032 [US1] Create `src/app/admin/(panel)/blog/page.tsx`, the minimal list: `requireAdmin`, `listAdminPosts({})` through `safeLoad`, `PageHeader` "Blog" with the actions "New post" and "Categories", the rows via a new `src/components/admin/BlogPostRow.tsx` (server), and `EmptyState` "Write your first post" (plus "Create a category first" when there are none). US5 adds the filters.

**Checkpoint**: quickstart steps 2, 4, 5 and 8 pass at 360/390/1440px. The preview and saved content match.

---

## Phase 4: User Story 2 — Insert images into the post body (P1)

**Goal**: Upload an image from the toolbar, require alt text, and insert `![alt](url)` at the cursor. Stored posts keep verified image sizes so public images use `next/image`.

**Independent Test**: Insert an image mid-paragraph. The markdown lands exactly at the cursor, and the image renders in the preview and, after saving, through `next/image` (quickstart step 6).

- [X] T033 [US2] Create `src/components/admin/MarkdownImageButton.tsx` (client: file input, upload progress, dialog):
  - **Upload**: the toolbar button opens a hidden `<input type="file" accept="image/jpeg,image/png,image/webp">`. Run `validateFile`; on failure show an `IMAGE_MESSAGES` toast and leave the text unchanged. Otherwise call `signUpload({ scope: "blog" })` (`not_configured` gives the `notConfigured` message), then `uploadToCloudinary` with progress shown on the button (`aria-busy`, percentage in an sr-only live region).
  - **Alt-text dialog**: built with `useFocusTrap`, labelled "Describe this image". It has the alt input (≤ 200, required), Insert (disabled while empty) and Cancel/Esc.
  - **Insert**: calls `onInsert({ markdown: \`![${alt}](${url})\`, url, width, height })`.
  - **Cancel**: inserts nothing, and the file is left in place (orphan cleanup is out of scope; note it in a comment).
- [X] T034 [US2] Wire `MarkdownImageButton` into `MarkdownEditor`'s `imageButton` slot from `BlogPostEditor.tsx`:
  - **Insert**: on insert, use `insertAt` at the textarea selection captured before the dialog opened, placing the image on its own line (add newlines when the cursor is mid-line), so it becomes a stand-alone image segment.
  - **Sizes map**: keep a `sizes` map in editor state, seeded from `post.contentImages` and extended with each uploaded image, and pass it to `BlogPreviewPane`.
- [X] T035 [US2] Extend `saveBlogPost` in `src/lib/admin/blog-actions.ts` to rebuild `contentImages` (research R4):
  - Extract image URLs from the content with `marked.lexer` (walk the tokens for `image`).
  - Keep the stored sizes of URLs already known.
  - For up to 20 new URLs where `publicIdFromUrl` is non-null, call `lookupAssetSize`. A throw or null is logged as `logAdmin("blog","image-size-failed",id)` and skipped.
  - Drop URLs no longer in the content, and keep at most 100 entries.

**Checkpoint**: quickstart step 6 passes. After saving, the public render (checked in US7) uses `next/image` for that image.

---

## Phase 5: User Story 3 — Publish, unpublish, preview and delete (P1)

**Goal**: Publish with server-checked rules, unpublish, preview at a private address, and delete with confirmation.

**Independent Test**: Preview a draft (works signed in, redirects signed out). Publish it, so it is on /blog. Unpublish it, so its address returns 404. Then delete it (quickstart steps 9, 10, 14, 15 and 19).

- [X] T036 [US3] Extend `saveBlogPost` in `src/lib/admin/blog-actions.ts` with the target status (research R9, data-model.md transitions):
  - **Publish**: when `values.status === "published"`, `publishIssues` must be `{}`, otherwise `invalid` + `fieldErrors` with nothing written. `publishedAt` is set to now when it is null.
  - **Publish date**: an edited `publishedAt` day is stored at 04:00Z of that day, and the same day keeps the stored timestamp.
  - **Unpublish**: `"draft"` sets status draft and keeps `publishedAt`.
  - **Slug change**: when the slug changed, revalidate both the old and new `post:` tags.
- [X] T037 [US3] Add `deleteBlogPost({ id })` to `src/lib/admin/blog-actions.ts`. An invalid id gives `invalid`. It runs `findByIdAndDelete` with a projection of slug and cover (missing gives `not_found`), then `deleteReplaced({ image: null, toDelete: cover.publicId })` when there is a cover, then revalidates the `blog` tag, `post:<slug>` and `/admin/blog`. Body images are kept (research R10).
- [X] T038 [US3] Add the publishing controls to `src/components/admin/BlogPostEditor.tsx`:
  - **Save and Publish buttons**: "Save draft" becomes "Save changes" when published. A Publish button (draft) or Unpublish button (published) calls `saveBlogPost` with the target status and current values; refused publishes show field errors and a toast "Fill in the highlighted fields to publish".
  - **Status line**: a status chip, the published date and "Last saved" in the header.
  - **Preview**: a link `/blog/preview/<id>` with `target="_blank"`, disabled with the hint "Save once to preview" until there is an id.
  - **Delete**: uses `ConfirmDialog` ("Delete this post? This cannot be undone."), then `deleteBlogPost` and `router.push("/admin/blog")`.
  - **Slug warning**: on a published post, a slug that differs from the saved one shows the inline warning "Changing the address of a published post breaks links already shared."
- [X] T039 [P] [US3] Create `src/components/sections/blog/PreviewBanner.tsx` (server): `role="note"`, on a midnight background with white text, saying "Preview — not published" for a draft and "Preview of the saved version" for a published post.
- [X] T040 [US3] Create `src/app/(site)/blog/preview/[id]/page.tsx`:
  - **Setup**: `export const dynamic = "force-dynamic"`, and `generateMetadata` returns `{ title: "Preview: …", robots: { index: false, follow: false } }`. The page calls `await requireAdmin()` **before** any read.
  - **Data**: `getAdminPost(id)`, with `notFound()` when null.
  - **Renders**: `renderBlogMarkdown(content, sizesFrom(contentImages))`, then `PreviewBanner` plus `BlogPostView` with `mode="public"` (US7 slots are filled once US7 lands).
- [X] T041 [P] [US3] Edit `src/app/robots.ts`: add `"/blog/preview"` to `disallow`.

**Checkpoint**: quickstart steps 9, 10 (publishing part), 14, 15 and 19 pass.

---

## Phase 6: User Story 4 — Never lose work (P1)

**Goal**: An unsaved-changes warning, a browser copy saved while typing, and a restore offer after a crash.

**Independent Test**: Type, close the tab, reopen: the restore offer brings the text back. Blocking storage causes no errors (quickstart step 16).

- [X] T042 [P] [US4] Write `tests/unit/blog-draft-storage.test.ts` for `src/lib/blog/draft-storage.ts`, using an in-memory `Storage` stub and one whose methods throw:
  - `draftKey(id|null)` gives `tareeq:blog-draft:<id|new>`.
  - `writeDraft` and `readDraft` round-trip `{v:1,savedAt,values}`.
  - A wrong `v` or bad shape gives null, and the key is removed.
  - `shouldOffer(draft, serverValues, serverUpdatedAt)` is true only when the values differ and `savedAt` is later.
  - `moveDraft("new", id)`.
  - A throwing storage never throws out of any function.
- [X] T043 [P] [US4] Create `src/lib/blog/draft-storage.ts` (pure; takes a `Storage | null` getter so tests can inject one; `try/catch` around every access) and make T042 pass.
- [X] T044 [P] [US4] Create `src/components/admin/DraftRestoreNotice.tsx` (client: button handlers). It uses `role="status"` with the text "Restore unsaved changes from <HH:mm, d MMM>?" and Restore and Discard buttons (44px).
- [X] T045 [US4] Wire autosave and restore into `src/components/admin/BlogPostEditor.tsx`:
  - `dirty` = values differ from the last saved values, passed to `useUnsavedChanges(dirty)`.
  - While dirty, write the browser copy 2 s after the last change.
  - On mount, read the copy and show `DraftRestoreNotice` when `shouldOffer` is true. Restore sets the values (still dirty), and Discard removes the copy.
  - On a successful save, clear the copy, and on first create call `moveDraft` then clear.
  - Guard every access with `typeof window` and keep all storage behind `draft-storage.ts`.

**Checkpoint**: quickstart step 16 passes, including with site data blocked.

---

## Phase 7: User Story 6 — Readers browse the blog (P1)

**Goal**: /blog with the featured hero, a 9-per-page grid, category chips, tag filtering, pagination and the empty states.

**Independent Test**: With 12 published posts (one featured), check the hero, both pages, a category filter, a tag filter and `?page=99`. With no posts, check "First posts coming soon." (quickstart steps 1 and 13).

- [X] T046 [P] [US6] Create `src/components/sections/blog/BlogPostCard.tsx` (server):
  - **Content**: the cover via `SafeImage` (`sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"`, lazy, brand placeholder when there is no cover), the category label, an h3 title as the card link (stretched link pattern), the excerpt clamped to 3 lines, and the date with "N min read".
  - **Hover**: `motion-safe:hover:-translate-y-0.5`.
- [X] T047 [P] [US6] Create `src/components/sections/blog/BlogHero.tsx` (server). It shows the featured card large, with the cover `priority`, an h2 title, the excerpt, date and reading time, and a "Read the post" link.
- [X] T048 [P] [US6] Create `src/components/sections/blog/BlogGrid.tsx` (server): a `ul` with 1, 2 (`sm`) and 3 (`lg`) columns of `BlogPostCard`.
- [X] T049 [P] [US6] Create `src/components/sections/blog/BlogFilterChips.tsx` (server):
  - **Chips**: Link chips "All" plus `PublicCategory[]`, wrapping with no horizontal page scroll. The current chip has `aria-current="page"`.
  - **Tag filter**: when `tag` is set, show a "Tag: <tag>" label with a "Clear" link to `/blog` (keeping `category`).
  - **Address**: `blogHref({category, tag, page})` builds addresses, as a pure helper exported from `src/lib/blog/view.ts`. Add test cases to `tests/unit/blog-view.test.ts`.
- [X] T050 [P] [US6] Create `src/components/sections/blog/BlogPagination.tsx` (server): `nav aria-label="Blog pages"` with Previous/Next plus page numbers via `blogHref`, the current page marked `aria-current="page"`, and 44px targets. It renders nothing when `pages <= 1`.
- [X] T051 [P] [US6] Create `src/components/sections/blog/BlogEmpty.tsx` (server) with two variants: `"coming-soon"` ("First posts coming soon.") and `"no-results"` ("No posts found", with a link "See all posts" to `/blog`).
- [X] T052 [US6] Create `src/app/(site)/blog/page.tsx`:
  - **Data**: read `searchParams` (`category`, `tag`, `page`), then `loadPublishedPosts` and `getBlogCategories`. A null result shows an "unavailable" message like `/gallery`.
  - **States**: no published posts at all gives only the h1 "Blog" plus `BlogEmpty coming-soon`. Otherwise show the h1, intro line, chips, `BlogHero` (unfiltered page 1 only), `BlogGrid`, `BlogPagination`, and `BlogEmpty no-results` when the list is empty.
  - **`generateMetadata`**: the title "Blog", and a canonical of `/blog`, or `/blog?page=N` when N ≥ 2 and unfiltered.

**Checkpoint**: quickstart steps 1 (the `/blog` part) and 13 (listing part) pass at 360/390/1440px.

---

## Phase 8: User Story 7 — Read a post (P1)

**Goal**: The full post page with TOC, share, related posts and end CTA. Drafts and unknown slugs give 404.

**Independent Test**: A post with h2/h3, a list, quote, code, table and image, viewed on desktop and at 360px: use the TOC, all three share buttons, a related post and both CTAs (quickstart step 11).

- [X] T053 [P] [US7] Create `src/components/sections/blog/BlogToc.tsx` (server) and `src/components/sections/blog/TocHighlight.tsx` (client: IntersectionObserver).
  - **`BlogToc`**: renders `nav aria-label="On this page"` with a list of `headings` (h3 indented) inside `TocHighlight`. It is `hidden lg:block`, sticky with `top` clearing the header, and returns null for fewer than 2 headings.
  - **`TocHighlight`**: observes the heading ids, sets `aria-current="location"` and the active style on the matching link, and takes the server-rendered list as `children`.
- [X] T054 [P] [US7] Create `src/components/sections/blog/ShareButtons.tsx` (server) and `src/components/sections/blog/CopyLinkButton.tsx` (client: clipboard).
  - **Share links**: WhatsApp `https://wa.me/?text=${encodeURIComponent(title + " " + url)}` and LinkedIn `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, with `target="_blank" rel="noopener noreferrer"`, `aria-label`s and 44px targets.
  - **Copy link**: uses `navigator.clipboard.writeText` and announces "Link copied" in a polite live region; when the clipboard fails it shows "Copy failed — select the address bar".
- [X] T055 [P] [US7] Create `src/components/sections/blog/RelatedPosts.tsx` (server): the section "More to read" with up to 3 `BlogPostCard`, and null when there are none.
- [X] T056 [P] [US7] Create `src/components/sections/blog/BlogEndCta.tsx` (server): a soft-blue surface block with a short line and two `Button`s, "Book a workshop" (`joinHref` from `src/lib/site.ts`) and "Explore courses" (`/courses`).
- [X] T057 [US7] Fill the `BlogPostView` slots in `src/components/sections/blog/BlogPostView.tsx`:
  - In `mode="public"`, render `BlogToc` in the `toc` slot, and `ShareButtons`, `RelatedPosts` and `BlogEndCta` after the content when given through props `{ shareUrl, related }`.
  - `mode="editor"` keeps only the header and content.
  - Also update `src/app/(site)/blog/preview/[id]/page.tsx` to pass the TOC and share and CTA, with related posts from `getRelatedPosts`.
- [X] T058 [US7] Create `src/app/(site)/blog/[slug]/page.tsx` and `not-found.tsx`. Copy the gallery album page pattern:
  - **Static generation**: `generateStaticParams` from `getPublishedPostSlugs()`, with `dynamicParams = true`.
  - **Data**: `getPostBySlug(slug)` (null gives `notFound()`), `renderBlogMarkdown(post.content, sizesFrom(post.contentImages))`, `getRelatedPosts(post, 3)` and `getSiteImages().founderPhoto`.
  - **Renders**: `BlogPostView` with `mode="public"` and `shareUrl = siteUrl(\`/blog/${slug}\`)`.
  - **`generateMetadata`**: the title and description from `effectiveSeo` for now; US8 adds OG and JSON-LD.

**Checkpoint**: quickstart step 11 passes. A draft slug and an unknown slug both give the not-found page.

---

## Phase 9: User Story 10 — Owner-only access (P1)

**Goal**: Every blog action, the upload signature and the preview pages refuse a caller with no session.

**Independent Test**: `npm run test:admin-guard` passes with the new actions required. Signed-out visits to admin and preview addresses redirect to sign-in (quickstart step 14).

- [X] T059 [US10] Edit `scripts/admin-guard-test.mts`:
  - Add `saveBlogPost`, `deleteBlogPost`, `renderBlogPreview`, `createBlogCategory`, `updateBlogCategory`, `setBlogCategoryOrder` and `deleteBlogCategory` to `REQUIRED_ACTIONS` with the comment `// specs/033-admin-blog FR-028`.
  - Add the argument sets `[{ id: null, values: { title: "x", status: "published" } }]`, `[{ markdown: "# x", sizes: {} }]` and `[{ scope: "blog" }]`.
- [X] T060 [US10] Run `npm run test:admin-guard` (with the dev server for part C). All actions must be refused with `unauthorized` and no DB or Cloudinary call. In a private window, check that `/admin/blog`, `/admin/blog/new`, `/admin/blog/<id>`, `/admin/blog/categories` and `/blog/preview/<id>` all redirect to `/admin/login` with no post content in the response. Record the results in `specs/033-admin-blog/verification.md`.

**Checkpoint**: SC-003 is verified.

---

## Phase 10: User Story 5 — Manage posts and categories (P2)

**Goal**: The posts list with status and category filters and title search kept in the address, and the category delete guard.

**Independent Test**: 5 posts across 2 categories and both statuses: filters and search combine and survive a reload. Deleting a category in use is refused with a count (quickstart steps 3, 18 and 20).

- [X] T061 [US5] Edit `src/lib/admin/leads-params.ts`: extract `export function listHref(basePath: string, keys: readonly string[], params: Record<string, unknown>): string`, containing the body of `leadsHref` with `KEYS[type]` and `SUBMISSIONS_PATH[type]` as arguments. Make `leadsHref` call it, with identical output. Run `npm run test:unit` (`admin-leads-params.test.ts` must pass unchanged).
- [X] T062 [US5] Generalise `src/components/admin/FilterBar.tsx` (research R12):
  - Replace the `type`/`LeadParamsFor` props with `basePath: string`, `keys: readonly string[]` and `params: Record<string, string | number | null> & { q: string }`.
  - Build hrefs with `listHref`, and give the input ids a prefix based on `basePath`.
  - Update every leads page that renders `FilterBar` (find them with `grep -rn "FilterBar" src/app`) to pass `SUBMISSIONS_PATH[type]` and `KEYS[type]`. Export `KEYS` if needed.
  - Verify the workshop and course submissions filters behave as before.
- [X] T063 [US5] Edit `src/app/admin/(panel)/blog/page.tsx`:
  - **Filters**: parse `searchParams` `status` (`draft|published`, else null), `category` (ObjectId, else null) and `q` (trim, ≤ 100), pass them to `listAdminPosts`, and render `FilterBar` (`basePath="/admin/blog"`, `keys=["status","category","q"]`). Its selects are "All statuses" (Draft/Published) and "All categories", and the search label is "Search posts by title".
  - **Empty results**: when filters give no results, show "No posts match these filters" with Clear.
- [X] T064 [P] [US5] Complete `src/components/admin/BlogPostRow.tsx`:
  - **Content**: a thumbnail (`<img>` with `optimizedUrl(url, 160)`, 64×40, or a placeholder), the title linking to `/admin/blog/<id>`, the category (or "—"), `StatusChip` (Draft neutral, Published success), the published date (en-GB) or "—", and a filled star with `aria-label="Featured"` when featured.
  - **Layout**: a table row at `md` and a stacked card at 360px.

**Checkpoint**: quickstart steps 3, 18 and 20 pass. The leads filters and course categories are unchanged.

---

## Phase 11: User Story 8 — Found by search engines and feeds (P2)

**Goal**: The SEO panel, per-post metadata with OG and JSON-LD, canonical addresses, the site-wide sitemap and the RSS feed.

**Independent Test**: One post with custom SEO and one without: check the metadata, OG, JSON-LD, sitemap and RSS for both. Unpublishing removes a post from both (quickstart steps 12 and 15).

- [X] T065 [P] [US8] Create `src/components/admin/SeoPanel.tsx` (client: live counters):
  - **Fields**: meta title (counter `n/60`, soft warning beyond 60, `maxLength=70`) and meta description (`n/160`, warning beyond 160, `maxLength=200`). The counters are `aria-live="polite"` and announce only on crossing a threshold.
  - **Snippet preview**: the title (fallback: post title) truncated at about 60 characters with "…", the URL `siteUrl('/blog/<slug>')` in breadcrumb style, and the description (fallback: excerpt) truncated at about 160 characters.
  - Add it to `BlogPostEditor.tsx` under the editor.
- [X] T066 [US8] Extend `generateMetadata` in `src/app/(site)/blog/[slug]/page.tsx` (`contracts/routes-and-ui.md` "Metadata"):
  - **Base**: `alternates.canonical = /blog/<slug>` and the RSS alternate.
  - **OpenGraph**: `type: "article"`, `publishedTime`, `modifiedTime`, `authors: ["Sheza Fatima"]`, and the image `optimizedUrl(cover.url, 1200)` with width, height and alt. Twitter `summary_large_image`.
  - **JSON-LD**: render the Article in the page body with `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({...}) }} />`. It holds headline, description, image, datePublished, dateModified, `author {"@type":"Person",name:"Sheza Fatima"}`, `publisher {"@type":"Organization",name:"Tareeq",logo:siteUrl("/icon.svg")}` and `mainEntityOfPage`.
- [X] T067 [P] [US8] Add the RSS alternate to `generateMetadata` in `src/app/(site)/blog/page.tsx`: `alternates.types: { "application/rss+xml": "/blog/rss.xml" }`.
- [X] T068 [US8] Create `src/app/(site)/blog/rss.xml/route.ts`:
  - **Exports**: `export const revalidate = 3600` and `export async function GET()` only.
  - **Feed**: built from `getFeedPosts(20)` as RSS 2.0, with `channel` title "Tareeq Blog", link `siteUrl("/blog")`, a description and `lastBuildDate`. Each `item` has title, link, guid (`isPermaLink`), description (excerpt), pubDate (RFC 822) and category.
  - **Escaping**: a local `escapeXml` escapes `& < > " '`.
  - **Response**: `Content-Type: application/rss+xml; charset=utf-8`. A failed read returns a 503 with a plain body.
  - **Imports**: nothing from `src/lib/admin`.
- [X] T069 [US8] Edit part B of `scripts/admin-guard-test.mts`:
  - Add `const PUBLIC_ROUTES = new Set(["src/app/(site)/blog/rss.xml/route.ts"])` with the comment `// specs/033-admin-blog research R16`.
  - For each public route, read the source and fail unless its only exported HTTP method is `GET` (no `POST|PUT|PATCH|DELETE` exports) and it has no `@/lib/admin` or `lib/admin/` import.
  - Treat public routes as allowed in the existing unexpected-route check, and update the count log line.
  - Run `npm run test:admin-guard -- --no-http`.
- [X] T070 [US8] Create `src/app/sitemap.ts` (`MetadataRoute.Sitemap`, `export const revalidate = 3600`):
  - **Static pages**: `/`, `/programs`, `/courses`, `/workshop`, `/our-way` and `/register`; `/gallery` only when `hasPublicGallerySafe()`, and `/blog` only when `hasPublishedPostsSafe()`.
  - **Detail pages**: `/programs/<slug>` (`getPublishedSlugs` from `src/lib/programs/data.ts`), `/courses/<slug>` (`getPublishedCourseSlugs`), `/gallery/<slug>` (`getPublishedAlbumSlugs`) and `/blog/<slug>` with `lastModified` from `getSitemapPosts()`.
  - **URLs**: all absolute via `siteUrl`. Each reader is build-safe (returns `[]` on failure), so wrap any that is not in `try/catch`.
- [X] T071 [US8] Edit `src/app/robots.ts`: add `sitemap: siteUrl("/sitemap.xml")`, keeping the T041 disallow.

**Checkpoint**: quickstart step 12 passes, including the structured-data and W3C feed validators. Step 15 confirms that unpublishing removes the post from the sitemap and RSS.

---

## Phase 12: User Story 9 — Blog in navigation only when there is something to read (P2)

**Goal**: The Blog link appears in the desktop nav, the mobile menu and the footer only while at least one post is published.

**Independent Test**: No posts: no link. Publish one: the link appears. Unpublish it: the link disappears (quickstart steps 1, 10 and 19).

- [X] T072 [P] [US9] Edit `tests/unit/site-links.test.ts`: add `navItemsFor` cases for `{gallery:false, blog:false}` (unchanged list), `{gallery:false, blog:true}` (Blog last), `{gallery:true, blog:true}` (Programs, Courses, Gallery, Our Way, Blog) and `{gallery:true, blog:false}` (same as today). Update the existing `{ gallery }` calls to the new signature.
- [X] T073 [US9] Edit `src/lib/site.ts`: `navItemsFor({ gallery, blog }: { gallery: boolean; blog: boolean })` appends `{ label: "Blog", href: "/blog" }` last when `blog` is true, citing `specs/033-admin-blog FR-023`. Make T072 pass.
- [X] T074 [US9] Edit `src/app/(site)/layout.tsx`: `const [gallery, blog] = await Promise.all([hasPublicGallerySafe(), hasPublishedPostsSafe()])`, then `navItemsFor({ gallery, blog })`, and update the header comment. `Header` and `Footer` are unchanged. Check for other callers of `navItemsFor` with `grep -rn "navItemsFor" src` and update them.

**Checkpoint**: quickstart steps 1, 10 and 19 (the nav parts) pass. The home hero is visually identical at 390 and 1440px.

---

## Phase 13: Polish and cross-cutting

- [X] T075 Run `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build` and `npm run test:admin-guard`, and fix any failures. Record the results in `specs/033-admin-blog/verification.md`.
- [X] T076 Walk through every step of `specs/033-admin-blog/quickstart.md` (1–21) at 360, 390 and 1440px, plus one pass with reduced motion on. Record pass/fail per step in `verification.md`, with screenshots under `shots/033-admin-blog/` if useful.
- [ ] T077 [P] Accessibility pass:
  - One h1 per page on `/blog`, a post page, the preview page and the editor.
  - The toolbar, tabs, dialogs and TOC are fully keyboard operable with visible focus.
  - Scrollable `pre` and `.blog-table` have `tabindex="0"`, `role="region"` and an aria-label: add them in the `table` and `code` renderer overrides in `src/lib/blog/markdown.ts`, and extend the sanitizer allowlist for exactly those attributes, with a test in `tests/unit/blog-markdown.test.ts`.
- [ ] T078 [P] Run Lighthouse mobile on `/blog` and `/blog/<slug>`. The targets are Performance 90+, Accessibility 95+ and SEO 90+, with LCP under 2.5 s. Record the scores in `verification.md` and fix regressions (image `sizes`, `priority` only on the cover or hero).
- [X] T079 Regression check:
  - A program page description renders as before.
  - Course categories create, edit, reorder and delete work.
  - The leads filters work.
  - The founder photo replacement in Settings → Images works.
  - The home hero is unchanged.
  - Confirm `git diff --stat main` shows no edits to the hero components or tokens.

---

## Dependencies and execution order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup and blocks every story. T011 depends on T008. T013 and T014 depend on T009 and T012. T015 depends on T010 and T012. T017 depends on T015 and T016.
- **US1 (Phase 3)**: after Phase 2. This is the MVP.
- **US2 (Phase 4)**: after US1 (it extends the editor and `saveBlogPost`).
- **US3 (Phase 5)**: after US1. T040 renders through `BlogPostView` (T026). Publishing needs a category (Phase 2).
- **US4 (Phase 6)**: after US1. It is independent of US2 and US3, but edits the same `BlogPostEditor.tsx`, so run it serially with T038.
- **US6 (Phase 7)**: after Phase 2. It can run in parallel with US1–US4, and needs published data to test (US3, or insert test documents).
- **US7 (Phase 8)**: after US1 (T024–T026) and Phase 2. T057 also edits the preview page from US3.
- **US10 (Phase 9)**: after every action exists (US1, US3 and Phase 2).
- **US5 (Phase 10)**: after US1 (T032).
- **US8 (Phase 11)**: after US7 (post page) and US6 (blog page). T069 must land with or before T068, or the guard test fails.
- **US9 (Phase 12)**: after Phase 2 (`hasPublishedPostsSafe`). It can run any time after that.
- **Polish (Phase 13)**: after everything.

### Within each story

Tests come before the module they cover. Pure modules come before server modules, then actions, components and pages.

### Same-file conflicts (do not run in parallel)

- `src/lib/admin/blog-actions.ts`: T021, then T022, then T035, then T036, then T037.
- `src/components/admin/BlogPostEditor.tsx`: T030, then T034, then T038, then T045, then T065.
- `src/components/sections/blog/BlogPostView.tsx`: T026, then T057.
- `scripts/admin-guard-test.mts`: T059, then T069.
- `src/app/robots.ts`: T041, then T071.

## Parallel examples

```text
# Phase 2 tests, together:
T005 tests/unit/blog-schema.test.ts
T006 tests/unit/blog-view.test.ts
T007 tests/unit/blog-markdown.test.ts

# Phase 2 pure modules, together (after T008):
T009 src/lib/blog/view.ts
T010 src/lib/admin/blog-schema.ts

# US1 leaf components, together:
T023 globals.css   T024 BlogProse   T025 AuthorLine   T027 TagInput   T028 MarkdownEditor   T029 BlogPreviewPane

# US6 components, together:
T046 BlogPostCard   T047 BlogHero   T048 BlogGrid   T049 BlogFilterChips   T050 BlogPagination   T051 BlogEmpty

# US7 components, together:
T053 BlogToc+TocHighlight   T054 ShareButtons+CopyLinkButton   T055 RelatedPosts   T056 BlogEndCta
```

## Implementation strategy

1. **MVP**: Phases 1–3 (US1). The owner can write, preview live and save drafts. Stop and validate quickstart steps 2, 4, 5 and 8.
2. **Publishable**: add US2, US3 and US4, so the authoring loop is complete and safe.
3. **Readable**: add US6 and US7, so the public blog works. Then US10 seals the access check.
4. **Complete**: add US5, US8 and US9, then Polish.

Each increment ends with lint, build, tests and a browser check at 390 and 1440px (Principle VII). Per the project workflow, finish the feature with a commit, merge to `main`, delete the branch and clean `main` before the next `/sp.specify`.
