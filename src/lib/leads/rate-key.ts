// Turns a visitor's network address into the key the rate limit counts by (specs/006-lead-capture/research.md R5).
// The key is an HMAC, so the address itself is never stored or logged and cannot be recovered without the secret.
import { createHmac } from "node:crypto";

/** The first address in an x-forwarded-for header ("client, proxy1, proxy2"), or null when there is none. */
export function firstForwardedAddress(value: string | null | undefined): string | null {
  const first = value?.split(",")[0]?.trim();
  return first ? first : null;
}

/** HMAC-SHA256 of the address with a server secret, as 64 hex characters. */
export function deriveKey(address: string, secret: string): string {
  return createHmac("sha256", secret).update(address).digest("hex");
}
