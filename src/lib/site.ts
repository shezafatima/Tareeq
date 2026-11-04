export type NavItem = { label: string; href: string };
export type SocialLink = { label: string; href: string };

export const navItems: NavItem[] = [
  { label: "Programs", href: "/programs" },
  { label: "Courses", href: "/courses" },
  { label: "Our Way", href: "/our-way" },
  { label: "Contact", href: "/contact" },
];

// Where every "Book a workshop" / "Join a workshop" call to action goes: the workshop page with the booking dialog open.
export const joinHref = "/workshop?book=1";

export const tagline = "AI, the practical way.";

export const whatsappMessage = "Hi Tareeq, I'd like to ask about your workshops.";

// Contact details live in src/content (read through getContactDetails). Add social links here; the footer shows only what exists.
export const socialLinks: SocialLink[] = [];

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
