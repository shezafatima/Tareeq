# Data Model: Programs Pages (015)

## Program (`programs` collection)

| Field | Type | Rules |
|---|---|---|
| `title` | string | required, trimmed, max 120 |
| `slug` | string | required, unique, `^[a-z0-9]+(-[a-z0-9]+)*$`, max 80 |
| `audience` | enum | required: `teachers`, `school-students`, `college`, `corporate` |
| `status` | enum | required: `booking-now`, `register-interest`, `coming-soon` |
| `ctaType` | enum | required: `workshop-modal`, `register`, `whatsapp` |
| `summary` | string | required, trimmed, max 240 |
| `description` | string (markdown) | default `""`, max 20000; sanitized at render, stored as written |
| `outcomes` | string[] | default `[]` |
| `curriculum` | `{ title, description }[]` | default `[]`, no subdocument ids; `title` required, max 120; `description` default `""`, max 1000 |
| `facts` | `{ format, duration, groupSize, location }` | no subdocument id; each string default `""`, max 120 |
| `priceText` | string | default `""`, max 120 |
| `coverImageUrl` | string | optional; `https://` or site-relative path |
| `order` | number | required, default 0 |
| `published` | boolean | required, default `false` |
| `createdAt`, `updatedAt` | date | Mongoose timestamps |

**Indexes**: unique on `slug`; `{ published: 1, order: 1 }` for the list read.

**Admin readiness (FR-002)**: every field above is editable as stored. Nothing is derived at write time, `published` defaults to false so new drafts stay hidden, and `order` is a plain number. The seed is one writer, not a special case.

**Not stored**: chip and button labels are derived in `options.ts`; the WhatsApp message is derived from `title`; "what to bring" is part of `description`.

## Read shape

`data.ts` returns plain `Program` objects: all fields above, without `_id` or `__v`, with `createdAt` and `updatedAt` as ISO strings. These are JSON-safe for `unstable_cache` and for props. Client leaves receive only filter values and counts.

## Derived values (`view.ts`, pure)

| Function | Result |
|---|---|
| `sortForIndex(programs)` | Stored order, with `coming-soon` last, in stored order among themselves |
| `visibleFacts(program)` | Non-empty `{ label, value }` in order: Format, Duration, Group size, Location. Panels take the first 3 |
| `resolveProgramCta(program, whatsappUrl)` | `{ label, href, external }`, or `null` for WhatsApp with no number |
| `toHomeCard(program)` | Existing `HomeProgramCard` shape |
| `isAllowedCover(url)` | true for site-relative paths and `https://res.cloudinary.com/` |
| `parseFilter(search)` | `all`, `teachers`, `students`, `college`, `online` or `corporate`; anything else is `all` |

## Seed content (`scripts/data/programs.seed.ts`, marked DRAFT)

| Slug | Title | Summary (from home card audience line) | Audience | Status | CTA | Order |
|---|---|---|---|---|---|---|
| `teachers-workshop` | AI for Teachers workshop | School and college teachers | teachers | booking-now | workshop-modal | 1 |
| `student-workshops` | School student workshops | Grades 6-10 | school-students | booking-now | workshop-modal | 2 |
| `college-university` | College & university | College and university students | college | coming-soon | whatsapp | 3 |
| `corporate-teams` | Corporate teams | Professionals and teams | corporate | coming-soon | whatsapp | 4 |

"Online courses" is not stored. It is a fixed card in `src/content/online-courses.ts`, read through `getOnlineCoursesCard()`, and its link target is `onlineCoursesHref` in `src/lib/site.ts`.

**Facts** are copied from `home-programs.ts`.

**Outcomes** come from `data/programs.ts`: teachers from `teachers-workshop`, students from `students-workshop`, corporate from `teams-workshop`. College gets draft outcomes.

**Description**: a short draft paragraph per program, plus a "What to bring" list where `data/programs.ts` has one.

**Curriculum**: 3-4 draft steps per program, without invented statistics, people or testimonials.

**Other values**: `priceText` is "Contact us", `published` is true, and `coverImageUrl` is unset.

## State

```text
published: false ──(admin, later)──> true: appears on all surfaces after refresh
published: true  ──(admin, later)──> false: removed from lists; address gives 404
status: display only; coming-soon also hides from home and sorts last on the index
```
