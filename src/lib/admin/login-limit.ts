import "server-only";
import { connectDb } from "@/lib/db/mongoose";
import { RateLimit } from "@/lib/leads/model";
import { getRateLimitSecret } from "@/lib/leads/rate-limit";
import { deriveKey, firstForwardedAddress } from "@/lib/leads/rate-key";
import { isOverLimit, windowStart } from "./login-window";

// Failed admin sign-ins, counted per hashed network address in the same self-expiring collection the lead forms use.
// The key is namespaced so it can never collide with a lead-form key. Records live an hour; only the last 15 minutes count.

function keyFor(headers: Headers): string {
  const address = firstForwardedAddress(headers.get("x-forwarded-for")) ?? (headers.get("x-real-ip")?.trim() || "unknown");
  return deriveKey(`admin-login:${address}`, getRateLimitSecret());
}

/** True when this address already has 5 failures in the last 15 minutes. Throws if the database cannot be read. */
export async function isLocked(headers: Headers): Promise<boolean> {
  await connectDb();
  const failures = await RateLimit.countDocuments({ key: keyFor(headers), createdAt: { $gt: windowStart(new Date()) } });
  return isOverLimit(failures);
}

/** Counts one failed attempt. */
export async function recordFailure(headers: Headers): Promise<void> {
  await connectDb();
  await RateLimit.create({ key: keyFor(headers), createdAt: new Date() });
}
