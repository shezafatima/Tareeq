# Feature Specification: "Why Tareeq" Section and New Home Page Order

**Feature Branch**: `008-why-tareeq-section`
**Created**: 2026-11-04
**Status**: Draft
**Input**: User description: "Home: the \"Why Tareeq\" section, and a new home page order. New order: Hero, Programs, Why Tareeq, How it works, Who it's for, Final call to action; Programs is directly after the hero. Why Tareeq uses the same UI as How it works, mirrored: the robot (the new how-it-works.png) stands on the straight light blue card with the tilted saffron card behind it, with the same breathing animation, but on the other side (the right); on the opposite side is a navy blue card with white text holding four points (01 Learn by Doing, 02 Skills That Matter, 03 Learning for Everyone, 04 Create with Confidence, with the owner's wording). Modern icons for the points and some saffron decorative illustrations or vectors, brand tokens only. Mobile first from 360px, accessible, reduced motion respected, server rendered with client code only for the breathing, transform and opacity animation only, no new dependencies, hero untouched. Feature 007 (How it works) is paused and unmerged; this feature starts from that work because it reuses its robot UI." (full text recorded in the PHR for this spec)

## Clarifications

### Session 2026-11-04

- Q: What should the home page order be, and what happens to "How it works" and "Who it's for"? -> A: **Owner decision:** Hero, Programs, Why Tareeq, How it works, Who it's for, Final call to action. Programs is directly after the hero; the other two sections move down but stay on the page.
- Q: What about feature 007 (How it works), which is built and checked but unmerged? -> A: **Owner decision:** 007 is paused (saved as a work-in-progress commit on its own branch) and resumes later. This feature starts from that work because Why Tareeq reuses its robot, cards and breathing, and is merged after 007.
- Q: Which side is the robot on? -> A: **Owner decision:** the opposite of How it works. How it works has the robot on the left, so Why Tareeq has the robot on the **right** and the navy card on the left (from 1024px up).
- Q: What happens to 007's hero-to-section card travel now that How it works no longer sits right after the hero? -> A: **Deferred to this feature's plan (owner decision).** Whatever the plan decides, the hero must look and behave exactly as it does today, and How it works keeps its own robot, carousel and flip cards.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The visitor reads why Tareeq is different (Priority: P1)

After the Programs section the visitor reaches "Why Tareeq". On one side a navy blue card with white text lists four points, each with a number, a modern icon, a short title and one sentence. On the other side the Tareeq robot stands on a light blue card with a saffron card tilted behind it, gently breathing. The section looks like a mirror of "How it works", so the page feels like one design.

**Why this priority**: This is the new content and the main visual of the request.

**Independent Test**: Open the home page at 1440×900 and 390×844, scroll to the section, and check the four points, the robot, the cards and the breathing.

**Acceptance Scenarios**:

1. **Given** the home page, **When** the visitor scrolls past Programs, **Then** they see "Why Tareeq" with a navy card (white text) holding four points numbered 01 to 04 in the owner's wording.
2. **Given** a screen 1024px or wider, **When** the section is viewed, **Then** the robot, standing on the straight light blue card with the tilted saffron card behind it, is on the left and the navy card is on the right (owner decision after build).
3. **Given** the robot in this section, **When** it is watched, **Then** it breathes exactly as in "How it works" (a loop of about 4 seconds, a swell of at most 2% and a few pixels of lift, anchored at the feet), with the two cards pulsing in step.
4. **Given** each of the four points, **When** it is read, **Then** it shows its number, a modern icon, its title and its sentence, with the saffron used for the number and the icon accent, and all text is easy to read on the navy card.
5. **Given** the section, **When** it is looked at, **Then** some saffron decorative illustrations or vectors frame the navy card and the robot without covering any text.

---

### User Story 2 - The page reads in the new order (Priority: P1)

The home page now runs: Hero, Programs, Why Tareeq, How it works, Who it's for, Final call to action. The small scroll cue under the hero leads to Programs, which sits directly after the hero.

**Why this priority**: The order change is explicit in the request and affects what every visitor sees first after the hero.

**Independent Test**: Load the home page and list the section headings in order; click the scroll cue under the hero.

**Acceptance Scenarios**:

1. **Given** the home page, **When** the section headings are listed, **Then** they appear in the order Programs, Why Tareeq, How it works, Who it's for (with the hero first and the final call to action last).
2. **Given** the hero, **When** the visitor activates the scroll cue below it, **Then** the page scrolls to Programs.
3. **Given** the hero, **When** the page is at the top, **Then** it looks and behaves exactly as it does today.
4. **Given** "How it works", **When** it is viewed in its new position, **Then** its robot, carousel and flip cards still work.

---

### User Story 3 - Phones, reduced motion and no scripts (Priority: P2)

On a phone the section is stacked and complete, with no sideways scrolling at 360px. With reduced motion the robot and cards are still. Without scripts the whole section is readable.

**Why this priority**: Most visitors are on mid-range phones, and some need motion off. The section must be complete in those cases.

**Independent Test**: View the section at 360×740 and 390×844, with reduced motion on, and with scripts disabled.

**Acceptance Scenarios**:

1. **Given** a screen under 1024px wide, **When** the section is viewed, **Then** it is stacked (heading, robot with its cards, then the navy card, the same order as "How it works") and nothing scrolls sideways from 360px.
2. **Given** reduced motion, **When** the section is viewed, **Then** the robot and both cards are still.
3. **Given** scripts unavailable, **When** the section is viewed, **Then** all four points, the robot and the cards are visible and readable.

---

### User Story 4 - Modern icons and saffron illustrations (Priority: P3)

Each point has a modern icon in the same clean line style as the rest of the site, and a few saffron vector accents (for example sparkles, curves or dots) add warmth around the navy card and the robot.

**Why this priority**: It gives the section its character, but the points work without it.

**Independent Test**: Look at the section at both sizes; check that icons and illustrations are present, hidden from assistive technology, use only brand colours and never overlap text.

**Acceptance Scenarios**:

1. **Given** the four points, **When** they are viewed, **Then** each has a different icon that suits its meaning (hands-on doing, skills and thinking, people, confidence and creating) in one consistent style.
2. **Given** the illustrations, **When** they are inspected, **Then** they are decorative (ignored by screen readers), use only brand colours, and never cover or crowd text.

### Edge Cases

- **Large text (200% zoom) or long wording in future**: the navy card grows to fit its text and never clips or overlaps the illustrations or the robot.
- **Narrow phones (360px)**: the navy card, icons and numbers wrap cleanly and the robot and cards stay inside the screen width.
- **Robot image slow or failing**: space is reserved so nothing jumps, and its description still conveys it. The same image file is used by "How it works", so it is downloaded once.
- **Reduced motion or no scripts**: no part of the section depends on motion to be understood.
- **Scroll cue**: it leads to the section that is now directly below the hero (Programs), not to a section that has moved.
- **Links to "How it works"** (for example an address ending in `#how-it-works`): still land on that section in its new position.
- **Programs and "Who it's for" content**: unchanged; only their position changes.

## Requirements *(mandatory)*

### Functional Requirements

**Page order**

- **FR-001**: The home page MUST show its sections in this order: Hero, Programs, Why Tareeq, How it works, Who it's for, Final call to action.
- **FR-002**: Programs MUST sit directly after the hero (the hero's own small scroll cue and facts strip may stay between them, as today).
- **FR-003**: The scroll cue below the hero MUST lead to Programs.
- **FR-004**: The hero MUST look and behave exactly as it does today at every width. This feature MUST NOT edit the hero or the other protected files.
- **FR-005**: "How it works" MUST keep its own robot, carousel and flip cards working in its new position. What happens to feature 007's hero-to-section card travel is decided in the plan, and MUST NOT change the hero.

**Why Tareeq: content and layout**

- **FR-006**: The section MUST show the heading "Why Tareeq" and a navy blue card with white text holding exactly four points, in this order and wording (owner copy):
  - 01 Learn by Doing: Go beyond theory with hands-on activities, practical projects, and real-world applications.
  - 02 Skills That Matter: Develop AI literacy, creativity, critical thinking, and problem-solving skills.
  - 03 Learning for Everyone: Practical AI education designed for students, teachers, professionals, and organizations.
  - 04 Create with Confidence: Learn to use AI responsibly, transform ideas into solutions, and prepare for what's next.
- **FR-007**: Each point MUST show its number, a modern icon, its title and its sentence. The four icons MUST be different, share one consistent line style, and suit their points.
- **FR-008**: From 1024px the section MUST be two columns with the robot on the left and the navy card on the right (owner decision after build). Below 1024px it MUST be stacked as heading, navy card, then robot, with the points centred in the card.
- **FR-009**: The robot MUST be the new `how-it-works.png`, standing on the straight light blue card with the tilted saffron card behind it, exactly as in "How it works". It MUST NOT be mirrored or flipped.
- **FR-010**: The robot and its cards MUST breathe exactly as in "How it works": a loop of about 4 seconds, a swell of at most 2%, 4 to 6px of lift, anchored at the feet, with the cards pulsing in step; they MUST run only while the section is on screen and be still under reduced motion.
- **FR-011**: The robot with its cards and breathing MUST be one shared piece used by both sections (only the side differs), so the two cannot drift apart.
- **FR-012**: Saffron decorative illustrations or vectors MUST frame the navy card and the robot. They MUST be decorative (hidden from assistive technology), use brand colours only, and never cover or crowd text.
- **FR-013**: The wording of the four points MUST come from one place for owner review, not from the section's markup, and any wording that is not the owner's (the section's one-line intro) MUST be marked as a draft. The previous four principles are replaced.

**Constraints**

- **FR-014**: The section MUST be complete and correct on a 360px phone with no sideways scrolling, with all text at WCAG AA contrast (white and saffron on the navy), visible focus on anything focusable, and one heading level used correctly under the page heading.
- **FR-015**: The section MUST be rendered on the server; client-side code is limited to the breathing, and only `transform` and `opacity` may animate.
- **FR-016**: The section's height MUST be known before it loads (no layout shift), and the robot image MUST load lazily with its size declared.
- **FR-017**: No new colours, no new dependencies, no icon library: the icons and illustrations are drawn in the site's existing style.

### Key Entities

- **Why Tareeq point**: One of the four reasons. Attributes: number (01 to 04), title, one sentence, icon. Kept in one place, in order.
- **Section copy**: The heading "Why Tareeq" and a one-line intro (draft).
- **Decorative illustration**: A saffron vector accent. No content, hidden from assistive technology.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At 1440×900 and 390×844 the home page's section headings read, in order: Programs, Why Tareeq, How it works, Who it's for.
- **SC-002**: The four points appear with exactly the owner's numbers, titles and sentences, each with an icon, and the four icons are visibly different.
- **SC-003**: At 1024px and wider the navy card is left of the robot; in "How it works" the robot is left of its content; the two sections are mirror images.
- **SC-004**: The robot's breathing loop measures about 4 seconds (within half a second), stays within 2% scale and 4 to 6px of lift, runs only while the section is on screen, and is not running with reduced motion.
- **SC-005**: Every piece of text on the navy card measures at least 4.5:1 contrast (large text 3:1), and the decorative illustrations never overlap any text.
- **SC-006**: There is no horizontal scrolling at 360, 390, 768, 1024 and 1440px wide.
- **SC-007**: The hero matches its original appearance and positions at 1440×900 and 390×844, and the hero guard check passes.
- **SC-008**: The scroll cue below the hero brings Programs into view.
- **SC-009**: The robot image is requested once for the page (both sections share it), and the home page's Lighthouse mobile score stays within noise of a back-to-back run of the page before this feature, with accessibility at 100 and no layout shift from the section.
- **SC-010**: With scripts disabled, all four points and the robot are visible; with reduced motion, nothing in the section moves; there are no console errors.

## Scope

**In scope**: the new "Why Tareeq" section (content, navy card, icons, saffron illustrations, mirrored robot with cards and breathing), the new home page order, the scroll cue target, and sharing the robot-with-cards piece between the two sections.

**Out of scope**: the Programs content, the "Who it's for" content, the hero, finishing feature 007 (it resumes later), other pages.

## Dependencies

- **Feature 007** (How it works): its robot image, card shapes and breathing component are the base this feature reuses. 007 is unmerged and paused on its own branch; this feature's branch starts from that work and merges after it.
- The new `public/how-it-works.png` (408×612), already in the project.
- Constitution Principle VIII: the hero and protected files stay untouched.

## Assumptions

- The home page keeps its small scroll cue and facts strip directly under the hero as part of the hero's surroundings; "Programs directly after the hero" means no full section sits between them.
- The four points sit together in **one** navy card (not four separate cards), as one block of numbered rows.
- The heading stays "Why Tareeq" and keeps its existing one-line intro as a draft ("A simple way of teaching, kept simple on purpose."); only the owner supplied the four points.
- Icon subjects (drafts): Learn by Doing = hands-on tools or a spark, Skills That Matter = a lightbulb or brain, Learning for Everyone = people, Create with Confidence = a shield with a check or a rocket. They are drawn in the existing inline style (24px grid, 2px stroke, rounded), not taken from a library.
- Saffron decoration (drafts): a few sparkles, a curved line and dots near the navy card's corners and behind the robot's area, using the saffron token only.
- In the stacked layout the order is heading, robot with its cards, navy card (the same as "How it works"), so the two sections behave alike on phones.
- The section's background alternates with its neighbours using existing tones, chosen in the plan.
- The hero's second button ("How it works") currently points nowhere; fixing it would mean editing the hero, so it is left as is and noted for the owner.
