# Quickstart: verify the admin-managed blog

**Prerequisites**:
- `npm run dev` with `MONGODB_URI`, the Auth.js admin credentials, the `CLOUDINARY_*` values and `NEXT_PUBLIC_SITE_URL` set.
- Signed in at `/admin/login`.

**Viewports**: check at 360px, 390px and 1440px unless a step says otherwise. Run one pass with the OS "reduce motion" setting on.

**Automated checks** (run at the end of every milestone):

```bash
npm run lint
npm run build
npm run test:unit
npm run test:admin-guard        # dev server running
```

## Steps

1. **Empty site**: no blog posts exist.
   - [ ] No public page shows a Blog link (desktop nav, mobile menu, footer).
   - [ ] `/blog` shows only "First posts coming soon.".
   - [ ] `/blog/rss.xml` is a valid, empty feed.
   - [ ] `/sitemap.xml` lists the public pages and no blog URLs.
2. **Sidebar**:
   - [ ] Admin sidebar shows **Blog** after Gallery, and `/admin/blog` shows the empty state.
3. **Categories**: open `/admin/blog/categories` and create "Teaching tips" and "AI basics".
   - [ ] Changing an order number reorders the list.
   - [ ] Course categories at `/admin/courses/categories` still work exactly as before, including the description field.
4. **New post**: create one.
   - [ ] Typing the title "Teaching Kids to Code" fills the slug as `teaching-kids-to-code`.
   - [ ] Editing the slug by hand stops the auto-fill.
   - [ ] The excerpt counter counts down from 200 and stops input at 200.
   - [ ] Tags: `AI`, `ai `, `Python` give two chips (`ai`, `python`).
5. **Toolbar**:
   - [ ] Each button (heading, bold, italic, link, list, quote, code) works on a selection and on an empty cursor.
   - [ ] Ctrl/⌘+B, I and K work, and focus stays in the textarea.
   - [ ] At 1440px the preview sits beside the editor and updates about 0.5 s after typing stops.
   - [ ] At 360px, Write/Preview tabs work by keyboard (arrow keys), with no horizontal scroll.
6. **Image button**: place the cursor mid-document, pick a JPG and enter the alt text "Children at laptops".
   - [ ] `![Children at laptops](https://res.cloudinary.com/...)` is inserted at the cursor and the preview shows it.
   - [ ] Repeat with a 6 MB file: an error shows and the text is unchanged.
   - [ ] Cancelling the alt dialog inserts nothing.
7. **Sanitising**: paste the content below into the body. The preview shows **no** alert, no iframe, no external image, a link with no `javascript:` href, a table that scrolls inside its box at 360px, and both headings in the TOC with unique anchors.

   ```markdown
   <script>alert(1)</script>
   <img src=x onerror=alert(1)>
   [bad](javascript:alert(1))
   ![ext](https://example.com/a.jpg)
   ## Same
   ## Same
   | a | b |
   |---|---|
   | 1 | 2 |
   ```

8. **Save draft**:
   - [ ] A toast confirms the save, the address becomes `/admin/blog/<id>`, and the list shows the post with the **Draft** chip.
   - [ ] `/blog/teaching-kids-to-code` returns the not-found page.
9. **Publish refused**: clear the excerpt and choose **Publish**.
   - [ ] Publishing is refused, with a message at Excerpt (and at Cover if none is set). The chip stays Draft.
10. **Publish**: fill everything, including a cover with alt text, then publish.
    - [ ] The status reads Published and the publish date shows today.
    - [ ] Blog appears in the nav and footer on the next public load.
    - [ ] The post appears on `/blog`, in `/sitemap.xml` and in `/blog/rss.xml`.
11. **Post page** at 360px and 1440px:
    - [ ] The page shows the cover, the h1 title, a category link, the date, "N min read" and "Sheza Fatima" with the founder photo.
    - [ ] The TOC is sticky at 1440px and hidden at 360px, and the current section is highlighted while scrolling.
    - [ ] Body images are optimised (`f_auto` in the request) and lazy.
    - [ ] WhatsApp and LinkedIn open prefilled, and Copy link copies and announces "Link copied".
    - [ ] The CTA buttons go to `/workshop?book=1` and `/courses`.
12. **SEO**:
    - [ ] View source: the `<title>` and description use the SEO fields when set and title/excerpt when empty.
    - [ ] The canonical is `/blog/<slug>`, `og:image` is the cover, and the JSON-LD Article passes the Rich Results Test or schema.org validator.
    - [ ] The RSS passes the W3C feed validator.
13. **Listing**: create 11 more published posts, one marked featured, across both categories with shared tags.
    - [ ] The hero shows the featured post and it is not repeated in the grid.
    - [ ] Page 1 has 9 cards and page 2 has the rest.
    - [ ] `?category=ai-basics` filters and hides the hero, and `?tag=python` shows a "Tag: python" label with Clear.
    - [ ] `?page=99` shows "No posts found", and `?category=nope` shows "No posts found".
    - [ ] Related posts: 3, same category first, never the current post.
14. **Preview access**:
    - [ ] From the editor, Preview opens `/blog/preview/<id>` in a new tab with the "Preview — not published" banner for a draft, and the page source has `noindex`.
    - [ ] In a private window (signed out), the same address redirects to `/admin/login` and shows no content.
15. **Unpublish**:
    - [ ] The post disappears from `/blog`, the sitemap and RSS, and its address returns not-found.
    - [ ] Republishing keeps the original publish date.
    - [ ] Editing the publish date changes the date shown publicly and the order.
16. **Autosave**: type a paragraph, wait 3 s, then close the tab without saving and reopen the editor.
    - [ ] The restore notice appears and Restore brings back the exact text, and Discard removes it.
    - [ ] With site data blocked for localhost, the editor works with no console errors.
    - [ ] Leaving with unsaved changes (link, Back, reload) asks first.
17. **Slug conflict and warning**:
    - [ ] Giving a second post the same slug is refused at the slug field.
    - [ ] Changing the slug of a published post shows the broken-links warning, and after saving, the old address is not-found and the new one works.
18. **Categories in use**:
    - [ ] Deleting "AI basics" while posts use it is refused with "Used by N posts…".
    - [ ] Deleting an unused category works.
19. **Delete post**:
    - [ ] Cancel does nothing.
    - [ ] Confirm removes the post, its address returns not-found and its cover is removed from Cloudinary (Media Library).
    - [ ] Deleting the last published post hides the Blog link again.
20. **Admin list**:
    - [ ] Filters by status and category plus title search combine correctly, survive reload, and "Clear filters" resets them.
    - [ ] The leads submissions pages' filters and search still behave as before.
21. **Regression**:
    - [ ] Program pages render their description exactly as before.
    - [ ] The home hero is visually unchanged at 390 and 1440px.
    - [ ] Lighthouse mobile on `/blog/<slug>` meets Performance 90+, Accessibility 95+ and SEO 90+.
