---
id: 6
title: Verify T020 cover image uploads
stage: misc
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 030-image-upload
branch: main
user: shezafatima
command: (none) T020 verification
labels: ["images","cloudinary","verification","playwright","accessibility"]
links:
  spec: specs/030-image-upload/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - scripts/image-upload-check.mjs
 - specs/030-image-upload/verification.md
 - specs/030-image-upload/tasks.md
 - history/prompts/030-image-upload/6-verify-t020-cover-image-uploads.misc.prompt.md
tests:
 - node scripts/image-upload-check.mjs (46 passed, 0 failed, against next start on port 3100)
---

## Prompt

what to choose in roles in cloudinary

added the keys to .env.local, start T020

ok do

continue

## Response snapshot

Cloudinary role: Master Admin for the product environment key on a non-Enterprise plan (the app needs upload, Admin API read, and destroy; Viewer, Reports and Media Library User lack these). Enterprise can use a custom role.

T020: pinged Cloudinary (ok), built the app, ran `next start` on port 3100 with a throwaway admin password (the owner's dev server on 3000 untouched). Wrote scripts/image-upload-check.mjs covering legacy URL record, wrong type, oversize, Cloudinary unreachable, missing alt text, upload, replace (old asset deleted), remove (asset deleted, brand pattern), public card/detail/og:image, next/image with f_auto,q_auto, 360px keyboard-only with reduced motion, and no horizontal scroll. Final run: 46 passed, 0 failed; temporary records and test assets cleaned up.

Issues found were in the harness, not the app: x-forwarded-for header broke Cloudinary CORS preflight; keypress before hydration; reduced-motion duration is 0.01ms not 0; Next.js expands `$` in ADMIN_PASSWORD_HASH from the process environment. One run was interrupted by a network outage; leftovers were cleaned. Flagged that the three CLOUDINARY_* placeholder lines were removed from .env.example (not by the agent).

## Outcome

- ✅ Impact: T020 verified and recorded in verification.md; tasks.md T020 checked
- 🧪 Tests: 46/46 browser checks pass with real Cloudinary uploads
- 📁 Files: new check script, verification.md, tasks.md
- 🔁 Next prompts: T028 (site image slot), T031 (server rejection of bad publicId), T035 (full quickstart + Lighthouse), then T036 commit/merge
- 🧠 Reflection: scope test-only headers to the app origin; wait for hydration before keyboard input
