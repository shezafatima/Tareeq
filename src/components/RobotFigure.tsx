import Image from "next/image";
import { cn } from "@/lib/utils";
import RobotFigureLive, { type RobotFigureLiveProps } from "./RobotFigureLive";

// The Tareeq robot, in one place. The image files, alt text, sizes and `sizes` are fixed here and never passed in.
// It is never mirrored: there is no flip option (the chest chevron is a brand mark).
// The hero keeps its own robot code (signed off); the live variant uses the same file and `sizes` as the hero, so
// the browser reuses the hero's download.

type CommonProps = { className?: string; priority?: boolean };

type RobotFigureProps =
  | (CommonProps & { eyes: "painted" })
  | (CommonProps & { eyes?: "live" } & Omit<RobotFigureLiveProps, "className" | "priority">);

/** The robot with its eyes drawn in: fully static, no script (phones, reduced motion, no JavaScript). */
function PaintedRobot({ className, priority }: CommonProps) {
  return (
    <Image
      src="/robot.png"
      alt="Tareeq robot assistant"
      width={408}
      height={612}
      priority={priority}
      sizes="(min-width: 1024px) 300px, 45vw"
      className={cn("h-auto w-full select-none", className)}
    />
  );
}

export default function RobotFigure(props: RobotFigureProps) {
  if (props.eyes === "painted") return <PaintedRobot className={props.className} priority={props.priority} />;
  const { eyes: _eyes, ...live } = props;
  void _eyes;
  return <RobotFigureLive {...live} />;
}
