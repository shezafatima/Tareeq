# Contract: `VideoStepper` and its parts

There is no HTTP API. These are the component contracts.

## `HowItWorks` (server, `HowItWorks.tsx`)
- Input: none. Reads `getHowItWorks()`; returns `null` when `steps.length !== 3`... (renders nothing rather than a broken section).
- Output: `<section id="how-it-works" aria-labelledby="hiw-title" class="hiw">` containing `SectionHeading#hiw-title` and `<VideoStepper steps heading />`.
- Server only. No `"use client"`.

## `VideoStepper` (client leaf, `VideoStepper.tsx`)
`"use client"` because it needs state, effects, media events, IntersectionObserver and matchMedia.

Props: `{ steps: HowStep[]; regionLabel: string }` (serialisable).

DOM (in order):
1. `TabletFrame` (frame image above, screen opening below) > per step: poster `<Image loading="lazy" sizes="(min-width:1024px) 60vw, 100vw">` layer, then `<video muted playsInline preload=… aria-label={videoLabel} tabIndex={-1}>`; no `controls`, no audio. `data-active` on the visible layer.
2. Manual mode only: a `<button aria-label="Play {name}">` centred on the screen.
3. `<ol aria-label={regionLabel}>` with three `<li>` > `StepCard` (`<button>`).

### `StepCard`
- Element: `<button type="button" aria-current={active ? "step" : undefined}>`; content: number, `name`, and (desktop, or mobile detail panel when active) `title`, `line`.
- States via data attributes: `data-state="active" | "done" | "idle"`.
- Done: visible check icon plus visually hidden text "Completed".
- Active: progress element `aria-hidden` (the video is the source of truth); `transform: scaleX()` only.
- Keyboard: Tab order 1 → 2 → 3; Enter/Space activates; visible `:focus-visible` ring; min height 44px.
- Click on the active card restarts it.

### Events
| Trigger | Result |
|---|---|
| section ≥ 35% visible and tab visible and `mode=auto` | active video `play()` |
| leaves view / tab hidden | active video `pause()` |
| active `ended` | next step active, 400 ms fade, card switches in the same update |
| `<3 s` left on active | next video `preload="auto"` (once) |
| card activated | that step active, `currentTime = 0`, play |
| `play()` rejects | `mode = manual` |
| `error` / no `playing` in 8 s | poster stays; advance after 4 s |

### Modes
- `auto`: described above.
- `manual` (reduced motion, Save-Data, blocked autoplay, no JS): no autoplay; poster for the active step; play button plays the active step once; no auto-advance.

### Not allowed
- Any request for `.mp4` or poster files before the window `load` event and the section being near view.
- Animating anything other than `transform` and `opacity`.
- Importing `framer-motion` into this tree.

## `TabletFrame` (no directive, pure markup)
Wrapper with `aspect-ratio: 612 / 408` and `position: relative`. Children (the video/poster layers) render in an absolutely positioned screen slot at `inset: 7.4% 15.5% 25.0% 15.0%` (extended 0.5% under the bezel), `overflow: hidden`, small radius. The frame image `/tablet-screen.png` (`next/image`, `alt=""`, lazy, `pointer-events: none`) is layered above the slot so the bezel and robot hands cover the video edges. The image is decorative; the screen content is not hidden from assistive technology.

## Accessibility checks
- One `h2` for the section; cards are not headings.
- Contrast AA for text on both active (white/paper) and dimmed states; dimming by opacity must still be ≥ 4.5:1 for card text (verify with `scripts/contrast.mjs`; if not, dim the card surface and keep text colour).
- Reduced motion: no autoplay and no fade timing dependence.
