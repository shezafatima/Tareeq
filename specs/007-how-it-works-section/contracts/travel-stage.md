# Contract: Card Hand-off (TravelStage)

**Module**: `src/components/sections/how-it-works/TravelStage.tsx` (client wrapper around server-rendered children) with `travel-context.ts`.
**Applies in**: `travel` mode only (JavaScript on, width 768px and up, motion allowed). In every other mode it renders its children and does nothing.

## What it reads (the hero is read, never edited)

| Item | How it is found | Notes |
|---|---|---|
| The hero's three card wrappers | `[data-hero-card="prompt" \| "build" \| "learn"]` inside the first child of `main` | attributes already in `Hero.tsx` |
| Each card's visible box and tilt | `.backdrop-blur-md` inside the wrapper, and the computed `transform` of its parent | read live every scroll step |

If any of the three is missing, the hand-off does nothing and the cards simply sit in the carousel (the section still works).

## What it does

1. **Progress**: `p = clamp(scrollY / range)`, where `range` is the scroll distance at which the carousel slot's centre reaches about 60% of the viewport height (`ARRIVE_AT`, measured; recomputed on resize, font load and when the hero or section changes size).
2. **Spring**: the cards follow `useSpring(p)` (starting stiffness 320, damping 24). Positions may pass the target by a few percent and settle.
3. **Hand-off**: when `p > 0` the hero's three card wrappers are hidden and the twin cards shown **in the same task**. When `p` returns to 0 it reverses.
4. **Twin placement**: each twin card starts exactly on its hero card (centre, rendered width, tilt) and moves to the carousel slot. Its compact face (the hero card's look) gives way to the carousel front from about 65% of progress.
5. **Arrival**: when the followed value reaches 1 (leaves below 0.99), `arrived` is set. The other two twins fade out as they converge so only the card in focus remains; auto-advance may start.

## Hiding rule (binding, from ADR-0001 owner conditions)

A hidden element is **fully** hidden, not just transparent: `visibility: hidden` plus `inert` plus `aria-hidden="true"`, restored exactly at the top. Focus must never land on an invisible element (checked by tabbing mid-scroll). Twin cards are hidden the same way until shown, so they can never flash before scripts run.

## Guarantees

- The hero robot, its eyes, its layer, the background and the card styling are never changed.
- Exactly one set of three cards is visible in every frame.
- Leaving `travel` mode (resize below 768px, reduced motion turned on, unmount) restores the hero exactly: no inline styles, `inert` or `aria-hidden` left behind.
- Loading already scrolled into or past the section places the twins at arrival at once, with no travel and no flash.
- Only `transform` and `opacity` are animated.
