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
