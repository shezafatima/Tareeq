# Component Contracts

There are no HTTP endpoints in this feature. These are the public props of the shared components. Server Components unless marked `client`.

## ui

```ts
// Container: shared max width and side padding (>=16px at 360px)
type ContainerProps = { as?: "div" | "section" | "header" | "footer"; className?: string; children: ReactNode };

// Button: renders <a>/Link when href is given, else <button>. Min height 44px.
type ButtonProps = {
  variant?: "primary" | "secondary";   // default "primary"
  size?: "md" | "lg";                  // default "md"
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

// Card: consistent surface
type CardProps = { as?: "div" | "article" | "li"; className?: string; children: ReactNode };

// SectionHeading: caller picks the level so a page keeps exactly one h1
type SectionHeadingProps = {
  as?: "h1" | "h2" | "h3";             // default "h2"
  eyebrow?: string;
  intro?: string;
  className?: string;
  children: ReactNode;                 // heading text
};

// Field: label, input, help text, error all tied by id / aria-describedby
type FieldProps = {
  label: string;
  name: string;
  help?: string;
  error?: string;                      // when set: aria-invalid + role="alert" message
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name">;
```

## layout

```ts
Header()            // no props; sticky, height var(--header-h); contains Logo, DesktopNav, MobileNav, Join button
Logo()              // links to "/"; accessible name "tareeq, home"
DesktopNav()        // hidden below md; <nav aria-label="Main">
MobileNav()         // client; shown below md
  // menu button: aria-expanded, aria-controls, aria-label "Open menu"
  // panel: role="dialog" aria-modal="true" aria-label="Main menu"
NavLink(props: { href: string; children: ReactNode; className?: string; onClick?: () => void })
                    // client; sets aria-current="page" when pathname matches
Footer()            // renders contact/social sections only when data exists
WhatsAppButton()    // renders null unless NEXT_PUBLIC_WHATSAPP_NUMBER matches /^\d{8,15}$/
```

## sections

```ts
PlaceholderPage(props: { title: string; intro?: string })
                    // one h1, "coming soon" line, uses Container + SectionHeading
```

## Routes

| Path | Component | Metadata title |
|---|---|---|
| `/programs` | `PlaceholderPage` | Programs |
| `/courses` | `PlaceholderPage` | Courses |
| `/about` | `PlaceholderPage` | About |
| `/contact` | `PlaceholderPage` | Contact |

## Error and edge behaviour

- Invalid or missing WhatsApp number: no button, no console error, no broken link.
- Empty contact or social data: the matching Footer block is not rendered.
- Unknown route: Next.js default 404 (unchanged).
