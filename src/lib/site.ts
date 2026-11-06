export type NavItem = { label: string; href: string };

export const navItems: NavItem[] = [
  { label: "Programs", href: "/programs" },
  { label: "Courses", href: "/courses" },
  { label: "Our Way", href: "/our-way" },
];

// Where every "Book a workshop" / "Join a workshop" call to action goes: the workshop page with the booking dialog open.
export const joinHref = "/workshop?book=1";

// Where the fixed "Online courses" card goes. Change this to "/courses" when the Courses feature ships.
export const onlineCoursesHref = "/register";

export const tagline = "AI, the practical way.";

export const whatsappMessage = "Hi Tareeq, I'd like to ask about your workshops.";

// The footer is the only place for contact details (read through getFooterContact in src/content).
export const footerContactHref = "#footer-contact";
const footerEmailHref = "#footer-email";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The public contact email, or null when it is missing or invalid. */
export function getContactEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return email && EMAIL_SHAPE.test(email) ? email : null;
}

/** Where to send someone when WhatsApp is not available: the footer's email link, or its contact block if no email is set. */
export function getContactFallbackHref(): string {
  return getContactEmail() ? footerEmailHref : footerContactHref;
}

/** Returns the WhatsApp chat link, or null when the number is missing or invalid. */
export function getWhatsAppUrl(): string | null {
  return getWhatsAppUrlWithMessage(whatsappMessage);
}

/** WhatsApp chat link with a prefilled message, or null when the number is missing or invalid. Never put personal data in `message`. */
export function getWhatsAppUrlWithMessage(message: string): string | null {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number || !/^\d{8,15}$/.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
