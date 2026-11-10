import "server-only";

// Server-side session checks (specs/022-admin-panel/research.md R3, R15). Nothing in the panel relies on a client-side check.

/** For admin pages and route handlers: with no valid session, send the visitor to the sign-in page. */
export async function requireAdmin() {
  // loaded on demand, so the guard test can import this module without the whole Next runtime
  const [{ auth }, { redirect }] = await Promise.all([import("@/auth"), import("next/navigation")]);
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

export type Denied = { ok: false; code: "unauthorized" };

// How a Server Action learns whether the caller is the admin. A holder, so scripts/admin-guard-test.ts can swap it for "no session".
export const sessionResolver: { current: () => Promise<boolean> } = {
  current: async () => Boolean((await (await import("@/auth")).auth())?.user),
};

export const ADMIN_WRAPPED = Symbol.for("tareeq.withAdmin");

/**
 * Wraps a Server Action so it runs only for the signed-in admin. Server Actions are public POST endpoints, so every one
 * is defined through this. A missing session, or a failure to read it, is refused before the handler or the database is touched.
 */
export function withAdmin<A extends unknown[], R>(handler: (...args: A) => Promise<R>) {
  const wrapped = async (...args: A): Promise<R | Denied> => {
    let signedIn = false;
    try {
      signedIn = await sessionResolver.current();
    } catch {
      signedIn = false;
    }
    if (!signedIn) return { ok: false, code: "unauthorized" };
    return handler(...args);
  };
  Object.defineProperty(wrapped, ADMIN_WRAPPED, { value: true });
  return wrapped;
}
