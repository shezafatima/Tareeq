"use client";

import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";
import type { LayoutMode } from "@/hooks/useLayoutMode";

/** The hero's three card wrappers, in order: Prompt, Build, Learn (read only; the hero's code is not changed). */
export type HeroParts = { cards: HTMLElement[] };

export type TravelValue = {
  mode: LayoutMode;
  /** 0 at the top (hero), about 1 once the cards arrive (travel mode; a spring, so it may pass 1 briefly) */
  progress: MotionValue<number>;
  /** the cards have arrived in the carousel (travel mode); in other modes always true */
  arrived: boolean;
  /** live hero card wrappers, or null when not found / not travelling */
  hero: () => HeroParts | null;
  /** the card in focus in the carousel */
  active: number;
  setActive: (i: number) => void;
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

/** The hero's three card wrappers (they carry data-hero-card in Hero.tsx). */
export function findHeroParts(): HeroParts | null {
  const heroRoot = document.querySelector("main")?.firstElementChild;
  const cards = ["prompt", "build", "learn"].map((id) => heroRoot?.querySelector<HTMLElement>(`[data-hero-card="${id}"]`));
  if (cards.some((c) => !c)) return null;
  return { cards: cards as HTMLElement[] };
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
