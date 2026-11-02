"use client";
// Client: needs media queries, scroll position, IntersectionObserver and layout measurement.
// The steps themselves arrive as server-rendered `children`; this component never re-renders them.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useMotionMode, type MotionMode } from "@/hooks/useMotionMode";
import { StageContext, type StagePose, type StageValue } from "./stage-context";

const STEPS = 3;
const TARGET_VIEWPORT_FRACTION = 0.45; // the cards arrive with the steps near the middle of the screen
const LEAVE_AT = 0.99; // hysteresis: arrived at 1, left below this
const HERO_CARD = ".backdrop-blur-md"; // the visible glass card inside a hero card wrapper

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export default function HowItWorksStage({ children }: { children: React.ReactNode }) {
  const wanted = useMotionMode();
  const rootRef = useRef<HTMLDivElement>(null);
  const heroNodes = useRef<HTMLElement[]>([]);
  const slotCentres = useRef<{ x: number; y: number }[]>([]); // document space

  // Per-step poses and the scroll range, kept as motion values so scrolling never re-renders React.
  const dx0 = useMotionValue(0), dy0 = useMotionValue(0), r0 = useMotionValue(0), s0 = useMotionValue(1);
  const dx1 = useMotionValue(0), dy1 = useMotionValue(0), r1 = useMotionValue(0), s1 = useMotionValue(1);
  const dx2 = useMotionValue(0), dy2 = useMotionValue(0), r2 = useMotionValue(0), s2 = useMotionValue(1);
  const rangeEnd = useMotionValue(1);
  const poses = useMemo<StagePose[]>(
    () => [
      { dx: dx0, dy: dy0, rotate: r0, scale: s0 },
      { dx: dx1, dy: dy1, rotate: r1, scale: s1 },
      { dx: dx2, dy: dy2, rotate: r2, scale: s2 },
    ],
    [dx0, dy0, r0, s0, dx1, dy1, r1, s1, dx2, dy2, r2, s2],
  );

  const { scrollY } = useScroll();
  const progress = useTransform([scrollY, rangeEnd], ([y, end]: number[]) => clamp01(y / Math.max(end, 1)));

  const [measured, setMeasured] = useState(false); // travel poses are ready
  const [revealed, setRevealed] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [instant, setInstant] = useState(false);

  const mode: MotionMode = wanted === "travel" && !measured ? "none" : wanted;

  // Where each hero card visibly is right now (it floats and tilts), as an offset from its step slot.
  // The step card starts exactly there, so swapping one for the other cannot be seen.
  const readLive = useCallback(() => {
    const centres = slotCentres.current;
    heroNodes.current.forEach((node, i) => {
      const card = node.querySelector<HTMLElement>(HERO_CARD) ?? node;
      const r = card.getBoundingClientRect();
      if (centres[i]) {
        poses[i].dx.set(r.left + r.width / 2 + window.scrollX - centres[i].x);
        poses[i].dy.set(r.top + r.height / 2 + window.scrollY - centres[i].y);
      }
      const m = new DOMMatrixReadOnly(getComputedStyle(card.parentElement ?? card).transform);
      poses[i].rotate.set((Math.atan2(m.b, m.a) * 180) / Math.PI);
    });
  }, [poses]);

  // Measure rest positions: the step slots (layout boxes, unaffected by the travel transform) and the
  // hero card wrappers (rest rect). Never during scroll.
  useLayoutEffect(() => {
    if (wanted !== "travel") return;
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;

    const measure = () => {
      const hero = ["prompt", "build", "learn"].map((id) =>
        document.querySelector<HTMLElement>(`[data-hero-card="${id}"]`),
      );
      const slots = Array.from(root.querySelectorAll<HTMLElement>("[data-step-slot]"));
      if (hero.some((h) => !h) || slots.length !== STEPS) {
        setMeasured(false);
        return;
      }
      heroNodes.current = hero as HTMLElement[];
      slotCentres.current = slots.map((slot) => {
        const r = slot.getBoundingClientRect();
        return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY };
      });
      slots.forEach((slot, i) => {
        const w = (hero[i] as HTMLElement).getBoundingClientRect().width;
        const sw = slot.getBoundingClientRect().width;
        poses[i].scale.set(sw > 0 ? w / sw : 1);
      });
      readLive();
      const slotTop = slots[0].getBoundingClientRect().top + window.scrollY;
      rangeEnd.set(Math.max(slotTop - TARGET_VIEWPORT_FRACTION * window.innerHeight, 1));
      setMeasured(true);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(root);
    const heroSection = document.querySelector("main")?.firstElementChild;
    if (heroSection) ro.observe(heroSection);
    window.addEventListener("resize", schedule);
    document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [wanted, poses, rangeEnd, readLive]);

  // Arrive / leave with hysteresis. `instant` marks a load that is already past the section.
  const first = useRef(true);
  const setArrivalFromLoad = useCallback((settled: boolean) => {
    setArrived(settled);
    setInstant(settled);
  }, []);
  useLayoutEffect(() => {
    if (mode !== "travel") {
      first.current = true;
      return;
    }
    if (!first.current) return;
    first.current = false;
    setArrivalFromLoad(progress.get() >= 1);
  }, [mode, progress, setArrivalFromLoad]);

  // While travelling: keep the start pose on the live hero card, hide the hero cards from the first pixel
  // of scroll (the step cards are identical and sit exactly on them), and track arrival.
  useMotionValueEvent(progress, "change", (p) => {
    if (mode !== "travel") return;
    if (p > 0 && p < 1) readLive();
    heroNodes.current.forEach((n) => (n.style.opacity = p > 0 ? "0" : ""));
    if (p >= 1) setArrived(true);
    else if (p < LEAVE_AT) {
      setArrived(false);
      setInstant(false);
    }
  });
  useLayoutEffect(() => {
    if (mode !== "travel") return;
    const nodes = heroNodes.current;
    const p = progress.get();
    nodes.forEach((n) => (n.style.opacity = p > 0 ? "0" : ""));
    return () => nodes.forEach((n) => (n.style.opacity = ""));
  }, [mode, progress]);

  // Fade mode: reveal once on entering view.
  useEffect(() => {
    if (mode !== "fade" || revealed) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode, revealed]);

  const live = mode === "travel";
  const value = useMemo<StageValue>(
    () => ({ mode, progress, poses, arrived: live && arrived, instant: live && instant }),
    [mode, progress, poses, live, arrived, instant],
  );

  return (
    <StageContext.Provider value={value}>
      <div
        ref={rootRef}
        className="relative"
        data-stage={mode}
        data-revealed={revealed || undefined}
        data-arrived={(live && arrived) || undefined}
        data-instant={(live && instant) || undefined}
      >
        {children}
      </div>
    </StageContext.Provider>
  );
}
