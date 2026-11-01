"use client"; // needs state, effects and browser APIs (open/close, Escape, body scroll lock, matchMedia, focus)

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const subscribeNone = () => () => {};

type MobileNavProps = {
  /** The static menu content, rendered on the server (see MobileMenuContent). */
  children: React.ReactNode;
};

export default function MobileNav({ children }: MobileNavProps) {
  const pathname = usePathname();
  // The menu is open only for the page it was opened on, so navigating (link or Back) closes it.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const isClient = useSyncExternalStore(subscribeNone, () => true, () => false);

  const close = () => setOpenAt(null);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAt(null);
    };
    const wide = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (wide.matches) setOpenAt(null);
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
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpenAt(pathname)}
        className="inline-flex size-11 items-center justify-center rounded-control text-midnight transition-colors hover:bg-midnight/5 md:hidden"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {isClient &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="scrim"
                  aria-hidden="true"
                  onClick={close}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="fixed inset-0 z-50 bg-midnight/20"
                />
                <motion.div
                  key="panel"
                  ref={panelRef}
                  id={panelId}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Main menu"
                  initial={{ x: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) close();
                  }}
                  className="fixed inset-y-0 right-0 z-50 flex w-[min(85vw,20rem)] flex-col overflow-y-auto border-l border-white/70 bg-white/65 shadow-float backdrop-blur-xl"
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
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
