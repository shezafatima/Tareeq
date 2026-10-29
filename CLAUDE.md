# Tareeq robot test page

React Three Fiber test of the hero robot for the Tareeq website (Next.js later). Plain JSX, Vite.

## Files
- src/Robot.jsx: loads /tareeq-robot.glb, plays the wave, builds eyes + chevron in code, head/eye cursor tracking
- src/RobotCanvas.jsx: Canvas, camera, lights
- src/RobotHero.jsx: lazy-loads the canvas, poster fallbacks, pointer listener
- public/tareeq-robot.glb: rigged Mixamo model (46 bones, 1 clip "mixamo.com", 4.7 s wave). Do NOT edit or regenerate it.
- public/robot-poster.png: static fallback image

## Brand
Midnight #0D1B3D, Royal Blue #1E3A8A, Saffron #F2A93B, Paper #FAF7F2. Calm and premium, no generic "AI" look.

## Things that are easy to break
- three.js strips ":" from bone names: mixamorig:Head becomes mixamorigHead. Look up bones both ways.
- Eyes and chevron are attached to the Head and Spine2 bones through makeAnchor(), positioned by raycasting the rest pose. Tune VISOR_Y / CHEST_Y, not raw coordinates.
- Head tracking is applied after the animation mixer in useFrame. Keep the "restore base quaternion" logic or the head turn accumulates.
- The model is meshopt-compressed. drei's useGLTF decodes it by default.
- Fallback to the poster for: reduced motion, no WebGL, width under 640 px, low CPU, load error. ?force3d=1 and ?fallback=1 override. Keep this working.
- Robot is 1 m tall with feet at y=0.

## Rules
- Keep changes small and in the existing files.
- After any change that affects how the robot looks, tell me to regenerate public/robot-poster.png.
- Verify with `npm run build` and fix any errors before finishing.
- Never add paid services or new heavy dependencies without asking.