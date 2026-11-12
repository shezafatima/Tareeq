# Implementation Plan: Admin-managed blog

**Branch**: `033-admin-blog` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/033-admin-blog/spec.md`

## Summary

This adds two MongoDB collections, `BlogCategory` and `BlogPost`, managed at `/admin/blog`. They are shown at `/blog`, `/blog/[slug]`, an admin-only `/blog/preview/[id]`, an RSS feed and a new site-wide `sitemap.xml`.

- **Rendering** extends the existing `marked` + `sanitize-html` renderer:
  - The programs allowlist becomes an exported base, and the blog adds images (our Cloudinary only), tables and heading anchors on top. Program output is unchanged.
  - The renderer returns **segments**, so stand-alone body images go through `next/image`. Their sizes are looked up once at Cloudinary on save and stored on the post.
- **Live preview** is a debounced admin Server Action that calls the *same* renderer. The editor pane, the preview page and the public page share one `BlogPostView` component, so they cannot drift apart.
- **Save, publish and unpublish** are one action whose target status is checked against the publish rules on the server. The cover reuses the 030 verified-image flow with a new `"blog"` upload scope.
- **Public reads** come from one cached list of published post cards (tag `blog`) plus a per-post read (tags `blog` and `post:<slug>`). Every action refreshes both.
- **Reuse instead of copies**: `CategoryManager` and `FilterBar` are generalised. The nav gains `blog` in `navItemsFor`, and the Header is unchanged.
- **No new dependencies.**

## Technical Context

**Language/Version**: TypeScript 5, Node 22
**Primary Dependencies**: Next.js 16.4 (App Router, Server Actions, `unstable_cache`, metadata routes), React 19.3, Mongoose 9.11, zod 4.6 (`zod/mini`), marked 18.1, sanitize-html 2.18, cloudinary 2.11 (server only), next-auth 5 beta, `@phosphor-icons/react`, Tailwind 4. **No new dependencies.**
**Storage**: MongoDB, new collections `blog_categories` and `blog_posts`. Images in Cloudinary under `tareeq/blog/`. Unsaved editor copies are kept in the owner's `localStorage` only.
**Testing**: `node --test` unit tests (`npm run test:unit`), `npm run test:admin-guard` (extended), manual browser checks (quickstart.md)
**Target Platform**: Web, mobile-first (360px+)
**Project Type**: Single Next.js web app (`src/`)
**Performance Goals**: Principle VI Lighthouse targets on `/blog` and `/blog/[slug]`; LCP under 2.5 s (SC-008); preview update about 0.5 s after typing stops
**Constraints**: Reuse the existing renderer and sanitizer, existing admin patterns, 360px with no horizontal scroll, reduced motion, 44px targets, no personal data in logs, raw HTML never rendered
**Scale/Scope**: Tens to low hundreds of posts, under 20 categories, one owner

All Technical Context items are known; there are no NEEDS CLARIFICATION entries. Design choices are in [research.md](./research.md) (R1–R19).

## Constitution Check

*GATE: passed before Phase 0. Re-checked after Phase 1 design: still passes.*

| Principle | Status | How |
|-----------|--------|-----|
| I Mobile-first | ✅ | 1-column grid, editor with Write/Preview tabs, and a sticky action bar at 360px. Code blocks and tables scroll inside their own box. Chips wrap. All targets 44px. |
| II Reusable components | ✅ | One `BlogPostView`/`BlogProse` for the public page, preview page and live preview. `CategoryManager` and `FilterBar` are generalised rather than copied (R11, R12). Reuses `ImageUploader`, `uploadToCloudinary`, `ConfirmDialog`, `StatusChip`, `EmptyState`, `SafeImage`, `Button`, `useUnsavedChanges`, `useFocusTrap` and `nextFreeSlug`. |
| III Brand tokens | ✅ | `.blog-prose` and the components use existing tokens only. Sora for headings, Inter for body. Saffron is never used as text on a light background. |
| IV Accessible | ✅ | One h1 per page. Cover alt text is required to publish and in-body images need alt text. The toolbar is a labelled `role="toolbar"`, the tabs are a tablist, and dialogs trap focus. The TOC uses `aria-current`. Copy link is announced in a live region. Scrollable regions are focusable. |
| V Protect data | ✅ | `requireAdmin()` on admin and preview pages, and `withAdmin` on all 7 new actions plus `signUpload("blog")`. Every input is re-validated on the server, the cover is verified at Cloudinary, raw HTML is dropped and the sanitizer is allowlist-only. Logs carry ids only. The public RSS route is read-only and guard-checked. |
| VI Fast | ✅ | Covers and stand-alone body images via `next/image` with `sizes` and lazy loading (the cover is `priority`). Pages are static or cached with tag refresh. The client JS on public pages is limited to `CopyLinkButton` and `TocHighlight`. |
| VII Small verified steps | ✅ | Five milestones below, each ending with lint, build, tests and a browser check at 390 and 1440px. |
| VIII Hero untouched | ✅ | Only `navItemsFor` and the `SiteLayout` data read change. `Header` and `Footer` already take `items` (032), so no shell markup or styles change. |
| IX No surprise deps | ✅ | None added. DOMPurify and an editor library were considered and rejected (R2, R13). |
| X Safest option | ✅ | Drafts by default and no seed data. Blog is hidden when empty. A failed nav read hides the link. Images outside our store are dropped. Body images are kept on post delete. |
| XI Server components by default | ✅ | All pages, cards, the grid, the TOC list and the post view are server or server-safe. Client leaves: `BlogPostEditor` (form state), `MarkdownEditor` (selection), `MarkdownImageButton` (upload and dialog), `TagInput` (chips), `SeoPanel` (counters), `BlogPreviewPane` (debounced action), `DraftRestoreNotice`, `TocHighlight` (IntersectionObserver), `CopyLinkButton` (clipboard), plus the edited `FilterBar` and `CategoryManager`. |

## Project Structure

### Documentation (this feature)

```text
specs/033-admin-blog/
├── plan.md
├── research.md          # R1–R19
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── data-access.md   # reads, Server Actions, renderer guarantees, guard test
│   └── routes-and-ui.md # routes, metadata, components, layout
├── checklists/requirements.md
└── tasks.md             # /sp.tasks
```

### Source Code

```text
src/lib/blog/
├── model.ts                  # NEW  BlogCategoryModel, BlogPostModel
├── data.ts                   # NEW  cached public reads (tags "blog", "post:<slug>")
├── view.ts                   # NEW  pure: shapes, readingMinutes, pickHero, filterCards, paginate, rankRelated, effectiveSeo
├── markdown.ts               # NEW  renderBlogMarkdown → { segments, headings }
├── editor-format.ts          # NEW  pure toolbar text transforms
└── draft-storage.ts          # NEW  localStorage copy (try/catch everywhere)
src/lib/programs/markdown.ts  # EDIT export BASE_SANITIZE (output unchanged)
src/lib/cloudinary/server.ts  # EDIT UPLOAD_SCOPES += "blog"; lookupAssetSize(publicId) (read-only)
src/lib/seo.ts                # NEW  siteUrl(path), jsonLd(obj) (escapes "<")
src/lib/site.ts               # EDIT navItemsFor({ gallery, blog })
src/lib/admin/
├── blog-schema.ts            # NEW  parseBlogPost, publishIssues, limits, messages
├── blog-read.ts              # NEW  uncached admin reads
├── blog-actions.ts           # NEW  saveBlogPost, deleteBlogPost, renderBlogPreview
├── blog-categories-actions.ts# NEW  create/update/setOrder/delete BlogCategory
├── leads-params.ts           # EDIT extract listHref(); leadsHref unchanged
└── log.ts                    # EDIT AdminEvent += "blog"
src/app/admin/(panel)/blog/
├── page.tsx, new/page.tsx, [id]/page.tsx, categories/page.tsx   # NEW
src/app/admin/(panel)/courses/categories/page.tsx                 # EDIT pass actions/noun/withDescription
src/app/admin/(panel)/submissions/*/page.tsx                      # EDIT FilterBar basePath/keys
src/app/(site)/blog/
├── page.tsx                                  # NEW
├── [slug]/page.tsx, [slug]/not-found.tsx     # NEW
├── preview/[id]/page.tsx                     # NEW
└── rss.xml/route.ts                          # NEW
src/app/(site)/layout.tsx     # EDIT read hasPublishedPostsSafe alongside gallery
src/app/sitemap.ts            # NEW
src/app/robots.ts             # EDIT sitemap + disallow /blog/preview
src/app/globals.css           # EDIT .blog-prose typography
src/components/admin/
├── BlogPostRow.tsx, BlogPostEditor.tsx, MarkdownEditor.tsx, MarkdownImageButton.tsx,
├── TagInput.tsx, SeoPanel.tsx, BlogPreviewPane.tsx, DraftRestoreNotice.tsx   # NEW
├── CategoryManager.tsx       # EDIT actions/noun/withDescription props
├── FilterBar.tsx             # EDIT basePath/keys props
└── AdminNav.tsx              # EDIT Blog entry
src/components/sections/blog/
├── BlogHero, BlogPostCard, BlogGrid, BlogFilterChips, BlogPagination, BlogEmpty,
├── BlogPostView, BlogProse, BlogToc, TocHighlight, AuthorLine, ShareButtons,
└── CopyLinkButton, RelatedPosts, BlogEndCta, PreviewBanner   (.tsx)     # NEW
scripts/admin-guard-test.mts  # EDIT 7 actions, arg sets, public RSS route rule
tests/unit/
├── blog-schema.test.ts       # NEW  limits, tag normalisation, reserved slug, publishIssues
├── blog-view.test.ts         # NEW  readingMinutes, hero, filters, paginate, rankRelated, effectiveSeo
├── blog-markdown.test.ts     # NEW  sanitising, segments, heading ids, tables (contracts/data-access.md)
├── blog-editor-format.test.ts# NEW  toolbar transforms keep selection
├── blog-draft-storage.test.ts# NEW  restore decision, storage throwing
├── programs-markdown.test.ts # existing; must still pass unchanged
└── site-links.test.ts        # EDIT navItemsFor blog cases
```

**Structure Decision**: Single Next.js project, following the 032 gallery layout (`src/lib/<feature>/` plus `src/lib/admin/<feature>-*`, with public components under `components/sections/<feature>/`). See research R1.

## Milestones

1. **Data, rules and renderer**:
   - Models, `view.ts`, `blog-schema.ts`, `BASE_SANITIZE` export, `markdown.ts`, `editor-format.ts`, `draft-storage.ts`, `seo.ts`, `data.ts`, `blog-read.ts`, `log.ts`.
   - Check: all new unit tests pass, `programs-markdown.test.ts` passes unchanged, build is clean.
2. **Actions, upload scope and guard**:
   - `"blog"` scope, `lookupAssetSize`, `blog-actions.ts`, `blog-categories-actions.ts`, guard-test edits (actions plus the public route rule).
   - Check: `test:admin-guard` passes, and program, course and founder-photo uploads still work.
3. **Admin UI**:
   - Sidebar, generalised `CategoryManager` and `FilterBar` (with courses and leads pages updated), categories page, posts list, editor with toolbar, image button, tags, SEO panel, live preview, autosave and restore, unsaved warning.
   - Check: quickstart steps 2–9, 16–18, 20 at 360/390/1440px. Course categories and leads filters unchanged.
4. **Public blog**:
   - `.blog-prose`, the `sections/blog/*` components, `/blog`, `/blog/[slug]`, the preview page, nav flag in `SiteLayout`.
   - Check: quickstart steps 1, 10, 11, 13–15, 19 at 360/390/1440px and with reduced motion. The home hero is identical.
5. **SEO and feeds**:
   - Post metadata, OG and JSON-LD, `sitemap.ts`, `robots.ts`, `rss.xml` route, RSS alternate links.
   - Check: quickstart step 12, feed and structured-data validators, Lighthouse mobile on `/blog/<slug>`, step 21 regression.

## Risks

- **Sanitizer widening opens an XSS path**. Mitigation: allowlist-only; raw HTML tokens are dropped before sanitising; the image `src` is locked to our cloud; `class` values are restricted; unit tests in contracts/data-access.md cover each vector. The program allowlist is unchanged.
- **Generalising `FilterBar` and `CategoryManager` regresses leads or course categories**. Mitigation: `leadsHref` keeps its output (existing `admin-leads-params` tests), only props change, and both areas are re-checked in milestone 3.
- **The live preview round-trip feels slow on a poor connection**. Mitigation: 400 ms debounce, stale responses dropped, and the last good preview stays visible. If it is still not acceptable, the fallback is to render the preview only on tab switch at mobile widths (no contract change).

## Follow-ups

- The spec's assumption that deleting a post keeps its images was corrected: covers are deleted, consistent with `deleteProgram` and `deleteCourse`, while body images are kept (research R10). spec.md has been updated.
- If posts grow beyond about 1,000, replace the in-memory card list (R7) with paged Mongo queries. The read-function signatures stay the same.

## Complexity Tracking

No constitution violations.

📋 Architectural decision detected: **blog rendering pipeline**. The markdown renderer returns segments so stand-alone images go through `next/image`, with sizes stored per post and the live preview served by a Server Action calling the same renderer (R2–R5). Document reasoning and tradeoffs? Run `/sp.adr blog-markdown-rendering-pipeline`
