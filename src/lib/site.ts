export type NavItem = { label: string; href: string };

export const navItems: NavItem[] = [
  { label: "Programs", href: "/programs" },
  { label: "Courses", href: "/courses" },
  { label: "Our Way", href: "/our-way" },
];

const galleryNavItem: NavItem = { label: "Gallery", href: "/gallery" };

/** The main navigation. Gallery is listed only once an album is public (specs/032-admin-gallery FR-017); it comes after Courses. */
export function navItemsFor({ gallery }: { gallery: boolean }): NavItem[] {
  if (!gallery) return navItems;
  return [navItems[0], navItems[1], galleryNavItem, ...navItems.slice(2)];
}

// Where every "Book a workshop" / "Join a workshop" call to action goes: the workshop page with the booking dialog open.
export const joinHref = "/workshop?book=1";

// The mentor section on the home page.
export const mentorHref = "/#mentor";

// Where the fixed "Online courses" card on /programs and the home page goes: the course catalogue (025-courses-catalog).
export const onlineCoursesHref = "/courses";

export const tagline = "AI, the practical way.";

export const whatsappMessage = "Hi Tareeq, I'd like to ask about your workshops.";

// The footer is the only place for contact details. Contact values come from getSiteSettings() (src/lib/settings/data.ts,
// specs/028-site-settings); these helpers are pure and take them as arguments, so nothing here reads the environment.
export const footerContactHref = "#footer-contact";
const footerEmailHref = "#footer-email";

/** Where to send someone when WhatsApp is not available: the footer's email link, or its contact block if no email is set. */
export function contactFallbackHref(email: string | null): string {
  return email ? footerEmailHref : footerContactHref;
}

/** WhatsApp chat link for an E.164 number with a prefilled message, or null when the number is missing or malformed. Never put personal data in `message`. */
export function whatsappUrl(e164: string | null, message: string = whatsappMessage): string | null {
  const digits = e164?.replace(/\D/g, "") ?? "";
  if (!/^\d{8,15}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
