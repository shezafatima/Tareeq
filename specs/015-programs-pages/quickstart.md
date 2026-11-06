# Quickstart: Programs Pages (015)

## Setup

```bash
npm install
npm run seed:programs      # needs MONGODB_URI in .env.local (tareeq_dev)
npm run dev
```

Open `/programs` and `/programs/teachers-workshop`.

## Milestones

Each ends with `npm run lint`, `npm run test:unit`, `npm run build`, and a browser check at 390px and 1440px where pages changed.

### 1. Seed and data layer, proving the risky assumptions

- [ ] Empty database: seed reports `Created 4, already existed 0`.
- [ ] Second run reports `Created 0, already existed 4`.
- [ ] Edit one program by hand and run again: the edit and `updatedAt` are unchanged.
- [ ] Delete one and run again: `Created 1, already existed 3`.
- [ ] With only `MONGODB_URI` set, the seed succeeds. With it unset, exit code 1 and the variable name only.
- [ ] Build succeeds with `server-only` installed and with `MONGODB_URI` unset.
- [ ] **Keep-last-good**, under `next build && next start`, using a temporary uncommitted route handler that calls `revalidateTag`:
  - a tagged change reaches the page;
  - with `MONGODB_URI` pointed at an unreachable address, a revalidated page keeps its last good content.
  - If either fails, stop and revisit research R2 before building pages on it.

### 2. Env split

- [ ] Existing unit tests and `scripts/leads-check.mjs`, `scripts/leads-db-check.mjs` pass.
- [ ] Remove `RESEND_API_KEY`, `LEAD_NOTIFICATION_TO`, `RATE_LIMIT_SECRET`, then `MONGODB_URI`, one at a time: a valid form submission returns the generic error and stores no lead, matching `main`.
- [ ] An invalid form with a setting missing still shows field errors.

### 3. Home reads the database

- [ ] `scripts/programs-check.mjs` passes unchanged at all five widths.
- [ ] `src/content/home-programs.ts` and `src/content/data/programs.ts` are gone. No program text remains in `src/`; a search for those titles finds only `scripts/data/programs.seed.ts`.
- [ ] `scripts/polish-token-check.mjs` passes (hero untouched), and the build still lists `/` as static.

### 4. `/programs` index

Covered by the new `scripts/programs-pages-check.mjs`:

- [ ] Each chip filters with no network request, sets `?for=`, and adds no history entry.
- [ ] A filtered URL opened fresh shows only matching panels, with no flash of others at first paint.
- [ ] `?for=xyz` shows all. Numbers restart at 01 and surfaces alternate under every filter.
- [ ] Coming-soon programs come last, are quieter, and pass AA contrast.
- [ ] Hover and keyboard focus expand the panel, reveal the cover and take the saffron state, with zero layout shift. No saffron numerals on paper. No reveal on touch.
- [ ] No horizontal scroll at 360, 390, 768, 1024 or 1440px, including during hover. Touch targets are at least 44px.
- [ ] With JavaScript off, all programs show and chips are hidden. With the database unavailable in dev, the friendly message shows.

### 5. `/programs/[slug]` detail

- [ ] All 4 pages render; every block appears for full programs, and an empty block leaves no heading.
- [ ] Each CTA type reaches its destination; with no WhatsApp number, the card and bar link to the footer's email.
- [ ] Desktop card stays in view and covers nothing. Phone bar stays in view, covers no final content or footer, and does not overlap the floating WhatsApp button.
- [ ] Unknown slug, malformed slug and `published: false` return HTTP 404. Database failure on a new page shows the error state, not a 404.
- [ ] Metadata and Open Graph are per program. View source: one H1.
- [ ] Unit test: script tags, event handlers, `javascript:` links, images and raw HTML are stripped; `#` becomes `h2`.

### 6. Motion and release gates

- [ ] Entrance stagger, hover and timeline reveal use only `transform` and `opacity`. Under reduced motion all content shows at once with no movement.
- [ ] Mobile Lighthouse on `/programs` and a detail page: Performance 90+, Accessibility 95+, SEO 90+. Home unchanged against `main`.
- [ ] Client bundle contains no `marked`, `sanitize-html` or `mongoose`.
- [ ] Search confirms `"use client"` under `components/sections/programs/` is on `ProgramFilter` only.
