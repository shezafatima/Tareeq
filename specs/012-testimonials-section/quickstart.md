# Quickstart / Verification: Testimonials section

1. `npm run test:unit` — URL helper and selector tests pass.
2. `npm run lint` and `npm run build` — clean.
3. `npm run dev`, open `/` at 390px and 1440px:
   - Section appears after "Meet your mentor" with 3 labelled placeholder cards (no real approved items).
   - No horizontal page scroll; strip swipes on phone; 3-column grid on desktop.
   - Placeholder play buttons are disabled; no network request to youtube.com on load.
4. Temporarily add a real item (`consent: true`, `published: true`, a real Shorts URL): placeholders disappear, poster shows, click plays in place, playing a second card stops the first.
5. Flip `consent` or `published` to false: the item disappears.
6. Put an invalid URL in an item: item skipped, dev console warns once, production build is silent.
7. `npm run build && npm start`: with no real items the whole section is absent; page source contains no "Placeholder".
8. `node scripts/testimonials-check.mjs` and `node scripts/home-check.mjs` pass; Lighthouse mobile 90/95/90.
9. Release gate: `node scripts/testimonials-check.mjs --release` fails if any placeholder is present in the production output.
