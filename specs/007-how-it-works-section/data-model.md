# Data Model: "How it works" Section (007)

No database is involved. The section has one piece of content (typed, in a file) and some in-page state that exists only in the visitor's browser.

## Content: `src/content/how-it-works.ts`

Read through `getHowItWorks()` in `src/content/index.ts`. Types go in `src/content/types.ts`.

```ts
export type HowItWorksContent = {
  heading: string;           // "How it works"
  intro: string;             // one line under the heading
  image: { src: string; width: number; height: number; alt: string };
  steps: HowStep[];          // always three, in order
};

export type HowStep = {
  id: StepId;                // "prompt" | "build" | "learn"  (the same ids the hero cards use)
  number: number;            // 1, 2, 3
  name: string;              // title on the front: "Prompt"
  line: string;              // one-line explanation on the front
  example: string;           // the concrete example on the back
  order: number;
};
```

### Draft values (all marked `DRAFT: owner to confirm before launch`, except the Prompt example)

| Field | Prompt | Build | Learn |
|---|---|---|---|
| number | 1 | 2 | 3 |
| name | Prompt | Build | Learn |
| line | Say what you need | Make something that works | Understand why it works |
| example | **Turn a lesson plan into 5 quiz questions in 2 minutes** (owner) | A marking helper you set up in 20 minutes | Teach your class to check AI answers |

- **heading**: "How it works". **intro**: "Every session follows the same three steps." (existing wording, moved here)
- **image**: `/how-it-works.png`, 407 × 612, description "The Tareeq robot assistant, smiling, with one hand held out as if presenting the steps."
- The line and example for Build and Learn are adapted from the existing step headings and the hero's own card wording. They are placeholders, not claims.

### Rules

- Exactly three steps, ids unique, numbers 1 to 3 in order.
- `line` is one sentence of about 40 characters; `example` one sentence of about 70 characters (so the cards keep the same height at 360px).
- The ids must match the hero cards' `data-hero-card` values (`prompt`, `build`, `learn`); the hand-off pairs twin cards with hero cards by position and checks the ids.
- No wording lives in components.

### Retired by this feature (single source of truth)

`src/content/data/steps.ts`, `getSteps()`, the `Step` type, `homeCopy.howItWorks` in `src/content/data/cta.ts` and `HomeCopy.howItWorks` in `types.ts`. Their only consumer is the section being rewritten.

## In-page state (client only, never stored)

| State | Where | Meaning |
|---|---|---|
| `mode` | `useLayoutMode()` | `list` / `travel` / `phone` / `still`, read from what CSS already chose |
| `progress` | motion value | 0 at the top of the page, 1 when the cards arrive (travel mode); the cards follow a spring of it |
| `arrived` | state | the cards have arrived (hysteresis: arrive at 1, leave below 0.99); starts auto-advance |
| `active` | state | index of the card in focus |
| `flipped` | state per card | which card shows its back, and whether by hover or by tap or key |
| `stopped` | state | a touch swipe or tap stopped auto-advance for the visit |
| pause reasons | state | pointer over the active card, focus inside, tab hidden, section off screen |

### State transitions

```text
auto-advance:  running ──(pause reason on)──► paused ──(all reasons off)──► running
               running/paused ──(touch swipe or tap)──► stopped   (until the page is left)

card:          front ──(hover | tap | Enter/Space)──► back ──(hover leaves | flip again | focus leaves)──► front

travel:        p = 0 (hero)  ◄──scroll──►  0 < p < 1 (travelling: hero cards hidden, twins shown)  ◄──►  p = 1 (arrived: carousel takes over)
```
