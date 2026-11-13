"use client"; // needs a click handler and the browser cookie API

import { DISMISS_COOKIE } from "@/lib/announcement/rules";

/**
 * The bar's close button (specs/034-pricing-certificate-announcement FR-021, research R11). It remembers the dismissal in a
 * cookie holding the announcement's version, and hides the bar at once through the same data-announce="off" switch the
 * pre-paint script uses. Editing the announcement in the admin changes the version, so it shows again.
 */
export default function AnnouncementDismiss({ version }: { version: number }) {
  const dismiss = () => {
    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${DISMISS_COOKIE}=${version}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    } catch {
      // cookies blocked: it still hides for this page view
    }
    document.documentElement.dataset.announce = "off";
    // the button is gone, so keyboard focus moves to the logo instead of being lost
    document.querySelector<HTMLElement>("header a")?.focus();
  };

  return (
    <button
      type="button"
      onClick={dismiss}
      aria-label="Dismiss announcement"
      className="announcement-close inline-flex size-11 shrink-0 items-center justify-center rounded-control"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
