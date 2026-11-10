"use client"; // needs state, effects and browser APIs (Escape, scroll lock, focus trap and focus return)

import { X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  /** accessible name of the dialog */
  label: string;
  side?: "right" | "left";
  className?: string;
  children: React.ReactNode;
};

/**
 * A slide-in panel: dialog role, Escape and scrim close it, focus stays inside and returns to where it was.
 * Full screen on phones. The slide is a CSS transform; reduced motion turns it off globally.
 */
export default function Drawer({ open, onClose, label, side = "right", className, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div aria-hidden="true" onClick={onClose} className="admin-fade absolute inset-0 bg-midnight/50" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "absolute inset-y-0 flex w-full flex-col overflow-y-auto bg-paper shadow-float",
          side === "right" ? "admin-slide-right right-0 sm:max-w-lg" : "admin-slide-left left-0 sm:max-w-xs",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 z-10 flex size-11 items-center justify-center rounded-full text-midnight hover:bg-midnight/10"
        >
          <X size={22} aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
