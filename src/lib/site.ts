export type NavItem = { label: string; href: string };
export type ContactDetail = { label: string; value: string; href?: string };
export type SocialLink = { label: string; href: string };

export const navItems: NavItem[] = [
  { label: "Programs", href: "/programs" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// Where "Book a workshop" goes until a sign-up page exists.
export const joinHref = "/contact";

export const tagline = "AI, the practical way.";

export const whatsappMessage = "Hi Tareeq, I'd like to ask about your workshops.";

// Add entries here. The footer shows only what exists.
export const contactDetails: ContactDetail[] = [];
export const socialLinks: SocialLink[] = [];

/** Returns the WhatsApp chat link, or null when the number is missing or invalid. */
export function getWhatsAppUrl(): string | null {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number || !/^\d{8,15}$/.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage)}`;
}
