# Research: Our Way Page (016)

"Verified" means it was run during planning on 2026-11-06. Only Chromium is installed here, so nothing has been verified in Safari or Firefox.

## R1. Limiting the Urdu font to the characters used

**Decision**: Subset the Noto Nastaliq Urdu weight 700 Arabic file once with `pyftsubset`, keeping all layout features. Commit the 11 KB result beside the page and declare it with `next/font/local` in the root layout, with `preload: false`, as a CSS variable used only by the Urdu word. Keep the font's OFL licence next to it.

**Changed during implementation**: the plan imported the font only on this route. That gave the route its own stylesheet, and the nav link's prefetch made every page preload it unused, with a console warning. Declaring it in the root layout removes the stylesheet. Browsers fetch a web font only when text uses it, so other pages still download nothing, which `scripts/our-way-check.mjs` verifies. The trade is about 150 bytes of `@font-face` on every page and no preload of this file.

**Rationale** (verified):

| Source | Size | Rendering of طریق |
|---|---|---|
| `next/font/google`, `subsets: ["arabic"]` file | 157,608 bytes | Correct |
| Google Fonts `text=طریق` | 744 bytes | **Wrong.** The contextual forms are gone, so the word shows flat, without Nastaliq shape |
| `pyftsubset --layout-features='*'` | 11,012 bytes | Width and shape match the full font; 103 of 1,338 glyphs kept; GSUB, GPOS and GDEF kept |

`next/font/google` has no option for named characters: neither its validator nor its URL builder in 16.4.3 reads one. Loading it would send about 158 KB to phones for one word, against Principle VI. `next/font/local` still meets the brief's "via next/font" and adds no build-time network call.

**Alternatives rejected**: an outlined SVG of the word (it stops being real Urdu text, which breaks `lang`/`dir` meaning and copying); the Google `text=` file (renders wrongly); loading the font in the root layout (every page would pay for it).

**Regenerating**, only if the word changes. The tool is not a project dependency:

```bash
pip install fonttools brotli
pyftsubset <noto-nastaliq-urdu-700-arabic.woff2> --text='طریق' --layout-features='*' \
  --flavor=woff2 --no-hinting --desubroutinize --output-file=noto-nastaliq-urdu-tareeq-700.woff2
```

**Weight**: 700 is chosen because it holds up at phone sizes and sits well beside bold Sora. 400 subsets to a similar size if the owner prefers a lighter look.

**Metrics** (verified): ascent 1.904 em and descent 0.596 em, so the natural line is 2.5 em. The word sits in a box of `line-height: 2.5` with fixed font size, so the descender is not clipped and a font swap cannot move the page.

## R2. How to draw the path so it works without scripts

The first-paint requirement is the hard part: reduced motion and no-script visitors must see a complete line at first paint (SC-005, FR-015), so it cannot depend on client measurement.

**Decision**: The server renders the whole line as a series of small SVG pieces. Each piece uses a normalised `viewBox`, `preserveAspectRatio="none"` and `vector-effect: non-scaling-stroke`, so it stretches to its box with an even line and needs no scripts. Only when motion is allowed does a client controller that renders nothing re-fit each piece to real pixels and animate `stroke-dashoffset`.

**Rationale**:

- Reduced motion and no-script run no path code at all and still resize correctly.
- There is one set of markup, with no client twin (Principle XI). This matches the existing `RevealController`, which renders nothing and works on server markup.
- Hydration causes no visual change, since the same elements stay in place.

**Why pieces are re-fitted before animating**: dash lengths with `non-scaling-stroke` and `pathLength` are measured differently from the path's own coordinates, and browsers have disagreed on them. Pixel coordinates with `getTotalLength()` avoid the question. Stretched mode is used only where no dashes exist.

**Alternatives rejected**:

- One SVG measured and built on the client: nothing to show at first paint, or a second no-script drawing to maintain.
- One stretched SVG for the whole page: section heights vary, so curves would land on text.
- Clipping a drawn line with `transform`: composited, but the owner specified `stroke-dashoffset`, and a clip cannot follow a curve's length.

## R3. Keeping curves off the text

**Decision**: Below 1024px each section has one straight rail piece. From 1024px each section has a vertical rail on its side, and all but the last also have a fixed-height crossing piece in its bottom padding that curves to the other side. Content sits in a column clear of the rail, and each section's bottom padding is taller than the crossing, so the space is reserved by layout. Both versions are in the markup; CSS shows one, and the controller animates whichever is visible.

**Rationale**: the crossing has a fixed height, so its shape does not depend on section height. FR-013 is met by layout and can be tested by comparing rectangles.

## R4. Linking scroll to the line

**Decision**: The drawn point ("head") is a page position:

```text
head = scrollY + viewportHeight * (0.6 + 0.4 * scrollY / maxScroll)
```

Each piece draws by how far the head has passed through its box. A marker fills once the head reaches it and stays filled.

**Rationale**: at the top the first screen already shows some line. At the very bottom the head reaches the end of the document, so the last marker always fills, even on tall screens or short pages (spec edge case), without a jump. A pure function can be unit-tested.

**Cost control**: positions are cached and refreshed only by `ResizeObserver`, `document.fonts.ready` and breakpoint changes, so scroll frames never read layout. A passive listener schedules at most one `requestAnimationFrame`, and each frame writes only pieces whose value changed. Normally that is one piece.

## R5. First paint when scripts are on and motion is allowed

**Decision**: `JsFlagScript` already sets `html[data-js]` before paint. Under `prefers-reduced-motion: no-preference`, CSS hides the pieces and empties the markers on `html[data-js]` until the controller sets `data-way-ready` on the page wrapper. The controller applies the current scroll position first, in its own task just after hydration, so a page opened partway down never replays from the top.

**Failure mode**: if the controller fails, the line stays hidden, but all content remains. A missing decoration is the safest outcome.

## R6. Measuring Performance (SC-006)

Local mobile Lighthouse scored below 90 on every page in 015: home 55–62, Programs pages 69–79, with total blocking time around 1,500 ms on the home page. The cause is outside this feature, so a local score cannot prove or disprove this page.

**Decision**: Run three mobile Lighthouse runs each on `/our-way` and `/programs` in one session, against `next start`, with the dev server stopped.

| Result | Meaning |
|---|---|
| Accessibility 95+, SEO 90+, layout shift under 0.1 | Required to pass locally |
| Performance 90+ | Target. If not met, report it plainly, as a failed target and not a pass |
| Performance median at or above `/programs`, and no long task over 50 ms from the controller while scrolling | Required to pass locally: shows this page adds no cost of its own |

Re-measure Performance on the deployed site once it exists.

## R7. Section tones

**Decision**: Opening paper, Problem midnight, Principles paper, Session midnight, Vision and mission paper, Closing midnight.

**Rationale**: the owner asked for alternating tones. Placing the tall sections on paper keeps close to Principle III's proportion of about 25% Midnight. Principles on paper therefore use dark numerals with a saffron mark. A midnight band before the midnight footer is already the pattern on inner pages (`CtaBand`), and it uses the same white button.

## R8. Reuse

| Need | Reuse |
|---|---|
| Band and container | `Section`, with `className` for larger padding |
| Fade and rise once | `Reveal` and the site-wide `RevealController` |
| Book a workshop | `Button` with `joinHref`, styled as in `CtaBand` |
| Timeline look | `.step-num` from How it works, which gives the visual link without copy |
| Share details | The `generateMetadata` shape from `programs/[slug]/page.tsx` |
| Mentor link | `/#mentor`; `scroll-padding-top` already clears the header |

New CSS classes are prefixed `way-`. Feature 013's generic `.step-progress` rule also hid a form element elsewhere, so nothing here uses a generic name. Of the How it works classes, only `.step-num` is reused; check that its rule has no outside effects before relying on it.
