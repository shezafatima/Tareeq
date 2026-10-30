# Feature Specification: Site Shell and Design System

**Feature Branch**: `001-site-shell-design-system`
**Created**: 2026-10-29
**Status**: Draft
**Input**: User description: "Site shell and design system. Build the shared foundation every page of the Tareeq website sits inside: design tokens, Header with separate mobile and desktop navigation, Footer, floating WhatsApp button, shared UI components (Button, Card, SectionHeading, Field, Container), and placeholder pages for Programs, Courses, About and Contact. The hero section already exists and must not be changed."

## Clarifications

### Session 2026-10-29

- Q: Should the mobile menu be a full-screen panel or a slide-in panel? → A: Changed 2026-10-29 from full-screen to a slide-in sidebar from the right with a translucent "glass" (blurred) background, small blue links, a plain "Book a workshop" button, a smaller logo and a visible close button. Tapping outside it also closes it.
- Q: Where does the "Book a workshop" button go for now? → A: The Contact page, changeable in one place when a sign-up page exists.
- Q: What should the header button say? → A: "Book a workshop" (the original brief said "Join a workshop"; changed by the user 2026-10-29).
- Q: Which logo does the header and footer use? → A: The user's image logo, `public/logo.png`, in both places (changed 2026-10-29 from the earlier coded wordmark). The original file is kept; cropped transparent copies (`public/logo-tareeq.png`, and a light version for Midnight surfaces `public/logo-tareeq-light.png`) are what the pages show.
- Q: Does the header stay pinned while scrolling? → A: Yes, it stays sticky as it is today, because the signed-off hero is sized around it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find my way around on a phone (Priority: P1)

A teacher on a mid-range phone opens the site and wants to reach Programs, Courses, About or Contact, or join a workshop. They open the menu, pick a page, and land on it with the menu closed.

**Why this priority**: Most visitors are on phones. Without working navigation no other page is reachable.

**Independent Test**: At 360px width, open the menu, tap each link in turn, and confirm each page loads and the menu closes. Repeat using only a keyboard.

**Acceptance Scenarios**:

1. **Given** a visitor on a 360px-wide screen, **When** they open the menu, **Then** a full-height sidebar slides in from the right with a translucent, blurred background and a visible close button, listing Programs, Courses, About, Contact and a "Book a workshop" button.
2. **Given** the menu is open, **When** the visitor taps a link, **Then** the menu closes and the chosen page is shown.
3. **Given** the menu is open, **When** the visitor presses Escape, **Then** the menu closes and focus returns to the button that opened it.
4. **Given** the menu is open, **When** the visitor presses Tab or Shift+Tab repeatedly, **Then** focus cycles only among controls inside the menu.
5. **Given** the menu is open, **When** the visitor tries to scroll, **Then** the page behind the menu does not move.
6. **Given** the menu is open, **When** the visitor taps the dimmed area outside the sidebar, **Then** the menu closes.

---

### User Story 2 - Navigate on a laptop (Priority: P1)

A school coordinator on a laptop sees the main links and the "Book a workshop" button in the header at all times, without opening a menu.

**Why this priority**: Equal in importance to mobile; the same Header must serve both.

**Independent Test**: At 1440px width, confirm all four links and the button are visible in the header, no menu button is shown, and each link works.

**Acceptance Scenarios**:

1. **Given** a wide screen, **When** any page loads, **Then** the header shows the "tareeq" logo with its saffron chevron, the four links and the "Book a workshop" button inline.
2. **Given** a wide screen, **When** the visitor tabs through the header, **Then** each item receives a clearly visible focus indicator in a logical order.
3. **Given** the visitor is on one of the four pages, **When** they look at the header, **Then** the link for the current page is visually and programmatically marked as current.

---

### User Story 3 - Reach the team on WhatsApp (Priority: P2)

A parent or teacher with a question taps the floating WhatsApp button, which opens a chat with the Tareeq team and a short message already typed.

**Why this priority**: WhatsApp is the main way people in Pakistan will contact the team; it must work from every page.

**Independent Test**: On each page, confirm the button is visible at the bottom right, does not cover page content permanently or the footer links, and opens a chat with the prefilled message.

**Acceptance Scenarios**:

1. **Given** any page, **When** it loads, **Then** a WhatsApp button is visible fixed at the bottom right.
2. **Given** the button is visible, **When** the visitor activates it, **Then** WhatsApp opens a chat with the configured number and the prefilled message.
3. **Given** the number has not been configured, **When** the site runs, **Then** the button is not shown and no broken link is exposed.

---

### User Story 4 - Find contact details and links in the footer (Priority: P2)

A visitor scrolls to the bottom of any page and finds the logo, tagline "AI, the practical way.", navigation links, contact details, social links and a copyright line.

**Why this priority**: Gives every page a trustworthy ending and a second route to every section.

**Independent Test**: Load each page, scroll to the bottom, and confirm all footer parts are present, readable at 360px and 1440px, and every link works.

**Acceptance Scenarios**:

1. **Given** any page, **When** the visitor reaches the bottom, **Then** the footer shows the logo, tagline, navigation links, contact details, social links and copyright.
2. **Given** a 360px screen, **When** the footer is shown, **Then** its content stacks without horizontal scroll and every link has a touch target of at least 44px.

---

### User Story 5 - Build later pages from shared parts (Priority: P3)

A team member building the next page assembles it from the shared Button, Card, SectionHeading, Field and Container, with colours, fonts and spacing that already match the brand.

**Why this priority**: Pays off across all later features, but visitors do not see it directly.

**Independent Test**: Place each shared component on a test page and confirm every variant renders correctly at 360px and 1440px, using only brand values.

**Acceptance Scenarios**:

1. **Given** the Button, **When** used as primary or secondary in each available size, **Then** each looks distinct, has a touch target of at least 44px and a visible focus state.
2. **Given** a Field with a label, **When** it shows help text or an error, **Then** the label, help text and error are tied to the input and announced to assistive technology.
3. **Given** a Card, SectionHeading or Container, **When** used on a page, **Then** it aligns to the shared page width and spacing.

---

### User Story 6 - Placeholder pages so nothing is broken (Priority: P3)

Until the real content exists, Programs, Courses, About and Contact each show a heading and a short "coming soon" line inside the full site shell.

**Why this priority**: Prevents dead links while the rest of the site is built.

**Independent Test**: Follow every navigation and footer link and confirm none leads to an error page.

**Acceptance Scenarios**:

1. **Given** any of the four pages, **When** it loads, **Then** it shows exactly one main heading, a short "coming soon" line, the header, the footer and the WhatsApp button.

---

### Edge Cases

- A visitor opens the menu then resizes or rotates the device to a wide width: the menu must close and scroll must be restored.
- A visitor opens the menu, then uses the browser Back button: the menu must not stay open on the previous page.
- A visitor has reduced-motion enabled: menu open/close and any hover effects must not animate movement.
- A very long translated or user-zoomed (200%) text: header and footer must not overflow horizontally.
- The WhatsApp number is missing or malformed: the button is hidden and nothing breaks.
- Contact details or social links have not been supplied: the footer shows only the items that exist and never invents placeholders.
- The WhatsApp button overlaps the last footer links or form buttons on small screens: content must remain reachable.
- Keyboard user presses Tab past the last menu control: focus wraps within the menu instead of escaping behind it.

## Requirements *(mandatory)*

### Functional Requirements

**Design tokens**

- **FR-001**: The site MUST define one shared set of brand values for colour (Midnight #0D1B3D, Royal Blue #1E3A8A, Sky Blue #2563EB, Saffron #F2A93B, Paper #FAF7F2, Soft Blue #E6F0FF), type (Sora for headings, Inter for body), spacing and corner radius.
- **FR-002**: Every component built in this feature MUST take its colours, fonts, spacing and radii from those shared values, with no hardcoded values.
- **FR-003**: Saffron MUST NOT be used as text on a light background, and Sky Blue MUST be used only for links and small icons.

**Header and navigation**

- **FR-004**: Every page MUST show one header containing the "tareeq" logo image (wordmark with its saffron chevron), links to Programs, Courses, About and Contact, and a "Book a workshop" button.
- **FR-005**: The logo MUST link to the home page.
- **FR-006**: On narrow screens the header MUST show a menu button that opens the navigation as a slide-in sidebar from the right (translucent, blurred background, small blue links, visible close button); on wide screens it MUST show the links inline. These two navigations MUST be separate components used by the one header.
- **FR-007**: The menu button MUST expose whether the menu is open or closed to assistive technology.
- **FR-008**: While the menu is open it MUST close on link activation and on Escape, keep keyboard focus inside the panel, and stop the page behind it from scrolling. On closing, focus MUST return to the menu button and page scrolling MUST be restored.
- **FR-009**: The link for the current page MUST be marked as current.
- **FR-010**: The "Book a workshop" button's destination is the Contact page until a dedicated sign-up page exists, and it MUST be defined in one place so it can be changed without touching the header or menu.
- **FR-011**: The header MUST stay pinned to the top while scrolling, with its current height unchanged, so the hero's layout is unaffected. The header MUST also stay usable with a 44px minimum touch target for every control.

**Footer**

- **FR-012**: Every page MUST end with a footer containing the logo, the tagline "AI, the practical way.", navigation links to the four pages, contact details, social links and a copyright line.
- **FR-013**: Contact details and social links MUST come from a single editable place, and the footer MUST show only entries that have been supplied.

**WhatsApp button**

- **FR-014**: Every page MUST show a floating WhatsApp button fixed at the bottom right.
- **FR-015**: Activating it MUST open a WhatsApp chat with the configured number and a prefilled message.
- **FR-016**: The number MUST be read from site configuration outside the code, not written into components. If it is absent or invalid the button MUST NOT be shown.
- **FR-017**: The button MUST have an accessible name describing its action and open the chat in a way that does not lose the visitor's place on the site.

**Shared UI components**

- **FR-018**: A Button MUST offer primary and secondary styles and at least two sizes, and work as both a link and an action button.
- **FR-019**: A Card MUST provide a consistent surface (background, radius, padding) for grouped content.
- **FR-020**: A SectionHeading MUST provide a consistent heading (with optional short intro line) and let the page choose the heading level, so each page keeps exactly one main heading.
- **FR-021**: A Field MUST provide a visible label, an input, optional help text and an error message, all programmatically tied to the input, with errors announced to assistive technology.
- **FR-022**: A Container MUST give all content one shared maximum width and side padding, with at least 16px side padding on a 360px screen.

**Placeholder pages**

- **FR-023**: Programs, Courses, About and Contact pages MUST exist, each with one main heading and a short "coming soon" line, in plain, warm language without hype words.

**Quality requirements**

- **FR-024**: All pages MUST work from 360px upward with no horizontal scroll at any width.
- **FR-025**: All interactive elements MUST be reachable and operable by keyboard with a visible focus indicator.
- **FR-026**: Text and interface elements MUST meet WCAG AA contrast.
- **FR-027**: Pages MUST use semantic landmarks (header, navigation, main, footer) and have exactly one main heading.
- **FR-028**: Motion MUST be disabled or reduced when the visitor's device asks for reduced motion; decorative motion MUST be hidden from assistive technology.
- **FR-029**: The existing hero section MUST NOT be changed in appearance or behaviour. If a shared change here would affect it, that MUST be raised and approved before it is made.
- **FR-030**: No personal data is collected or logged by this feature.

### Key Entities

- **Design token**: A named brand value (colour, font, spacing step, corner radius) shared by all components.
- **Navigation item**: A label and destination, defined once and used by the header, mobile menu and footer.
- **Site contact info**: The WhatsApp number and prefilled message, contact details and social links, stored in one place outside the components.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a 360px screen, a visitor can open the menu and reach any of the four pages in two taps or fewer.
- **SC-002**: A keyboard-only user can reach and use every header, menu, footer and WhatsApp control, and can close the menu with one key press.
- **SC-003**: No horizontal scroll appears on any page at widths from 360px to 1920px, including at 200% text zoom.
- **SC-004**: 100% of the links in the header, menu and footer lead to a working page.
- **SC-005**: Every control has a touch target of at least 44px, and all text meets AA contrast.
- **SC-006**: On every page, mobile Lighthouse scores are Performance 90+, Accessibility 95+ and SEO 90+.
- **SC-007**: A reviewer inspecting the components finds no hardcoded colour, font or spacing values.
- **SC-008**: With reduced motion on, no movement animation plays anywhere in the shell.
- **SC-009**: The hero section looks and behaves identically before and after this feature, confirmed side by side at 390px and 1440px.

## Assumptions

- The home page and its hero section already exist; this feature wraps them in the header, footer and WhatsApp button without altering them.
- The logo is the user's image `public/logo.png`. Because that file is a wide opaque image with a lot of empty margin, the site shows a cropped, transparent copy of it (plus a light copy for dark surfaces). The original file is not modified. No new logo is drawn.
- A header, a floating WhatsApp button and the hero already exist on the home page. This feature extends them (working links, mobile menu, footer, shared parts) and moves them into every page; their current look is kept.
- "Book a workshop" points to the Contact page for now (FR-010), since no sign-up page is specified.
- Contact details and social links were not provided. They will be added by the team in the single editable place; until then the footer omits them rather than showing made-up values.
- The prefilled WhatsApp message will be a short, neutral greeting (for example, asking about a workshop); the exact wording can be adjusted later.
- Copyright shows the current year and "Tareeq".
- The site is English-only for now; right-to-left or Urdu layouts are out of scope.

## Out of Scope

- Real content for Programs, Courses, About and Contact.
- The contact form, workshop sign-up and any admin pages.
- Any change to the hero section.
- Analytics, cookie banners and search.
