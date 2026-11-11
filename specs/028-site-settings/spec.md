# Feature Specification: Admin Site Settings (Contact Info and WhatsApp)

**Feature Branch**: `028-site-settings`
**Created**: 2026-11-11
**Status**: Draft
**Input**: User description: "Admin: site settings (contact info and WhatsApp). Purpose: the owner edits contact details in the admin, and the whole site updates without a redeploy." (full text in `history/prompts/028-site-settings/1-site-settings-spec.spec.prompt.md`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Owner edits contact details in the admin (Priority: P1)

The signed-in owner opens **Settings** from the admin sidebar and sees one form with four sections: WhatsApp and phone, email and address, social links, and notifications. They change a value, optionally test the WhatsApp number, save, and see a confirmation toast. The saved values are kept and shown again the next time the page loads.

**Why this priority**: Without a place to store and edit the details, nothing on the public site can change. This alone is a usable MVP: the owner has one record of their contact details.

**Independent Test**: Sign in, open `/admin/settings`, change each field, save, reload, and confirm every value persisted; enter invalid values and confirm they are rejected with a message next to the field.

**Acceptance Scenarios**:

1. **Given** the owner is signed in, **When** they open the admin sidebar, **Then** a "Settings" entry links to `/admin/settings` and is marked active on that page.
2. **Given** a fresh database with no settings saved, **When** the owner opens Settings, **Then** the form is prefilled with the current fallback values (from the existing environment configuration) and saving creates the single settings record.
3. **Given** the owner types `0300 1234567` as the WhatsApp number, **When** they save, **Then** it is stored and shown as `+923001234567`.
4. **Given** the owner types an invalid email, a phone number with too few digits, an `http://` link, or an Instagram link in the YouTube field, **When** they save, **Then** nothing is saved and each bad field shows a clear message.
5. **Given** a WhatsApp number is entered (saved or not), **When** the owner presses "Test WhatsApp link", **Then** a new tab opens the WhatsApp chat link for that number; if the number is invalid the button is disabled or shows the validation message instead.
6. **Given** the save succeeds, **Then** a success toast appears; **given** it fails (database unavailable), **Then** an error toast appears and the owner's input stays in the form.
7. **Given** the owner has unsaved changes, **When** they try to leave the page (sidebar link, back, reload, close tab), **Then** they are warned and can stay; after a successful save no warning appears.
8. **Given** a request to the save action without a valid admin session, **Then** it is refused and nothing is written.

---

### User Story 2 - The public site shows the saved contact details (Priority: P1)

Every place on the public site that shows contact details uses the saved settings: the footer (WhatsApp, email, phone, address, social icons), the floating WhatsApp button, and every WhatsApp chat link (form confirmations, program and course calls to action, "Ask on WhatsApp"). A change saved in the admin shows on the next page load, with no redeploy.

**Why this priority**: This is the purpose of the feature; Story 1 has no public value without it. Both are P1 and ship together.

**Independent Test**: Save a new WhatsApp number and email in the admin, then load the home page, a program page, a course page and a form confirmation, and confirm every chat link, the floating button and the footer use the new values. Clear a social link and confirm its icon disappears.

**Acceptance Scenarios**:

1. **Given** the owner saves a new WhatsApp number, **When** any public page is next loaded, **Then** the floating button, footer and every chat link use the new number.
2. **Given** a social link is empty, **Then** its icon is not shown in the footer; **given** it is set, **Then** the icon links to it and opens in a new tab.
3. **Given** phone or address is empty, **Then** that line is not shown in the footer.
4. **Given** no WhatsApp number exists anywhere (no saved value and no fallback), **Then** the floating button is hidden and WhatsApp calls to action point to the email/contact fallback exactly as they do today.
5. **Given** a fresh database, **Then** the site looks and behaves as it does today (same number, email and social links).
6. **Given** a 360px-wide screen, **Then** the footer contact block and social icons fit without horizontal scrolling and each tap target is at least 44px.

---

### User Story 3 - Owner notifications go to the saved address (Priority: P2)

When a new workshop request or course registration arrives, the owner notification email is sent to the notification address saved in Settings.

**Why this priority**: Valuable but less visible; the current fallback keeps notifications working until the owner changes it.

**Independent Test**: Save a different notification address, submit a workshop form, and confirm the notification arrives at the new address.

**Acceptance Scenarios**:

1. **Given** a notification address is saved, **When** a new submission arrives, **Then** the notification is sent to that address.
2. **Given** no notification address is saved, **Then** notifications go to the existing configured recipient, as today.
3. **Given** settings cannot be read (database error), **Then** the notification still goes to the existing configured recipient and the submission is not lost.

---

### Edge Cases

- Settings record missing, or a single field empty: that field falls back to the existing environment value; the site never breaks on a fresh database.
- Database unreachable when a public page renders: pages render with the fallback values rather than erroring.
- Two saves in quick succession (two tabs): last save wins; only one settings record ever exists.
- WhatsApp number entered with spaces, dashes, a leading `0`, `92` without `+`, or `00` prefix: normalised to E.164 with +92 as the default country.
- A non-Pakistani number entered with its own `+` country code: kept as entered (after removing spaces/dashes).
- Social URL with `www.` or a mobile subdomain (e.g. `m.youtube.com`, `youtu.be`, `twitter.com` for X): accepted when it belongs to the matching platform.
- Fields with only whitespace are treated as empty.
- Very long address: limited to a sensible length and wraps in the footer.
- Owner's session expires while editing: saving is refused with a message to sign in again; the form input is not silently lost.

## Requirements *(mandatory)*

### Functional Requirements

**Data**

- **FR-001**: The system MUST store exactly one site settings record with: WhatsApp number, contact email, phone (optional), address (optional), social links for YouTube, LinkedIn, Instagram, TikTok and X (each optional), notification email, and created/updated times.
- **FR-002**: Reading settings MUST happen only on the server, MUST be cached, and saving MUST refresh the cache so the next page load shows the new values.
- **FR-003**: For any field that is missing or empty, reading settings MUST return the existing fallback: WhatsApp from `NEXT_PUBLIC_WHATSAPP_NUMBER`, contact email from `NEXT_PUBLIC_CONTACT_EMAIL`, notification email from `LEAD_NOTIFICATION_TO`, and YouTube/LinkedIn from the current mentor social links (only until settings are first saved, so a link the owner clears disappears). Fields with no fallback (phone, address, other socials) are simply absent.
- **FR-004**: If settings cannot be read, the system MUST use the fallbacks instead of failing the page or the submission.

**Admin**

- **FR-005**: The admin MUST have a Settings page at `/admin/settings`, linked from the sidebar (desktop and mobile menu), reachable only when signed in.
- **FR-006**: The form MUST be grouped into four sections: WhatsApp and phone; email and address; social links; notifications.
- **FR-007**: The same validation rules MUST apply in the form and on the server: WhatsApp and phone normalised to E.164 (+92 default); contact and notification emails must be valid addresses; each social link must be an `https` URL on that platform's domain.
- **FR-008**: WhatsApp number and notification email MUST be required when saving only if no fallback exists for them; contact email is required on the same basis. All other fields are optional.
- **FR-009**: A "Test WhatsApp link" button MUST open the chat link for the number currently in the field in a new tab.
- **FR-010**: Saving MUST show a success or error toast and keep the input on error.
- **FR-011**: Leaving the page with unsaved changes MUST trigger a warning.
- **FR-012**: The save action MUST verify the admin session on the server and refuse unauthenticated requests without writing; the existing unauthenticated-action test MUST be extended to cover it.

**Public site**

- **FR-013**: The footer MUST show WhatsApp, email, phone and address from settings, each only when it has a value, plus an icon for each social link that is set.
- **FR-014**: The floating WhatsApp button and every WhatsApp chat link to the business (form confirmations, program and course calls to action, "Ask on WhatsApp", mobile call-to-action bars) MUST use the settings number.
- **FR-015**: Owner notification emails MUST be sent to the settings notification email.
- **FR-016**: Interactive (client-side) components MUST receive contact values from the server as inputs; no client-side code may read the WhatsApp number from environment configuration. Every existing direct read MUST be replaced.
- **FR-017**: When no WhatsApp number exists at all, the existing fallbacks MUST remain: floating button hidden, calls to action pointing to the email/contact link.
- **FR-018**: Links the admin creates to message a lead (the lead's own number) are unaffected.

**Constraints**

- **FR-019**: The Settings page MUST follow existing admin UI patterns (sidebar, top bar, form fields, toast) and work at 360px width.
- **FR-020**: No new third-party dependencies.

### Key Entities

- **Site Settings**: the single record of the business's public contact details and notification recipient. Attributes: WhatsApp number, contact email, phone, address, social links (YouTube, LinkedIn, Instagram, TikTok, X), notification email, created and updated times. Every field is optional in storage; empty means "use the fallback, if any".
- **Effective Settings**: what the site actually uses: the saved values merged over the fallbacks. Never stored.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can change the WhatsApp number and see it live on the public site in under 1 minute, with no redeploy.
- **SC-002**: After a save, 100% of business WhatsApp links and the floating button on the public site use the new number (verified by checking every page type listed in FR-014).
- **SC-003**: A code search finds zero client-side reads of the WhatsApp number from environment configuration.
- **SC-004**: On a fresh database the public site's contact details are identical to today's.
- **SC-005**: 100% of invalid inputs in the acceptance scenarios are rejected with a field message, and unauthenticated save requests write nothing.
- **SC-006**: The Settings page and footer show no horizontal scrolling at 360px width.

## Assumptions

- **Env names mapped to the code**: the request names `NOTIFY_EMAIL`; the code uses `LEAD_NOTIFICATION_TO` for the notification recipient and `NEXT_PUBLIC_CONTACT_EMAIL` for the public email. The spec uses the real names. `NEXT_PUBLIC_WHATSAPP_NUMBER` is stored as digits only today; it is treated as `+<digits>`.
- **Social fallback**: the footer currently gets YouTube and LinkedIn from the mentor's links. They stay as the fallback so a fresh database looks the same. The mentor section keeps its own links (mentor content is out of scope).
- **Effect of a save**: "the whole site updates" means on the next page load; open pages do not update live.
- **The unauthenticated-action test** is `scripts/admin-guard-test.mts` (`npm run test:admin-guard`). The settings save action is added to its required list (corrected during planning, research R7).
- E.164 normalisation follows the rules already used for lead phone numbers (`tests/unit/phone.test.ts`).
- Only the single admin edits settings; no audit history beyond the updated time.

## Out of Scope

- Editing hero or page copy, mentor section content, SEO settings, logo upload.
- Live updates of pages already open in a browser.
- Multiple admins, roles or settings history.
