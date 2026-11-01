# Research: Brand Preloader

No NEEDS CLARIFICATION items remain. Findings come from the existing code, image measurements and the project's own Lighthouse runs.

## R1: How to measure the visor of `robot-head.png`
- **Decision**: Use the same method the hero's numbers came from (dark-region image moments with holes filled, rotated extents), and store the result in `visor.ts`.
- **Check on the method**: run on the hero image it reproduces the hero's constants: centre 62.26 / 16.83 against 62.32 / 16.96, angle 9.86 against 9.87, size 34.9 x 17.0 against 34.76 x 16.9. The hero used true rotated extents, not moment-equivalent sizes.
- **Result for the head image** (241 x 195 px, RGBA): centre 50.22% x, 57.74% y; angle -0.17 degrees (treated as 0, the head is level); size 69.32% of image width by 62.11% of image height; corner radius about 45% of visor height (hero: 44.4%). Clip inset 4%, as in the hero.
- **Alternatives**: copy the hero's numbers (rejected: different image and pose); eyeball it (rejected: not repeatable).

## R2: What to reuse from `RobotEyes.tsx`
- **Decision**: Add `export` to the shared constants only: eye colour, eye width and height, gap, vertical centre, arc width and stroke, glow blur, clip inset, visor corner radius and the morph duration. No behaviour change.
- **Findings**: the constants are percentages of the visor, so they apply to any visor size. The expression change in the hero is a cross-fade plus scale between an open pill and a happy arc (0.2 s), which uses only opacity and transform, matching the preloader's rule. The pixel formulas that turn percentages into sizes use the hero image's visor, so the preloader recomputes them from its own visor numbers (a few lines).
- **Constraint found**: `RobotEyes.tsx` is a `"use client"` file, so its constants can only be read from another client component. That is why `PreloaderEyes` is the one client leaf.
- **Alternatives**: copy the constants (rejected by you: they could drift); extract a shared module (rejected by you: larger edit to hero code).

## R3: CSS timeline or Framer Motion
- **Decision**: CSS keyframes (opacity and scale on the eyes, translate on the chevron reveal, scale and opacity on the last chevron).
- **Rationale**: a CSS timeline starts at first paint and is not blocked by hydration. The home page already has about 470 ms of blocking time from hero hydration, so a React-driven preloader would start late and add to it. The hard maximum can also be enforced in CSS alone.
- **Alternatives**: Framer Motion timeline (rejected: starts only after hydration, so the sequence would begin late on slow phones).

## R4: No flash in skip cases
- **Decision**: a small inline script, emitted as the first thing in the `(site)` layout body, decides before the first paint. The overlay is hidden by default in CSS; the script sets `data-preloader="run"` on `<html>` to show it. Skipped visits never get that attribute, so nothing is ever drawn.
- **Rationale**: the server cannot know the session state, reduced-motion setting or connection speed. A client component would only decide after hydration, which means a visible flash.
- **Why not a head script**: the script is placed in the `(site)` layout body, right before the overlay, so routes outside the shell (the gradient demo) never set the flag. Nothing can be painted before it because it is the first element in the body.
- **Alternatives**: cookies plus server rendering (rejected: makes every page dynamic and slower); `next/script` `beforeInteractive` (rejected: runs in the head for all routes).

## R5: Hydration safety
- **Decision**: all state lives on `<html data-preloader>`; React-owned nodes are never removed or edited by the script. `<html>` gets `suppressHydrationWarning` (the same pattern theme switchers use). The overlay is hidden with CSS when finished, not removed.
- **Rationale**: if the script removed the overlay before React hydrated, hydration would fail on a missing node and could re-draw the overlay.

## R6: What "page ready" means
- **Decision**: the window `load` event (all initial resources, including fonts and the above-the-fold images, have finished).
- **Rationale**: it is the browser's own "finished loading" signal and needs no knowledge of the page. Using hydration or first paint would be earlier but would reveal a page whose images are still arriving.
- **Consequence**: on a fast connection `load` may come well before 1.2 s, so the preloader is cut short and the full eye sequence is seen mainly on mid-speed connections. This follows the spec (no minimum display).
- **Alternatives**: `DOMContentLoaded` (too early), first contentful paint (the overlay itself triggers it), a hydration signal (late and couples the preloader to React).

## R7: Ending early without a visual jump
- **Decision**: when `load` fires before the sequence ends, set the playback rate of the running CSS animations so the remainder finishes in about 100 ms, then start the 300 ms fade. The eyes settle on normal because the sequence ends on normal; the chevron bar completes and the last chevron brightens as normal.
- **Rationale**: switching animation names would snap values to their base state; changing the playback rate keeps motion continuous. Total time from `load` to gone is about 400 ms, inside the 400 ms criterion.
- **Alternatives**: `finish()` (a hard jump), restarting a settle animation (loses the current state).

## R8: Hard 1.5 second limit
- **Decision**: a CSS animation fades the overlay out starting at 1.1 s and ending at 1.4 s, independent of JavaScript. (First built as 1.2 s to 1.5 s; a throttled-network test showed the animation clock can start about 170 ms after the overlay is first drawn, giving 1.67 s on screen, so 0.1 s of margin was added.) The script also tidies up (`data-preloader="done"`) after the fade.
- **Rationale**: even if the page stalls or JavaScript fails, the cover cannot outlive 1.5 s. Hidden tabs: animation time continues in real time, so the fade completes when the tab returns.

## R9: Skip rules
- **Decision**: skip if (a) `sessionStorage` reads or writes throw or the flag is set, (b) `prefers-reduced-motion: reduce` matches, (c) `navigator.connection` reports `saveData` or an `effectiveType` of `slow-2g`, `2g` or `3g`. If the Network Information API is missing, do not skip for that reason. A CSS media query for reduced motion hides the overlay as a second safeguard.
- **Flag**: set when the overlay is shown, so a reload in the same tab does not replay it. A page restored from the back/forward cache (`pageshow` with `persisted`) is hidden.
- **Open for you**: treating 3g as slow is a judgement call (see plan, decision 7). It is one constant.

## R10: LCP
- **Decision**: no special trick; keep the head image small (about 160 to 200 css px wide, at most its native 241 px) and rely on the hero's text and robot image being larger candidates.
- **Rationale**: the LCP candidate is the largest painted element; the head image is smaller than the hero heading block on every viewport. The overlay's white background is not a candidate. Lighthouse and a `PerformanceObserver` check will confirm, and an image-based fallback exists if it ever wins (an inline SVG of the head would not be needed).
- **Image loading**: `next/image` with explicit width and height, `priority` so it is in the first paint; about 15 KB when optimised.

## R11: Layout shift on fade-out
- **Decision**: the overlay is `position: fixed` and out of flow; the page underneath is fully laid out the whole time. Only opacity changes. The body is not scroll-locked (locking would remove the scrollbar and shift desktop layouts).
- **Rationale**: fixed overlays cannot move content; a `layout-shift` observer will confirm zero.

## R12: Chevron progress without animating width
- **Decision**: two rows of the same chevrons: a navy base row and a saffron row on top, revealed by a clipping window. The window translates in from the left while the saffron row translates the opposite way, so the saffron chevrons stay in place while the revealed area grows. The window's right edge has a soft gradient mask. Only transforms animate.
- **Last chevron**: a white copy fades and scales briefly at the end (opacity and transform).

## R13: Measuring performance honestly
- **Decision**: 5 Lighthouse mobile runs on a production build before (current commit) and 5 after, same machine, nothing else running, no stale servers on the port. Report median and range for Performance, LCP and TBT, and the LCP element. "No worse" means the after median is not below the before range's lower bound and the spread overlaps.
- **Rationale**: single runs varied from 66 to 82 on the same build.

## R14: Owner decision, 6 seconds minimum (2026-10-31)
- **Decision**: the sequence is 6 s and always plays in full on a first visit; the early finish is off (`earlyFinish: false` in `init.ts`, one switch). The fade starts at 5.9 s and the overlay is gone by 6.2 s. The CSS-only fade is the normal end now, not only a safety net.
- **Rationale**: the owner could not judge the animation at 1.2 s and asked for at least 6 s. This overrides the earlier "never delay content" principle, so it is recorded in the spec, and the skip rules (already seen, reduced motion, slow connection, data saver, blocked storage) matter more: those visitors never wait.
- **What it costs**: the page is covered for 6 s on a first visit. The page still loads and can be clicked through underneath (the overlay does not capture pointer events). Speed-related Lighthouse metrics (Speed Index, FCP) may fall; the numbers are reported.
- **Supersedes**: R6 (page ready), R7 (ending early) and the 1.5 s figure in R8, for production. They still describe how the early finish works if it is switched back on.

## R15: Bundle check result and fix (2026-11-01)
- **Finding**: importing eye constants from `RobotEyes.tsx` shipped the whole hero eye component in the shared JavaScript of every page (the strings `eyes-debug` and `data-hero-card`, which exist only there, were found in a chunk loaded by `/about`).
- **Decision (owner approved)**: move the 11 constants to a plain file, `src/components/eyeConstants.ts`; `RobotEyes.tsx` and the preloader both import from it. The hero is proven unchanged (0 differing pixels, identical computed styles; only the arbitrary React-generated filter id text differs, which the comparison now ignores).
- **Side effect**: `PreloaderEyes` no longer needs to be a client component.
- **Result**: the eye component is only in the home page's JavaScript; `/about` and `/contact` are 10 KB lighter raw.
- **Supersedes** the export-only approach in R2.
