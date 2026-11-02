"use client"; // browser IntersectionObserver, MutationObserver and media query; renders nothing

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const REDUCED = "(prefers-reduced-motion: reduce)";
const READY = "data-reveal-ready";
const PRELOADER_WAIT_MAX = 9000; // ms: never hold content longer than this if the preloader state never changes

/**
 * One observer for the whole site. Arms the hidden state (data-reveal-ready on <html>) only once everything
 * already in view has been marked revealed, so nothing flashes. While the preloader is covering the page the
 * entrances wait, so they are seen. Does nothing under reduced motion, so the page stays in its final state.
 * See specs/004-site-visual-polish/contracts/reveal.md.
 */
export default function RevealController() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia(REDUCED);
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    let timer = 0;
    const pending = new Set<Element>();
    const preloading = () => root.getAttribute("data-preloader") === "run";

    // instant: shown with no transition (content already in view, focus), so nothing ever fades in on screen unasked
    const reveal = (el: Element, instant = false) => {
      el.setAttribute("data-revealed", instant ? "instant" : "");
      io?.unobserve(el);
      pending.delete(el);
    };
    const flush = () => [...pending].forEach((el) => reveal(el));

    const onFocusIn = (e: FocusEvent) => {
      const wrapper = (e.target as Element | null)?.closest?.("[data-reveal]");
      if (wrapper) reveal(wrapper, true);
    };

    const teardown = () => {
      io?.disconnect();
      mo?.disconnect();
      window.clearTimeout(timer);
      document.removeEventListener("focusin", onFocusIn, true);
      pending.clear();
      io = null;
      mo = null;
    };

    const setup = () => {
      if (mq.matches) {
        root.removeAttribute(READY);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            if (preloading()) pending.add(entry.target);
            else reveal(entry.target);
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
      );

      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom <= 0) reveal(el, true); // already scrolled past
        else if (r.top < vh && !preloading()) reveal(el, true); // in view now: show, never hide
        else io!.observe(el); // below the fold, or in view behind the preloader: reveal when seen
      });
      root.setAttribute(READY, "");

      document.addEventListener("focusin", onFocusIn, true);
      if (preloading()) {
        mo = new MutationObserver(() => {
          if (!preloading()) {
            flush();
            mo?.disconnect();
          }
        });
        mo.observe(root, { attributes: true, attributeFilter: ["data-preloader"] });
        timer = window.setTimeout(flush, PRELOADER_WAIT_MAX);
      }
    };

    const onPreferenceChange = () => {
      teardown();
      setup();
    };

    setup();
    mq.addEventListener("change", onPreferenceChange);
    return () => {
      mq.removeEventListener("change", onPreferenceChange);
      teardown();
    };
  }, [pathname]);

  return null;
}
