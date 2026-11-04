---
id: 5
title: Implement M1 foundations
stage: green
date: 2026-11-03
surface: agent
model: claude-opus-5-5
feature: 006-lead-capture
branch: 006-lead-capture
user: shezafatima
command: /sp.implement
labels: ["lead-capture", "implement", "foundations", "zod", "mongoose"]
links:
  spec: specs/006-lead-capture/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - package.json
 - package-lock.json
 - tsconfig.json
 - .env.example
 - .gitignore
 - src/lib/leads/phone.ts
 - src/lib/leads/options.ts
 - src/lib/leads/reference.ts
 - src/lib/leads/schema.ts
 - src/lib/leads/model.ts
 - src/lib/leads/log.ts
 - src/lib/env.ts
 - src/lib/db/mongoose.ts
 - src/lib/site.ts
 - src/content/types.ts
 - src/content/data/leads.ts
 - src/content/data/pages.ts
 - src/content/index.ts
 - src/components/ui/FieldFrame.tsx
 - src/components/ui/Field.tsx
 - src/components/ui/SelectField.tsx
 - src/components/ui/TextareaField.tsx
 - src/components/ui/ChoiceGroup.tsx
 - src/components/ui/CheckboxField.tsx
 - src/components/ui/Button.tsx
 - src/components/forms/ErrorSummary.tsx
 - src/components/forms/FormAlert.tsx
 - src/components/forms/Confirmation.tsx
 - src/components/forms/SubmitButton.tsx
 - tests/unit/phone.test.ts
 - tests/unit/options-reference.test.ts
 - tests/unit/schema.test.ts
 - specs/006-lead-capture/tasks.md
tests:
 - npm run test:unit (41 pass, 0 fail)
 - npm run lint (clean)
 - npm run build (clean)
 - scripts/whatsapp-check.mjs (82 PASS, 0 FAIL)
---

## Prompt

/sp.implement (no additional input)

## Response snapshot

Implemented milestone M1 (Phases 1–2, 25 of 26 tasks):
- Installed mongoose 9.11.4, zod 4.6.7 and resend 6.36.1 at exact versions.
- Added the test:unit script, allowImportingTsExtensions, the .env.example keys and a .gitignore entry for `.env`.
- Wrote the pure modules (phone normaliser, options/months, reference, shared zod/mini schemas) with 41 unit tests.
- Wrote the server-only env reader, the cached Mongoose connection, the Lead model with workshop/course discriminators, all indexes, the RateLimit TTL model, and logLead.
- Added content: lead copy, courseFormLabel, page meta, getters.
- Added the WhatsApp message helper (existing output unchanged).
- Added UI building blocks: FieldFrame (Field refactored onto it), SelectField, TextareaField, ChoiceGroup, CheckboxField, an additive `external` prop on Button, plus ErrorSummary, FormAlert, Confirmation and SubmitButton.

T016 (DB smoke test) is blocked: .env.local has no MONGODB_URI. Stopped at the M1 checkpoint per constitution VII.

## Outcome

- ✅ Impact: foundations in place; no visible change to existing pages.
- 🧪 Tests: unit 41/41, lint clean, build clean, WhatsApp check 82/82.
- 📁 Files: 22 new, 11 modified (see list).
- 🔁 Next prompts: owner adds credentials to .env.local → run T016 → continue /sp.implement with M2 (US1 + US2).
- 🧠 Reflection: `node --test` on Node 24 needs a glob rather than a directory; the tasks.md entry was updated to match.

## Evaluation notes (flywheel)

- Failure modes observed: `node --test tests/unit/` failed (directory not accepted); Playwright needed an explicit CHROME path to the bundled Chromium.
- Graders run and results (PASS/FAIL): unit PASS, lint PASS, build PASS, whatsapp-check PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
