import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * While `active`, keeps Tab inside `ref`, focuses its first control, and restores focus on release.
 * `fallback` gives the element to focus on release when nothing useful had focus on open (for example a
 * dialog that opens on page load from a link).
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, fallback?: () => HTMLElement | null) {
  const fallbackRef = useRef(fallback);
  useEffect(() => {
    fallbackRef.current = fallback;
  });

  useEffect(() => {
    const root = ref.current;
    if (!active || !root) return;

    const previous = document.activeElement as HTMLElement | null;
    // only controls that can really take focus from the keyboard: not hidden (display: none, which would let Tab escape
    // when focus is wrapped onto it), not tabindex -1, not inside an aria-hidden area (the honeypot field)
    const items = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.getClientRects().length > 0 && el.tabIndex >= 0 && !el.closest('[aria-hidden="true"]'),
    );
    items()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const inside = root.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const usable = previous && previous !== document.body && previous.isConnected && !root.contains(previous);
      (usable ? previous : fallbackRef.current?.())?.focus();
    };
  }, [ref, active]);
}
