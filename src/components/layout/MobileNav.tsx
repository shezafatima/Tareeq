"use client"; // needs state, effects and browser APIs (open/close, Escape, body scroll lock, matchMedia, focus)

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const subscribeNone = () => () => {};
const REDUCED = "(prefers-reduced-motion: reduce)";
const EXIT_MS = 320; // a little longer than the CSS exit (--dur-base), as a safety net if animationend never fires

type MobileNavProps = {
  /** The static menu content, rendered on the server (see MobileMenuContent). */
  children: React.ReactNode;
};

// The slide and fade are plain CSS animations (globals.css: menu-scrim, menu-panel), so this shared component no
// longer pulls the animation library into every page.
export default function MobileNav({ children }: MobileNavProps) {
  const pathname = usePathname();
  // The menu is open only for the page it was opened on, so navigating (link or Back) closes it.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const open = openAt === pathname;
  const panelRef = useRef<HTMLDivElement>(null);
  const exitTimer = useRef(0);
  const panelId = useId();
  const isClient = useSyncExternalStore(subscribeNone, () => true, () => false);

  const finishClose = useCallback(() => {
    window.clearTimeout(exitTimer.current);
    setOpenAt(null);
    setClosing(false);
  }, []);
  // Close with the exit animation (or at once under reduced motion)
  const close = useCallback(() => {
    if (window.matchMedia(REDUCED).matches) {
      finishClose();
      return;
    }
    setClosing(true);
    window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(finishClose, EXIT_MS);
  }, [finishClose]);

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const wide = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (wide.matches) finishClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    wide.addEventListener("change", onChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      wide.removeEventListener("change", onChange);
    };
  }, [open, close, finishClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open && !closing}
        aria-controls={panelId}
        onClick={() => {
          setClosing(false);
          setOpenAt(pathname);
        }}
        className="inline-flex size-11 items-center justify-center rounded-control text-midnight transition-colors hover:bg-midnight/5 md:hidden"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {isClient &&
        open &&
        createPortal(
          <>
            <div
              aria-hidden="true"
              onClick={close}
              data-closing={closing || undefined}
              className="menu-scrim fixed inset-0 z-50 bg-midnight/20"
            />
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
              data-closing={closing || undefined}
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget && e.animationName === "menu-slide-out") finishClose();
              }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a")) close();
              }}
              className="menu-panel fixed inset-y-0 right-0 z-50 flex w-[min(85vw,20rem)] flex-col overflow-y-auto border-l border-white/70 bg-white/65 shadow-float backdrop-blur-xl"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="absolute right-2 top-2.5 inline-flex size-11 items-center justify-center rounded-control text-royal transition-colors hover:bg-royal/10"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              {children}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
