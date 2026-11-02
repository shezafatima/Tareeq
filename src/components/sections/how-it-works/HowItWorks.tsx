import Section from "@/components/sections/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import { getHomeCopy, getSteps } from "@/content";
import HowItWorksStage from "./HowItWorksStage";
import StepCard from "./StepCard";

// Server component. The steps are complete in the HTML; HowItWorksStage only adds motion around them.
export default async function HowItWorks() {
  const [steps, copy] = await Promise.all([getSteps(), getHomeCopy()]);
  if (steps.length === 0) return null;

  return (
    <Section id="how-it-works" labelledBy="hiw-title" tone="soft">
      <SectionHeading id="hiw-title" intro={copy.howItWorks.intro}>
        {copy.howItWorks.heading}
      </SectionHeading>
      <HowItWorksStage>
        <ol className="relative z-10 grid pt-12 gap-12 lg:grid-cols-3 lg:gap-x-8">
          {steps.map((s, i) => (
            <li key={s.id} className="hiw-step relative" style={{ "--i": i } as React.CSSProperties}>
              <span
                aria-hidden="true"
                className="hiw-glow pointer-events-none absolute -top-9 left-[63px] -ml-28 lg:left-1/2 h-36 w-56"
              />
              <StepCard id={s.id} label={s.label} index={i} />
              <div className="hiw-text mt-6 max-w-xs lg:mx-auto lg:text-center">
                <h3 className="font-heading text-xl font-bold text-midnight">{s.heading}</h3>
                <p className="mt-2 text-base leading-relaxed text-midnight/80">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <span
          aria-hidden="true"
          className="hiw-line pointer-events-none absolute left-[calc((100%-4rem)/6+63px)] right-[calc((100%-4rem)/6+63px)] top-[calc(3rem+2.3rem)] z-0 hidden h-px origin-left bg-saffron lg:block"
        />
      </HowItWorksStage>
    </Section>
  );
}
