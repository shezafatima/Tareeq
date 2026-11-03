# Data Model: Robot Travels Into "How It Works" as a Carousel

No new content. The three existing `Step` rows (`id`, `label`, `heading`, `body`, `order`) from `getSteps()` are the carousel's cards.

## Layout mode (CSS-decided, before first paint)

| Mode | When | Section |
|---|---|---|
| `travel` | `html[data-js]`, width ≥ 1024px, motion allowed | tall runway with a sticky stage: robot left, heading and coverflow carousel right |
| `swipe` | `html[data-js]`, width < 1024px, motion allowed | normal height: heading, static robot image, swipe track of full-width cards, dots |
| `list` | no JavaScript, or reduced motion (any width) | normal height: heading, static robot image, the three cards stacked (three columns from 1024px) |

The client reads the same media conditions to decide which behaviour to attach; it never changes the layout itself.

## Travel progress (travel mode)

| Name | Definition |
|---|---|
| `progress` | `clamp(scrollY / rangeEnd, 0, 1)` |
| `rangeEnd` | stage's natural document top minus the header height (where sticky engages) |
| `arrived` | true at `progress >= 1`, false below `0.99` |
| robot start pose | the hero robot image's live rect (centre and width) |
| card start pose | each hero card's live visible rect and tilt (feature 003 method) |

## Carousel state

| Field | Values |
|---|---|
| `active` | 0, 1, 2 (index into steps by `order`) |
| `autoplay` | `running`, `paused`, `stopped` |
| pause reasons | `hover`, `focus`, `hidden`, `offscreen`, `travelling` (any active means paused) |
| `interacted` | false until a key, dot, previous/next, swipe, wheel or touch on the carousel; then `autoplay = stopped` for the visit |

Transitions: `running` to `paused` when any reason becomes true; `paused` to `running` 1 s after all reasons clear (unless `interacted`); any state to `stopped` on interaction. While running, every 4 s `active = (active + 1) mod n`. Under reduced motion autoplay never starts.

## Positions (coverflow, travel mode)

`offset = (index - active) mod n` mapped to −1, 0, +1 for three cards: 0 centre, +1 right behind, −1 left behind. With more cards, offsets beyond ±1 are hidden behind the side cards.
