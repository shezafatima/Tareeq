# Feature Specification: Home Page Content and Core Pages

**Feature Branch**: `003-home-core-pages`
**Created**: 2026-11-01
**Status**: Draft
**Input**: User description: "Home page content and core pages. The site currently has a hero and empty placeholder pages. This feature makes it a real, shareable website: five sections below the existing hero on the home page (Who it's for, How it works, Programs preview, Why Tareeq, final call to action), a desktop scroll transition in which the hero's three floating cards travel into the How it works steps and settle, and the Our Way (/our-way), Programs (/programs) and Contact (/contact) pages. All content lives in typed content files read through accessor functions so the source can later move to a database without touching page components. Mobile-first from 360px, no horizontal scroll, accessible, per-page title and description, header/footer/links updated from /about to /our-way."

## Clarifications

### Session 2026-11-01

- Q: The brief names no workshop booking page, and none exists. Where does "Join a workshop" go? -> A: To the existing `joinHref` target, which is `/contact` today. It is one setting, so it can be repointed when a booking page exists. Contact calls to action open WhatsApp.
- Q: The brief gives no program names, durations, formats or biography. Where does the copy come from? -> A: Draft copy is written in the brand voice from the brief and marked for the owner to confirm. Nothing the owner has not supplied is stated as fact: no statistics, testimonials, logos, prices, dates, named people or addresses.
- Q: What happens to the `/courses` placeholder? -> A: Out of scope. It is left as it is.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor understands Tareeq from the home page (Priority: P1)

A visitor lands on the home page, sees the existing hero, and scrolls. Below it they find, in order: who Tareeq is for, how a session works, a preview of the programs, why the approach is different, and a final prompt to join a workshop. Everything reads clearly without needing to open another page.

**Why this priority**: The home page is the shareable face of the site. Without these sections the site is a hero and empty pages.

**Independent Test**: Open the home page at 390px and 1440px wide. Scroll to the end. Confirm all five sections appear in order with real content, the hero is unchanged, and the "Join a workshop" button works.

**Acceptance Scenarios**:

1. **Given** the home page, **When** the visitor scrolls past the hero, **Then** they see "Who it's for" with exactly four cards: Teachers, School students, College students, Professionals and teams, each with one line on what that group gets.
2. **Given** the home page, **When** the visitor reaches "How it works", **Then** they see three steps, Prompt, Build and Learn, each with a short explanation of what happens in a session.
3. **Given** the home page, **When** the visitor reaches the programs preview, **Then** they see two or three programs, each showing name, who it is for, duration and format, with a link to the Programs page. Programs not yet ready are marked "coming soon".
4. **Given** the home page, **When** the visitor reaches "Why Tareeq", **Then** they see three or four short points on the approach (hands-on, real problems, usable the next day, no fluff) and no statistics, testimonials or third-party logos.
5. **Given** the end of the home page, **When** the visitor sees the final call to action, **Then** it shows one line and a "Join a workshop" button that leads to the workshop destination.
6. **Given** the home page before and after this feature, **When** the hero is compared at the same width, **Then** it is visually and behaviourally unchanged.

---

### User Story 2 - Hero cards travel into "How it works" on desktop (Priority: P2)

On a desktop-width screen (1024px and up), as the visitor scrolls from the hero into "How it works", the hero's three floating cards travel down, rotate gently to level, and settle into the three step positions. Each card lands with a soft spring, its icon comes alive, the step text fades in beneath it, a thin saffron line draws between the three, and a faint glow pulses behind each card as it lands. Scrolling back up plays all of it in reverse.

**Why this priority**: It is the signature moment of the page and ties the hero to the content, but the page is complete without it.

**Independent Test**: At 1440x900, scroll slowly from the top of the page into "How it works" and back. Capture screenshots at several scroll positions, including mid-travel and just after settle.

**Acceptance Scenarios**:

1. **Given** a desktop-width screen and no reduced-motion preference, **When** the visitor scrolls from the hero toward "How it works", **Then** the three hero cards move down and rotate to level, tied to scroll position, and arrive at the three step positions.
2. **Given** a card reaches its position, **When** it settles, **Then** it overshoots to about 1.03 scale and returns to 1 with a spring-like motion, and the three cards settle left to right about 80 milliseconds apart.
3. **Given** a card settles, **When** it lands, **Then** its icon animates using the hero's existing icon animations: the Prompt sparkle rotates and pulses, the Build brackets spread apart, the Learn bulb fills with saffron and glows.
4. **Given** a card settles, **When** its step is revealed, **Then** the step heading and body text fade in and rise about 8px, staggered after the card.
5. **Given** the third card has settled, **When** the sequence continues, **Then** a thin saffron connector line draws left to right between the three cards.
6. **Given** a card lands, **When** the glow plays, **Then** a faint saffron glow pulses once behind it, then fades.
7. **Given** the sequence has played, **When** the visitor scrolls back up, **Then** the whole sequence reverses, settle included, with no snapping or jumping.
8. **Given** the sequence is at any point, **When** the page is inspected, **Then** the section's height was reserved from the first paint and nothing around it moves as cards arrive.

---

### User Story 3 - The section works without the animation (Priority: P2)

On narrow screens, with reduced motion requested, or if the animation fails to run, "How it works" is still complete and correct. The hero cards stay in the hero. The section fades in once as it scrolls into view, or shows with no animation at all under reduced motion.

**Why this priority**: Most visitors arrive on phones, and accessibility is a hard requirement. The content must never depend on the effect.

**Independent Test**: At 390px wide, and at 1440px with reduced motion enabled, open the home page and read "How it works" in full.

**Acceptance Scenarios**:

1. **Given** a screen narrower than 1024px, **When** the visitor scrolls, **Then** the hero cards stay in the hero, nothing travels or settles, and "How it works" fades in simply as it enters the view.
2. **Given** a reduced-motion preference at any width, **When** the visitor scrolls, **Then** there is no travel, settle, glow, line drawing or fade; the section simply appears in its final state.
3. **Given** the animation is removed entirely, **When** the section is read, **Then** all three steps, their icons, headings, body text and connecting line are present and in the right order.
4. **Given** any width and any motion setting, **When** the page loads and scrolls, **Then** there is no layout shift in or around the section.

---

### User Story 4 - A visitor learns the story on Our Way (Priority: P3)

A visitor opens Our Way from the navigation. They read the story and what Tareeq means (طریق, "the way"), the approach of learning by doing, the vision, the mission, and who is behind it, in a warm, direct voice.

**Why this priority**: It builds trust and replaces the About placeholder, but the home page already carries the main message.

**Independent Test**: Open `/our-way` and confirm all five topics are present, the navigation label reads "Our Way", and `/about` no longer appears anywhere.

**Acceptance Scenarios**:

1. **Given** the site navigation (desktop and mobile menu) and footer, **When** the visitor looks for the old About link, **Then** they find "Our Way" linking to `/our-way`.
2. **Given** `/our-way`, **When** the page loads, **Then** it covers the story and meaning of Tareeq with the Urdu word طریق and its English meaning "the way", the learning-by-doing approach, the vision, the mission, and who is behind it.
3. **Given** the copy on the page, **When** it is read, **Then** it is warm and direct and uses no hype words.
4. **Given** the old address `/about`, **When** someone opens it, **Then** they are taken to `/our-way` rather than an error page.

---

### User Story 5 - A visitor compares programs and chooses one (Priority: P3)

A visitor opens Programs. For each program they see its name, who it is for, what they will be able to do afterwards, its duration, its format and what to bring. A clear button leads to the workshop destination. Any program that is not ready says "coming soon".

**Why this priority**: It converts interest into action, and the home page preview already points here.

**Independent Test**: Open `/programs` and check each program shows all six facts, the call to action works, and unready programs are clearly marked.

**Acceptance Scenarios**:

1. **Given** `/programs`, **When** the page loads, **Then** each program shows name, who it is for, what you will be able to do afterwards, duration, format and what to bring.
2. **Given** a program that is not ready, **When** it is shown, **Then** it carries a clearly visible "coming soon" label and its call to action does not suggest it can be booked now.
3. **Given** `/programs`, **When** the visitor wants to act, **Then** a clear call to action leads to the workshop destination.

---

### User Story 6 - A visitor reaches Tareeq through Contact (Priority: P3)

A visitor opens Contact and finds WhatsApp, email and location, a short note on how soon to expect a reply, and buttons that open WhatsApp. There is no form.

**Why this priority**: It completes the path from interest to a conversation, using details that already exist elsewhere in the site.

**Independent Test**: Open `/contact`, confirm the three details and the response-time note, and tap a call to action to confirm it opens WhatsApp.

**Acceptance Scenarios**:

1. **Given** `/contact`, **When** the page loads, **Then** it shows WhatsApp, email and location, each taken from a single configurable place so it can be changed once later.
2. **Given** a detail has no value configured, **When** the page loads, **Then** that detail is left out cleanly rather than showing a blank or broken entry.
3. **Given** `/contact`, **When** the visitor reads it, **Then** a short response-time note is visible and there is no form.
4. **Given** a call to action on `/contact`, **When** it is activated, **Then** it opens WhatsApp with the site's pre-filled message.

---

### Edge Cases

- A visitor resizes the window across 1024px mid-session: the page settles into the correct mode (travel on desktop, simple fade below) without a broken or half-moved card.
- A visitor loads the page already scrolled past the hero (refresh, anchor, back button): cards and steps appear in their final settled state, not stuck mid-travel or hidden.
- A visitor scrolls very fast past the section, or jumps by keyboard (End, Page Down): the section ends in its final state, with no orphaned glow, line or half-faded text.
- A visitor scrolls back and forth around a settle point: motion follows the scroll in both directions without flicker.
- The preloader is showing on load: the transition does not start until the page is visible and does not shift layout.
- JavaScript is slow or unavailable: all five home sections, all three steps and all three pages are fully readable.
- The WhatsApp number is missing or invalid: WhatsApp calls to action are hidden and the rest of the page still reads correctly (existing site behaviour is kept).
- Email or location is not configured: that entry is omitted; if all three details are missing, the page still shows a clear message and the response-time note.
- A program's duration or format is not yet decided: the program is marked "coming soon" and shows no invented figures.
- Keyboard-only and screen-reader visitors: the travelling cards are decorative duplicates of the hero cards and must not create duplicate or confusing content for assistive technology, and every link and button is reachable and visible when focused.
- Very narrow screens (360px) and very wide screens (above 1440px): no horizontal scroll and no overlapping text or cards.

## Requirements *(mandatory)*

### Functional Requirements

**Content source**

- **FR-001**: All page content (audiences, steps, programs, approach points, story, contact details) MUST live in typed content files, separate from the visual components, with the same field shape a database would later use.
- **FR-002**: Pages MUST obtain content only through accessor functions (for example "get all programs"), so the content source can later change from files to a database without editing any page component.
- **FR-003**: Components MUST NOT contain hardcoded copy; they render what the accessors return.
- **FR-004**: Contact details (WhatsApp, email, location) MUST each come from configuration or the content files and be changeable in one place.

**Home page**

- **FR-005**: The home page MUST keep the existing hero unchanged and add, below it and in this order: Who it's for, How it works, Programs preview, Why Tareeq, final call to action.
- **FR-006**: "Who it's for" MUST show exactly four cards: Teachers, School students, College students, Professionals and teams, each with one line on what they get.
- **FR-007**: "How it works" MUST show three steps, Prompt, Build, Learn, each with an icon, a heading and a short explanation of what happens in a session, matching the three ideas on the hero's floating cards.
- **FR-008**: The programs preview MUST show two or three programs, each with name, who it is for, duration and format, and a link to the Programs page. Programs not ready MUST be marked "coming soon".
- **FR-009**: "Why Tareeq" MUST show three or four short points covering hands-on practice, real problems, being usable the next day, and no fluff.
- **FR-010**: The site MUST NOT contain invented statistics, fake testimonials, or logos the owner has not confirmed permission to use.
- **FR-011**: The final call to action MUST show one line and a "Join a workshop" button leading to the workshop destination.

**Scroll transition (desktop, 1024px and up, motion allowed)**

- **FR-012**: As the visitor scrolls from the hero into "How it works", the hero's three floating cards MUST travel downward, rotate gently to level, and settle into the three step positions, with position tied to scroll.
- **FR-013**: Each card MUST settle with a spring-like overshoot to about 1.03 scale and back to 1, with the cards settling left to right about 80 milliseconds apart.
- **FR-014**: As each card lands, its icon MUST animate using the hero's existing icon animations (Prompt sparkle rotates and pulses, Build brackets spread apart, Learn bulb fills with saffron and glows), reused rather than re-created.
- **FR-015**: Each step's heading and body text MUST fade in and rise about 8px, staggered after its card settles.
- **FR-016**: After the third card settles, a thin saffron connector line MUST draw left to right between the three cards.
- **FR-017**: A faint saffron glow MUST pulse once behind each card as it lands, then fade.
- **FR-018**: Scrolling back up MUST reverse the entire sequence, including the settle, with no snapping or jumping.
- **FR-019**: The "How it works" section MUST be complete and correct with the animation removed. Its content MUST live in that section, not in the hero; the hero cards only hand off visually.
- **FR-020**: Below 1024px, and under a reduced-motion preference, the hero cards MUST stay in the hero with no travel and no settle. Below 1024px the section MUST fade in once on entering view; under reduced motion it MUST appear with no animation.
- **FR-021**: The transition MUST animate only movement, rotation, scale and opacity. It MUST cause no layout shift, and the section MUST reserve its final height from the first paint.
- **FR-022**: Travelling cards MUST be visual only and MUST NOT duplicate content for assistive technology or take focus.
- **FR-023**: If a visitor arrives already scrolled past the section, or resizes across the 1024px boundary, the section MUST show a correct final state with no stuck or half-moved elements.

**Our Way page**

- **FR-024**: `/our-way` MUST replace the About placeholder and cover: the story and the meaning of Tareeq (طریق, "the way"), the learning-by-doing approach, the vision, the mission, and who is behind it.
- **FR-025**: The copy MUST be in the brand voice, warm and direct, with no hype words.
- **FR-026**: The navigation label MUST read "Our Way". The header (desktop and mobile), the footer and every existing link to `/about` MUST point to `/our-way`, and requests to `/about` MUST lead to `/our-way`.
- **FR-027**: Details about who is behind Tareeq that the owner has not supplied MUST NOT be invented; unconfirmed items stay as clearly marked draft copy for the owner to complete.

**Programs page**

- **FR-028**: `/programs` MUST show, for each program: name, who it is for, what you will be able to do afterwards, duration, format, and what to bring.
- **FR-029**: `/programs` MUST include a clear call to action to the workshop destination.
- **FR-030**: Programs that are not ready MUST be clearly marked "coming soon".

**Contact page**

- **FR-031**: `/contact` MUST show WhatsApp, email and location, a short response-time note, and no form.
- **FR-032**: A detail with no configured value MUST be omitted without leaving a blank or broken entry.
- **FR-033**: Calls to action on `/contact` MUST open WhatsApp using the site's existing pre-filled message.

**Quality across all pages**

- **FR-034**: Every page MUST work from 360px wide with no horizontal scroll at any width.
- **FR-035**: Existing shared components from the site shell MUST be reused, and new shared components MUST be added for repeated patterns rather than one-off markup per page.
- **FR-036**: Every page MUST use semantic structure with exactly one main heading, be fully keyboard navigable with visible focus, meet AA colour contrast, and give meaningful alternative text to non-decorative images (decorative images are hidden from assistive technology).
- **FR-037**: Every page MUST have its own title and meta description.
- **FR-038**: Pages MUST be rendered on the server by default; client-side behaviour is limited to the pieces that need interaction (the scroll transition and fade-in).

### Key Entities

- **Audience**: A group Tareeq serves. Attributes: name, one-line benefit, display order.
- **Step**: One stage of a session. Attributes: key (Prompt, Build, Learn), heading, short explanation, icon reference, display order.
- **Program**: A workshop offering. Attributes: name, slug, who it is for, outcomes (what you will be able to do), duration, format, what to bring, status (available or coming soon), display order.
- **Principle**: One short point of the approach for "Why Tareeq". Attributes: heading, one-line text, display order.
- **Story section**: A block of the Our Way page (story, meaning of the name, approach, vision, mission, who is behind it). Attributes: kind, heading, body.
- **Contact detail**: A way to reach Tareeq. Attributes: kind (WhatsApp, email, location), label, value, link target, and the response-time note.
- **Page metadata**: Per-page title and description.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can say who Tareeq is for, what a session looks like, and how to join, using only the home page, within 60 seconds of scrolling.
- **SC-002**: Every page (home, Our Way, Programs, Contact) renders with real, complete content at 360px, 390px, 768px, 1024px, 1440px and 1920px wide with zero horizontal scroll.
- **SC-003**: Layout shift across the home page, including the full scroll transition at desktop width, stays at or below 0.05 and shows no visible jump at any scroll position.
- **SC-004**: The scroll transition keeps a smooth frame rate while scrolling on a mid-range phone-class device, with no visible stutter.
- **SC-005**: With motion removed (narrow screen, reduced motion, or animation disabled), 100% of "How it works" content, three steps with icon, heading and text, is visible and in order.
- **SC-006**: Scrolling the transition down and back up returns every element to its exact starting position with no snap, in 100% of repeated runs across at least five scroll speeds.
- **SC-007**: Replacing the content source with another one that returns the same shape requires zero edits to page components.
- **SC-008**: No remaining link or label anywhere on the site points to `/about`, and "Our Way" appears in the header, mobile menu and footer.
- **SC-009**: Every page passes an accessibility audit with no critical issues: one main heading, full keyboard reachability, AA contrast, and working alternative text.
- **SC-010**: The build and lint both complete with no errors or warnings, and the mobile performance score on the home page is no worse than the current baseline (about 75, run-to-run range 66 to 82, measured over several runs before and after).
- **SC-011**: Screenshots at 1440x900 and 390x844 exist for every page, plus a desktop scroll-sequence set covering at least the start, mid-travel, just-after-settle and fully-settled positions of the transition.

## Assumptions

- **Workshop destination**: There is no booking page yet, so "Join a workshop" and the Programs call to action go to the existing workshop destination setting, currently `/contact`. When a booking page exists, only that one setting changes.
- **Draft copy**: Program names, durations, formats, outcomes, what-to-bring lists, the founder story and "who is behind it" are not supplied in the brief. Draft copy is written in the brand voice, kept free of figures and names that cannot be confirmed, and flagged for the owner to review before launch. Where a program's details are not decided, it is marked "coming soon".
- **Number of programs**: Two or three programs are shown. The Programs page lists all of them; the home preview shows up to three.
- **Contact values**: WhatsApp number uses the existing setting. Email and location are read from new settings with no invented defaults; the response-time note is short and general (no promised hours) until the owner confirms.
- **Old address**: `/about` redirects permanently to `/our-way` so previously shared links keep working.
- **Hero is fixed**: The existing hero, its floating cards and their icon animations are reused as they are. The transition adds a visual hand-off but does not change the hero's own content, layout or behaviour.
- **Desktop threshold**: "Desktop" means a viewport 1024px wide or more, matching the site's existing large breakpoint.
- **Out of scope**: Booking or enquiry forms (next feature), the Courses page, a database, analytics, search, blog, and any pricing.
- **Dependencies**: Builds on the site shell and design system (feature 001) and sits beside the brand preloader (feature 002), which is unchanged.
