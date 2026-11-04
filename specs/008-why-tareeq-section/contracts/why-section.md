# Contract: "Why Tareeq" Section

**Module**: `src/components/sections/WhyTareeq.tsx` (Server Component, rewritten). No client code of its own; the only client part is the shared breathing leaf inside `RobotStage`.

## Markup and order

```text
section#why (aria-labelledby="why-title", tone: white)
  div.why-stage                          (CSS grid)
    div.why-head      h2#why-title "Why Tareeq" + the one-line intro
    div.why-robot     <RobotStage/> + saffron accents near the robot
    article.why-card  (navy, white text)
      ol
        li x4         number (aria-hidden) · icon tile (aria-hidden) · h3 title · p sentence
      saffron accents at the card's outer corners (aria-hidden)
```

DOM order is heading, robot, card (the same as "How it works", so phones read the two sections alike).

## Layout

| Width | Layout |
|---|---|
| under 1024px | stacked: heading, robot (centred, about 200px wide), navy card |
| 1024px and up | two columns: the robot on the left (about 0.8fr), vertically centred; the heading and the navy card on the right (about 1.2fr) |

## The navy card

| Part | Style |
|---|---|
| Card | midnight background, white text, the site's card radius, padding `p-6` (`sm:p-8`) |
| Number | saffron, heading font, `aria-hidden` (the list already announces its position) |
| Icon tile | translucent white tile with a saffron icon, `IconTile` tone `onDark`, `aria-hidden` |
| Title | `h3`, white, heading font |
| Sentence | white at about 85% opacity, comfortable line height |

Contrast (measured by the check from computed colours): every text at least 4.5:1 (white about 16:1, saffron about 8.7:1, white at 85% about 12:1).

## Saffron decorative vectors

| Motif | Where | Size |
|---|---|---|
| Sparkle (four-point star) | the card's top-right outer corner; a small one near the robot's head | 32 to 56px |
| Dot grid (3 × 3) | the card's bottom-left outer corner | about 48px |
| Wavy line | low on the left of the robot area | about 72px wide |

All inline SVG in `currentColor` (the saffron token), `aria-hidden`, `pointer-events: none`, static. They sit outside the card's text area and never overlap any text box (checked by comparing bounding boxes). Smaller on phones; clipped by the section's `overflow-x: clip` so they cannot cause sideways scrolling.

## Page order and the scroll cue

`page.tsx`: Hero, HeroExtras, ProgramsPreview, WhyTareeq, HowItWorks, WhoItsFor, FinalCta. The cue in `HeroExtras.tsx` links to `#programs`; `ProgramsPreview`'s section has `id="programs"`.
