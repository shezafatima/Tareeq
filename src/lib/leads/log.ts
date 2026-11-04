import "server-only";

// The only logging call in the lead pipeline. It accepts no form data by design (research R12).

type LeadLog = {
  type: "workshop" | "course";
  ref?: string;
  outcome: string;
  code?: string;
};

// expected outcomes (including spam filtering) are information; anything else is logged as an error
const OK = new Set(["saved", "sent", "duplicate", "honeypot", "rate_limited"]);

export function logLead(event: "submit" | "notify", { type, ref, outcome, code }: LeadLog): void {
  const line = `[lead] event=${event} type=${type}${ref ? ` ref=${ref}` : ""} outcome=${outcome}${code ? ` code=${code}` : ""}`;
  if (OK.has(outcome)) console.info(line);
  else console.error(line);
}
