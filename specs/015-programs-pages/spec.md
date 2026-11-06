# Feature Specification: Programs Pages (Database-Driven)

**Feature Branch**: `015-programs-pages`
**Created**: 2026-11-05
**Status**: Draft
**Input**: User description: "Programs page (database-driven). The home Programs section and two new pages (/programs index, /programs/[slug] detail) read programs from one stored source through one data function. Static program content is removed once seeded. Admin CRUD, auth, image upload and payments are out of scope." The full brief is recorded verbatim in `history/prompts/015-programs-pages/1-programs-pages-spec.spec.prompt.md`.

> **Owner changes during implementation (2026-11-06)**: online learners are served by Courses, a separate future feature, so "Online courses" is a fixed card rather than a stored program (FR-029 to FR-031). The Contact page is removed and the footer is the only place for contact details (FR-032 to FR-035).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find the program that fits me (Priority: P1)

A teacher, student or team lead opens /programs. A bold heading ("Pick your way in.") and one line of text sit above audience chips: All, Teachers, Students, College, Online, Corporate. Below, each program is a numbered full-width panel showing its title, audience tag, status, up to three facts, its call to action and "View program". They tap a chip, and the list narrows instantly. The address changes (for example `?for=teachers`), so they can send that exact view to a colleague.

**Why this priority**: This is the page's job: getting each visitor to the program meant for them. It replaces the current /programs page and is usable by itself.

**Independent Test**: With seeded programs, open /programs, use each chip, reload a filtered address and open it in a new tab.

**Acceptance Scenarios**:

1. **Given** the page is open, **When** the visitor picks "Teachers", **Then** only teacher programs remain, with no page reload, and the address reads `?for=teachers`.
2. **Given** someone opens a link ending `?for=teachers`, **When** the page loads, **Then** the "Teachers" chip is selected and only teacher programs are listed.
3. **Given** a filter is active, **When** the visitor picks "All", **Then** every published program returns and `for` leaves the address.
4. **Given** the full list, **When** it is displayed, **Then** programs are numbered 01, 02, ... in order, surfaces alternate navy and paper, coming-soon programs come after the others and are visibly quieter while still meeting AA contrast, and the fixed Online courses card comes last with no number.
5. **Given** a filter leaves fewer panels, **When** they are displayed, **Then** numbering and alternating surfaces follow the visible order, starting again at 01.
6. **Given** a filter with no programs, **When** it is selected, **Then** a short message and a way back to "All" are shown instead of an empty space.
7. **Given** a phone-width screen, **When** the page is displayed, **Then** programs are stacked cards with no hover reveal and no horizontal scroll, and chips and links have touch targets of at least 44px.
8. **Given** a pointer device, **When** a panel is hovered or a control inside it has keyboard focus, **Then** the panel expands slightly without moving anything around it, the cover image or brand pattern reveals on the right, and the number takes its saffron state.

---

### User Story 2 - Read a program and act on it (Priority: P1)

From a panel, the visitor opens a program's own page. An immersive header gives the title, summary, status and the cover image (or a brand gradient pattern). The body gives the description, "You'll leave with" outcomes, the curriculum as a vertical timeline and a grid of facts. A booking card stays in view on desktop with the price text, facts and call to action; on a phone this is a bar fixed to the bottom of the screen.

**Why this priority**: The detail page is where a visitor decides. Every call to action on the site's program pages ends here or leads to the same three actions.

**Independent Test**: Open each seeded program's page at phone and desktop widths and follow its call to action.

**Acceptance Scenarios**:

1. **Given** a program whose call-to-action type is workshop booking, **When** the visitor activates it, **Then** the existing workshop booking dialog opens.
2. **Given** a program whose type is register, **When** the visitor activates it, **Then** they arrive at /register.
3. **Given** a program whose type is WhatsApp, **When** the visitor activates it, **Then** WhatsApp opens with a message prefilled with the program's title and no personal data.
4. **Given** a desktop screen, **When** the visitor scrolls the body, **Then** the booking card stays in view and never covers body content.
5. **Given** a phone screen, **When** the visitor scrolls, **Then** the bottom bar stays in view, does not cover the last of the page content, and does not overlap the floating WhatsApp button.
6. **Given** a program with no cover image, **When** the header is displayed, **Then** the brand gradient pattern appears instead.
7. **Given** an unpublished or unknown address, **When** it is requested, **Then** the site's 404 page appears.
8. **Given** a program page is shared, **When** a link preview is generated, **Then** it shows that program's own title, summary and image data.

---

### User Story 3 - Home and program pages always agree (Priority: P1)

The team changes a program once, in one place, and the home page, the index and the detail page all show the change. Today two separate static lists disagree with each other. Visitors to the home page see the same section as before: only programs they can act on now, plus "See all programs".

**Why this priority**: A single source of truth is the reason for this feature and what makes the later admin feature possible.

**Independent Test**: Run the seed, change one stored program's title, mark it for refresh, and check all three places. Search the codebase to confirm no page reads a static program list.

**Acceptance Scenarios**:

1. **Given** the seed has run, **When** the home page is displayed, **Then** the same three cards appear (two stored programs and the fixed Online courses card), with the same titles, audience lines, facts and calls to action, and coming-soon programs stay hidden there.
2. **Given** a stored program changes and its refresh tag is triggered, **When** any of the three places is next visited, **Then** it shows the new content.
3. **Given** a program is marked unpublished and refreshed, **When** visitors look for it, **Then** it is gone from home and index, and its address gives a 404.
4. **Given** the static program files are removed, **When** the site is built, **Then** the build succeeds and every program surface still works.

---

### User Story 4 - Load the current programs safely (Priority: P2)

Someone setting up an environment runs one command (`npm run seed:programs`), which creates any of the four current programs that are missing. Running it again is always safe: it never changes an existing program and creates no duplicates.

**Why this priority**: Without it the new pages have nothing to show, but it is a one-time setup step rather than a visitor journey.

**Independent Test**: Run the command twice against an empty development database and count the records.

**Acceptance Scenarios**:

1. **Given** an empty database, **When** the command runs, **Then** exactly four published programs exist, and it reports how many were created and how many already existed.
2. **Given** the command already ran, **When** it runs again, **Then** there are still exactly four, matched by slug.
3. **Given** a stored program was edited after seeding, **When** the command runs again, **Then** that program is unchanged, including its updated timestamp.
4. **Given** one seeded program was deleted, **When** the command runs, **Then** only that program is recreated.
5. **Given** the database connection setting is missing or unreachable, **When** the command runs, **Then** it stops with a clear message, a failing exit status and no secret in its output.
6. **Given** only the database connection setting is present, **When** the command runs, **Then** it succeeds without any email or rate-limit setting.

---

### User Story 5 - Motion that helps, and stops when asked (Priority: P3)

Panels arrive with a brief stagger, panels respond to hover, and curriculum steps reveal as they scroll into view. Visitors who ask for reduced motion see everything in place immediately.

**Why this priority**: This carries the editorial feel, but all content works without it.

**Independent Test**: Browse both pages with reduced motion on and off, and with scripts disabled for content visibility.

**Acceptance Scenarios**:

1. **Given** the normal setting, **When** the pages load and scroll, **Then** entrance stagger, hover expansion and timeline reveals play using position and opacity changes only.
2. **Given** reduced motion is requested, **When** the pages are used, **Then** all content is visible at once with no animated movement, and hover still shows the cover without animation.

---

### Edge Cases

- **Database unavailable at request time**: pages already generated keep showing their last good version. A page with no good version yet gets the unavailable state: the home page loads without its Programs section, /programs shows a friendly message pointing to the footer's contact details and still shows the fixed Online courses card, and a detail page shows an error state, not a 404, so a real program is never reported as missing. A failed read is not cached.
- **Database not available at build time**: the build still succeeds. The home page and /programs use the unavailable state until they next refresh (within an hour), and detail pages are produced on first request.
- **Program published after the build**: its detail page works on first visit, with no rebuild.
- **Unknown or repeated filter value** (`?for=xyz`): treated as "All"; no error.
- **Empty optional content** (no outcomes, curriculum, description, price text or a blank fact): that block is left out with no empty heading; panels show only facts that have values.
- **Fewer than three facts**: the panel shows those it has, without gaps.
- **WhatsApp number not configured**: the WhatsApp call to action is not drawn on panels. The detail page's booking card and bottom bar link to the footer's email instead, so a visitor is never left without a next step. If no email is set either, they link to the footer's contact block.
- **Old contact address**: anyone arriving at the removed Contact page's address is permanently redirected to the home page.
- **Unsafe description content** (scripts, event handlers, `javascript:` links, raw HTML): removed before display; the remaining text still appears.
- **Cover image address fails to load**: the brand pattern stays visible behind it.
- **Very long title**: wraps without horizontal scroll or breaking the panel at 360px.
- **Coming-soon programs on the home page**: remain hidden (behaviour from feature 014). They still have index panels and detail pages.

## Requirements *(mandatory)*

### Functional Requirements

**Data and seeding**

- **FR-001**: The system MUST store each program with the fields listed under Key Entities, enforce slug uniqueness and restrict audience, status and call-to-action type to their listed values.
- **FR-002**: The model MUST already hold everything the later admin feature needs to create, edit, publish and order programs, so that feature needs no schema change.
- **FR-003**: `npm run seed:programs` MUST load the four current programs (see Assumptions) as published records, keyed by slug. It MUST be insert-only (upsert by slug with `$setOnInsert`): it creates missing programs and never modifies an existing document, so re-running it is always safe.
- **FR-004**: All program reads MUST go through one server-only module exposing `getPublishedPrograms()` and `getProgramBySlug(slug)`. Unpublished programs MUST NOT be returned by either.
- **FR-005**: Reads MUST be cached and refreshable by tag: `programs` for the list and `program:<slug>` for one program, so the later admin feature can refresh on save. Failed reads MUST NOT be cached.
- **FR-006**: The home Programs section, /programs and /programs/[slug] MUST all read from that module. The static program content and any code left without a user MUST be removed once seeded.

**Program index (/programs)**

- **FR-007**: The page MUST show an oversized heading, one line of text and chips for All, Teachers, Students, College, Online and Corporate. Chip values map to audiences; "Students" means school students.
- **FR-008**: Filtering MUST be instant, in the browser, with no server request, and MUST keep the address in sync as `?for=<value>` (`teachers`, `students`, `college`, `online`, `corporate`; absent for All). A filtered address MUST restore that view when opened. Changing a filter MUST NOT add a back-button step for each chip press.
- **FR-009**: Each program MUST appear as a numbered full-width panel with a large title, audience tag, status chip, up to three facts, call to action and a "View program" link, on alternating navy and paper surfaces.
- **FR-010**: Programs MUST be listed in stored order, except that coming-soon programs come last and are visibly quieter while keeping AA contrast.
- **FR-011**: On pointer devices, hovering a panel MUST expand it slightly, reveal the cover image or brand pattern on the right and move the number to its saffron state, with no layout shift. Keyboard focus inside a panel MUST give the same result. Phones and touch devices MUST get stacked cards without the reveal.
- **FR-012**: Saffron number treatment MUST follow the brand rule against saffron text on light surfaces: saffron numerals on navy panels; on paper panels, a saffron shape with dark numerals.
- **FR-013**: The filter state MUST be conveyed to assistive technology (selected chip, updated result count).

**Program detail (/programs/[slug])**

- **FR-014**: The header MUST show title, summary, status and the cover image, or a brand gradient pattern when there is none.
- **FR-015**: The body MUST show the description as rendered formatted text, "You'll leave with" outcomes, curriculum as a vertical timeline and a facts grid. Any empty block MUST be omitted.
- **FR-016**: The description MUST be sanitized on the server before display so stored content cannot run script or inject unsafe links.
- **FR-017**: On desktop a booking card with price text, facts and call to action MUST stay in view while scrolling. On phones it MUST become a bar fixed to the bottom of the screen that neither hides page content nor overlaps the floating WhatsApp button.
- **FR-018**: The call to action MUST follow the program's type: workshop booking opens the existing booking dialog through `/workshop?book=1`; register goes to /register; WhatsApp opens a chat with a prefilled message naming the program.
- **FR-019**: Unpublished or unknown slugs MUST return a 404 response.
- **FR-020**: Published slugs MUST be generated ahead of time when the database is available, and later-published ones MUST work without a rebuild.
- **FR-021**: Each program page MUST have its own page title, description and Open Graph data.

**Labels, motion and standards**

- **FR-022**: Status chips and call-to-action labels MUST be derived from a single mapping: booking-now "Booking now"; register-interest "Register interest"; coming-soon "Coming soon"; workshop-modal "Book a workshop"; register "Register interest"; whatsapp "Ask on WhatsApp".
- **FR-023**: Motion MUST be limited to entrance stagger, panel hover expansion and timeline reveal on scroll, animating only position/scale and opacity, and MUST be off under the reduced-motion preference. Content MUST be visible without scripts.
- **FR-024**: Browser-side code MUST be limited to the filters, hover reveal and sticky bar; everything else renders on the server.
- **FR-025**: The pages MUST use the existing brand tokens, Sora and Inter fonts and the site's background, with no new UI library.

**Settings validation**

- **FR-026**: Settings validation MUST be per module: the database module validates only `MONGODB_URI`, and the Resend and rate-limit modules each validate only their own variables. Programs pages and the seed MUST work with only `MONGODB_URI` set.
- **FR-027**: The seed MUST run through `tsx`, load `.env.local` with `dotenv` and import the database module directly.
- **FR-028**: Lead-capture behaviour MUST NOT change, including when settings are missing. Today, a missing email or rate-limit setting makes a form submission return the generic error state with no lead stored. That MUST still be the outcome after the split, so a misconfigured site never tells a visitor their request was sent when the owner will not be notified.

**Online courses card**

- **FR-029**: "Online courses" MUST NOT be a stored program: it is not in the seed, and `online` is not an audience value.
- **FR-030**: /programs and the home Programs section MUST show one fixed card, "Online courses", that does not depend on the database. It links to /register for now, and that target MUST be held in one constant so it can become /courses when that feature ships. On /programs it comes last, has no number and no program page, and is what the "Online" chip shows.
- **FR-031**: /register's course options MUST stay as they are until the Courses feature.

**Contact details**

- **FR-032**: The Contact route, its components and its content MUST be removed, along with Contact in the desktop and mobile navigation and the footer links. A permanent redirect MUST send its old address to the home page.
- **FR-033**: The footer MUST be the only place for contact details: WhatsApp, email, YouTube and LinkedIn, each shown only when it exists.
- **FR-034**: Anything that fell back to the Contact page MUST fall back to the footer's email link.
- **FR-035**: A search of the code for the old address MUST find only the redirect that replaces it.

### Key Entities

- **Program**: One offering shown on the site. Fields: title; slug (unique); audience (teachers, school-students, college, corporate); status (booking-now, register-interest, coming-soon); call-to-action type (workshop-modal, register, whatsapp); summary (1-2 lines); description (markdown); outcomes (list of text); curriculum (list of title + description); facts (format, duration, group size, location); price text (free text, e.g. "Contact us"); cover image address (optional); order (number); published (yes/no); created and updated timestamps.

### Seed mapping

| Slug | Audience | Status | Call to action | Order |
|------|----------|--------|----------------|-------|
| `teachers-workshop` | teachers | booking-now | workshop-modal | 1 |
| `student-workshops` | school-students | booking-now | workshop-modal | 2 |
| `college-university` | college | coming-soon | whatsapp | 3 |
| `corporate-teams` | corporate | coming-soon | whatsapp | 4 |

Titles and format, duration and group-size facts come from `src/content/home-programs.ts`. The home card's audience line becomes `summary`. Outcomes and "what to bring" come from the matching entries in `src/content/data/programs.ts`; "bring" has no field of its own, so it goes in the description.

**Description, curriculum and price text**: no source exists for these in the static content, and college also has no outcomes. The seed carries short draft copy written from the existing facts (a description, 3-4 curriculum steps, missing outcomes) with price text "Contact us". The seed data MUST be marked DRAFT, and the owner confirms or replaces it before launch. The copy contains no invented statistics, people or testimonials.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor reaches the panels for their audience in one tap, and the list updates with no perceptible wait (under 100ms).
- **SC-002**: 100% of filtered addresses reopen to the same filtered view.
- **SC-003**: A single stored change appears on all three surfaces after one refresh, and no static program list remains in the codebase.
- **SC-004**: Running the seed command any number of times always leaves exactly four seeded programs and changes no existing record.
- **SC-010**: All existing lead-capture tests and checks pass unchanged, and a form submission with an email or rate-limit setting missing gives the same result as before this feature.
- **SC-005**: 100% of seeded programs' calls to action reach the correct destination on phone and desktop.
- **SC-006**: Both pages reach mobile Lighthouse Performance 90+, Accessibility 95+ and SEO 90+, with no horizontal scroll from 360px to 1440px.
- **SC-007**: All tested unsafe markup samples are stripped from description output, and none runs in the browser.
- **SC-008**: Hover and reveal animations cause zero layout shift, and reduced-motion visitors see no animated movement.
- **SC-009**: With the database unreachable, the home page still loads and no page shows a raw error.

## Assumptions

- **Source files**: the brief names `src/content/programs.ts` and "5 programs". That path does not exist. The five entries were in `src/content/home-programs.ts`; an older three-item list in `src/content/data/programs.ts` feeds today's /programs page. Both are retired, with their useful content merged into the seed.
- **Seed data location**: because the seed must stay re-runnable after the static files go, its data lives with the seed script, which no page may import.
- **Draft content**: every seeded value stays a draft for the owner to confirm before launch, as the existing files already say. "Grades 6-10" is kept over the older "School and college students".
- **Re-running the seed** only fills in missing programs. Later changes to the seed's draft copy therefore do not reach programs already stored, so corrected copy needs the record deleted first, or the admin feature.
- **Deployment order**: the seed must run against the production database before this feature is deployed, or the Programs surfaces will be empty. The plan's deploy notes MUST state this.
- **Register preselection**: the brief asks for this "if the form supports it". The form has no such support, and its course options do not include this program, so the call to action goes to plain /register with no form change.
- **Workshop booking**: the call to action navigates to `/workshop?book=1`, so closing the dialog lands on /workshop. An in-place dialog is not used because it would need changes to the dialog and a form on each program page.
- **Stated constraints**: the data store, function names, cache tags, command name and seed tooling come from the brief and are recorded as requirements because the later admin feature depends on them. The markdown renderer and sanitizer are named in the plan, as the brief asks.

## Out of Scope

- Admin create/edit screens and authentication (next admin feature)
- Image upload and Cloudinary integration
- Payments
- Changes to the booking dialog, lead forms, their course options or lead-capture behaviour
- The Courses feature itself
- Changes to the hero or the home page's other sections
