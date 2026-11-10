"use client"; // Next error boundaries must be client components (it also needs the reset callback)

import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

/** Catches anything unexpected on an admin page. Database outages are handled earlier, with their own message. */
export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-soft/60 px-6 py-12 text-center">
      <WarningCircle weight="duotone" size={44} aria-hidden="true" className="text-royal" />
      <h1 className="font-heading text-lg font-semibold text-midnight">Something went wrong on this page</h1>
      <p className="max-w-md text-sm text-midnight/80">
        If the database or the admin settings are unavailable, this is usually why. Try again; if it keeps happening, check the server settings.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-1 min-h-11 rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal"
      >
        Retry
      </button>
    </div>
  );
}
