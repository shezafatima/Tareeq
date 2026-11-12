# Verification: Admin-managed blog

## Baseline (before any change, branch 033-admin-blog, 2026-11-12)

| Check | Result |
|-------|--------|
| `npm run lint` | pass, no output |
| `npx tsc --noEmit` | pass |
| `npm run test:unit` | 254 tests, 254 pass, 0 fail |
| `npm run test:admin-guard -- --no-http` | PASS |
| `npm run build` | not run at baseline (needs database access); run in T075 |

## After implementation (2026-11-12)

### Automated

| Check | Result |
|-------|--------|
| `npx eslint .` | clean |
| `npx tsc --noEmit` | clean |
| `npm run test:unit` | 322 tests, 322 pass (254 before; 68 new, across 6 new files and 3 extended ones) |
| `npm run test:admin-guard -- --no-http` | PASS: 39 server actions checked (7 new blog actions), all refuse a caller with no session without touching the database or Cloudinary; the RSS route is the only public route and is checked to export GET only and import nothing from `lib/admin` |
| `npm run build` | succeeds; `/blog` dynamic, `/blog/[slug]` static, `/blog/preview/[id]` dynamic, `/blog/rss.xml` and `/sitemap.xml` cached hourly |

### Against the built app (`next start`, no blog posts in the database)

| Check | Result |
|-------|--------|
| `/blog` | 200, shows "First posts coming soon.", one `h1` |
| `/blog/does-not-exist` | 404 |
| `/blog?category=nope`, `/blog?page=99` | 200 (no error) |
| `/admin/blog`, `/admin/blog/new`, `/admin/blog/categories` signed out | 307 to `/admin/login` |
| `/blog/preview/<id>` signed out | 307 to `/admin/login`; the response contains no page content |
| Home page | no link to `/blog` |
| `/blog/rss.xml` | valid empty RSS 2.0 channel |
| `/sitemap.xml` | public pages, programs and the gallery album; no blog URLs |
| `/robots.txt` | disallows `/blog/preview`, lists the sitemap |

### Rendered sample post (the real `BlogArticle`, no database)

Verified in the HTML: exactly one `h1`; no `<script>` and none of the injected `alert(1)` text; table of contents with unique heading anchors; WhatsApp and LinkedIn share links and "Copy link"; both CTAs (`/workshop?book=1`, `/courses`); related posts; code block and table as labelled focusable regions; body image as an optimised lazy image; author line, date, reading time; category and tag links.

### Not verified (needs a signed-in session and real data, so it was not done)

The configured database is a remote cluster; no test posts were written to it. These remain for a manual walk through `quickstart.md`:

- Steps 3-10, 13, 15-20: everything done while signed in (creating categories and posts, the toolbar and live preview, the image button upload, publish/unpublish/delete, autosave and restore, the unsaved-changes warning, admin list filters).
- Step 11 in a real browser: sticky table of contents, share windows, copy-link confirmation, layout at 360/390/1440px, reduced motion.
- Step 12: structured-data and feed validators on a published post.
- T078: Lighthouse mobile scores.
- T079 regression in the browser: course categories (now using the generalised `CategoryManager`), submissions filters (now using the generalised `FilterBar`), founder photo replacement. Unit tests cover the shared address builder and program markdown output; `git diff` shows the hero, tokens and layout components are untouched (`globals.css` only gained the `.blog-prose` rules).

## Owner check (2026-11-12)

The owner reported checking the app by hand after the implementation: they published the seeded test post (so the Blog nav link, the home page "Latest reading" section and the post page were exercised with real data) and confirmed the result. T076 (quickstart walk-through) and T079 (regression) are ticked on that report; no itemised per-step results were given.

Still open: T077 (manual accessibility checks) and T078 (Lighthouse mobile scores on `/blog` and a post).

### Later changes made at the owner's request

- Home page: new "Latest reading" section (up to 3 posts, featured first) with a "View more" link to `/blog`; hidden while no post is published.
- Navigation: Programs, Our Way, Courses, then Blog (once a post is published). Gallery removed from the navigation and footer.
- Workshop page: the photo strip is now "Our successful workshops" with a "View more" link to `/gallery`.
- Checks after these changes: tsc and eslint clean, 323/323 unit tests, admin guard PASS.
