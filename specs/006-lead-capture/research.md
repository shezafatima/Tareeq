# Research: Lead Capture (006)

**Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

The owner approved these dependencies: MongoDB Atlas + Mongoose, zod (shared client/server), and Resend. They also ruled out a form library, an auth system, an image CDN and a UI component library. Each decision below lists what was chosen, why, and what else was considered. Next.js 16.4 behaviour was checked against `node_modules/next/dist/docs/` (forms.md, server-actions.md, after.md, server-and-client-components.md).

---

## R1. Server Actions vs Route Handlers

**Decision**: Server Actions (`'use server'`), one per form (`submitWorkshop`, `submitCourse`). Both call a shared `handleSubmission` pipeline. On the client they are consumed with React `useActionState`.

**Rationale**:
- **Works without JavaScript.** A `<form action={serverAction}>` driven by `useActionState` posts as a normal HTML form before hydration or with scripts off, and the server re-renders the page with the returned state. That covers the spec's slow-phone edge case and FR-018 (values kept with scripts off). A Route Handler needs `fetch` from client JS, so it would also need a separate no-JS path.
- **Built-in CSRF check.** Next compares `Origin` to `Host` on every action (server-actions.md, "Security"). A Route Handler would need this written by hand.
- **One typed contract.** The client imports the action reference. There is no public JSON API to version, document or protect separately.
- **Pending state for free.** `useActionState` exposes `pending`, which disables the button and prevents double submits (spec edge case).

**Trade-offs accepted**: an action is still a public POST endpoint, so every action validates, rate-limits and shapes its return value (no raw documents). Actions dispatch one at a time per client, which is irrelevant for a single form.

**Alternatives considered**: Route Handler `POST /api/leads`. It is easier to call from non-browser clients, but nothing needs that now. The later admin feature can add Route Handlers if it wants them.

---

## R2. Validation: zod, one definition, both sides

**Decision**: `zod` 4.6.7 via the `zod/mini` entry point. The schemas live in one pure module (`src/lib/leads/schema.ts`) that both the client form and the server action import. The course schema is a factory, `courseSchema(options)`, because the allowed course IDs come from `getCourseOptions()` at runtime.

**Rationale**:
- One source of rules satisfies FR-007 ("from one shared definition so the two cannot drift").
- `zod/mini` has the same validation engine with a tree-shakable functional API. Its client cost is a few KB gzipped, against roughly 15–20 KB for classic `zod`, which matters for Principle VI on a cheap phone. The server uses the same mini schemas, so nothing is duplicated.
- The server is authoritative. The client runs the schema on blur and on submit purely for speed. If the client passes and the server refuses (for example, a course removed between page load and submit), the server's errors are shown.

**Alternatives considered**: classic `zod` (larger client bundle, otherwise equal; fallback if `zod/mini` ergonomics block the implementation); HTML attributes only on the client (cannot express phone normalisation or cross-field messages, and would drift from the server).

---

## R3. Phone normalisation (default Pakistan, +92)

**Decision**: A small hand-written pure function, `normalisePhone(raw): { ok: true; e164 } | { ok: false }`, with no new dependency.

Rules:
1. Strip spaces, dashes, dots and brackets. A leading `00` becomes `+`.
2. **Pakistan.** Input matching `+92…`, `92…` (when 11–12 digits long), `0…`, or a bare `3XXXXXXXXX` is treated as Pakistani. The national number must be either
   - mobile: `3` followed by 9 digits (10 digits total), or
   - landline/UAN: starts `2`, or `4`–`9`, and is 9–10 digits long.
   The result is `+92` plus the national number.
3. **Other countries.** Input starting with `+` and a non-92 code is accepted when it has 8–15 digits in total and the first digit is not 0 (the E.164 shape).
4. Anything else is rejected with: "Please enter a valid phone number, for example 0300 1234567 or +44 7700 900123."

**Rationale**: Nearly every lead will be Pakistani, and the PK rules above are precise. Principle IX says to prefer what the project has. The shape check for foreign numbers is deliberately looser: it rejects garbage but will accept some numbers that do not exist.

**Alternatives considered**: `libphonenumber-js/min` (about 80 KB raw on the client, strict per-country validation). Not approved; it can be added later behind the same function signature if the owner wants strict foreign validation.

---

## R4. Keeping typed values on every failure path

**Decision**: Every non-success action state returns `values` (the trimmed submitted strings, never the honeypot). Each input renders `defaultValue={state.values?.x}`.

**Rationale**:
- No JS: the server renders the page with the action state, so `defaultValue` puts every value back.
- With JS: React 19 resets an uncontrolled `<form>` after an action finishes. The reset runs after the new state has rendered, so each field resets to its new `defaultValue`, which is the value just typed. The form also gets `key={state.attempt}`, so React remounts it cleanly per attempt.
- Checkbox (consent) and radios restore via `defaultChecked`.

**Risk**: this reset ordering is React behaviour, not a Next guarantee. quickstart.md has an explicit "type, fail, check values" step at both JS on and JS off, and the Playwright check asserts it.

---

## R5. Rate limiting: 5 per network address per rolling hour, both forms combined

**Decision**: A MongoDB collection `rate_limits`, one document per counted submission: `{ key, createdAt }`. It has a TTL index (`expireAfterSeconds: 3600`) and a compound index `{ key: 1, createdAt: -1 }`. Steps:
1. Derive the client address from `x-forwarded-for` (first entry; Vercel sets and overwrites it), falling back to `x-real-ip`, then `"unknown"`.
2. `key = HMAC-SHA256(address, RATE_LIMIT_SECRET)`, hex. The raw address is never stored or logged.
3. `countDocuments({ key, createdAt: { $gt: now - 1h } })`. If the count is 5 or more, refuse with `rate_limited`.
4. Otherwise insert `{ key, createdAt: now }`, then continue.

**What counts**: only submissions that pass validation (saved leads and honeypot hits). A visitor fixing their own validation errors is not penalised.

**Rationale**: Vercel functions are stateless, so an in-memory counter resets per instance and per cold start and would not enforce anything. MongoDB is already approved and present. The TTL index cleans up by itself. The `createdAt` filter makes the window exact even though the TTL monitor only runs about every 60 s. The race between count and insert can let at most one or two extra through under truly concurrent requests, which is acceptable for spam control.

**Flag for the owner**:
- This is a **second collection**, but it does not hold leads. Leads stay in one collection as instructed. The counter has nothing to do with a form type and expires within the hour.
- It needs **one extra environment variable**, `RATE_LIMIT_SECRET`. Without a secret, a hash of an IPv4 address can be reversed by brute force in minutes, which would be storing personal data.

**Alternatives considered**: Upstash/Vercel KV (a new service, not approved); counting `leads` by a stored IP hash (puts network data on the lead, which FR-013 forbids); raw IP with a TTL (personal data at rest, even if briefly).

---

## R6. Duplicate submissions (double tap, slow network)

**Decision**:
- The client disables the button while `pending`.
- The server uses a `submissionKey` (UUID v4) rendered into a hidden input. The page generates it per request (the page opts into dynamic rendering with `await connection()`), and it has a unique index on `leads`.
- An insert that hits duplicate-key error `11000` on `submissionKey` looks up the existing lead and returns the same success state (same `ref`). It is not counted against the rate limit twice and sends no second email.

**Rationale**: The button guard covers JS. The key covers a no-JS double POST and retries after a network drop. The key is random and carries no personal data.

---

## R7. Owner email via Resend, and when it is sent

**Decision**: `resend` 6.36.1. The email is sent **after the response** using `after()` from `next/server`. The save completes first, then the action returns success immediately, then the callback sends the email and writes `notification.state` (`sent` with the provider message ID, or `failed` with the provider's error **name** only).

**Rationale**:
- FR-014 (save before anything else) and FR-020 (the visitor sees success even if the email fails) fall out naturally.
- It keeps the round trip short on 4G (SC-001: under 3 s). The Resend call typically adds 300–800 ms.
- `after()` is supported on Vercel (after.md, Platform Support) through `waitUntil`.
- A failed notification stays on the record (`notification.state = "failed"`) so it can be resent. Resending is out of scope; the later admin feature can filter on it.

**Message**: a plain-text body plus a minimal HTML body, with every value HTML-escaped. `Reply-To` is the visitor's email so the owner can reply directly. The subject carries only the type and reference (for example `New workshop request · TQ-7K3P9Q`), so no personal data shows in lock-screen previews.

**Sender**: `LEAD_EMAIL_FROM` (optional). If unset, it defaults to `Tareeq <onboarding@resend.dev>`, which Resend only delivers to the Resend account's own address. That is fine for the pilot if `LEAD_NOTIFICATION_TO` is that address. A verified domain is needed before sending anywhere else. **Flag for the owner.**

**Alternatives considered**: sending the email inside the action before returning (slower; an email outage would either block success or need the same failure bookkeeping anyway); a queue/cron retry (a new service; out of scope).

---

## R8. MongoDB connection on Vercel

**Decision**: Mongoose 9.11.4 with a single cached connection on `globalThis` (`src/lib/db/mongoose.ts`), reused across warm invocations and hot reloads. Options: `bufferCommands: false` (fail fast instead of queueing), `serverSelectionTimeoutMS: 5000`, `maxPoolSize: 5`. The database name comes from the URI path (`tareeq_dev` locally, `tareeq` in production).

**Rationale**: This is the standard serverless pattern. It avoids a connection storm and fails within 5 s so the visitor sees the friendly error instead of a hang. The Atlas cluster region should be the one nearest the Vercel function region (Mumbai, `ap-south-1` / `bom1`, for Pakistani visitors); see quickstart.

**Indexes**: Mongoose `autoIndex` stays on (the default). At this scale, building indexes once per new cluster at first connect costs nothing, and it removes a manual migration step. The admin feature inherits the indexes already in place.

**Server-only guard**: every DB, email and environment module starts with `import "server-only"`. Next.js 16 handles this without installing the package (server-and-client-components.md). Importing such a module from a client file fails the build.

---

## R9. Course options source

**Decision**: `getCourseOptions(): Promise<CourseOption[]>` is exported from `src/content/index.ts`, next to the other content getters. It is backed by `src/content/data/courses.ts` (a hardcoded, `DRAFT`-marked list) and always appends `{ id: "not-sure", name: "Not sure yet" }`.

**Rationale**: It is async and returns plain `{ id, name }` objects, so the later courses feature can swap the body for a database query without touching callers (FR-004). The server page passes the options to the client form as props, and the server action calls `getCourseOptions()` again to build the schema. Nothing else imports `data/courses.ts`. The lead stores both `courseId` and `courseName` (a snapshot), so later list changes do not rewrite history.

---

## R10. The "Join the waitlist" label

**Decision**: `export const courseFormLabel = "Join the waitlist"` in `src/content/data/leads.ts`, read through a getter in `src/content/index.ts`. The /register page heading, the submit button, and the footer, Courses and Contact links all use it.

**Rationale**: This is the owner's instruction: one constant, which the courses feature changes to "Register".

---

## R11. Testing approach (no new test dependency)

**Decision**:
- **Unit**: Node 24's built-in runner (`node --test tests/unit/`), with native TypeScript type-stripping. It covers `normalisePhone`, the zod schemas, the reference generator, the IP/HMAC key derivation and the month options. The pure modules under test import only `zod/mini` and each other through relative paths with `.ts` extensions. This needs `"allowImportingTsExtensions": true` in `tsconfig.json`, which is valid because the project already sets `noEmit`.
- **End to end**: a Playwright script in `scripts/leads-check.mjs`, following the project's existing `scripts/*-check.mjs` convention with the `@playwright/test` package already installed. It covers the happy paths, every rejection path, value preservation with JS on and off, rate limiting, focus and announcements, and screenshots at 1440×900 and 390×844.
- **Database and email**: `scripts/leads-db-check.mjs` connects with the `mongodb` driver (already installed under Mongoose) and confirms each record by `ref`, then calls Resend `emails.get(providerId)` to confirm delivery status. The owner's inbox is checked by eye.

**Alternatives considered**: Vitest or Jest (a new dev dependency without a clear gain); Playwright's test runner for unit tests (works, but heavier than `node --test`).

---

## R12. Logging without personal data

**Decision**: A single `logLead(event, { type, ref?, outcome, code? })` helper is the only logging call in the lead pipeline. `code` is an error class or provider error name (for example `MongoServerSelectionError`, `rate_limited`). No field values, addresses, emails or phones are logged. Error messages are never echoed to the client.

**Rationale**: Covers FR-024 and Principle V.

---

## Open numbering note

The owner's input refers to "feature 004's admin panel" and "feature 005" for courses. Both numbers are already used (004 site visual polish, 005 robot carousel). This plan treats them as "the later admin feature" and "the later courses feature". The design does not depend on their numbers.
