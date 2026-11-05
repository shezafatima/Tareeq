# Data model: Meet your mentor (011)

Typed content in `src/content/mentor.ts`, exposed only through `getMentor()` in `src/content/index.ts`. Shapes live in `src/content/types.ts`.

```ts
export type MentorFact = {
  id: string;
  /** the number or short value, e.g. "5+"; null until the owner supplies a real one (the fact is then not shown) */
  value: string | null;
  /** what it counts, e.g. "years teaching" */
  label: string;
  order: number;
};

export type MentorSocial = {
  id: string;        // "youtube" | "linkedin"; picks the icon in the display
  platform: string;  // "YouTube"
  handle: string;    // "Sheza Fatima"; "" if none
  followers: string; // "1.7k subscribers" / "2k+ followers"
  /** null until the owner supplies the real profile URL (the card is then not shown) */
  url: string | null;
  order: number;
};

export type MentorContent = {
  eyebrow: string;      // "Your mentor"
  heading: string;      // "Meet your mentor"
  photo: { src: string; width: number; height: number; alt: string };
  greeting: string;     // "Hi, I'm Sheza Fatima"
  role: string;         // "Founder of Tareeq · [Placeholder: role]"
  bio: string[];        // two paragraphs; "[Placeholder: ...]" until real
  quote: string | null; // one sentence; null hides the block
  facts: MentorFact[];  // at most three are shown
  socials: MentorSocial[];
};
```

## Display rules (derived, not stored)
| Rule | Source |
|------|--------|
| Show a social card only if `url` is non-empty | FR-009 |
| Accessible name = `Sheza Fatima on {platform}, {followers}` | FR-010 |
| Show facts with a non-empty `value`; row only if 2+ remain; max 3 | FR-006 |
| Hide the quote block if `quote` is null or empty | FR-005 |
| Hide the social grid if no card qualifies | edge case |
| Icon, brand colour and motion come from `id`, not from the data | FR-018 |

## Release gate
`[Placeholder` text, a null-URL social or a fact with a null value in shipped content means owner inputs are still missing (spec Assumptions). `scripts/mentor-check.mjs --release` reports each one.
