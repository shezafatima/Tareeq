# Quickstart: Site Shell and Design System

## Run

```bash
npm run dev          # http://localhost:3000
```

Copy `.env.example` to `.env.local` and set a real number (digits only, international format, no `+`):

```text
NEXT_PUBLIC_WHATSAPP_NUMBER=923001234567
```

`.env.local` is already git-ignored. On Vercel, set the same variable in Project Settings.

## Verify each milestone

1. `npm run lint` and `npm run build` both pass with no errors.
2. Open `/`, `/programs`, `/courses`, `/about`, `/contact` at 390px and 1440px:
   - Header, footer and WhatsApp button are on every page; no horizontal scroll.
   - Each page has exactly one H1.
3. At 390px, open the menu:
   - A full-screen panel with a close button appears.
   - Tab cycles only inside the panel; Escape closes it and focus returns to the menu button.
   - A link click closes it; the page behind does not scroll.
4. Remove `NEXT_PUBLIC_WHATSAPP_NUMBER` and restart: the button disappears, nothing errors.
5. Turn on reduced motion in the OS: no menu slide.
6. Compare the home hero with "before" screenshots taken at 1440x900 and 390x844 before any change: no visible change.
7. `npx lighthouse http://localhost:3000 --preset=desktop` is not enough; run the mobile default for `/` and `/about` against `npm run build && npm start`.
8. `rg "#[0-9a-fA-F]{3,8}|rgba\(" src/components/layout src/components/ui/Button.tsx src/components/ui/Card.tsx src/components/ui/Field.tsx src/components/ui/SectionHeading.tsx src/components/ui/Container.tsx src/components/sections` returns nothing.

## Add contact details and social links

Edit `src/lib/site.ts`: add entries to `contactDetails` and `socialLinks`. The Footer shows them automatically.
