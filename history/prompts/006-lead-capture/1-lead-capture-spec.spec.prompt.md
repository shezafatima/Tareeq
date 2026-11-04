---
id: 1
title: Lead capture spec
stage: spec
date: 2026-11-03
surface: agent
model: claude-opus-5-5
feature: 006-lead-capture
branch: 006-lead-capture
user: shezafatima
command: /sp.specify
labels: ["lead-capture", "forms", "spec", "privacy", "accessibility"]
links:
  spec: specs/006-lead-capture/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/006-lead-capture/spec.md
 - specs/006-lead-capture/checklists/requirements.md
tests:
 - none (spec stage)
---

## Prompt

Feature: lead capture.

Two forms that turn visitors into leads, stored in the database and sent to the owner immediately. The pilot workshop depends on this, so it must work reliably on a mid-range phone.

## Form A: Book a Workshop (at /book-a-workshop)
Fields: role (school / teacher / student group), full name, phone, email, organization name, city, approximate number of participants, preferred month (optional), message (optional), consent checkbox (required).

## Form B: Online course registration (at /register)
Fields: full name, phone, email, interested course, current level (beginner / some experience), age group (under 18 / 18 or over), message (optional), consent checkbox (required).

The course options come from a hardcoded list in one file for now, read through a single function such as getCourseOptions(), plus a "not sure yet" option. Feature 005 will replace the source with published courses from the database, so nothing outside that function may depend on where the list comes from.

If age group is "under 18", show a note: "Please have a parent or guardian submit this form."

The button label and page heading for this form will be supplied separately. Use a clearly marked placeholder and flag it to me rather than inventing wording.

## Both forms
- Validation runs on the server and is mirrored on the client. The server is the source of truth.
- Phone numbers are normalised to international format, defaulting to Pakistan (+92). Invalid numbers are rejected with a clear message.
- Spam protection: a honeypot field and a rate limit of 5 submissions per IP per hour.
- On success: the submission is saved, the owner receives an email notification, and the visitor sees a confirmation with a "Message us on WhatsApp" button carrying a prefilled message. The confirmation must state what actually happens next and roughly when, not a vague "we'll be in touch", and its wording must match what the button promised.
- On failure: a clear error that does not lose what the visitor typed, and never exposes internal details.
- Submissions are stored with: type, all form fields, a status (new / contacted / booked / closed), an admin notes field, and timestamps. Status and notes are unused until the admin feature exists.
- Collect nothing beyond the listed fields. A short privacy note sits beside the consent checkbox.

## Entry points
- Every existing "Join a workshop" and "Explore programs" call to action, in the hero, header, Programs page and the home page's final section, links to /book-a-workshop. Do not restyle any of them; only point them at the real route.
- The online course form is secondary: link to /register from the footer and from any course-related area, not from the header, so it does not compete with the workshop button.
- The Contact page links to both forms.

## Requirements
Mobile-first from 360px. Labels tied to inputs, errors announced to screen readers, keyboard navigable, visible focus states. Reuse the existing Field, Button and Card components rather than writing new markup. Server Components by default, with client boundaries only where the form interaction requires them. No personal data in logs, URLs or error messages.

## Verify
- Submit both forms successfully and confirm each record appears in the database and the notification email arrives.
- Test every rejection path: missing consent, invalid phone, invalid email, honeypot filled, rate limit exceeded.
- Confirm a failed submission preserves what was typed.
- Screenshots at 1440x900 and 390x844 of each form, its error state and its confirmation.
- Build and lint clean, no console errors.

## Response snapshot

Created branch 006-lead-capture and specs/006-lead-capture/spec.md with 5 prioritised user stories (workshop request P1, error recovery P1, course registration P2, entry points P2, spam protection P3), 33 functional requirements, 8 success criteria, edge cases, scope, dependencies and assumptions. Flagged: no data store or email service exists yet (Principle IX, decide at plan); "Feature 005" is already taken, so it was read as "the later courses feature"; hero CTA href change needs a hero impact line (Principle VIII); Form B heading and button left as marked placeholders. Two clarifications raised: Q1 workshop next step and timing, Q2 whether the course form is a registration or an expression of interest.

## Outcome

- ✅ Impact: Spec drafted; 2 clarifications pending before planning.
- 🧪 Tests: none (spec stage)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: answer Q1/Q2, then /sp.clarify or /sp.plan
- 🧠 Reflection: The confirmation wording is a business promise, so it was asked rather than invented.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 reported a parameter-binding error but still created the branch and spec file.
- Graders run and results (PASS/FAIL): spec quality checklist: all pass except open clarification markers.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
