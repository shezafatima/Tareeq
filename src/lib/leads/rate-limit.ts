import "server-only";
import { getServerEnv } from "@/lib/env";
import { RateLimit } from "./model";
import { deriveKey, firstForwardedAddress } from "./rate-key";

// Rate limit: 5 counted submissions per network address per rolling hour, both forms together
// (specs/006-lead-capture/research.md R5). Counts live in the self-expiring `rate_limits` collection.

export const RATE_LIMIT_MAX = 5;
const WINDOW_MS = 60 * 60 * 1000;

/** The counting key for this request. On Vercel x-forwarded-for always carries the visitor's address. */
export function clientKey(h: Headers): string {
  const address = firstForwardedAddress(h.get("x-forwarded-for")) ?? (h.get("x-real-ip")?.trim() || "unknown");
  return deriveKey(address, getServerEnv().RATE_LIMIT_SECRET);
}

/** Counts one submission for `key`. Returns false (and counts nothing) when the key already used its 5 this hour. */
export async function checkAndCount(key: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const used = await RateLimit.countDocuments({ key, createdAt: { $gt: since } });
  if (used >= RATE_LIMIT_MAX) return false;
  await RateLimit.create({ key, createdAt: new Date() });
  return true;
}
