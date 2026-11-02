# Contract: "How it works" Motion

## Modes

| Mode | When | Behaviour |
|---|---|---|
| `none` | server render; reduced motion at any width; JavaScript off; hero cards not found | Final state. No transforms, no animation; all text, line and icons visible |
| `fade` | width under 1024px, motion allowed | Hero cards stay in the hero. The section fades in once on entering view |
| `travel` | width 1024px and up, motion allowed | Scroll-linked travel, then the settle sequence |

The mode is applied in the first client render. Resizing across 1024px switches mode and clears all inline transforms and hero card opacity.

## DOM contract

```text
<section id="how-it-works" aria-labelledby="hiw-title">         (server)
  <SectionHeading id="hiw-title">How it works</SectionHeading>
  <HowItWorksStage>                                              (client; renders data-stage / data-arrived)
    <ol class="hiw-steps">                                       (server, passed as children)
      <li class="hiw-step" style="--i:0">
        <span class="hiw-glow" aria-hidden>
        <StepCard id="prompt" label="Prompt" />                  (client)
        <div class="hiw-text"><h3>...</h3><p>...</p></div>
      </li>  x3
    </ol>
    <span class="hiw-line" aria-hidden>
  </HowItWorksStage>
</section>
```

Rules: the step list is complete and in order in the server HTML; step cards are not focusable and have `pointer-events: none` in travel mode; the glow and line are `aria-hidden`.

## State and timings (travel mode)

| Name | Value |
|---|---|
| `progress` | `clamp(scrollY / rangeEnd, 0, 1)`; `rangeEnd = stepRowTop - 0.45 x viewportHeight` |
| Travel curve | sine ease-in-out, `(1 - cos(pi x progress)) / 2`, applied to x, y, rotation and scale |
| Card design | identical to the hero card (same size, border, blur, icon, placeholder lines); it is not restyled for the animation |
| Start pose | the hero card's live visible centre and tilt, re-read on every scroll change while 0 < progress < 1; scale = hero card width / step card width (close to 1) |
| Hand-off | no crossfade: at progress 0 the hero card shows and the step card is hidden; from the first pixel of scroll the hero card is hidden and the step card shown, already on the hero card's live pose, so only one card is ever visible |
| `arrived` | true at `progress >= 1`; false below `0.99` |
| Settle | spring to scale 1 with a velocity kick, peak about 1.03; delay 0, 80, 160 ms (index x 80 ms) |
| Icon | `on = arrived` for each card (Prompt rotates and pulses, Build brackets spread, Learn bulb fills and glows) |
| Text | opacity 0 to 1, translateY 8px to 0; delay `160 ms + index x 80 ms`; duration about 400 ms |
| Line | `scaleX` 0 to 1 from the left; starts after the third card (about 500 ms); duration about 500 ms |
| Glow | one animation per card: opacity 0 to 0.35 to 0 with a small scale, about 900 ms, delay `index x 80 ms` |
| Reverse | removing `arrived` runs text, line and icon back; the card scale springs to 1 from its current value; card position resumes following scroll |

## Invariants (tested)

1. Animated properties are only `transform` and `opacity` (plus the reused bulb filter and fill, recorded in the plan).
2. Layout is identical in all modes: section height and every element's layout box are unchanged; CLS at or below 0.05.
3. One pixel of scroll in, each step card sits on its hero card (centre within 3px, size within 6px) and the hero card is hidden; at scroll 0 the reverse.
4. Scrolling to arrival and back to 0 returns the hero cards to full opacity and hides the step cards; travel has no step-to-step jump (card movement beyond the scroll stays under 45px per 20px of scroll).
5. Loading already past the section shows the settled state with nothing hidden or half-moved.
6. No horizontal overflow at any width during the transition.
