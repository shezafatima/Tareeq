# Verification: Admin Panel (feature 022)

Run on 2026-11-10 against a production build (`next build` then `next start`) with the dev database `tareeq_dev`. Test leads and programs are fake and were removed afterwards.

## Commands

| Check | Result |
|---|---|
| `npm run lint` | pass |
| `npm run build` | pass |
| `npm run test:unit` | 130 of 130 pass |
| `npm run test:admin-guard` | pass: 7 Server Actions all wrapped and refused with no session, 1 Route Handler (the allow-listed Auth.js one), empty session with no cookie |
| `node scripts/admin-check.mjs` | 69 checks pass, 0 fail |
| `scripts/admin-action-unavailable.mts` (database unreachable) | all 7 actions return `unavailable`, none throw |
| `scripts/admin-db-down-check.mjs` | pages show the clear message with Retry; sign-in fails closed |
| Lighthouse (mobile) on login, `/admin`, `/admin/programs`, `/admin/programs/new` | Performance 90 / 95 / 93 / 93, Accessibility 100, Best practices 100, SEO 66 |

SEO 66 comes entirely from one audit, `is-crawlable`, which fails because the pages are `noindex` as the spec requires. This is the justified exception recorded under Complexity Tracking in `plan.md`; every other SEO audit passes.

## Success criteria

| ID | Evidence |
|---|---|
| SC-001 | Guard test (every action wrapped, refused, no database call) and browser check (every admin page redirects to login) |
| SC-002 | Browser check: five wrong attempts show "Invalid credentials", the sixth, with the right password, is blocked |
| SC-003 | Search by name, phone (typed with a leading 0) and organization each find the lead; not timed with a person |
| SC-004 | Status and notes persist after refresh (browser check); the status label changes at once from local state |
| SC-005 | Create, rename, unpublish and delete all showed on `/programs`, the home section and the program page in under 0.3 s |
| SC-006 | The full program form was filled and saved by the script in seconds; not timed with a person |
| SC-007 | Login, submissions (cards and full-screen drawer), programs grid and program form checked at 360 px with no horizontal scroll |
| SC-008 | Tab and Shift+Tab never left the open drawer in 40 presses each; Escape closes the drawer, the confirmation dialog and the phone menu, and focus returns to the opener |
| SC-009 | All chip and button pairs are 6.5:1 or higher (lowest: white on the delete button, 6.57) |
| SC-010 | With reduced motion the drawer and sidebar indicator durations are 0.00001 s and the count-up shows its final number at once |
| SC-011 | Database down: all three pages show the message with Retry, status 200, no crash |
| SC-012 | Server logs from the runs contain no names, phones, emails, notes or search text; addresses only held `type`, `status`, `q`, `page` and `lead=<id>` |

## Notes

- Public hero, Header and Footer files were not touched (`git diff main -- src/components/Hero.tsx src/components/layout` is empty).
- Each admin Server Action takes one object argument; `updateProgram` takes `{ id, values }` (the contract was updated to match).
- The live preview renders the public `ProgramPanel` itself. In the narrow preview column its large title can wrap mid-word; the public page is unaffected.
- Manual items not covered by a script: keyboard-only editing of the outcome and curriculum lists (they use plain inputs and buttons), and a person timing SC-003 and SC-006.
