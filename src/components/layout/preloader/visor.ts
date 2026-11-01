// Visor of public/robot-head.png (241 x 195 px).
// Measured with the same method that reproduces the hero's constants in RobotEyes.tsx: the dark visor region
// (holes from the glossy highlight filled), centre from image moments, rotated extents for width and height.
// Check on the hero image: method gives centre 62.26 / 16.83, angle 9.86, size 34.9 x 17.0,
// against the hero's 62.32 / 16.96, 9.87, 34.76 x 16.9.
export const HEAD_IMG_W = 241; // px
export const HEAD_IMG_H = 195; // px
export const VISOR_CX = 50.22; // % of image width, visor centre
export const VISOR_CY = 57.74; // % of image height
export const VISOR_ANGLE = 0; // deg, clockwise on screen (measured -0.17: the head is level)
export const VISOR_W = 69.32; // % of image width, along the visor's own x axis
export const VISOR_H = 62.11; // % of image height, along the visor's own y axis
