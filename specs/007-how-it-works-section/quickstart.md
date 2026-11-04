# Quickstart: "How it works" Section (007)

How to run and verify this feature locally. There is nothing to set up: no new settings, services or packages.

## 1. Run

```bash
npm run build && npm run start     # production build: use this for timing and Lighthouse numbers
# or: npm run dev                  # fine for looking at it
```

Open `http://localhost:3000/` and scroll down from the hero.

## 2. Before changing anything (milestone 0)

Take the baseline from a production build of this branch while it is still identical to `main`:

```bash
bash shots/007/lh.sh before        # 5 Lighthouse mobile runs on /, saved to shots/007/lh-before/
```

Also note the total JS in `.next/static/chunks` (feature 005: 812,850 bytes), save hero screenshots at 1440×900 and 390×844, and run `node scripts/polish-token-check.mjs` (hero hashes). Write the numbers to `specs/007-how-it-works-section/baseline.md`.

## 3. Checks

```bash
CHROME=<path to chrome.exe> BASE=http://localhost:3000 node scripts/how-it-works-check.mjs
```

The script asserts (at the sizes named in the spec):

- [ ] Layout at 360, 390, 768, 1024 and 1440: no sideways scroll; two columns from 1024px; heading, robot, carousel stacked below
- [ ] The robot image is lazy, has explicit dimensions and a description, and is never mirrored
- [ ] **Hand-off** (768px and up): in every frame exactly one set of three cards is visible; the hero robot never moves; settle time and overshoot are within SC-003; scrolling back returns the hero exactly; loading mid-page puts the cards at arrival at once
- [ ] **Hero protection**: hero element positions and screenshots equal before and after a scroll down and back; `polish-token-check.mjs` passes
- [ ] **Focus**: tabbing mid-scroll never lands on a hidden element
- [ ] **Carousel**: advances every 5 s (within half a second); holds for pointer over the card in focus, focus inside, hidden tab, section off screen and a flipped card; keeps running with the pointer elsewhere in the section; a touch swipe or tap stops it for the rest of the visit
- [ ] **Controls**: dots, previous and next, arrow keys and swipe each move one card; every control is at least 44px
- [ ] **Flip**: works by hover, tap and Enter or Space on all three cards; the Prompt back reads "Turn a lesson plan into 5 quiz questions in 2 minutes"
- [ ] **Reduced motion**: nothing moves by itself (no travel, no auto-advance, no breathing, no entrance); slide and flip still animate when used
- [ ] **No JavaScript**: all three steps and their examples are readable
- [ ] **Breathing**: period about 4 s, scale at most 1.02, drift 4 to 6 px, not running off screen
- [ ] No console errors; screenshots saved to `shots/007/`

## 4. After (milestone 5)

```bash
bash shots/007/lh.sh after         # 5 runs; compare with before
```

Compare Lighthouse (median at least 90, accessibility 100) and total JS with the baseline, and check the hero's largest-content paint element and time are no worse (SC-010, SC-011). Then `npm run lint && npm run build`.

## 5. Screenshots to look at

`shots/007/` at 1440×900, 390×844 and 768×1024: the hero at the top, mid-travel, arrived (each card in focus), a flipped card, reduced motion, and the stacked layout.
