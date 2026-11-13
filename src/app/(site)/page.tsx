import Hero from "@/components/Hero";
import BlogPreview from "@/components/sections/BlogPreview";
import CertificateSection from "@/components/sections/CertificateSection";
import FinalCta from "@/components/sections/FinalCta";
import HeroExtras from "@/components/sections/HeroExtras";
import HowItWorks from "@/components/sections/how-it-works/HowItWorks";
import MentorSection from "@/components/sections/MentorSection";
import ProgramsPreview from "@/components/sections/ProgramsPreview";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import WhoItsFor from "@/components/sections/WhoItsFor";
import WhyTareeq from "@/components/sections/WhyTareeq";

// Static, refreshed hourly and by tag because the Programs, Blog and Certificate sections read the database (specs/015-programs-pages/research.md R2).
export const revalidate = 3600;

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
      <TestimonialsSection />
      <BlogPreview />
      <CertificateSection />
      <FinalCta />
    </>
  );
}
