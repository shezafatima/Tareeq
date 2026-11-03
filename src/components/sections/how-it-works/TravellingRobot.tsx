"use client";
// Client: the twin robot's transform follows scroll, and its eyes need motion values and pointer input.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotionValue, useMotionValueEvent } from "framer-motion";
import RobotFigure from "@/components/RobotFigure";
import type { CardId } from "@/components/RobotEyes";
import { ease, useTravel } from "./travel-context";

const FINE = "(hover: hover) and (pointer: fine)";
// The robot turns to face the cards (owner request): a half-turn between these points of the travel
const TURN_FROM = 0.3;
const TURN_TO = 0.7;
const cardEl = (id: CardId) => document.querySelector(`.hiw-card[data-step="${id}"] .hiw-face-full`);

/**
 * The travelling robot (travel layout only): starts exactly on the hero's robot (same file, same size, live
 * position read every scroll step) and moves into the stage's robot slot, shrinking slightly. No parallax.
 */
export default function TravellingRobot() {
  const { mode, progress, hero, registerTwin, active, hoverCard } = useTravel();
  const ref = useRef<HTMLDivElement>(null);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const travel = mode === "travel";
  const [mirrored, setMirrored] = useState(false);

  const place = useCallback(
    (p: number) => {
      const el = ref.current;
      const slot = el?.parentElement;
      const hp = hero();
      if (!el || !slot || !hp) return;
      const hr = hp.robotImg.getBoundingClientRect();
      const sr = slot.getBoundingClientRect();
      if (hr.width === 0 || sr.width === 0) return;
      el.style.width = `${hr.width}px`; // same rendered size as the hero's image: identical pixels at the hand-off
      const e = ease(p);
      const dx = hr.left + hr.width / 2 - (sr.left + sr.width / 2);
      const dy = hr.top + hr.height / 2 - (sr.top + sr.height / 2);
      // Exactly 1 for the first moment of travel, so the twin is drawn without resampling at the hand-off (a scale
      // of 0.99999 would soften its edges by a fraction of a pixel); continuous from there.
      const k = Math.max(0, (e - 0.002) / 0.998);
      const scale = k === 0 ? 1 : 1 + (sr.width / hr.width - 1) * k;
      // Land on whole device pixels, as the browser does for the hero's normally laid-out image, so both are drawn
      // the same way (a fractional position would be resampled and look a touch softer at the hand-off).
      const dpr = window.devicePixelRatio || 1;
      const snap = (v: number) => Math.round(v * dpr) / dpr;
      const x = snap(sr.left + sr.width / 2 + dx * (1 - e) - (hr.width * scale) / 2) - (sr.left + sr.width / 2 - hr.width / 2);
      const y = snap(sr.top + sr.height / 2 + dy * (1 - e) - (hr.height * scale) / 2) - (sr.top + sr.height / 2 - hr.height / 2);
      // half-turn toward the cards; 0deg exactly at the hand-off. Past 90deg the figure is drawn mirrored, which
      // RobotFigure handles (chevron laid back on top, eyes aim mirrored).
      const t = Math.min(1, Math.max(0, (p - TURN_FROM) / (TURN_TO - TURN_FROM)));
      const angle = 180 * ease(t);
      setMirrored(angle > 90);
      el.style.transform = `translate(-50%, -50%) translate(${x + (hr.width * (scale - 1)) / 2}px, ${y + (hr.height * (scale - 1)) / 2}px) scale(${scale})${angle > 0 ? ` perspective(1600px) rotateY(${angle}deg)` : ""}`;
    },
    [hero],
  );

  useMotionValueEvent(progress, "change", (p) => travel && place(p));
  useLayoutEffect(() => {
    if (!travel) return;
    place(progress.get());
  }, [travel, place, progress]);

  useLayoutEffect(() => {
    if (!travel) return;
    registerTwin(ref.current);
    return () => registerTwin(null);
  }, [travel, registerTwin]);

  // Pointer input for the eyes (fine pointers only), throttled to one update per frame
  useEffect(() => {
    if (!travel || !window.matchMedia(FINE).matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      cursorX.set(x);
      cursorY.set(y);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [travel, cursorX, cursorY]);

  // Look toward the newly centred card (a glance, not the happy face), unless a card is being hovered
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!travel || hoverCard) return;
    const ids: CardId[] = ["prompt", "build", "learn"];
    const r = cardEl(ids[active] ?? "prompt")?.getBoundingClientRect();
    if (!r) return;
    cursorX.set(r.left + r.width / 2);
    cursorY.set(r.top + r.height / 2);
  }, [active, travel, hoverCard, cursorX, cursorY]);

  if (!travel) return null;
  return (
    <div ref={ref} className="hiw-twin">
      <RobotFigure eyes="live" activeCard={hoverCard} reduce={false} cursorX={cursorX} cursorY={cursorY} cardElement={cardEl} mirrored={mirrored} />
    </div>
  );
}
