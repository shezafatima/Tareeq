# Baseline for feature 007 (before any change)

Taken 2026-11-04 on the production build of branch `007-how-it-works-section` at `main`'s code (`de8a579`, identical to the start of this branch).

- Hero reference: `shots/007/hero-before/hero-1440x900.png` and `hero-390x844.png` (taken after the preloader finished).
- JS in `.next/static/chunks`: **870,102 bytes** in total (feature 005's baseline was 812,850; the difference is feature 006's lead forms).
- Hero guard: `node scripts/polish-token-check.mjs` passes. Two housekeeping fixes were needed first, both from feature 006 and both owner-approved there: `Hero.tsx` was re-recorded in `specs/004-site-visual-polish/protected.sha.json` (its one-line "Explore programs" link change was not in the recorded hash), and the script's expected dependency list now includes mongoose, resend and zod.
- Lighthouse, mobile preset with throttling, 5 runs on `/` (`shots/007/lh-before/`):

| Performance (each run) | Median | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| 85, 75, 75, 75, 78 | **75** | 100 | 100 | 100 | 1.1 s (hero intro paragraph) | 0.000 | 804 ms |

Note: as feature 005 found, the same home page code swings between about 75 (TBT 650 to 870 ms) and about 91 (TBT 150 ms) depending on machine load, so a single before/after pair is not a fair comparison. The final comparison (T043) is therefore taken **back to back against a build of `main`** on the same machine, alternating runs, and the hero's LCP element and time are compared as well.
