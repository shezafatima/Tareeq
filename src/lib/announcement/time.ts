// Asia/Karachi date-times for the announcement window (specs/034-pricing-certificate-announcement research R12).
// Pakistan is UTC+05:00 all year (no daylight saving), so a fixed offset is exact and needs no time-zone data. Pure.

const OFFSET_MS = 5 * 60 * 60 * 1000;
const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** The Date for a Karachi wall-clock time typed as "YYYY-MM-DDTHH:mm". Null for anything that is not a real date and time. */
export function toUtcFromKarachi(local: string): Date | null {
  if (typeof local !== "string") return null;
  const m = LOCAL.exec(local.trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = [m[1], m[2], m[3], m[4], m[5]].map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi) - OFFSET_MS);
  // rolled-over values (31 February, 25:00) do not survive the way back
  return toKarachiInput(date) === `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` ? date : null;
}

/** A Date as the Karachi wall-clock text a datetime-local input shows. Empty for none or an invalid date. */
export function toKarachiInput(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const k = new Date(d.getTime() + OFFSET_MS);
  return `${pad(k.getUTCFullYear(), 4)}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}T${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
}
