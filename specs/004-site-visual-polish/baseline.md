# Baseline for feature 004 (build as it was before any change in this feature)

Taken 2026-11-02 on the production build of branch 004-site-visual-polish before any 004 code change.

- `npm run lint`: clean (after excluding `.claude/**`, the installed design skill's own scripts, from eslint and tsconfig).
- `home-check.mjs`, `transition-check.mjs`, `pages-check.mjs`: all checks pass (`shots/004/baseline.log`).
- Hero reference: `shots/004/hero-ref/` (a copy of `shots/003/hero-after`, the hero snapshot taken at the end of feature 003). The capture in `shots/004/hero-before/` is NOT usable: it ran right after a cold server start and the robot image had not loaded yet. Compare against `hero-ref`.
- Page text reference: `shots/004/text-before-*.txt`.
- JS in `.next/static/chunks`: 11 files, 821,965 bytes in total.
- Lighthouse: NOT YET MEASURED (see below).

## Measurements during implementation

- Long tasks, 390px home page scrolled slowly with the CPU slowed 4x (stand-in for a mid-range phone), after the Phase 1 to 5 changes: 9 tasks, 874 ms in total, longest 182 ms. No pre-feature measurement exists to compare (the baseline build was replaced); the pass rule used is "no task over 400 ms".
- JS in `.next/static/chunks` after the feature: 823,308 bytes (baseline 821,965), a growth of 1,343 bytes (about 1.3 KB). Only one client component was added (`RevealController`); no dependency was added.
- Long tasks, 390px home page scrolled slowly with the CPU slowed 4x, later repeat runs: 0 tasks over 50 ms (run-to-run it varies from 0 to 9 tasks; the longest seen was 182 ms, against the 400 ms limit).
- Hero comparison against the pre-feature hero (`shots/004/hero-ref`): computed styles identical on every hero element at 390 and 1440 (idle, hover, reduced motion); the 390 screenshot is pixel-identical; the only pixel difference at 1440 is the 46x46px scroll-cue circle at the bottom centre of the first screen (x 697 to 743, y 755 to 801), which is the allowed addition and sits outside the hero element.
- Lighthouse: NOT RUN. The run needs the Lighthouse tool downloaded through `npx`; the owner declined an earlier attempt and has not approved it since. Performance was judged by layout shift (0.0000 to 0.05 limit), JS size and long tasks instead.
