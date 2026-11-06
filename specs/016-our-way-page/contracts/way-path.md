# Contract: The Way Path

How the server markup, CSS and client controller work together. No HTTP API is added; `/our-way` stays a static route.

## Markup (server)

```html
<div data-way-page>                  <!-- wraps all six sections; holds data-way-ready -->
  <section ...>                      <!-- Section component -->
    <div aria-hidden="true" class="way-track">
      <svg data-way-seg="straight" class="way-seg way-seg--straight" ...></svg>  <!-- under 1024px -->
      <svg data-way-seg="rail" class="way-seg way-seg--rail" data-side="left|right" ...></svg>
      <svg data-way-seg="cross" class="way-seg way-seg--cross" data-from="left|right" ...></svg> <!-- not on the last section -->
    </div>
    <span aria-hidden="true" class="way-node" data-way-node><span class="way-node-dot"></span></span>
    <!-- heading and content, in Reveal -->
  </section>
</div>
```

Rules:

- SVG shape: `viewBox="0 0 100 100"`, `preserveAspectRatio="none"`, `path` with `vector-effect="non-scaling-stroke"`, `stroke` from the saffron token.
- `.way-track` and `.way-node` have `pointer-events: none`, and nothing inside them is focusable.
- The path and markers are outside every `Reveal`, since `Reveal` uses transforms.
- Pieces appear in document order, top to bottom. CSS display decides which are active; a piece with no rendered size is skipped.

## Page states

| Situation | Line | Markers | Path code that runs |
|---|---|---|---|
| No scripts | Fully drawn, stretched pieces. Weaves from 1024px | Filled | None |
| Reduced motion | Fully drawn, stretched pieces. Weaves from 1024px | Filled | None: the controller exits at once |
| Scripts on, motion allowed, before controller | Hidden | Empty | None yet |
| Controller ready | Follows scroll | Filled once reached | Scroll, resize, media query |

CSS, in the same order as the table:

```css
/* the default is complete and static */
@media (prefers-reduced-motion: no-preference) {
  html[data-js] [data-way-page]:not([data-way-ready]) .way-seg { opacity: 0; }
  html[data-js] .way-node:not([data-reached]) .way-node-dot { opacity: 0; transform: scale(0.4); }
}
```

The dot's change uses only `opacity` and `transform`, with the site's motion tokens. Only `[data-way-ready]` markers animate, so a page opened partway down shows its reached markers immediately.

## Geometry (`src/lib/our-way/path.ts`)

Pure functions with no browser use, shared by server and client and unit-tested:

```ts
type Piece =
  | { kind: "straight" | "rail" }
  | { kind: "cross"; from: "left" | "right" };

/** The `d` for a piece in a w x h box. The server calls it with 100, 100; the controller with real pixels. */
function pieceD(piece: Piece, w: number, h: number): string;

/** The page position of the drawn point. See research R4. Handles maxScroll <= 0 as fully complete. */
function headY(scrollY: number, viewportH: number, maxScroll: number): number;

/** 0 to 1: how much of a piece at [top, top + height] is drawn. */
function drawn(head: number, top: number, height: number): number;
```

A straight or rail piece is a vertical line at the box's centre. A crossing piece starts top-centre of its `from` end and finishes at the opposite bottom, with its tangents vertical at both ends, so it joins both rails with no kink.

## Controller (`src/components/sections/our-way/WayPathController.tsx`)

`"use client"` is needed for scroll, resize and media query browser APIs. It renders `null` and is mounted once by the page.

On mount, in `useLayoutEffect`:

1. If reduced motion is preferred, stop. Also listen for the preference changing to reduced: tear down and restore the default state.

Then, in its own task about 100 ms later, so forced layout does not add to the hydration task. The line is hidden until step 4, so this never shows:

2. For each visible piece, read its box, set `viewBox` to its pixel size, set `preserveAspectRatio` to `none`, set `d` from `pieceD`, remove `vector-effect`, and cache `getTotalLength()`, page top and height. Set `stroke-dasharray` to the length.
3. Cache each visible marker's page position.
4. Apply the current scroll position, then set `data-way-ready`.

While scrolling, at most once per frame, with no layout reads:

- `stroke-dashoffset = length * (1 - drawn(head, top, height))`, written only when changed.
- Set `data-reached` on any marker the head has passed. It is never removed.

Check on `ResizeObserver` on `[data-way-page]`, on `document.fonts.ready` and on window resize. Re-measure only if the page's width or height changed; otherwise only the scroll range is refreshed. Keep `data-reached`.

On unmount: remove listeners, observers and pending frames, and restore each piece's server attributes, so client navigation and the browser's back button behave.

## Errors

| Situation | Result |
|---|---|
| Controller throws | Line stays hidden; markers stay empty; all content and links work |
| Urdu font fails | Falls back to a system Urdu or serif face, same box, right-to-left kept |
| No scrollable height | `headY` treats the page as complete |

## Links

| Label | Target | Source |
|---|---|---|
| Meet your mentor | `/#mentor` | `mentorHref` in `src/lib/site.ts` |
| Book a workshop | `/workshop?book=1` | `joinHref` in `src/lib/site.ts` |
