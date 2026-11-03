"use client";

import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";
import type { CardId } from "@/components/RobotEyes";
import type { LayoutMode } from "@/hooks/useLayoutMode";

export type HeroParts = { robotImg: HTMLElement; robotLayer: HTMLElement; cards: HTMLElement[] };

export type TravelValue = {
  mode: LayoutMode;
  /** 0 at the top (hero), 1 once the stage starts sticking (travel layout only) */
  progress: MotionValue<number>;
  arrived: boolean;
  /** live hero elements, or null when not found / not travelling */
  hero: () => HeroParts | null;
  /** the twin robot's element, so the hand-off can show it in the same frame the hero robot is hidden */
  registerTwin: (el: HTMLElement | null) => void;
  /** carousel state shared with the robot: centred card and the card being hovered or focused */
  active: number;
  setActive: (i: number) => void;
  hoverCard: CardId | null;
  setHoverCard: (c: CardId | null) => void;
};

export const TravelContext = createContext<TravelValue | null>(null);

export function useTravel(): TravelValue {
  const v = useContext(TravelContext);
  if (!v) throw new Error("useTravel must be used inside TravelStage");
  return v;
}

/** Gentle at both ends (from feature 003): smooth departure, sub-pixel movement near arrival. */
export const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;
export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** The hero's robot image, its layer and its three card wrappers (read only; the hero's code is not changed). */
export function findHeroParts(): HeroParts | null {
  const heroRoot = document.querySelector("main")?.firstElementChild;
  const robotImg = heroRoot?.querySelector<HTMLElement>('img[alt="Tareeq robot assistant"]');
  const robotLayer = robotImg?.closest<HTMLElement>(".absolute");
  const cards = ["prompt", "build", "learn"].map((id) => heroRoot?.querySelector<HTMLElement>(`[data-hero-card="${id}"]`));
  if (!robotImg || !robotLayer || cards.some((c) => !c)) return null;
  return { robotImg, robotLayer, cards: cards as HTMLElement[] };
}

/** Hide or show an element completely: not painted, not focusable, not announced (owner condition, ADR-0001). */
export function setHidden(el: HTMLElement, hidden: boolean) {
  if (hidden) {
    el.style.visibility = "hidden";
    el.setAttribute("inert", "");
    el.setAttribute("aria-hidden", "true");
  } else {
    el.style.visibility = "";
    el.removeAttribute("inert");
    el.removeAttribute("aria-hidden");
  }
}
