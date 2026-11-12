# Quickstart: verify the admin gallery

Prerequisites: `.env.local` with `MONGODB_URI`, the admin credentials and the Cloudinary values. Run `npm run dev`. Have about 10 JPG/PNG/WebP test photos ready, plus one `.gif` and one image over 5 MB.

## Automated

1. `npm run test:unit` passes, including the new `gallery-schema`, `gallery-view` and `site-links` (nav) tests.
2. `npm run test:admin-guard` passes and lists the 9 gallery actions. Gallery `signUpload` and `addGalleryPhoto` are refused with no Cloudinary call.
3. `npm run lint` and `npm run build` are clean.

## Manual (at 360, 390 and 1440px)

1. On an empty database: the site nav, mobile menu and footer have no "Gallery". `/gallery` shows "Photos coming after our first workshop". `/workshop` has no gallery section. `/gallery/anything` returns 404.
2. Signed out: `/admin/gallery` redirects to sign in.
3. Admin → Gallery (in the sidebar): the empty state shows. Create "Teacher workshop, Karachi" / "November 2026": you land on the album page, and the grid shows the album as unpublished with 0 photos.
4. The album page shows the consent notice above the upload zone.
5. Drop 10 valid photos plus the `.gif` and the large file at once. Each row shows its own progress, no more than 3 upload at the same time, and the two bad files fail with "Use a JPG, PNG or WebP image." and "This image is over 5 MB…". The other 10 become photo cards.
6. While uploads run, try to leave the page: the browser warns.
7. Every card shows "Missing alt text", and its Published toggle is disabled with a tooltip on hover and keyboard focus.
8. Add alt text to 4 photos and publish them, with a caption on 2. Publish the album. In a new tab, the nav shows Gallery, `/gallery` shows the album card with "4 photos" and the cover = first by order, and `/workshop` shows the 4 photos and a "See all photos" link.
9. Set photo 3 as cover: the admin card, the public card and the album page's link preview image (view the page source for `og:image`) all use it. Unpublish photo 3: the public cover falls back to the first visible photo.
10. Change a photo's order to 0 and save: the public order follows.
11. Clear the alt text of a published photo and save: it becomes unpublished and disappears publicly.
12. Album page: the grid keeps proportions, with 2 columns at 360px and no horizontal scroll. Open a photo by click, and by Tab + Enter. Then:
    - Arrows move through the photos and stop at the ends.
    - The caption and "N of M" show.
    - Tab stays inside the viewer.
    - Escape closes the viewer and focus returns to that photo.
    - On a touch device (or emulation), swiping left and right moves, and vertical scrolling does not.
13. With reduced motion turned on in the OS or emulation, the viewer opens and changes photo without a fade.
14. Unpublish the album: `/gallery/<slug>` returns 404, and the nav and workshop section disappear if it was the only album.
15. Delete a photo: after confirmation it is gone, and the asset is gone in the Cloudinary console (`tareeq/gallery`).
16. Delete the album: the confirmation names the photo count. After deletion the records are gone, the assets are removed, and the public state is back to step 1.
17. DevTools → Network: public photos load as `f_auto,q_auto` URLs through `next/image`, and photos below the fold load only when scrolled near.
