---
id: 6
title: Fix admin hash env escaping
stage: general
date: 2026-11-10
surface: agent
model: claude-sonnet-5-5
feature: none
branch: 023-fix-hash-env-escaping
user: shezafatima
command: manual
labels: ["admin","env","bcrypt","next-env"]
links:
  spec: specs/022-admin-panel/contracts/env.md
  ticket: null
  adr: null
  pr: null
files:
 - scripts/hash-password.mjs
 - .env.example
 - specs/022-admin-panel/quickstart.md
 - specs/022-admin-panel/contracts/env.md
 - specs/022-admin-panel/research.md
tests:
 - manual: printed .env line loaded through @next/env verifies the password
---

## Prompt

User pasted "Runtime ConfigError: Missing or invalid server settings: ADMIN_PASSWORD_HASH" after asking where the ADMIN_* values come from.

## Response snapshot

Found that Next.js expands `$` in .env files even inside single quotes (tested with @next/env: quoted values came out empty, backslash-escaped ones exact). My earlier "wrap in single quotes" advice was wrong. hash-password now prints the escaped .env line plus a note for host dashboards; docs corrected.

## Outcome

- ✅ Impact: the hash now loads from .env.local.
- 🧪 Tests: verified the printed line round-trips through @next/env and bcrypt.compare.
- 📁 Files: see list.
- 🔁 Next prompts: push main if wanted.
- 🧠 Reflection: verify env-loading behaviour instead of assuming quoting rules.

## Evaluation notes (flywheel)

- Failure modes observed: gave unverified quoting advice for .env values.
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
