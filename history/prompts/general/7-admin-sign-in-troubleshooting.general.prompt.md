---
id: 7
title: Admin sign-in troubleshooting
stage: general
date: 2026-11-10
surface: agent
model: claude-fable-5-2
feature: none
branch: main
user: shezafatima
command: manual
labels: ["admin","sign-in","env","debugging"]
links:
  spec: specs/022-admin-panel/contracts/env.md
  ticket: null
  adr: null
  pr: null
files:
 - scripts/check-admin-login.mjs
 - scripts/hash-password.mjs
 - src/app/admin/login/actions.ts
 - .env.example
 - specs/022-admin-panel/quickstart.md
 - specs/022-admin-panel/contracts/env.md
 - .env.local (ADMIN_PASSWORD_HASH line only; not tracked)
tests:
 - manual: hash loads through @next/env as a valid bcrypt hash and matches the password
---

## Prompt

A series of short messages while setting up admin sign-in: the pasted "Missing or invalid server settings: ADMIN_PASSWORD_HASH" error (twice more), "still", "what to add in login the hashed one or original", "my password and credentials are correct but still ettin inavleid credentials", "there are two one without backslash one with backslash whcih one do i copy", "still not working", "done".

## Response snapshot

Found `.env.local` still held the single-quoted hash, which Next.js expands to a broken value; with consent, rewrote only that line with a backslash before each `$`. Explained that the plain password is typed at sign-in and the backslashed line goes in `.env.local`. When sign-in still failed, confirmed the settings loaded correctly, the server had restarted, and 4 failed attempts were recorded, so the typed credentials did not match. Added `scripts/check-admin-login.mjs` (yes/no checker). With consent, set a temporary password, verified it, and cleared the local failed-attempt records in the dev database. Sign-in with the owner's own password still failed (dev log pasted). Root cause: the owner's edits were going into `.env.example`, which the app never reads, while `.env.local` held the temporary password. With consent, moved the hash from `.env.example` into `.env.local`, restored `.env.example` to placeholders (the values were never committed) and cleared the lock. User reported done. A later password change was pasted without backslashes and crashed sign-in with a ConfigError; fixed the line, made signInAction answer "Sign-in is unavailable" for a ConfigError instead of a 500, and added `npm run hash-password -- --save`, which writes the escaped line into `.env.local` (tested in throwaway folders). The owner chose not to restore the WhatsApp sample line they removed from `.env.example`.

## Outcome

- ✅ Impact: owner can sign in to the admin panel locally.
- 🧪 Tests: shape checks and bcrypt comparison only; no app code changed.
- 📁 Files: scripts/check-admin-login.mjs (new, uncommitted at time of writing).
- 🔁 Next prompts: replace the temporary password; commit or remove the checker; push main.
- 🧠 Reflection: inline `node -e` through the shell stripped backslashes; script files avoided it.

## Evaluation notes (flywheel)

- Failure modes observed: a shell one-liner removed the quotes but lost the backslashes on the first attempt.
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
