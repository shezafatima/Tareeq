# Quickstart: Brand Preloader

## See it

```bash
npm run build && npm start     # production, closest to what visitors get
# open http://localhost:3000 and reload to see it again
```

The preloader shows on every load and refresh, so just reload the page to see it again. (A once-per-session mode exists behind the `oncePerSession` switch in `init.ts`, off by default.)

## Watch it slowly (review only)

In real use the preloader now plays for 6 seconds on a first visit. To watch it for longer, add `?preloader-preview` to the address (for example `http://localhost:3000/?preloader-preview`) to stretch the whole sequence to 10 seconds, or `?preloader-preview=15` for 15 seconds. This also bypasses the skip rules, so you can review it even after the session has already seen it. It does not change normal visits.

## Force a skip case

- **Reduced motion**: turn on "reduce motion" in the OS or in DevTools (Rendering, Emulate CSS prefers-reduced-motion).
- **Slow connection**: DevTools Network panel set to Slow 3G changes real speed, but the skip rule reads `navigator.connection`; to test the rule, run `Object.defineProperty(navigator,'connection',{value:{effectiveType:'2g'}})` before load (the check script does this).

## Verify

1. `npm run lint` and `npm run build` pass.
2. `node scripts/preloader-check.mjs` (needs `CHROME` pointing at Edge or Chrome and a running production server): skip cases, timing, frames, layout shift, LCP element, focus.
3. Screenshots in `shots/preloader/`: the three expressions and the chevron bar at 0%, 50% and 100%, at 390 and 1440.
4. `node scripts/hero-snapshot.mjs shots/hero-before` before the export-only edit, `.../hero-after` after, then `python scripts/hero-compare.py` on both: expect identical.
5. Lighthouse mobile on the home page, 5 runs before and 5 after (see the plan), median and range for Performance, LCP, TBT.

## Tuning

Colours come from the design tokens. The eye numbers come from the hero's exported constants; the head's visor numbers are in `src/components/layout/preloader/visor.ts`. To treat 3g as fast, remove it from the slow list in `init.ts`.
