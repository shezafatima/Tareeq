"use client"; // needs state, effects and browser APIs (Escape, Tab handling, focus and focus return)

import { useEffect, useId, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  /** what will happen, in plain words */
  body: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const FOCUSABLE = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])";

/**
 * An in-app confirmation for destructive actions (never a browser alert). Cancel comes first and gets focus.
 *
 * It handles Tab and Escape itself, in the capture phase, and stops them there. That is deliberate: it can open on top of
 * a Drawer that has its own focus trap, and two traps listening at once would fight. Focus returns to the opener on close.
 */
export default function ConfirmDialog({ open, title, body, confirmLabel, pending, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const stateRef = useRef({ pending, onCancel });
  useEffect(() => {
    stateRef.current = { pending, onCancel };
  });

  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    if (!root) return;
    const opener = document.activeElement as HTMLElement | null;
    root.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (!stateRef.current.pending) stateRef.current.onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      e.stopPropagation(); // keep a Drawer's own trap out of it
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div aria-hidden="true" className="admin-fade absolute inset-0 bg-midnight/60" />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="admin-pop relative w-full max-w-md rounded-2xl bg-white p-6 shadow-float"
      >
        <h2 id={titleId} className="font-heading text-xl font-semibold text-midnight">
          {title}
        </h2>
        <p id={bodyId} className="mt-2 text-sm text-midnight/80">
          {body}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="min-h-11 rounded-full border border-midnight/70 px-5 text-sm font-semibold text-midnight hover:bg-midnight/5 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="min-h-11 rounded-full bg-danger px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
