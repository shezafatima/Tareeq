import Section from "@/components/sections/Section";
import WayNode from "@/components/sections/our-way/WayNode";
import WayTrack from "@/components/sections/our-way/WayTrack";
import { cn } from "@/lib/utils";
import type { WaySide } from "@/lib/our-way/path";

type OurWaySectionProps = {
  id: string;
  labelledBy: string;
  tone: "paper" | "midnight";
  /** the side the path runs on from 1024px; content keeps clear of it */
  side: WaySide;
  position?: "first" | "middle" | "last";
  children: React.ReactNode;
};

/** One band of the Our Way page, with its piece of the path and its marker. */
export default function OurWaySection({ id, labelledBy, tone, side, position = "middle", children }: OurWaySectionProps) {
  return (
    <Section
      id={id}
      labelledBy={labelledBy}
      tone={tone}
      className={cn("way-section", `way-section--${tone}`, `way-section--${side}`, `way-section--${position}`)}
    >
      <WayTrack side={side} last={position === "last"} />
      <WayNode />
      <div className="way-body">{children}</div>
    </Section>
  );
}
