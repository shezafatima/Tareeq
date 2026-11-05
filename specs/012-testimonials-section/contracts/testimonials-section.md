# Contracts: Testimonials section

No network API. Internal interfaces:

## `parseYouTubeId(url: string): string | null`  (`src/lib/youtube.ts`)

| Input | Output |
|-------|--------|
| `https://www.youtube.com/shorts/abcDEF12345` | `abcDEF12345` |
| `https://youtube.com/watch?v=abcDEF12345&t=30s` | `abcDEF12345` |
| `https://youtu.be/abcDEF12345?si=xyz` | `abcDEF12345` |
| `https://m.youtube.com/watch?feature=share&v=abcDEF12345` | `abcDEF12345` |
| `https://www.youtube.com/embed/abcDEF12345` | `abcDEF12345` |
| empty, non-URL, other host (`https://evil.com/watch?v=...`), id of wrong length/charset, `javascript:` URL | `null` |

Never throws.

## `selectTestimonials(items, opts): ResolvedTestimonial[]`  (`src/lib/testimonials.ts`)

`opts = { dev: boolean; placeholders: Testimonial[]; warn?: (index: number) => void }`. Pure; rules in data-model.md. `warn` is called only when `dev` is true.

## `getTestimonials(): Promise<ResolvedTestimonial[]>`  (`src/content/index.ts`)

Wraps the above with the real file and `process.env.NODE_ENV`.

## Component contract

- `TestimonialsSection` (server): returns `null` for an empty list; else `<Section id="testimonials" labelledBy="testimonials-title" tone="soft">` with heading and `<VideoGroup>` containing `<ol>` of cards.
- `TestimonialCard` (server): props `{ item, children }`; renders `<li><figure>` with video slot (`children`), `<blockquote>`, `<figcaption>` (name, role, organization).
- `TestimonialVideo` (client): props `{ id, videoId, name, posterAlt, placeholder }`. Renders a `<button aria-label="Play video from {name}">` over the poster; after click renders an `<iframe title="{name} on Tareeq" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen>`. Placeholder: disabled button, no poster, no iframe. Includes an "Open on YouTube" link when real.
- `VideoGroup` (client): context `{ activeId, setActiveId }`; renders `children` unchanged.
