import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getHowItWorks } from "@/content";
import BreathingRobot from "./BreathingRobot";
import CarouselCard from "./CarouselCard";
import StepCarousel from "./StepCarousel";
import TravelStage from "./TravelStage";

// Server component. The three steps are complete in the HTML in every mode; the layout (two columns from 1024px,
// stacked below) and the behaviour mode (list, travel, phone or still) are chosen by CSS before the first paint
// (globals.css, feature 007). The client parts only add motion. DOM order: heading, robot, carousel.
export default async function HowItWorks() {
  const content = await getHowItWorks();
  if (content.steps.length === 0) return null;
  const { image } = content;

  return (
    <section id="how-it-works" aria-labelledby="hiw-title" className="hiw">
      <TravelStage>
        <div className="hiw-head">
          <SectionHeading id="hiw-title" intro={content.intro}>
            {content.heading}
          </SectionHeading>
        </div>
        <div className="hiw-robot">
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
        </div>
        {/* under 768px the carousel fades and rises in as it enters the screen (the site's reveal); from 768px the
            cards come from the hero instead, and the CSS switches this entrance off */}
        <Reveal className="hiw-carousel">
          <StepCarousel labels={content.steps.map((s) => s.name)} regionLabel={`${content.heading}, ${content.steps.length} steps`}>
            {content.steps.map((s) => (
              <CarouselCard key={s.id} step={s} />
            ))}
          </StepCarousel>
        </Reveal>
      </TravelStage>
    </section>
  );
}
