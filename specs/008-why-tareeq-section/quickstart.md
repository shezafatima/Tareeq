# Quickstart: "Why Tareeq" Section (008)

How to run and verify this feature locally. Nothing to set up: no new settings, services or packages.

## 1. Run

```bash
npm run build && npm run start     # production build: use this for timing and Lighthouse numbers
# or: npm run dev
```

Open `http://localhost:3000/` and scroll past the hero: Programs, then Why Tareeq, then How it works, then Who it's for.

## 2. Baseline (milestone 0): a build of `main` to compare against

```bash
git worktree add ../tareeq-main main
# link the same node_modules so nothing is reinstalled (Windows):
cmd /c mklink /J ..\tareeq-main\node_modules node_modules
cd ../tareeq-main && npm run build && npx next start -p 3108
```

The comparison is **back to back**: alternate Lighthouse runs on `main` (port 3108) and on this branch (port 3107), 5 each, because the home page swings between about 75 and 91 with machine load. Compare the median performance, the LCP element and time, TBT, and accessibility. Also record total JS bytes in `.next/static/chunks`.

## 3. Checks

```bash
CHROME=<path to chrome.exe> BASE=http://localhost:3000 node scripts/why-tareeq-check.mjs
CHROME=<path to chrome.exe> BASE=http://localhost:3000 node scripts/how-it-works-check.mjs
node scripts/polish-token-check.mjs
```

`why-tareeq-check.mjs` asserts, at 1440×900 and 390×844 (and the widths named below):

- [ ] The section order on the home page: Programs, Why Tareeq, How it works, Who it's for; the scroll cue under the hero brings Programs into view
- [ ] The four points appear with the owner's exact numbers, titles and sentences, in an ordered list, each with a different icon
- [ ] From 1024px the navy card is left of the robot; in How it works the robot is left of its content; below 1024px the order is heading, robot, navy card
- [ ] The robot is the new `how-it-works.png`, never mirrored; both sections request the image once (same URL); no sideways scroll at 360, 390, 768, 1024, 1440
- [ ] Every text on the navy card is at least 4.5:1 contrast (measured from computed colours)
- [ ] The saffron decorations are hidden from assistive technology and never overlap any text box
- [ ] Breathing identical to How it works: about 4 s, scale at most 1.02, lift 4 to 6 px, off-screen pause, still under reduced motion
- [ ] No scripts: all four points and the robot are visible; no console errors
- [ ] The hero is where it was (positions and hash check); nothing is hidden or inert in the hero while scrolling

## 4. After (milestone 4)

Run the back-to-back Lighthouse comparison from step 2, then `npm run lint && npm run build`.

## 5. Screenshots to look at

`shots/008/` at 1440×900, 390×844 and 360×740: the page right after the hero (Programs), the Why Tareeq section, the section stacked on a phone, reduced motion, and the section with scripts off.

## 6. Before merging

Feature 007 merges first (see `specs/007-how-it-works-section/tasks.md` for what is left). This branch contains 007's work-in-progress commit; merging this one first would bring that unfinished work with it, so ask before any merge.
