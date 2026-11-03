"use client";
// Client: the cards' travel out of the hero, the carousel's autoplay, keys, dots and swipe. The cards themselves are
// server-rendered children; this component only sets transforms, positions and attributes on them.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotionValueEvent } from "framer-motion";
import type { CardId } from "@/components/RobotEyes";
import { clamp01, ease, useTravel } from "./travel-context";

const INTERVAL = 4000; // ms per card while autoplaying
const FACES_FROM = 0.65; // travel progress where the compact (hero) face starts giving way to the full face

type Props = { labels: string[]; regionLabel: string; children: React.ReactNode };

export default function StepCarousel({ labels, regionLabel, children }: Props) {
  const { mode, progress, arrived, hero, active, setActive, setHoverCard } = useTravel();
  const trackRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const n = labels.length;
  const carousel = mode !== "list";
  const travel = mode === "travel";

  const [interacted, setInteracted] = useState(false);
  const [hover, setHover] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [offscreen, setOffscreen] = useState(false);

  const cards = useCallback(() => Array.from(trackRef.current?.querySelectorAll<HTMLElement>(".hiw-card") ?? []), []);

  // ---- travel: each card starts exactly on its hero card and moves to the carousel centre ----
  const placeCards = useCallback(
    (p: number) => {
      const hp = hero();
      if (!hp) return;
      const e = ease(p);
      const faces = clamp01((p - FACES_FROM) / (1 - FACES_FROM));
      cards().forEach((card, i) => {
        const heroCard = hp.cards[i];
        const travelEl = card.querySelector<HTMLElement>(".hiw-card-travel");
        const compact = card.querySelector<HTMLElement>(".hiw-face-compact");
        const full = card.querySelector<HTMLElement>(".hiw-face-full");
        if (!heroCard || !travelEl || !compact || !full) return;
        const vis = heroCard.querySelector<HTMLElement>(".backdrop-blur-md") ?? heroCard;
        const hr = vis.getBoundingClientRect();
        const cr = card.getBoundingClientRect(); // the card's own layout box: never transformed
        const m = new DOMMatrixReadOnly(getComputedStyle(vis.parentElement ?? vis).transform);
        const tilt = (Math.atan2(m.b, m.a) * 180) / Math.PI;
        const dx = hr.left + hr.width / 2 - (cr.left + cr.width / 2);
        const dy = hr.top + hr.height / 2 - (cr.top + cr.height / 2);
        compact.style.width = `${hr.width}px`; // the hero card's rendered width: identical at the hand-off
        travelEl.style.opacity = p > 0 ? "1" : "0";
        travelEl.style.transform = `translate(${dx * (1 - e)}px, ${dy * (1 - e)}px) rotate(${tilt * (1 - e)}deg)`;
        const s0 = cr.width > 0 ? hr.width / cr.width : 1;
        full.style.transform = `scale(${s0 + (1 - s0) * e})`;
        full.style.opacity = String(faces);
        compact.style.opacity = String(1 - faces);
      });
    },
    [hero, cards],
  );
  useMotionValueEvent(progress, "change", (p) => travel && placeCards(p));
  useLayoutEffect(() => {
    if (travel) {
      placeCards(progress.get());
      return;
    }
    // not travelling: no inline styles at all
    cards().forEach((card) => {
      card.querySelectorAll<HTMLElement>(".hiw-card-travel, .hiw-face-compact, .hiw-face-full").forEach((el) => {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.width = "";
      });
    });
  }, [travel, placeCards, progress, cards]);

  // ---- positions and slide attributes ----
  useLayoutEffect(() => {
    cards().forEach((card, i) => {
      if (!carousel) {
        ["data-pos", "role", "aria-roledescription", "aria-label", "aria-hidden", "inert"].forEach((a) => card.removeAttribute(a));
        return;
      }
      const offset = (((i - active) % n) + n) % n;
      const pos = offset === 0 ? "center" : offset === 1 ? "right" : offset === n - 1 ? "left" : "back";
      card.setAttribute("data-pos", pos);
      card.setAttribute("role", "group");
      card.setAttribute("aria-roledescription", "slide");
      card.setAttribute("aria-label", `${i + 1} of ${n}: ${labels[i]}`);
      // in the coverflow only the centred card is content; the side cards are decorative
      if (travel && pos !== "center") {
        card.setAttribute("aria-hidden", "true");
        card.setAttribute("inert", "");
      } else {
        card.removeAttribute("aria-hidden");
        card.removeAttribute("inert");
      }
    });
  }, [active, carousel, travel, n, labels, cards]);

  // ---- swipe: the track's scroll position decides the active card ----
  const scrollToCard = useCallback(
    (i: number, smooth = true) => {
      const track = trackRef.current;
      if (!track || mode !== "swipe") return;
      track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
    },
    [mode],
  );
  useEffect(() => {
    const track = trackRef.current;
    if (!track || mode !== "swipe") return;
    let t = 0;
    const settle = () => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      setActive(Math.min(n - 1, Math.max(0, i)));
    };
    const onScroll = () => {
      window.clearTimeout(t);
      t = window.setTimeout(settle, 120);
    };
    const stop = () => setInteracted(true);
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scrollend", settle);
    track.addEventListener("pointerdown", stop);
    track.addEventListener("touchstart", stop, { passive: true });
    track.addEventListener("wheel", stop, { passive: true });
    return () => {
      window.clearTimeout(t);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("scrollend", settle);
      track.removeEventListener("pointerdown", stop);
      track.removeEventListener("touchstart", stop);
      track.removeEventListener("wheel", stop);
    };
  }, [mode, n, setActive]);

  const go = useCallback(
    (i: number, manual: boolean) => {
      const next = ((i % n) + n) % n;
      if (manual) setInteracted(true);
      setActive(next);
      scrollToCard(next);
    },
    [n, setActive, scrollToCard],
  );

  // ---- pause reasons ----
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

  // ---- autoplay: one card every 4 s while nothing pauses it; stops for good after any manual action ----
  const running = carousel && !interacted && !hover && !focusIn && !tabHidden && !offscreen && (!travel || arrived);
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => go(active + 1, false), INTERVAL);
    return () => window.clearTimeout(t);
  }, [running, active, go]);

  // the robot reacts to the card being hovered or focused (travel layout)
  const onCardPointer = (e: React.PointerEvent) => {
    if (!travel || e.pointerType === "touch") return;
    const card = (e.target as Element).closest<HTMLElement>(".hiw-card[data-pos='center']");
    setHoverCard(card ? ((card.dataset.step as CardId) ?? null) : null);
  };

  return (
    <div
      ref={regionRef}
      {...(carousel ? { role: "region", "aria-roledescription": "carousel", "aria-label": regionLabel } : {})}
      onPointerEnter={(e) => e.pointerType !== "touch" && setHover(true)}
      onPointerLeave={() => {
        setHover(false);
        setHoverCard(null);
      }}
      onPointerMove={onCardPointer}
      onFocus={() => setFocusIn(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIn(false);
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
      <div ref={trackRef} className="hiw-track" aria-live={carousel ? (interacted ? "polite" : "off") : undefined}>
        {children}
      </div>
      <div className="hiw-controls mt-5 items-center justify-center gap-2">
        <button type="button" aria-label="Previous step" onClick={() => go(active - 1, true)} className="inline-flex size-11 items-center justify-center rounded-pill text-royal ring-1 ring-royal/20 transition-colors duration-[var(--dur-fast)] hover:bg-white">
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
            <span aria-hidden="true" className={`block h-2.5 rounded-pill transition-[transform,opacity] duration-[var(--dur-base)] ${i === active ? "w-6 bg-royal" : "w-2.5 bg-royal/30 group-hover:bg-royal/60"}`} />
          </button>
        ))}
        <button type="button" aria-label="Next step" onClick={() => go(active + 1, true)} className="inline-flex size-11 items-center justify-center rounded-pill text-royal ring-1 ring-royal/20 transition-colors duration-[var(--dur-fast)] hover:bg-white">
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
