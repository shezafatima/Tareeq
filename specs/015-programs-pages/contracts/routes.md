# Contract: Routes and Calls to Action

## `/programs`

Static, `revalidate = 3600`.

| Query | Effect |
|---|---|
| none | All published programs |
| `?for=teachers`, `students`, `college`, `corporate` | Matching audience only. `students` means `school-students` |
| `?for=online` | The fixed Online courses card only |
| Anything else | Treated as all; the address is left as is until a chip is pressed |

Chip changes use `history.replaceState`: no new history entry and no server request. "All" removes `for` and keeps other parameters.

DOM contract for the CSS filter:

```html
<ul id="program-list" data-active="teachers">   <!-- attribute absent for All -->
  <li data-filter="teachers" data-status="booking-now"> ... </li>
</ul>
```

## `/programs/[slug]`

Static for published slugs at build, on demand for later ones, `revalidate = 3600`.

| Case | Response |
|---|---|
| Published | 200 |
| Unpublished, unknown or malformed | 404 through `[slug]/not-found.tsx` |
| Database failure with no good page | Error state through `(site)/error.tsx`; never a 404 |

**Metadata**: `title` from the program title, `description` from the summary, `openGraph` with title, description, canonical URL and image (allowed cover, else `/robot.png`).

## Call to action

| `ctaType` | Label | Destination | Opens |
|---|---|---|---|
| `workshop-modal` | Book a workshop | `/workshop?book=1` | Same tab, booking dialog open |
| `register` | Register interest | `/register` | Same tab |
| `whatsapp` | Ask on WhatsApp | `https://wa.me/<number>?text=Hi Tareeq, I'd like to ask about the <title> program.` | New tab |
| `whatsapp`, no number | Panels: none. Booking card and bar: "Email us" | `#footer-email` | Same tab |
| `whatsapp`, no number, no email | Panels: none. Booking card and bar: "Contact us" | `#footer-contact` | Same tab |

## Online courses card

Fixed, not stored: `onlineCoursesCard` in `src/content/online-courses.ts`. Links to `onlineCoursesHref` in `src/lib/site.ts` (`/register` until Courses ships). There is no `/programs/online-courses` page.

## Removed address

The old contact page's address redirects permanently to `/` (`next.config.ts`).

## Status chip

`booking-now` "Booking now"; `register-interest` "Register interest"; `coming-soon` "Coming soon".
