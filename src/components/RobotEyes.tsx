"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  type MotionValue,
} from "framer-motion";
import {
  ARC_STROKE,
  ARC_W,
  CLIP_INSET,
  EYE_COLOR,
  EYE_CY,
  EYE_GAP,
  EYE_H,
  EYE_W,
  GLOW_BLUR,
  MORPH_DURATION,
  VISOR_RADIUS,
} from "./eyeConstants"; // shared with the brand preloader

/* ------------------------------------------------------------------ */
/* Visor, measured from public/robot-noeyes.png with image moments.    */
/* The head is tilted, so the visor is a rotated rounded rectangle.    */
/* Add ?eyes-debug=1 to the URL to outline it.                         */
/* ------------------------------------------------------------------ */
const IMG_W = 1024; // px, robot-noeyes.png
const IMG_H = 1536;
const VISOR_CX = 62.32; // % of image width, visor centre
const VISOR_CY = 16.96; // % of image height
const VISOR_ANGLE = 9.87; // deg, clockwise on screen
const VISOR_W = 34.76; // % of image width, size along the visor's own (rotated) x axis
const VISOR_H = 16.9; // % of image height, size along the visor's own (rotated) y axis

// Eyes (% of visor width unless noted)

// Gaze: the offset is clamped to the ellipse with these semi-axes
const MAX_TRAVEL_X = 18; // % of visor width
const MAX_TRAVEL_Y = 12; // % of visor height
const GAZE_SPRING = { stiffness: 110, damping: 18, mass: 0.6 };
const IDLE_RETURN = 4; // s without cursor movement before drifting back to centre
const DRIFT_RATE = 0.7; // 1/s
const WANDER_MIN = 2; // s, touch devices: random glance interval
const WANDER_MAX = 4;
const WANDER_SPOTS = [
  [-0.8, 0],
  [0.8, 0],
  [0, -0.8],
  [0.5, 0.2],
  [-0.5, 0.2],
  [0, 0],
] as const;

// Blink
const BLINK_MIN = 2.5; // s between blinks
const BLINK_MAX = 6;
const BLINK_DURATION = 0.14; // s per blink (scaleY to ~0.1 and back)
const BLINK_DEPTH = 0.9;
const DOUBLE_BLINK_CHANCE = 0.2;
const DOUBLE_BLINK_GAP = 0.12; // s between the two blinks

// Pill <-> happy arc

/* ------------------------------------------------------------------ */

// Everything below is in image pixels (the SVG covers the whole image)
const vw = (VISOR_W / 100) * IMG_W;
const vh = (VISOR_H / 100) * IMG_H;
const cx0 = (VISOR_CX / 100) * IMG_W;
const cy0 = (VISOR_CY / 100) * IMG_H;
const pw = (pct: number) => (pct / 100) * vw; // % of visor width -> px
const eyeW = pw(EYE_W);
const eyeH = pw(EYE_H);
const eyeSpacing = eyeW + pw(EYE_GAP); // centre to centre
const eyeCy = (EYE_CY / 100 - 0.5) * vh; // from visor centre
const maxX = pw(MAX_TRAVEL_X);
const maxY = (MAX_TRAVEL_Y / 100) * vh;
const radius = (VISOR_RADIUS / 100) * vh;
const inset = (CLIP_INSET / 100) * vh;
const clipW = vw * (1 - (2 * CLIP_INSET) / 100);
const clipH = vh * (1 - (2 * CLIP_INSET) / 100);
const clipR = Math.max(0, radius - inset);
const arcHalf = pw(ARC_W) / 2;
const ARC_PATH = `M ${-arcHalf} ${arcHalf * 0.35} C ${-arcHalf * 0.8} ${-arcHalf * 0.8}, ${arcHalf * 0.8} ${-arcHalf * 0.8}, ${arcHalf} ${arcHalf * 0.35}`;
const placement = `translate(${cx0} ${cy0}) rotate(${VISOR_ANGLE})`;
const theta = (VISOR_ANGLE * Math.PI) / 180;
const COS = Math.cos(theta);
const SIN = Math.sin(theta);

export type CardId = "prompt" | "build" | "learn";

const FINE_QUERY = "(hover: hover) and (pointer: fine)";
const subscribeFine = (cb: () => void) => {
  const mq = window.matchMedia(FINE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const subscribeNone = () => () => {};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** screen-space direction -> the visor's rotated frame, then clamped to the unit circle
 *  (which is the travel ellipse once scaled by maxX / maxY). */
function toVisorAim(ax: number, ay: number): [number, number] {
  const u = ax * COS + ay * SIN;
  const v = -ax * SIN + ay * COS;
  const len = Math.hypot(u, v);
  return len > 1 ? [u / len, v / len] : [u, v];
}

type Props = {
  /** card that is hovered / focused / tapped, from the hero's existing card state */
  activeCard: CardId | null;
  reduce: boolean;
  /** page-wide cursor position (client px), shared from the hero's single pointermove listener */
  cursorX: MotionValue<number>;
  cursorY: MotionValue<number>;
};

export default function RobotEyes({ activeCard, reduce, cursorX, cursorY }: Props) {
  const id = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const finePointer = useSyncExternalStore(
    subscribeFine,
    () => window.matchMedia(FINE_QUERY).matches,
    () => false
  );
  const debug = useSyncExternalStore(
    subscribeNone,
    () => new URLSearchParams(window.location.search).get("eyes-debug") === "1",
    () => false
  );

  const gx = useSpring(0, GAZE_SPRING);
  const gy = useSpring(0, GAZE_SPRING);
  const blink = useMotionValue(1);

  const run = useRef(true); // false while the tab is hidden or the hero is off screen
  const s = useRef({
    t: 0,
    aim: [0, 0] as [number, number], // in the visor's rotated frame, inside the unit circle
    moveAt: 0,
    nextBlink: rand(BLINK_MIN, BLINK_MAX),
    blinks: [] as number[],
    nextWander: rand(WANDER_MIN, WANDER_MAX),
    happy: false,
    card: null as CardId | null,
  });
  useEffect(() => {
    s.current.happy = activeCard !== null;
    s.current.card = activeCard;
  }, [activeCard]);

  // Pause blinking and tracking when the tab is hidden or the hero is off screen
  useEffect(() => {
    let visible = true;
    let inView = true;
    const update = () => {
      run.current = visible && inView;
    };
    const onVis = () => {
      visible = document.visibilityState === "visible";
      update();
    };
    document.addEventListener("visibilitychange", onVis);
    const el = svgRef.current;
    const io = el
      ? new IntersectionObserver(([en]) => {
          inView = en.isIntersecting;
          update();
        })
      : null;
    if (el) io?.observe(el);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, []);

  // screen position of the visor centre
  const eyesCentre = () => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return null;
    return { x: r.left + (VISOR_CX / 100) * r.width, y: r.top + (VISOR_CY / 100) * r.height };
  };
  // aim toward a screen point: full travel when the point is at the page edge
  const aimAt = (px: number, py: number): [number, number] => {
    const c = eyesCentre();
    if (!c) return [0, 0];
    const dx = px - c.x;
    const dy = py - c.y;
    const ax = dx < 0 ? dx / Math.max(c.x, 1) : dx / Math.max(window.innerWidth - c.x, 1);
    const ay = dy < 0 ? dy / Math.max(c.y, 1) : dy / Math.max(window.innerHeight - c.y, 1);
    return toVisorAim(clamp(ax, -1, 1), clamp(ay, -1, 1));
  };
  // aim toward the centre of a card
  const aimAtCard = (card: CardId): [number, number] | null => {
    const c = eyesCentre();
    const r = document.querySelector(`[data-hero-card=${card}]`)?.getBoundingClientRect();
    if (!c || !r) return null;
    const dx = r.left + r.width / 2 - c.x;
    const dy = r.top + r.height / 2 - c.y;
    const len = Math.hypot(dx, dy) || 1;
    return toVisorAim(dx / len, dy / len);
  };

  const onCursor = () => {
    if (reduce || !finePointer) return;
    s.current.aim = aimAt(cursorX.get(), cursorY.get());
    s.current.moveAt = s.current.t;
  };
  useMotionValueEvent(cursorX, "change", onCursor);
  useMotionValueEvent(cursorY, "change", onCursor);

  useAnimationFrame((_, delta) => {
    if (reduce || !run.current) return;
    const st = s.current;
    const dt = Math.min(delta, 250) / 1000;
    st.t += dt;

    // ---- blink: 1 in 5 is a quick double blink ----
    if (st.happy) {
      blink.set(1);
    } else {
      if (st.blinks.length === 0 && st.t >= st.nextBlink) {
        st.blinks = [st.t];
        if (Math.random() < DOUBLE_BLINK_CHANCE) st.blinks.push(st.t + BLINK_DURATION + DOUBLE_BLINK_GAP);
      }
      let sy = 1;
      if (st.blinks.length) {
        for (const b of st.blinks) {
          const p = (st.t - b) / BLINK_DURATION;
          if (p >= 0 && p < 1) sy = Math.min(sy, 1 - BLINK_DEPTH * Math.sin(Math.PI * p));
        }
        const last = st.blinks[st.blinks.length - 1];
        if (st.t - last >= BLINK_DURATION) {
          st.blinks = [];
          st.nextBlink = st.t + rand(BLINK_MIN, BLINK_MAX);
        }
      }
      blink.set(sy);
    }

    // ---- gaze ----
    const cardAim = st.card ? aimAtCard(st.card) : null;
    if (cardAim) {
      st.aim = cardAim;
      st.moveAt = st.t; // restart the idle timer when the card is released
    } else if (finePointer) {
      if (st.t - st.moveAt > IDLE_RETURN) {
        const k = Math.exp(-dt * DRIFT_RATE);
        st.aim = [st.aim[0] * k, st.aim[1] * k];
      }
    } else if (st.t >= st.nextWander) {
      const spot = WANDER_SPOTS[Math.floor(Math.random() * WANDER_SPOTS.length)];
      st.aim = toVisorAim(spot[0], spot[1]);
      st.nextWander = st.t + rand(WANDER_MIN, WANDER_MAX);
    }
    gx.set(st.aim[0] * maxX);
    gy.set(st.aim[1] * maxY);
  });

  const happy = activeCard !== null;
  const morph = { duration: reduce ? 0.12 : MORPH_DURATION, ease: "easeOut" as const };
  const eyeStyle = { transformBox: "fill-box", transformOrigin: "center" } as const;

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${IMG_W} ${IMG_H}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        {/* the clip is the same rotated rounded rectangle, inset inside the real visor edge */}
        <clipPath id={`${id}-clip`}>
          <rect
            x={-clipW / 2}
            y={-clipH / 2}
            width={clipW}
            height={clipH}
            rx={clipR}
            ry={clipR}
            transform={placement}
          />
        </clipPath>
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={pw(GLOW_BLUR)} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* glow is inside the clipped group, so it is clipped too */}
      <g clipPath={`url(#${id}-clip)`}>
        <g transform={placement}>
          <motion.g style={{ x: gx, y: gy }}>
            <g filter={`url(#${id}-glow)`} fill={EYE_COLOR} stroke="none">
              {[-1, 1].map((side) => (
                <g key={side} transform={`translate(${(side * eyeSpacing) / 2} ${eyeCy})`}>
                  <motion.g style={{ scaleY: blink, ...eyeStyle }}>
                    {/* open pill */}
                    <motion.rect
                      x={-eyeW / 2}
                      y={-eyeH / 2}
                      width={eyeW}
                      height={eyeH}
                      rx={eyeW / 2}
                      style={eyeStyle}
                      initial={false}
                      animate={{ opacity: happy ? 0 : 1, scale: happy ? 0.7 : 1 }}
                      transition={morph}
                    />
                    {/* happy arc */}
                    <motion.path
                      d={ARC_PATH}
                      fill="none"
                      stroke={EYE_COLOR}
                      strokeWidth={pw(ARC_STROKE)}
                      strokeLinecap="round"
                      style={eyeStyle}
                      initial={false}
                      animate={{ opacity: happy ? 1 : 0, scale: happy ? 1 : 0.7 }}
                      transition={morph}
                    />
                  </motion.g>
                </g>
              ))}
            </g>
          </motion.g>
        </g>
      </g>

      {debug && (
        <g transform={placement} fill="none" strokeWidth={1.5}>
          {/* measured visor edge */}
          <rect x={-vw / 2} y={-vh / 2} width={vw} height={vh} rx={radius} ry={radius} stroke="red" />
          {/* actual clip (inset) */}
          <rect x={-clipW / 2} y={-clipH / 2} width={clipW} height={clipH} rx={clipR} ry={clipR} stroke="red" strokeDasharray="5 4" />
          {/* clamp ellipse for the eye-pair centre, and the eye-line axis */}
          <ellipse cx={0} cy={eyeCy} rx={maxX} ry={maxY} stroke="yellow" />
          <line x1={-vw / 2} y1={eyeCy} x2={vw / 2} y2={eyeCy} stroke="yellow" strokeOpacity={0.6} strokeDasharray="2 4" />
        </g>
      )}
    </svg>
  );
}
