"use client"; // listens to scrolling to mark the section being read; the list itself is rendered on the server

import { useEffect, useRef } from "react";

/**
 * Marks the table-of-contents link of the section currently being read with aria-current="location" (specs/033-admin-blog FR-019).
 * The list is passed in as children so it stays server-rendered; this only sets one attribute as the page scrolls.
 */
export default function TocHighlight({ ids, children }: { ids: string[]; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || ids.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 80) * 16 + 24;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      current ??= ids[0];
      root.querySelectorAll<HTMLAnchorElement>("a[href^='#']").forEach((a) => {
        if (a.getAttribute("href") === `#${current}`) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ids]);

  return <div ref={ref}>{children}</div>;
}
