# Preloader Contract

There are no HTTP endpoints. This is the contract between the markup, the CSS, the inline script and the tests.

## Components

```ts
// Server components unless noted
Preloader()          // <div id="preloader" aria-hidden="true">: fixed full-screen white overlay
PreloaderScript()    // <script> inline; the serialised init function
ChevronProgress()    // chevron row: navy base, saffron revealed layer, last-chevron highlight
PreloaderEyes()      // server: SVG eyes, same box as the head image; constants from src/components/eyeConstants.ts
```

## DOM and CSS hooks (stable, used by tests)

| Hook | Purpose |
|---|---|
| `#preloader` | The overlay; `aria-hidden="true"`; `pointer-events: none`; no focusable children |
| `[data-preloader]` on `<html>` | State: absent, `run`, `leave`, `done` |
| `#preloader [data-part="head"]` | The head image wrapper (aspect ratio of the image) |
| `#preloader [data-part="eyes"]` | The eye SVG (viewBox is the head image's pixel space) |
| `#preloader [data-part="progress"]` | The chevron bar |
| `#preloader [data-part="last-chevron"]` | The last chevron highlight |

## Timing contract

| Constant | Value | Where |
|---|---|---|
| Sequence length | 6 s (owner decision 2026-10-31) | `--pl-seq` in CSS and `sequenceMs` in `init.ts` |
| Fade duration | 0.3 s, starting 0.1 s before the sequence ends | CSS and `init.ts` |
| On screen in all | 6.2 s (6 s to 6.5 s allowed) | CSS-only; independent of JavaScript |
| Early finish after `load` | off (`earlyFinish: false`); if on: fast-forward and fade at once | `init.ts` |
| Review-only preview | `?preloader-preview[=seconds]`, default 10, clamped 2 to 60; bypasses the skip rules | `init.ts`, `--pl-seq` in CSS |

The values in `init.ts` and the CSS must match; the verification script measures the real durations and fails if they differ.

## Inline script behaviour

1. Evaluate skip rules (see data model). If any applies, do nothing (state stays absent).
2. Otherwise set `data-preloader="run"` on `<html>` (it shows on every load; the session flag is only written if `oncePerSession` is on).
3. On window `load`: if the sequence is still running, raise the playback rate of the overlay's running animations so the rest finishes in about 0.1 s; then set `data-preloader="leave"`.
4. On the end of the fade (or after a backup timer of 1.6 s): set `data-preloader="done"`.
5. On `pageshow` with `persisted`: set `data-preloader="done"`.
6. Every step is wrapped so an error leaves the page visible and never throws to the console.

## Error and edge behaviour

| Situation | Result |
|---|---|
| JavaScript disabled | Overlay never shown |
| Script error | Overlay never shown, or hidden by the CSS fail-safe at 1.5 s at the latest |
| Head image fails to load | Eyes and chevrons still play; ends by 1.5 s |
| Storage unavailable | Skipped |
| Page restored from the back/forward cache | Hidden, no replay |
| Tab hidden while loading | CSS clock continues; fade completes when the tab returns |
| Route outside the shell (`/gradient-demo`) | No overlay, no flag |
