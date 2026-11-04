# Baseline for feature 008 (before any change)

Taken 2026-11-04 from a build of `main` (`de8a579`) in a second working copy (`E:\tareeq-main`, its own `npm ci`, served on port 3108). The branch under test is served on port 3107.

- Section order on `main`'s home page: How it works, Who it's for, Programs, Why Tareeq (the order this feature changes).
- JS in `.next/static/chunks`: **870,102 bytes** on `main`.
- Hero reference: `shots/008/hero-before/hero-1440x900.png` and `hero-390x844.png` (from `main`, after the preloader finished).
- Hero guard: `node scripts/polish-token-check.mjs` passes.
- Lighthouse: **not taken now.** The home page swings between about 75 and 91 with machine load (features 005 and 007 both saw this), so a single before and after pair means nothing. The comparison is taken at the end, **alternating runs** on `main` (3108) and the branch (3107), 5 each, with `bash shots/008/lh-ab.sh` (task T034).

Note: a first attempt linked the main copy to this folder's `node_modules`; Next's build refuses files outside the workspace root, so the copy has its own install so that both are built the same way.

## Lighthouse back-to-back (mobile, 5 alternating runs each, 2026-11-04)

| | Performance runs | Median | Accessibility / Best practices / SEO |
|---|---|---|---|
| main (:3108) | 84, 89, 88, 89, 81 | 88 | 100 / 100 / 100 |
| branch 008 (:3107) | 71, 89, 89, 88, 89 | 89 | 100 / 100 / 100 |

LCP about 3.5 s on both (one 4.1 s warm-up run each); CLS 0.000 on both. The single 71 is a load-dependent outlier (the machine swings 71 to 91); the median is level with main, so no regression.
