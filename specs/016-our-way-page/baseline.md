# Baseline and results for feature 016

## Baseline, 2026-11-06, under `next start`, before the page changed

Taken on `016-our-way-page` at `3582f22`. The dev server on port 3000 belongs to the owner and stayed running during these runs.

| Check | Result |
|---|---|
| `pages-check.mjs` | 69 passed, 2 failed: "/courses is still the coming-soon placeholder", also on `main` |
| `footer-check.mjs` | 185 passed, 4 failed: footer links under 44px at 1440px, also on `main` |
| `polish-reveal-check.mjs`, whole script | Crashes in the `interaction` section: `main article.lift` no longer exists. Not caused by this feature, so its sections are compared one at a time |

## Lighthouse on `/programs`, mobile, 3 runs

| Performance | Accessibility | SEO | LCP (ms) | TBT (ms) |
|---|---|---|---|---|
| 86 | 100 | 100 | 3292 | 286 |
| 87 | 100 | 100 | 3196 | 259 |
| 89 | 100 | 100 | 3192 | 216 |

### Sections of `polish-reveal-check.mjs` before the page changed

| Section | Result |
|---|---|
| `reduced`, `nojs`, `a11y` | 6, 3 and 14 passed, 0 failed |
| `inner` | 21 passed, 4 failed. All four are about `/` and `/programs`, not this page |

## Results, 2026-11-06, under `next start`

| Check | Result |
|---|---|
| Lint; unit tests | Clean; 109 passed, 0 failed (16 new) |
| Build with database; with no database | Both succeed; `/our-way` is static |
| `our-way-check.mjs` (new) | 168 passed, 0 failed |
| `pages-check.mjs` | 69 passed, 2 failed: same as baseline |
| `footer-check.mjs` | 185 passed, 4 failed: same as baseline |
| `polish-token-check.mjs`; `home-check.mjs` | All passed |
| `how-it-works-check.mjs`, in Edge | 68 passed, 0 failed |
| `polish-reveal-check.mjs` by section | `reduced`, `nojs`, `a11y`, `hero` and `stability` all pass. `inner` has the same 4 failures as baseline. `interaction` still crashes on the stale selector from baseline, so its Our Way part was not run |
| Searches | `"use client"` under `sections/our-way` only on `WayPathController`; no new package; no temporary files |

`home-check.mjs`, `how-it-works-check.mjs` and the `polish-reveal-check.mjs` sections ran before the last two small changes: the controller's measuring and the Urdu font's display setting. Those touch only `/our-way` and one font. `our-way-check`, `pages-check`, `footer-check` and `polish-token-check` ran on the final build.

## Scroll drawing cost, at 4x CPU slowdown

A six-second scroll, measured before the controller's measuring was reduced:

| Width | Frames | Median frame | Worst frame | Long tasks | Layouts |
|---|---|---|---|---|---|
| 390px | 359 | 17 ms | 33 ms | 0 | 9 |
| 1440px | 362 | 17 ms | 17 ms | 0 | 12 |

The 50 ms limit is met. At 200% text size, pieces stay joined, markers stay on the line, and the line finishes with six of six markers.

## Lighthouse, mobile, final build, alternating pages in one session

| Run | `/our-way` Performance | TBT | `/programs` Performance | TBT |
|---|---|---|---|---|
| 1 | 75 | 578 | 92 | 106 |
| 2 | 91 | 141 | 71 | 652 |
| 3 | 73 | 634 | 76 | 499 |

- Accessibility 100, SEO 100 and layout shift 0 on every `/our-way` run: **met**.
- **Performance 90+ is not reliably met.** The median is 75, with a best run of 91. The owner's dev server was running on the same machine.
- **Compared with `/programs`, the median is 75 against 76, one point short of the "at or above" bar in research R6.** Both pages swing between about 70 and 92 run to run, so one point is within the noise, and this page adds no measurable cost. This is a judgement, not a clean pass. Re-measure on the deployed site.

## Changes from plan

- **Font declared in the root layout, not on the route.** A route-only import gave the route a stylesheet that every page's nav link preloaded unused, with a console warning. Other pages still download no font file; `our-way-check.mjs` verifies this. There is no preload for this file.
- **`font-display: block` for the Urdu word, not `swap`.** A swap shifted the word (0.028) and showed wrong letter shapes for a moment. Visitors on a slow connection see a short blank space instead, and a fallback if the font never arrives.
- **The controller's first measure runs about 100 ms after mount, in its own task**, and repeat measures run only if the page's size changed.
- **Added `WayHeading`**, since the oversized heading appears five times and `SectionHeading` is fixed to a dark colour.
- **Reveal was added with the components**, not after them.

## Still open

- All copy marked draft in `src/content/our-way.ts` needs the owner's review. That covers the problem lines, the principle and session lines, the section headings, the vision and mission text, and the page description.
- View the deployed page on an iPhone and in Firefox. Only Chromium and Edge were available here.
