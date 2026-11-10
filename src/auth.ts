import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as z from "zod/mini";
import { getAdminEnv } from "@/lib/admin/env";
import { logAdmin } from "@/lib/admin/log";
import { isLocked, recordFailure } from "@/lib/admin/login-limit";

// Admin sign-in (specs/022-admin-panel/research.md R1, R4, R17): one admin from the environment, JWT session for 7 days.
// Everything else in the panel trusts the session only through requireAdmin() / withAdmin() in src/lib/admin/session.ts.

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}
class Unavailable extends CredentialsSignin {
  code = "unavailable";
}

// a real bcrypt hash of a throwaway password, compared when the email is wrong so both paths take the same time
const DUMMY_HASH = "$2b$12$U8Xg4a9EG16OP0SDjUQorezzczyh5szvzvu71KoFlE8D4pnRy2onK";

const credentialsSchema = z.object({
  email: z.string().check(z.maxLength(254)),
  password: z.string().check(z.minLength(1), z.maxLength(200)),
});

const SESSION_SECONDS = 7 * 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  // read lazily so the build and the public pages never need the admin settings
  secret: getAdminEnv().AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_SECONDS },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        let env;
        try {
          env = getAdminEnv();
        } catch {
          logAdmin("sign-in", "config");
          throw new Unavailable();
        }

        try {
          if (await isLocked(request.headers)) {
            logAdmin("sign-in", "locked");
            throw new RateLimited();
          }
        } catch (err) {
          if (err instanceof RateLimited) throw err;
          logAdmin("sign-in", "unavailable");
          throw new Unavailable();
        }

        const parsed = z.safeParse(credentialsSchema, raw);
        const emailOk = parsed.success && parsed.data.email.trim().toLowerCase() === env.ADMIN_EMAIL;
        const passwordOk = await bcrypt.compare(
          parsed.success ? parsed.data.password : "",
          emailOk ? env.ADMIN_PASSWORD_HASH : DUMMY_HASH,
        );

        if (emailOk && passwordOk) {
          logAdmin("sign-in", "ok");
          return { id: "admin", email: env.ADMIN_EMAIL };
        }

        logAdmin("sign-in", "failed");
        try {
          await recordFailure(request.headers);
        } catch {
          // the attempt is still refused; a counting failure must not turn into a login
        }
        return null;
      },
    }),
  ],
}));
