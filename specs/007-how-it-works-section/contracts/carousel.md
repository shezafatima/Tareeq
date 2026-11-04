# Contract: Carousel and Flip Cards

**Module**: `src/components/sections/how-it-works/StepCarousel.tsx` (client controller) around server-rendered `CarouselCard`s.
**Modes**: `travel`, `phone` and `still` run the carousel; `list` (no JavaScript) shows every card and example as plain text.

## Markup (server-rendered, every mode)

```text
<section id="how-it-works" class="hiw" aria-labelledby="hiw-title">
  heading block   (h2 "How it works" + one-line intro)
  robot           (BreathingRobot + next/image)
  carousel        (region)
    cards x3      (same grid cell)
      front       number, name (h3), one line, "See an example" button
      back        the example, "Back" button
    controls      previous, dots x3, next
</section>
```

The three cards are in the HTML for every mode (and for search engines). Only the card in focus is reachable once the carousel runs.

## States the controller sets

| Attribute | On | Values |
|---|---|---|
| `data-pos` | each card | `active`, `before`, `after` (CSS positions and fades them) |
| `inert`, `aria-hidden` | cards not in focus, and the face not showing | set and removed together |
| `data-flipped` | the card in focus | present while showing its back |
| `aria-current` | the dot of the card in focus | `true` |
| `aria-live` | the card track | `off` until the visitor interacts, then `polite` |

## Behaviour

| Input | Result |
|---|---|
| Timer (5 s) | next card (cycling), only when no pause reason holds (see below) |
| Next / previous button | move one card, cycling at the ends |
| Dot | go to that card; the dot shows the current card |
| Left / Right arrow (focus inside) | previous / next |
| Swipe (pointer, `touch-action: pan-y`) | a mostly sideways drag past a threshold, or a fast flick, moves one card; the card follows the finger |
| Hover on the card in focus (fine pointer) | flip to the back after a short hold; leaving flips it back |
| Tap on a card | flip; tap again flips back (a swipe is never a tap) |
| Enter / Space on the card's example button | flip; again flips back |

## Auto-advance (owner decisions)

Runs every 5 s unless **any** of these holds:

1. the pointer is over the card in focus (fine pointers; hovering elsewhere in the section does nothing),
2. keyboard focus is inside the carousel,
3. the tab is hidden,
4. the section is off screen,
5. a card is flipped,
6. (`travel` mode) the cards have not arrived,
7. the mode is `still` or `list`.

A **touch swipe, or a tap on a card or control, stops it for the rest of the visit.** Nothing is stored.

## Animation limits

Only `transform` and `opacity`. The slide and the flip keep their animation under reduced motion (they happen only when the visitor acts). The entrance in `phone` mode reuses the site's existing reveal (`data-reveal`), which already respects reduced motion; in `travel` mode that entrance is switched off by CSS because the cards come from the hero.

## Accessibility

- The carousel is `role="region"` with `aria-roledescription="carousel"` and a label; each card is `role="group"` with `aria-roledescription="slide"` and a label such as "1 of 3: Prompt".
- Dots, buttons and the example button are at least 44px and show a visible focus.
- A card change caused by the visitor is announced politely; auto-advance is never announced.
- Decorative copies (the compact faces, the glow) are `aria-hidden`.
