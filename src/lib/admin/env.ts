import "server-only";
import * as z from "zod/mini";
import { readEnv } from "@/lib/env";

// Admin settings (specs/022-admin-panel/contracts/env.md). Read lazily so public pages and the build never need them.
// A problem throws a ConfigError that names the variable only, never the value.

const schema = z.object({
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD_HASH: z.string().check(z.regex(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/)),
  AUTH_SECRET: z.string().check(z.minLength(32)),
});

export type AdminEnv = z.output<typeof schema>;

let cached: AdminEnv | null = null;

export function getAdminEnv(): AdminEnv {
  cached ??= readEnv(schema, {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH?.trim(),
    AUTH_SECRET: process.env.AUTH_SECRET?.trim(),
  });
  return cached;
}
