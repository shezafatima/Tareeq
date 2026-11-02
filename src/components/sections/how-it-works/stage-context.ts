"use client";

import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";
import type { MotionMode } from "@/hooks/useMotionMode";

export type StagePose = {
  /** offset from the card's resting slot to the hero card, in px (kept live while the hero card floats) */
  dx: MotionValue<number>;
  dy: MotionValue<number>;
  /** the hero card's tilt in degrees */
  rotate: MotionValue<number>;
  /** hero card width / step card width (close to 1: the two cards are the same design) */
  scale: MotionValue<number>;
};

export type StageValue = {
  /** the mode actually in use (travel falls back to fade when the hero cards are not found) */
  mode: MotionMode;
  /** 0 to 1 along the scroll range; 1 once the cards have arrived */
  progress: MotionValue<number>;
  poses: StagePose[];
  arrived: boolean;
  /** true when the page loaded already past the section: show the final state without a settle */
  instant: boolean;
};

export const StageContext = createContext<StageValue | null>(null);

export function useStage(): StageValue | null {
  return useContext(StageContext);
}
