# Contract: RobotStage (the robot on its cards, breathing)

**Modules**: `src/components/ui/RobotStage.tsx` (Server Component) and `src/components/ui/BreathingRobot.tsx` (client leaf, moved from 007's `how-it-works/` folder). Used by "How it works" and "Why Tareeq".

```tsx
<RobotStage image={robotImage} />   // image from src/content/robot-image.ts
```

## Markup

```text
div.robot-stage                      (aspect ratio 10:14; isolates its layers)
  div.robot-shape.robot-shape-saffron  (aria-hidden; tilted -4deg; behind and lower)
  div.robot-shape.robot-shape-blue     (aria-hidden; straight; in front of the saffron one)
  div.robot-figure                     (feet 3% below the blue card's bottom edge)
    div.robot-breath                   (the breathing layer: width 90% of the stage)
      <Image>                          (next/image, lazy, explicit 408 x 612, sizes set, description)
```

The stage fills whatever grid cell its section gives it; it has no side of its own, so the same piece sits in the same cell position in both sections.

## Behaviour (unchanged from 007)

| Part | Rule |
|---|---|
| Breathing | a loop of about 4 s: scale 1 → 1.02 → 1 and 0 → -5px → 0 vertical lift, `transform-origin` at the feet (50% 100%), ease in and out |
| Cards | the two cards pulse 1 → 1.03 → 1 in the same 4 s loop |
| Running | only while the stage is at least 10% on screen (`useInView`) and not under reduced motion; otherwise everything returns to rest in 0.4 s |
| Geometry | the robot is larger than the blue card: its feet touch the card's bottom edge and its head rises out of the top; the saffron card is behind and lower so it shows below the blue one like a shadow |
| Colours | saffron token; the light blue is a mix of the sky token and white (no new colour) |
| Accessibility | the cards are `aria-hidden`; the image carries the description; nothing is focusable |
| Animation limits | only `transform` and `opacity` |

## Guarantees

- One definition: changing the stage changes both sections.
- No layout shift: the stage's height comes from its aspect ratio before the image loads.
- The image is requested once per page (both sections use the same URL and sizes).
