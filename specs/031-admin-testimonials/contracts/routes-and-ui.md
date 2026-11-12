# Contract: routes and UI

All pages live under `src/app/admin/(panel)/testimonials/` and call `requireAdmin()` first. Reads go through
`safeLoad()`; a failure shows `UnavailableNotice`.

| Route | File | Content |
|-------|------|---------|
| `/admin/testimonials` | `page.tsx` | H1 "Testimonials", "New testimonial" button, grid or `EmptyState` ("No testimonials yet." / "Add the first video and publish it to show it on the home page.") |
| `/admin/testimonials/new` | `new/page.tsx` | `TestimonialForm` with empty values, `order` = `nextTestimonialOrder()` |
| `/admin/testimonials/[id]/edit` | `[id]/edit/page.tsx` | `TestimonialForm` with stored values; `notFound()` for unknown id |

## Sidebar

`src/components/admin/AdminNav.tsx` `ENTRIES`: add `Testimonials` (`VideoCamera`) between Courses and Settings, active
under `/admin/testimonials`. Shared by `Sidebar` (desktop) and `TopBar` (mobile).

## Components

### `TestimonialAdminCard` (server) — `src/components/admin/TestimonialAdminCard.tsx`

- Grid: `ul.grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4` (two columns at 360px, no horizontal scroll).
- Card: `aspect-[9/16]` thumbnail (`next/image`, `unoptimized`, `fill`, `object-cover`, `alt=""`), then name (h2),
  role · organization, quote (line-clamp 3), "order N", consent badge (`StatusChip`: "Consent given" royal /
  "No consent" grey), `PublishedToggle` with `action={setTestimonialPublished}` and
  `lockedReason={consent ? undefined : "Tick consent on the edit page before publishing."}`, and an Edit link
  (`/admin/testimonials/<id>/edit`, sr-only name).

### `PublishedToggle` (existing, client) — add `lockedReason?: string`

- Set → `aria-disabled="true"`, click does nothing, `aria-describedby` → `role="tooltip"` bubble visible on hover and
  `:focus-visible` (opacity only; `motion-reduce:transition-none`). Unset → behaviour unchanged for programs and courses.

### `TestimonialForm` (client: form state, live preview, unsaved-changes guard) — `src/components/admin/TestimonialForm.tsx`

Fields, in order, each with a `<label>` and error text linked by `aria-describedby`:

1. YouTube link (`type="url"`, `inputMode="url"`). On change: `parseYouTubeId()`. Valid → 9:16 preview thumbnail beside
   (desktop) or below (mobile) the field. Invalid and non-empty → inline error `MESSAGES.url` after blur or submit.
2. Name (required), 3. Role (required; `<datalist>` with "Teacher", "Student"), 4. Organization (optional).
5. Quote (`<textarea rows=2>`, Enter blocked, counter "N / 140" with `aria-live="polite"`; over limit → error tone and
   save blocked).
6. Consent checkbox: "I have this person's permission to show this video". Unticking also sets Published off.
7. Order (number text, as in `ProgramForm`).
8. Published switch: locked with the tooltip "Tick consent first." while consent is off.

Actions: Save (calls create/update, shows `fieldErrors`, toast on success, `router.push("/admin/testimonials")`),
Cancel link, and on edit only a Delete button that opens `ConfirmDialog` ("Delete this testimonial?" / "It will be
removed from the home page. This cannot be undone." / "Delete"). Uses `useUnsavedChanges` and `useActionFeedback` like
`ProgramForm`.

## Accessibility and motion

- Touch targets ≥ 44px (`min-h-11`); visible focus rings; one H1 per page.
- No new animation; existing switch transitions get `motion-reduce:transition-none`.
- Thumbnails are decorative (`alt=""`); the card's name heading identifies the item.
