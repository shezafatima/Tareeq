# Data Model: Audience

Typed content, row-like (stable id, explicit order). Lives in `src/content/audiences.ts`, read through `getAudiences()`.

| Field | Type | Rule |
|---|---|---|
| id | string (today: `teachers`, `school-students`, `college-students`, `online-learners`, `corporate-teams`) | unique, stable; the display derives icon, tint and motion from it |
| name | string | card heading, e.g. "School students (Grades 6-10)" |
| benefit | string | one line describing a change, not a programme |
| cta | `HomeProgramCta`: `{kind:"link", label, href}` or `{kind:"whatsapp", label, message}` | internal path, or a WhatsApp ask with no personal data |
| order | number | 1 to 5 |

Display-only, kept out of the data (FR-017): icon, tint, motion. An unknown id falls back to a neutral icon and the royal tint, so rows added later by the admin still render.

Validation: an empty list renders nothing; long text wraps, never truncates. `name`, `benefit`, `order` are unchanged from today's `Audience`; `cta` is added.

All text is DRAFT for owner review: names, benefit lines, "See how" label, WhatsApp messages.
