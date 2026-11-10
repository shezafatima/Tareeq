// A wa.me chat link for a lead's number, with a short prefilled greeting. Pure, so it is unit-tested.
// Leads store phones as +E.164 or as typed; WhatsApp wants digits only, no plus sign.

/** `https://wa.me/<digits>?text=<greeting>`, or null when the phone has too few digits to be a number. */
export function whatsappLink(phone: string, fullName: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  const greeting = `Assalam o Alaikum${first ? ` ${first}` : ""}, this is Tareeq. Thank you for your request. How can we help?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(greeting)}`;
}
