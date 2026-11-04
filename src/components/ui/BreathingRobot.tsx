"use client";
// Client leaf (shared by "How it works" and "Why Tareeq"): the robot image breathes (a gentle loop of about 4 s), standing on a straight light blue
// card with a tilted saffron card behind it (lower, like a shadow); the cards pulse a little in step. It only runs
// while the section is on screen and never under reduced motion, where everything is still. The image itself is
// server-rendered and arrives as `children`; the cards are decoration (hidden from assistive technology).

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const LOOP = { duration: 4, ease: "easeInOut" as const, repeat: Infinity };
const REST = { duration: 0.4, ease: "easeOut" as const };

export default function BreathingRobot({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.1 });
  const reduce = useReducedMotion();
  const run = inView && !reduce;

  return (
    <div ref={ref} className="robot-stage">
      <div aria-hidden="true" className="robot-shape robot-shape-saffron">
        <motion.span className="robot-shape-fill" animate={run ? { scale: [1, 1.03, 1] } : { scale: 1 }} transition={run ? LOOP : REST} />
      </div>
      <div aria-hidden="true" className="robot-shape robot-shape-blue">
        <motion.span className="robot-shape-fill" animate={run ? { scale: [1, 1.03, 1] } : { scale: 1 }} transition={run ? LOOP : REST} />
      </div>
      {/* the robot: feet on the blue card's bottom edge, head rising out of its top */}
      <div className="robot-figure">
        {/* breathing: a slight swell and a few pixels of lift, anchored at the feet */}
        <motion.div
          className="robot-breath"
          style={{ transformOrigin: "50% 100%" }}
          animate={run ? { scale: [1, 1.02, 1], y: [0, -5, 0] } : { scale: 1, y: 0 }}
          transition={run ? LOOP : REST}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
