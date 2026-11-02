# Contract: Content Accessors

Module: `@/content` (`src/content/index.ts`). The only import path components and pages may use. `@/content/data/*` is blocked by lint outside `src/content/`.

All accessors are `async`, return plain serialisable objects, and sort by `order`. They never throw for an empty source; they return `[]` or `null`.

| Accessor | Returns | Notes |
|---|---|---|
| `getAudiences()` | `Promise<Audience[]>` | four rows |
| `getSteps()` | `Promise<Step[]>` | three rows: `prompt`, `build`, `learn` |
| `getPrograms()` | `Promise<Program[]>` | all, for `/programs` |
| `getProgramPreview(limit = 3)` | `Promise<Program[]>` | first `limit` by order, for the home page |
| `getPrinciples()` | `Promise<Principle[]>` | three or four rows |
| `getStorySections()` | `Promise<StorySection[]>` | six rows, in order |
| `getContactDetails()` | `Promise<ContactDetail[]>` | only entries with a valid value |
| `getContactNote()` | `Promise<string>` | short response-time note |
| `getHomeCopy()` | `Promise<HomeCopy>` | section headings, intros, final call to action |
| `getPageMeta(slug)` | `Promise<PageMeta>` | falls back to the site defaults if the slug is unknown |

## Error taxonomy

| Case | Behaviour |
|---|---|
| Source empty | Returns `[]` (or `null` for single items); the section renders nothing rather than an empty shell |
| Invalid contact env value | Entry dropped; no throw, and the value is never logged |
| Unknown page slug | Default metadata; the build does not fail |
| Future database failure | Accessor throws; Next's error boundary handles it. Callers need no try/catch |

## Versioning and swap rule

Adding a field is backwards compatible. Replacing the source (file to database) changes only `src/content/index.ts` and `src/content/data/*`. SC-007 is checked by lint: zero imports of `@/content/data/*` outside `src/content/`.
