# Baseline for feature 004 (build as it was before any change in this feature)

Taken 2026-11-02 on the production build of branch 004-site-visual-polish before any 004 code change.

- `npm run lint`: clean (after excluding `.claude/**`, the installed design skill's own scripts, from eslint and tsconfig).
- `home-check.mjs`, `transition-check.mjs`, `pages-check.mjs`: all checks pass (`shots/004/baseline.log`).
- Hero reference: `shots/004/hero-ref/` (a copy of `shots/003/hero-after`, the hero snapshot taken at the end of feature 003). The capture in `shots/004/hero-before/` is NOT usable: it ran right after a cold server start and the robot image had not loaded yet. Compare against `hero-ref`.
- Page text reference: `shots/004/text-before-*.txt`.
- JS in `.next/static/chunks`: 11 files, 821,965 bytes in total.
- Lighthouse: no pre-004 measurement exists (see "Lighthouse results" below). The only earlier figure is feature 002's note: home page about 75, runs 66 to 82.

## Measurements during implementation

- Long tasks, 390px home page scrolled slowly with the CPU slowed 4x (stand-in for a mid-range phone), after the Phase 1 to 5 changes: 9 tasks, 874 ms in total, longest 182 ms. No pre-feature measurement exists to compare (the baseline build was replaced); the pass rule used is "no task over 400 ms".
- JS in `.next/static/chunks` after the feature: 823,308 bytes (baseline 821,965), a growth of 1,343 bytes (about 1.3 KB). Only one client component was added (`RevealController`); no dependency was added.
- Long tasks, 390px home page scrolled slowly with the CPU slowed 4x, later repeat runs: 0 tasks over 50 ms (run-to-run it varies from 0 to 9 tasks; the longest seen was 182 ms, against the 400 ms limit).
- Hero comparison against the pre-feature hero (`shots/004/hero-ref`): computed styles identical on every hero element at 390 and 1440 (idle, hover, reduced motion); the 390 screenshot is pixel-identical; the only pixel difference at 1440 is the 46x46px scroll-cue circle at the bottom centre of the first screen (x 697 to 743, y 755 to 801), which is the allowed addition and sits outside the hero element.

## Lighthouse results (2026-11-02, after the owner approved running it)

Production build of `main` (`e597987`) served on localhost:3100; headless Chrome, mobile preset with Lighthouse's default throttling (simulated slow 4G, 4x CPU slowdown). Medians of 5 runs (home) and 3 runs (other pages). Raw JSON in `shots/004/lh/`.

| Page | Performance (each run) | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | **74** (68, 74, 75, 74, 75) | 100 | 100 | 100 | 1.7 s | 0.000 | 822 ms |
| `/our-way` | **85** (85, 87, 81) | 100 | 100 | 100 | 0.9 s | 0.000 | 545 ms |
| `/programs` | **89** (89, 84, 92) | 100 | 100 | 100 | 0.9 s | 0.000 | 401 ms |
| `/contact` | **87** (87, 82, 90) | 100 | 100 | 100 | 0.9 s | 0.000 | 386 ms |

Targets: Performance 90+ (missed on all four pages), Accessibility 95+ (met, 100), SEO 90+ (met, 100). Best Practices 100.

Against the earlier figure (home about 75, range 66 to 82): home is 74, inside that range, so no worse. There is no pre-004 measurement for the other pages.

### What holds Performance back (diagnosis only; nothing was changed)

- The only audits below 0.9 on every page are Total Blocking Time (30% of the score) and Speed Index (10%). LCP, CLS and the first paint are fine.
- TBT: the long tasks are React's hydration runtime (the 230 KB file, 335 to 365 ms on its own) and, on the home page, the animation library plus the hero, with about 1.2 s of style and layout work under the 4x CPU slowdown. Script transfer is 223 KB over 10 requests. The animation library file (about 51 KB compressed) is loaded on every page, including Contact, where about 41 KB of it is unused. This code predates feature 004; 004 added 1.3 KB of JavaScript.
- Speed Index on the inner pages: every frame in the capture, from 0.7 s to 5.5 s, is the preloader (it holds the screen for 6 s, the owner's decision in feature 002). The capture ends before the preloader does. Diagnostic run (no code change, Chrome forced to prefer reduced motion so the preloader skips): Contact scores 91, 91, 93 (Speed Index 2.9 s, TBT 349 ms), so on Contact the preloader is what pulls it below 90.
- Home with the preloader and motion off still scores 69, 77, 73 (TBT 696 ms, Speed Index 6.3 s). The home page's cost is the hero and the code only it loads (feature 001 and the hero stage), not the preloader and not the 004 reveals. This is the open home-performance problem already tracked since feature 002.
- Feature 004's own cost: +1.3 KB JavaScript, CLS 0.000, one small client component. It cannot be isolated exactly because no pre-004 Lighthouse run exists.

## After removing the animation library from the shared mobile menu (2026-11-02)

Change: `MobileNav` now uses plain CSS animations for the slide and fade (`menu-scrim`, `menu-panel` in `globals.css`) instead of the animation library, so the library is no longer in the shared layout. Behaviour is unchanged: all 55 menu checks pass, and home, transition, pages, WhatsApp, footer, desktop, interaction, accessibility and stability checks pass. The hero comparison is unchanged (styles identical; only the scroll-cue pixels differ).

- JavaScript per page, from the HTML: `/our-way`, `/programs`, `/contact` now load 8 script files, 582 KB raw, without the animation library (before: 794 KB raw with it). `/` still loads it (10 files, 794 KB) because the hero uses it.
- Lighthouse, same setup, medians (5 runs home, 3 others):

| Page | Performance before to after | TBT before to after | Speed Index after |
|---|---|---|---|
| `/` | 74 to **75** | 822 to 736 ms | 6.0 s |
| `/our-way` | 85 to **87** | 545 to 392 ms | 5.0 s |
| `/programs` | 89 to **86** | 401 to 418 ms | 5.5 s |
| `/contact` | 87 to **87** | 386 to 342 ms | 4.9 s |

Accessibility, Best Practices and SEO stay at 100; CLS stays 0.000.

Reading: less script and a little less blocking time on the inner pages, but the scores are inside run-to-run noise (runs vary by about 5 points). The limiter on the inner pages is Speed Index (about 5 s), which comes from the 6-second preloader; the earlier diagnostic run without the preloader scored 91 to 93 on Contact. The performance target of 90 is still missed on all four pages. The home page is limited by the hero and the code only it loads.

## Correction: the preloader is not what holds Performance below 90 (2026-11-02)

The earlier diagnosis above said the 6-second preloader pulls the inner pages below 90, based on a run with Chrome forced to prefer reduced motion (Contact 91, 91, 93). That run also switched off every other animation and was only 3 runs, so it did not isolate the preloader. A cleaner test followed:

- Throwaway build (never committed, branch deleted) with the preloader never shown and all other motion on, same Lighthouse setup, 5 runs on home and Contact, 3 on the others. Medians: `/` 75 (was 75), `/our-way` 86 (87), `/programs` 91 (86), `/contact` 87 (87). Contact's own runs ranged from 77 to 93.
- Preview parameter runs (`?preloader-preview=N`, no code change): Contact with a 2 s sequence 82, 3.5 s sequence 89; home with 2 s 74. Also inside the noise.
- Speed Index does improve without the preloader on two pages (`/our-way` and `/programs` about 5.0 s to 3.0 s), but the Performance score does not move reliably, because the run-to-run spread is about 10 points on the same page and blocking time is the larger term.

Conclusion: removing the preloader entirely is the best case for any preloader change, and it does not reach 90 reliably. Shortening it, ending it early or showing it once per session would help real visitors' first impression of speed, but should not be expected to fix the Lighthouse score. What does hold the score down is blocking time: React's hydration runtime on every page, and on the home page the hero, its animation library and the card-travel code. The 6-second decision from feature 002 was left unchanged.

## Home page hero: where the cost is (investigation only, nothing changed; 2026-11-02)

All figures from Playwright with the CPU slowed 4x (unless stated), production build of `main`.

- Idle (steady state, after the preloader, nothing moving): the home page keeps the main thread busy continuously (about 3,000 ms of work in a 3 s window at 4x; about 440 to 490 ms, roughly 16%, with no slowdown). `/contact` is at about 8 ms. Scrolling past the hero does not change this (3,001 vs 3,020 ms): the cost does not depend on the hero being visible.
- What runs: about 58 animation-frame callbacks per second on home (174 in 3 s, 553 ms of script at 4x) against none on Contact. With the hero hidden, idle work drops from about 440 to about 100 ms, so the hero is roughly three-quarters of the home page's idle cost. The hero's animated gradient is not the cost (hiding it changed nothing; it runs on the compositor). The frosted-glass cards were the largest separable piece (turning their backdrop blur off cut about 30%), but run-to-run noise is about 150 ms, so finer attribution is not reliable.
- Disproved: the card-travel stage's `useScroll` was suspected of a per-frame scroll-measuring loop. Replacing it with a plain scroll listener removed that function from the profile and changed the total idle cost by nothing.
- Startup (what Lighthouse's blocking time sees): holding animation frames back for the first 6.4 s did not reduce blocking time (2,246 vs 2,450 ms). Startup cost is React hydration, the animation library's code and style/layout work, not the hero's loops. Home's blocking time is about 400 ms above an inner page's.
- Outside the hero: the two logo images load at 1080 px wide (27 KB together, the footer one eagerly); proper `sizes` would save about 20 KB. Small, and not a score factor.
- Options needing the owner's approval (all touch the hero): pause the hero's loops while it is off-screen (no visual change; fixes idle cost for most of a visit, not the Lighthouse number); lighten or drop the cards' backdrop blur (tiny visual change); move the loops to CSS/WAAPI; split the hero into a server shell with small client parts and load the animation library lazily (largest startup win, largest change). None of these is expected to lift the home page to 90 on its own.
