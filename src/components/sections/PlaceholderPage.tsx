import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

type PlaceholderPageProps = {
  title: string;
  intro?: string;
  /** extra content under the heading (for example a call to action) */
  children?: React.ReactNode;
};

export default function PlaceholderPage({ title, intro = "This page is coming soon. We're still putting it together.", children }: PlaceholderPageProps) {
  return (
    <Container className="py-section lg:min-h-[60svh]">
      <SectionHeading as="h1" intro={intro}>
        {title}
      </SectionHeading>
      {children}
    </Container>
  );
}
