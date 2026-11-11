# Contract: routes and UI (026)

Every route below is under `src/app/admin/(panel)/`. Each page calls `requireAdmin()`, and the panel layout calls it too.

## Routes

| Route | Behaviour |
|---|---|
| `/admin` | `redirect("/admin/submissions/workshops")` (temporary until the dashboard). The query string is dropped. |
| `/admin/submissions` | `redirect("/admin/submissions/workshops")` |
| `/admin/submissions/workshops` | Workshop view |
| `/admin/submissions/courses` | Course registrations view |
| old combined list | removed |

## Query parameters

Unknown or malformed values are ignored. Changing any filter or the search resets `page` and closes the drawer.

| Param | Workshops | Courses | Allowed |
|---|---|---|---|
| `status` | ✓ | ✓ | `new`, `contacted`, `booked`, `closed` |
| `q` | ✓ | ✓ | trimmed, ≤ 100 chars |
| `page` | ✓ | ✓ | integer ≥ 1, clamped to last page |
| `lead` | ✓ | ✓ | 24-hex id; opens the drawer only if the record is this view's type |
| `role` | ✓ | | `school`, `teacher` |
| `month` | ✓ | | `YYYY-MM` |
| `course` | | ✓ | course id, `not-sure`, or legacy id `[a-z0-9-]{1,64}` |
| `category` | | ✓ | 24-hex category id |
| `level` | | ✓ | `beginner`, `some-experience` |
| `age` | | ✓ | `under-18`, `18-plus` |

## Workshop view

- **H1**: "Workshop requests".
- **Stat strip**: New · Contacted · Booked · Closed, counting workshop records only. Each card toggles the status filter.
- **Filters**: Status, Role, Preferred month. The month options are the distinct months stored on workshop records, newest first, with labels from `monthLabel`. Search placeholder: "Search name, phone, email or organization".
- **Table** (md and up) columns: Name (+ ref), Role, Organization, Participants, Preferred month, Status (+ Mark contacted), Received.
- **Card** (below md): name + status, organization · role, participants · preferred month, received date, Mark contacted.
- **Empty states**: "No workshop requests yet." / "No workshop requests match these filters." + Clear filters.
- **Drawer**: header (name, status chip, "Workshop request", ref); status select (workshop labels); WhatsApp, copy phone, copy email; rows Phone, Email, Received, Status changed, Role, Organization, City, Participants, Preferred month, Message, Consent, Email alert; notes; delete.

## Course view

- **H1**: "Course registrations".
- **Stat strip**: New · Contacted · Enrolled · Closed, counting course records only.
- **Filters**: Status (with "Enrolled" for `booked`), Course, Category, Level, Age group. Search placeholder: "Search name, phone or email".
- **Table** columns: Name (+ ref), Course (stored title), Category, Level, Age group, Status (+ Mark contacted), Received.
- **Card**: name + status, course title, category · level · age group, received date, Mark contacted.
- **Empty states**: "No course registrations yet." / "No course registrations match these filters." + Clear filters.
- **Drawer**:
  - Header: name, status chip, "Under 18" badge when `ageGroup = under-18`, "Course registration", ref.
  - Status select with course labels.
  - WhatsApp, copy phone, copy email.
  - Rows: Phone, Email, Received, Status changed, Course, Category, Level, Age group, Message, Consent, Email alert.
  - The Course row shows the stored title plus:
    - "Edit course" link → `/admin/courses/<id>/edit` if the course exists
    - "Course removed" text if it doesn't
    - nothing for "Not sure yet"
  - Notes, delete.

## Row quick action: `RowStatus` (client leaf)

- Shows the status chip with the view's labels. When the status is `new`, it also shows a "Mark contacted" button (min 44×44px, `relative z-10` above the row link). The button's accessible name includes the person's name: "Mark {name} contacted".
- On press: the chip shows Contacted at once (optimistic) and the button is disabled. On `ok`: toast "Marked contacted". On failure: roll back + the `useActionFeedback` error toast.
- No added motion.

## Sidebar / mobile menu (`AdminNav`)

```
Submissions                (group heading, not a link)
  Workshops            [4] -> /admin/submissions/workshops
  Course registrations [1] -> /admin/submissions/courses
Programs                   -> /admin/programs
Courses                    -> /admin/courses
```

- A badge is a pill showing the count of `new` records of that type. It is hidden at 0 and when the counts can't be loaded. Its screen-reader text is "{n} new".
- Active: an exact path or prefix match per item, marked with `aria-current="page"`. The saffron indicator moves with a transform only, and its transition is off under reduced motion.

## WhatsApp prefill (DRAFT copy, owner sign-off)

- Workshop: "Assalam o Alaikum {first}, this is Tareeq. Thank you for your workshop request for {organization}. When would be a good time to talk?"
- Course: "Assalam o Alaikum {first}, this is Tareeq. Thank you for registering for {courseName}. When would be a good time to talk?"
