# Implementation Plan: Admin Site Settings (Contact Info and WhatsApp)

**Branch**: `028-site-settings` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/028-site-settings/spec.md`

## Summary

The owner edits WhatsApp, email, phone, address, social links and the notification recipient on a new `/admin/settings` page. The values are stored in one MongoDB document and read through a server-only, tag-cached `getSiteSettings()` that falls back to today's env values.

Every public place that shows contact details reads it: the footer, the floating button, program calls to action, "Who it's for", the programs preview, form confirmations and owner emails. Saving revalidates the `settings` tag, and because the `(site)` layout reads settings, every public page regenerates on its next request with no redeploy.

The key finding (research R1): no client component reads the env today. The env readers are server helpers whose `NEXT_PUBLIC_*` values are inlined at build. So the change replaces those helpers with pure ones that take the values as arguments.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router)
**Primary Dependencies**: mongoose 9, zod 4 (`zod/mini`), next-auth 5 beta, resend, `@phosphor-icons/react` (all existing; no new dependencies)
**Storage**: MongoDB Atlas. New singleton collection `sitesettings` (`_id: "site"`).
**Testing**: `node --test` unit tests (`tests/unit`), `npm run test:admin-guard` (`scripts/admin-guard-test.mts`), and manual browser checks per `quickstart.md`
**Target Platform**: Vercel-style Node runtime; ISR public pages (`revalidate = 3600`)
**Project Type**: Single Next.js web app (`src/`)
**Performance Goals**: No extra request for visitors. Settings come from the data cache and are baked into the ISR HTML, and Lighthouse targets are unchanged.
**Constraints**: 360px mobile first; Server Components by default; no new dependencies; no personal data in logs
**Scale/Scope**: 1 document, 1 admin page, 1 action, about 12 files edited

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: still passes.*

| Principle | Status | How |
|---|---|---|
| I. Mobile first | ✅ | Single-column form and footer icon row checked at 360px; 44px icon targets |
| II. Reusable components | ✅ | Reuses `Field`, `TextareaField`, `Toast`, `useActionFeedback`, `UnavailableNotice`; new `useUnsavedChanges` hook is generic |
| III. Brand system | ✅ | Existing tokens and classes only; icons inherit `text-white/80` |
| IV. Accessible | ✅ | `fieldset`/`legend` sections, labelled inputs, focus moves to the first error, `aria-label` on icon links, sr-only "(opens in a new tab)" |
| V. Protect data | ✅ | `withAdmin` on the action and `requireAdmin` on the page; server re-validation; logs carry error names only; guard test extended |
| VI. Fast | ✅ | No client fetch; cached read; icons are SSR SVG |
| VII. Small steps | ✅ | Milestones below, each ending with build, lint, tests and a browser check |
| VIII. Don't touch the hero | ✅ | Hero untouched. The `(site)` layout's children don't change; only Footer and WhatsAppButton internals do |
| IX. No surprise dependencies | ✅ | None added |
| X. Safest option | ✅ | Fallback to env on any read failure; env names corrected to the real ones (spec Assumptions) |
| XI. Server Components | ✅ | Footer, WhatsAppButton and CTAs stay server; only `SettingsForm` is client (form state, toast, leave warning) |

## Project Structure

### Documentation (this feature)

```text
specs/028-site-settings/
├── spec.md
├── plan.md               # this file
├── research.md           # R1–R9
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── data-access.md
│   ├── server-actions.md
│   └── routes-and-ui.md
├── checklists/requirements.md
└── tasks.md              # /sp.tasks
```

### Source Code

```text
src/lib/settings/            NEW
├── model.ts                 SiteSettingsModel (server-only)
├── merge.ts                 pure: types, SOCIAL_KINDS, mergeSettings
├── fallback.ts              server-only: env + mentor socials → fallback
└── data.ts                  getSiteSettings (cached, never throws), readStoredSettings
src/lib/admin/
├── settings-schema.ts       NEW pure shared zod rules (reuses leads/phone normalisePhone)
└── settings-actions.ts      NEW saveSettings (withAdmin)
src/lib/site.ts              env readers → pure whatsappUrl / contactFallbackHref
src/lib/leads/notify.ts      recipient from settings; LEAD_NOTIFICATION_TO optional
src/lib/leads/actions.ts     confirmations + pre-check use getSiteSettings
src/content/data/footer.ts   pure readFooterContact(settings) → items + socials
src/content/index.ts, types.ts   footer types (phone, address, FooterSocial)
src/components/layout/Footer.tsx, WhatsAppButton.tsx
src/components/sections/WhoItsFor.tsx, ProgramsPreview.tsx, programs/ProgramCta.tsx
src/app/(site)/workshop/page.tsx, register/page.tsx
src/app/admin/(panel)/settings/page.tsx   NEW
src/components/admin/SettingsForm.tsx     NEW
src/components/admin/useUnsavedChanges.ts NEW
src/components/admin/AdminNav.tsx         + Settings entry
scripts/admin-guard-test.mts              + "saveSettings"
tests/unit/settings-schema.test.ts, settings-merge.test.ts, footer-contact.test.ts, site-links.test.ts   NEW
.env.example                              note that these are now fallbacks
```

**Structure Decision**: Single Next.js app. The new data module sits beside `programs/` and `courses/`, and the admin pieces follow the `*-schema.ts` / `*-actions.ts` convention, so the guard test picks them up automatically.

## Milestones

1. **Data layer**: model, merge, fallback, `getSiteSettings`, unit tests. Nothing visible changes yet.
2. **Public site switch-over**: pure link helpers, footer (phone, address, icons), button, CTAs, forms, notifications. On a fresh database the site must look identical (SC-004).
3. **Admin page**: schema, action, guard test, form, leave warning, sidebar.
4. **Verify**: run through `quickstart.md` at 360/390/1440px.

## Key Decisions (see research.md)

- Singleton with fixed `_id` + upsert (R2).
- `unstable_cache` + `revalidateTag("settings", { expire: 0 })`, matching programs/courses (R3).
- Never throw on read; fall back to env (R4). This deliberately differs from the programs "rethrow in production" policy.
- Reuse `normalisePhone` for E.164 (R5).
- Notification recipient from settings, with the "no recipient → reject lead" rule kept (R6).

## Risks

- **A database blip during regeneration bakes env fallbacks into a page for up to an hour** (R4). It's accepted because the fallback is the previous configuration.
- **Making `LEAD_NOTIFICATION_TO` optional could hide a misconfiguration.** It's mitigated by the pre-check, which still rejects a lead when no recipient resolves.
- **The leave warning on Next `Link` clicks relies on a capture-phase listener** because the App Router has no route-change blocking API. Back/forward is covered by `popstate`, so test it manually.

## Complexity Tracking

No violations.
