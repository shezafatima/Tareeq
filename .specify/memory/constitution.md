<!--
Sync Impact Report
- Version change: 1.0.1 → 1.1.0 (2026-10-29: added Principle XI, Server Components by default;
  Principle II now lists `components/layout`; workflow check covers I–XI).
  Earlier: 1.0.0 → 1.0.1 (heading font Manrope → Sora, Principle VIII hero exception);
  (unversioned template) → 1.0.0
- Modified principles: II (added `components/layout`); none renamed.
- Added principles: XI (Server Components by default, client boundaries at the leaves)
- Added sections: Technical Constraints, Development Workflow, Governance
- Removed sections: none
- Templates:
  - ✅ .specify/templates/plan-template.md (Constitution Check is generic; gates are read from this file, no edit needed)
  - ✅ .specify/templates/spec-template.md (no constitution-specific references)
  - ✅ .specify/templates/tasks-template.md (no constitution-specific references)
  - ⚠ pending: no .specify/templates/commands/ directory exists; nothing to check
- Deferred TODOs: none. Ratification date set to the date of first adoption (2026-10-29).
-->
# Tareeq Website Constitution

## Core Principles

### I. Mobile-First, Always
Every layout MUST be designed for a 360px phone first, then widened. Most visitors are teachers
and students in Pakistan on mid-range phones and slow connections.
- No horizontal scroll at any width.
- Touch targets MUST be at least 44px.
- A layout that only works on a laptop MUST NOT ship.

### II. Everything Is a Reusable Component
Pages MUST be assembled from small, single-purpose components (e.g. MobileNav, DesktopNav,
Header, Footer, HeroText, HeroBackground, SectionHeading, Card, Button, Field, Form,
WhatsAppButton). There are no large page files.
- A component does one thing and takes props; copy-pasted variants are not allowed.
- Mobile and desktop navigation are separate components behind one Header.
- Shared UI lives in `components/ui`; the site shell (Header, navs, Footer, WhatsAppButton) lives in
  `components/layout`; section-level blocks live in `components/sections`.
- If a pattern appears twice, extract it before writing it a third time.

### III. One Brand System, No Ad-Hoc Styling
Colours, fonts and spacing MUST come from design tokens. Hardcoded hex values in components
are not allowed.
- Palette: Midnight #0D1B3D, Royal Blue #1E3A8A, Sky Blue #2563EB (links and small icons only),
  Saffron #F2A93B (accent), Paper #FAF7F2 (background), Soft Blue #E6F0FF (surfaces).
- Proportion: roughly 60% Paper/white, 25% Midnight, 10% Royal Blue, 5% Saffron.
- Saffron MUST NOT be used as text on a light background.
- Headings use Sora; body uses Inter. Load only the weights in use (Sora 600 and 700; Inter 400, 500
  and 600).
- Voice is warm and direct, like a good teacher. Hype words ("empower", "unlock",
  "revolutionize") are not allowed.
- Avoid the generic AI look: no circuit lines, glowing brains, purple gradients or neon.

### IV. Accessible by Default
- Semantic HTML (header, nav, main, section, footer) and exactly one H1 per page.
- Keyboard navigable, with visible focus states.
- AA contrast; alt text on every meaningful image.
- Labels tied to inputs.
- Decorative animation is marked `aria-hidden`.
- Every animation MUST respect `prefers-reduced-motion`.

### V. Protect People's Data
Forms collect names, phone numbers and emails of school staff, teachers and parents.
- Validate on the server, always. Client-side validation is for convenience only.
- Collect only the fields the spec lists, with an explicit consent checkbox.
- Every `/admin` page and every admin API route MUST be protected server-side. A client-side
  check is never sufficient.
- No personal data in logs, URLs or error messages.
- Secrets live only in environment variables.

### VI. Fast on a Cheap Phone
Mobile Lighthouse targets: Performance 90+, Accessibility 95+, SEO 90+.
- Images go through `next/image` with explicit sizes.
- Animate only `transform` and `opacity`.
- Heavy or below-the-fold work is lazy-loaded.
- The LCP element is text or a hero image, never a canvas or a late-loading widget.

### VII. Small, Verified Steps
Each milestone MUST build and lint clean, and be checked in a real browser at 390px and
1440px before moving on. Verify by looking at the result, not by assuming it worked. The next
milestone MUST NOT start until the current one is confirmed.

### VIII. Don't Touch What Is Finished
The hero section is built and signed off, including its animated gradient background,
floating cards, robot image and eye tracking. It MUST NOT be restyled, refactored or
"improved". If a shared change (a token, the Header) affects the hero, say so first and wait
for approval.

Exception (2026-10-29): the heading font change from Manrope to Sora was approved to apply to the
hero. Only the H1 font-size clamp and letter-spacing may be adjusted to keep its original line
breaks and fit.

### IX. No Surprise Dependencies
No new paid services and no new heavy dependencies without asking first and stating why.
Prefer what the project already has.

### X. When Unsure, Ask or Choose the Safest Option
If the spec is ambiguous, pick the most conservative reading, state the assumption clearly,
and continue. Never invent content, testimonials, statistics or placeholder people that could
be mistaken for real.

### XI. Server Components by Default, Client Boundaries at the Leaves
`"use client"` MUST go on the smallest component that genuinely needs it, never on a whole page
or section because one element inside it is interactive.
- Do NOT create a client copy of a component that duplicates the server component's markup.
  There is one component per piece of UI, not a server version and a client twin that drift apart.
- Keep markup and data fetching in the Server Component and extract ONLY the interactive part into
  a small client child: the toggle, the menu button, the form field, the hover handler.
- Pass data down as serialisable props. Never fetch the same data twice to satisfy both sides.
- A client component MUST NOT re-render a static subtree. Static children are passed in as the
  `children` prop from the server parent so they stay server-rendered.
- Before adding `"use client"`, say in one line why it is needed: state, effects, event handlers,
  browser APIs or a client-only library.

## Technical Constraints

- Stack follows the existing project (Next.js with `next/image`); changes to it fall under
  Principle IX.
- Brand tokens are the single source for colour, font and spacing values (Principle III).
- Lighthouse targets in Principle VI are release gates for any page change.

## Development Workflow

- Work proceeds in milestones; each ends with build, lint and a visual check at 390px and
  1440px (Principle VII).
- Plans MUST include a Constitution Check against Principles I–XI; violations require an entry
  in Complexity Tracking with justification.
- Changes touching the hero or shared pieces it uses (tokens, Header) require a stated impact
  and approval first (Principle VIII).

## Governance

This constitution supersedes other practices. Amendments require a written change to this file
with rationale, an updated Sync Impact Report, and the user's approval. Versioning follows
semantic versioning: MAJOR for removed or redefined principles, MINOR for new principles or
materially expanded guidance, PATCH for clarifications. Every plan and review MUST verify
compliance with these principles. Runtime guidance for the agent lives in `CLAUDE.md`.

**Version**: 1.1.0 | **Ratified**: 2026-10-29 | **Last Amended**: 2026-10-29
