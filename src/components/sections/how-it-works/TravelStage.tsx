"use client";
// Client: scroll position, layout measuring and attributes on the hero's elements (the hero's code is not changed).
// The section's markup arrives as server-rendered children.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMotionValue } from "framer-motion";
import type { CardId } from "@/components/RobotEyes";
import { useLayoutMode } from "@/hooks/useLayoutMode";
import { clamp01, findHeroParts, setHidden, TravelContext, type HeroParts, type TravelValue } from "./travel-context";

const LEAVE_AT = 0.99; // hysteresis: arrived at 1, left below this
// The cards arrive (and fan out) this fraction of the stage's height before the stage starts sticking, so the
// carousel starts sooner after the hero (owner feedback: the scroll before it started was too long).
const ARRIVE_EARLY = 0.35;

// The twin is hidden by CSS (.hiw-twin) until shown here, so it can never flash before the scripts run.
function showTwin(el: HTMLElement, on: boolean) {
  el.style.visibility = on ? "visible" : "";
  if (on) {
    el.removeAttribute("inert");
    el.removeAttribute("aria-hidden");
  } else {
    el.setAttribute("inert", "");
    el.setAttribute("aria-hidden", "true");
  }
}

export default function TravelStage({ children }: { children: React.ReactNode }) {
  const mode = useLayoutMode();
  const stageRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const range = useRef(1);
  const parts = useRef<HeroParts | null>(null);
  const twin = useRef<HTMLElement | null>(null);
  const handed = useRef(false);
  const [arrived, setArrived] = useState(false);
  const [active, setActive] = useState(0);
  const [hoverCard, setHoverCard] = useState<CardId | null>(null);

  const travel = mode === "travel";

  // The hand-off: from the first pixel of scroll the hero's robot and cards are hidden and the twins shown, in the
  // same task, so exactly one robot is ever on screen. Back at the top it reverses.
  const applyHandoff = useCallback((on: boolean) => {
    const hp = parts.current;
    if (!hp) return;
    if (handed.current === on) return;
    handed.current = on;
    setHidden(hp.robotLayer, on);
    hp.cards.forEach((c) => setHidden(c, on));
    if (twin.current) showTwin(twin.current, on);
  }, []);

  const registerTwin = useCallback(
    (el: HTMLElement | null) => {
      twin.current = el;
      if (el) showTwin(el, handed.current);
    },
    [],
  );

  useLayoutEffect(() => {
    if (!travel) return;
    const stage = stageRef.current;
    const section = stage?.closest<HTMLElement>(".hiw");
    if (!stage || !section) return;
    let raf = 0;

    const update = () => {
      const p = clamp01(window.scrollY / range.current);
      progress.set(p);
      applyHandoff(p > 0);
      if (p >= 1) setArrived(true);
      else if (p < LEAVE_AT) setArrived(false);
    };
    const measure = () => {
      parts.current = findHeroParts();
      const header = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const top = section.getBoundingClientRect().top + window.scrollY;
      range.current = Math.max(1, top - header - ARRIVE_EARLY * stage.offsetHeight);
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
      const hp = parts.current;
      if (hp) {
        setHidden(hp.robotLayer, false);
        hp.cards.forEach((c) => setHidden(c, false));
      }
      handed.current = false;
      progress.set(0);
    };
  }, [travel, progress, applyHandoff]);

  // The section's arrival flag drives the coverflow (CSS)
  useEffect(() => {
    const section = stageRef.current?.closest<HTMLElement>(".hiw");
    if (!section) return;
    if (travel && arrived) section.setAttribute("data-arrived", "");
    else section.removeAttribute("data-arrived");
  }, [travel, arrived]);

  const hero = useCallback(() => parts.current, []);
  const value = useMemo<TravelValue>(
    () => ({ mode, progress, arrived: travel && arrived, hero, registerTwin, active, setActive, hoverCard, setHoverCard }),
    [mode, progress, travel, arrived, hero, registerTwin, active, hoverCard],
  );

  return (
    <TravelContext.Provider value={value}>
      <div ref={stageRef} className="hiw-stage">
        {children}
      </div>
    </TravelContext.Provider>
  );
}
