// A wa.me chat link for a lead's number, with a short prefilled message naming the workshop or the course
// (specs/026-split-submissions research R13; wording is DRAFT for owner sign-off). Pure, so it is unit-tested.
// Leads store phones as +E.164 or as typed; WhatsApp wants digits only, no plus sign.

export type WhatsAppTopic = { type: "workshop"; organization: string } | { type: "course"; courseName: string };

/** `https://wa.me/<digits>?text=<message>`, or null when the phone has too few digits to be a number. */
export function whatsappLink(phone: string, fullName: string, topic: WhatsAppTopic): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  const about =
    topic.type === "workshop"
      ? `Thank you for your workshop request for ${topic.organization.trim()}.`
      : `Thank you for registering for ${topic.courseName.trim()}.`;
  const text = `Assalam o Alaikum${first ? ` ${first}` : ""}, this is Tareeq. ${about} When would be a good time to talk?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
