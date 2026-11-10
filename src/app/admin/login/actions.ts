"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { ConfigError } from "@/lib/env";

// Sign-in and sign-out. These two are public by design (nobody is signed in yet when they sign in; signing out
// without a session does nothing), so they are not wrapped by withAdmin. Everything else in the panel is.

export type LoginState = { error?: string };

const MESSAGES: Record<string, string> = {
  rate_limited: "Too many attempts. Try again in a few minutes.",
  unavailable: "Sign-in is unavailable right now. Try again shortly.",
};

export async function signInAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      const code = "code" in err && typeof err.code === "string" ? err.code : "";
      return { error: MESSAGES[code] ?? "Invalid credentials" };
    }
    // a missing or malformed admin setting: fail closed with a message instead of crashing the page.
    // The server log names the variable (never its value).
    if (err instanceof ConfigError) {
      console.error(`[admin] sign-in unavailable: ${err.message}`);
      return { error: MESSAGES.unavailable };
    }
    throw err; // the redirect after a successful sign-in is thrown by Next and must pass through
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
