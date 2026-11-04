# Quickstart: Lead Capture (006)

How to set up and verify this feature locally and on Vercel.

## 1. One-time setup

**MongoDB Atlas** (free M0 tier is enough for the pilot):
1. Create a cluster in **AWS Mumbai (ap-south-1)**, the nearest region to the Vercel `bom1` function region and to Pakistani visitors.
2. Create a database user with read/write access to the `tareeq_dev` and `tareeq` databases only.
3. Network access: allow `0.0.0.0/0`. Vercel functions have no fixed IPs on the free plan, so access is protected by the strong user password in the URI.
4. Copy the `mongodb+srv://` URI and put the database name in the path: `…mongodb.net/tareeq_dev?retryWrites=true&w=majority`.

**Resend**:
1. Create an API key with "Sending access" only.
2. For the pilot without a domain, set `LEAD_NOTIFICATION_TO` to the Resend account's own email and leave `LEAD_EMAIL_FROM` unset.
3. Before sending to any other address, verify the domain in Resend and set `LEAD_EMAIL_FROM`.

**Vercel**: set `MONGODB_URI` (production database `tareeq`), `RESEND_API_KEY`, `LEAD_NOTIFICATION_TO`, `RATE_LIMIT_SECRET` (and `LEAD_EMAIL_FROM` if used) for Production. Set the same with the `tareeq_dev` URI for Preview. Set the function region to `bom1`.

## 2. Local environment

```bash
cp .env.example .env.local     # if .env.local does not exist; otherwise add the new keys
# fill in MONGODB_URI (tareeq_dev), RESEND_API_KEY, LEAD_NOTIFICATION_TO
# RATE_LIMIT_SECRET: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm install
npm run dev
```

## 3. Unit tests

```bash
npm run test:unit        # node --test tests/unit/
```

Expected: all pass. They cover phone normalisation (local, +92, 0092, 92…, landline, foreign, garbage), schema rules for both forms, month options, reference format and HMAC key derivation.

## 4. End-to-end check

```bash
CHROME=<path-to-chrome> BASE=http://localhost:3000 node scripts/leads-check.mjs
```

The script asserts, at 390×844 and 1440×900:
- [ ] Every workshop CTA (hero "Explore programs", header "Book a workshop", mobile menu, Programs page cards, home final CTA) lands on `/workshop?book=1`
- [ ] Footer, Courses page and Contact page link to `/register`; the header and mobile menu do not
- [ ] Workshop and waitlist happy paths reach the confirmation with the right next-step text, a reference and a WhatsApp link whose text contains only the type and reference
- [ ] Rejections: consent unticked, invalid phone, invalid email, missing required field, participants 0, all with values preserved and focus on the error summary
- [ ] The same rejection with **JavaScript disabled** preserves values (server-rendered state)
- [ ] Honeypot filled shows a success screen and creates no record (checked with the DB script)
- [ ] 6th counted submission within an hour is refused with the rate-limit message, values preserved
- [ ] "Under 18" shows and hides the guardian note
- [ ] No console errors or warnings on either page
- [ ] Screenshots saved to `shots/006/` for each form, its error state and its confirmation, at both sizes

The rate limit is shared, so the script clears the `rate_limits` collection in the **dev** database before and after its run. It refuses to run if the URI's database is not `tareeq_dev`.

## 5. Database and email confirmation

```bash
node scripts/leads-db-check.mjs TQ-XXXXXX TQ-YYYYYY
```

This prints, for each reference: `type`, `status` (expect `new`), `notification.state` (expect `sent`), and the Resend delivery status (expect `delivered`). It prints no personal fields. Then open the owner inbox and confirm both emails arrived, with the subject showing only the type and reference, and Reply-To set to the visitor.

## 6. Build and lint

```bash
npm run lint && npm run build
```

Both clean. Then check the build output: `/workshop?book=1` and `/register` are dynamic (ƒ), and no Mongoose or Resend code appears in client chunks (the `server-only` imports enforce this at build time).

## 7. Privacy spot-check

- [ ] `npm run dev` terminal output during the whole e2e run contains no names, phones, emails or IPs
- [ ] No page URL ever contains form data (no GET submissions, no query strings)
- [ ] Vercel function logs after a production test submission contain only type / ref / outcome / code

## Owner open items (hand-off)

**Wording marked DRAFT, to confirm or replace** (all in `src/content/data/` unless noted):
- Privacy note and consent label (`leads.ts`), the confirmation headings "Your request is in" / "You’re on the waitlist" and the WhatsApp prefilled messages (`leads.ts`). The next-step lines ("within 1 working day…", "when this course opens…") were agreed on 2026-11-03.
- The `/workshop` headline and intro (`pages.ts`), the `/register` intro (`pages.ts`), the Courses page intro (`src/app/(site)/courses/page.tsx`) and the Contact page "Book a workshop or join a course waitlist" section (`src/app/(site)/contact/page.tsx`). These pages get a proper UI update from separate specs.
- The two placeholder course names in `courses.ts` ("AI for Teachers (online)", "AI for Students (online)"). Replace the list, or keep only "Not sure yet", until real courses exist.
- The "Join the waitlist" label is one constant (`courseFormLabel` in `leads.ts`); change it to "Register" when real courses and dates exist.

**Before launch:**
- **Resend:** verify a sending domain, then set `LEAD_EMAIL_FROM`. Until then emails only reach the address of the Resend account.
- **Vercel:** set `MONGODB_URI` (production database `tareeq`), `RESEND_API_KEY`, `LEAD_NOTIFICATION_TO`, `RATE_LIMIT_SECRET` for Production, and the same with the `tareeq_dev` URI for Preview. Set the function region to `bom1`.
- **Atlas:** Vercel has no fixed addresses, so Network Access needs `0.0.0.0/0` for the app (protected by the strong database password). A computer used for development must also be allowed; during this work Atlas refused one whose address had changed (symptom: "SSL alert 80" right after connecting).

**Good to know:**
- The rate limit counts by the visitor's address from `x-forwarded-for`. On Vercel that is always the real visitor; behind anything else, requests without it share one "unknown" counter.
- A browser extension that auto-fills a field named `website` would make a real visitor look like a bot. The field is set to ignore autofill, so this should be very rare.
- Test submissions are stored in `tareeq_dev` only (names like "QA Test Lead"). They can be deleted there at any time; nothing from testing is in production.
- Not yet done by hand: a screen-reader pass (NVDA) of both forms.

## Results (2026-11-04, production build, 3 runs each, mobile preset with throttling)

| Page | Performance (runs) | Accessibility | Best Practices | SEO | LCP |
|---|---|---|---|---|---|
| `/workshop?book=1` (dialog open) | 96, 98, 97 (median **97**) | 100 | 100 | 100 | 1.1 s |
| `/register` | 87, 88, 90 (median **88**) | 100 | 100 | 100 | 3.2–3.3 s |
| `/contact` (existing page, for comparison) | 95, 98, 95 | 100 | 100 | 100 | 0.9 s |
| `/courses` (existing page, for comparison) | 100, 100 | n/a | n/a | n/a | 0.9 s |

- **Open item:** `/register` is about 2 points under the 90 target. Its LCP element is the brand preloader's robot image (site shell, feature 002). The same image is not the LCP on `/courses`, `/contact` or `/workshop`, so the cause is not understood yet. Observed (unthrottled) LCP is about 0.4 s; the 3.3 s is the throttling simulation. Not changed, because the preloader is finished work.
- Server code in browser files: none (`mongoose`, `resend`, secrets absent from `.next/static/chunks`).
- Logs during the full run: only `[lead] event type ref outcome code` lines; no names, phones, emails or addresses.
- Browser checks (`scripts/leads-check.mjs`): 328 passed in the full run, 21 for spam protection, 6 for the 360px pass, plus 7 for a database outage (run against a server with an unreachable database).
