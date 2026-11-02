"use client";
// Client: reads the scroll progress, drives the card's travel transform and the settle spring.

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { StepId } from "@/content";
import StepIcon from "./StepIcon";
import { useStage } from "./stage-context";

const SETTLE = { type: "spring", stiffness: 260, damping: 12, velocity: 0.8 } as const; // peaks near 1.03
const STAGGER = 0.08; // s between cards, left to right

// Gentle at both ends, so the card leaves the hero smoothly and the arrive/leave threshold moves it by well under a pixel.
const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/**
 * The same glass card as the hero's (same size, border, blur, icon and placeholder lines), so the card
 * that travels down is the card that was in the hero. Its look is not changed for the animation.
 */
export default function StepCard({ id, label, index }: { id: StepId; label: string; index: number }) {
  const stage = useStage();
  const travel = stage?.mode === "travel";
  const pose = stage?.poses[index];

  // Always create the motion values (hooks), only apply them in travel mode.
  const zero = useMotionValue(0);
  const one = useMotionValue(1);
  const progress = stage?.progress ?? zero;
  const x = useTransform([progress, pose?.dx ?? zero], ([p, d]: number[]) => d * (1 - ease(p)));
  const y = useTransform([progress, pose?.dy ?? zero], ([p, d]: number[]) => d * (1 - ease(p)));
  const rotate = useTransform([progress, pose?.rotate ?? zero], ([p, r]: number[]) => r * (1 - ease(p)));
  const scale = useTransform([progress, pose?.scale ?? one], ([p, s]: number[]) => s + (1 - s) * ease(p));
  // Hidden only while the hero card is showing (progress 0); from the first pixel of scroll this card is the one on screen.
  const opacity = useTransform(progress, (p) => (p > 0 ? 1 : 0));

  // Settle: a spring with a velocity kick on arrival; from wherever it is back to 1 on leaving.
  const settle = useMotionValue(1);
  const arrived = !!stage?.arrived;
  const instant = !!stage?.instant;
  useEffect(() => {
    if (!travel) {
      settle.set(1);
      return;
    }
    if (arrived && !instant) {
      const c = animate(settle, 1, { ...SETTLE, delay: index * STAGGER });
      return () => c.stop();
    }
    const c = animate(settle, 1, { type: "spring", stiffness: 300, damping: 30 });
    return () => c.stop();
  }, [arrived, instant, travel, index, settle]);

  return (
    <div data-step-slot className="relative z-10 w-[126px] lg:mx-auto">
      <motion.div
        className={travel ? "pointer-events-none" : undefined}
        style={travel ? { x, y, rotate, scale, opacity, willChange: "transform, opacity" } : undefined}
      >
        <motion.div style={travel ? { scale: settle } : undefined}>
          <div className="rounded-xl border border-white/80 bg-white/70 p-2.5 shadow-[0_10px_30px_rgba(30,58,138,0.12)] ring-1 ring-royal/10 backdrop-blur-md sm:p-3">
            <div className="flex items-center gap-1.5 text-royal">
              <StepIcon id={id} on={arrived} />
              <span className="text-[13px] font-semibold">{label}</span>
            </div>
            <div aria-hidden="true" className="mt-2 h-5 space-y-1 overflow-hidden">
              <div className="h-1 w-[85%] rounded-full bg-sky/15" />
              <div className="h-1 w-[60%] rounded-full bg-sky/15" />
              <div className="h-1 w-[40%] rounded-full bg-sky/10" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
