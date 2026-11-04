import "server-only";
import * as z from "zod/mini";

// Server-only settings for lead capture (specs/006-lead-capture/contracts/env.md).
// Read lazily so pages that don't need them still build. Values are never logged; errors name the variable only.

export class ConfigError extends Error {
  constructor(names: string[]) {
    super(`Missing or invalid server settings: ${names.join(", ")}`);
    this.name = "ConfigError";
  }
}

const schema = z.object({
  MONGODB_URI: z.string().check(z.startsWith("mongodb")),
  RESEND_API_KEY: z.string().check(z.startsWith("re_")),
  LEAD_NOTIFICATION_TO: z.string().check(z.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  RATE_LIMIT_SECRET: z.string().check(z.minLength(32)),
  LEAD_EMAIL_FROM: z._default(z.string().check(z.minLength(3)), "Tareeq <onboarding@resend.dev>"),
});

export type ServerEnv = z.output<typeof schema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const raw = {
    MONGODB_URI: process.env.MONGODB_URI?.trim(),
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
    LEAD_NOTIFICATION_TO: process.env.LEAD_NOTIFICATION_TO?.trim(),
    RATE_LIMIT_SECRET: process.env.RATE_LIMIT_SECRET?.trim(),
    LEAD_EMAIL_FROM: process.env.LEAD_EMAIL_FROM?.trim() || undefined,
  };
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ConfigError([...new Set(result.error.issues.map((i) => String(i.path[0])))]);
  }
  cached = result.data;
  return cached;
}
