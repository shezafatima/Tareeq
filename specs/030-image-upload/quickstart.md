# Quickstart / manual verification

1. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` to `.env.local` (names are in `.env.example`). Run `npm install`, then `npm run dev`.
2. Open `/admin/settings/images`: the founder slot shows the current photo with a "Default" chip. Upload a JPG, add alt text, save, and open `/` to see it. Choose "Use default", save, and confirm the original returns and the old asset is gone from Cloudinary.
3. Try a GIF, a 6 MB JPG, and an upload with the network off. Each shows the right error and the record is unchanged.
4. Save without alt text: it is blocked at the alt field.
5. Edit a program: upload a cover, save, and check the card, the detail page and the share image. Remove it and the brand pattern returns. Open an old program that has only a URL: it still renders, and you can replace it.
6. Break a slot image URL in the database: the page shows `/founder.jpeg` with no broken icon.
7. Remove the three env values: the uploader says uploads are not set up, and the site renders normally.
8. Run `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run test:admin-guard` and `npm run build`.
9. Check at 360px and 1440px, tab through the uploader with the keyboard, and turn on reduced motion.
