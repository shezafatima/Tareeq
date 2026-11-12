# Contract: data access and Server Actions

## Public read: `src/lib/testimonials/data.ts` (`server-only`)

```ts
/** Live testimonials (consent AND published true), by order then createdAt. Cached, tag "testimonials". Throws on a DB error. */
export async function getPublishedTestimonials(): Promise<Testimonial[]>;
```

- Query: `TestimonialModel.find({ consent: true, published: true }).sort({ order: 1, createdAt: 1 })`.
- `unstable_cache(..., ["testimonials:published"], { tags: ["testimonials"], revalidate: 3600 })`.

## Content entry point: `src/content/index.ts`

```ts
export async function getTestimonials(): Promise<ResolvedTestimonial[]>; // signature unchanged
```

- `items = await getPublishedTestimonials()`; on error log `[testimonials] read failed: <error name>` and use `[]`.
- Then `selectTestimonials(items, { dev, placeholders, warn })` exactly as today.

## Admin reads: `src/lib/admin/testimonials-read.ts` (`server-only`, uncached)

```ts
export async function listAllTestimonials(): Promise<AdminTestimonial[]>; // all items, order then createdAt; throws on DB error
export async function getTestimonialById(id: string): Promise<AdminTestimonial | null>; // null for unknown/malformed id
export async function nextTestimonialOrder(): Promise<number>; // highest order + 1, or 1 when empty
```

## Server Actions: `src/lib/admin/testimonials-actions.ts` (`"use server"`, each wrapped by `withAdmin`)

All return `ActionResult` (`src/lib/admin/result.ts`). No session → `{ ok: false, code: "unauthorized" }` before any DB
call. Every success calls `revalidateTag("testimonials", { expire: 0 })` and `revalidatePath("/admin/testimonials")`,
then `logAdmin("testimonial", "ok", id)`. DB errors → `unavailable` (error name logged, no personal data).

| Action | Input | Success | Failures |
|--------|-------|---------|----------|
| `createTestimonial` | `TestimonialFormValues` | `{ ok: true, id }` | `invalid` + `fieldErrors` (incl. `published` consent rule, `youtubeUrl`), `unavailable` |
| `updateTestimonial` | `{ id, values: TestimonialFormValues }` | `{ ok: true }` | `invalid` (bad id or fields), `not_found`, `unavailable` |
| `setTestimonialPublished` | `{ id, published: boolean }` | `{ ok: true }` | `invalid` (bad input, or publishing without stored consent: `message: "Tick consent before publishing."`), `not_found`, `unavailable` |
| `deleteTestimonial` | `{ id }` | `{ ok: true }` | `invalid`, `not_found`, `unavailable` |

Rules:
- `youtubeId` is always derived on the server from `youtubeUrl` via `parseYouTubeId()`; a client-sent id is ignored.
- `updateTestimonial` uses `$set` for present fields and `$unset: { organization: 1 }` when it is blank;
  `runValidators: true`.
- `setTestimonialPublished(true)` uses the filter `{ _id: id, consent: true }` (R5).

## Guard test

`scripts/admin-guard-test.mts` `REQUIRED_ACTIONS` gains: `createTestimonial`, `updateTestimonial`,
`setTestimonialPublished`, `deleteTestimonial`. Each must return `unauthorized` and touch no Mongoose model method.
