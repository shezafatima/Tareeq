# Feature Specification: Admin-managed blog

**Feature Branch**: `033-admin-blog`
**Created**: 2026-11-12
**Status**: Draft
**Input**: Blog (admin-managed). The owner writes, previews and publishes blog posts (markdown, with images) and manages blog categories from the admin. Visitors read posts on /blog and /blog/[slug] with filters, a table of contents, share buttons, related posts and an end call to action. Posts are SEO-ready (metadata, share images, structured data, canonical URL, sitemap, RSS). Blog shows in the nav and footer only once a post is published. Full input preserved in `history/prompts/033-admin-blog/`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Write and save a draft post (Priority: P1)

The owner opens Blog in the admin sidebar, chooses "New post", types a title (the address slug fills in from it and can be edited), a short excerpt (a counter shows characters left of 200), picks a category, adds tags as chips and uploads a cover image with alt text. They write the body in a markdown editor with a toolbar (heading, bold, italic, link, list, quote, code, image). On desktop a live preview sits beside the editor; on mobile, "Write" and "Preview" tabs switch between them. The preview looks exactly like the public post page. They choose "Save draft".

**Why this priority**: Writing and saving is the foundation; nothing else exists without a post.

**Independent Test**: Create a post with every field filled, save it as a draft, reload the editor and confirm every field is restored; confirm the post is listed as Draft and is not reachable on the public site.

**Acceptance Scenarios**:

1. **Given** the posts list, **When** the owner chooses "New post", types "Teaching Kids to Code" as the title, **Then** the slug field shows `teaching-kids-to-code` until the owner edits the slug by hand, after which title changes no longer overwrite it.
2. **Given** an excerpt field, **When** the owner types, **Then** a counter shows the remaining characters out of 200, and the field does not accept more than 200 (also enforced on the server).
3. **Given** the tags field, **When** the owner types a tag and presses Enter or comma, **Then** it becomes a removable chip; duplicates (ignoring case and surrounding spaces) are not added.
4. **Given** the editor, **When** the owner selects text and uses a toolbar button (or its keyboard shortcut for bold, italic and link), **Then** the matching markdown is applied around the selection or inserted at the cursor, and focus stays in the editor.
5. **Given** a desktop width, **When** the owner types in the editor, **Then** the preview beside it updates within about half a second, using the same rendering and typography as the public post page.
6. **Given** a 360px width, **When** the editor loads, **Then** "Write" and "Preview" tabs are shown, with no horizontal scroll.
7. **Given** a title only, **When** the owner chooses "Save draft", **Then** the draft is saved; the reading time is computed from the body.
8. **Given** a slug already used by another post, **When** the owner saves, **Then** saving is refused with a message at the slug field (the owner's input is kept).

---

### User Story 2 - Insert images into the post body (Priority: P1)

While writing, the owner presses the image button, picks an image file, enters alt text when asked, and the image is uploaded and inserted as `![alt](address)` at the cursor.

**Why this priority**: Images are central to readable posts; the user explicitly asked for in-editor upload.

**Independent Test**: Place the cursor mid-paragraph, insert an image with alt text, confirm the markdown appears exactly at the cursor and the image renders in the preview and on the public page.

**Acceptance Scenarios**:

1. **Given** the cursor in the body, **When** the owner uses the image button and chooses a valid image, **Then** they are asked for alt text, and the image is uploaded through the existing signed-upload flow.
2. **Given** the upload succeeds, **When** alt text has been entered, **Then** `![alt](address)` is inserted at the cursor position (replacing any selected text) and the preview shows the image.
3. **Given** an invalid or oversized file, or a failed upload, **When** it fails, **Then** a clear error is shown and the body text is unchanged.
4. **Given** the alt-text prompt, **When** the owner leaves it empty, **Then** insertion is not allowed until alt text is given, or the owner cancels and nothing is inserted (the uploaded file is cleaned up best effort).

---

### User Story 3 - Publish, unpublish, preview and delete (Priority: P1)

From the editor the owner can open "Preview" (a new tab showing the post at a private preview address exactly as the public page would show it), "Publish" a draft, "Unpublish" a published post, and "Delete" a post after confirming.

**Why this priority**: Publishing is the gate between writing and readers.

**Independent Test**: Preview a draft (visible to the signed-in owner, "not found" for a signed-out browser), publish it (appears on /blog), unpublish it (disappears, its address returns "not found"), then delete it.

**Acceptance Scenarios**:

1. **Given** a draft, **When** the owner chooses "Preview", **Then** a new tab opens the preview page, which renders the latest saved version with the same layout as the public post page, is marked "do not index" and shows a "Preview — not published" banner.
2. **Given** a signed-out visitor, **When** they open a preview address, **Then** they are refused (sent to sign in) and no post content is shown.
3. **Given** a draft with title, slug, excerpt, category, cover image with alt text and a non-empty body, **When** the owner chooses "Publish", **Then** it becomes published, its publish date is set to now (if never published before) and it appears on /blog on the next load.
4. **Given** a draft missing any field listed in scenario 3, **When** the owner chooses "Publish", **Then** publishing is refused (also on the server) with a message at each missing field, and the post stays a draft.
5. **Given** a published post, **When** the owner chooses "Unpublish", **Then** it returns to draft, disappears from all public lists, feeds and the sitemap, and its address returns "not found"; its publish date is kept for a later republish.
6. **Given** a published post, **When** the owner edits and saves it, **Then** the changes are live on the next public load (the primary button reads "Save changes" rather than "Save draft").
7. **Given** a published post, **When** the owner edits the publish date and saves, **Then** the new date is shown publicly and used for ordering.
8. **Given** a post, **When** the owner chooses "Delete" and confirms, **Then** the post is removed permanently and its address returns "not found"; cancel changes nothing.

---

### User Story 4 - Never lose work (Priority: P1)

If the owner tries to leave the editor with unsaved changes, they are warned. While they type, the draft is also kept in the browser; if the tab crashed or closed, re-opening that post's editor offers "Restore unsaved changes from <time>?" with Restore and Discard.

**Why this priority**: Long-form writing loss is the most painful failure for an author.

**Independent Test**: Type into a post, close the tab without saving, re-open the editor, and confirm the restore offer appears and restores the exact text; repeat with browser storage blocked and confirm the editor still works with no errors.

**Acceptance Scenarios**:

1. **Given** unsaved changes, **When** the owner navigates away, reloads or closes the tab, **Then** the browser asks for confirmation.
2. **Given** the owner is typing, **When** a few seconds pass after the last change, **Then** a browser copy of the draft is updated.
3. **Given** a browser copy newer than the saved post, **When** the editor opens, **Then** the restore offer appears; Restore loads it into the form (unsaved), Discard removes it.
4. **Given** the post is saved successfully, **When** the save completes, **Then** the browser copy for that post is cleared and the unsaved warning no longer applies.
5. **Given** browser storage is unavailable or full, **When** the editor is used, **Then** it works normally without autosave and without visible errors.

---

### User Story 5 - Manage posts and categories (Priority: P2)

The owner sees all posts in a list with cover thumbnail, title, category, a Draft/Published chip, publish date and a featured star, can filter by status and category and search by title. On a categories page they create, rename, reorder and delete categories.

**Why this priority**: Needed to keep the blog organised; secondary to writing and publishing.

**Independent Test**: With 5 posts across 2 categories and both statuses, filter and search and confirm results; create, rename and reorder categories; try to delete a category in use (refused, with count) and an unused one (deleted).

**Acceptance Scenarios**:

1. **Given** posts exist, **When** the owner opens /admin/blog, **Then** each row shows cover thumbnail (or a placeholder), title, category, status chip, publish date (or "—" if never published) and a star when featured, newest-updated first.
2. **Given** the list, **When** the owner filters by status and/or category and types in the search box, **Then** only posts matching all filters and whose title contains the search text (ignoring case) are shown; filters survive a reload (kept in the address).
3. **Given** no posts, **When** the list loads, **Then** an empty state invites the owner to write the first post (and to create a category first if none exist).
4. **Given** /admin/blog/categories, **When** the owner creates a category with a name, **Then** it gets a unique slug from the name and appears in the list at the end of the order.
5. **Given** categories, **When** the owner changes an order number and saves, **Then** the admin list, the editor's category picker and the public filter chips all use the new order (ties: name A–Z).
6. **Given** a category used by 3 posts, **When** the owner tries to delete it, **Then** it is refused with "Used by 3 posts — move them to another category first."
7. **Given** an unused category, **When** the owner deletes it and confirms, **Then** it is removed.

---

### User Story 6 - Readers browse the blog (Priority: P1)

A visitor opens /blog: if a post is marked featured, a large hero shows it first; below, a grid of post cards (cover, category, title, excerpt, date, reading time), 9 per page with pagination. Category chips filter the list; a tag on a post links to the list filtered by that tag.

**Why this priority**: This is the reader-facing value of the feature.

**Independent Test**: With 12 published posts (one featured) across 2 categories, check the hero, page 1 and page 2, a category filter, a tag filter, and an invalid page number.

**Acceptance Scenarios**:

1. **Given** at least one published featured post, **When** /blog page 1 loads with no filters, **Then** the most recently published featured post appears as the hero and is not repeated in the grid.
2. **Given** published posts, **When** /blog loads, **Then** the grid shows published posts newest first by publish date, 9 per page, with pagination controls (previous, next, page numbers) that keep active filters.
3. **Given** category chips (an "All" chip plus each category with at least one published post, in category order), **When** the visitor selects one, **Then** the address gains `?category=<slug>`, the list shows only that category, the chip is marked current, and the hero is hidden.
4. **Given** a post card or post page tag, **When** the visitor selects it, **Then** /blog opens with `?tag=<tag>` showing only posts with that tag, a visible "Tag: <tag>" label with a clear-filter control, and no hero.
5. **Given** an unknown category or tag, or a page number beyond the last page, **When** /blog loads, **Then** a friendly "No posts found" message with a link back to all posts is shown (not an error).
6. **Given** no published posts at all, **When** /blog loads, **Then** it shows "First posts coming soon." and no grid, chips or pagination.

---

### User Story 7 - Read a post (Priority: P1)

A visitor opens a post: cover image, title, category, date, reading time and an author line "Sheza Fatima" with her photo, then the content with clear typography (headings, lists, quotes, code blocks, tables, images). On desktop a sticky table of contents built from the post's section headings sits beside the text. Below: share buttons (WhatsApp, LinkedIn, copy link), 3 related posts and a closing call to action ("Book a workshop" / "Explore courses").

**Why this priority**: The post page is where readers spend their time and where the blog converts to bookings.

**Independent Test**: Publish a post containing h2/h3 headings, a list, a quote, a code block, a table and an image; open it on desktop and at 360px; use the table of contents, the three share buttons, a related post and both CTA buttons.

**Acceptance Scenarios**:

1. **Given** a published post, **When** its page loads, **Then** it shows the cover (with alt text), title as the only top-level heading, category (linking to the filtered list), publish date, "N min read", and the author line with the founder photo from the site images setting.
2. **Given** content with level-2 and level-3 headings, **When** viewed at desktop width, **Then** a sticky table of contents lists them (level 3 indented), each linking to its section; the current section is highlighted while scrolling. Below desktop width, or with fewer than 2 headings, no table of contents is shown.
3. **Given** content containing images, **When** rendered, **Then** they appear responsive, optimised, lazily loaded and with their alt text; code blocks scroll horizontally inside themselves and tables scroll inside their own container, never the page, at 360px.
4. **Given** content containing raw HTML, script, event-handler attributes or unsafe link schemes, **When** rendered (in preview or public), **Then** none of it is executed or output; raw HTML is not rendered.
5. **Given** the share area, **When** the visitor chooses WhatsApp or LinkedIn, **Then** a share window opens prefilled with the post's address (and title for WhatsApp); **When** they choose "Copy link", **Then** the address is copied and a "Link copied" confirmation is announced to screen readers too.
6. **Given** other published posts, **When** the post page loads, **Then** up to 3 related posts are shown: same category first (newest first), then other posts by most shared tags, then newest; the current post is never included. With no other posts the section is not shown.
7. **Given** the end of the post, **When** it renders, **Then** a CTA block offers "Book a workshop" (to /workshop) and "Explore courses" (to /courses).
8. **Given** a draft, unpublished or unknown slug, **When** /blog/<slug> is requested, **Then** the site's standard "not found" page is shown.

---

### User Story 8 - Found by search engines and feeds (Priority: P2)

Each post has its own page title, description, canonical address and share image (its cover), structured "Article" data, is listed in the site's sitemap, and appears in an RSS feed at /blog/rss.xml. The owner controls the search title and description in an SEO panel with counters and a Google-style result preview.

**Why this priority**: Discoverability is the main reason to run a blog; depends on publishing.

**Independent Test**: Publish one post with custom SEO fields and one without; check page metadata, link-preview tags, structured data, the sitemap and the RSS feed for both; unpublish one and confirm it disappears from both.

**Acceptance Scenarios**:

1. **Given** the SEO panel, **When** the owner types a meta title and description, **Then** counters show the length against recommended limits (60 and 160 characters; soft warnings beyond them, hard limits of 70 and 200 on the server), and a snippet preview shows the title, address and description as a search result would, falling back to the post title and excerpt when empty.
2. **Given** a published post, **When** its page is loaded, **Then** its page title and description use the SEO fields or fall back to title and excerpt, its canonical address is its own /blog/<slug> address, and link previews use the cover image.
3. **Given** a published post, **When** its page is loaded, **Then** it includes structured Article data with headline, description, image, publish date, last-modified date, author "Sheza Fatima" and the site as publisher.
4. **Given** published posts, **When** /sitemap.xml is requested, **Then** it lists the site's public pages and every published post with its last-modified date; drafts never appear.
5. **Given** published posts, **When** /blog/rss.xml is requested, **Then** a valid RSS 2.0 feed lists published posts newest first (up to 20) with title, link, excerpt, publish date and category.
6. **Given** a filtered or paginated /blog address, **When** loaded, **Then** its canonical address is /blog (page 2+ use their own page address); the preview page is never indexed.

---

### User Story 9 - Blog appears in navigation only when there is something to read (Priority: P2)

Before the first post is published, Blog appears in neither the site navigation nor the footer. As soon as one post is published it appears in both.

**Why this priority**: Avoids an empty-looking section on a new site.

**Acceptance Scenarios**:

1. **Given** no published posts, **When** any public page loads, **Then** Blog is absent from the desktop navigation, the mobile menu and the footer.
2. **Given** at least one published post, **When** any public page loads, **Then** Blog appears in all three.
3. **Given** the last published post is unpublished or deleted, **When** the next public page loads, **Then** Blog disappears again.

---

### User Story 10 - Owner-only access (Priority: P1)

Only a signed-in owner can open the blog admin pages and the preview pages, request an upload signature for blog images, or create, edit, publish, unpublish, delete posts and categories.

**Why this priority**: Without it anyone could publish content on the site or read unpublished drafts.

**Independent Test**: Extend the existing unauthenticated-action test so every new blog action and the blog upload signature are called without a session and each is refused with nothing changed; open admin and preview addresses signed out.

**Acceptance Scenarios**:

1. **Given** no session, **When** any blog post or category action is called, **Then** it is refused and no record changes.
2. **Given** no session, **When** an upload signature for blog images is requested, **Then** it is refused.
3. **Given** no session, **When** /admin/blog, the editor, the categories page or a preview address is visited, **Then** the visitor is sent to sign in and no draft content is returned.

---

### Edge Cases

- Two posts whose titles give the same slug: the slug field shows the conflict on save; the owner chooses a different slug (the auto-suggestion appends `-2`, `-3`, … when the base is taken).
- Changing the slug of a published post breaks existing links: the editor warns "Changing the address of a published post breaks links already shared" before saving.
- Several posts marked featured: only the most recently published featured post is the hero; the others appear in the grid normally.
- A featured post that is a draft: never shown as the hero.
- A post whose category is missing (data edited outside the admin): public pages still render, without a category label; it cannot be published again until a category is chosen.
- An image in the body that points outside the site's image store: not rendered as an optimised image; only images from the site's image store are shown (others are dropped by the sanitizer).
- The founder photo has not been set in site images: the author line uses the existing default founder photo.
- Very long titles, excerpts, tags or unbroken words/URLs in content: wrap without horizontal scroll at 360px.
- A post with no headings: no table of contents, the content spans the full reading width.
- Duplicate heading text: each table-of-contents link still goes to its own section (anchors are made unique).
- The owner opens the same post in two tabs and saves both: the later save wins; the earlier tab's browser copy is not offered once the server version is newer.
- Browser copy belongs to a post that has since been deleted: it is ignored and cleared.
- The image store is not configured (local development without keys): cover upload and the image button show that uploads are unavailable rather than failing silently, as elsewhere in the admin.
- Saving fails because the data store is unreachable: the form keeps the owner's input and shows a retryable error; the browser copy is kept.
- Pagination links with an out-of-range or non-numeric page value: treated as "No posts found" (out of range) or page 1 (non-numeric).
- A tag in the address with different letter case: matched ignoring case.
- Reduced-motion preference: no smooth scrolling for table-of-contents jumps, no card hover animations or reveal transitions.

## Requirements *(mandatory)*

### Functional Requirements

**Data**

- **FR-001**: The system MUST store blog categories with: name (required, max 60), unique slug (from the name on creation, made unique automatically), order number and created/updated times.
- **FR-002**: The system MUST store blog posts with: title (required, max 120), unique slug (lowercase letters, digits and hyphens), excerpt (max 200), cover image (same shape as existing site images, including alt text), markdown content, category, tags (list of text, trimmed, lower-cased, de-duplicated, max 10 tags of max 30 characters each), status (draft or published), publish date, reading time in minutes, optional SEO meta title and description, featured flag and created/updated times.
- **FR-003**: Reading time MUST be recomputed on every save from the content's word count at 200 words per minute, rounded up, minimum 1.
- **FR-004**: The publish date MUST be set to the current time the first time a post is published, MUST be kept when a post is unpublished and republished, and MUST be editable by the owner.
- **FR-005**: The author MUST be fixed as "Sheza Fatima", with her photo taken from the founder photo in site images (falling back to the existing default founder photo). There is no author record or author selection.
- **FR-006**: The server MUST provide read functions for: published posts (optionally filtered by category slug or tag, paginated at 9 per page, newest publish date first, with total count), a single published post by slug, up to 3 related posts for a post (ordering per User Story 7, scenario 6), and categories in order. These MUST be usable only on the server and their results cached under a blog-wide tag and a per-post tag.

**Admin – posts**

- **FR-007**: The admin MUST have a Blog section listed in the admin sidebar, following existing admin page patterns, with a posts list per User Story 5, scenarios 1–3.
- **FR-008**: The editor MUST provide fields for title, slug (auto from title until edited by hand; editable; uniqueness enforced on the server), excerpt with live counter, category picker, tag chip input, cover image (existing image uploader, alt text required to publish), featured toggle and publish date.
- **FR-009**: The editor MUST provide a markdown text area with a toolbar for heading, bold, italic, link, bulleted/numbered list, quote, code and image; each button MUST have an accessible name and be operable by keyboard.
- **FR-010**: The editor MUST show a live preview rendered with the same renderer, sanitizer and typography as the public post page: side by side at desktop width, as Write/Preview tabs below it.
- **FR-011**: The image button MUST upload through the existing signed-upload flow (with its file-type and size limits), require alt text, and insert `![alt](address)` at the cursor per User Story 2.
- **FR-012**: The editor MUST have an SEO panel per User Story 8, scenario 1.
- **FR-013**: The editor MUST offer: Save draft (Save changes for a published post), Publish / Unpublish, Delete with confirmation, and Preview (opens the preview address in a new tab; available once the post has been saved at least once).
- **FR-014**: Publishing MUST require title, slug, excerpt, category, cover image with alt text and non-empty content; the server MUST refuse a publish missing any of them and report each missing field.
- **FR-015**: The editor MUST warn before leaving with unsaved changes, and MUST keep a per-post browser copy of unsaved changes and offer to restore it per User Story 4; all browser-storage use MUST fail silently when storage is unavailable.

**Admin – categories**

- **FR-016**: /admin/blog/categories MUST allow creating, renaming, reordering (by order number) and deleting categories; deletion MUST be refused on the server while any post (draft or published) uses the category, stating how many.

**Preview**

- **FR-017**: /blog/preview/[post id] MUST render the latest saved version of any post (draft or published) with the same layout as the public post page plus a visible "Preview — not published" banner when it is a draft; it MUST require a signed-in owner checked on the server, MUST be marked not to be indexed and MUST NOT be cached publicly.

**Public site**

- **FR-018**: /blog MUST behave per User Story 6, including the featured hero rule, 9-per-page pagination, category chips and tag filtering via the address, and the "First posts coming soon." empty state.
- **FR-019**: /blog/[slug] MUST behave per User Story 7, including the table of contents from level-2 and level-3 headings on desktop, share buttons, related posts and the end CTA.
- **FR-020**: Post content MUST be rendered by the existing markdown renderer and sanitizer, with a blog-specific allowlist that adds images (from the site's image store only) and tables, keeps code and code blocks, adds unique anchors to headings, turns any top-level heading into a level-2 heading, and continues to disallow raw HTML, scripts, event handlers and unsafe link schemes. Program descriptions MUST render exactly as before.
- **FR-021**: Images in post content and covers MUST be served in an automatically chosen modern format and quality, sized for their space and lazily loaded (except the cover, which is the first visible content).
- **FR-022**: Draft, unpublished and unknown slugs MUST return the site's standard "not found" response.
- **FR-023**: Blog MUST appear in the site navigation (desktop and mobile) and the footer only while at least one post is published.

**SEO and feeds**

- **FR-024**: Each published post page MUST have its own title, description, canonical address, link-preview data with the cover image, and structured Article data per User Story 8.
- **FR-025**: The site MUST serve /sitemap.xml listing its public pages and all published posts with last-modified dates (this feature creates the sitemap, as none exists today).
- **FR-026**: The site MUST serve an RSS 2.0 feed at /blog/rss.xml per User Story 8, scenario 5, discoverable from the blog pages.

**Freshness, security and quality**

- **FR-027**: Every post or category create, edit, publish, unpublish and delete MUST refresh the blog-wide cache tag and the affected post's tag (old and new slug when the slug changes), so /blog, post pages, related posts, navigation, sitemap and RSS reflect the change on the next load.
- **FR-028**: Every blog action, every blog admin page, every preview page and the blog upload signature MUST check for a signed-in owner on the server; the existing unauthenticated-action test MUST be extended to cover each new action and the signature.
- **FR-029**: All input MUST be validated on the server (lengths, slug format, status values, category existence) regardless of client checks.
- **FR-030**: The feature MUST add no new third-party dependencies.
- **FR-031**: All admin and public blog screens MUST be usable at 360px width with no horizontal page scroll, operable by keyboard alone, and MUST respect reduced-motion preferences.

### Key Entities

- **Blog category**: A topic grouping posts (e.g. "Teaching tips"). Attributes: name, slug, order, created/updated times. Has many posts; cannot be deleted while it has any.
- **Blog post**: One article. Attributes: title, slug, excerpt, cover image (address, image-store identifier, width, height, alt), markdown content, category, tags, status, publish date, reading time, SEO title/description, featured, created/updated times. Belongs to one category (required to publish).
- **Author (fixed)**: Not stored; always Sheza Fatima with the founder photo from site images.
- **Browser draft copy**: A per-post copy of unsaved editor content kept only in the owner's browser, with the time it was taken; never sent to the server except when the owner restores and saves it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can create a category, write a post with a cover and two inline images, preview it, publish it and see it on /blog in under 15 minutes, with no code change or redeploy.
- **SC-002**: 0 drafts or unpublished posts are ever reachable on public pages, the sitemap or the RSS feed, whether through links or direct requests.
- **SC-003**: 100% of blog actions, preview pages and the blog upload signature are refused without a signed-in owner (verified by the extended unauthenticated-action test).
- **SC-004**: 0 instances of script, raw HTML or unsafe links from post content reach the rendered page (verified with a test post containing each).
- **SC-005**: After a simulated tab crash, the owner recovers 100% of text typed up to a few seconds before the crash.
- **SC-006**: The editor preview and the public page render the same post content identically (same structure and styles).
- **SC-007**: Admin changes are visible on the next public page load, in the sitemap and in the RSS feed in 100% of cases.
- **SC-008**: Public blog pages have no horizontal page scroll at 360px, and a post page's above-the-fold content appears in under 2.5 seconds on a typical mobile connection.
- **SC-009**: Published post pages pass a structured-data validator for Article with no errors, and the RSS feed passes a feed validator.
- **SC-010**: On a fresh site with no published posts, no public page shows a Blog link, and /blog shows only "First posts coming soon."

## Assumptions

- "Owner" means any signed-in admin user, as for the other admin pages.
- **No sitemap exists today** (only robots rules). This feature adds /sitemap.xml covering the existing public pages (home, programs, courses, workshop, our-way, gallery, register) and their published detail pages (programs, courses, gallery albums), plus blog posts, and references it from robots.
- The existing renderer currently allows neither images nor tables; the blog uses a wider allowlist built on the same renderer and sanitizer, leaving program descriptions unchanged.
- Code blocks are styled (monospace, background, horizontal scroll) but not syntax-coloured, since no new dependency may be added.
- "Featured" may be set on several posts; only the newest published one is the hero (no exclusivity enforced).
- The slug stays editable after publishing (with a warning); no redirects from old slugs are created.
- Saving a published post updates the live version directly; there is no separate pending-revision state.
- The browser draft copy is saved a few seconds (about 2) after the last keystroke and kept until saved or discarded.
- Reordering categories is by editing order numbers (no drag-and-drop), consistent with other admin pages.
- Deleting a post is permanent. Its cover image file is removed from the image store (best effort), matching how other admin deletes treat covers; images inserted in the body are kept, since their addresses may be reused in other posts. (Corrected during planning, research R10.)
- The RSS feed carries the excerpt, not the full content.
- Share buttons use the networks' public share addresses; no third-party scripts or tracking are loaded.
- The CTA targets the existing /workshop and /courses pages.
- No seed posts or categories are created.

## Out of Scope

- Comments, newsletter sign-up, multiple authors, scheduled (future-dated) publishing, and search across posts.
- Revision history or pending edits on published posts.
- Redirects for changed slugs.
- Syntax highlighting colours in code blocks.
- Drag-and-drop reordering of categories.
- Full-content RSS, per-category or per-tag feeds.
- Analytics or view counts per post.
