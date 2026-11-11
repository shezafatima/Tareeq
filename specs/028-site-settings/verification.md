# Verification: 028 Site Settings

## Baseline (T001, 2026-11-11, branch 028-site-settings at 954c4e9)

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npm run test:unit` | 176 pass, 0 fail |
| `npm run build` | success |
| `npm run test:admin-guard -- --no-http` | PASS, 4 action files, 16 actions, D 12/12 |

Footer reference (SC-004), from local `.env.local`:
- `NEXT_PUBLIC_WHATSAPP_NUMBER` is set, so the footer shows a WhatsApp row and the floating button.
- `NEXT_PUBLIC_CONTACT_EMAIL` is not set, so there is no email row.
- YouTube (`@devwithsheza`) and LinkedIn come from the mentor socials.
- `LEAD_NOTIFICATION_TO` is set.

## After implementation (T031, 2026-11-11)

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npx tsc --noEmit` | clean |
| `npm run test:unit` | 198 pass, 0 fail (+22: settings-merge 6, site-links 4, footer-contact 3, settings-schema 9) |
| `npm run build` | success; `/admin/settings` is dynamic (ƒ) |
| `npm run test:admin-guard` | PASS: 5 files, 17 actions (`saveSettings` required and refused with no session), B 1/1, C ok, D 12/12 |
| grep for env reads (quickstart §2) | only `src/lib/settings/fallback.ts` (plus the optional schema key and comments in `src/lib/leads/notify.ts` / `actions.ts`) |

## Running app (T032, partial): dev server on :3000, database `tareeq_dev`

| Quickstart | Result |
|---|---|
| §3 Fresh database | PASS. No settings document. All `wa.me` links use the env number, the floating button is present, the footer shows WhatsApp plus YouTube and LinkedIn icons (now icons instead of text rows, as intended per R9). No email row, because `NEXT_PUBLIC_CONTACT_EMAIL` is not set locally (same as the baseline). |
| §4 Save (through the real `saveSettings`, signed-in session stubbed) | PASS for the write. Stored `+923217654321`, `+924235761234`, email, address, YouTube and Instagram. Empty fields were not stored. An invalid YouTube link (instagram.com) returned `invalid` with the field message. `revalidateTag` cannot run outside Next, so that call returned `unavailable` after the write, as the guard test's part D documents. |
| §5 Public site follows | PASS (requests sent with `Cache-Control: no-cache` to skip the dev data cache). `/`, `/programs`, the 4 program pages (including the 2 "Ask on WhatsApp" ones), `/workshop`, `/register`, `/courses` and `/our-way` all used the new number on every `wa.me` link. The footer showed the `tel:` phone, address, `mailto:` email and an Instagram icon. |
| Bug found and fixed | A cleared LinkedIn link still showed, because the mentor fallback was applied per field. Social links now fall back only before the first save (research R4 correction), with a test added. Rechecked: the icon disappeared. |
| `/admin/settings` signed out | 307 → `/admin/login` |
| Cleanup | The test settings document was deleted, and the site returned to the env fallback. |

**Not verified yet (needs the owner's admin sign-in):**
- The settings form in a browser (sections, Test WhatsApp link, toast, unsaved-changes warning).
- That a save from the browser refreshes the public pages with no hard reload (the in-app `revalidateTag`).
- §6 with no number at all (needs the env value unset and a restart).
- §7 notification email delivery.
- Visual checks at 360/390/1440px, and the accessibility pass (T033).

## Deferred at merge (2026-11-11)

The owner chose to merge 028 before starting 029. T032 (browser walkthrough of the settings form while signed in, at 360/390/1440px) and T033 (accessibility pass) are still open. They are listed above under "Not verified yet".
