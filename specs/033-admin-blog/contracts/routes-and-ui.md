# Contract: routes and UI

## Routes

| Route | File | Rendering | Access |
|-------|------|-----------|--------|
| `/admin/blog` | `src/app/admin/(panel)/blog/page.tsx` | dynamic (`searchParams`: `status`, `category`, `q`) | `requireAdmin()` |
| `/admin/blog/new` | `…/blog/new/page.tsx` | dynamic | `requireAdmin()` |
| `/admin/blog/[id]` | `…/blog/[id]/page.tsx` | dynamic; unknown or malformed id gives `notFound()` | `requireAdmin()` |
| `/admin/blog/categories` | `…/blog/categories/page.tsx` | dynamic | `requireAdmin()` |
| `/blog` | `src/app/(site)/blog/page.tsx` | dynamic on `searchParams` (`category`, `tag`, `page`); data cached by tag | public |
| `/blog/[slug]` | `src/app/(site)/blog/[slug]/page.tsx` (+ `not-found.tsx`) | static params from published slugs, `dynamicParams = true`, data tagged `blog`, `post:<slug>` | public; draft or unknown gives `notFound()` |
| `/blog/preview/[id]` | `src/app/(site)/blog/preview/[id]/page.tsx` | `force-dynamic`, uncached read, `robots: noindex, nofollow` | `requireAdmin()` before any read |
| `/blog/rss.xml` | `src/app/(site)/blog/rss.xml/route.ts` | `GET`, `revalidate = 3600`, `Content-Type: application/rss+xml; charset=utf-8` | public, read-only |
| `/sitemap.xml` | `src/app/sitemap.ts` | metadata route, `revalidate = 3600` | public |
| `/robots.txt` | `src/app/robots.ts` (edit) | adds `sitemap` and disallow `/blog/preview` | public |

## Metadata

- **`/blog`**:
  - title "Blog", with the fixed site description for the blog.
  - canonical `/blog` (or `/blog?page=N` for N ≥ 2 without filters). Filtered views are canonical to `/blog`.
  - The RSS alternate is linked.
- **`/blog/[slug]`**:
  - title is `effectiveSeo.title`, description is `effectiveSeo.description`, canonical is `/blog/<slug>`.
  - OpenGraph `type: "article"` with `publishedTime`, `modifiedTime`, `authors: ["Sheza Fatima"]` and the image = cover (`optimizedUrl(cover.url, 1200)`, with width, height and alt). Twitter card `summary_large_image`.
  - JSON-LD Article (research R18).
- **`/blog/preview/[id]`**: `robots: { index: false, follow: false }` and the title "Preview: <title>".

## Admin sidebar

`src/components/admin/AdminNav.tsx` gets an entry `{ href: "/admin/blog", label: "Blog", Icon: Article, isActive: under("/admin/blog") }` placed after Gallery. The icon comes from `@phosphor-icons/react`, which is already a dependency.

## Components

The client/server split follows Principle XI. Each client component's reason is in brackets.

### Admin — `src/components/admin/`

| Component | Kind | Notes |
|-----------|------|-------|
| `BlogPostRow` | server | Row with the cover thumbnail (`SafeImage`, 64×40), title (link to the editor), category, `StatusChip` (Draft = neutral, Published = success), published date or "—", and a star icon with `aria-label="Featured"` when featured. Stacks into a card at 360px. |
| `FilterBar` | client (existing, **edited**) | Takes `basePath` + `keys` instead of `type` (research R12). The blog list uses selects for status and category, and a search box "Search posts by title". |
| `BlogPostEditor` | client [form state, transitions, dialogs, router] | Owns `values`, `errors`, dirty state and saving. It lays out the fields, `MarkdownEditor`, `BlogPreviewPane`, `SeoPanel` and the action bar. |
| `MarkdownEditor` | client [selection, keyboard] | A `<textarea>` labelled "Content (markdown)". Its toolbar is `role="toolbar"`, with arrow-key roving focus across the buttons, each with an `aria-label` and a 44px target. |
| `MarkdownImageButton` | client [file input, upload, dialog] | Upload progress is shown in the toolbar. The alt-text dialog has a focus trap, Esc cancels it, and Insert stays disabled until alt text is entered. |
| `TagInput` | client [chip state] | The input is labelled "Tags". Chips are buttons "Remove tag <x>". Limits show inline. |
| `SeoPanel` | client [counters] | Counters use `aria-live="polite"` and update only at thresholds. The snippet preview shows title, URL (`<site>/blog/<slug>`) and description, truncated as a search result would be. |
| `BlogPreviewPane` | client [debounced action, tabs] | Calls `renderBlogPreview` and renders `BlogPostView` in `mode="preview"`, inside an `aria-live="off"` region. |
| `DraftRestoreNotice` | client | "Restore unsaved changes from 14:32?" with Restore and Discard buttons, `role="status"`. |
| `CategoryManager` | client (existing, **edited**) | Takes `actions`, `noun` and `withDescription` props (research R11). |
| `ImageUploader`, `ConfirmDialog`, `StatusChip`, `EmptyState`, `UnavailableNotice`, `useUnsavedChanges`, `useToast`, `useActionFeedback` | existing | Reused unchanged. |

**Editor layout**:
- **Mobile (360px)**: one column, in this order: title, slug, excerpt, category, tags, cover, featured, published date, Write/Preview tabs, SEO panel. The sticky bottom action bar holds Save, Publish/Unpublish and a "More" menu with Preview and Delete.
- **Desktop (≥ 1024px)**: the meta fields go in a 2-column grid. The editor and preview sit side by side, each `min-h-[60vh]`, with the preview scrolling independently. The action bar sits at the top right of the page header.
- **Buttons**: "Save draft" becomes "Save changes" once published. Publish and Unpublish are swapped by status. Preview is disabled with the hint "Save once to preview" until the post has an id.

### Public — `src/components/sections/blog/`

| Component | Kind | Notes |
|-----------|------|-------|
| `BlogHero` | server | The featured card, large: cover (`priority`), category, title (h2), excerpt, date and reading time. |
| `BlogPostCard` | server | Cover (lazy, `sizes`), category label, title (h3, the whole card is the link), excerpt clamped to 3 lines, date and "N min read". |
| `BlogGrid` | server | 1 column at 360px, 2 at `sm`, 3 at `lg`. |
| `BlogFilterChips` | server | Links: "All" plus categories with posts, in a horizontally wrapping list (no horizontal page scroll). The current chip has `aria-current="page"`. The tag label has a "Clear" link. |
| `BlogPagination` | server | Previous/next plus page numbers, keeping filters; `nav aria-label="Blog pages"`. |
| `BlogEmpty` | server | "First posts coming soon." / "No posts found" with a link back. |
| `BlogPostView` | server-safe (no hooks) | The whole post layout shared by `/blog/[slug]`, the preview page and the live preview: header (cover, h1 title, category link, date, reading time, `AuthorLine`), `BlogProse`, `BlogToc` (only with `lg` and ≥ 2 headings), tags, `ShareButtons`, related posts and `BlogEndCta`. `mode="preview"` hides share, related and CTA in the *live editor* pane only; the preview page shows everything. |
| `BlogProse` | server-safe | Renders `RenderedContent.segments`, with HTML in `display: contents` wrappers and images via `next/image` (research R3). Uses the `.blog-prose` typography class. |
| `BlogToc` + `TocHighlight` | server + client [IntersectionObserver] | A sticky sidebar list with h3 entries indented. |
| `AuthorLine` | server | 40px round founder photo plus "Sheza Fatima". |
| `ShareButtons` + `CopyLinkButton` | server + client [clipboard] | Three 44px buttons with accessible names "Share on WhatsApp", "Share on LinkedIn" and "Copy link". |
| `RelatedPosts` | server | Up to 3 `BlogPostCard`s under "More to read". |
| `BlogEndCta` | server | "Book a workshop" (`joinHref`) and "Explore courses" (`/courses`) using the existing `Button`. |
| `PreviewBanner` | server | "Preview — not published" (or "Preview — published version may differ until saved"), `role="note"`. |

## Navigation and footer

- `src/lib/site.ts`: `navItemsFor({ gallery, blog })` gives Programs, Courses, [Gallery], Our Way, [Blog].
- `src/app/(site)/layout.tsx`: `const [gallery, blog] = await Promise.all([hasPublicGallerySafe(), hasPublishedPostsSafe()])`.
- Header and Footer already take `items`, so they need no edit.

## Motion and accessibility

- **Motion**: card hover lift, TOC smooth scroll and tab transitions run only under `prefers-reduced-motion: no-preference`, and animate only `transform` and `opacity`.
- **Headings**: one h1 per page. On `/blog` the h1 is "Blog", the hero title is an h2 and card titles are h3. On a post the title is the h1 and content headings start at h2.
- **360px**: `.blog-prose pre` and `.blog-table` are `overflow-x: auto` with `tabindex="0"` and `role="region"` plus an aria-label "Code" or "Table", so they can be scrolled by keyboard. Long words wrap (`overflow-wrap: anywhere`).
