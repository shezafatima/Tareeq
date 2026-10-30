# Hero colours: swapped and left unchanged

Task T046–T050. Rule: colour values only, and only where a brand token gives exactly the same value. No layout, animation, timing or structure was changed.

## Swapped to tokens (5 lines in `src/components/Hero.tsx`)

| Line | Before | After | Token |
|---|---|---|---|
| 402 | `radial-gradient(circle, #E6F0FF 0%, …)` (first stop) | `var(--color-soft)` | Soft Blue |
| 426 | `stroke="#F2A93B"` (orbit line) | `className="stroke-saffron"` | Saffron |
| 436 | `fill="#F2A93B"` (orbit dot) | `className="fill-saffron"` | Saffron |
| 532 | `gradientBackgroundStart="rgb(250, 247, 242)"` | `var(--color-paper)` | Paper |
| 533 | `gradientBackgroundEnd="rgb(230, 240, 255)"` | `var(--color-soft)` | Soft Blue |

## Left unchanged (not swapped)

| Where | Value | Why it was left |
|---|---|---|
| `Hero.tsx:35` `SHADOW_IDLE` | `rgba(30,58,138,0.12)` | Royal Blue with alpha. Used in an animated `boxShadow`; Framer Motion interpolates this string, so a CSS variable or `color-mix()` could change how it animates. |
| `Hero.tsx:36` `SHADOW_HOVER` | `rgba(30,58,138,0.24)` | Same as above. |
| `Hero.tsx:37` `BORDER_IDLE` | `rgba(255,255,255,0.8)` | White with alpha. There is no white token. Also animated. |
| `Hero.tsx:38` `BORDER_HOVER` | `rgba(242,169,59,0.6)` | Saffron with alpha. Animated against `BORDER_IDLE`. |
| `Hero.tsx:229` | `drop-shadow(0 0 4px rgba(242,169,59,0.85))` | Saffron with alpha inside an animated `filter`. |
| `Hero.tsx:230` | `drop-shadow(0 0 0px rgba(242,169,59,0))` | Same; the other end of that animation. |
| `Hero.tsx:236` | `#F2A93B` and `rgba(242,169,59,0)` | The hex equals Saffron, but it is animated against the translucent form on the same line. Swapping one end would break the interpolation, so both stay. |
| `Hero.tsx:402` | `rgba(191,219,254,0.75)` | No brand token (a light blue outside the palette). |
| `Hero.tsx:402` | `rgba(230,240,255,0)` | Soft Blue at zero alpha, used as the gradient's transparent end. Changing it can change how the gradient fades, so it stays. |
| `RobotEyes.tsx:29` | `#5CC8FF` | No brand token, and the file is not `Hero.tsx`. |

## How it was verified

`scripts/hero-snapshot.mjs` captured the hero before and after, and `scripts/hero-compare.py` compared them:

- Reduced-motion screenshots at 1440x900 and 390x844: **0 differing pixels** in both.
- Computed colour styles (colour, background, fill, stroke, border, shadow, filter) on all 126 to 127 hero elements: **identical** in the idle state at both widths and the hover state on the Learn card at 1440px.
- Two captures of the same unchanged build were identical, so the comparison has no noise floor.
- Normal-motion hover and eye-tracking screenshots were checked by eye (the cards float, so they cannot be pixel-compared): the orbit line and dot, lit bulb, open Learn card and eyes all look the same.

One unrelated thing seen: the header logo image can render very slightly differently after a server restart (the optimised image is produced on first request). It happens with identical code and is not caused by this change.
