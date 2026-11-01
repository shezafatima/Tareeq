import { useId } from "react";
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
  VISOR_RADIUS,
} from "@/components/eyeConstants";
import { HEAD_IMG_H, HEAD_IMG_W, VISOR_ANGLE, VISOR_CX, VISOR_CY, VISOR_H, VISOR_W } from "./visor";

// Same geometry as RobotEyes.tsx, applied to the head image's visor. Everything is in image pixels
// (the SVG covers the whole image), so it stays aligned with the visor at every screen size.
const vw = (VISOR_W / 100) * HEAD_IMG_W;
const vh = (VISOR_H / 100) * HEAD_IMG_H;
const cx0 = (VISOR_CX / 100) * HEAD_IMG_W;
const cy0 = (VISOR_CY / 100) * HEAD_IMG_H;
const pw = (pct: number) => (pct / 100) * vw; // % of visor width -> px
const eyeW = pw(EYE_W);
const eyeH = pw(EYE_H);
const eyeSpacing = eyeW + pw(EYE_GAP); // centre to centre
const eyeCy = (EYE_CY / 100 - 0.5) * vh; // from visor centre
const radius = (VISOR_RADIUS / 100) * vh;
const inset = (CLIP_INSET / 100) * vh;
const clipW = vw * (1 - (2 * CLIP_INSET) / 100);
const clipH = vh * (1 - (2 * CLIP_INSET) / 100);
const clipR = Math.max(0, radius - inset);
const arcHalf = pw(ARC_W) / 2;
const ARC_PATH = `M ${-arcHalf} ${arcHalf * 0.35} C ${-arcHalf * 0.8} ${-arcHalf * 0.8}, ${arcHalf * 0.8} ${-arcHalf * 0.8}, ${arcHalf} ${arcHalf * 0.35}`;
const placement = `translate(${cx0} ${cy0}) rotate(${VISOR_ANGLE})`;
const LOOK_TRAVEL = 11; // % of visor width the eyes move sideways when they look around (the hero's own limit is 18)

export default function PreloaderEyes() {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      data-part="eyes"
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${HEAD_IMG_W} ${HEAD_IMG_H}`}
      className="absolute inset-0 h-full w-full"
      style={{ "--pl-look": `${pw(LOOK_TRAVEL)}px` } as React.CSSProperties}
    >
      <defs>
        {/* the clip is the visor rectangle, inset inside its real edge, rotated like the visor */}
        <clipPath id={`${id}-clip`}>
          <rect x={-clipW / 2} y={-clipH / 2} width={clipW} height={clipH} rx={clipR} ry={clipR} transform={placement} />
        </clipPath>
        {/* static glow (not animated), clipped with the eyes */}
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={pw(GLOW_BLUR)} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <g transform={placement}>
          {/* the "curious" look-around moves this group sideways (see preloader.css) */}
          <g className="pl-gaze">
          <g filter={`url(#${id}-glow)`} fill={EYE_COLOR} stroke="none">
            {[-1, 1].map((side) => (
              <g key={side} className={side < 0 ? "pl-eye-l" : "pl-eye-r"} transform={`translate(${(side * eyeSpacing) / 2} ${eyeCy})`}>
                {/* open pill */}
                <rect className="pl-eye-open" x={-eyeW / 2} y={-eyeH / 2} width={eyeW} height={eyeH} rx={eyeW / 2} />
                {/* happy arc */}
                <path
                  className="pl-eye-happy"
                  d={ARC_PATH}
                  fill="none"
                  stroke={EYE_COLOR}
                  strokeWidth={pw(ARC_STROKE)}
                  strokeLinecap="round"
                />
              </g>
            ))}
          </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
