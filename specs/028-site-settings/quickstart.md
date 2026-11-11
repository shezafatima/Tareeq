# Quickstart: verify 028 Site Settings

Prerequisites: `.env.local` with `MONGODB_URI` and the admin variables. Start with `npm run dev`.

## 1. Automated checks

```bash
npm run lint
npm run build
npm run test:unit          # adds settings-schema, merge-settings, footer-contact, site-links tests
npm run test:admin-guard   # saveSettings listed in REQUIRED_ACTIONS and refused with no session
```

## 2. No direct env reads left (FR-016, SC-003)

```bash
grep -rn "NEXT_PUBLIC_WHATSAPP_NUMBER\|NEXT_PUBLIC_CONTACT_EMAIL\|LEAD_NOTIFICATION_TO" src
```

Expected: matches only in `src/lib/settings/fallback.ts` (and the optional schema entry in `src/lib/leads/notify.ts`).

## 3. Fresh database looks unchanged (SC-004)

1. Delete the `sitesettings` collection (or use an empty database).
2. Load `/`. The footer shows the same WhatsApp, email, YouTube and LinkedIn as on `main`, and the floating button is present.

## 4. Admin edit (US1)

1. Sign in and open **Settings** in the sidebar. The form is prefilled with the values from step 3.
2. Enter `0300 1234567` → Save → the toast appears, and the field shows `+923001234567`.
3. **Test WhatsApp link** opens `https://wa.me/923001234567?...` in a new tab.
4. Try each of these and confirm each shows a field error and nothing is saved:
   - `abc` as the email
   - `0300123` as the phone
   - `http://youtube.com/x` in YouTube
   - `https://instagram.com/x` in YouTube
5. Change a field, then click **Programs** in the sidebar → you are warned. Cancel to stay. Reload → the browser warns. Save → no warning any more.
6. Stop MongoDB (or set a bad URI) and save → the "database can't be reached" toast appears and your input is kept.

## 5. Public site follows (US2, SC-001, SC-002)

After saving a new WhatsApp number, phone, address and an Instagram link, load each of these without restarting:
- `/` (floating button, footer, programs preview, Who it's for)
- `/programs` and a program whose button is "Ask on WhatsApp"
- `/courses` and a course page
- `/workshop` and `/register`: submit a valid form and check the confirmation link

Every `wa.me` link must use the new number. The footer shows the phone (`tel:`), the address and an Instagram icon. Clear Instagram → its icon disappears.

## 6. No number at all (FR-017)

Clear the WhatsApp field with `NEXT_PUBLIC_WHATSAPP_NUMBER` unset, and save. (The field is required only while there's no fallback, so unset the env first and restart.) Then confirm:
- The floating button is gone.
- Program WhatsApp buttons show "Email us" or "Contact us".
- "Who it's for" links point to the footer.

## 7. Notifications (US3)

Set **Notification email** to a second inbox → submit a workshop request → the email arrives there. Clear it (with `LEAD_NOTIFICATION_TO` set) → the next one goes to the env address.

## 8. Mobile

Check `/admin/settings` and the footer at 360px, 390px and 1440px. There must be no horizontal scroll, and the social icons must be 44px tap targets.
