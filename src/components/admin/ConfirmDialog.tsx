"use client"; // needs state, effects and browser APIs (Escape, focus trap and focus return)

import { useEffect, useId, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

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

/** An in-app confirmation for destructive actions (never a browser alert). Cancel comes first in tab order. */
export default function ConfirmDialog({ open, title, body, confirmLabel, pending, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  useFocusTrap(ref, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) {
        e.stopPropagation();
        onCancel();
      }
    };
    // capture phase, so Escape closes this dialog and not a drawer underneath it
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, pending, onCancel]);

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
