# Research: Admin testimonial videos

All Technical Context items were resolvable from the existing code; no NEEDS CLARIFICATION remained. Each decision below
records what was chosen and why, with the alternatives considered.

## R1. Where the new code lives (and the `src/lib/testimonials.ts` name clash)

- **Decision**: Follow the programs layout: `src/lib/testimonials/model.ts` (Mongoose) and `src/lib/testimonials/data.ts`
  (cached public read). Move the existing pure selector `src/lib/testimonials.ts` to `src/lib/testimonials/select.ts`
  with no code change, and update its two importers (`src/content/index.ts`, `tests/unit/testimonials.test.ts`).
- **Rationale**: A file `src/lib/testimonials.ts` next to a folder `src/lib/testimonials/` makes `@/lib/testimonials`
  ambiguous. One folder per content type matches `src/lib/programs/` and `src/lib/courses/`.
- **Alternatives**: a differently named folder (`testimonial-videos/`): avoids the move but breaks the naming pattern;
  putting the model in `src/lib/admin/`: the public reader would then depend on admin code.

## R2. How the home section gets its items

- **Decision**: Keep `getTestimonials()` in `src/content/index.ts` as the one entry point the section calls. It now reads
  `getPublishedTestimonials()` instead of the static array and passes the result to the unchanged `selectTestimonials()`.
  A database error is caught there, logged by error name only, and treated as zero items.
- **Rationale**: `TestimonialsSection`, `TestimonialCard`, `TestimonialVideo` and the dev placeholder logic stay
  byte-for-byte unchanged (FR-003, FR-004). Treating a failed read as empty means production hides the section instead of
  breaking the home page, the same "never break the public page" stance as `getSiteSettings()`
  (`src/lib/settings/data.ts`). `selectTestimonials()` re-checks consent, published and the link, which is harmless
  defence in depth.
- **Alternatives**: calling the data reader directly from the section: duplicates the dev/placeholder rule; letting the
  error throw to the page error boundary: one optional section would take down the home page.

## R3. Caching and refresh

- **Decision**: `getPublishedTestimonials()` wraps the query in `unstable_cache` with key `["testimonials:published"]`,
  tag `"testimonials"` and `revalidate: 3600`. Every successful write calls `revalidateTag("testimonials", { expire: 0 })`
  and `revalidatePath("/admin/testimonials")`. A failed read throws inside the cache function, so it is never cached.
- **Rationale**: Identical to `src/lib/programs/data.ts` and `programs-actions.ts`; `expire: 0` means the next request
  sees fresh data (SC-005).
- **Alternatives**: `revalidatePath("/")`: couples writes to the page path rather than the data.

## R4. Extracting the video id

- **Decision**: The shared zod schema (`src/lib/admin/testimonials-schema.ts`) checks the link with the existing
  `parseYouTubeId()` (`src/lib/youtube.ts`) and the server action stores the returned id as `youtubeId`. The model
  validates `youtubeId` against the 11-character pattern.
- **Rationale**: One helper, one rule, used by the form (inline error, live preview) and the server (source of truth).
  Computing it in the action rather than a Mongoose `pre("validate")` hook works for both `create` and `updateOne`
  (document hooks do not run on `updateOne`).
- **Alternatives**: a `pre("save")` hook: silently skipped by `updateOne`, so edits could store a stale id.

## R5. The consent rule on the server

- **Decision**:
  1. `parseTestimonial()` rejects `published: true` with `consent: false` (field error on `published`, message
     "Tick consent before publishing."). Create and update therefore refuse it.
  2. `setTestimonialPublished({ id, published: true })` updates with the filter `{ _id: id, consent: true }`. No match →
     look the id up: missing → `not_found`; present → `invalid` with the consent message. Unpublishing has no consent
     filter.
  3. The model has a document-level validator as a last guard (`published` true requires `consent` true), and updates
     run with `runValidators: true`.
  4. The form turns Published off automatically when consent is unticked, so "untick consent and save" stores an
     unpublished item (spec US2 scenario 3) without the server ever accepting published-without-consent.
- **Rationale**: SC-002 requires zero leaks through the form or a direct request; the conditional update closes the race
  between reading consent and writing published.
- **Alternatives**: silently forcing `published = false` on the server: hides the mistake from a direct caller and
  contradicts "the server refuses".

## R6. Publish switch disabled with a tooltip

- **Decision**: Extend the existing `PublishedToggle` (`src/components/admin/PublishedToggle.tsx`) with an optional
  `lockedReason?: string`. When set, the switch renders with `aria-disabled="true"` (not the `disabled` attribute, so it
  stays focusable), ignores clicks, is linked by `aria-describedby` to a small `role="tooltip"` bubble that shows on
  hover and on keyboard focus (CSS `group-hover` / `group-focus-visible`, opacity only, no transition under reduced
  motion). The form's own Published switch uses the same component pattern without saving instantly (form value only).
- **Rationale**: Constitution II (no copy-paste variant), IV (keyboard-reachable explanation). A real `disabled` button
  cannot be focused, so keyboard users would never see the reason.
- **Alternatives**: native `title` attribute: not shown on keyboard focus or touch; a new tooltip library: Principle IX.

## R7. Thumbnails

- **Decision**: Admin card and form preview use `next/image` with `src="https://i.ytimg.com/vi/<id>/hqdefault.jpg"`,
  `unoptimized`, `fill` inside a `aspect-[9/16]` box with `object-cover`, exactly as `TestimonialVideo` does. No
  `next.config` change.
- **Rationale**: `unoptimized` images bypass `remotePatterns`, which is why the public section already works; no new
  host is added (FR-019). `hqdefault` exists for every video, Shorts included.
- **Alternatives**: `maxresdefault`: missing for many Shorts.

## R8. Reordering and deleting

- **Decision**: Order is edited in the form's order number field (programs pattern); the grid sorts by `order` then
  `createdAt`. New items default to one more than the current highest order (computed in the "new" page). Delete lives on
  the edit page behind the existing `ConfirmDialog`, as in `ProgramForm`.
- **Rationale**: Smallest diff that reuses proven components; the spec lists drag and drop as out of scope.
- **Alternatives**: inline order inputs on each card: a second save path for the same field.

## R9. Guard test

- **Decision**: Add `createTestimonial`, `updateTestimonial`, `setTestimonialPublished`, `deleteTestimonial` to
  `REQUIRED_ACTIONS` in `scripts/admin-guard-test.mts`. The file is discovered automatically as
  `src/lib/admin/testimonials-actions.ts`; the existing argument sets already exercise `{ id, published }` and
  `{ id, values }` shapes.
- **Rationale**: FR-018 / SC-003, and a renamed action fails loudly instead of dropping out.

## R10. Admin navigation

- **Decision**: Add `{ href: "/admin/testimonials", label: "Testimonials", Icon: VideoCamera }` to `ENTRIES` in
  `src/components/admin/AdminNav.tsx`, between Courses and Settings. `TopBar` (mobile) reuses `AdminNav`, so both get it.
- **Rationale**: One list drives desktop and mobile; `VideoCamera` ships with `@phosphor-icons/react` already installed.
