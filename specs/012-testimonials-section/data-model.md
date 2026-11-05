# Data Model: Testimonials

## Testimonial (source shape, stable for the future admin)

| Field | Type | Rule |
|-------|------|------|
| `youtubeUrl` | string | Shorts, watch or youtu.be URL; invalid -> item skipped (dev warning) |
| `name` | string | required, non-empty |
| `role` | string | required, e.g. "Teacher" |
| `organization` | string \| undefined | optional; omitted from the card when empty |
| `quote` | string | one short line |
| `consent` | boolean | must be `true` to show |
| `published` | boolean | must be `true` to show |
| `order` | number | ascending sort; ties keep list position |

## ResolvedTestimonial (output of `getTestimonials()`)

`Testimonial` + `videoId: string` (11 chars) + `isPlaceholder: boolean`. Not part of the source contract.

## Selection pipeline (`selectTestimonials`)

1. Keep items with `consent === true && published === true` (strict boolean, so `"true"` or `1` fail).
2. Parse `youtubeUrl`; drop items where the result is `null` (warn in dev only, log item index only).
3. Stable sort by `order`.
4. If the result is empty and not production, return the 3 placeholders (`isPlaceholder: true`). In production return `[]`.
5. Section renders nothing when the list is empty.

## State

Client only: `activeId: string | null` in `VideoGroup`. Playing = `activeId === card id`; starting another card replaces it.
