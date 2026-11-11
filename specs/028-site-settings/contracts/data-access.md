# Contract: Settings data access (028)

Module: `src/lib/settings/` (new)

| File | Kind | Exports |
|---|---|---|
| `model.ts` | `server-only` | `SiteSettingsModel` (R2) |
| `merge.ts` | pure, relative imports | `SOCIAL_KINDS`, `type SocialKind`, `type EffectiveSettings`, `type StoredSettings`, `mergeSettings(stored, fallback)` |
| `fallback.ts` | `server-only` | `readFallback(): EffectiveSettings`, built from env and the mentor socials (R4) |
| `data.ts` | `server-only` | `getSiteSettings()`, `readStoredSettings()` |

## `getSiteSettings(): Promise<EffectiveSettings>`

- **Reads** the cached stored document (`unstable_cache`, key `["settings"]`, tags `["settings"]`, `revalidate: 3600`) and merges it over `readFallback()`.
- **Never throws.** On a database or config error it logs `[settings] read failed: <ErrorName>` (no values) and returns `mergeSettings(null, fallback)`.
- **Is safe to call many times per request**: it is cached, and `react.cache` dedupes the calls within a render.

## `readStoredSettings(): Promise<StoredSettings | null>`

The uncached read used by the admin page, so the form always shows what's saved. It **throws** on a database error, and the page wraps it in `safeLoad`.

## Pure link helpers (`src/lib/site.ts`, replacing the env readers)

```ts
whatsappUrl(e164: string | null, message = whatsappMessage): string | null
// strips "+", checks 8–15 digits, returns https://wa.me/<digits>?text=<encoded> or null

contactFallbackHref(email: string | null): string
// "#footer-email" if email, else "#footer-contact"
```

Removed: `getWhatsAppUrl`, `getWhatsAppUrlWithMessage`, `getContactEmail`, `getContactFallbackHref`. Every caller in research R1 is updated, so after this feature no file outside `src/lib/settings/fallback.ts` reads `NEXT_PUBLIC_WHATSAPP_NUMBER` or `NEXT_PUBLIC_CONTACT_EMAIL`.

## Footer data (`src/content/data/footer.ts`)

`readFooterContact(s: EffectiveSettings): { items: FooterContactItem[]; socials: FooterSocial[] }` is pure.
- Items appear in the order WhatsApp, email, phone, address, each only when set.
- Socials appear in the order YouTube, LinkedIn, Instagram, TikTok, X, each only when set.

## Notifications (`src/lib/leads/notify.ts`)

- `envSchema.LEAD_NOTIFICATION_TO` becomes optional.
- `notifyOwner(lead, to: string)`: the caller resolves `to = (await getSiteSettings()).notifyEmail`. With no recipient, it returns `{ ok: false, code: "NoRecipient" }`.
- The pre-check in `actions.ts` throws `ConfigError(["LEAD_NOTIFICATION_TO"])` when `notifyEmail` is null. This keeps today's rule that a lead the owner can't be told about is never accepted.
