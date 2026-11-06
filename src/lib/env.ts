import "server-only";
import * as z from "zod/mini";

// Shared helper for per-module settings validation (specs/015-programs-pages/contracts/env.md).
// Each module validates only its own variables, lazily, so pages that don't need them still build.
// Values are never logged; errors name the variable only.

export class ConfigError extends Error {
  constructor(names: string[]) {
    super(`Missing or invalid server settings: ${names.join(", ")}`);
    this.name = "ConfigError";
  }
}

/** Parses `raw` with `schema`, or throws a ConfigError naming the variables that failed. */
export function readEnv<S extends z.ZodMiniType>(schema: S, raw: Record<string, string | undefined>): z.output<S> {
  const result = z.safeParse(schema, raw);
  if (!result.success) {
    throw new ConfigError([...new Set(result.error.issues.map((i) => String(i.path[0])))]);
  }
  return result.data;
}
