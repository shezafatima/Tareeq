# Quickstart: Site Visual and Motion Polish

## Run

```bash
npm run dev                        # http://localhost:3000
npm run build && npm run lint      # must both be clean
npx next start -p 3100             # production build for checks (port must be free)
```

Playwright here needs the installed browser: set `CHROME` to
`C:/Users/<you>/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe`.

## Use the reveal

```tsx
<Reveal index={i}><Card className="lift">...</Card></Reveal>      // wrapper reveals, card lifts
<Reveal as="li" index={i}><Card className="lift">...</Card></Reveal>
```

Tokens live in `globals.css` (`--dur-*`, `--ease-soft`, `--rise`, `--lift`, `--stagger`, shadows `card-*`).

## Verify

```bash
node scripts/polish-reveal-check.mjs         # reveal, no flash, once-only, reduced motion, JS off, CLS, widths, token grep
node scripts/transition-check.mjs            # feature 003 transition still passes
node scripts/home-check.mjs
node scripts/pages-check.mjs
node scripts/hero-snapshot.mjs shots/004/hero-after   # then: python scripts/hero-compare.py shots/004/hero-ref shots/004/hero-after
```

Expected:

- [ ] Build and lint clean
- [ ] Hero compare against `shots/004/hero-ref`: computed styles identical on every element, 390px pixel-identical; the only pixel difference at 1440 is the 44px scroll-cue circle (an allowed addition outside the hero)
- [ ] Preloader check from feature 002 unchanged
- [ ] Screenshots at 1440x900 and 390x844 for every page and a scroll sequence (mid-reveal and settled) for `/` and one inner page in `shots/004/`
- [ ] Reduced motion and JavaScript off: every page fully visible, nothing animating
- [ ] No horizontal scroll at 360, 390, 768, 1024, 1440, 1920; CLS at or below 0.05
- [ ] Contrast computed for every new text and surface pair
- [ ] Lighthouse mobile median of 5 runs on `/`, before and after (needs the owner's approval to run)

## Owner inputs

Confirm or replace the trust-strip facts (`src/content/data/trust.ts`), and approve running Lighthouse.
