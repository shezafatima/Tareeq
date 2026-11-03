"use client"; // the eye overlay needs motion values, effects and pointer input

import Image from "next/image";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import RobotEyes, { type CardId } from "./RobotEyes";

// Where the chest chevron sits in robot-noeyes.png (1024x1536), measured from the image; robot-chevron.png is that
// region cut out with its original pixels.
const CHEVRON = { left: (626 / 1024) * 100, top: (528 / 1536) * 100, width: (64 / 1024) * 100, height: (85 / 1536) * 100 };

export type RobotFigureLiveProps = {
  className?: string;
  priority?: boolean;
  activeCard: CardId | null;
  reduce: boolean;
  cursorX: MotionValue<number>;
  cursorY: MotionValue<number>;
  cardElement?: (id: CardId) => Element | null;
  /**
   * The parent is drawing this figure mirrored (for example turned with rotateY(180deg)). The figure then shows the
   * robot without its chest chevron and lays the original chevron back on top, un-mirrored, so the brand mark
   * always points the right way; the eyes aim in mirrored space. The figure never mirrors itself.
   */
  mirrored?: boolean;
};

/** The robot without painted eyes, plus the live eye overlay (tracking, blink, happy). Same file and `sizes` as the hero. */
export default function RobotFigureLive({ className, priority, mirrored = false, ...eyes }: RobotFigureLiveProps) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src="/robot-noeyes.png"
        alt="Tareeq robot assistant"
        width={1024}
        height={1536}
        priority={priority}
        sizes="(min-width: 1024px) 400px, 50vw"
        className={cn("h-auto w-full select-none", mirrored && "invisible")}
      />
      {/* always present (loaded early) so the swap at the edge-on moment of a turn is instant */}
      <Image
        src="/robot-noeyes-nochevron.png"
        alt=""
        aria-hidden="true"
        width={1024}
        height={1536}
        loading="eager"
        sizes="(min-width: 1024px) 400px, 50vw"
        className={cn("absolute inset-0 h-auto w-full select-none", !mirrored && "invisible")}
      />
      <Image
        src="/robot-chevron.png"
        alt=""
        aria-hidden="true"
        width={64}
        height={85}
        loading="eager"
        className={cn("absolute select-none", !mirrored && "invisible")}
        style={{
          left: `${CHEVRON.left}%`,
          top: `${CHEVRON.top}%`,
          width: `${CHEVRON.width}%`,
          height: `${CHEVRON.height}%`,
          transform: "scaleX(-1)", // undoes the parent's mirroring, so the chevron points the right way
        }}
      />
      <RobotEyes {...eyes} mirrored={mirrored} />
    </div>
  );
}
