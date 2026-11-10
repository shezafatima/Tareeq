import "server-only";

export type Loaded<T> = { ok: true; data: T } | { ok: false };

/**
 * Runs a database read and turns a failure into `{ ok: false }`, so the page can show the clear
 * "can't reach the database" message with a Retry button instead of crashing. Logs the error name only.
 */
export async function safeLoad<T>(read: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await read() };
  } catch (err) {
    console.error(`[admin] load failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return { ok: false };
  }
}
