# Data Model: Admin Site Settings (028)

## SiteSettings (stored, MongoDB collection `sitesettings`)

At most one document, keyed by a fixed `_id` (research R2).

| Field | Type | Rules | Notes |
|---|---|---|---|
| `_id` | string | always `"site"` | singleton key |
| `whatsappNumber` | string | optional; E.164 `^\+[1-9]\d{7,14}$` | stored normalised |
| `email` | string | optional; email shape, ≤ 254 | public contact email |
| `phone` | string | optional; E.164 | shown in footer as a `tel:` link |
| `address` | string | optional; trimmed, ≤ 300 | plain text |
| `socialLinks.youtube` | string | optional; https, host `youtube.com` / `youtu.be` (or a subdomain), ≤ 500 | |
| `socialLinks.linkedin` | string | optional; https, `linkedin.com` | |
| `socialLinks.instagram` | string | optional; https, `instagram.com` | |
| `socialLinks.tiktok` | string | optional; https, `tiktok.com` | |
| `socialLinks.x` | string | optional; https, `x.com` / `twitter.com` | |
| `notifyEmail` | string | optional; email shape, ≤ 254 | owner notification recipient |
| `createdAt`, `updatedAt` | Date | Mongoose `timestamps` | |

- **Empty values are not stored.** A field the owner clears is `$unset`, so "missing" has one meaning: use the fallback.
- **The model validators repeat the shape rules** (E.164 regex, `https://` prefix, max lengths) as a second guard. The domain rules live in the shared schema.
- **No migration is needed**: a missing document is the normal fresh state.

## EffectiveSettings (computed, never stored)

The result of `mergeSettings(stored | null, fallback)`, and what `getSiteSettings()` returns. All of it is serialisable, so it can be passed as props.

```ts
type SocialKind = "youtube" | "linkedin" | "instagram" | "tiktok" | "x";

type EffectiveSettings = {
  whatsappNumber: string | null; // E.164, e.g. "+923001234567"
  email: string | null;
  phone: string | null;
  address: string | null;
  socialLinks: Partial<Record<SocialKind, string>>; // only the links that are set
  notifyEmail: string | null;
};
```

Field rule: `stored value (trimmed, non-empty) ?? fallback ?? null`. The fallback sources are listed in research R4.

Social links are the exception: they come from the stored document if one exists, otherwise from the fallback. This lets a cleared link really disappear (research R4 correction).

## SettingsFormValues (admin form ⇄ action)

All strings. An empty string means "not set".

```ts
type SettingsFormValues = {
  whatsappNumber: string; email: string; phone: string; address: string;
  socialLinks: Record<SocialKind, string>;
  notifyEmail: string;
};
```

- **Initial values are the effective settings**, which are what the site shows right now (spec US1 scenario 2). On a fresh database the first save copies those values into the document, and from then on the database is the source of truth. A field with no value shows empty.
- **Phone and WhatsApp show as normalised after a save.**

## State transitions

None. The document goes from not existing to existing on the first save. It is never deleted by the app.
