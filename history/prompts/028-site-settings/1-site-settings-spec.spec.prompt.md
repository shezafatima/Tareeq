---
id: 1
title: Site settings spec
stage: spec
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 028-site-settings
branch: 028-site-settings
user: shezafatima
command: /sp.specify
labels: ["admin", "settings", "whatsapp", "contact", "spec"]
links:
  spec: specs/028-site-settings/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/028-site-settings/spec.md
 - specs/028-site-settings/checklists/requirements.md
 - history/prompts/028-site-settings/1-site-settings-spec.spec.prompt.md
tests:
 - none (spec stage)
---

## Prompt

/sp.specify Admin: site settings (contact info and WhatsApp)

Purpose: the owner edits contact details in the admin, and the whole site updates without a redeploy.

Data: a singleton SiteSettings document with: whatsappNumber (E.164), email, phone (optional), address (optional), socialLinks ({youtube, linkedin, instagram, tiktok, x}, all optional), notifyEmail (recipient of owner notification emails), timestamps.
- Server-only getSiteSettings(), cached with tag "settings". Saving revalidates the tag.
- Fallbacks: if no document exists or a field is empty, use the existing env values (NEXT_PUBLIC_WHATSAPP_NUMBER, NOTIFY_EMAIL). The site must work on a fresh database.

Admin (/admin/settings, added to the sidebar):
- One form in sections: WhatsApp and phone; email and address; social links; notifications.
- Shared zod validation: WhatsApp and phone normalised to E.164 (+92 default), valid email addresses, social links must be https URLs on the matching domain.
- A "Test WhatsApp link" button opens wa.me with the entered number.
- Save with a toast. Unsaved-changes warning when leaving the page.
- Server-side session check on the action; extend the unauthenticated-action test.

Public site reads settings everywhere contact details appear:
- Footer (WhatsApp, email, phone, address, social icons; a social icon renders only if its link is set).
- Floating WhatsApp button and every wa.me link (form confirmations, program and course CTAs, "Ask on WhatsApp").
- Owner notification emails go to notifyEmail.
- Client components receive the values as props from a Server Component. No client component reads the WhatsApp number from env any more. Search the codebase and replace every direct use.
- If there is no WhatsApp number at all, keep the existing fallbacks (button hidden, email link shown).

Constraints: existing admin UI patterns, no new dependencies, mobile at 360px.

Out of scope: hero or page copy editing, mentor section content, SEO settings, logo upload.

## Response snapshot

Created branch 028-site-settings and spec with 3 user stories (P1 admin edit, P1 public site reads settings, P2 notification recipient), 20 FRs, 6 success criteria, edge cases and assumptions. Mapped env names to the real code: NOTIFY_EMAIL -> LEAD_NOTIFICATION_TO, public email fallback NEXT_PUBLIC_CONTACT_EMAIL; YouTube/LinkedIn fall back to mentor socials so a fresh database looks unchanged. Noted that no unauthenticated-action test file exists in tests/ (prior features tracked it in tasks). Quality checklist passes; no clarification markers.

## Outcome

- ✅ Impact: Spec ready for /sp.plan (or /sp.clarify)
- 🧪 Tests: none at spec stage
- 📁 Files: spec.md, checklists/requirements.md, this PHR
- 🔁 Next prompts: /sp.clarify or /sp.plan
- 🧠 Reflection: Checking the code first caught env-name mismatches and the mentor-socials footer source before they became wrong requirements.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 printed a parameter-binding error from the wrapper, but the branch and spec dir were created.
- Graders run and results (PASS/FAIL): spec quality checklist PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
