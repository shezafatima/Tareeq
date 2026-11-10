# Data Model: Admin Panel

No new collections and no schema changes. The panel reads and writes existing models.

## Lead (`leads`, `src/lib/leads/model.ts`)

| Field | Panel use |
|---|---|
| `_id` | Opaque id in `?lead=` and in action inputs |
| `ref`, `type` (`workshop`/`course`), `createdAt` | Listed; sort key `createdAt` descending |
| `status` (`new`/`contacted`/`booked`/`closed`) | **Editable**. `statusChangedAt` set to now on change |
| `adminNotes` (max 5000, trimmed) | **Editable** |
| `fullName`, `phone`, `email`, `message` | Read, searched, copied |
| Workshop: `role`, `organization`, `city`, `participants`, `preferredMonth` | Read, `organization` searched |
| Course: `courseName`, `level`, `ageGroup` | Read |
| `consent`, `notification` | Read-only in the drawer |

**State transitions**: any status may move to any other (the owner corrects mistakes); there is no enforced order. **Deletion**: hard delete, no undo (clarification Q3).

**Stats**: one aggregate grouped by `status`; missing statuses show 0.

## Program (`programs`, `src/lib/programs/model.ts`)

Fields: `title`, `slug` (unique, pattern, max 80), `audience`, `status`, `ctaType`, `summary`, `description`, `outcomes[]`, `curriculum[{title, description}]`, `facts{format, duration, groupSize, location}`, `priceText`, `coverImageUrl?`, `order`, `published`, timestamps. All fully editable as stored.

**Validation (shared client and server)**: limits from the model (see research R7); `order` is an integer; `coverImageUrl` is optional but, when present, `https://` or a site-relative path; empty outcome and curriculum rows are dropped before saving; `slug` unique (server-checked, duplicate-key handled).

**Lifecycle**: created unpublished by default; `published` toggles visibility; slug rename moves the public address (old address then shows "not found"); delete removes the document. Every write is followed by tag revalidation (research R6).

## Sign-in attempt (`rate_limits`, existing `RateLimit` model)

`{ key, createdAt }` with a TTL of 1 hour. Admin sign-in uses key = HMAC of `"admin-login:" + address`. One document per **failed** attempt; the lock applies when 5 or more exist within the last 15 minutes.

## Administrator and session (not stored)

The administrator exists only as `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` in the environment. The session is a signed JWT cookie holding `{ role: "admin" }` and an expiry 7 days after sign-in. Nothing about the session is written to the database.

## Public-site view (unchanged)

Visitors read programs through `src/lib/programs/data.ts` (cached by the tags `programs` and `program:<slug>`). The panel changes data and invalidates those tags; it does not change the readers.
