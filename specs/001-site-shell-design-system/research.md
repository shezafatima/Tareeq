# Research: Site Shell and Design System

All findings come from the existing code in `src/` and `package.json`. No NEEDS CLARIFICATION items remain.

## R1: Where do design tokens live?
- **Decision**: Extend the `@theme` block in `src/app/globals.css`.
- **Rationale**: Tailwind 4.3 is CSS-first. There is no `tailwind.config` file, and `globals.css` already defines `--color-*` and `--font-*` tokens. Adding a config file would create a second source of truth.
- **Alternatives**: a `tailwind.config.ts` (rejected: unused by v4 by default, and you said not to change configuration).

## R2: Do new tokens risk changing the hero?
- **Decision**: Use new token names only (`--spacing-gutter`, `--spacing-section`, `--radius-control`, `--radius-card`, `--radius-pill`, `--shadow-float`). Do not redefine `--radius-xl`, `--spacing`, or other built-ins.
- **Rationale**: The hero uses `rounded-xl`, `rounded-full` and numeric spacing. Overriding those names would restyle it.
- **Alternatives**: redefine the default scale (rejected: affects the signed-off hero).

## R3: Fonts
- **Decision**: Keep the existing `next/font` setup in `layout.tsx` (updated 2026-10-29: Sora 600/700 as `--font-sora`, Inter 400/500/600 as `--font-inter`, `display: swap`).
- **Rationale**: Already done and mapped to `font-heading` and `font-sans`.

## R4: Mobile panel and `backdrop-blur`
- **Decision**: Render the panel with `createPortal` into `document.body`.
- **Rationale**: A parent with `backdrop-filter` becomes the containing block for `position: fixed` descendants, which would clip the full-screen panel to the header's height.
- **Alternatives**: removing the blur from the header (rejected: changes the signed-off look); native `<dialog>` with `showModal()` (kept as the fallback; it gives focus trapping and Escape for free but makes the Framer Motion exit animation awkward).

## R5: Focus trap and scroll lock without a new dependency
- **Decision**: A small `useFocusTrap` hook (Tab and Shift+Tab cycle among focusable elements in the panel) plus `document.body.style.overflow = "hidden"` while open, restored on close and unmount.
- **Rationale**: Under 40 lines, no dependency (Principle IX).
- **Alternatives**: `focus-trap-react` (rejected: new dependency); `inert` on the page behind (possible extra layer; not required by the spec).

## R6: Marking the current page
- **Decision**: A client `NavLink` using `usePathname`.
- **Rationale**: Only this small leaf needs the client; `DesktopNav` and `Footer` stay on the server.

## R7: Shell placement
- **Decision**: Put the skip link, Header, `<main id="content">`, Footer and WhatsAppButton in `src/app/(site)/layout.tsx`. Move `page.tsx` into `(site)/`. `/gradient-demo` stays outside the group.
- **Rationale**: One place for every real route. You chose to keep `/gradient-demo` outside the shell, and `scripts/gradient.mjs` still uses it, so it is kept, not deleted. The URL `/` does not change.
- **Alternatives**: shell in the root layout (rejected: wraps the demo page too); deleting the demo (rejected: a script still depends on it).

## R8: WhatsApp number and message
- **Decision**: Keep `NEXT_PUBLIC_WHATSAPP_NUMBER`; validate as 8 to 15 digits; hide the button if invalid. The message is a constant in `lib/site.ts` and is URL-encoded.
- **Rationale**: The variable already exists in `.env.example`, `.gitignore` already ignores `.env*.local`, and a WhatsApp number is public by nature, so the `NEXT_PUBLIC_` prefix leaks nothing. The component is a server component, so the prefix is not strictly needed, but renaming the variable would break existing setups.

## R9: Icons
- **Decision**: Inline SVG for the chevron, menu, close and WhatsApp glyphs, with `aria-hidden="true"` and `currentColor`.
- **Rationale**: Matches the existing code; no icon package.

## R10: Testing tools
- **Decision**: Use the existing Playwright devDependency for screenshots and keyboard checks, and `npx lighthouse` for scores.
- **Rationale**: No new installed dependencies. `scripts/shots.mjs` already takes screenshots.

## R11: Hero hex values
- **Decision**: Swap only exact-match colours in `Hero.tsx`, as the last task, with before/after screenshots (plan D2). Leave anything without an exact token and list it.
- **Rationale**: Approved by you with conditions: colours only, no layout, animation or timing changes, revert on any visible shift.
