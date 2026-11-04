// Phone normalisation for the lead forms (specs/006-lead-capture/research.md R3).
// Pure: shared by the client form and the server action. Pakistani numbers are checked precisely;
// other countries (written with a leading +) only get an E.164 shape check.

export const PHONE_ERROR = "Please enter a valid phone number, for example 0300 1234567 or +44 7700 900123.";

export type PhoneResult = { ok: true; e164: string } | { ok: false };

const PK_MOBILE = /^3\d{9}$/;
const PK_LANDLINE = /^[24-9]\d{8,9}$/;

function pakistan(national: string): PhoneResult {
  return PK_MOBILE.test(national) || PK_LANDLINE.test(national) ? { ok: true, e164: `+92${national}` } : { ok: false };
}

export function normalisePhone(raw: string): PhoneResult {
  let s = raw.trim().replace(/[\s\-.()]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;

  if (s.startsWith("+")) {
    const digits = s.slice(1);
    if (!/^\d+$/.test(digits)) return { ok: false };
    if (digits.startsWith("92")) return pakistan(digits.slice(2));
    return digits.length >= 8 && digits.length <= 15 && digits[0] !== "0" ? { ok: true, e164: `+${digits}` } : { ok: false };
  }

  if (!/^\d+$/.test(s)) return { ok: false };
  if (s.startsWith("92") && (s.length === 11 || s.length === 12)) return pakistan(s.slice(2));
  if (s.startsWith("0")) return pakistan(s.slice(1));
  if (s.length === 10 && s.startsWith("3")) return pakistan(s);
  return { ok: false };
}
