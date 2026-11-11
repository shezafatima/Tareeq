---
id: 2
title: Site settings plan
stage: plan
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 028-site-settings
branch: 028-site-settings
user: shezafatima
command: /sp.plan
labels: ["admin", "settings", "caching", "whatsapp", "plan"]
links:
  spec: specs/028-site-settings/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/028-site-settings/plan.md
 - specs/028-site-settings/research.md
 - specs/028-site-settings/data-model.md
 - specs/028-site-settings/quickstart.md
 - specs/028-site-settings/contracts/data-access.md
 - specs/028-site-settings/contracts/server-actions.md
 - specs/028-site-settings/contracts/routes-and-ui.md
 - specs/028-site-settings/spec.md
tests:
 - none (plan stage)
---

## Prompt

/sp.plan

## Response snapshot

Planned 028 site settings: singleton MongoDB doc (_id "site", upsert), server-only getSiteSettings() via unstable_cache tag "settings" that never throws and merges stored values over env/mentor fallbacks (pure mergeSettings, unit-tested). Found that no client component reads the env today; the issue is NEXT_PUBLIC_* build-time inlining in server helpers, so src/lib/site.ts env readers become pure whatsappUrl/contactFallbackHref and all 9 call sites read settings. Notification recipient moves to settings with LEAD_NOTIFICATION_TO optional but the "no recipient → reject lead" pre-check kept. saveSettings in src/lib/admin/settings-actions.ts (withAdmin) is auto-discovered by scripts/admin-guard-test.mts; add to REQUIRED_ACTIONS. Form prefilled with effective values; custom useUnsavedChanges hook (beforeunload + link capture + popstate). Footer gains phone, address and Phosphor SSR social icons. Constitution check passes I–XI. Corrected the spec assumption about the guard test.

## Outcome

- ✅ Impact: Plan and design artifacts ready for /sp.tasks
- 🧪 Tests: planned unit tests (schema, merge, footer, links) + guard test extension
- 📁 Files: plan, research, data-model, quickstart, 3 contracts; spec assumption fixed
- 🔁 Next prompts: /sp.tasks
- 🧠 Reflection: Reading call sites showed the "client reads env" premise was false; the real fix is build-time inlining.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Constitution Check PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
