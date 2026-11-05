# Quickstart / verification

1. `npm install --save-exact @phosphor-icons/react@2.1.10`
2. `npm run lint && npm run build`; confirm the home route size grows only by the five icons.
3. `npm run dev`, open `/` at 390px and 1440px and scroll to "Who it's for".
4. `CHROME=<path> BASE=<url> node scripts/audiences-check.mjs` checks at 360/768/1024/1280/1440: five cards in order; hrefs (workshop x2, register, WhatsApp x2 or /contact); no horizontal scroll; last row centred; icons `aria-hidden`; tile 56px; lift 4px on hover; no motion under reduced motion; icon-on-tile contrast at least 3:1 and text at least 4.5:1.
5. `node scripts/home-check.mjs` still passes with the updated audience names.
6. Lighthouse mobile on `/`; compare with the previous run (within about 2 points).
