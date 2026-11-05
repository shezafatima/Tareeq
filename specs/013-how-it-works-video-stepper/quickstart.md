# Quickstart: verifying the How it works video stepper

Run from `E:\tareeq` on branch `013-how-it-works-video-stepper`.

## Build the assets (once)
```bash
node scripts/make-how-it-works-posters.mjs   # writes prompt/build/learn.webp, prints resolution + size of each video
```
Expect: each video ≤ 3 MB and ≤ 1280 px wide (otherwise add the ffmpeg compress script, see research R6).

## Checks
```bash
npm run lint
npm run test:unit
npm run build
node scripts/polish-token-check.mjs          # hero hash guard must still pass
npm run start                                # production build
node scripts/how-it-works-check.mjs          # behaviour + layout + network order
```

## Manual look (390 px and 1440 px)
1. Scroll to "How it works": Prompt plays, its card is highlighted with a saffron accent and a progress bar.
2. When it ends, Build fades in (~0.4 s) and the highlight moves in the same moment; Learn follows; then Prompt again with checks cleared.
3. Click, tap and Tab + Enter on each card: that video restarts from 0.
4. Scroll away or switch tabs: playback pauses; return: it resumes.
5. 360 px: no horizontal scroll; tablet on top, three tabs below, detail panel under them.
6. DevTools > Rendering > emulate reduced motion (and Save-Data): nothing plays, posters show, play button works.
7. Network tab on a fresh load at the top of the page: no `.mp4` or poster requests before the hero has painted; videos start loading only as the section nears the viewport.

## Performance
Back-to-back mobile Lighthouse against a build of `main` on the same machine (as in features 005/007/008), 5 runs each, alternating. Compare Performance, hero LCP element/time and TBT; record in `baseline.md`.
