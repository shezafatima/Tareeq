---
id: 4
title: Implement site settings
stage: green
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 028-site-settings
branch: 028-site-settings
user: shezafatima
command: /sp.implement
labels: ["admin", "settings", "whatsapp", "caching", "implementation"]
links:
  spec: specs/028-site-settings/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/lib/settings/merge.ts
 - src/lib/settings/model.ts
 - src/lib/settings/fallback.ts
 - src/lib/settings/data.ts
 - src/lib/admin/settings-schema.ts
 - src/lib/admin/settings-actions.ts
 - src/lib/admin/log.ts
 - src/components/admin/SettingsForm.tsx
 - src/components/admin/useUnsavedChanges.ts
 - src/components/admin/AdminNav.tsx
 - src/components/admin/ProgramForm.tsx
 - src/components/admin/ProgramPreview.tsx
 - src/app/admin/(panel)/settings/page.tsx
 - src/app/admin/(panel)/programs/new/page.tsx
 - src/app/admin/(panel)/programs/[id]/edit/page.tsx
 - src/lib/site.ts
 - src/content/types.ts
 - src/content/index.ts
 - src/content/data/footer.ts
 - src/components/layout/Footer.tsx
 - src/components/layout/WhatsAppButton.tsx
 - src/components/sections/ProgramsPreview.tsx
 - src/components/sections/WhoItsFor.tsx
 - src/components/sections/programs/ProgramCta.tsx
 - src/components/sections/programs/ProgramPanel.tsx
 - src/components/sections/programs/ProgramBrowser.tsx
 - src/components/sections/programs/BookingCard.tsx
 - src/components/sections/programs/MobileCtaBar.tsx
 - src/app/(site)/programs/page.tsx
 - src/app/(site)/programs/[slug]/page.tsx
 - src/app/(site)/workshop/page.tsx
 - src/app/(site)/register/page.tsx
 - src/lib/leads/actions.ts
 - src/lib/leads/notify.ts
 - scripts/admin-guard-test.mts
 - scripts/leads-check.mjs
 - .env.example
 - specs/028-site-settings/tasks.md
 - specs/028-site-settings/verification.md
 - specs/028-site-settings/research.md
 - specs/028-site-settings/data-model.md
 - specs/028-site-settings/spec.md
tests:
 - tests/unit/settings-merge.test.ts
 - tests/unit/site-links.test.ts
 - tests/unit/footer-contact.test.ts
 - tests/unit/settings-schema.test.ts
 - npm run test:admin-guard (saveSettings added to REQUIRED_ACTIONS)
---

## Prompt

/sp.implement

## Response snapshot

Implemented T001–T031 of 028-site-settings. Singleton settings document with a cached, never-throwing getSiteSettings() that merges saved values over the env/mentor fallbacks. The env-reading helpers in site.ts are replaced by pure whatsappUrl/contactFallbackHref, and every public contact site reads settings. The footer gains phone, address and Phosphor SSR social icons. Notifications go to the settings notifyEmail, and the no-recipient rejection is kept. The admin /admin/settings page has a four-section form, Test WhatsApp link, toast, unsaved-changes hook and sidebar entry. The saveSettings action is wrapped by withAdmin and is in the guard test.

Two issues found during verification and fixed:
- The build failed because ProgramCta is also rendered in the admin client preview. Contact details are now passed as props from Server Components through ProgramPanel, BookingCard, MobileCtaBar, ProgramBrowser and ProgramForm/ProgramPreview.
- Clearing LinkedIn didn't remove its icon. Social links now fall back only before the first save.

Results: lint, tsc and build clean; 198/198 unit tests; guard test PASS with 17 actions. In the running dev app, a save through the real action changed every wa.me link and footer field on every public page type. The test document was removed afterwards. The browser form check, in-app revalidation, notification delivery and the 360px visual and a11y checks (T032 partial, T033) need the owner's admin sign-in.

## Outcome

- ✅ Impact: Contact details are editable in admin and drive the whole public site with no redeploy
- 🧪 Tests: 198 unit pass (+22), guard test PASS (17 actions)
- 📁 Files: 4 new settings modules, 2 admin libs, 3 admin UI files, 1 page, 20 edited files, 4 new test files
- 🔁 Next prompts: owner browser check of /admin/settings (quickstart §4–§8), then commit, merge to main and delete the branch
- 🧠 Reflection: Checking the running app caught the social fallback bug that the unit tests (written to the original design) had encoded as correct.

## Evaluation notes (flywheel)

- Failure modes observed: an async Server Component was used inside a client tree (caught by the build); a fallback design contradicted a spec scenario (caught by the runtime check); the inline shell heredoc with nested quotes failed, so edits moved to script files.
- Graders run and results (PASS/FAIL): lint PASS, tsc PASS, build PASS, unit PASS, admin-guard PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): pass contact details as props from the start for any shared section component
