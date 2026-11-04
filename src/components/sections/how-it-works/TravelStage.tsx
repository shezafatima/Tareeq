"use client";
// Client: scroll position and the card hand-off from the hero (contracts/travel-stage.md). The hero is read, never
// edited: from the first pixel of scroll its three card wrappers are hidden and the twin cards in the carousel are
// shown exactly over them, in the same task, then they travel to the carousel with a spring. The section's markup
// arrives as server-rendered children.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMotionValue, useMotionValueEvent, useSpring } from "framer-motion";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import { clamp01, ease, findHeroParts, setHidden, TravelContext, type HeroParts, type TravelValue } from "./travel-context";

// The carousel slot's centre reaches this fraction of the viewport height when the cards have arrived.
const ARRIVE_AT = 0.6;
const ARRIVED = 0.995; // the followed value counts as arrived from here...
const LEFT = 0.98; // ...and as left below this (hysteresis)
// The card in focus turns from the hero card into the carousel card early in the path, while the front (scaled down
// to the hero card's width) is still about the same size as the hero look, so the swap is a quick, quiet fade.
const MORPH_FROM = 0.08;
const MORPH_TO = 0.28;
// The other two cards stay small (the hero look, never enlarged) and fade out as they converge on the slot. Their
// big fronts are never shown while travelling, which is what made overlapping text in the first versions.
const FADE_FROM = 0.45;
const FADE_TO = 0.8;
const SPRING = { stiffness: 320, damping: 24 }; // a damping ratio of about 0.67: a small overshoot, then rest
const HOME = 0.002; // the followed value is "back at the hero" below this

/** Position along the path: eased up to the target, then (spring overshoot) a straight continuation past it. */
const along = (p: number) => (p <= 1 ? ease(p) : 1 + (p - 1));

export default function TravelStage({ children }: { children: React.ReactNode }) {
  const mode = useLayoutMode();
  const travel = mode === "travel";
  const stageRef = useRef<HTMLDivElement>(null);
  const raw = useMotionValue(0); // scroll progress, 0 to 1
  const progress = useSpring(raw, SPRING); // what the cards follow
  const parts = useRef<HeroParts | null>(null);
  const handed = useRef(false);
  const range = useRef(1);
  const activeRef = useRef(0);
  const arrivedRef = useRef(false);
  const [arrived, setArrived] = useState(false);
  const [active, setActive] = useState(0);

  const twins = useCallback(
    () => Array.from(stageRef.current?.querySelectorAll<HTMLElement>(".hiw-card") ?? []),
    [],
  );

  /**
   * Puts each twin on its hero card (progress 0) and moves it to the carousel slot (progress 1). Once arrived, the
   * carousel's own slide positions decide what is visible, so every card is left fully on (a card that slides out
   * must not be switched off from here).
   */
  const place = useCallback(() => {
    const hp = parts.current;
    if (!hp) return;
    const p = Math.max(0, progress.get());
    const e = along(p);
    const grow = Math.min(e, 1);
    const settled = arrivedRef.current;
    const morph = clamp01((p - MORPH_FROM) / (MORPH_TO - MORPH_FROM));
    const fade = clamp01((p - FADE_FROM) / (FADE_TO - FADE_FROM));
    twins().forEach((card, i) => {
      const heroCard = hp.cards[i];
      const travelEl = card.querySelector<HTMLElement>(".hiw-card-travel");
      const compact = card.querySelector<HTMLElement>(".hiw-face-compact");
      const front = card.querySelector<HTMLElement>(".hiw-face-front");
      if (!heroCard || !travelEl || !compact || !front) return;
      const isActive = i === activeRef.current;
      const vis = heroCard.querySelector<HTMLElement>(".backdrop-blur-md") ?? heroCard;
      const hr = vis.getBoundingClientRect();
      const cr = card.getBoundingClientRect(); // the card's own layout box: never transformed
      const m = new DOMMatrixReadOnly(getComputedStyle(vis.parentElement ?? vis).transform);
      const tilt = (Math.atan2(m.b, m.a) * 180) / Math.PI;
      const dx = hr.left + hr.width / 2 - (cr.left + cr.width / 2);
      const dy = hr.top + hr.height / 2 - (cr.top + cr.height / 2);
      travelEl.style.transform = `translate(${dx * (1 - e)}px, ${dy * (1 - e)}px) rotate(${tilt * (1 - e)}deg)`;
      // the hero look stays its own size; the front grows from the hero card's width to the carousel card's width
      compact.style.width = `${hr.width}px`;
      const s0 = cr.width > 0 ? hr.width / cr.width : 1;
      front.style.transform = `scale(${s0 + (1 - s0) * grow})`;
      if (settled) {
        compact.style.opacity = "0";
        front.style.opacity = "1";
        travelEl.style.opacity = "1";
      } else {
        compact.style.opacity = String(isActive ? 1 - morph : 1);
        front.style.opacity = String(isActive ? morph : 0);
        travelEl.style.opacity = isActive ? "1" : String(1 - fade);
      }
    });
  }, [progress, twins]);

  const clearTwins = useCallback(() => {
    twins().forEach((card) => {
      card.querySelectorAll<HTMLElement>(".hiw-card-travel, .hiw-face-compact, .hiw-face-front").forEach((el) => {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.width = "";
      });
    });
  }, [twins]);

  /** Shows the twins and hides the hero's cards (or back) in one task, so one set is always on screen. */
  const handOff = useCallback(
    (on: boolean) => {
      const hp = parts.current;
      if (!hp || handed.current === on) return;
      handed.current = on;
      if (on) place(); // the twins are on the hero's cards before the hero's are hidden
      hp.cards.forEach((c) => setHidden(c, on));
      if (!on) clearTwins();
    },
    [place, clearTwins],
  );

  /** Arrival is applied in one task: the CSS attribute (slide positions take over) and the cards' own opacities. */
  const setArrivedNow = useCallback(
    (on: boolean) => {
      if (arrivedRef.current === on) return;
      const section = stageRef.current?.closest<HTMLElement>(".hiw");
      arrivedRef.current = on;
      if (on) {
        section?.setAttribute("data-arrived", ""); // the non-focused cards are hidden by their slide position first...
        place(); // ...then every card is switched on
      } else {
        place(); // the non-focused cards are faded out first...
        section?.removeAttribute("data-arrived"); // ...then the carousel gives up the slide positions
      }
      setArrived(on);
    },
    [place],
  );

  // the followed value drives placement, arrival and the hand-back (the spring may still be returning when the
  // scroll is already at the top)
  useMotionValueEvent(progress, "change", (p) => {
    if (!travel) return;
    if (handed.current && raw.get() === 0 && Math.abs(p) < HOME) {
      setArrivedNow(false);
      handOff(false);
      return;
    }
    if (arrivedRef.current ? p < LEFT : p >= ARRIVED) setArrivedNow(!arrivedRef.current);
    else if (handed.current) place();
  });

  useLayoutEffect(() => {
    if (!travel) return;
    const stage = stageRef.current;
    const section = stage?.closest<HTMLElement>(".hiw");
    const slot = stage?.querySelector<HTMLElement>(".hiw-track");
    if (!stage || !section || !slot) return;
    let raf = 0;
    let first = true;

    const update = () => {
      const r = clamp01(window.scrollY / range.current);
      raw.set(r);
      if ((r > 0 || Math.abs(progress.get()) >= HOME) && !handed.current) handOff(true);
      else if (handed.current) place();
    };
    const measure = () => {
      parts.current = findHeroParts();
      const rect = slot.getBoundingClientRect();
      range.current = Math.max(1, rect.top + window.scrollY + rect.height / 2 - ARRIVE_AT * window.innerHeight);
      if (first) {
        // loading already inside or past the section: the cards are simply at arrival, with no travel
        first = false;
        const r = clamp01(window.scrollY / range.current);
        raw.set(r);
        progress.jump(r);
        if (r > 0) handOff(true);
        setArrivedNow(r >= ARRIVED);
      }
      update();
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(section);
    const heroRoot = document.querySelector("main")?.firstElementChild;
    if (heroRoot) ro.observe(heroRoot);
    document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      // leaving the travel layout (or unmounting): give the hero back exactly as it was
      parts.current?.cards.forEach((c) => setHidden(c, false));
      handed.current = false;
      clearTwins();
      raw.set(0);
      progress.jump(0);
      arrivedRef.current = false;
      section.removeAttribute("data-arrived");
      setArrived(false);
    };
  }, [travel, raw, progress, handOff, place, clearTwins, setArrivedNow]);

  // the card in focus changed: the other two must be the ones that are faded out
  useEffect(() => {
    activeRef.current = active;
    if (travel && handed.current) place();
  }, [travel, active, place]);

  const value = useMemo<TravelValue>(
    () => ({ mode, progress, arrived: travel ? arrived : true, hero: findHeroParts, active, setActive }),
    [mode, progress, travel, arrived, active],
  );

  return (
    <TravelContext.Provider value={value}>
      <div ref={stageRef} className="hiw-stage">
        {children}
      </div>
    </TravelContext.Provider>
  );
}
