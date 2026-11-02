# Quickstart: Home Page Content and Core Pages

## Run

```bash
npm install
npm run dev                        # http://localhost:3000
npm run build && npm run lint      # must both be clean
```

Add to `.env.local` (and `.env.example`):

```text
NEXT_PUBLIC_WHATSAPP_NUMBER=923001234567       # digits only, international format (existing)
NEXT_PUBLIC_CONTACT_EMAIL=                      # new; leave empty to hide the email entry
NEXT_PUBLIC_CONTACT_LOCATION=                   # new; leave empty to hide the location entry
```

## Change content

Edit `src/content/data/*.ts`. Components hold no copy. Every file starts with a DRAFT note.

## Verify (with the server up)

```bash
CHROME=<path> BASE=http://localhost:3000 node scripts/pages-check.mjs        # pages, h1, titles, no horizontal scroll
CHROME=<path> BASE=http://localhost:3000 node scripts/home-check.mjs         # five sections, counts, call to action
CHROME=<path> BASE=http://localhost:3000 node scripts/transition-check.mjs   # scroll sequence, CLS, reverse, modes
```

Expected:

- [ ] Build and lint clean
- [ ] Screenshots at 1440x900 and 390x844 for `/`, `/our-way`, `/programs`, `/contact` in `shots/003/`
- [ ] Scroll sequence at 1440x900: start, 8%, 25%, mid-travel, 99%, arrival, arrival + 600 ms, then back up
- [ ] Reduced motion (emulated) and JavaScript off both show all three steps, the line and the text
- [ ] 390px: hero cards stay in the hero; "How it works" fades in once
- [ ] No horizontal scroll at 360, 390, 768, 1024, 1440, 1920; CLS at or below 0.05 through the whole transition
- [ ] `/about` returns 308 to `/our-way`; no `/about` link remains; nav and footer say "Our Way"
- [ ] Hero compared before and after with the existing hero snapshot scripts: unchanged
- [ ] Lighthouse mobile median of 5 runs on `/` no worse than the baseline (about 75)
- [ ] Lint fails if a component imports `@/content/data/*` (try it once)

## Owner inputs needed before launch

Program details and which are available; story, vision, mission and "who is behind it" text; email; location; response-time wording.
