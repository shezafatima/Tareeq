# Baseline for feature 005 (before any change)

Taken 2026-11-02 on the production build of `main` at `ec0e86a` (same code as the start of branch `005-robot-travel-carousel`).

- Hero reference: `shots/005/hero-before/` (the 1440 reduced-motion capture shows the robot; checked).
- Page text reference: `shots/005/text-before-*.txt`.
- JS in `.next/static/chunks`: 812,850 bytes in total.
- Lighthouse, mobile preset with throttling, 5 runs on `/` (`shots/005/lh-before/`):

| Performance (each run) | Median | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| 90, 93, 87, 94, 91 | **91** | 100 | 100 | 100 | 1.6 s | 0.000 | 154 ms |

Note: the same code measured 74 to 75 (TBT about 740 to 820 ms) earlier the same day. Machine load during a run moves these numbers a lot, so the "after" run is taken the same way and compared only with this one.

# After (feature 005 merged)

Taken 2026-11-03 on the production build of `main` at `e990e8b`, same script and browser as the "before" run (`shots/005/lh.sh`, Playwright Chromium 1243, mobile preset with throttling), 5 runs on `/` (`shots/005/lh-after/`).

| Performance (each run) | Median | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| 62, 73, 86, 86, 83 | **83** | 100 | 100 | 100 | 3.6 s | 0.000 | 260 ms |

| Metric (median) | Before | After | Budget | Result |
|---|---|---|---|---|
| Performance | 91 | 83 | no more than 3 below (≥ 88) | **Fails as measured** |
| CLS | 0.000 | 0.000 | ≤ 0.05 | Pass |
| LCP | 1.6 s | 3.6 s | (none) | Worse |
| TBT | 154 ms | 260 ms | (none) | Worse |
| Accessibility / Best Practices / SEO | 100 / 100 / 100 | 100 / 100 / 100 | (none) | Same |

Why this may be machine load rather than the feature (not proven):

- The first two runs (62, 73) are far below the last three (86, 86, 83). The "before" note records the same code scoring 74 to 75 earlier that day.
- The home page loads less JavaScript after the change: 9 scripts and 209 KiB transferred, against 9 scripts and 217 KiB before. The total in `.next/static/chunks` is 793,543 bytes, against 812,850 before.
- The LCP element is the same in both (the hero intro paragraph). Its observed render delay is about the same too: 1,870 ms before and 1,887 ms after, in run 3 of each. The LCP gap is in Lighthouse's simulated (throttled) figure, not the observed one.

Next step: run before and after back to back on an idle machine (check out `ec0e86a`, build, run; then `main`, build, run) before deciding whether the budget is really missed.

# Back-to-back comparison (settles the "after" result)

Taken 2026-11-03. Both versions were built from the same lockfile and served at the same time: `ec0e86a` (before) on :3101 from a temporary worktree, `main` at `8db27fb` (after) on :3100. Same browser and settings as above. 5 pairs, alternated (before then after, then after then before, ...) so a change in machine load hits both sides equally. Results in `shots/005/lh-ab/`.

| | Performance (each run) | Median | LCP | TBT | FCP | Speed Index | CLS | A11y / BP / SEO |
|---|---|---|---|---|---|---|---|---|
| Before (`ec0e86a`) | 78, 78, 73, 89, 87 | **78** | 3.7 s | 339 ms | 1.08 s | 4.0 s | 0.000 | 100 / 100 / 100 |
| After (`main`) | 61, 87, 78, 87, 91 | **87** | 3.5 s | 222 ms | 1.10 s | 4.2 s | 0.000 | 100 / 100 / 100 |

Result: **budget met.** After is 9 points above before under the same conditions (budget: no more than 3 below), and CLS stays at 0. The 91 in the first "before" run was a reading from an idle machine, not the old code's usual score; measured side by side, the old code scores 78 and also shows a 3.7 s LCP.

The runs are noisy (after ranged from 61 to 91, before from 73 to 89; after won 3 of the 5 pairs). Read this as "no regression", not as "the feature made the page faster".
