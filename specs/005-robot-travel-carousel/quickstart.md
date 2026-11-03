# Quickstart: Robot Travels Into "How It Works" as a Carousel

## Run

```bash
npm run build && npm run lint
npx next start -p 3100     # port must be free
```

Playwright needs `CHROME="C:/Users/<you>/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"` on each command.

## Verify

```bash
node scripts/robot-travel-check.mjs        # hero at 0, hand-off, travel, sticky runway, reverse, carousel, swipe, list modes, CLS
node scripts/home-check.mjs                # new section order
node scripts/polish-reveal-check.mjs
node scripts/pages-check.mjs
node scripts/polish-token-check.mjs
node scripts/hero-snapshot.mjs shots/005/hero-after && python scripts/hero-compare.py shots/005/hero-before shots/005/hero-after
```

Expected:

- [ ] Build and lint clean
- [ ] Hero identical at 390 and 1440 (pixels and styles); `Hero.tsx` unchanged; `RobotEyes.tsx` only gains the optional prop
- [ ] 1440x900 screenshots: top of hero, mid-travel, robot settled, each of the three carousel positions (`shots/005/`)
- [ ] 390x844 screenshots of the hero and the section
- [ ] JavaScript off and reduced motion: all three steps visible as a list
- [ ] No horizontal scroll at 360 to 1920; CLS at or below 0.05
- [ ] Lighthouse mobile on `/`, 5 runs before and after: Performance and CLS reported
- [ ] No feature 003 stage code left (`HowItWorksStage`, `StepCard`, `.hiw-line`, `.hiw-glow`)

## Owner approval needed

The hero impact statement in `plan.md` (runtime opacity on the hero's robot and cards; one optional prop on `RobotEyes`), and the twin-robot approach as a deviation from the spec's "same robot" assumption.
