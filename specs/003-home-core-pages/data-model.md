# Data Model: Home Page Content and Core Pages

Shapes are written as database-ready rows: a stable `id`, a `slug` where a page could link to it, an explicit `order`, and no component-specific fields. Types live in `src/content/types.ts`; data in `src/content/data/*.ts`.

## Entities

### Audience (`audiences.ts`)

| Field | Type | Rule |
|---|---|---|
| `id` | string | unique, e.g. `teachers` |
| `name` | string | Teachers, School students, College students, Professionals and teams |
| `benefit` | string | one line, no hype words |
| `order` | number | display order, 1 to 4 |

Exactly four rows (FR-006).

### Step (`steps.ts`)

| Field | Type | Rule |
|---|---|---|
| `id` | `"prompt" \| "build" \| "learn"` | unique; also selects the hero icon |
| `label` | string | Prompt, Build, Learn (shown on the card) |
| `heading` | string | short descriptive heading (the `h3`) |
| `body` | string | what happens in a session, 1 to 2 sentences |
| `order` | number | 1 to 3, left to right |

Exactly three rows (FR-007).

### Program (`programs.ts`)

| Field | Type | Rule |
|---|---|---|
| `id` | string | unique |
| `slug` | string | for future detail pages |
| `name` | string | |
| `audience` | string | who it is for |
| `outcomes` | string[] | "what you will be able to do afterwards", 2 to 4 items |
| `duration` | string | free text (for example "Half a day") |
| `format` | string | for example "In person at your school" |
| `bring` | string[] | what to bring |
| `status` | `"available" \| "coming-soon"` | drives the badge and call to action |
| `order` | number | |

Rules: a `coming-soon` program may leave `duration` and `format` empty, and then the card shows no figures (FR-030, edge case). `getProgramPreview()` returns the first three by `order`.

### Principle (`principles.ts`)

| Field | Type | Rule |
|---|---|---|
| `id`, `heading`, `text`, `order` | | three or four rows: hands-on, real problems, usable the next day, no fluff. No statistics, testimonials or logos (FR-010) |

### StorySection (`story.ts`)

| Field | Type | Rule |
|---|---|---|
| `id` | `"story" \| "meaning" \| "approach" \| "vision" \| "mission" \| "people"` | one row each, in this order |
| `heading` | string | |
| `paragraphs` | string[] | warm and direct, no hype words |
| `highlight` | `{ script: string; transliteration: string; meaning: string }` (optional) | only on `meaning`: `{ script: "طریق", transliteration: "Tareeq", meaning: "the way" }` |
| `order` | number | |

The `people` section holds only what the owner has confirmed; unconfirmed text is plainly draft (FR-027). The Urdu text is rendered with `lang="ur"` and `dir="rtl"`.

### ContactDetail (`contact.ts`)

| Field | Type | Rule |
|---|---|---|
| `kind` | `"whatsapp" \| "email" \| "location"` | |
| `label` | string | |
| `value` | string | display text |
| `href` | string (optional) | `wa.me` link, `mailto:`, none for location |

Derived at read time from `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_LOCATION`. An entry with a missing or invalid value is dropped (FR-032). The response-time note is a separate string, `contactNote`.

### PageMeta (`pages.ts`)

| Field | Type | Rule |
|---|---|---|
| `slug` | `"home" \| "our-way" \| "programs" \| "contact"` | |
| `title` | string | under 60 characters, without the site suffix |
| `description` | string | 110 to 160 characters |

### Home call to action (`cta.ts`)

`{ line: string; label: "Join a workshop"; href }`, where `href` comes from `joinHref` in `lib/site.ts` (currently `/contact`). Section headings and intros for the home sections live here too (`homeCopy`), so components hold no copy.

## Relationships and state

- Programs link to the Programs page by `slug` only; no joins. 
- `Program.status` is the only state: `available` shows the booking call to action; `coming-soon` shows a badge and a "Ask about this" WhatsApp link instead.
- Ordering is always by `order`, applied inside each accessor, not by callers.

## Draft content to confirm (launch blockers)

| File | What the owner must confirm |
|---|---|
| `programs.ts` | the program names, durations, formats, outcomes, bring lists, and which are `available` |
| `story.ts` | the story, vision, mission wording, and the `people` section |
| `contact.ts` / `.env.local` | email, location, WhatsApp number, response-time wording |
| `principles.ts`, `audiences.ts`, `steps.ts` | tone and accuracy of the one-liners |

Every data file starts with `// DRAFT: owner to confirm before launch`.
