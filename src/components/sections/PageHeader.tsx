import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

type PageHeaderProps = {
  eyebrow?: string;
  intro?: string;
  children: React.ReactNode;
};

/** Top of an inner page. Renders the page's only h1. */
export default function PageHeader({ eyebrow, intro, children }: PageHeaderProps) {
  return (
    <Container as="header" className="pb-8 pt-12 lg:pb-12 lg:pt-20">
      <SectionHeading as="h1" enter eyebrow={eyebrow} intro={intro}>
        {children}
      </SectionHeading>
    </Container>
  );
}
