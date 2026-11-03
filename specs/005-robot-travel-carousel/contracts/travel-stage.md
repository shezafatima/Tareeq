# Contract: Travel Stage (≥1024px, motion allowed)

## DOM

```text
<section id="how-it-works" class="hiw" aria-labelledby="hiw-title">     server; height by CSS per mode
  <div class="hiw-stage">                                               sticky in travel mode
    <div class="hiw-robot-col">
      <TravelStage>                                                     client
        <TravellingRobot />                                             wraps <RobotFigure eyes="live" /> (travel mode only)
      </TravelStage>
      <RobotFigure eyes="painted" class="hiw-robot-static" />           swipe and list modes only
    </div>
    <div class="hiw-content-col">
      <SectionHeading id="hiw-title" />                                 always visible
      <StepCarousel> <CarouselCard>×3 </StepCarousel>                   cards are server children
    </div>
  </div>
</section>
```

Hero elements read (never edited): the robot image `img[alt="Tareeq robot assistant"]` and its layer (closest `.absolute` ancestor), and `[data-hero-card="prompt|build|learn"]`.

## Measuring and progress

- Measure on mount, on resize (ResizeObserver on the hero and the section), after `document.fonts.ready`; never during scroll except the live hero poses, which are read on each scroll change while 0 < progress < 1.
- `rangeEnd = stage natural top (document) - header height`.
- `progress` updates from a passive `scroll` listener into a motion value (no per-frame scroll measuring).

## Hand-off

| Progress | Hero robot and cards | Twin robot and stage cards |
|---|---|---|
| 0 | visible (no inline style, no `inert`) | twin robot: `visibility: hidden`, `inert`, eyes paused; cards positioned on the hero cards and transparent |
| > 0 | `visibility: hidden`, `inert`, `aria-hidden` (robot layer and card wrappers); the hero robot's eyes pause | twin robot visible at exactly the hero robot's live position, size and rotation, eyes resumed with gaze snapped to the current target; cards at the hero cards' live poses, eased toward the stage |
| layout leaves travel, or unmount | all inline styles and attributes cleared | hidden |

Owner checks (ADR-0001): screenshots at the frame before, during and after the hand-off; tabbing mid-scroll never lands on a hidden hero card or robot; exactly one robot visible at any scroll position; the twin's image request is served from cache (no second network fetch of the same file).

## Motion

| Element | From (progress 0) | To (progress 1) | Curve |
|---|---|---|---|
| Robot | hero robot image centre and width | robot column slot, scale ≈ 0.8 of the hero size | sine ease-in-out |
| Each card | hero card live centre, width and tilt | carousel centre slot, scale 1, tilt 0 | sine ease-in-out |
| Card faces | compact face opacity 1, full face 0 | compact 0, full 1 (over progress 0.65 to 1) | linear in progress |
| Coverflow | all cards at centre | positions by `active` | CSS transition `--dur-reveal`, `--ease-soft`, on arrival and on each change |

Robot parallax: none for the twin. Eyes: tracking, blink, happy on card hover or focus; glance toward the active card on change.

## Invariants (tested)

1. At scroll 0 the hero is pixel-identical to the reference at 390 and 1440 and every computed style matches.
2. At 1px and 3px of scroll the twin robot sits exactly on the hero robot (centre within 1px, width within 1px, no rotation difference) and each card on its original (centre within 3px, width within 6px); the originals are `visibility: hidden` and `inert`; exactly one visible robot; no focusable hidden element.
3. At progress 1 the stage is at its sticky position and the robot and cards are at rest in it (within 1px); the robot stays fully in the viewport through the runway and leaves with the section's end.
4. Scrolling back to 0 restores the hero (originals visible, copies hidden, positions within 1px).
5. Only transform and opacity animate; CLS at or below 0.05; no horizontal scroll.
6. The robot image is never mirrored (no negative scaleX anywhere on it).
7. Loading already past the section, fast jumps, and resizing across 1024px end in a correct state.

## RobotFigure (reusable, `src/components/RobotFigure.tsx`)

| Prop | Values | Notes |
|---|---|---|
| `eyes` | `"live"` (default) or `"painted"` | live: `robot-noeyes.png` + `RobotEyes` (client); painted: `robot.png`, static |
| `className` | string | size and placement only |
| `priority` | boolean | image loading priority |
| gaze inputs (live only) | `cursorX`, `cursorY`, `activeCard`, `cardElement` | passed through to `RobotEyes` |

Hardcoded inside: image paths, alt text "Tareeq robot assistant", intrinsic size (1024x1536 for live, the PNG's own size for painted), `sizes` matching the hero's so the same image file is reused from cache. No flip or mirror option exists.
