# Contract: Routes, Components and Layout

**Feature**: `034-pricing-certificate-announcement`

## Routes

| Route | Change | Guard | Rendering |
|-------|--------|-------|-----------|
| `/admin/settings` | EDIT: add links "Certificate section →" and "Announcement bar →" beside "Site images →" (FR-028) | `requireAdmin()` | dynamic (existing) |
| `/admin/settings/certificate` | NEW | `requireAdmin()` | dynamic; `safeLoad(readStoredCertificate)`; `UnavailableNotice` on failure |
| `/admin/settings/announcement` | NEW | `requireAdmin()` | dynamic; `safeLoad(readStoredAnnouncement)` |
| `/admin/programs/new`, `/admin/programs/[id]/edit` | EDIT: Pricing section | existing | existing |
| `/admin/courses/new`, `/admin/courses/[id]/edit` | EDIT: Pricing section | existing | existing |
| `/` (home) | EDIT: `CertificateSection` between `BlogPreview` and `FinalCta` | public | static, `revalidate = 3600` (unchanged) |
| `/workshop` | EDIT: `WorkshopPricing` after the booking button, before the gallery | public | dynamic (existing `connection()`) |
| `/programs`, `/programs/[slug]`, `/courses`, `/courses/[slug]` | EDIT: `PriceBlock` replaces the raw `priceText` | public | unchanged |
| every `(site)` page | EDIT: the layout renders `AnnouncementScript` and `AnnouncementBar` before `Header` | public | unchanged (static where it was static) |

`/admin/*` uses the separate `admin/(panel)` layout, so the bar can never appear there (FR-020).

## Components

### Shared UI

| Component | Kind | Props | Notes |
|-----------|------|-------|-------|
| `components/ui/PriceBlock.tsx` | server-safe, no hooks | `price: PriceDisplay; size?: "sm" \| "md" \| "lg"; label?: string; className?: string` | Renders nothing for `none`. For `amount`: optional `<del>` original (with sr-only "Original price … now"), the current price in Sora bold, the unit note in small midnight/75 text, the offer label as a chip (`bg-saffron text-midnight`), and the offer-ends text beneath. `contact` reads "Contact us for pricing" and `free` reads "Free". It wraps at 360px. |

### Pricing surfaces (FR-007)

| Surface | Edit |
|---------|------|
| `sections/programs/ProgramPanel.tsx` | add `<PriceBlock size="sm">` (new line) |
| `sections/programs/BookingCard.tsx` | replace the `priceText` block with `<PriceBlock size="lg" label="Price">` |
| `sections/programs/MobileCtaBar.tsx` | replace it with `<PriceBlock size="md" label="Price">` (`min-w-0`; the chip may wrap under the price) |
| `sections/courses/CourseCard.tsx` | replace the `priceText` paragraph with `<PriceBlock size="sm">` inside the same bordered row |
| `sections/courses/CourseCtaCard.tsx` | replace it with `lg` |
| `sections/courses/CourseMobileCtaBar.tsx` | replace it with `md` |
| `sections/workshop/WorkshopPricing.tsx` (new, server) | heading "Workshop prices". For each entry from `pickWorkshopPrograms`: a link to `/programs/<slug>` with the program title as its text and a `PriceBlock size="sm"` below it. A 1-column list at 360px, 2 columns from `sm`. Returns `null` for 0 entries. |

Each surface computes `resolvePrice(x.pricing, x.priceText)` itself, so no surface hand-formats a price.

### Admin

| Component | Kind | Why client |
|-----------|------|-----------|
| `admin/PricingFields.tsx` | client | Shows and hides the amount fields based on the selected mode (state from the parent form) |
| `admin/ProgramForm.tsx`, `admin/CourseEditor.tsx` | EDIT | Add `pricing` to the form values and render `<PricingFields>` in a "Pricing" fieldset after the price text, relabelled "Price text (used when pricing is not set)" |
| `admin/ProgramPreview.tsx`, `admin/CoursePreview.tsx` | EDIT | Render `PriceBlock` from `resolvePrice(parsePricingLoose(values.pricing), values.priceText)` |
| `admin/CertificateForm.tsx` | client (form state) | `SwitchButton` enabled, heading and text with counters, bullets list (add, remove; Add is disabled at 4), `ImageUploader` (scope `"site"`, alt required), save status, `useUnsavedChanges` |
| `admin/AnnouncementForm.tsx` | client (form state) | `SwitchButton` enabled, text with a 0/120 counter, link label and URL, style radio (saffron, navy), start and end `datetime-local` labelled "(Pakistan time)", `SwitchButton` dismissible, and a live 360px-wide `AnnouncementBar` preview with the dismissible button inert. The warning "May be cut short on small phones" shows when text plus label is over 80 characters. |

### Certificate

| Component | Kind | Notes |
|-----------|------|-------|
| `sections/CertificateSection.tsx` | server, async | Calls `getCertificate()` and returns `null` when it is not enabled (FR-016). `<section aria-labelledby>` with an h2 heading, the text, and a `<ul>` of bullets with check icons marked `aria-hidden`. The image goes in `.certificate-frame` via `next/image` (`sizes="(min-width: 1024px) 40vw, 90vw"`, lazy). A 1-column layout at 360px with the image below the text; 2 columns from `lg`. If `isSample`, the image is the SVG sample (its ribbon is built in) and the alt text says "Sample". |

The `.certificate-frame` CSS (in `globals.css`) is described in research R13: a −3° tilt that goes to 0° on hover and `focus-within`, a transform-only transition, a `::before` glow, and no tilt or transition under reduced motion.

### Announcement

| Component | Kind | Notes |
|-----------|------|-------|
| `layout/AnnouncementScript.tsx` | server | `<script dangerouslySetInnerHTML={{ __html: announcementScript(view) }} />`. Rendered only when there is a view. |
| `layout/AnnouncementBar.tsx` | server-safe | `<div role="region" aria-label="Announcement" class="announcement-bar" data-style>`. Inside a `Container`: the text clamped to 2 lines below 1024px (1 line at 1024px and up, or when compact), wrapped in a `Link` or `<a>` when there is a link (`external`: plain `<a href>`, same tab), followed by the label and "→". Then `<AnnouncementDismiss>` if dismissible. The height is `var(--announce-h)`. |
| `layout/AnnouncementDismiss.tsx` | client | Uses an event handler and the browser cookie API. A 44×44 button with `aria-label="Dismiss announcement"` and an X icon marked `aria-hidden`. On click it writes the cookie (`DISMISS_COOKIE=<version>`) and sets `document.documentElement.dataset.announce = "off"`, then moves focus to the header logo link so keyboard focus isn't lost. |

### `(site)/layout.tsx` (EDIT)

```tsx
const [items, announcement] = await Promise.all([navItemsFor(...), getAnnouncement()]);
<div className="flex min-h-svh flex-col" data-announce={announcement ? (announcement.compact ? "compact" : "on") : undefined}>
  <PreloaderScript /><Preloader /><a href="#content">Skip to content</a>
  {announcement && <><AnnouncementScript view={announcement} /><AnnouncementBar view={announcement} /></>}
  <Header items={items} /> …
```

The skip link stays first in tab order, and the bar's link and close button come next.

## CSS (`globals.css`)

```css
:root { --announce-h: 0px; }
[data-announce="on"], [data-announce="compact"] { --announce-h: 3.25rem; }
[data-announce="compact"] { --announce-h: 2.75rem; }
@media (min-width: 1024px) { [data-announce="on"] { --announce-h: 2.75rem; } }
html[data-announce="off"] [data-announce] { --announce-h: 0px; }
html[data-announce="off"] .announcement-bar { display: none; }
.announcement-bar { height: var(--announce-h); overflow: hidden; }
.announcement-bar[data-style="saffron"] { background: var(--color-saffron); color: var(--color-midnight); }
.announcement-bar[data-style="navy"] { background: var(--color-midnight); color: white; }
```

Token names follow the existing `@theme` names, so there are no raw hex values (Principle III).

## Hero (`components/Hero.tsx`), approved under Principle VIII on 2026-11-12

Only these two expressions change:

- `lg:h-[calc(100svh-var(--header-h))]` → `lg:h-[calc(100svh-var(--header-h)-var(--announce-h,0px))]`
- `(100svh_-_var(--header-h)_-_3rem)` → `(100svh_-_var(--header-h)_-_var(--announce-h,0px)_-_3rem)`

Nothing else in the hero is edited.

## Accessibility checklist

- [ ] The bar is `role="region"` with `aria-label="Announcement"`. The close button has an accessible name and a 44px target. Link focus is visible in both styles.
- [ ] Saffron with midnight text, and midnight with white text, both pass AA.
- [ ] In the price block, the struck-through original is announced as "Original price".
- [ ] The certificate image has alt text. The sample's alt text says "Sample". The decorative glow is a pseudo-element, so screen readers don't see it.
- [ ] Under reduced motion, nothing tilts or transitions.
- [ ] One h1 per page is unchanged. The certificate section and the workshop prices use h2.
