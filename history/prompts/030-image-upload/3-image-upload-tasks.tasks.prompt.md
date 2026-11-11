---
id: 3
title: Image upload tasks breakdown
stage: tasks
date: 2026-11-11
surface: agent
model: claude-sonnet-5-5
feature: 030-image-upload
branch: 030-image-upload
user: shezafatima
command: /sp.tasks
labels: ["images","cloudinary","tasks"]
links:
  spec: specs/030-image-upload/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/030-image-upload/tasks.md
tests:
 - none
---

## Prompt

/sp.tasks (no extra input)

## Response

Generated 36 dependency-ordered tasks in six phases: setup, foundational (shared image module, Cloudinary server module, signUpload, SafeImage, ImageUploader), US1 covers, US2 site images, US3 guard-test and server verification, polish and merge.
