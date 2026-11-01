# Data Model: Brand Preloader

No database and no server data. The only stored value is one session flag.

## Session flag
| Field | Value |
|---|---|
| Store | `sessionStorage` (per browser tab session) |
| Key | `tareeq:preloader-seen` |
| Value | `"1"` |
| Written | when the overlay is shown |
| Read | before anything is drawn, by the inline script |
| Personal data | none |

If reading or writing throws (storage blocked), the preloader is skipped.

## Overlay state (`data-preloader` on `<html>`)

| Value | Meaning | Overlay |
|---|---|---|
| (absent) | Skipped, no JavaScript, or a route without the shell | Hidden (CSS default) |
| `run` | Showing; the CSS timeline is playing | Visible |
| `leave` | Page has loaded (or hard limit reached); fading out | Fading, 300 ms |
| `done` | Finished | Hidden |

Transitions: absent to `run` (script, at the very start, if no skip rule applies); `run` to `leave` (window `load`, after the speed-up) ; `leave` to `done` (fade end, or a timer as backup); any state to `done` on `pageshow` with `persisted`. The CSS fail-safe fades the overlay at 1.2 s even if the state never leaves `run`.

## Skip decision (evaluated once, at the start)

| Check | Skips when |
|---|---|
| Session flag | Already set |
| Storage | Reading or writing throws |
| Reduced motion | `(prefers-reduced-motion: reduce)` matches |
| Connection | `saveData` is true, or `effectiveType` is `slow-2g`, `2g` or `3g`; ignored if the API is missing |

## Visor (for `public/robot-head.png`, 241 x 195 px)

| Field | Value |
|---|---|
| Centre x, y | 50.22%, 57.74% of the image |
| Angle | 0 degrees (measured -0.17) |
| Width, height | 69.32% of image width, 62.11% of image height |
| Corner radius | 45% of visor height |
| Clip inset | 4% (same as the hero) |

## Expression sequence

Three states of the eye pair: `normal`, `happy`, `normal`. Each eye has two layers (open pill, happy arc) that cross-fade with a small scale change. See the timeline in the plan.

## Update 2026-11-01

- **Session flag**: not written or read by default. The preloader shows on every load and refresh (`oncePerSession: false` in `init.ts`). The key and the once-per-session behaviour remain behind that switch.
- **Skip decision**: now only reduced motion and slow connection or data saver. Storage is not used, so blocked storage no longer skips it.
- **Expression sequence** (fractions of the 6 s sequence): Normal 0 to 12%; Happy 12 to 32% (swap in 12 to 15.4, swap out 29 to 32.4); Normal to 40%; Curious 40 to 60% (both eyes glance left, then right, then back); Normal to 68%; Wink 68 to 83% (right eye swaps to the arc 68 to 71.4 and back 79.5 to 82.9); Normal to 100%.
