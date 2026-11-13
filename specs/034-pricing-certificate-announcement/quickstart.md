# Quickstart: Verifying Pricing, Certificate Section and Announcement Bar

**Prerequisites**: `npm run dev`, signed in at `/admin`, MongoDB reachable, Cloudinary configured for the image step. Check each step at 360px, 390px and 1440px unless noted.

## Automated

```bash
npm run lint
npm run build
npm run test:unit          # pricing-rules, workshop-pick, certificate-content, announcement-rules (+ all existing tests unchanged)
npm run test:admin-guard   # saveCertificate, saveAnnouncement refused with no session; program/course actions still refused
```

## Pricing (US1)

1. **Untouched record**: open `/programs`, `/programs/<slug>`, `/courses` and `/courses/<slug>` before any edit. Every price looks exactly as it did on `main`, with the same text and position (SC-002).
2. **Show with discount**: edit a course and set mode "Show a price", amount `5000`, original `7000`, unit "per participant", offer label "Launch offer" and offer ends "Ends 30 November".
   - The preview shows ~~Rs 7,000~~ **Rs 5,000** per participant, with a saffron "Launch offer" chip and "Ends 30 November".
   - Time this edit from opening the form to seeing the saved price, and note it in `verification.md` (SC-001 target: under 1 minute).
   - Save it, then check the course card, the detail booking card and the mobile bar (360px). All three match (SC-003).
3. **Validation**: try amounts `0`, `-1` and `abc`, and an original of `5000` against an amount of `5000`. Each gives a field message and the save is blocked. Repeat with a forged request (devtools replay) and confirm the server returns `invalid`.
4. **Mode switch**: change the course to "Contact us". The amount fields hide, and after saving the public site shows "Contact us for pricing" with no amount. Change it to "Free" and the site shows "Free". Change it to "Not set" and the old price text comes back.
5. **Program**: set a program to "show" with amount 8000. Its panel on `/programs` shows "Rs 8,000", as do its booking card and mobile bar. The home page's program cards (`HomeProgramCard`) are unchanged, since they're out of scope.
6. **Workshop**: set the teachers program to "show" with amount 8000 and the school-students program to "Contact us".
   - `/workshop` shows two labelled entries, each linking to its program page.
   - Set both back to "Not set" and the block disappears.
   - Unpublish the teachers program and only the students entry remains.
7. **Screen reader**: on the discounted card, the price reads as "Original price Rs 7,000, now Rs 5,000".

## Announcement (US2)

8. **Basic**: enable the bar with the text "Summer batch registrations are open", link "Apply now" to `/register`, saffron style, no dates and dismissible on.
   - Load `/`, `/programs`, `/blog` and `/workshop`. The bar is above the header on each.
   - Load `/admin` and there is no bar.
9. **Layout** (check at 360, 390, 768 and 1440px):
   - At 1440×900, the home hero still fits exactly on screen with the bar visible. Scroll, and the sticky header sits at the top with no overlap.
   - At 360px on `/programs/<slug>`, the bottom CTA bar and the top bar never overlap.
   - Disable the bar and the hero is pixel-identical to `main` (compare screenshots).
10. **Wrap**: enter a full 120-character text with a 30-character label.
    - At 360px it shows at most 2 lines, there is no horizontal scroll, and the admin warns "May be cut short on small phones".
    - Short text (36 characters or fewer) gives a slimmer one-line bar on phones.
11. **Dismiss**:
    - Click ×. The bar disappears, and focus moves to the logo.
    - Reload with the cache disabled and network throttled to "Slow 4G". There's no flash of the bar and no layout shift (Performance panel CLS is 0).
    - Edit any field in the admin and save, then reload. The bar is back.
12. **Window**:
    - Set the start time 2 minutes into the future (Pakistan time). There's no bar now, and after the start time a reload shows it without saving again.
    - Set the end time to a past time. There's no bar.
    - End before start gives a field error.
    - **No flash, no shift in the three hidden cases**: with Slow 4G throttling and the Performance panel recording, reload with the bar (a) dismissed, (b) outside its window (before the start, then after the end) and (c) disabled. CLS is 0 and no frame shows the bar, in each case.
13. **Validation**: try 121 characters of text, a label without a URL, the URL `javascript:alert(1)`, `http://example.com` and `//evil.com`. Each is refused with a field message.
14. **Accessibility**:
    - Tab order runs: skip link, bar link, close button, header.
    - Check contrast with devtools in both styles.
    - A screen reader announces the "Announcement" region, and the close button reads "Dismiss announcement".
15. **No JavaScript**: disable JS, and the bar still renders but can't be dismissed. The page works.

## Certificate (US3)

16. **Defaults**: on a fresh document, the home page shows the certificate section right before the final CTA, with the default copy, 3 bullets and the sample certificate with its "Sample" ribbon. There's no wording about accreditation.
17. **Edit**: at `/admin/settings/certificate`, change the heading, add a 4th bullet (Add is then disabled), and upload an image with alt text. Save, and the home page shows it with no "Sample" text.
18. **Validation**: an image with no alt text is refused. An empty heading while enabled is refused.
19. **Motion**: hovering straightens the frame. With reduced motion turned on (OS or devtools), it is static.
20. **Toggle off**: the section is gone and the final CTA follows the blog preview directly.

## Cross-cutting

21. Signed out, POST each new action (replay from devtools). The response is `unauthorized` and nothing changes.
22. The Settings page shows "Site images →", "Certificate section →" and "Announcement bar →", each with a 44px target.
23. With the database stopped:
    - The admin settings pages show the unavailable notice.
    - In dev, the public pages render with no bar and with the default certificate content. Program and course pages keep their existing unavailable behaviour.
    - `/workshop` renders without the prices block.
24. Lighthouse mobile on `/` and `/courses/<slug>` with the bar enabled: Performance 90+, Accessibility 95+, SEO 90+.
