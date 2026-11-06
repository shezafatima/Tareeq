# Research: Programs Pages (015)

Next.js facts come from the docs bundled in `node_modules/next/dist/docs/` (16.4.3). "Verified" means it was run during planning; "to verify" items have a check in [quickstart.md](./quickstart.md).

## R1. Caching API

- **Decision**: `unstable_cache` with `tags` and `revalidate: 3600`.
- **Rationale**: this is the documented non-`fetch` cache for projects without Cache Components, and the tags work with `revalidateTag`. Throwing is not cached, which satisfies "failed reads are not cached".
- **Alternatives**: `use cache` plus `cacheTag` is the recommended future path, but needs the global `cacheComponents` flag, which changes rendering for the whole site, including the signed-off hero. That is a separate migration. An uncached read per request would make the home page dynamic.
- **Note**: the docs mark `unstable_cache` as replaced by `use cache`. It stays behind one module, so a later migration touches only `data.ts`.

## R2. Rendering and outage behaviour

- **Decision**: all three routes are static with `export const revalidate = 3600`. Reads behave by phase:

| Phase | On a failed read |
|---|---|
| `next build` (`NEXT_PHASE === "phase-production-build"`) | Degrade: unavailable state, so the build succeeds. `generateStaticParams` returns `[]` |
| Production runtime | Throw: regeneration fails, Next keeps the last good page and retries on the next request. With no page yet, `(site)/error.tsx` shows |
| Development | Degrade: there is no last good page to protect |

- **Rationale**: if a page caught the error at runtime, its degraded version would be saved and could stay for an hour after a brief outage. The docs state that the last successful version is served when regeneration throws.
- **Hourly refresh**: on-demand tags alone would leave a degraded build, or a page built before seeding, in place until someone saved in the admin. `revalidate: 3600` is the backstop, at one database read per hour per page at most.
- **Alternatives**: `connection()` per request keeps failed reads out of the page cache, but makes the home page dynamic and slower on every visit (Principle VI). Cache Components is rejected in R1.
- **To verify**: keep-last-good under `next start` (Milestone 1), including that tagged `unstable_cache` reads also refresh the page cache.

## R3. Filter mechanism

- **Decision**: panels are server-rendered with `data-filter="<value>"`. `ProgramFilter` sets `data-active` on the list. CSS does the rest:
  - `[data-active="teachers"] > [data-filter]:not([data-filter="teachers"]) { display: none }`
  - Numbers use a CSS counter (`decimal-leading-zero`). `display: none` items do not increment it, so numbering restarts at 01.
  - Surfaces use `:nth-child(even of [data-filter="teachers"])`, setting custom properties that the panel consumes.
- **URL state**: `useSyncExternalStore` over `location.search` with `"all"` as the server snapshot, so hydration never mismatches. Changes use `history.replaceState`, which Next's router supports.
- **First paint**: a small inline script after the list sets `data-active` from `?for=` before paint, so a shared link does not flash other programs. It does not run after client navigation, so the leaf also applies the value on mount in a layout effect. Chip highlight may update at hydration; panels do not flash.
- **Without JavaScript**: all programs show, and chips are hidden through the existing `data-js` flag.
- **Rationale**: this meets Principle XI literally. The client never re-renders the panels, and filtering costs one attribute write, far inside 100ms.
- **Alternatives**: `useSearchParams` makes the nearest Suspense boundary client-rendered in static pages, which removes panels from the HTML unless carefully split. Reading `searchParams` in the page makes it dynamic. Passing panels through a client list means more client code for the same result.
- **Browser support**: `:nth-child(of)` and `:has()` are inside the baseline Tailwind 4 already requires.

## R4. Markdown and sanitizing

- **Decision**: `marked` 18.1.3 renders; `sanitize-html` 2.18.1 sanitizes the result on the server.
  - Allowed tags: `h2 h3 h4 p ul ol li strong em a blockquote code pre br hr`. `h1` becomes `h2`, so each page keeps one H1.
  - Links: `http`, `https` and `mailto` only, with `rel="noopener noreferrer"`. No images, no `style`, no event attributes.
- **Rationale**: `marked` is small and has no dependencies. `sanitize-html` is allowlist-based and needs no DOM. Neither reaches the browser because only a Server Component imports them.
- **Alternatives**: `isomorphic-dompurify` pulls in `jsdom`, which is heavy and awkward on serverless. `remark` plus `rehype-sanitize` is sound, but many more packages for this need.

## R5. Seed under `tsx`

- **Decision**: `tsx --conditions=react-server scripts/seed-programs.ts`, with `server-only` added as a dev dependency.
- **Verified** in a scratch project with the same tsconfig path alias: without the condition the import throws "This module cannot be imported from a Client Component module"; with it the import succeeds, and `dotenv` plus `@/` both resolve. `server-only` is not in `node_modules` today because Next resolves it internally.
- **To verify**: Mongoose under the condition, and that the build is unaffected by the package (Milestone 1).
- **Rationale**: the guard stays on the DB module and the script imports it directly, as the owner asked. No shim or alias is needed.

## R6. Insert-only upsert

- **Decision**: per program, `Program.updateOne({ slug }, { $setOnInsert: doc }, { upsert: true, timestamps: false })`, where `doc` carries its own `createdAt` and `updatedAt`. Created versus existing is counted from `upsertedCount`.
- **Pitfalls this avoids**:
  - With `timestamps: true`, Mongoose adds `$set: { updatedAt }` to updates, which would modify every existing document on each run and break the owner's "never modifies" rule.
  - Update validators do not cover `$setOnInsert`, so each seed entry is validated first with `new Program(seed).validateSync()`, and defaults come from that instance.
  - `await Program.init()` builds the unique index before the first write.
- **To verify**: AC3 in the spec compares a program's `updatedAt` across runs.

## R7. Env split without changing lead capture

- **Finding**: today `connectDb()` calls `getServerEnv()`, which validates all lead settings. A missing `RESEND_API_KEY` therefore throws at `src/lib/leads/actions.ts` line 111, and the visitor gets the generic error with nothing stored. That guard is a side effect the split would remove: the lead would save, `notifyOwner` would swallow the failure, and the visitor would see success.
- **Decision**: each module exports its own validator. `handleSubmission` calls `getResendEnv()` and `getRateLimitSecret()` immediately before its `connectDb()`.
- **Outcomes kept**: invalid form fields still return field errors first, since parsing runs earlier. Duplicate, rate-limit and success paths are untouched, and the failure still logs `ConfigError` with the generic `error` state.
- **Honeypot**: the answer is unchanged. With Resend settings missing, a bot may now be counted against the rate limit where previously the count was skipped. That has no visitor-facing effect and only arises on a misconfigured site.
- **Alternatives**: keeping one schema with optional fields moves the checks to every caller and weakens the errors.

## R8. Calls to action and labels

- **Decision**: one pure `resolveProgramCta(program, whatsappUrl)` drives panels, booking card, bar and home cards.
- **WhatsApp message**: `Hi Tareeq, I'd like to ask about the <title> program.` Replaces the two hand-written messages, as the model has no message field. Those cards are hidden on the home page, so home is unaffected.
- **Fallback**: no WhatsApp number means `null` on panels and a link to the footer's email on the booking card and bar (the footer's contact block if no email is set).

## R13. Online courses card (owner change)

- **Decision**: a fixed `HomeProgramCard` in `src/content/online-courses.ts`, with its target in `onlineCoursesHref`. Home appends it to its cards; /programs renders it as the last list item with `data-filter="online"` and no counter increment.
- **"Online" chip kept**: the brief's chip list is unchanged, and the chip shows this card, so online learners still have a route.
- **Outage**: home still hides its whole section when programs cannot be read, as the spec says. /programs keeps the card, since it needs no database.

## R14. Footer as the only contact place (owner change)

- **Fallback target**: an in-page link to the email entry in the footer (`#footer-email`), so the address is visible and it works without a mail app.
- **YouTube and LinkedIn**: read from `src/content/mentor.ts`, the only such addresses in the project, so they stay in one place. These are the founder's own accounts.
- **Email**: `NEXT_PUBLIC_CONTACT_EMAIL`. No address was invented; the entry is hidden until the setting is filled in.
- **Location**: dropped, since the owner's list is WhatsApp, email, YouTube and LinkedIn. `NEXT_PUBLIC_CONTACT_LOCATION` is removed.
- **Sitemap**: the project has none, so there was nothing to change.

## R9. Home card mapping

- **Decision**: `toHomeCard(program)` keeps the existing `HomeProgramCard` component and type. `summary` fills the audience line; facts are format, duration and group size.
- **Guard**: `scripts/programs-check.mjs` from feature 009 must pass unchanged, which proves the home section did not move.

## R10. Mobile bar and floating WhatsApp button

- **Decision**: the bar has `data-program-cta-bar` and is fixed below `lg`. CSS uses `:root:has([data-program-cta-bar])` to pad the page bottom, so the footer is not covered, and to raise the floating button (with a new data attribute) using `transform`.
- **Alternatives**: reserving space inside the bar leaves the 56px button poking above a shorter bar. Hiding the button removes a site-wide contact route.

## R11. Panel expansion without overflow

- **Decision**: `transform: scale(1.012)` on the inner article under `@media (hover: hover) and (pointer: fine)`, with the list set to `overflow-x: clip`. The `Reveal` wrapper stays on the `li` and never carries the hover transform (per its contract). `:focus-within` applies the same state.
- **Saffron number**: two stacked layers crossfaded with opacity, since colour is not an allowed animation property. On navy the second layer is saffron numerals; on paper it is a saffron shape behind dark numerals.

## R12. Cover images and Open Graph

- **Decision**: `isAllowedCover(url)` accepts site-relative paths and `https://res.cloudinary.com/...`, which is added to `images.remotePatterns`. Anything else falls back to the pattern rather than letting `next/image` throw. The pattern always sits behind the image, so a failed load shows it.
- **Open Graph**: a child `openGraph` object replaces the parent's, so images are set explicitly: the cover if allowed, otherwise the site's `/robot.png`.
- **Pattern**: a CSS gradient and geometric layer from brand tokens only, with no purple, neon or circuit lines (Principle III).
