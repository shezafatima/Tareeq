# Data Model: Pricing, Certificate Section and Announcement Bar

**Feature**: `034-pricing-certificate-announcement` | **Date**: 2026-11-12

Nothing is migrated. All new fields are optional, and both new collections are singletons that fall back to defaults when empty.

## 1. Pricing (embedded sub-document on `programs` and `courses`)

| Field | Type | Rule |
|-------|------|------|
| `mode` | `"show" \| "contact" \| "free"` | required when `pricing` exists |
| `amount` | integer | required if `mode = "show"`; 1 ≤ amount ≤ 10,000,000; absent otherwise |
| `originalAmount` | integer, optional | only with `mode = "show"`; must be > `amount` |
| `unitNote` | string, optional | trimmed, ≤ 40; only with `show` |
| `offerLabel` | string, optional | trimmed, ≤ 40; only with `show` |
| `offerEndsText` | string, optional | trimmed, ≤ 60; only with `show` |

- **Absent `pricing`** means the record uses `priceText`, exactly as today (FR-002).
- **Mode `contact` or `free`** stores `{ mode }` only. Any amount fields sent with these modes are dropped on save.
- **Mongoose**: `pricingSchema` (`_id: false`) in `src/lib/pricing/schema.ts` (server-only), added as `pricing: { type: pricingSchema }` to `ProgramModel` and `CourseModel`.
- **Page shape**: `Program.pricing?: Pricing` and `Course.pricing?: Pricing`, and `CourseCardData` gains `"pricing"`. `toProgram` and `toCourse` copy it only when it is present.

### Form values (`PricingFormValues`)

```ts
{ mode: "" | "show" | "contact" | "free"; amount: string; originalAmount: string; unitNote: string; offerLabel: string; offerEndsText: string }
```

`""` means "Not set (use price text)". `parsePricing(values)` returns `{ success: true, data: Pricing | null }` or field errors keyed `pricing.<field>`.

| Error key | Message |
|-----------|---------|
| `pricing.amount` | "Enter the price in rupees, a whole number above 0." |
| `pricing.originalAmount` | "The original price must be higher than the price." |
| `pricing.unitNote` / `pricing.offerLabel` | "Keep this under 40 characters." |
| `pricing.offerEndsText` | "Keep this under 60 characters." |

### Display shape (`PriceDisplay`), from `resolvePrice(pricing, priceText)`

```ts
| { kind: "amount"; current: string; original?: string; unit?: string; offerLabel?: string; offerEnds?: string }
| { kind: "contact" }   // "Contact us for pricing"
| { kind: "free" }      // "Free"
| { kind: "text"; text: string }   // fallback priceText (trimmed, non-empty)
| { kind: "none" }
```

`original` is set only when `originalAmount > amount`. Values are already formatted ("Rs 5,000").

## 2. CertificateSettings (collection `certificatesettings`, one document, `_id: "certificate"`)

| Field | Type | Rule |
|-------|------|------|
| `enabled` | boolean | default `true` |
| `heading` | string | trimmed; 1–80 when enabled |
| `text` | string | trimmed; ≤ 300 |
| `bullets` | string[] | 1–4 items when enabled, each trimmed 1–100; blank rows dropped before checking |
| `image` | StoredImage, optional | `storedImageSchema` (url, publicId, width, height, alt); alt required (1–200) |
| `updatedAt` | Date | timestamps |

- **Effective content**: `getCertificate()` returns stored values merged over `CERTIFICATE_DEFAULTS`, field by field. An empty stored `image` means the built-in sample (`/images/certificate-sample.svg`, `isSample: true`).
- **Defaults** are listed in research R8.

### Effective shape (`CertificateContent`)

```ts
{ enabled: boolean; heading: string; text: string; bullets: string[]; image: { src: string; width: number; height: number; alt: string }; isSample: boolean }
```

## 3. Announcement (collection `announcements`, one document, `_id: "announcement"`)

| Field | Type | Rule |
|-------|------|------|
| `enabled` | boolean | default `false` |
| `text` | string | trimmed; ≤ 120; required (≥ 1) when enabled |
| `linkLabel` | string, optional | trimmed; ≤ 30; set together with `linkUrl` |
| `linkUrl` | string, optional | internal path `/…` (not `//`, no whitespace, ≤ 300) or `https://` URL (≤ 300) |
| `style` | `"saffron" \| "navy"` | default `"saffron"` |
| `startsAt` | Date, optional | UTC; entered as Asia/Karachi |
| `endsAt` | Date, optional | UTC; must be > `startsAt` when both are set |
| `dismissible` | boolean | default `true` |
| `updatedAt` | Date | timestamps; every save bumps it. It is the dismissal **version**. |

### Form values

`startsAt` and `endsAt` are `"YYYY-MM-DDTHH:mm"` strings in Karachi time, or `""`. The conversion is a fixed UTC+05:00 offset (`toUtcFromKarachi` and `toKarachiInput`) in `src/lib/announcement/time.ts`.

### Public shape (`AnnouncementView`, or `null` = no bar)

```ts
{ text: string; link?: { label: string; href: string; external: boolean }; style: "saffron" | "navy";
  dismissible: boolean; version: number; startsAt?: number; endsAt?: number; compact: boolean }
```

`selectAnnouncement(doc, nowMs)` returns `null` when it is disabled, the text is empty, or `endsAt ≤ now`. A future `startsAt` still returns a view, and the client script hides it (research R11). `compact` is true when the text plus link label is 36 characters or fewer.

## 4. Announcement dismissal (visitor's browser)

| Cookie | Value | Attributes |
|--------|-------|------------|
| `tareeq_announce` | `version` (`updatedAt` in ms, as a decimal string) | `Path=/; Max-Age=31536000; SameSite=Lax`, plus `Secure` on https |

It is functional only: no personal data, never read by the server.

### States

| State | Condition |
|-------|-----------|
| shown | cookie ≠ version, and start ≤ now < end |
| hidden (dismissed) | cookie = version |
| hidden (outside the window) | now < start, or now ≥ end |

An admin save changes the version, so a dismissed bar is shown again.

## Cache tags

| Tag | Read | Refreshed by |
|-----|------|--------------|
| `programs`, `program:<slug>` | existing | existing program actions (now carrying pricing) |
| `courses` (existing tags) | existing | existing course actions (now carrying pricing) |
| `certificate` | `getCertificate()` | `saveCertificate` |
| `announcement` | `getAnnouncement()` | `saveAnnouncement` |
