# Contract: Data Access, Rules and Server Actions

**Feature**: `034-pricing-certificate-announcement`

## 1. Pure modules (unit-tested, importable by client code)

### `src/lib/pricing/rules.ts`

```ts
export const PRICING_MODES = ["show", "contact", "free"] as const;
export const PRICING_LIMITS = { amountMax: 10_000_000, unitNote: 40, offerLabel: 40, offerEndsText: 60 } as const;
export type Pricing = { mode: "show"; amount: number; originalAmount?: number; unitNote?: string; offerLabel?: string; offerEndsText?: string }
                    | { mode: "contact" } | { mode: "free" };
export type PricingFormValues = { mode: "" | PricingMode; amount: string; originalAmount: string; unitNote: string; offerLabel: string; offerEndsText: string };
export function formatRs(n: number): string;                       // 5000 → "Rs 5,000"
export function resolvePrice(pricing: Pricing | undefined, priceText: string): PriceDisplay;
export function parsePricing(v: PricingFormValues): { success: true; data: Pricing | null } | { success: false; errors: Record<string, string> };
export function parsePricingLoose(v: PricingFormValues): Pricing | undefined;   // preview: best effort, never throws
export function toPricingFormValues(p: Pricing | undefined): PricingFormValues;
export const EMPTY_PRICING: PricingFormValues;
```

**Guarantees**:

| Input | Result |
|-------|--------|
| `parsePricing({ mode: "" , … })` | `data: null`, whatever the other fields hold |
| `mode: "contact"` or `"free"` | `{ mode }` only, other fields ignored |
| `amount` `"0"`, `"-5"`, `"5.5"`, `"abc"`, `""` with `show` | error on `pricing.amount` |
| `"5,000"` | accepted as 5000 (commas and spaces stripped) |
| `originalAmount ≤ amount` | error on `pricing.originalAmount` |
| `originalAmount` empty | omitted |

`resolvePrice`:

- A `show` record with a stored `original ≤ amount` gives no `original`.
- `pricing` undefined with a non-empty trimmed `priceText` gives `text`; otherwise `none`.

### `src/lib/programs/workshop.ts`

```ts
export function pickWorkshopPrograms(programs: Program[]): Array<{ title: string; slug: string; price: PriceDisplay }>;
```

It takes the first `teachers` program and then the first `school-students` program, in input order. It skips any program that is unpublished or has no `pricing`, and returns 0–2 entries. The order is teachers first, then students.

### `src/lib/certificate/content.ts`

```ts
export const CERTIFICATE_LIMITS = { heading: 80, text: 300, bullet: 100, bulletsMax: 4 } as const;
export const CERTIFICATE_DEFAULTS: { enabled: true; heading: string; text: string; bullets: string[] };
export const SAMPLE_CERTIFICATE: { src: "/images/certificate-sample.svg"; width: 1200; height: 850; alt: "Sample Tareeq certificate of completion" };
export function mergeCertificate(stored: StoredCertificate | null): CertificateContent;
export function parseCertificate(v: CertificateFormValues): { success: true; data: CertificateInput } | { success: false; errors: Record<string, string> };
```

- Blank bullets are dropped before checking.
- When enabled: the heading is required, and there must be 1–4 bullets.
- When disabled: the rules on length still apply, but an empty heading is allowed and is replaced by the default when shown.
- An image without alt text gives an error on `image.alt`.

### `src/lib/announcement/rules.ts` and `time.ts`

```ts
export const ANNOUNCEMENT_LIMITS = { text: 120, linkLabel: 30, linkUrl: 300, compactChars: 36, mobileWarnChars: 80 } as const;
export function isAllowedLink(url: string): boolean;     // "/path" (not "//", no whitespace) or a parseable https:// URL
export function parseAnnouncement(v: AnnouncementFormValues): { success: true; data: AnnouncementInput } | { success: false; errors: Record<string, string> };
export function selectAnnouncement(doc: StoredAnnouncement | null, nowMs: number): AnnouncementView | null;
export function toUtcFromKarachi(local: string): Date | null;   // "2026-12-01T09:00" → 2026-12-01T04:00:00Z
export function toKarachiInput(d: Date | undefined): string;      // inverse; "" for undefined
export const DISMISS_COOKIE = "tareeq_announce";
export function announcementScript(view: Pick<AnnouncementView, "version" | "startsAt" | "endsAt">): string;  // inline JS text
```

| Field | Error key |
|-------|-----------|
| text | `text` (empty while enabled, or over 120) |
| link label or URL | `linkLabel` / `linkUrl` (only one of the two set, too long, or a disallowed URL such as `javascript:`, `http://`, `//evil`, `mailto:`) |
| dates | `startsAt` / `endsAt` (unparseable, or end ≤ start) |
| style | `style` |

`announcementScript`:

- It serialises numbers only, with `JSON.stringify` of `{ v, s, e }`, so no admin text ever enters the script.
- The script is wrapped in `try/catch`, and it fails open: on an error, the bar shows.

## 2. Server reads (server-only)

| Function | File | Cache | On error |
|----------|------|-------|----------|
| `readStoredCertificate()` | `src/lib/certificate/data.ts` | none (admin) | throws (the page uses `safeLoad` and shows `UnavailableNotice`) |
| `getCertificate()` | same | `unstable_cache`, tag `certificate`, 3600 s | logs the error name; returns `mergeCertificate(null)` |
| `readStoredAnnouncement()` | `src/lib/announcement/data.ts` | none (admin) | throws |
| `getAnnouncement()` | same | `unstable_cache`, tag `announcement`, 3600 s; `selectAnnouncement(doc, Date.now())` applied **after** the cached read | logs; returns `null` |
| `getPublishedPrograms()` | existing | existing tag `programs` | the workshop section catches the error, logs it and hides itself |

`getAnnouncement` caches the stored document, not the "is it active" decision, so `endsAt` is evaluated on every render or regeneration.

## 3. Server Actions (all wrapped by `withAdmin`; return `ActionResult`)

| Action | File | Input | Success | Failure codes |
|--------|------|-------|---------|---------------|
| `createProgram` / `updateProgram` (existing) | `programs-actions.ts` | `ProgramFormValues` now including `pricing: PricingFormValues` | unchanged | `invalid` (with `fieldErrors["pricing.*"]`), plus existing codes |
| `createCourse` / `updateCourse` (existing) | `courses-actions.ts` | `CourseFormValues` now including `pricing` | unchanged | same |
| `saveCertificate` | `certificate-actions.ts` (new) | `CertificateFormValues` | `{ ok: true, values }` | `unauthorized`, `invalid`, image-failure codes from `imageFailure`, `unavailable` |
| `saveAnnouncement` | `announcement-actions.ts` (new) | `AnnouncementFormValues` | `{ ok: true, values }` | `unauthorized`, `invalid`, `unavailable` |

**Pricing write rule** (program and course): `parsePricing` gives `null`, which writes `$unset: { pricing: 1 }`; otherwise `$set: { pricing }`. The existing `revalidateTag("programs" | "courses")` calls cover it.

### `saveCertificate`

1. Parse the values.
2. `connectDb`.
3. Read the current document.
4. Call `resolveImageChange(current.image, input.image)`, which verifies a new image at Cloudinary (`tareeq/site/…`).
5. Write with `updateOne({ _id: "certificate" }, …, { upsert: true, runValidators: true })`.
6. Call `deleteReplaced`.
7. Call `revalidateTag("certificate", { expire: 0 })` and `revalidatePath("/admin/settings/certificate")`.
8. Call `logAdmin("settings", "ok", "certificate")`.

### `saveAnnouncement`

1. Parse the values.
2. `connectDb`.
3. Write with `updateOne({ _id: "announcement" }, { $set: {...}, $unset: {...} }, { upsert: true, runValidators: true, timestamps: true })`. `updatedAt` is always bumped, which is the new dismissal version.
4. Call `revalidateTag("announcement", { expire: 0 })` and `revalidatePath("/admin/settings/announcement")`.
5. Call `logAdmin("settings", "ok", "announcement")`.

**Logging**: ids and outcome only. Never log the text, the URLs or any personal data (Principle V).

## 4. Guard test (`scripts/admin-guard-test.mts`)

- Add `"saveCertificate"` and `"saveAnnouncement"` to `REQUIRED_ACTIONS` (FR-027). The program and course actions are already listed.
- Add argument sets for the two new actions, if the test passes typed sample arguments, so a denied call is exercised with realistic input.
- Expected result for each: `{ ok: false, code: "unauthorized" }`, with no Mongoose or Cloudinary call (the existing tripwires).
- No new Route Handlers are added. Dismissal is a client-side cookie, not an endpoint.
