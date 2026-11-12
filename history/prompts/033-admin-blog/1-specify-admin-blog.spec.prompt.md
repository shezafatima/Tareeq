---
id: 1
title: Specify admin-managed blog
stage: spec
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 033-admin-blog
branch: 033-admin-blog
user: shezafatima
command: /sp.specify
labels: ["blog", "admin", "markdown", "seo", "rss", "sitemap"]
links:
  spec: specs/033-admin-blog/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/033-admin-blog/spec.md
 - specs/033-admin-blog/checklists/requirements.md
tests:
 - none (specification stage)
---

## Prompt

/sp.specify Blog (admin-managed)

Data (Mongoose):
- BlogCategory: name, slug (unique), order, timestamps.
- BlogPost: title, slug (unique), excerpt (max 200 chars), coverImage (existing upload shape, with alt), content (markdown), category (ref), tags (string[]), status (draft | published), publishedAt (set on first publish; editable), readingTime (computed on save), seo ({metaTitle, metaDescription}, optional; fall back to title/excerpt), featured, timestamps.
- Author is fixed: Sheza Fatima, with the founder photo from the site images slot. No author model.
- Server-only getPublishedPosts({category?, tag?, page}), getPostBySlug(slug), getRelatedPosts(post, 3), getBlogCategories(). Cache tags "blog", "post:<slug>".

Admin (/admin/blog, added to the sidebar):
- Posts list: cover thumbnail, title, category, status chip (Draft / Published), published date, featured star. Filters by status and category, search by title.
- Editor page:
  - Title, slug (auto from title, editable, unique), excerpt with counter, category, tags (chip input), cover image (existing ImageUploader), featured, publishedAt.
  - Markdown editor with a toolbar (heading, bold, italic, link, list, quote, code, image) and a side-by-side live preview on desktop (tabs on mobile). The preview uses the same renderer and styles as the public post page.
  - The image button uploads via the existing signed upload, asks for alt text, and inserts ![alt](url) at the cursor.
  - SEO panel: meta title and description with counters, and a Google-style snippet preview.
  - Actions: Save draft, Publish/Unpublish, Delete (with confirmation). Unsaved-changes warning. The draft is also autosaved to localStorage (wrapped in try/catch) and offered for restore after a crash.
  - "Preview" opens /blog/preview/[id], which renders the draft exactly as the public page would. Admin session required; noindex.
- /admin/blog/categories: create, edit, reorder, delete (blocked while posts use the category).
- Server-side session checks on every action, upload and preview route. Extend the unauthenticated-action test. Every change revalidates "blog" and the post's tag.

Public:
- /blog: a featured post hero (if one is marked featured), then a post grid (cover, category, title, excerpt, date, reading time). Category filter chips and tag filter via the URL (?category=, ?tag=). Pagination, 9 per page.
- /blog/[slug]: cover, title, category, date, reading time, author line with photo. Content rendered from sanitized markdown with styled typography (headings, lists, quotes, code blocks, images via next/image with Cloudinary). Table of contents from h2/h3 on desktop (sticky sidebar). Share buttons (WhatsApp, LinkedIn, copy link). Related posts (3, same category first). An end CTA block: "Book a workshop" / "Explore courses".
- SEO: per-post metadata and OG (cover image), JSON-LD Article, canonical URL, posts included in sitemap.xml, an RSS feed at /blog/rss.xml.
- Blog appears in the nav and footer only when at least 1 published post exists. With none, /blog shows "First posts coming soon."
- Drafts and unknown slugs -> 404.

Constraints: reuse the existing markdown renderer and sanitizer (allow images, code and tables; disallow raw HTML and scripts), existing admin UI patterns, no new dependencies, mobile at 360px, reduced motion respected.

Out of scope: comments, newsletter, multiple authors, scheduled publishing, search across posts.

## Response snapshot

Created branch 033-admin-blog and specs/033-admin-blog/spec.md: 10 user stories (write/save draft, inline image upload, publish/unpublish/preview/delete, autosave and restore, posts and categories management, blog index, post page, SEO/sitemap/RSS, nav gating, owner-only access), 31 functional requirements, 10 success criteria, edge cases, assumptions and out-of-scope. Surfaced two dependencies: no sitemap.xml exists today (feature creates it), and the existing sanitizer (src/lib/programs/markdown.ts) allows neither images nor tables (blog gets its own wider allowlist; programs unchanged). No clarification markers; quality checklist all passing.

## Outcome

- ✅ Impact: Spec ready for /sp.plan (or /sp.clarify).
- 🧪 Tests: none at spec stage.
- 📁 Files: spec.md, checklists/requirements.md.
- 🔁 Next prompts: /sp.clarify or /sp.plan
- 🧠 Reflection: Verifying the codebase found a missing sitemap and a too-narrow sanitizer allowlist before planning.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 printed a parameter-binding error after creating the branch and spec file; the outputs were correct.
- Graders run and results (PASS/FAIL): spec quality checklist PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
