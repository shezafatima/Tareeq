# Baseline before the preloader (task T001 to T003)

**Commit measured**: `e85c87a` (branch `002-brand-preloader`, no source changes yet; only the spec files and `public/robot-head.png` are untracked)
**Build**: `npm run build`, then `next start -p 3100`. Checked before measuring: page returns 200 and all 11 `/_next/static` assets return 200.
**Conditions**: mobile Lighthouse 12.8.2 (default mobile emulation and throttling), Edge headless, nothing else running except the owner's idle dev server on port 3000. Port 3100 verified free before the server started.
**Checks at the start**: `npx tsc --noEmit`, `npm run lint` and `npm run build` all clean.

## Lighthouse mobile, home page, 5 runs

| Run | Performance | LCP | TBT | FCP | CLS | LCP element |
|---|---|---|---|---|---|---|
| 1 | 87 | 3.28 s | 233 ms | 0.92 s | 0 | hero subline paragraph |
| 2 | 92 | 3.23 s | 94 ms | 0.78 s | 0 | hero subline paragraph |
| 3 | 92 | 3.25 s | 109 ms | 0.77 s | 0 | hero subline paragraph |
| 4 | 92 | 3.22 s | 98 ms | 0.77 s | 0 | hero subline paragraph |
| 5 | 92 | 3.20 s | 92 ms | 0.77 s | 0 | hero subline paragraph |

| Metric | Median | Range |
|---|---|---|
| Performance | 92 | 87 to 92 |
| LCP | 3.23 s | 3.20 to 3.28 s |
| TBT | 98.5 ms | 92 to 233 ms |

## Note on the earlier "75" baseline

Earlier in this project the same page scored 66 to 82 across runs (single runs, taken while other processes were running on the machine, including a stale server in one case). Under the clean conditions above the same code scores 87 to 92. So the real baseline for this feature is about 92, and "no worse than today" means the after numbers should stay in this range: Performance 87 to 92, LCP about 3.2 s, TBT about 100 ms (one run in five showed a TBT spike to 233 ms and a score of 87).

**Rule for the after comparison (T030)**: after median Performance is at least 87 (the lower edge of the before range), after median LCP is within 0.3 s of 3.23 s, and the LCP element is not the preloader's head image.

## Interim after-numbers with the 6 second preloader (taken during Phase 5, 2026-10-31)

Same method as above: production build, server health checked (12 of 12 assets 200), port free, mobile Lighthouse 12.8.2, 5 runs, fresh browser profile each run (so the preloader shows).

| Metric | Before (median, range) | After, 6 s preloader (median, range) |
|---|---|---|
| Performance | 92 (87 to 92) | 87 (83 to 90) |
| LCP | 3.23 s (3.20 to 3.28) | 3.39 s (3.34 to 3.48) |
| FCP | 0.77 s (0.77 to 0.92) | 0.93 s (0.92 to 0.94) |
| Speed Index | 2.10 s (1.94 to 3.72) | 2.39 s (1.91 to 3.37) |
| TBT | 98.5 ms (92 to 233) | 210.5 ms (170 to 342) |
| CLS | 0 | 0 |
| LCP element | hero subline | hero subline (not the head image) |

Reading: Lighthouse does not treat the overlay as hiding the page, so Speed Index barely moves. The cost shows up as about 5 points of Performance (92 to 87, the lower edge of the before range), 0.16 s later LCP and FCP, and about 110 ms more blocking time. A likely cause is the preloader's main-thread work during hydration (the eye animations are SVG elements, which are not composited, and the eyes sit inside a group with a static glow filter that is re-drawn as they animate). Final numbers are taken in task T030.

## Final after-numbers (task T030, 2026-11-01)

Final build: 6 s preloader on every load, seven expressions, hero constants moved to a plain file. Production build from a cleared `.next`, server health checked (12 of 12 assets 200), port free, mobile Lighthouse 12.8.2, 5 runs, fresh browser profile each run.

| Run | Performance | LCP | FCP | Speed Index | TBT | CLS |
|---|---|---|---|---|---|---|
| 1 | 86 | 3.29 s | 1.37 s | 5.36 s | 149 ms | 0 |
| 2 | 90 | 3.36 s | 1.35 s | 2.46 s | 156 ms | 0 |
| 3 | 91 | 3.30 s | 0.92 s | 1.82 s | 112 ms | 0 |
| 4 | 90 | 3.31 s | 1.36 s | 2.42 s | 149 ms | 0 |
| 5 | 91 | 3.35 s | 0.92 s | 1.83 s | 114 ms | 0 |

| Metric | Before (median, range) | Final (median, range) |
|---|---|---|
| Performance | 92 (87 to 92) | 90 (86 to 91) |
| LCP | 3.23 s (3.20 to 3.28) | 3.31 s (3.29 to 3.36) |
| FCP | 0.77 s (0.77 to 0.92) | 1.35 s (0.92 to 1.37) |
| Speed Index | 2.10 s (1.94 to 3.72) | 2.42 s (1.82 to 5.36) |
| TBT | 98.5 ms (92 to 233) | 149 ms (112 to 156) |
| LCP element | hero subline | hero subline (not the head image) |

**Rule from this file**: median Performance at least 87 and median LCP within 0.3 s of the before median: **met** (90 and +0.08 s).

Honest reading: the preloader costs about 2 points of median Performance, 0.08 s of LCP and about 50 ms of blocking time. FCP is later in most runs (1.35 s against 0.77 s; two runs were 0.92 s) because the overlay's own content (the head image) is now the first thing painted. The one outlier, run 1 (Speed Index 5.4 s, score 86), is within the spread seen on the same page before the preloader existed (before-run 1 was 87 with Speed Index 3.7 s).

Earlier interim run (before the bundle fix and with the older animation): median 87, TBT 210 ms. Moving the eye constants to a plain file (so the hero's eye component is no longer in other pages' JavaScript, and the preloader's eyes are no longer a client component) and the quicker, simpler animation recovered most of that.

## Bundle check (task T028)

The preloader first imported its eye constants from the hero's eye file, which shipped the whole hero eye component in the shared JavaScript of every page (strings that exist only in that file were found in a chunk loaded by `/about` and `/contact`). Fixed with the owner's approval by moving the 11 shared constants into a plain file, `src/components/eyeConstants.ts`, imported by both. After the fix those strings appear only in the home page's JavaScript. `/about` and `/contact`: 731 KB down to 721 KB raw (about 228 KB gzipped).
