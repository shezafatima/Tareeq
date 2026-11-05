# Data Model: How it works — Tablet Video Stepper

No database. Content is typed static data; playback state is client-only and never persisted.

> Owner change, 2026-11-05: the steps run 1 Learn, 2 Prompt, 3 Build. `src/content/how-it-works.ts` is the source for the final copy.

## Content (`src/content/types.ts`, data in `src/content/how-it-works.ts`)

```ts
export type HowStep = {
  id: "prompt" | "build" | "learn";
  number: 1 | 2 | 3;
  /** short label used on the compact cards, e.g. "Prompt" */
  name: string;
  /** the headline, e.g. "Ask AI the right way." */
  title: string;
  /** one supporting line (DRAFT placeholder for owner review) */
  line: string;
  /** e.g. "/videos/how-it-works/prompt.mp4" */
  video: string;
  /** first-frame still, e.g. "/videos/how-it-works/prompt.webp" */
  poster: string;
  /** what the tablet shows, for assistive technology */
  videoLabel: string;
  order: number;
};

export type HowItWorksContent = {
  heading: string;   // "How it works"
  intro: string;     // one line under the heading
  steps: HowStep[];  // exactly 3, sorted by order
};
```

Removed from the old shape: `example` (the flip card back). Validation: exactly three steps, unique ids, `order` 1–3, every `video`/`poster` path exists in `public/` (checked by the Playwright script).

| Step | Video | Poster |
|---|---|---|
| prompt | `/videos/how-it-works/prompt.mp4` | `/videos/how-it-works/prompt.webp` |
| build | `/videos/how-it-works/build.mp4` | `/videos/how-it-works/build.webp` |
| learn | `/videos/how-it-works/learn.mp4` | `/videos/how-it-works/learn.webp` |

Copy (headings from the owner, lines are placeholders):
- Prompt: "Ask AI the right way." / "Say what you need clearly, and get an answer you can use." (draft)
- Build: "Make something real." / "Turn the answer into a tool or lesson that works." (draft)
- Learn: "Understand what you made, then improve it." / "See why it works, then make it better." (draft)

## Playback state (client only, `useStepPlayback`)

| Field | Type | Notes |
|---|---|---|
| `active` | 0 \| 1 \| 2 | which video is visible and which card is current |
| `completed` | derived | indices `< active`; all clear after the loop returns to 0 |
| `mode` | `"auto"` \| `"manual"` | `manual` for reduced motion, Save-Data, or blocked autoplay |
| `nearView` | boolean | section within about one viewport; allows `preload="metadata"` after hero render |
| `inView` | boolean | tablet ≥ 35% visible |
| `tabVisible` | boolean | `document.visibilityState === "visible"` |
| `playing` | boolean | `inView && tabVisible && mode === "auto"` and not failed |
| `failed[i]` | boolean | video i errored or stalled; its poster stays shown |
| progress | ref, not state | `currentTime / duration` of the active video, written to the bar by `requestAnimationFrame` |

### Transitions
- `ended(active)` → `active = (active + 1) % 3` (auto mode only). Fade 400 ms; card switches in the same update.
- `select(i)` → `active = i`, `currentTime = 0`, play (auto) or show poster (manual).
- `inView` or `tabVisible` false → pause; both true → resume.
- `play()` rejected → `mode = "manual"`.
- stall/error → poster; after 4 s `active` advances (auto only).
