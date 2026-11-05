# Baseline and results for feature 013

Taken 2026-11-05. `main` is `64031f9` (E:\tareeq-main worktree); the branch is the uncommitted work on `013-how-it-works-video-stepper`.

## Video report (`npm run posters:how-it-works`)

No compression was needed, so "before" and "after" are the same files.

| Step | Resolution | Duration | MP4 | Poster |
|---|---|---|---|---|
| Learn | 640x360 | 6.0 s | 1.49 MB | 12 KB |
| Prompt | 640x360 | 6.0 s | 1.45 MB | 12 KB |
| Build | 640x360 | 6.0 s | 1.57 MB | 16 KB |

All are under 3 MB and 720p. The script needs a browser with H.264: set `CHROME` to Edge or Chrome, because Playwright's bundled Chromium cannot play these files.

## Lighthouse, back to back (mobile, 5 alternating runs each, `shots/013/lh-ab.sh`)

| Build | Performance (each run) | Median | Acc | BP | SEO | LCP (median) | TBT (median) | CLS | Media requests on load |
|---|---|---|---|---|---|---|---|---|---|
| `main` | 75, 69, 66, 67, 85 | 69 | 100 | 100 | 100 | 3718 ms | 646 ms | 0.000 | 0 |
| branch | 71, 73, 67, 88, 69 | 71 | 100 | 100 | 100 | 3668 ms | 609 ms | 0.000 | 0 |

LCP element on both: the hero paragraph ("Tareeq helps schools, teachers and online learners"). The difference is within the run-to-run spread, so read this as "no regression", not as an improvement. Neither build reaches the constitution's 90 target on this machine, which was also running other leftover servers. That gap exists on `main` and is not caused by this feature.

## Hero and size

- Hero pixels, branch against `main`, reduced motion: 0 differing values at 1440x900 and at 390x844.
- `git diff main -- src/components/Hero.tsx src/components/RobotEyes.tsx` is empty.
- JS in `.next/static/chunks`: 869,337 bytes on `main`, 871,268 on the branch (+1,931).

## Checks

- `scripts/how-it-works-check.mjs` (Edge): all 67 passed. Fit under the header passes at 1024x600, 1280x640, 1366x650, 1366x768, 1440x900 and 1920x1080.
- `scripts/why-tareeq-check.mjs`: 40 passed. `scripts/home-check.mjs`: passed. `npm run test:unit`: 65 passed. `npm run lint`: clean.
- `scripts/polish-token-check.mjs`: the hero file check passes. One check fails, "no new dependencies": its list predates `@phosphor-icons/react` (added in features 009-011). This feature changes no dependencies, so the script was left alone.
- Idle card text contrast, calculated rather than measured: midnight at 70% opacity gives about #4e5b77 on about #f7faff, roughly 6.7:1 (AA needs 4.5:1).
- Not tested on a real iPhone or in Safari. Blocked autoplay was simulated.

## Owner changes during implementation

1. Order is 1 Learn, 2 Prompt, 3 Build (FR-003, FR-006). Each step keeps its own title and video.
2. The whole section fits one desktop screen (FR-018). On short screens the tablet gets narrower than 60%.
3. Heading and intro centred; decorative vectors in the background (FR-019).
4. A squarer card shape was tried and undone; cards are the wide rectangles.

## Owner review

- The one-line descriptions and the video descriptions are drafts. `videoLabel` was written from each video's first frame only.
- The heading says "Every session follows the same three steps", which still reads as a fixed sequence now that Learn comes first.
- `public/tablet-screen.png` is 612 px wide and the videos are 640x360, so both are upscaled on large desktop screens. Sharper files with the same proportions drop in.
- The 16:9 videos are cropped about 13% in width (6.7% each side) to fill the 1.54:1 tablet screen.
- Mobile shows three tabs plus one panel for the active step's title, line and progress bar.
