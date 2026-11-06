# Feature Specification: Our Way Page

**Feature Branch**: `016-our-way-page`
**Created**: 2026-11-06
**Status**: Draft
**Input**: User description: "Our Way page (/our-way)

Purpose: tell why Tareeq exists and how it teaches, so a school or parent trusts the approach. Voice: warm, direct, like a good teacher. No hype words.

Sections (copy in src/content/our-way.ts; placeholder copy marked for owner review; do not invent facts or numbers):
1. Opening: a large Urdu word "طریق" with the English line "Tareeq means 'the way'." and a one-line manifesto ("AI is learned by doing, not by watching.").
2. The problem: why most AI learning fails (tool tours, prompt tricks, no making). 2-3 short lines.
3. Our principles: 4 numbered principles (placeholders): Build every session · Understand before you trust · Real problems, local context · Teacher and learner, side by side (ustad-shagird).
4. How a session feels: a 3-step mini timeline (Try -> Make -> Reflect), linking visually to How it works without repeating it.
5. Vision and mission: two short statements side by side.
6. Closing: a link to the mentor section on the home page ("Meet your mentor") and the primary CTA "Book a workshop" (/workshop?book=1).

Signature visual: the path
- A thin saffron SVG path runs down the page, curving between sections, and draws itself as the user scrolls (stroke-dashoffset tied to scroll progress).
- Each section has a node on the path that fills when its section enters view.
- Desktop: the path weaves left/right between sections. Mobile: a straight line along the left edge with the nodes beside each heading.
- prefers-reduced-motion: the path is fully drawn and static, with no scroll animation.

UI:
- Editorial and spacious: oversized Sora headings, generous whitespace, alternating paper / navy sections.
- The Urdu word uses Noto Nastaliq Urdu via next/font, subset to only the characters used, lang="ur" and dir="rtl" on that element only. The rest of the page stays English/LTR.
- Principles appear as large numerals (saffron on navy; on paper, dark numerals with a saffron mark, per Principle III).
- Subtle entrance motion per section (fade and rise, once). Transform/opacity only.

Constraints: Server Component page. Client leaf only for the scroll path. Brand tokens, Sora/Inter, existing background. No new UI libraries. Per-page metadata and Open Graph. No horizontal scroll at 360px. Add Our Way to the nav if it is not already there.

Out of scope: admin editing, a blog."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand and trust the approach (Priority: P1)

A school leader or parent opens Our Way, usually on a phone, to decide whether Tareeq teaches AI in a way they can trust. They read, top to bottom, what the name means, why most AI learning fails, the principles Tareeq teaches by, how a session feels, and its vision and mission.

**Why this priority**: This is the purpose of the page. With only this story delivered, and no path or motion, the page already does its job.

**Independent Test**: Open `/our-way` at 360px with animation and scripts off. All six sections read in order and make sense.

**Acceptance Scenarios**:

1. **Given** a visitor opens the page, **When** the first screen shows, **Then** they see the large Urdu word "طریق", the line "Tareeq means 'the way'.", and the line "AI is learned by doing, not by watching."
2. **Given** a visitor reads on, **When** they reach "The problem", **Then** they see two or three short lines on why most AI learning fails, covering tool tours, prompt tricks and no making.
3. **Given** a visitor reaches the principles, **When** they read them, **Then** they see four numbered principles in order: Build every session; Understand before you trust; Real problems, local context; Teacher and learner, side by side (ustad-shagird).
4. **Given** a visitor reaches "How a session feels", **When** they read it, **Then** they see three steps in order, Try, Make and Reflect, shown in the same visual style as How it works on the home page and without repeating its words.
5. **Given** a visitor reaches vision and mission, **When** viewed at desktop width, **Then** the two short statements sit side by side; on narrower screens they stack.
6. **Given** any copy on the page, **When** it is checked against the source, **Then** it contains no hype words and no invented facts, numbers, people or testimonials.

---

### User Story 2 - Take the next step (Priority: P1)

A visitor who now trusts the approach wants to act: learn who teaches, or book a workshop.

**Why this priority**: The page must lead somewhere. Without this step the trust it builds goes unused.

**Independent Test**: Follow both closing links from the page and confirm where each one lands.

**Acceptance Scenarios**:

1. **Given** a visitor reaches the closing section, **When** they select "Meet your mentor", **Then** they land on the mentor section of the home page.
2. **Given** a visitor reaches the closing section, **When** they select "Book a workshop", **Then** they reach the workshop booking form at `/workshop?book=1`.
3. **Given** a visitor on any page, **When** they open the desktop or mobile navigation, **Then** Our Way is listed and leads to this page.
4. **Given** someone shares the page link, **When** it is previewed, **Then** the preview shows this page's own title and description.

---

### User Story 3 - See the way drawn as they read (Priority: P2)

As the visitor scrolls, a thin saffron line draws itself down the page, and a marker fills as each section arrives. The name of the company, "the way", becomes something they can see.

**Why this priority**: This is the page's signature and makes it memorable, but the message does not depend on it.

**Independent Test**: Scroll the page slowly down and back up at 390px and 1440px, and watch the line and markers.

**Acceptance Scenarios**:

1. **Given** a visitor at desktop width, **When** they scroll down, **Then** the line grows in step with their scrolling, curving left and right between sections without passing through text.
2. **Given** a visitor scrolls back up, **When** the scroll position decreases, **Then** the line shortens to match; markers already filled stay filled.
3. **Given** a section enters view, **When** its marker is reached, **Then** that marker fills.
4. **Given** a visitor below desktop width, **When** they view the page, **Then** the line is straight along the left edge, with each marker beside its section heading, and text does not overlap it.
5. **Given** a visitor who prefers reduced motion, **When** they open or scroll the page, **Then** the line is fully drawn, all markers are filled, and nothing on the path or in the sections moves.
6. **Given** a keyboard or screen-reader user, **When** they move through the page, **Then** the line and markers are never focused or announced, and they never block a click or tap.

---

### User Story 4 - Feel the craft of the page (Priority: P3)

The visitor experiences an editorial, spacious page: oversized headings, generous space, paper and navy sections taking turns, large principle numerals, and sections that gently fade and rise once.

**Why this priority**: The polish supports trust, but it comes after the message and the signature.

**Independent Test**: Review the page at 360, 390, 768, 1024 and 1440px against the acceptance scenarios.

**Acceptance Scenarios**:

1. **Given** the page at any width, **When** viewed section by section, **Then** paper and navy sections alternate and headings are clearly larger than on other inner pages.
2. **Given** a principle on a navy section, **When** viewed, **Then** its numeral is large and saffron. **Given** a principle on a paper section, **Then** its numeral is large and dark with a saffron mark; saffron is never used as text on a light background.
3. **Given** a section enters view for the first time, **When** motion is allowed, **Then** it fades and rises once and does not repeat when scrolled past again.

---

### Edge Cases

- **Scripts off or failing**: all content is visible, the line is fully drawn, and all markers are filled.
- **Page opened or reloaded partway down, or reached by a link to a section**: the line and markers match the current position on first paint after scripts load, with no visible replay from the top.
- **Fast scrolling or jumping to the top or bottom**: the line catches up without lag that looks broken, and every section passed has a filled marker.
- **Screen rotated or window resized, including across the desktop boundary**: the line redraws to fit the new layout and never causes horizontal scroll.
- **Sections change height** (long copy edits, late-loading fonts, browser text zoom to 200%): the line still reaches every marker, and markers still line up with their sections.
- **Urdu font slow or unavailable**: the word still shows in a fallback that supports Urdu script, stays right-to-left, and the page does not visibly jump when the font arrives.
- **Line crossing a paper and navy boundary**: the line stays visible on both backgrounds.
- **Very tall or very short screens**: the line can reach its full length by the bottom of the page, and the last marker fills.
- **Floating WhatsApp button and Our Way line on phones**: they do not overlap, and all touch targets stay at least 44px.
- **Mentor section missing from the home page**: this is treated as a defect and caught by checks; the link must not point to a section that does not exist.

## Requirements *(mandatory)*

### Functional Requirements

**Content**

- **FR-001**: The page at `/our-way` MUST show six sections in this order: Opening, The problem, Our principles, How a session feels, Vision and mission, Closing.
- **FR-002**: The Opening MUST show the Urdu word "طریق", the exact line "Tareeq means 'the way'.", and the exact line "AI is learned by doing, not by watching."
- **FR-003**: The problem section MUST have two or three short lines on why most AI learning fails, covering tool tours, prompt tricks and no making.
- **FR-004**: The principles section MUST show four numbered principles in the order given in the brief, each with a short supporting line.
- **FR-005**: How a session feels MUST show Try, Make and Reflect as a three-step timeline that echoes the look of How it works and does not repeat its copy.
- **FR-006**: Vision and mission MUST appear as two short statements, side by side at desktop width and stacked below it.
- **FR-007**: The Closing MUST link "Meet your mentor" to the home page's mentor section and "Book a workshop" to `/workshop?book=1`, with Book a workshop as the primary action.
- **FR-008**: All page copy MUST live in one content file, separate from the layout. Draft copy MUST be marked in that file for owner review and MUST NOT show any such marker to visitors.
- **FR-009**: Copy MUST be warm and direct, and MUST NOT contain hype words or invented facts, numbers, people or testimonials.
- **FR-010**: This page MUST replace the current Our Way content. The earlier story and "Who is behind Tareeq" blocks no longer appear on it.

**The path**

- **FR-011**: A thin saffron line MUST run down the page from the Opening to the Closing, and its drawn length MUST follow scroll progress in both directions.
- **FR-012**: Each of the six sections MUST have a marker on the line that fills when its section enters view and stays filled afterwards.
- **FR-013**: At desktop width (1024px and wider) the line MUST weave left and right between sections and MUST NOT cross text or controls.
- **FR-014**: Below desktop width the line MUST be straight along the left edge, with each marker beside its section heading, and page content MUST stay clear of it.
- **FR-015**: With reduced motion preferred, or scripts unavailable, the line MUST be fully drawn and static with all markers filled.
- **FR-016**: The line and markers MUST be decorative only: hidden from assistive technology, not focusable, and unable to intercept clicks or taps.

**Look and motion**

- **FR-017**: The page MUST use an editorial layout with oversized headings, generous whitespace, and alternating paper and navy sections, using only the site's brand colours and fonts, apart from FR-018.
- **FR-018**: The Urdu word MUST use a Nastaliq typeface, loading only the characters it needs, and MUST be the only part of the page marked as Urdu and right-to-left.
- **FR-019**: Principle numerals MUST be large. They MUST be saffron on navy, and dark with a saffron mark on paper.
- **FR-020**: Each section MUST fade and rise once on entering view, animating only movement and opacity, and MUST show immediately with no movement under reduced motion.

**Site integration and quality**

- **FR-021**: Our Way MUST remain in the desktop navigation, mobile navigation and footer.
- **FR-022**: The page MUST have its own title, description and social-sharing details.
- **FR-023**: The page MUST have exactly one main heading, a logical heading order, visible keyboard focus and AA contrast on both paper and navy sections.
- **FR-024**: The page MUST NOT scroll horizontally at any width from 360px up, and all links MUST have touch targets of at least 44px.
- **FR-025**: Only the scroll-driven line and markers MAY depend on browser scripting; all page content MUST be delivered in the initial page.
- **FR-026**: The feature MUST NOT add a new interface library.

### Key Entities

- **Our Way copy**: the text of the six sections, including the Urdu word and its meaning, the manifesto, problem lines, four principles (number, title, supporting line), three session steps (name, short line), vision and mission statements, and the closing links' labels. It has a draft status for owner review.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With scripts and motion off at 360px, all six sections and both closing links are readable and usable.
- **SC-002**: Both closing links reach the correct destination on the first try, in 100% of checks at 390px and 1440px.
- **SC-003**: At 360, 390, 768, 1024 and 1440px there is no horizontal scroll at any scroll position, and the line overlaps no text or control.
- **SC-004**: After scrolling from top to bottom, the line is fully drawn and six of six markers are filled at each of those widths.
- **SC-005**: With reduced motion preferred, nothing moves while scrolling, and the line and all six markers are complete from the first paint.
- **SC-006**: On a mobile Lighthouse audit, the page scores Accessibility 95+, SEO 90+ and Performance 90+, and its layout shift score is under 0.1.
- **SC-007**: A scan of the page finds no banned hype words, and the owner has reviewed every item marked as draft before launch.
- **SC-008**: Shown the page, a parent or school leader can say in their own words, in about a minute, what "Tareeq" means and how Tareeq teaches.

## Assumptions

- **Our Way is already linked** in the navigation and footer, so FR-021 needs a check and no change. Its route already exists and its content is replaced.
- **The main heading** is the English line "Tareeq means 'the way'.", which gives search engines and screen readers a clear page title. The Urdu word is visually the largest element.
- **"Linking visually to How it works"** means a shared look, with no added link to that section. Only the two closing links are required.
- **Vision and mission copy** starts from the existing draft statements on this page, shortened if needed, instead of new wording. All wording stays draft until the owner confirms it.
- **The draft marker** is a note in the content file, matching how other draft copy in this project is marked.
- **"Existing background"** means the site's current page background and paper tone, with the navy sections from the brand palette.
- **The Urdu typeface** is an owner-approved exception to the Sora and Inter font rule, limited to this one word.
- **Markers stay filled** on scrolling back up, matching the "once" behaviour of the section entrance. The line itself follows scroll in both directions, as the brief ties it to scroll progress.
- **Social sharing** uses the site's existing share image, with this page's own title and description; no new image is created.
- **Performance measurement**: other pages on this site currently score below 90 on Performance in local testing, so the plan must set how SC-006 is measured for a fair result.

### Constraints from the brief

These are technical choices made by the owner, recorded here so they carry into the plan:

- Copy in `src/content/our-way.ts`.
- Server Component page, with a client leaf only for the scroll path.
- Path drawn as an SVG with `stroke-dashoffset` tied to scroll progress.
- Urdu word in Noto Nastaliq Urdu through `next/font`, subset to the characters used, with `lang="ur"` and `dir="rtl"` on that element only.
- Sora and Inter, brand tokens, and motion limited to `transform` and `opacity`.

### Dependencies

- The mentor section on the home page, reachable at `/#mentor`.
- The workshop booking form at `/workshop?book=1`.
- The look of the How it works section, which the timeline echoes.
- Existing automated page checks that describe the current Our Way content will need updating to match.

## Out of Scope

- Admin editing of this page's content.
- A blog.
- Any change to the home page, How it works, the mentor section or the hero.
- Naming the team, or adding biographies, photos or statistics.
