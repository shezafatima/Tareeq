# Quickstart / verification (011)

0. **Owner inputs first** (blocks shipping, not building): YouTube URL, LinkedIn URL, bio, role line, quote, credential facts. Until supplied, `mentor.ts` keeps `[Placeholder: ...]` copy and `url: null`.
1. `npm run lint && npm run build` (no new dependency is added).
2. `npm run dev`, open `/` at 390px and 1440px, scroll to "Meet your mentor" (after "Who it's for").
3. `CHROME=<path> BASE=<url> node scripts/mentor-check.mjs` checks at 360/768/1024/1280/1440: section order; heading and eyebrow; photo alt text, explicit size, lazy; 4:5 photo box on phones, about 40% photo column on desktop; no horizontal scroll; social cards match the content (null URL not rendered), `target=_blank`, `rel` has `noopener noreferrer`, accessible name "Sheza Fatima on YouTube, 1.7k subscribers"; one column below 400px; credentials row hidden with fewer than 2 real facts; lift is 2px on hover; no motion under reduced motion; the glow animates only transform and opacity; no hex colour outside the two platform tokens in the new components.
4. Release gate: `node scripts/mentor-check.mjs --release` fails while any `[Placeholder`, null-URL social or null fact remains.
5. `node scripts/home-check.mjs` and the 009/010 checks still pass (other sections unchanged).
6. Lighthouse mobile on `/`; Performance within about 2 points of the previous run; no layout shift from the photo.
