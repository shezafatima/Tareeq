# Contract: Step Carousel

## Structure and accessibility (all modes with JavaScript, motion allowed)

```text
<div role="region" aria-roledescription="carousel" aria-label="How it works, 3 steps">
  <div class="track" aria-live="off|polite">
    <div role="group" aria-roledescription="slide" aria-label="1 of 3: Prompt">   centred: readable
    <div ... aria-hidden="true" inert>                                            side cards (travel mode)
  </div>
  <button aria-label="Previous step"> <button aria-label="Next step">
  <div class="dots"> <button aria-label="Show step 2: Build" aria-current="true|false"> ×3
</div>
```

In list mode the same cards render as a plain list with no controls and no carousel roles.

## Behaviour

| Rule | Value |
|---|---|
| Autoplay interval | 4 s |
| Pauses on | pointer over the carousel; focus inside; `document.hidden`; section out of view; travel mode while not arrived |
| Resumes | 1 s after all pause reasons clear, unless interacted |
| Stops for good | any key, dot, previous/next, swipe, touch or wheel on the carousel |
| Hidden tab | no catch-up: on return it continues from the same card |
| Keys | Left / Right move one card (wrapping); focus stays visible |
| Live region | `off` while autoplaying, `polite` after the first interaction |
| Robot | on each change, the twin glances toward the new centred card (travel mode) |

## Travel mode (coverflow)

- Centre: scale 1, opacity 1, readable full face.
- Sides: `translateX(±62%) scale(0.82) rotateY(∓28deg)`, opacity 0.55, behind; decorative (`aria-hidden`, `inert`).
- Transition: `transform` and `opacity` over `--dur-reveal` with `--ease-soft`.

## Swipe mode (<1024px)

- Horizontal scroll-snap track, one full-width card per view, dots below (44px targets).
- Autoplay scrolls the track smoothly; active card derived from scroll position.
- The track is contained; the page never scrolls sideways.

## Reduced motion and no JavaScript

- List layout: all three cards visible, no autoplay, no rotation, no slide; no carousel roles or controls.
