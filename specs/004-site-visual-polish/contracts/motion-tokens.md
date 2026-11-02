# Contract: Motion Tokens and Interaction States

Defined once in `src/app/globals.css`. Values listed in `data-model.md`.

## Where each token is used

| Behaviour | Property | Duration | Curve | Notes |
|---|---|---|---|---|
| Scroll reveal | opacity, transform | `--dur-reveal` | `--ease-soft` | rise `--rise`; delay by index |
| Page header entrance | opacity (eyebrow, intro), transform | `--dur-reveal` | `--ease-soft` | h1 rises only (stays visible) |
| Card lift | transform, box-shadow | `--dur-base` | `--ease-soft` | `--lift` up; `card-rest` to `card-raised` |
| Button hover | background-color | `--dur-fast` | `--ease-soft` | existing colours |
| Button press | transform | `--dur-fast` | `--ease-soft` | scale 0.98 |
| Arrow nudge | transform | `--dur-base` | `--ease-soft` | translateX 3px on hover/focus |
| Nav underline | transform | `--dur-fast` | `--ease-soft` | `scaleX` 0 to 1, origin left |
| Scroll cue | transform | 1.8s loop | ease-in-out | small bob; off under reduced motion |
| Urdu feature bar | transform (`.draw-in`) | `--dur-reveal` (200ms delay) | `--ease-soft` | draws in when its reveal wrapper reveals; none for instant reveals |
| Footer reveal | via `Reveal` | as reveal | as reveal | |

## Interaction states

| Element | Hover | Pressed | Focus visible | Touch |
|---|---|---|---|---|
| Card (`.lift`) | lift and raised shadow (hover-capable devices only) | none | lift and raised shadow on `:focus-within` plus the global focus ring on the inner link or button | no hover dependence |
| Button | existing colour change | scale 0.98 | global focus ring (2px, offset 3px); saffron ring on Midnight bands | at least 44px |
| Nav link | underline draws in | none | underline plus global ring | at least 44px |

## Reduced motion

Transforms and loops are removed (`transform: none`, no animation), colour and shadow changes remain. Reveals are never armed.

## Allowed values (enforced by a grep check in the tasks)

- No `duration-` or `ease-` utility and no raw `transition` shorthand with a literal time in changed files except through the tokens above.
- No colour literals (hex or `rgb(`) in new or changed component files; shadows are theme names.
- Animated properties: `transform`, `opacity` only (plus the existing hero and bulb cases outside this feature).
