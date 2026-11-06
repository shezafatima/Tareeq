import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Container from "@/components/ui/Container";

export default function ProgramNotFound() {
  return (
    <Container className="py-section lg:py-20">
      <h1 className="font-heading text-3xl font-bold text-midnight lg:text-5xl">We couldn&apos;t find that program</h1>
      <p className="mt-4 max-w-2xl text-lg text-midnight/85">It may have moved or finished. Our current programs are all in one place.</p>
      <div className="mt-8">
        <Button href="/programs">
          See all programs
          <ChevronRight />
        </Button>
      </div>
    </Container>
  );
}
