# Contract: Routes and UI (028)

## Admin

**`/admin/settings`**: `src/app/admin/(panel)/settings/page.tsx`, a Server Component.
- Calls `await requireAdmin()`, then `safeLoad(readStoredSettings)`. On failure it shows the existing `UnavailableNotice`.
- Passes `initial` (the effective values as `SettingsFormValues`) and `hasFallback` flags to `SettingsForm`.
- Metadata: `{ title: "Settings" }`.

**Sidebar**: `AdminNav.tsx` gets `{ kind:"link", href:"/admin/settings", label:"Settings", Icon: GearSix, isActive: under("/admin/settings") }` as the last entry. The mobile menu uses the same list.

**`SettingsForm`**: `src/components/admin/SettingsForm.tsx`, `"use client"` because it needs form state, the toast and the leave warning.
- Four `<fieldset>` sections with `<legend>`: "WhatsApp and phone", "Email and address", "Social links", "Notifications". Uses the existing `Field` and `TextareaField` (for the address).
- **"Test WhatsApp link"** is a secondary button next to the WhatsApp field.
  - It opens `whatsappUrl(normalisePhone(value).e164)` with `window.open(url, "_blank", "noopener")`.
  - It is disabled with `aria-disabled` and shows the field message when the value doesn't normalise.
- **Save** is a primary button, disabled while pending.
  - Success → `toast.success("Settings saved. The site now shows the new details.")`, then the values are replaced with the normalised ones and the form is clean again.
  - Failure → `useActionFeedback()`, the field errors appear and focus moves to the first bad field.
- **`useUnsavedChanges(dirty)`** is a new hook in `src/components/admin/useUnsavedChanges.ts` (research R8).
- **At 360px**: single column, full-width inputs, buttons stacked, no horizontal scroll.

## Public site (no new routes)

| Component | Change |
|---|---|
| `Footer` (server) | `getSiteSettings()` → `readFooterContact`. Renders the contact rows (adds a phone `tel:` link and the address as text) and a social icon row (44px targets, `aria-label`, new tab). The contact block is hidden when there are no items and no socials. |
| `WhatsAppButton` (server) | `whatsappUrl(s.whatsappNumber)`; null → renders nothing (unchanged behaviour) |
| `workshop/page.tsx`, `register/page.tsx` | `whatsappHref={whatsappUrl(s.whatsappNumber)}` |
| `ProgramCta`, `ProgramsPreview`, `WhoItsFor` (server) | `const s = await getSiteSettings()`; pass `(m) => whatsappUrl(s.whatsappNumber, m)` and `contactFallbackHref(s.email)` |
| `leads/actions.ts` | `whatsappFor`/`courseResponse` use one `getSiteSettings()` per submit |

Client components (`WorkshopForm`, `CourseForm`, `Confirmation`, `FormAlert`) are unchanged: they already take `whatsappHref` props.
