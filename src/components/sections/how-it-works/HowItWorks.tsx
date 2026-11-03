import RobotFigure from "@/components/RobotFigure";
import SectionHeading from "@/components/ui/SectionHeading";
import { getHomeCopy, getSteps } from "@/content";
import CarouselCard from "./CarouselCard";
import StepCarousel from "./StepCarousel";
import TravelStage from "./TravelStage";
import TravellingRobot from "./TravellingRobot";

// Server component. The three steps are complete in the HTML in every layout; the layout itself (list, travel or
// swipe) is chosen by CSS before the first paint (globals.css, feature 005). The client parts only add motion.
export default async function HowItWorks() {
  const [steps, copy] = await Promise.all([getSteps(), getHomeCopy()]);
  if (steps.length === 0) return null;

  return (
    <section id="how-it-works" aria-labelledby="hiw-title" className="hiw">
      <TravelStage>
        <div className="hiw-robot-col">
          <div className="hiw-robot-slot">
            <TravellingRobot />
          </div>
          <RobotFigure eyes="painted" className="hiw-robot-static" />
        </div>
        <div className="hiw-content-col">
          <SectionHeading id="hiw-title" intro={copy.howItWorks.intro}>
            {copy.howItWorks.heading}
          </SectionHeading>
          <StepCarousel labels={steps.map((s) => s.label)} regionLabel={`${copy.howItWorks.heading}, ${steps.length} steps`}>
            {steps.map((s) => (
              <CarouselCard key={s.id} step={s} />
            ))}
          </StepCarousel>
        </div>
      </TravelStage>
    </section>
  );
}
