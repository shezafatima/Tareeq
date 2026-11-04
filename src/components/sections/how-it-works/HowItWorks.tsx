import Reveal from "@/components/ui/Reveal";
import RobotStage from "@/components/ui/RobotStage";
import SectionHeading from "@/components/ui/SectionHeading";
import { getHowItWorks } from "@/content";
import { robotImage } from "@/content/robot-image";
import CarouselCard from "./CarouselCard";
import StepCarousel from "./StepCarousel";

// Server component. The three steps are complete in the HTML in every mode; the layout (two columns from 1024px,
// stacked below) and the carousel look are chosen by CSS before the first paint (globals.css). The client parts only
// add the carousel's behaviour and the robot's breathing. DOM order: heading, robot, carousel.
export default async function HowItWorks() {
  const content = await getHowItWorks();
  if (content.steps.length === 0) return null;

  return (
    <section id="how-it-works" aria-labelledby="hiw-title" className="hiw">
      <div className="hiw-stage">
        <div className="hiw-head">
          <SectionHeading id="hiw-title" intro={content.intro}>
            {content.heading}
          </SectionHeading>
        </div>
        <div className="hiw-robot">
          <RobotStage image={robotImage} />
        </div>
        {/* the carousel fades and rises in as it enters the screen (the site's reveal; reduced motion skips it) */}
        <Reveal className="hiw-carousel">
          <StepCarousel labels={content.steps.map((s) => s.name)} regionLabel={`${content.heading}, ${content.steps.length} steps`}>
            {content.steps.map((s) => (
              <CarouselCard key={s.id} step={s} />
            ))}
          </StepCarousel>
        </Reveal>
      </div>
    </section>
  );
}
