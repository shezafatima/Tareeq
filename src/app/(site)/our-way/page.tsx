import type { Metadata } from "next";
import OurWayClosing from "@/components/sections/our-way/OurWayClosing";
import OurWayOpening from "@/components/sections/our-way/OurWayOpening";
import OurWayPrinciples from "@/components/sections/our-way/OurWayPrinciples";
import OurWayProblem from "@/components/sections/our-way/OurWayProblem";
import OurWayPurpose from "@/components/sections/our-way/OurWayPurpose";
import OurWaySession from "@/components/sections/our-way/OurWaySession";
import WayPathController from "@/components/sections/our-way/WayPathController";
import { getOurWay, getPageMeta } from "@/content";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPageMeta("our-way");
  const path = "/our-way";
  const image = { url: "/robot.png", width: 408, height: 612, alt: "Tareeq robot assistant" };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, type: "website", siteName: "Tareeq", url: path, images: [image] },
    twitter: { card: "summary", title, description, images: [image.url] },
  };
}

export default async function OurWayPage() {
  const content = await getOurWay();
  return (
    <div data-way-page="">
      <OurWayOpening content={content.opening} />
      <OurWayProblem content={content.problem} />
      <OurWayPrinciples content={content.principles} />
      <OurWaySession content={content.session} />
      <OurWayPurpose content={content.purpose} />
      <OurWayClosing content={content.closing} />
      <WayPathController />
    </div>
  );
}
