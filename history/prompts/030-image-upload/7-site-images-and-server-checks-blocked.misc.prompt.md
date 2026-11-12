---
id: 7
title: Site images and server checks blocked
stage: misc
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 030-image-upload
branch: main
user: shezafatima
command: (none) T028 and T031 verification
labels: ["images","cloudinary","verification","site-images","network"]
links:
  spec: specs/030-image-upload/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - scripts/site-images-check.mjs
 - history/prompts/030-image-upload/7-site-images-and-server-checks-blocked.misc.prompt.md
tests:
 - node scripts/site-images-check.mjs (blocked: sign-in unavailable, database and internet timing out)
---

## Prompt

move on

## Response snapshot

Wrote scripts/site-images-check.mjs for T028 (Settings link, empty slot default preview and chip, recommended size, alt required, upload and save to tareeq/site, home page picks it up, Use default clears it and deletes the file, broken stored URL falls back to /founder.jpeg, 360px layout and keyboard) and T031 (server refuses an oversized PNG, a PDF, a GIF, a wrong-folder id and a nonexistent id; record unchanged; bad assets deleted). Found that tareeq_dev already holds an owner-uploaded founder photo (tareeq/site/ve5gbazs...); the script sets the record aside, never replaces it through the app (which would delete the file), and restores it exactly in finally. Two runs failed at sign-in: the app reported "unavailable" because the database connection timed out (25 s to connect; Cloudinary 13 s; Google timed out). Both runs restored the site images record exactly and confirmed the owner's file still exists. Test server stopped.

## Outcome

- ✅ Impact: T028/T031 script ready; owner data protected and verified intact
- 🧪 Tests: not run to completion; blocked on network
- 📁 Files: scripts/site-images-check.mjs
- 🔁 Next prompts: rerun site-images-check when the connection is stable; then T035 and T036
- 🧠 Reflection: check shared singleton records for owner data before a test can trigger a replace-and-delete path
