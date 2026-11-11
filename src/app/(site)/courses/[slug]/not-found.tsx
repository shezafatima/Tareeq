import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Container from "@/components/ui/Container";

export default function CourseNotFound() {
  return (
    <Container className="py-section lg:py-20">
      <h1 className="font-heading text-3xl font-bold text-midnight lg:text-5xl">We couldn&apos;t find that course</h1>
      <p className="mt-4 max-w-2xl text-lg text-midnight/85">It may have moved or finished. Our current courses are all in one place.</p>
      <div className="mt-8">
        <Button href="/courses">
          See all courses
          <ChevronRight />
        </Button>
      </div>
    </Container>
  );
}
