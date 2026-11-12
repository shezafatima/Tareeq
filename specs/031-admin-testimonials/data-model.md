# Data model: Testimonial

Collection `testimonials`, Mongoose model `"Testimonial"` in `src/lib/testimonials/model.ts` (`server-only`).

| Field          | Type    | Rules                                                                                     |
|----------------|---------|-------------------------------------------------------------------------------------------|
| `youtubeUrl`   | String  | required, trimmed, max 300; must parse with `parseYouTubeId()`                             |
| `youtubeId`    | String  | required, `^[A-Za-z0-9_-]{11}$`; set by the server action from `youtubeUrl`, never by the client |
| `name`         | String  | required, trimmed, 1–80                                                                    |
| `role`         | String  | required, trimmed, 1–40 (free text; form suggests "Teacher", "Student")                    |
| `organization` | String  | optional, trimmed, max 80; empty is not stored                                             |
| `quote`        | String  | required, trimmed, 1–140, no line breaks                                                    |
| `consent`      | Boolean | required, default `false`                                                                  |
| `published`    | Boolean | required, default `false`; `true` only allowed when `consent` is `true` (document validator) |
| `order`        | Number  | required, integer −9999…9999, default `0`                                                   |
| `createdAt` / `updatedAt` | Date | `timestamps: true`                                                              |

Index: `{ published: 1, consent: 1, order: 1 }` (public read). No unique index: the same video may be added twice.

## Validation (shared rule set)

`src/lib/admin/testimonials-schema.ts` (pure, `zod/mini`, relative imports so `node --test` can run it), used by the form
and the server actions:

- `LIMITS = { url: 300, name: 80, role: 40, organization: 80, quote: 140, order: 9999 }`
- `MESSAGES`: `url` "Paste a YouTube Shorts, watch or youtu.be link.", `name`, `role`, `organization`, `quote`
  "Write one line of up to 140 characters.", `order`, `consentRequired` "Tick consent before publishing."
- `TestimonialFormValues`: every field as typed (`order` as text).
- `parseTestimonial(values)` → `{ success: true, data: TestimonialInput & { youtubeId } } | { success: false, errors }`.
  Quote line breaks are rejected; `published && !consent` → `errors.published = MESSAGES.consentRequired`.

## State

```
             consent off              consent on
published off  draft (hidden)  ──tick──▶ approved (hidden)
                    ▲                       │ publish
                    │ untick (form also     ▼
                    │ turns published off)  live (shown on home page)
                    └───────────────────────┘
published on + consent off  =  invalid, refused at schema, action and model
```

Only **live** items (consent true AND published true) are returned by `getPublishedTestimonials()`.

## Read shapes

- Public: `Testimonial` from `src/content/types.ts` (unchanged contract: `youtubeUrl, name, role, organization?, quote,
  consent, published, order`). `selectTestimonials()` derives `videoId` as today.
- Admin: `AdminTestimonial = Testimonial & { id: string; youtubeId: string; createdAt: string; updatedAt: string }`
  from `src/lib/admin/testimonials-read.ts` (uncached).

## Migration

None. No seed. `src/content/testimonials.ts` (an empty array) is deleted; `src/content/testimonials.dev.ts` stays.
