"use client"; // needs the URL, key presses, focus and the body scroll lock

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

type BookingDialogProps = {
  /** accessible name and visible heading of the dialog */
  title: string;
  /** label for the close control */
  closeLabel: string;
  /** id of the page's "Book a workshop" button; focus goes here when the dialog was opened by a link on page load */
  returnFocusId: string;
  /** the form, rendered on the server and passed in so only the dialog shell is client code */
  children: React.ReactNode;
};

const CLOSED_HREF = "/workshop";

// Modal dialog for the workshop form: a centred dialog from 640px up, a full-screen sheet below. If the fields do
// not fit the screen, the whole dialog scrolls (there is no scroll area inside the form) and the buttons stay
// stuck to the bottom. Open when the address has ?book=1; closing goes back to /workshop.
// The children stay mounted while it is closed (hidden), so a half-filled form is not lost by an accidental close,
// and a form that was already sent is not sent again with the same submission key.
export default function BookingDialog({ title, closeLabel, returnFocusId, children }: BookingDialogProps) {
  const router = useRouter();
  const open = useSearchParams().get("book") === "1";
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open, () => document.getElementById(returnFocusId));

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.replace(CLOSED_HREF, { scroll: false });
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", close);
    };
  }, [open, router]);

  return (
    <div
      hidden={!open}
      onClick={(e) => {
        // a click anywhere outside the panel (the dimmed area) closes it
        if (!panelRef.current?.contains(e.target as Node)) router.replace(CLOSED_HREF, { scroll: false });
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-midnight/50"
    >
      <div className="flex min-h-full items-stretch sm:items-center sm:justify-center sm:p-6">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dialog-title"
        className="relative flex min-h-svh w-full flex-col bg-white sm:min-h-0 sm:max-w-2xl sm:rounded-card"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-2 sm:rounded-t-card sm:px-8 sm:pt-4">
          <h2 id="booking-dialog-title" className="font-heading text-xl font-bold text-midnight">
            {title}
          </h2>
          <Link
            href={CLOSED_HREF}
            replace
            scroll={false}
            aria-label={closeLabel}
            className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-royal transition-colors hover:bg-royal/10"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
        {children}
      </div>
      </div>
    </div>
  );
}
