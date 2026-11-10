import { handlers } from "@/auth";

// The only route handler the admin panel adds: Auth.js sign-in, sign-out and session endpoints.
// It is public by design (sign-in has to be); scripts/admin-guard-test.ts keeps any other route handler from appearing unguarded.
export const { GET, POST } = handlers;
