---
id: 1
title: Admin image upload and site images spec
stage: spec
date: 2026-11-11
surface: agent
model: claude-sonnet-5-5
feature: 030-image-upload
branch: 030-image-upload
user: shezafatima
command: /sp.specify
labels: ["images","cloudinary","admin","settings"]
links:
  spec: specs/030-image-upload/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/030-image-upload/spec.md
 - specs/030-image-upload/checklists/requirements.md
tests:
 - none
---

## Prompt

/sp.specify Admin: image upload and editable site images (Cloudinary signed uploads; reusable ImageUploader; program/course covers; /admin/settings/images with named slots and /public fallbacks; getSiteImages cached with tag "site-images"; session checks on every signature and save; excluded: hero robot and eyes, preloader, logo/favicon, How it works videos; propose slot list for approval first; out of scope: video, library browser, cropping, gallery, blog, testimonials). Full text as given by the user in the triggering message.

## Response

Merged 029 to main first (user chose), created branch 030-image-upload, audited public static images, wrote spec with a proposed 3-slot list (founder photo, Why Tareeq robot, default share image) and flagged that Our Way has no images today.
