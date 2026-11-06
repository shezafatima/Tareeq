import Link from "next/link";
import OurWaySection from "@/components/sections/our-way/OurWaySection";
import WayHeading from "@/components/sections/our-way/WayHeading";
import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Reveal from "@/components/ui/Reveal";
import { joinHref, mentorHref } from "@/lib/site";
import type { OurWayContent } from "@/content";

export default function OurWayClosing({ content }: { content: OurWayContent["closing"] }) {
  return (
    <OurWaySection id="way-closing" labelledBy="way-closing-title" tone="midnight" side="right" position="last">
      <Reveal>
        <WayHeading id="way-closing-title">{content.heading}</WayHeading>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Button href={joinHref} size="lg" className="bg-white text-midnight hover:bg-soft focus-visible:outline-saffron">
            {content.bookLabel}
            <ChevronRight />
          </Button>
          <Link
            href={mentorHref}
            className="inline-flex min-h-11 items-center font-semibold text-white underline decoration-saffron decoration-2 underline-offset-4 hover:text-soft focus-visible:outline-saffron"
          >
            {content.mentorLabel}
          </Link>
        </div>
      </Reveal>
    </OurWaySection>
  );
}
