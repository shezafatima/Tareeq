# Quickstart: verify admin testimonial videos

Prerequisites: `.env.local` with the MongoDB and admin auth variables already used by the panel.

## Automated

```bash
npm run lint
npm run test:unit            # includes tests/unit/admin-testimonials-schema.test.ts and the moved testimonials.test.ts
npm run test:admin-guard     # 4 new testimonial actions refused with no session, no DB touched
npm run build
```

## Manual (browser at 390px and 1440px, plus 360px for the grid and form)

1. `npm run dev`, sign in at `/admin/login`. Sidebar (and mobile menu) shows **Testimonials**.
2. Empty database: `/admin/testimonials` shows the empty state. Home page in dev shows the 3 placeholders.
3. New testimonial: paste `https://youtu.be/<id>` → thumbnail appears; paste `https://example.com` → inline error, Save
   blocked. Try a Shorts link and a `watch?v=` link with `&t=30s`.
4. Type a 141-character quote → counter turns to error, Save blocked.
5. With consent unticked, focus the Published switch with Tab → tooltip "Tick consent first."; clicking does nothing.
6. Tick consent, publish, save → card shows "Consent given" and Published. Home page shows only the real item.
7. Edit, untick consent → Published turns off; save → item disappears from the home page.
8. On a card with no consent, the switch is locked with its tooltip.
9. Create three items with orders 1, 2, 3; change one to 0 → grid and home order update.
10. Delete from the edit page → confirm dialog; Cancel keeps it, Delete removes it from grid and home.
11. Direct-request check: covered by `test:admin-guard`; also confirm in DevTools that a crafted
    `setTestimonialPublished({ id, published: true })` on a no-consent item returns `invalid`.
12. Production check: `npm run build && npm start` with zero live items → no Testimonials section and no placeholders.
13. OS "reduce motion" on: switches and tooltip appear without transitions.
