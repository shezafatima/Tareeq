// The shape every admin Server Action returns (specs/022-admin-panel/contracts/server-actions.md).
// Types only, so it can be imported from client components and from "use server" files alike.

export type FailureCode = "unauthorized" | "invalid" | "not_found" | "conflict" | "unavailable";

export type Failure = { ok: false; code: FailureCode; fieldErrors?: Record<string, string> };

export type ActionResult<T extends object = object> = ({ ok: true } & T) | Failure;
