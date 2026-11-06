# Data Model: Our Way Page (016)

No database. One typed content file, `src/content/our-way.ts`, read through `getOurWay()` in `src/content/index.ts`, like other sections. Its type goes in `src/content/types.ts`.

## `OurWayContent`

```ts
export type OurWayContent = {
  opening: {
    /** the Urdu word. The font file holds only these characters: see research R1 before changing it */
    word: string;
    /** the page's H1 */
    meaning: string;
    manifesto: string;
  };
  problem: { heading: string; lines: string[] };
  principles: {
    heading: string;
    items: { id: string; number: string; title: string; line: string }[];
  };
  session: {
    heading: string;
    steps: { id: "try" | "make" | "reflect"; number: number; name: string; line: string }[];
  };
  purpose: {
    heading: string;
    vision: { heading: string; text: string };
    mission: { heading: string; text: string };
  };
  closing: {
    heading: string;
    mentorLabel: string;
    bookLabel: string;
  };
};
```

## Validation

Checked by the unit test and page checks:

- `problem.lines`: 2 or 3.
- `principles.items`: exactly 4, in the brief's order, numbered `01` to `04`.
- `session.steps`: exactly 3, in the order Try, Make, Reflect.
- `opening.word` is exactly `طریق`, so the page cannot ask for letters the font lacks.
- Whole file: no `empower`, `unlock` or `revolutioni[sz]e`.

Link targets are not content. `joinHref` comes from `src/lib/site.ts`; add `mentorHref = "/#mentor"` beside it.

## Draft copy

The file starts with the project's usual comment: `// DRAFT: owner to confirm before launch.` Fixed wording is from the brief. Everything else below is a proposal that adds no facts or numbers.

| Field | Text | Source |
|---|---|---|
| `opening.word` | طریق | Brief |
| `opening.meaning` | Tareeq means 'the way'. | Brief |
| `opening.manifesto` | AI is learned by doing, not by watching. | Brief |
| `problem.heading` | Why most AI learning doesn't stick | Draft |
| `problem.lines` | "A tour of tools shows you what exists. It doesn't show you what to do on Monday." / "A list of prompt tricks works until the task changes." / "And if you never make anything, you never find out what you can do." | Draft, from the brief's three causes |
| `principles.heading` | What we teach by | Draft |
| 01 Build every session | Every session ends with something you made yourself. | Title from brief; line drafted |
| 02 Understand before you trust | AI gets things wrong, so we learn how to check its work. | Title from brief; line drafted |
| 03 Real problems, local context | We start from your work, your classroom and the place you live. | Title from brief; line drafted |
| 04 Teacher and learner, side by side | Ustad and shagird: the old way of learning a craft, next to someone who knows it. | Title and term from brief; line drafted |
| `session.heading` | How a session feels | Brief |
| Try | Start with your own task. Getting it wrong is part of the work. | Name from brief; line drafted |
| Make | Keep going until you have something that works. | Name from brief; line drafted |
| Reflect | Look at what you made, and what you would change. | Name from brief; line drafted |
| `purpose.heading` | Where we're going | Draft |
| `vision` | "Our vision": A classroom, a college and a workplace where people use AI with confidence and good judgement. | Existing draft in `story.ts`, shortened |
| `mission` | "Our mission": To teach practical, honest AI skills through hands-on workshops that start from people's own problems. | Existing draft in `story.ts`, shortened |
| `closing.heading` | Take the next step | Draft |
| `closing.mentorLabel` | Meet your mentor | Brief |
| `closing.bookLabel` | Book a workshop | Brief |

The session lines must not repeat How it works ("Understand what you made, then improve it.", "Ask AI the right way.", "Make something real."). The page check compares them.

## Page metadata

`src/content/data/pages.ts`, entry `our-way`:

| Field | New value |
|---|---|
| `title` | Our Way (unchanged) |
| `description` | Why Tareeq exists and how we teach: you build something real in every session, and learn to check what AI gets wrong. |
| `heading`, `eyebrow`, `intro` | `heading` becomes "Tareeq means 'the way'."; `PageMeta` still requires it. `eyebrow` and `intro` are removed if the type allows, since this page no longer uses `PageHeader` |

Keep the H1 text in one place: the page reads `opening.meaning` and `pages.ts` keeps only what the type requires.

## Removed

Used only by the old page: `src/content/data/story.ts`, `StorySection` and `StorySectionId` in `types.ts`, `getStorySections()` in `index.ts`, and `src/components/sections/StorySection.tsx`. Confirm with a search before deleting.
