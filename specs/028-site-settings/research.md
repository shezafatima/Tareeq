# Research: Admin Site Settings (028)

Every decision below was checked against the code on `main` at `954c4e9`.

## R1. What actually needs to change for "no redeploy"

**Finding**: No client component reads the WhatsApp number today. `WorkshopForm`, `CourseForm`, `Confirmation` and `FormAlert` already get `whatsappHref` as a prop, and the env reads all happen on the server: `src/lib/site.ts` (`getWhatsAppUrl`, `getWhatsAppUrlWithMessage`, `getContactEmail`, `getContactFallbackHref`) and `src/content/data/footer.ts`. The real problem is that `NEXT_PUBLIC_*` values are inlined at **build** time, even in server code. So changing them always needs a redeploy.

**Decision**: Replace every env-reading helper with pure helpers that take the number or email as an argument. Every caller gets the values from `getSiteSettings()`. FR-016 is then enforced by a grep in quickstart and the tasks: there must be no `NEXT_PUBLIC_WHATSAPP_NUMBER` or `NEXT_PUBLIC_CONTACT_EMAIL` outside `src/lib/settings/`.

**Call sites to change** (complete list from `grep`):

| File | Today | After |
|---|---|---|
| `src/components/layout/WhatsAppButton.tsx` | `getWhatsAppUrl()` | `await getSiteSettings()` → `whatsappUrl(s.whatsappNumber)` |
| `src/content/data/footer.ts` + `src/content/index.ts` | env + mentor socials | pure `readFooterContact(settings)` |
| `src/components/layout/Footer.tsx` | `getFooterContact()` | passes settings, renders phone, address and the social icon row |
| `src/app/(site)/workshop/page.tsx`, `register/page.tsx` | `getWhatsAppUrl()` | settings → `whatsappUrl(...)` prop |
| `src/components/sections/programs/ProgramCta.tsx` | `getWhatsAppUrlWithMessage`, `getContactEmail`, `getContactFallbackHref` | settings-bound functions |
| `src/components/sections/ProgramsPreview.tsx` | `getWhatsAppUrlWithMessage` | settings-bound |
| `src/components/sections/WhoItsFor.tsx` | `getWhatsAppUrlWithMessage`, `getContactFallbackHref` | settings-bound |
| `src/lib/leads/actions.ts` (form confirmations) | `getWhatsAppUrlWithMessage` | `await getSiteSettings()` once per submit |
| `src/lib/leads/notify.ts` | `LEAD_NOTIFICATION_TO` env | settings `notifyEmail` (R6) |

Course calls to action never link to WhatsApp (only the course form confirmation does), so the course pages change only through the layout. `src/lib/admin/whatsapp.ts` builds links to a *lead's* number and is unaffected (FR-018).

**Alternatives**: a runtime `/api/settings` that client code fetches. Rejected: it adds a route handler that the guard test would have to allow-list, costs an extra request on a slow phone, and goes against Principle XI.

## R2. Storage: a singleton document

**Decision**: A Mongoose model `SiteSettings` in collection `sitesettings`, whose `_id` is the fixed string `"site"`. Saving is `updateOne({ _id: "site" }, { $set, $unset }, { upsert: true, runValidators: true })`. The fixed `_id` makes a second document impossible (two concurrent saves upsert the same key, and the last one wins). That satisfies the spec's edge case with no extra index.

**Alternatives**: `findOne()` with no filter plus a unique `key` field (more moving parts); env plus a redeploy hook (the thing this feature replaces).

## R3. Caching and refresh

**Decision**: Use the same pattern as `src/lib/programs/data.ts`:
`unstable_cache(readStored, ["settings"], { tags: ["settings"], revalidate: 3600 })`. Saving calls `revalidateTag("settings", { expire: 0 })` and `revalidatePath("/admin/settings")`. That's the same call shape as `programs-actions.ts`, so stale content is never served.

The `(site)` layout renders `Footer` and `WhatsAppButton`, and both read settings. So every public page, whether ISR (`revalidate = 3600`) or static, carries the `settings` tag, and the save regenerates all of them on the next request. That meets SC-001.

**Alternatives**: `"use cache"` with `cacheTag`. Rejected because `cacheComponents` is not enabled and nothing else in the repo uses it. Mixing models is a bigger change.

## R4. Fallbacks and a failed read

**Decision**: Split it into two layers:
- `readStored()` (cached) returns the stored document or `null`, and throws on a database error. A throw is never cached.
- `getSiteSettings()` calls it and passes the result to a **pure** `mergeSettings(stored, fallback)`, which is unit-tested. On a database error, it logs the error name only and merges `null`, so the fallbacks are used.

Fallback sources (spec Assumptions):

| Effective field | Fallback |
|---|---|
| `whatsappNumber` | `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits) → `+<digits>` if it passes `normalisePhone` |
| `email` | `NEXT_PUBLIC_CONTACT_EMAIL` if valid |
| `notifyEmail` | `LEAD_NOTIFICATION_TO` if valid |
| `socials.youtube`, `socials.linkedin` | `mentor.socials` URLs (what the footer shows today) |
| `phone`, `address`, other socials | none (absent) |

An empty string or whitespace in a stored field counts as missing.

**Correction found during implementation** (verified in the running app): social links use their fallback only while **no settings document exists**. If the fallback applied per field, the owner could never remove the YouTube or LinkedIn icon, because clearing it would bring back the mentor link. That would contradict FR-013 and US2 scenario 2. A fresh database still looks the same (SC-004).

**Why not rethrow in production like `loadPublishedPrograms`**: FR-004 requires pages and submissions to keep working. A throw from the layout would fail *every* page and, on dynamic routes, show an error page. **Accepted risk**: a database blip during an ISR regeneration can bake the env fallback values into that page for up to an hour. Those values are the previous configuration, which is the same as today's behaviour.

## R5. Validation and normalisation

**Decision**: One pure module, `src/lib/admin/settings-schema.ts` (zod/mini, relative imports only, like `programs-schema.ts`), used by the form and the action.
- WhatsApp and phone use the existing `normalisePhone` from `src/lib/leads/phone.ts` (pure, already tested; +92 default, `0`, `92`, `0092` and `+cc` inputs). This avoids writing a second normaliser.
- Emails use the same `EMAIL_SHAPE` regex the code already uses, at max 254 characters.
- Social links: `new URL(v)`, `protocol === "https:"`, and the hostname must equal one of the platform's domains or be a subdomain of one:
  - youtube: `youtube.com`, `youtu.be`
  - linkedin: `linkedin.com`
  - instagram: `instagram.com`
  - tiktok: `tiktok.com`
  - x: `x.com`, `twitter.com`

  Maximum 500 characters.
- Address is at most 300 characters. Each field is trimmed, and empty means "not set".
- Required on save (FR-008): `whatsappNumber`, `email` and `notifyEmail` are required only when there is no fallback for them. The page passes `hasFallback` flags to the form, and the action works them out again on the server.

## R6. Notification recipient

**Finding**: `getResendEnv()` validates `LEAD_NOTIFICATION_TO` and is also called as a pre-check in `actions.ts:133` ("never accept a lead the site cannot notify the owner about").

**Decision**: Make `LEAD_NOTIFICATION_TO` optional in `envSchema`. The recipient becomes `(await getSiteSettings()).notifyEmail`, and that value already falls back to the env. The pre-check in `actions.ts` becomes "Resend key valid **and** a recipient exists". It keeps the same generic error when neither is set, so the existing rule is preserved. `notifyOwner` gets the recipient as an argument from `notifyAfterResponse`, so a settings read failure still falls back to the env (spec US3 scenario 3).

## R7. The unauthenticated-action test

**Finding**: It exists. `scripts/admin-guard-test.mts` (`npm run test:admin-guard`) imports every `src/lib/admin/*-actions.ts`, checks that each export is wrapped by `withAdmin`, and checks that it returns `unauthorized` with database tripwires.

**Decision**: Put the action in `src/lib/admin/settings-actions.ts` so the test discovers it automatically, and add `"saveSettings"` to `REQUIRED_ACTIONS`. Its tripwire list already covers `updateOne`. (This corrects the spec's assumption that no test file existed.)

## R8. Unsaved-changes warning

**Finding**: No admin form has one yet.

**Decision**: A small client hook, `useUnsavedChanges(dirty)`, in `src/components/admin/`:
- `beforeunload` covers reload, closing the tab and typed URLs.
- A capture-phase click listener on same-origin `<a>` elements calls `confirm()` and prevents navigation if the owner cancels. This covers sidebar and Next `Link` navigation.
- A `popstate` guard handles Back.

`dirty` means the current values differ from the last saved values (JSON compare). It is cleared after a successful save. No dependency is needed.

## R9. Footer social icons

**Decision**: Use Phosphor brand icons (`YoutubeLogo`, `LinkedinLogo`, `InstagramLogo`, `TiktokLogo`, `XLogo`) from `@phosphor-icons/react/dist/ssr`. That's the dependency and import path the public sections already use, so the Footer stays a Server Component.
- Icons render in a row as 44px tap targets, each with an `aria-label` like "Tareeq on YouTube (opens in a new tab)".
- Phone renders as a `tel:` link, and address as plain text.
- `FooterContactItem.kind` gains `"phone"` and `"address"`. Socials move to a separate `FooterSocial[]`.
- The current text rows for YouTube and LinkedIn are replaced by the icon row.
