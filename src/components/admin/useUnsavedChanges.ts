"use client"; // a hook: it listens to browser navigation events

import { useEffect } from "react";

// Warns before leaving a form with unsaved changes (specs/028-site-settings research R8). The App Router has no API to block a
// route change, so three paths are covered: reload/close/typed URL (beforeunload), in-app links (a capture-phase click
// listener that runs before Next's Link handler) and Back (a guard history entry).

const DEFAULT_MESSAGE = "You have unsaved changes. Leave without saving?";

export function useUnsavedChanges(dirty: boolean, message: string = DEFAULT_MESSAGE): void {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Back: a guard entry sits on top of the history, so Back first lands on this same page.
    // keeps Next's own history state, so the router treats the entry as this page
    const guard = { ...(window.history.state ?? {}), unsavedGuard: true };
    window.history.pushState(guard, "", window.location.href);
    let leaving = false;
    const onPopState = () => {
      if (leaving) return;
      if (window.confirm(message)) {
        leaving = true;
        window.history.back();
      } else {
        window.history.pushState(guard, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      // drop the guard entry once the form is clean again, so Back is not needed twice
      if (!leaving && (window.history.state as { unsavedGuard?: boolean } | null)?.unsavedGuard) window.history.back();
    };
  }, [dirty, message]);
}
