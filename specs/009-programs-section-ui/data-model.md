# Data Model: Home Program Cards

Typed content only. No database, no API. Lives in `src/content/home-programs.ts`, typed in `src/content/types.ts`, read through `getHomeProgramCards()` (async, sorted by `order`) so the admin feature can swap the source without touching components.

## HomeProgramCard

| Field | Type | Rules |
|---|---|---|
| `id` | string | unique, stable (used as React key) |
| `title` | string | required, one line to two lines |
| `audience` | string | required, one short line ("School teachers", "Grades 6-10") |
| `status` | `"booking-now" \| "register-interest" \| "coming-soon"` | required; drives the chip text and the quiet look |
| `statusLabel` | string | the visible chip words ("Booking now", "Register interest", "Coming soon") |
| `facts` | `{ label: string; value: string }[]` | 2-3 expected: Format, Duration, Group size. Empty `value` entries are skipped, never shown blank |
| `cta` | `HomeProgramCta` | required |
| `featured` | boolean (optional) | at most one is treated as featured (the first); none → all normal size |
| `order` | number | display order 1..n |

## HomeProgramCta

```ts
type HomeProgramCta =
  | { kind: "link"; label: string; href: string }          // internal path, e.g. joinHref, "/register"
  | { kind: "whatsapp"; label: string; message: string };  // message prefilled; no personal data
```

Resolution (in the section, server side): `link` → `<Link>`; `whatsapp` → `getWhatsAppUrlWithMessage(message)`, external link, omitted when it returns `null`.

## The five seed entries (DRAFT, owner to review)

| order | id | title | audience | status | CTA |
|---|---|---|---|---|---|
| 1 | teachers-workshop (featured) | AI for Teachers workshop | School and college teachers | Booking now | link "Book a workshop" → `/workshop?book=1` |
| 2 | students-workshops | School student workshops | Grades 6-10 | Booking now | link → `/workshop?book=1` |
| 3 | online-courses | Online courses | (draft) Anyone ready to learn at their own pace | Register interest | link → `/register` |
| 4 | college-university | College & university | (draft) College and university students | Coming soon | whatsapp "Ask on WhatsApp" |
| 5 | corporate-teams | Corporate teams | Professionals and teams | Coming soon | whatsapp "Ask on WhatsApp" |

Facts (format, duration, group size) are drafts except teacher "Half a day" and "In person, at your school", which come from the existing data.

## Derived (not stored)

- `quiet = status === "coming-soon"`.
- Featured layout class = first card with `featured: true`.

## Unchanged

`Program`, `programs` data, `getPrograms()`, `getProgramPreview()` stay as they are (still used by `/programs`).
