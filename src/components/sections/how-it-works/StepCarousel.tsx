"use client";
// Client: the carousel's controls, swipe, flip and auto-advance (contracts/carousel.md). The cards themselves are
// server-rendered children; this component only sets attributes on them (data-pos, data-flipped, aria, inert).

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLayoutMode } from "@/hooks/useLayoutMode";

const INTERVAL = 5000; // ms per card while auto-advancing
const HOVER_HOLD = 120; // ms the pointer rests on a card before it flips
const SWIPE_DISTANCE = 50; // px
const SWIPE_VELOCITY = 0.5; // px per ms: a quick flick counts even if short
const TAP_SLOP = 8; // px of movement that still counts as a tap

type Props = { labels: string[]; regionLabel: string; children: React.ReactNode };
type Drag = { x0: number; y0: number; t0: number; dx: number; lock: "x" | "y" | null; pose: HTMLElement | null };

const setHiddenInert = (el: Element | null, hidden: boolean) => {
  if (!el) return;
  if (hidden) {
    el.setAttribute("inert", "");
    el.setAttribute("aria-hidden", "true");
  } else {
    el.removeAttribute("inert");
    el.removeAttribute("aria-hidden");
  }
};

export default function StepCarousel({ labels, regionLabel, children }: Props) {
  const mode = useLayoutMode();
  const [active, setActive] = useState(0); // the card in focus
  const regionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const n = labels.length;
  const carousel = mode !== "list";

  const [interacted, setInteracted] = useState(false); // after the visitor acts, slide changes are announced politely
  const [stopped, setStopped] = useState(false); // a touch swipe or tap stopped auto-advance for the visit
  const [hover, setHover] = useState(false); // the pointer is over the card in focus
  const [focusIn, setFocusIn] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [flipped, setFlipped] = useState<number | null>(null); // index of the card showing its back
  const flipBy = useRef<"hover" | "other">("other");
  const hoverTimer = useRef(0);
  const drag = useRef<Drag | null>(null);

  const cards = useCallback(() => Array.from(trackRef.current?.querySelectorAll<HTMLElement>(".hiw-card") ?? []), []);

  const go = useCallback(
    (i: number, manual: boolean) => {
      const next = ((i % n) + n) % n;
      if (manual) setInteracted(true);
      setFlipped(null);
      setActive(next);
    },
    [n, setActive],
  );

  const toggleFlip = useCallback(
    (by: "hover" | "other") => {
      flipBy.current = by;
      setInteracted(true);
      setFlipped((f) => (f === active ? null : active));
    },
    [active],
  );

  // ---- positions, slide attributes and the flip, set on the server-rendered cards ----
  // Whatever stops being reachable is made inert only AFTER focus has been moved off it: an element that is made
  // inert while it has focus drops focus to the page, which would also end a keyboard visitor's flip.
  useLayoutEffect(() => {
    const list = cards();
    if (!carousel) {
      list.forEach((card) => {
        ["data-pos", "data-flipped", "role", "aria-roledescription", "aria-label"].forEach((a) => card.removeAttribute(a));
        setHiddenInert(card, false);
        setHiddenInert(card.querySelector(".hiw-face-front"), false);
        setHiddenInert(card.querySelector(".hiw-face-back"), false);
      });
      return;
    }
    const toHide: Element[] = [];
    list.forEach((card, i) => {
      const front = card.querySelector(".hiw-face-front");
      const back = card.querySelector(".hiw-face-back");
      const offset = (((i - active) % n) + n) % n;
      const pos = offset === 0 ? "active" : offset === 1 ? "after" : "before";
      card.setAttribute("data-pos", pos);
      card.setAttribute("role", "group");
      card.setAttribute("aria-roledescription", "slide");
      card.setAttribute("aria-label", `${i + 1} of ${n}: ${labels[i]}`);
      const showBack = pos === "active" && flipped === i;
      if (showBack) card.setAttribute("data-flipped", "");
      else card.removeAttribute("data-flipped");
      // only the card in focus is content (reachable and announced); of its faces only the one showing
      if (pos === "active") setHiddenInert(card, false);
      else toHide.push(card);
      setHiddenInert(showBack ? back : front, false);
      const hidden = showBack ? front : back;
      if (hidden) toHide.push(hidden);
    });
    const focused = document.activeElement;
    if (focused && toHide.some((el) => el.contains(focused))) {
      const face = flipped === active ? ".hiw-face-back" : ".hiw-face-front";
      list[active]?.querySelector<HTMLElement>(`${face} .hiw-flip-btn`)?.focus();
    }
    toHide.forEach((el) => setHiddenInert(el, true));
  }, [active, flipped, carousel, n, labels, cards]);

  // ---- pause reasons: hidden tab, off screen ----
  useEffect(() => {
    const onVis = () => setTabHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => {
    const el = regionRef.current;
    if (!el || !carousel) return;
    const io = new IntersectionObserver(([en]) => setOffscreen(!en.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [carousel]);

  // ---- auto-advance: one card every 5 s unless something holds it (contracts/carousel.md) ----
  const running =
    carousel && mode !== "still" && !stopped && !hover && !focusIn && !tabHidden && !offscreen && flipped === null;
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => go(active + 1, false), INTERVAL);
    return () => window.clearTimeout(t);
  }, [running, active, go]);

  // ---- hover on the card in focus: pauses auto-advance, and flips the card after a short rest ----
  const finePointer = (e: React.PointerEvent) => e.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const onTrackEnter = (e: React.PointerEvent) => {
    if (!carousel || !finePointer(e)) return;
    setHover(true);
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      flipBy.current = "hover";
      setFlipped(active);
    }, HOVER_HOLD);
  };
  const onTrackLeave = (e: React.PointerEvent) => {
    if (!finePointer(e)) return;
    window.clearTimeout(hoverTimer.current);
    setHover(false);
    if (flipBy.current === "hover") setFlipped(null);
  };
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  // ---- swipe (any width) and tap-to-flip (touch): pointer events on the track ----
  const activePose = () => trackRef.current?.querySelector<HTMLElement>(".hiw-card[data-pos='active'] .hiw-card-pose") ?? null;
  const onDown = (e: React.PointerEvent) => {
    if (!carousel || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { x0: e.clientX, y0: e.clientY, t0: performance.now(), dx: 0, lock: null, pose: activePose() };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.lock && (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP)) {
      d.lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (d.lock === "x") trackRef.current?.setPointerCapture(e.pointerId);
    }
    if (d.lock === "x" && d.pose) {
      d.dx = dx;
      d.pose.style.transition = "none";
      d.pose.style.transform = `translateX(${dx}px)`;
    }
  };
  const finishDrag = (e: React.PointerEvent, cancelled: boolean) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.pose) {
      d.pose.style.transition = "";
      d.pose.style.transform = ""; // the CSS transition takes over from here
    }
    if (cancelled) return;
    if (d.lock === "x") {
      const dt = Math.max(1, performance.now() - d.t0);
      if (Math.abs(d.dx) > SWIPE_DISTANCE || Math.abs(d.dx) / dt > SWIPE_VELOCITY) go(active + (d.dx < 0 ? 1 : -1), true);
    } else if (!d.lock && e.pointerType !== "mouse" && !(e.target as Element).closest(".hiw-flip-btn")) {
      // a tap on the card flips it (touch and pen)
      if ((e.target as Element).closest(".hiw-card[data-pos='active']")) toggleFlip("other");
    }
  };
  // a touch swipe or tap (anywhere in the carousel, controls included) stops auto-advance for the rest of the visit.
  // A vertical page scroll ends in pointercancel, not pointerup, so it does not count.
  const onRegionUp = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") setStopped(true);
  };

  return (
    <div
      ref={regionRef}
      {...(carousel ? { role: "region", "aria-roledescription": "carousel", "aria-label": regionLabel } : {})}
      onPointerUp={onRegionUp}
      onFocus={() => setFocusIn(true)}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setFocusIn(false);
        if (flipBy.current !== "hover") setFlipped(null); // a card flipped by tap or key returns when focus leaves
      }}
      onClick={(e) => {
        if (carousel && (e.target as Element).closest(".hiw-flip-btn")) toggleFlip("other");
      }}
      onKeyDown={(e) => {
        if (!carousel) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(active + 1, true);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(active - 1, true);
        }
      }}
    >
      <div
        ref={trackRef}
        className="hiw-track grid"
        aria-live={carousel ? (interacted ? "polite" : "off") : undefined}
        onPointerEnter={onTrackEnter}
        onPointerLeave={onTrackLeave}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={(e) => finishDrag(e, false)}
        onPointerCancel={(e) => finishDrag(e, true)}
      >
        {children}
      </div>
      <div className="hiw-controls mt-5 items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Previous step"
          onClick={() => go(active - 1, true)}
          className="inline-flex size-11 items-center justify-center rounded-pill text-royal ring-1 ring-royal/20 transition-colors duration-[var(--dur-fast)] hover:bg-white"
        >
          <span aria-hidden="true">‹</span>
        </button>
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-label={`Show step ${i + 1}: ${label}`}
            aria-current={i === active ? "true" : undefined}
            onClick={() => go(i, true)}
            className="group inline-flex size-11 items-center justify-center rounded-pill"
          >
            <span
              aria-hidden="true"
              className={`block h-2.5 rounded-pill transition-[transform,opacity] duration-[var(--dur-base)] ${i === active ? "w-6 bg-royal" : "w-2.5 bg-royal/30 group-hover:bg-royal/60"}`}
            />
          </button>
        ))}
        <button
          type="button"
          aria-label="Next step"
          onClick={() => go(active + 1, true)}
          className="inline-flex size-11 items-center justify-center rounded-pill text-royal ring-1 ring-royal/20 transition-colors duration-[var(--dur-fast)] hover:bg-white"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
