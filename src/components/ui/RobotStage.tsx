import Image from "next/image";
import BreathingRobot from "./BreathingRobot";

type RobotStageProps = {
  image: { readonly src: string; readonly width: number; readonly height: number; readonly alt: string };
};

/**
 * The Tareeq robot standing on a light blue card with a tilted saffron card behind it, breathing (contracts/robot-stage.md).
 * One piece for every section that shows it, so they cannot drift apart. It has no side of its own: the section's
 * layout decides which column it sits in. Server component; only the breathing is client code. Never mirrored.
 */
export default function RobotStage({ image }: RobotStageProps) {
  return (
    <BreathingRobot>
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes="(min-width: 1024px) 340px, 200px"
        className="h-auto w-full select-none"
      />
    </BreathingRobot>
  );
}
