# Contract: Scroll Reveal

## Components

| Component | Kind | Props | Output |
|---|---|---|---|
| `Reveal` | server | `as?` ("div" or "li" or "section" ...), `index?` (default 0), `className?`, `children` | the element with `data-reveal` and `style={{ "--i": index }}` |
| `RevealController` | client (no children, renders null) | none | side effects only: observer, `data-reveal-ready`, `data-revealed` |

`RevealController` is mounted once in `src/app/(site)/layout.tsx`.

## CSS states

```text
default                               visible (opacity 1, no transform)
html[data-reveal-ready]
  [data-reveal]:not([data-revealed])  opacity 0; translateY(var(--rise))
[data-reveal]                         transition: opacity and transform, var(--dur-reveal), var(--ease-out),
                                      delay calc(min(var(--i), var(--stagger-cap)) * var(--stagger))
@media (prefers-reduced-motion: reduce)
  [data-reveal]                       opacity 1 !important; transform none !important; transition none
```

Only `opacity` and `transform` change.

## Controller behaviour

1. On mount (layout effect), unless `prefers-reduced-motion: reduce`:
   1. Collect `[data-reveal]` elements.
   2. Elements already scrolled past, and elements in view while the preloader is NOT running, get `data-revealed="instant"` (no transition, so nothing fades in on screen unasked).
   3. Elements in view while the preloader IS running (`html[data-preloader="run"]`) and everything below the fold are observed, so they reveal (animated) when seen; the in-view ones wait until the preloader leaves (a MutationObserver on `data-preloader`, with a 9 s safety timeout).
   4. Set `data-reveal-ready` on `<html>`.
   5. Observe with one IntersectionObserver (`threshold` 0.1, `rootMargin` "0px 0px -8% 0px").
2. On intersection: set `data-revealed`, `unobserve`.
3. `focusin` (capture) on the document: if the target is inside a `[data-reveal]`, reveal that wrapper at once (`"instant"`).
4. On route change (pathname): repeat steps 1.1 to 1.4 for new elements; already revealed ones are skipped.
5. If the preference changes to reduced motion: remove `data-reveal-ready` (everything visible).
6. Cleanup: disconnect the observer and remove listeners.

## Rules for users of `Reveal`

- Wrap a card or block; never put `.lift` or another transform on the same element as `data-reveal`.
- Use `index` for siblings (cards in a grid, list items); no index for a lone block.
- Do not nest `Reveal` inside `Reveal`.
- Do not wrap the hero, the preloader or anything inside `how-it-works` that the feature 003 stage moves.
- A container whose `Reveal` children would add scrollable overflow while hidden (for example the footer, whose 16px downward shift adds blank scroll area) must clip overflow (`overflow-clip`).
- Above-the-fold content on inner pages uses `page-enter` (CSS), not `Reveal`.

## Invariants (tested)

1. Without JavaScript, and under reduced motion, no element has computed opacity below 1.
2. Once the page is visible (after the preloader, or at once if it is skipped), no element in or above the viewport is hidden; content in view behind the preloader reveals as it leaves. After client-side navigation, in-view content never flashes hidden (sampled every frame).
3. Each element reveals once; scrolling back up leaves `data-revealed` set and opacity 1.
4. Focusing an element inside an unrevealed wrapper reveals it immediately.
5. Keyboard End and anchor jumps leave every element at opacity 1 within 1 second.
6. No layout shift is attributable to reveal (CLS at or below 0.05 across a full scroll).
7. `how-it-works` and the hero have no `data-reveal`.
