# Data Model: "Why Tareeq" Section (008)

No database. The section's words live in one typed file; everything else is presentation.

## Content: `src/content/why-tareeq.ts`

Read through `getWhyTareeq()` in `src/content/index.ts`. Types go in `src/content/types.ts`.

```ts
export type WhyPoint = {
  id: "learn-by-doing" | "skills-that-matter" | "learning-for-everyone" | "create-with-confidence";
  number: string;   // "01" to "04", shown as text
  title: string;
  text: string;     // one sentence
  order: number;
};

export type WhyTareeqContent = {
  heading: string;  // "Why Tareeq"
  intro: string;    // one line under the heading (draft)
  points: WhyPoint[]; // exactly four, in order
};
```

### Values (the four points are the owner's exact wording; the intro is the only draft)

| number | title | text |
|---|---|---|
| 01 | Learn by Doing | Go beyond theory with hands-on activities, practical projects, and real-world applications. |
| 02 | Skills That Matter | Develop AI literacy, creativity, critical thinking, and problem-solving skills. |
| 03 | Learning for Everyone | Practical AI education designed for students, teachers, professionals, and organizations. |
| 04 | Create with Confidence | Learn to use AI responsibly, transform ideas into solutions, and prepare for what's next. |

- **heading**: "Why Tareeq". **intro**: "A simple way of teaching, kept simple on purpose." (the existing wording, moved here, marked `DRAFT: owner to confirm before launch`).
- Apostrophes in the copy use the site's typographic style where the existing content does (`what’s next`); the check compares text after normalising apostrophes.

### Rules

- Exactly four points, ids unique, numbers "01" to "04" in order.
- No wording in components. The section only maps each point's `id` to an icon name (presentation, as today's section does).

### Retired by this feature (one source of truth)

`src/content/data/principles.ts`, `getPrinciples()`, the `Principle` type, `homeCopy.why` in `src/content/data/cta.ts` and `HomeCopy.why` in `types.ts`.

## Shared robot image: `src/content/robot-image.ts`

```ts
export const robotImage = { src: "/how-it-works.png", width: 408, height: 612, alt: "The Tareeq robot assistant, smiling, standing with its hands on its hips." };
```

Used by both "How it works" and "Why Tareeq" (so the path, the size and the description are written once). `HowItWorksContent.image` is replaced by this shared constant.

## Presentation mapping (in the component, not the content)

| point id | icon |
|---|---|
| learn-by-doing | `hand` |
| skills-that-matter | `brain` |
| learning-for-everyone | `users` |
| create-with-confidence | `shieldCheck` |

## In-page state

None for this section (the breathing is a looping animation driven by "is the section on screen" and "does the visitor prefer reduced motion").
