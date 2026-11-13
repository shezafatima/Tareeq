---
id: 1
title: Specify pricing certificate announcement
stage: spec
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 034-pricing-certificate-announcement
branch: 034-pricing-certificate-announcement
user: shezafatima
command: /sp.specify
labels: ["pricing", "certificate", "announcement-bar", "admin", "spec"]
links:
  spec: specs/034-pricing-certificate-announcement/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/034-pricing-certificate-announcement/spec.md
 - specs/034-pricing-certificate-announcement/checklists/requirements.md
tests:
 - none
---

## Prompt

/sp.specify Pricing, certificate section and announcement bar (admin-managed)

1. Pricing for programs and courses
- Add to both models: pricing {mode (show | contact | free), amount (number, PKR), originalAmount (optional; shown struck through when higher than amount), unitNote (optional, e.g. "per participant", "per school"), offerLabel (optional, e.g. "Launch offer"), offerEndsText (optional)}.
- Existing priceText stays as a fallback: records without pricing data render exactly as today. No migration needed.
- Admin: a Pricing section in the program and course forms. Amount fields appear only when mode is "show". Validation: amount > 0; originalAmount, if set, must be greater than amount. The live preview shows the price block.
- Public: one shared PriceBlock component used on program panels, course cards, both detail pages (sticky booking card and mobile bar) and the workshop page. Format "Rs 5,000". With a discount: the old price struck through, the new price, and the offer label as a saffron chip. Mode "contact" shows "Contact us for pricing"; "free" shows "Free".
- Prices are display-only. No checkout.

2. Certificate section (home page)
- A new home section placed before the final CTA: heading, short text, 3 bullet points and a certificate image in a tilted frame with a soft glow (hover straightens it; static under reduced motion).
- Content is admin-managed at /admin/settings/certificate: enabled toggle, heading, text, bullets (add/remove, max 4), certificate image (existing ImageUploader, with alt text).
- Placeholder: until an image is uploaded, show a built-in sample certificate in brand style with a visible "Sample" ribbon. Default copy describes a "Tareeq certificate of completion" and must not imply government or university accreditation.
- When the toggle is off, the section is not rendered at all.
- Cache tag "certificate", revalidated on save.

3. Announcement bar (above the navbar)
- Admin at /admin/settings/announcement: enabled toggle, text (max 120 chars), optional link (label and URL; internal path or https), style (saffron | navy), optional start and end date-time (Asia/Karachi), dismissible toggle.
- Public: a slim bar above the navbar on every public page, rendered on the server. It shows only when enabled, text is non-empty and the current time is inside the date window. Never shown on /admin.
- Dismiss: a close button stores a cookie keyed to the announcement's last-updated time, so a dismissed bar stays hidden but a new or edited announcement appears again. Server reads the cookie, so there is no flash or layout shift.
- Layout: the bar's height is exposed as a CSS variable. The sticky header, the hero's viewport-fit and the mobile sticky bars account for it, so nothing overlaps and the hero still fits the screen with the bar visible. Long text wraps to at most 2 lines on mobile.
- Accessible: role="region" with a label, AA contrast in both styles (saffron bar uses dark text), the close button has an accessible name.
- Cache tag "announcement", revalidated on save.

All three: server-side session checks on every admin action, extend the unauthenticated-action test, existing admin UI patterns, link the two new settings pages from Settings, no new dependencies, mobile at 360px.

Out of scope: payments, coupon codes, per-student certificates or certificate generation, multiple simultaneous announcements.

## Response snapshot

Created branch 034-pricing-certificate-announcement and spec.md with three prioritized stories (P1 pricing, P2 announcement bar, P3 certificate section), 31 functional requirements, edge cases, key entities, 8 success criteria, assumptions (whole rupees, free-text offer end, Karachi timezone, 1-year functional dismissal cookie, added field length limits). One clarification left open: FR-010, which program's price the workshop page shows, since /workshop is not linked to a program today. Quality checklist written; all items pass except that open marker.

## Outcome

- ✅ Impact: Spec ready for clarification of FR-010, then /sp.plan
- 🧪 Tests: none (spec stage)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: answer Q1 (workshop price source), then /sp.plan
- 🧠 Reflection: Checking the code showed the workshop page has no program link, which turned a "just use PriceBlock" line into a real data-source question.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 printed a positional-parameter error from the shell wrapper, but the branch and spec file were created.
- Graders run and results (PASS/FAIL): spec quality checklist — PASS except 1 open clarification
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): pass the long description to the script through a file to avoid argument-parsing issues
