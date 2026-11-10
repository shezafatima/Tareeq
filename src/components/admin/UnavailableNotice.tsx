"use client"; // needs state and the router (Retry re-runs the page's server reads)

import { CloudSlash } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Shown when the database cannot be reached: a clear message and a Retry button. */
export default function UnavailableNotice() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-soft/60 px-6 py-12 text-center">
      <CloudSlash weight="duotone" size={44} aria-hidden="true" className="text-royal" />
      <p className="font-heading text-lg font-semibold text-midnight">We can&apos;t reach the database right now</p>
      <p className="max-w-md text-sm text-midnight/80">Nothing has been lost. Check your connection or try again in a moment.</p>
      <button
        type="button"
        onClick={() => start(() => router.refresh())}
        disabled={pending}
        className="mt-1 min-h-11 rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal disabled:opacity-60"
      >
        {pending ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
