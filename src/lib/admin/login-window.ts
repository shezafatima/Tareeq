// Pure rules for the admin sign-in limit (specs/022-admin-panel/research.md R4): 5 failed attempts per 15 minutes.
// No server imports, so the unit tests can load it.

export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** Failures older than this no longer count. */
export function windowStart(now: Date): Date {
  return new Date(now.getTime() - LOGIN_WINDOW_MS);
}

/** True when this many failures inside the window already lock the address. */
export function isOverLimit(failures: number): boolean {
  return failures >= LOGIN_MAX_FAILURES;
}
