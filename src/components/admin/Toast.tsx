"use client"; // needs context, state and timers (the toast list and its auto-dismiss)

import { CheckCircle, WarningCircle, X } from "@phosphor-icons/react/dist/ssr";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Toast = { id: number; kind: "success" | "error"; message: string };
type ToastApi = { success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);
const DISMISS_MS = 4500;

/** Small in-house toasts for save, delete, copy and error outcomes. Polite live region; auto-dismiss; close button. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: Toast["kind"], message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, kind, message }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), DISMISS_MS));
    },
    [dismiss],
  );

  useEffect(() => {
    const live = timers.current;
    return () => live.forEach((t) => window.clearTimeout(t));
  }, []);

  const api = useMemo<ToastApi>(() => ({ success: (m) => push("success", m), error: (m) => push("error", m) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="admin-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-midnight px-4 py-3 text-sm text-white shadow-float"
          >
            {t.kind === "success" ? (
              <CheckCircle weight="duotone" size={22} aria-hidden="true" className="mt-px shrink-0 text-saffron" />
            ) : (
              <WarningCircle weight="duotone" size={22} aria-hidden="true" className="mt-px shrink-0 text-saffron" />
            )}
            <p className="flex-1 py-0.5">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss message"
              className="-my-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-white/80 hover:text-white"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside ToastProvider");
  return api;
}
