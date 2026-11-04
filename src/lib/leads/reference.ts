// Short, non-personal reference shown on the confirmation and used in the WhatsApp prefill. Pure.

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const REF_PATTERN = /^TQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export function generateRef(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = "TQ-";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}
