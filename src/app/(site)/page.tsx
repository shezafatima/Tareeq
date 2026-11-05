import Hero from "@/components/Hero";
import FinalCta from "@/components/sections/FinalCta";
import HeroExtras from "@/components/sections/HeroExtras";
import HowItWorks from "@/components/sections/how-it-works/HowItWorks";
import MentorSection from "@/components/sections/MentorSection";
import ProgramsPreview from "@/components/sections/ProgramsPreview";
import WhoItsFor from "@/components/sections/WhoItsFor";
import WhyTareeq from "@/components/sections/WhyTareeq";

export default function Home() {
  return (
    <>
      <Hero />
      <HeroExtras />
      <ProgramsPreview />
      <WhyTareeq />
      <HowItWorks />
      <WhoItsFor />
      <MentorSection />
      <FinalCta />
    </>
  );
}
