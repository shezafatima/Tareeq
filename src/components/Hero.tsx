"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation";
import RobotEyes from "./RobotEyes";

/* ------------------------------------------------------------------ */
/* Animation tuning. Idle motion is transform / opacity only (the      */
/* orbit draw-in is a one-off stroke reveal).                          */
/* ------------------------------------------------------------------ */

// Idle floating of the glass cards: distance (px up), tilt swing (deg, around REST_TILT), duration (s), delay (s)
const CARD_FLOAT = {
  prompt: { distance: 8, swing: 1.5, duration: 6.5, delay: 0 },
  build: { distance: 10, swing: 1, duration: 7.5, delay: 1.2 },
  learn: { distance: 6, swing: 1.5, duration: 5.5, delay: 0.6 },
};
const CARD_REST_TILT = -1.5; // deg; float swings stay within -3..0
const FLOAT_PAUSE_SPRING = { stiffness: 120, damping: 20 }; // floating fades out/in smoothly on hover

// Card hover / focus / tap
const HOVER_LIFT = 6; // px
const HOVER_SCALE = 1.04;
const HOVER_SPRING = { type: "spring", stiffness: 420, damping: 30, mass: 0.8 } as const; // ~250 ms
const EXPAND_DURATION = 0.3; // s, card height + text
const SHADOW_IDLE = "0 10px 30px rgba(30,58,138,0.12)";
const SHADOW_HOVER = "0 20px 46px rgba(30,58,138,0.24)";
const BORDER_IDLE = "rgba(255,255,255,0.8)";
const BORDER_HOVER = "rgba(242,169,59,0.6)"; // soft saffron tint
const SKELETON_HEIGHT = 20; // px, height of the placeholder lines (collapsed body)

// Glow shifts toward the hovered card: max px, and direction per card
const GLOW_SHIFT = 12;
const GLOW_DIR = { prompt: [-1, -0.7], build: [-1, 0.4], learn: [1, -0.6] } as const;
const GLOW_SHIFT_SPRING = { type: "spring", stiffness: 70, damping: 18 } as const;

// Soft glow "breathing"
const GLOW_SCALE = 1.04;
const GLOW_DURATION = 8; // s per loop

// Saffron orbit line
const ORBIT_DRAW_DURATION = 1.6; // s, one-off draw-in
const ORBIT_DOT_DURATION = 10; // s per lap of the travelling dot

// Cursor parallax: max shift in px per layer (pointer devices only)
const PARALLAX = { cards: 14, orbit: 8, glow: 6, robot: 4 };
const PARALLAX_SPRING = { stiffness: 60, damping: 20, mass: 0.6 };

// Entrance sequence (s): glow, then robot, then cards one by one
const ENTRANCE = { glow: 0, robot: 0.35, cards: 0.9, stagger: 0.15 };

/* ------------------------------------------------------------------ */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
/** Hydration-safe: false on the server and for the first client render, then the real value. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false);
}

type CardId = "prompt" | "build" | "learn";

// Orbit curve in a 600 x 660 box (same ratio as the visual container)
const ORBIT_VIEWBOX = { w: 600, h: 660 };
const ORBIT_P = [
  [540, 226],
  [566, 336],
  [440, 452],
  [236, 490],
] as const;
const ORBIT_PATH = `M${ORBIT_P[0]} C${ORBIT_P[1]} ${ORBIT_P[2]} ${ORBIT_P[3]}`;
const ORBIT_SAMPLES = Array.from({ length: 61 }, (_, i) => {
  const t = i / 60;
  const u = 1 - t;
  const pt = (k: 0 | 1) =>
    u * u * u * ORBIT_P[0][k] +
    3 * u * u * t * ORBIT_P[1][k] +
    3 * u * t * t * ORBIT_P[2][k] +
    t * t * t * ORBIT_P[3][k];
  return [pt(0), pt(1)] as const;
});

type Pos = { mx: MotionValue<number>; my: MotionValue<number> };

function Parallax({
  mx,
  my,
  depth,
  children,
}: Pos & { depth: number; children: ReactNode }) {
  const x = useSpring(useTransform(mx, (v) => v * depth), PARALLAX_SPRING);
  const y = useSpring(useTransform(my, (v) => v * depth), PARALLAX_SPRING);
  return (
    <motion.div style={{ x, y }} className="h-full w-full">
      {children}
    </motion.div>
  );
}

/** Positioned layer: entrance (fade/rise) -> cursor parallax -> children (which may float). */
function Layer({
  className,
  depth,
  delay,
  fade = true,
  rise = 0,
  reduce,
  mx,
  my,
  wrapperProps,
  children,
}: Pos & {
  className: string;
  depth: number;
  delay: number;
  fade?: boolean;
  rise?: number;
  reduce: boolean;
  wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div className={className} {...wrapperProps}>
      <motion.div
        className="h-full w-full"
        initial={reduce ? false : { opacity: fade ? 0 : 1, y: rise }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay, ease: "easeOut" }}
      >
        <Parallax mx={mx} my={my} depth={depth}>
          {children}
        </Parallax>
      </motion.div>
    </div>
  );
}

/** Idle float. The amplitude springs to 0 while `paused`, so hover/focus never causes a jump. */
function Floater({
  cfg,
  reduce,
  paused,
  children,
}: {
  cfg: { distance: number; swing: number; duration: number; delay: number };
  reduce: boolean;
  paused: boolean;
  children: ReactNode;
}) {
  const amp = useSpring(1, FLOAT_PAUSE_SPRING);
  const y = useMotionValue(0);
  const rotate = useMotionValue(CARD_REST_TILT);

  useEffect(() => {
    amp.set(paused ? 0 : 1);
  }, [paused, amp]);

  useAnimationFrame((time) => {
    if (reduce) return;
    const s = Math.max(0, time / 1000 - cfg.delay);
    const phase = (2 * Math.PI * s) / cfg.duration;
    const a = amp.get();
    y.set((-cfg.distance * (1 - Math.cos(phase)) * a) / 2);
    rotate.set(CARD_REST_TILT - cfg.swing * Math.cos(phase) * a);
  });

  return (
    <motion.div className="h-full w-full" style={{ y, rotate }}>
      {children}
    </motion.div>
  );
}

/* ---- card icons (animate while the card is active) ---- */

const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-full w-full",
} as const;

function SparkleIcon({ on }: { on: boolean }) {
  return (
    <motion.svg
      {...iconBase}
      animate={{ rotate: on ? 90 : 0, scale: on ? [1, 1.25, 1] : 1 }}
      transition={{ rotate: { type: "spring", stiffness: 180, damping: 14 }, scale: { duration: 0.5 } }}
    >
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" fill="currentColor" stroke="none" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" fill="currentColor" stroke="none" />
    </motion.svg>
  );
}

function CodeIcon({ on }: { on: boolean }) {
  const t = { type: "spring", stiffness: 260, damping: 18 } as const;
  return (
    <svg {...iconBase}>
      <motion.path d="M8 7l-5 5 5 5" animate={{ x: on ? -2 : 0 }} transition={t} />
      <motion.path d="M16 7l5 5-5 5" animate={{ x: on ? 2 : 0 }} transition={t} />
      <path d="M14 4l-4 16" />
    </svg>
  );
}

function BulbIcon({ on }: { on: boolean }) {
  return (
    <motion.svg
      {...iconBase}
      animate={{
        filter: on
          ? "drop-shadow(0 0 4px rgba(242,169,59,0.85))"
          : "drop-shadow(0 0 0px rgba(242,169,59,0))",
      }}
      transition={{ duration: 0.3 }}
    >
      <motion.path
        d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"
        animate={{ fill: on ? "#F2A93B" : "rgba(242,169,59,0)" }}
        transition={{ duration: 0.3 }}
      />
      <path d="M9 18h6M10 21h4" />
    </motion.svg>
  );
}

const CARDS: Record<
  CardId,
  { label: string; text: string; Icon: (p: { on: boolean }) => ReactNode }
> = {
  prompt: { label: "Prompt", text: "Make a 10-question quiz on photosynthesis for Grade 7", Icon: SparkleIcon },
  build: { label: "Build", text: "A marking helper you set up in 20 minutes", Icon: CodeIcon },
  learn: { label: "Learn", text: "Teach your class to check AI answers", Icon: BulbIcon },
};

function InfoCard({ id, active, reduce }: { id: CardId; active: boolean; reduce: boolean }) {
  const { label, text, Icon } = CARDS[id];
  const fx = active && !reduce; // motion effects (lift, icon, ...) are off under reduced motion
  return (
    <Floater cfg={CARD_FLOAT[id]} reduce={reduce} paused={active}>
      <motion.div
        className="rounded-xl border bg-white/70 p-2.5 ring-1 ring-royal/10 backdrop-blur-md sm:p-3"
        initial={false}
        animate={{
          y: fx ? -HOVER_LIFT : 0,
          scale: fx ? HOVER_SCALE : 1,
          boxShadow: active ? SHADOW_HOVER : SHADOW_IDLE,
          borderColor: active ? BORDER_HOVER : BORDER_IDLE,
        }}
        transition={reduce ? { duration: 0.12 } : HOVER_SPRING}
      >
        <div className="flex items-center gap-1.5 text-royal">
          <span className="h-4 w-4 shrink-0">
            <Icon on={fx} />
          </span>
          <span className="text-[13px] font-semibold">{label}</span>
        </div>
        <motion.div
          className="relative mt-2 overflow-hidden"
          initial={false}
          animate={{ height: active ? "auto" : SKELETON_HEIGHT }}
          transition={reduce ? { duration: 0.01 } : { duration: EXPAND_DURATION, ease: "easeOut" }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 space-y-1"
            animate={{ opacity: active ? 0 : 1 }}
            transition={{ duration: reduce ? 0.12 : 0.2 }}
          >
            <div className="h-1 w-[85%] rounded-full bg-sky/15" />
            <div className="h-1 w-[60%] rounded-full bg-sky/15" />
            <div className="h-1 w-[40%] rounded-full bg-sky/10" />
          </motion.div>
          <motion.p
            className="text-[11px] leading-snug text-midnight sm:text-xs"
            initial={false}
            animate={{ opacity: active ? 1 : 0, y: active || reduce ? 0 : 6 }}
            transition={{ duration: reduce ? 0.12 : EXPAND_DURATION - 0.05, delay: fx ? 0.08 : 0 }}
          >
            {text}
          </motion.p>
        </motion.div>
      </motion.div>
    </Floater>
  );
}

function HeroVisual({ reduce }: { reduce: boolean }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const cursorX = useMotionValue(0); // raw client px, read by the robot's eyes
  const cursorY = useMotionValue(0);
  const [hover, setHover] = useState<CardId | null>(null);
  const [focus, setFocus] = useState<CardId | null>(null);
  const [tap, setTap] = useState<CardId | null>(null);
  const active = hover ?? focus ?? tap;

  // Cursor parallax + eye tracking: one passive pointermove listener, throttled with rAF.
  // Fine pointers only (never touch), and never with reduced motion.
  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      mx.set((x / window.innerWidth) * 2 - 1);
      my.set((y / window.innerHeight) * 2 - 1);
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
  }, [reduce, mx, my, cursorX, cursorY]);

  // Touch: tapping anywhere outside the cards closes the expanded one
  useEffect(() => {
    if (!tap) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as Element).closest("[data-hero-card]")) setTap(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [tap]);

  const common = { reduce, mx, my };
  const cardDelay = (i: number) => ENTRANCE.cards + i * ENTRANCE.stagger;
  const glowShift = active && !reduce ? GLOW_DIR[active] : [0, 0];

  // Mouse/pen hover, keyboard focus (focus-visible only) and touch tap all drive the same state
  const cardProps = (id: CardId): React.HTMLAttributes<HTMLDivElement> & { "data-hero-card": string } => ({
    "data-hero-card": id,
    tabIndex: 0,
    role: "group",
    "aria-label": CARDS[id].label,
    onPointerEnter: (e) => {
      if (e.pointerType !== "touch") setHover(id);
    },
    onPointerLeave: (e) => {
      if (e.pointerType !== "touch") setHover((h) => (h === id ? null : h));
    },
    onFocus: (e) => {
      if (e.currentTarget.matches(":focus-visible")) setFocus(id);
    },
    onBlur: () => setFocus((f) => (f === id ? null : f)),
    onClick: () => {
      // a real mouse click already shows it via hover; only touch toggles
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        setTap((t) => (t === id ? null : id));
      }
    },
  });
  const cardClass = (id: CardId, pos: string) =>
    `${pos} rounded-xl outline-offset-4 ${active === id ? "z-30" : "z-10"}`;

  return (
    <div className="relative mx-auto aspect-[10/11] w-full max-w-[600px] lg:ml-auto lg:mr-0 lg:w-[min(100%,calc((100svh_-_var(--header-h)_-_3rem)*0.909),600px)]">
      {/* 1. soft glow circle */}
      <Layer
        {...common}
        className="absolute left-[12%] top-[7%] aspect-square w-[64%]"
        depth={PARALLAX.glow}
        delay={ENTRANCE.glow}
      >
        <div aria-hidden="true" className="h-full w-full">
          <motion.div
            className="h-full w-full"
            animate={{ x: glowShift[0] * GLOW_SHIFT, y: glowShift[1] * GLOW_SHIFT }}
            transition={GLOW_SHIFT_SPRING}
          >
            <motion.div
              className="h-full w-full rounded-full opacity-90"
              style={{
                background:
                  "radial-gradient(circle, #E6F0FF 0%, rgba(191,219,254,0.75) 50%, rgba(230,240,255,0) 72%)",
              }}
              animate={reduce ? undefined : { scale: [1, GLOW_SCALE, 1] }}
              transition={{ duration: GLOW_DURATION, ease: "easeInOut", repeat: Infinity }}
            />
          </motion.div>
        </div>
      </Layer>

      {/* 2. saffron orbit line + travelling dot */}
      <Layer
        {...common}
        className="pointer-events-none absolute inset-0"
        depth={PARALLAX.orbit}
        delay={ENTRANCE.glow}
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${ORBIT_VIEWBOX.w} ${ORBIT_VIEWBOX.h}`}
          className="h-full w-full overflow-visible"
          fill="none"
        >
          <motion.path
            d={ORBIT_PATH}
            stroke="#F2A93B"
            strokeWidth={1.6}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: ORBIT_DRAW_DURATION, delay: ENTRANCE.robot, ease: "easeInOut" }}
          />
          {!reduce && (
            <motion.circle
              r={4.5}
              fill="#F2A93B"
              initial={{ opacity: 0, x: ORBIT_SAMPLES[0][0], y: ORBIT_SAMPLES[0][1] }}
              animate={{
                x: ORBIT_SAMPLES.map((p) => p[0]),
                y: ORBIT_SAMPLES.map((p) => p[1]),
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                x: { duration: ORBIT_DOT_DURATION, delay: ENTRANCE.robot + ORBIT_DRAW_DURATION, ease: "linear", repeat: Infinity },
                y: { duration: ORBIT_DOT_DURATION, delay: ENTRANCE.robot + ORBIT_DRAW_DURATION, ease: "linear", repeat: Infinity },
                opacity: {
                  duration: ORBIT_DOT_DURATION,
                  delay: ENTRANCE.robot + ORBIT_DRAW_DURATION,
                  times: [0, 0.08, 0.92, 1],
                  ease: "linear",
                  repeat: Infinity,
                },
              }}
            />
          )}
        </svg>
      </Layer>

      {/* 3. robot (static image). No fade, so it can paint early as the LCP element; it only settles upward. */}
      <Layer
        {...common}
        className="absolute bottom-[2%] left-[6%] w-[64%]"
        depth={PARALLAX.robot}
        delay={ENTRANCE.robot}
        fade={false}
        rise={24}
      >
        <div className="relative">
          <Image
            src="/robot-noeyes.png"
            alt="Tareeq robot assistant"
            width={1024}
            height={1536}
            priority
            sizes="(min-width: 1024px) 400px, 50vw"
            className="h-auto w-full select-none"
          />
          <RobotEyes activeCard={active} reduce={reduce} cursorX={cursorX} cursorY={cursorY} />
        </div>
      </Layer>

      {/* 4. interactive glass cards. Height is auto and they are absolutely positioned, so expanding never moves anything else. */}
      <Layer
        {...common}
        className={cardClass("prompt", "absolute left-[4%] top-[12%] w-[21%] min-w-[104px] max-sm:left-0 max-sm:top-[4%]")}
        wrapperProps={cardProps("prompt")}
        depth={PARALLAX.cards}
        delay={cardDelay(0)}
        rise={14}
      >
        <InfoCard id="prompt" active={active === "prompt"} reduce={reduce} />
      </Layer>
      <Layer
        {...common}
        className={cardClass("build", "absolute left-0 top-[48%] w-[21%] min-w-[104px] max-sm:top-[52%]")}
        wrapperProps={cardProps("build")}
        depth={PARALLAX.cards - 2}
        delay={cardDelay(1)}
        rise={14}
      >
        <InfoCard id="build" active={active === "build"} reduce={reduce} />
      </Layer>
      {/* "Learn" is hidden under 640px so it doesn't crowd the robot */}
      <Layer
        {...common}
        className={cardClass("learn", "absolute right-0 top-[17%] hidden w-[21%] min-w-[104px] sm:block")}
        wrapperProps={cardProps("learn")}
        depth={PARALLAX.cards}
        delay={cardDelay(2)}
        rise={14}
      >
        <InfoCard id="learn" active={active === "learn"} reduce={reduce} />
      </Layer>
    </div>
  );
}

export default function Hero() {
  const reduce = usePrefersReducedMotion();
  const item = (delay: number, fade = true) => ({
    initial: reduce ? false : { opacity: fade ? 0 : 1, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  });

  return (
    <div className="relative isolate overflow-hidden">
      {/* Soft Tareeq-colour glow behind the hero. Skipped under 640px (heavy SVG blur filter on phones). */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 hidden sm:block">
        <BackgroundGradientAnimation
          containerClassName="absolute inset-0 h-full w-full"
          gradientBackgroundStart="rgb(250, 247, 242)"
          gradientBackgroundEnd="rgb(230, 240, 255)"
          firstColor="30, 58, 138"
          secondColor="37, 99, 235"
          thirdColor="230, 240, 255"
          fourthColor="242, 169, 59"
          fifthColor="13, 27, 61"
          pointerColor="37, 99, 235"
          blendingValue="soft-light"
          interactive={false}
        />
        {/* fade into the Paper page background below the hero */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-paper" />
      </div>
      {/* From 1024px the section is exactly one screen below the header (--header-h) and vertically centred */}
      {/* key: remount once if reduced motion turns out to be on, so everything starts in its final state */}
      <section
        key={String(reduce)}
        aria-labelledby="hero-title"
        className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 lg:h-[calc(100svh-var(--header-h))] lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:py-6"
      >
        <div className="max-w-xl">
          <motion.p {...item(0)} className="text-sm font-semibold uppercase tracking-[0.22em] text-royal">
            Practical AI education
          </motion.p>
          {/* H1 slides but never fades, so it is visible for first paint (LCP) */}
          <motion.h1
            id="hero-title"
            {...item(0.08, false)}
            className="mt-5 font-heading text-[2.75rem] font-extrabold leading-[1.02] tracking-tight text-midnight sm:text-6xl lg:text-[clamp(2.5rem,min(6vw,10.5svh),5.5rem)]"
          >
            <span className="block">AI, the</span>{" "}
            <span className="block">
              practical way<span className="text-saffron">.</span>
            </span>
          </motion.h1>
          <motion.p {...item(0.18)} className="mt-6 max-w-[30rem] text-lg leading-relaxed text-midnight/80 sm:text-xl">
            Hands-on AI training for teachers, students and professionals. Learn to use AI thoughtfully, build real
            projects, and solve real problems.
          </motion.p>
          <motion.div {...item(0.28)} className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-midnight px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-royal"
            >
              Explore programs
              <svg aria-hidden="true" viewBox="0 0 12 20" className="h-3.5 w-2" fill="none">
                <path d="M2 2l8 8-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-full border border-midnight/70 px-7 py-3.5 text-base font-semibold text-midnight transition-colors hover:bg-midnight/5"
            >
              How it works
            </a>
          </motion.div>
          <motion.ul
            {...item(0.38)}
            className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-midnight/70 sm:gap-x-4 sm:text-sm"
          >
            <li>Hands-on learning</li>
            <li aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-saffron" />
            <li>Responsible AI</li>
            <li aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-saffron" />
            <li>Real projects</li>
          </motion.ul>
        </div>

        <HeroVisual reduce={reduce} />
      </section>
    </div>
  );
}
