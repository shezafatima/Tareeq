import SectionHeading from "@/components/ui/SectionHeading";
import { getHowItWorks } from "@/content";
import HowItWorksBackdrop from "./HowItWorksBackdrop";
import VideoStepper from "./VideoStepper";

// Server component: the heading and layout. Only the player and its step cards are client code (VideoStepper).
export default async function HowItWorks() {
  const content = await getHowItWorks();
  if (content.steps.length !== 3) return null;

  return (
    <section id="how-it-works" aria-labelledby="hiw-title" className="hiw">
      <HowItWorksBackdrop />
      <div className="hiw-stage">
        <SectionHeading id="hiw-title" intro={content.intro} className="hiw-head">
          {content.heading}
        </SectionHeading>
        <VideoStepper steps={content.steps} regionLabel={`${content.heading}, ${content.steps.length} steps`} />
      </div>
    </section>
  );
}
