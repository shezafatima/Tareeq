# Research: How it works — Tablet Video Stepper

No `NEEDS CLARIFICATION` remained in the spec. These are the technical unknowns resolved for the plan.

## R1. Delete or keep the shared robot code?
- **Decision**: keep `RobotStage`, `BreathingRobot`, `content/robot-image.ts`, the `.robot-*` CSS and `public/how-it-works.png`; delete only the carousel (`CarouselCard`, `StepCarousel`, `StepIcon`), `useLayoutMode`, and the `.hiw-*` CSS.
- **Rationale**: `WhyTareeq.tsx` imports `RobotStage` and `robotImage`. Deleting them would break that section, which is out of scope.
- **Alternatives**: delete and re-create for Why Tareeq (rejected: out of scope, risks regressions).

## R2. Where is the hero-to-section hand-off?
- **Finding**: `Hero.tsx` has not changed since feature 006 and contains no hand-off. The old "travel" mode was in the How-it-works CSS and client code. `data-hero-card` is read by `RobotEyes.tsx` and `Hero.tsx` itself and must stay. `html[data-js]` is also used by `WorkshopForm.tsx`, so `JsFlagScript` stays.
- **Decision**: remove the travel/hand-off CSS and comments with the `.hiw-*` block; do not edit hero files. The hero hash guard (`scripts/polish-token-check.mjs`) is the proof.

## R3. How to keep videos off the network until after the hero renders
- **Decision**: render `<video preload="none">` with no `poster` attribute; show posters through lazy `next/image` layers underneath. After hydration, the stepper flips `preload="metadata"` only when (a) the section is within about one viewport of the screen and (b) the window `load` event has fired and an idle callback has run. The next video is set to `preload="auto"` when fewer than 3 s remain on the current one.
- **Rationale**: a `poster` attribute and `preload="metadata"` both start requests at parse time, which could compete with the hero. Lazy images do not load until near view. The section is far below the hero fold at every width.
- **Alternatives**: `preload="metadata"` in SSR markup (rejected: violates "no video loads before the hero has rendered"); dynamic import of the whole stepper (rejected: extra complexity; the client file is small and has no heavy dependency).

## R4. Cross-fade technique
- **Decision**: all three `<video>` elements are mounted and stacked (absolute, same box); the active one has `opacity: 1`, others `0`, with `transition: opacity 400ms`. Inactive videos are paused. Poster layers sit beneath, so a video that is not ready yet reveals the poster rather than black.
- **Rationale**: opacity only (Principle VI); avoids remounting, which would cause flashes and re-downloads.
- **Alternatives**: one `<video>` with swapped `src` (rejected: a visible gap/black frame on every switch and no way to crossfade); `<canvas>` (rejected: heavy, harms LCP principle).

## R5. Mobile stepper content
- **Finding**: at 360px, three equal cards are ~105px wide minus padding. A title like "Understand what you made, then improve it." and a line cannot fit inside one card without wrapping to 5+ lines and moving the layout when the active step changes.
- **Decision**: three equal tabs (number + short name), plus one fixed-min-height detail panel under them showing the active step's title, line and progress bar. Flagged for owner review.
- **Alternatives**: active card grows horizontally (rejected: layout shift on every switch, overflow at 360px); horizontal scroll (rejected: forbidden).

## R6. Poster generation, compression and ffmpeg
- **Finding**: ffmpeg/ffprobe are not installed. Playwright (1.64) with Chromium and `sharp` (via Next) are installed.
- **Decision**: `scripts/make-how-it-works-posters.mjs` opens each MP4 in headless Chromium, seeks to 0 and screenshots the video element, converts to WebP with sharp, and prints `videoWidth × videoHeight` and byte size per file. That output is the before/after size report. Because each video is already ≤ 1.65 MB, no compression script is added now. If any reports > 1280 px wide or > 3 MB, a `videos:compress` script using ffmpeg (H.264, `-vf scale=-2:720`, `-an`, `-movflags +faststart`, `-crf 26`) is added and ffmpeg install is requested from the owner.
- **WebM**: skipped. It needs an encoder we do not have and the MP4s are already small. Revisit only if the owner supplies WebMs.

## R7. Reduced motion / Save-Data / blocked autoplay
- **Decision**: one `mode` value (`auto` or `manual`) from `matchMedia("(prefers-reduced-motion: reduce)")`, `navigator.connection?.saveData`, and a rejected `play()` promise. `useSyncExternalStore` with server value `manual`, so the server HTML and no-JS view show a poster and cards with no autoplay.
- **Rationale**: matches the existing `useLayoutMode` approach without needing `data-js`. Manual mode plays a selected step once, with no auto-advance.

## R8. Tests available
- **Finding**: `npm run test:unit` runs `node --test` on `tests/unit/*.test.ts`; browser checks are Playwright scripts in `scripts/`.
- **Decision**: unit-test pure logic in `src/lib/stepper.ts` (next index with wrap, completed set, mode resolution, preload-next threshold). Behaviour, layout (360/768/1280, no horizontal scroll), keyboard, pause/resume, network order and reduced motion go in the rewritten `scripts/how-it-works-check.mjs`.

## R9. Progress bar sync
- **Decision**: `requestAnimationFrame` loop only while playing, writing `scaleX` onto a ref'd element (transform only, no React state per frame); updates once on `seeked`/select/pause so it is correct when paused.
- **Alternatives**: `timeupdate` only (rejected: 4 Hz updates look jumpy); CSS animation timed to the duration (rejected: drifts on pause/stall).

## R10. Tablet frame asset
- **Finding**: `public/tablet-screen.png` appeared during planning: 612×408 PNG with alpha. The screen area is fully transparent (alpha 0) and so is the outer background, so it works as an overlay. Measured opening: x 92–517, y 30–305 (426×276, ratio 1.54), roughly 15.0% left, 15.5% right, 7.4% top, 25.0% bottom.
- **Decision**: use it as an overlay above the stacked videos (the brief says to use a frame asset if one exists); no CSS bezel. Videos extend 0.5% under the bezel so no hairline gap shows.
- **Risk**: low resolution for desktop (about 700px display width). Not a blocker; a 2× replacement with the same proportions drops in.
- **Open for owner**: the videos' aspect ratio is unknown until the poster script reports it; the opening is 1.54:1, so a 16:9 video will be cropped slightly with `object-fit: cover` (about 7% of the width), or letterboxed with `contain`. Default: `cover`.
- **Result**: the videos are 640x360 (16:9), so `cover` crops about 13% of the width. Kept: nothing important is lost in the screenshots checked.
