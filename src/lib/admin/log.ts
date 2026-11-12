import "server-only";

// The only logging call in the admin code. It accepts no form data, names, phones, emails, notes or search text by design:
// just an event name, an outcome and (optionally) an opaque record id.

type AdminEvent = "sign-in" | "lead" | "program" | "course" | "category" | "settings" | "testimonial" | "gallery" | "blog";

export function logAdmin(event: AdminEvent, outcome: string, id?: string): void {
  const line = `[admin] event=${event} outcome=${outcome}${id ? ` id=${id}` : ""}`;
  if (outcome === "ok" || outcome === "locked" || outcome === "failed") console.info(line);
  else console.error(line);
}
