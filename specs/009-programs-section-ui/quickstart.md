# Quickstart: verify the Programs section

```bash
npm run lint && npm run build
npm run dev            # http://localhost:3000
```

Set `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local` (digits only) to see the WhatsApp CTAs; unset it to see them omitted.

## Manual checks
1. 1440px: featured navy card is 2×2 on the left, four cards fill the right 2×2; glow drifts slowly.
2. 768px: 2 columns, featured full width, then four cards in two rows.
3. 360px: one column, order Teacher → School students → Online courses → College & university → Corporate; no sideways scroll.
4. Hover (mouse): card lifts 4px, border warms, chevron slides 4px. Tab: one stop per card, visible focus, same lift.
5. Click each CTA: `/workshop?book=1`, `/workshop?book=1`, `/register`, WhatsApp (new tab, prefilled), WhatsApp.
6. OS "reduce motion" on: no entrance, no glow movement; hover changes colour only.
7. Touch emulation: tapping does not leave a lifted card.
8. `/programs`, hero and How it works look exactly as before.

## Scripts
```bash
node scripts/programs-check.mjs          # new: layout, order, links, a11y, contrast, motion
node scripts/home-check.mjs
node scripts/why-tareeq-check.mjs
node scripts/polish-token-check.mjs      # hero guard
```
Lighthouse (mobile) compared with `specs/008-why-tareeq-section/baseline.md`.
