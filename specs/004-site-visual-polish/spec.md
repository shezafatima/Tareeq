# Feature Specification: Site Visual and Motion Polish

**Feature Branch**: `004-site-visual-polish`
**Created**: 2026-11-01
**Status**: Draft
**Input**: User description: "Visual and motion polish for the whole site (an animated, visually appealing frontend), keeping the hero and the preloader exactly as designed. The brand stays: Midnight, Royal Blue, Sky Blue, Saffron, Paper and Soft Blue, with Sora headings and Inter body text. Borrow only the craft from the UI UX Pro Max skill: staggered scroll reveals, soft layered depth, hover and press states, consistent motion timing, and its accessibility checklist. No new dependencies. Motion level is polished scroll-reveal. The hero, the preloader and the hero-to-How-it-works scroll transition from feature 003 must not change."

## Clarifications

### Session 2026-11-01

- Q: The UI UX Pro Max skill recommends a playful indigo and orange "clay" look with Baloo 2 and Comic Neue fonts and GSAP. Do we adopt it? -> A: **No. Owner decision: the brand stays.** Only the craft is borrowed (reveals, depth, hover and press states, timing, accessibility checklist). The palette, fonts and the animation library it suggests are not used.
- Q: How much motion across the site? -> A: **Owner decision: polished scroll-reveal.** Sections reveal with soft staggered fades and rises as they enter view; cards lift on hover; buttons give press feedback. Clearly visible, never in the way, smooth on a mid-range phone.
- Q: How is this work run? -> A: **Owner decision: spec first, as feature 004.**
- Q: What may be added around the hero? -> A: The owner did not choose. **Default used here (to confirm or replace):** a slim scroll cue and a small "trust strip" of plain facts the owner can confirm (hands-on, real projects, in person or online), placed directly below the hero section and not inside it. The hero itself is not touched.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The home page feels alive as I scroll (Priority: P1)

A visitor scrolls the home page below the hero. Each section arrives with a soft, staggered entrance: cards rise and fade in one after another, headings settle into place, and sections have their own visual rhythm (alternating backgrounds, gentle dividers, soft depth on cards) instead of a flat stack of boxes. Nothing is hidden when they arrive near a section, nothing jumps, and the page still reads clearly at every moment.

**Why this priority**: This is the visible heart of the request: the site goes from correct to appealing.

**Independent Test**: Open the home page at 1440 and 390 wide, scroll slowly from the hero to the footer, and capture the sequence. Every section reveals once, in order, and ends fully visible.

**Acceptance Scenarios**:

1. **Given** a section below the hero is outside the viewport, **When** it scrolls into view, **Then** its heading and its cards enter with a soft fade and a short rise, staggered by a small, consistent interval, and end in their normal position.
2. **Given** a section is already in view when the page loads (for example after a refresh while scrolled), **When** the page appears, **Then** that section is shown in its final state with no hidden-then-shown flash.
3. **Given** a visitor scrolls back up and down again, **When** a revealed section re-enters view, **Then** it stays in its final state and does not replay.
4. **Given** the home page sections, **When** compared before and after, **Then** the content, order and links are unchanged; only the visual treatment and motion differ.
5. **Given** the "How it works" section, **When** the visitor scrolls through it, **Then** the existing card travel and settle sequence still plays exactly as before and no new reveal interferes with it.

---

### User Story 2 - Everything I touch responds (Priority: P1)

A visitor hovers, presses and tabs through the site. Cards lift slightly with a soft shadow, buttons give clear press feedback and nudge their arrow, links and the current navigation item show a subtle animated underline, and focus is always clearly visible. Motion timing feels like one system, not many.

**Why this priority**: Interaction feedback is what makes a site feel finished, and it applies on every page.

**Independent Test**: On each page, hover each card and button, press a button, and tab through the page with the keyboard; confirm the feedback and visible focus on each.

**Acceptance Scenarios**:

1. **Given** a card, **When** a pointer hovers it or keyboard focus enters it, **Then** it lifts a few pixels with a deeper soft shadow, smoothly, and returns on leave.
2. **Given** a button, **When** it is hovered, pressed or focused, **Then** it shows distinct hover, pressed and focus states, and a button with an arrow nudges the arrow on hover.
3. **Given** the main navigation, **When** a page is current or a link is hovered, **Then** the underline animates in smoothly and the current page is still marked for assistive technology.
4. **Given** any animated element on the site, **When** its timing is measured, **Then** it uses one of a small, shared set of durations and easing curves.
5. **Given** a touch device, **When** a visitor taps a card or button, **Then** it responds without needing hover and every target is at least 44px.

---

### User Story 3 - The inner pages share the same look and motion (Priority: P2)

A visitor opens Our Way, Programs or Contact and finds the same visual language as the home page. Page headers enter gently. Story blocks reveal as they scroll into view. The Urdu word طریق appears as a designed feature, large and set apart. Program cards lift on hover. Contact details sit in styled cards.

**Why this priority**: Consistency across pages makes the site feel designed rather than assembled, but the home page carries the first impression.

**Independent Test**: Visit each inner page at 1440 and 390 wide, scroll through it, and compare its visual language to the home page.

**Acceptance Scenarios**:

1. **Given** each inner page, **When** it loads, **Then** its header enters with a gentle fade and rise and its main heading is visible straight away.
2. **Given** the Our Way page, **When** the visitor reaches the name story, **Then** طریق is shown as a large designed feature with its transliteration and meaning, marked as Urdu and right-to-left.
3. **Given** the Programs page, **When** the visitor hovers or focuses a program card, **Then** it lifts as on the home page, and a "coming soon" program stays clearly marked.
4. **Given** the Contact page, **When** it is shown, **Then** each available contact detail appears as a styled card, details that are not configured are still omitted, and no form appears.
5. **Given** the same content as before, **When** the pages are compared, **Then** no text, link or fact has changed.

---

### User Story 4 - A little more around the hero, without touching it (Priority: P2)

A visitor lands on the home page. The hero looks and behaves exactly as today. Directly below it, a slim scroll cue invites them down, and a small strip of plain facts (hands-on, real projects, in person or online) adds reassurance before the first section.

**Why this priority**: The owner allowed additions near the hero; it adds polish but the page works without it.

**Independent Test**: Compare the hero before and after using the existing hero snapshot and comparison. Confirm the cue and strip exist outside the hero and that the hero is unchanged.

**Acceptance Scenarios**:

1. **Given** the hero before and after this feature, **When** compared at 1440 and 390 wide (idle, hover and reduced motion), **Then** it is unchanged.
2. **Given** the area directly below the hero, **When** the page loads, **Then** a slim scroll cue and a trust strip appear there, not inside the hero.
3. **Given** the trust strip, **When** it is read, **Then** it contains only plain facts the owner can confirm and no statistics, logos or testimonials.
4. **Given** reduced motion, **When** the page loads, **Then** the scroll cue is still, not animated.
5. **Given** the hero is exactly one screen tall on desktop, **When** the new area is added, **Then** the hero height and the hero-to-steps transition from feature 003 are unaffected.

---

### User Story 5 - Motion never gets in the way (Priority: P1)

A visitor who asks for reduced motion, who has JavaScript off, who is on a slow phone, or who uses a keyboard or screen reader gets the complete site. Content is present and in its final state, nothing depends on animation to be readable, and the site stays smooth and stable.

**Why this priority**: Accessibility and performance are hard requirements for this audience (mid-range phones, slow connections).

**Independent Test**: Load every page with reduced motion emulated, with JavaScript off, and at 360 wide; confirm all content is visible, there is no layout shift, and there is no horizontal scroll.

**Acceptance Scenarios**:

1. **Given** reduced motion is requested, **When** any page loads and scrolls, **Then** all content appears in its final state with no reveals, lifts, nudges or loops.
2. **Given** JavaScript is unavailable, **When** any page loads, **Then** all text, cards and links are visible and usable.
3. **Given** any page at any width from 360px, **When** it loads and is scrolled, **Then** there is no horizontal scroll and no visible layout shift.
4. **Given** a mid-range phone, **When** scrolling through a page with reveals, **Then** scrolling stays smooth with no visible stutter.
5. **Given** a keyboard or screen-reader user, **When** they move through any page, **Then** every interactive element is reachable with a visible focus indicator, decorative motion is hidden from assistive technology, and no element is hidden by sticky UI when focused.

---

### Edge Cases

- A section's reveal is triggered while the visitor jumps by keyboard (End, Page Down) or follows an in-page link: the section lands fully revealed, never half-faded.
- Reveals near the bottom of a short page (for example Contact, which may be shorter than the screen): content that is already visible is not hidden waiting for a scroll that cannot happen.
- Very narrow screens (360px) and very wide screens (above 1440px): stagger and lift effects do not cause overlap, clipping or horizontal scroll.
- A card with long text or a long program name: lift and shadow do not clip, and the card keeps its size.
- Cards in a grid reveal with a stagger: the stagger is capped so a long list never makes the last card wait noticeably.
- The preloader is covering the page on load: reveals for content in view start after it leaves, so none are missed or played unseen.
- The hero-to-steps transition is running while other reveals are due: they do not fight or shift the section's layout.
- Visitors who resize across the 1024px boundary mid-session: nothing is stuck hidden, half-moved or duplicated.
- Keyboard focus lands on a card that is mid-reveal: it becomes fully visible immediately.
- An owner-supplied trust-strip fact is removed or changed: the strip adapts or disappears without leaving an empty gap.

## Requirements *(mandatory)*

### Functional Requirements

**Do not change**

- **FR-001**: The hero (text, layout, floating cards, robot, eye tracking, gradient background and animations) MUST look and behave exactly as before, shown by the existing hero snapshot and comparison.
- **FR-002**: The preloader (design, timing and skip rules) MUST be unchanged.
- **FR-003**: The hero-to-"How it works" scroll transition from feature 003 MUST keep working with all its existing behaviour and checks.
- **FR-004**: All page content and links MUST be unchanged; this feature changes presentation and motion only. No statistics, testimonials or logos may be added.
- **FR-005**: The brand MUST NOT change: the same colour palette, the same two typefaces and weights, and none of the looks the constitution rules out (purple gradients, neon, glowing brains, circuit lines). The suggestion from the design skill is not adopted.

**Scroll reveal**

- **FR-006**: The site MUST have one shared way to reveal elements as they scroll into view, used by every section and page, with consistent timing and stagger; individual pages MUST NOT define their own reveal animations.
- **FR-007**: A reveal MUST be a soft fade combined with a short rise, staggered between sibling elements by a small consistent interval with a cap on the total delay.
- **FR-008**: Each element MUST reveal once and then stay revealed; scrolling back MUST NOT replay or hide it.
- **FR-009**: Elements already in view when the page appears, and elements reached by keyboard jump or in-page link, MUST be shown in their final state without a hidden-then-shown flash.
- **FR-010**: Content MUST be complete and readable with reveals removed (reduced motion, no JavaScript).

**Visual treatment**

- **FR-011**: The home sections below the hero (Who it's for, Programs preview, Why Tareeq, final call to action) MUST gain richer visual treatment using the existing brand tokens only: soft layered depth on cards, gentle section dividers, alternating section backgrounds, and saffron used only as an accent (lines, dots, fills), never as text on a light background.
- **FR-012**: "How it works" MUST receive only visual polish that does not interfere with its transition, and its layout MUST NOT change.
- **FR-013**: Our Way, Programs and Contact MUST use the same visual language: page headers with a gentle entrance, story blocks that reveal on scroll, program cards that lift on hover, and contact details as styled cards.
- **FR-014**: The Urdu word طریق on Our Way MUST be shown as a designed feature (large, set apart, with its transliteration and meaning), marked as Urdu and right-to-left.
- **FR-015**: The directly-below-hero area MUST gain a slim scroll cue and a trust strip of plain, owner-confirmable facts, placed outside the hero. The cue MUST be still under reduced motion. [Defaults, owner to confirm or replace.]

**Interaction**

- **FR-016**: Cards MUST lift a few pixels with a deeper soft shadow on hover and on keyboard focus within, and return smoothly.
- **FR-017**: Buttons MUST show distinct hover, pressed and focus states, and buttons with an arrow MUST nudge it on hover.
- **FR-018**: Links and the main navigation MUST show a subtle animated underline on hover and for the current page, while the current page remains marked for assistive technology.
- **FR-019**: The footer MUST appear with a smooth, light reveal.
- **FR-020**: All motion MUST use a small shared set of durations and easing curves defined once, so timing feels consistent across the site.

**Quality**

- **FR-021**: Only movement, scale and opacity MAY be animated; layout MUST NOT shift during any reveal or interaction, and space for revealing elements MUST be reserved from the first paint.
- **FR-022**: Every animation MUST respect the reduced-motion preference: under it, content appears in its final state with no reveals, lifts, nudges or looping animation.
- **FR-023**: The site MUST work from 360px wide with no horizontal scroll at any width, with touch targets of at least 44px, visible focus, AA contrast for all text, exactly one main heading per page, and decorative motion hidden from assistive technology.
- **FR-024**: Pages MUST be rendered on the server by default, with client-side behaviour limited to the small pieces that need it (the shared reveal and any interaction that requires it).
- **FR-025**: No new dependencies MUST be added, and no new heavy images.
- **FR-026**: All existing checks from features 001 to 003 MUST keep passing, and the build and lint MUST be clean.

### Key Entities

- **Motion tokens**: The small shared set of durations, easing curves, stagger interval, stagger cap, rise distance and hover-lift distance used by every animation.
- **Reveal**: One shared behaviour with options (delay, stagger index, direction) applied to headings, cards and blocks.
- **Elevation levels**: A small named set of shadow depths (resting, raised, floating) used for cards and buttons.
- **Section tones**: The existing background tones (Paper, Soft Blue, Midnight) used in alternation, plus divider styles.
- **Trust strip facts**: A short list of plain facts, read through the content accessors like all other content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of home page sections below the hero and of inner-page content blocks reveal through the one shared behaviour, with no page-specific reveal animation.
- **SC-002**: Every revealed element ends fully visible and in its normal position in 100% of runs, including after fast scrolling, keyboard jumps, in-page links and reloads while scrolled.
- **SC-003**: In every page, zero elements flash hidden-then-shown when they are already in view at load.
- **SC-004**: Layout shift across every page, including the full scroll of the home page, stays at or below 0.05, with zero horizontal scroll at 360, 390, 768, 1024, 1440 and 1920px.
- **SC-005**: With reduced motion, and with JavaScript off, 100% of text, cards and links on every page are visible and no element animates.
- **SC-006**: The hero, the preloader and the hero-to-steps transition pass their existing comparison and check scripts unchanged (hero styles identical on every element; transition checks all passing).
- **SC-007**: Scrolling through each page on a mid-range phone-class device shows no visible stutter, and the mobile performance score of the home page is no worse than the baseline measured immediately before this feature, within run-to-run noise (the feature 003 baseline was never measured, so it is measured first).
- **SC-008**: Every animation on the site uses a duration and curve from the shared set; a review of all animated elements finds zero one-off values.
- **SC-009**: Every interactive element is reachable by keyboard with a visible focus indicator, every touch target is at least 44px, and every text and background pair meets AA contrast.
- **SC-010**: Screenshots at 1440x900 and 390x844 exist for every page, plus a scroll sequence showing reveals mid-way and settled for the home page and at least one inner page.
- **SC-011**: In a side-by-side review, the owner finds the inner pages visually consistent with the home page and the brand unchanged.

## Assumptions

- **Brand and constraints**: The constitution still applies in full (palette, fonts, mobile-first, accessibility, transform and opacity only, Server Components by default, no new dependencies). The design skill is used for guidance and its checklist only.
- **Hero extras**: The scroll cue and trust strip are defaults chosen for the owner and are flagged for confirmation. Trust-strip facts are limited to what the hero already says ("Hands-on learning", "Real projects") plus "In person or online" drawn from the programs content; no figures.
- **Reveal behaviour**: Elements reveal once. Stagger interval and cap, rise distance, durations and curves are fixed in planning and recorded as motion tokens.
- **Preloader**: Reveals for content in view when the preloader leaves start once it is gone.
- **Existing transition**: The feature 003 transition is treated as a fixed neighbour; new styling around "How it works" must not alter its measured positions.
- **Lighthouse**: No baseline exists for feature 003 (the run was not completed). A baseline is taken on the current build before any change here.
- **Out of scope**: New pages, new content or copy, forms, dark mode, new images or illustration, page transitions between routes, and any change to the hero or preloader.
- **Dependencies**: Builds on features 001 (shell and design system), 002 (preloader) and 003 (pages and transition).
