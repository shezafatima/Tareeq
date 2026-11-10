"use client"; // needs form state (pending and error display for the sign-in action)

import { useActionState } from "react";
import { signInAction, type LoginState } from "@/app/admin/login/actions";
import Field from "@/components/ui/Field";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      <Field label="Email" name="email" type="email" autoComplete="username" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <p role="alert" className="min-h-5 text-sm font-medium text-danger">
        {state.error ?? ""}
      </p>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="flex min-h-11 w-full items-center justify-center rounded-full bg-midnight px-6 text-sm font-semibold text-white transition-colors hover:bg-royal disabled:opacity-70"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
