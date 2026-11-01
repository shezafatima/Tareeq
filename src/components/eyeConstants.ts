// Eye constants shared by the hero's eyes (RobotEyes.tsx) and the brand preloader's eyes.
// A plain module (no "use client"), so importing it does not pull the hero's eye component into other pages.
// Percentages are of the visor's own size; they apply to any visor, whichever image it is measured from.

export const VISOR_RADIUS = 44.4; // % of visor height, corner radius
export const CLIP_INSET = 4; // % of visor size, clip sits this far inside the real edge
export const EYE_COLOR = "#5CC8FF";
export const EYE_W = 9.5;
export const EYE_H = 22;
export const EYE_GAP = 22; // between the two eyes
export const EYE_CY = 50; // % of visor height, vertical centre of the pair
export const ARC_W = 17; // happy arc width
export const ARC_STROKE = 3.8;
export const GLOW_BLUR = 1.2; // static glow blur (std deviation)
export const MORPH_DURATION = 0.2; // s
