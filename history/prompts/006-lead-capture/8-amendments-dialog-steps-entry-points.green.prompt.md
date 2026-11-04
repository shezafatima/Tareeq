---
id: 8
title: Amendments dialog steps entry points
stage: green
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 006-lead-capture
branch: 006-lead-capture
user: shezafatima
command: /sp.implement (amendments A1-A13, UI feedback, M4)
labels: ["lead-capture", "amendment", "dialog", "two-step-form", "accessibility", "entry-points"]
links:
  spec: specs/006-lead-capture/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/006-lead-capture/spec.md
 - specs/006-lead-capture/plan.md
 - specs/006-lead-capture/data-model.md
 - specs/006-lead-capture/contracts/server-actions.md
 - specs/006-lead-capture/tasks.md
 - src/app/(site)/workshop/page.tsx
 - src/components/forms/BookingDialog.tsx
 - src/components/forms/WorkshopForm.tsx
 - src/components/forms/useLeadForm.ts
 - src/components/forms/ErrorSummary.tsx
 - src/components/forms/FormAlert.tsx
 - src/components/forms/SubmitButton.tsx
 - src/hooks/useFocusTrap.ts
 - src/lib/leads/config.ts
 - src/lib/leads/schema.ts
 - src/lib/leads/options.ts
 - src/lib/leads/model.ts
 - src/lib/leads/notify.ts
 - src/lib/leads/actions.ts
 - src/components/ui/FieldFrame.tsx
 - src/components/ui/ChoiceGroup.tsx
 - src/components/ui/SelectField.tsx
 - src/components/ui/TextareaField.tsx
 - src/components/ui/CheckboxField.tsx
 - src/components/ui/Button.tsx
 - src/components/Hero.tsx
 - src/components/layout/Footer.tsx
 - src/components/sections/PlaceholderPage.tsx
 - src/app/(site)/courses/page.tsx
 - src/app/(site)/contact/page.tsx
 - src/lib/site.ts
 - src/app/globals.css
 - scripts/leads-check.mjs
 - scripts/leads-cta-snap.mjs
tests:
 - npm run test:unit (45/45), lint, build (clean)
 - leads-check dialog, steps, fit, narrow, errors, no-JS, register, entry (253/253)
 - leads-check email-sending runs: workshop happy, keyboard, no-email, register happy (46/46); 6 records stored, sent and delivered
 - leads-cta-snap before/after: every CTA image identical, every link /workshop?book=1
---

## Prompt

Owner amendments pasted mid-session:
1. No /book-a-workshop route; Form A opens as a modal on /workshop; every CTA links to /workshop?book=1; closing removes the query param.
2. Accessible modal: focus trap, Esc, focus returns to trigger, scroll lock, usable at 360px.
3. City fixed to "Karachi" (read-only text, from a config constant, stored).
4. Roles: School, Teacher only.
5. Scope: only the modal form, its API/email/WhatsApp flow, and a minimal /workshop page.
6. Modal is a small client leaf; the page stays a Server Component.
7. Email optional on Form A (required: role, name, phone, organization, participants, consent).
8. Centred dialog on desktop, full-screen sheet below 640px.
9. Form A in two steps (1: role, name, phone, email; 2: organization, participants, month, message, consent); step 1 validated before Next; state kept going back.
10. Each step fits 1280x720 and 360x640 without scrolling, compact spacing, 12-13px labels.
11. Two fields per row from 640px; one per row below, except participants + month; inputs never below 16px.
12. Sticky bottom button; max-height 100svh; internal scroll only as a fallback.
13. Message is a 2-row textarea, not growing beyond 4 rows.
Then UI feedback: corners were only rounded at the top; red text too big and cluttered. Then: no inner scroll area (scroll the form/dialog as a whole), and move fields that don't fit side by side onto the next line without hurting mobile or desktop. Then "continue".

## Response snapshot

Updated the spec, plan, data model, contract and tasks (A1-A13, T067-T075). Implemented the amendments: BookingDialog (URL-driven, focus trap with a fallback target, Esc, scroll lock, close link that works without JS, children stay mounted), minimal /workshop page, fixed city, two roles, optional email, two-step WorkshopForm (both steps always in the DOM, Enter acts as Next, Back keeps values, both steps show without JS via a .step-off class that only applies with JS), compact layout with CSS-variable label size/gap, auto-fit field pairs, 2-to-4-row message box, sticky footer, single scroll. After feedback: dialog panel/footer rounded all round, inline errors 12px, error list screen-reader-only with focus on the first invalid field, compact alert.

Bugs found and fixed while verifying: clicking the dimmed area did not close the dialog; the base-layer [hidden] rule defeated the no-JS override (so a .step-off class replaced the hidden attribute); the focus trap counted hidden controls so Tab escaped (now visible controls only).

M4: joinHref and the hero "Explore programs" href (one-line diff) now /workshop?book=1; footer, Courses page and Contact page link to /register ("Join the waitlist" constant); header and mobile menu do not.

## Outcome

- ✅ Impact: workshop dialog form, course waitlist and all entry points work; M4 checkpoint reached.
- 🧪 Tests: all automated checks pass (see list); 11+ test emails sent to the owner address in total.
- 📁 Files: see list.
- 🔁 Next prompts: owner reviews screenshots and DRAFT copy, then M5 (honeypot, rate limit) and polish; restart the dev server on port 3000 (it is serving a stale build of the old form).
- 🧠 Reflection: a layered `!important` rule beats an unlayered one, so a class that only applies under JS is safer than overriding the hidden attribute.

## Evaluation notes (flywheel)

- Failure modes observed: a stale dev server rendered old markup (hydration mismatch); inline shell heredocs with Python failed once and were replaced by script files; the mobile-menu button capture is nondeterministic (blurred panel over an animation).
- Graders run and results (PASS/FAIL): all PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
