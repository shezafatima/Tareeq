# Research: Home Programs Section UI Enhancement

No NEEDS CLARIFICATION items remained after the spec. These are the design decisions, based on reading the code.

## R1 – Where the content lives
**Decision**: new `src/content/home-programs.ts` + `HomeProgramCard` type + `getHomeProgramCards()` in `src/content/index.ts`.
**Rationale**: the existing `Program` type has only `available | coming-soon`, no CTA, no group size, no featured flag, and is shared with `/programs`, which is out of scope. The site already uses one typed file per home section (`how-it-works.ts`, `why-tareeq.ts`) read through async getters, which is exactly what the admin feature will replace.
**Alternatives**: extend `Program` (risks changing `/programs` and its ProgramCard; touches 3 existing entries); derive cards from `programs` by id (couples the two screens, forces admin to edit both).
Note: the brief names `src/content/programs.ts`; the real file is `src/content/data/programs.ts`. The new file sits beside `why-tareeq.ts`.

## R2 – Keeping existing copy
**Decision**: copy the existing strings where they match (teacher audience "School and college teachers", "Half a day"; teams → "Corporate teams"), mark every changed or new value `DRAFT` in a header comment. Duplication accepted.
**Rationale**: independent replaceability beats a single shared string; the brief explicitly wants placeholders for owner review.

## R3 – Status and CTA model
**Decision**: `status: "booking-now" | "register-interest" | "coming-soon"`; `cta: { kind: "link", label, href } | { kind: "whatsapp", label, message }`. `tone` is derived from status (coming-soon → quiet), not stored. Booking href reuses `joinHref` from `lib/site.ts`; WhatsApp URL is built in the section with `getWhatsAppUrlWithMessage(message)`.
**Rationale**: content stays free of presentation and of the phone number. If the URL is null the CTA is omitted (spec US2.5); the card keeps its height through the grid.
**Alternatives**: store a final URL in content (leaks the number, breaks env-based config).

## R4 – Grid
**Decision**: `grid-cols-1` → `md:grid-cols-2` (featured `md:col-span-2`) → `lg:grid-cols-4` with featured `lg:col-span-2 lg:row-span-2`. Four 1×1 cards fill the remaining 2×2. DOM order = visual order = brief order, so tab order and reading order match.
**Rationale**: a 4-column grid is the only layout where a 2×2 hero card plus four equal cards fills the rectangle with no gaps. At 1024px each small card is about 225px wide; facts are short single lines and the CTA is a compact text button, so it fits. Fallback if a check shows crowding: drop to `gap-4` and tighten padding at `lg` only.
**Alternatives**: 3 columns (leaves a hole or a third row); CSS grid-areas (more rigid for admin-driven counts).

## R5 – Reusing site motion instead of writing new JS
**Decision**: wrap each `li` in `Reveal` with `index` (existing stagger, capped, once, no-JS safe); put `.lift` on the inner `article` (never on the Reveal element, per the Reveal contract). Lift is 4px already (`--lift`). The existing `.lift:focus-within` covers keyboard focus; hover is already `@media (hover: hover)`.
**Rationale**: zero client code added, consistent with other sections, reduced-motion already handled by the global rules.

## R6 – Border warming and chevron slide
**Decision**: a `.program-card` class adds `border-color` transition toward saffron (a `color-mix` of saffron and the card's border) on `:hover` (inside `@media (hover:hover)`) and `:focus-within`. `ChevronRight` gets an optional `slide` prop that selects a 4px translate (static Tailwind class); default stays 3px so other buttons are unchanged. Reduced motion: transform removed (already `motion-reduce:transform-none`), colour change stays.

## R7 – Featured glow
**Decision**: one decorative `span` (`aria-hidden`) inside the navy card: a large radial gradient made from existing tokens (royal/sky tint at low alpha), animated with a 20–24 s `translate3d` + small `opacity` loop (alternate, ease-in-out). `overflow-hidden` on the card clips it; `pointer-events-none`. Disabled in `@media (prefers-reduced-motion: reduce)` (`animation: none`, fixed position). Only transform/opacity.
**Alternatives**: animated `background-position` (repaints), blur filter animation (costly on cheap phones), Framer Motion (client code).

## R8 – Quiet cards and contrast
**Decision**: coming-soon cards: white/paper surface, `border-royal/10`, text `midnight` at ≥80% opacity, chip in soft blue with midnight text, CTA as an outlined (secondary) button; no saffron border warming beyond a faint one. Active cards: soft-blue or white with royal accents, primary-style CTA. Featured: midnight surface, white text, saffron accent bar/chip dot, saffron CTA arrow; saffron used as text only on navy.
**Rationale**: quiet = less colour and weight, not lower contrast. `scripts/contrast.mjs` already exists; add the card colours to the new check and assert ≥4.5:1 text, ≥3:1 for borders of the CTA and focus ring.

## R9 – Open points for the owner (not blockers)
1. Placeholder facts (group sizes, course formats, college/corporate durations) are drafts.
2. Student audience "Grades 6-10" differs from the existing "School and college students" (the `/programs` page keeps the old wording).
3. The home section shows all five cards, not three; the "all programs" link to `/programs` stays, and `/programs` still lists only the three it has today.
4. WhatsApp message text per program is a draft.

## R10 – Verification of "unchanged" areas
**Decision**: run `polish-token-check.mjs` (hero guard), take before/after screenshots of hero and How it works, and diff `/programs` HTML text before vs after via `text-snapshot.mjs`.
