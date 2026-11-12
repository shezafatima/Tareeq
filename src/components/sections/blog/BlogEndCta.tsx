import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import { joinHref } from "@/lib/site";

/** The closing call to action of every post: a workshop, or the courses (specs/033-admin-blog FR-019). */
export default function BlogEndCta() {
  return (
    <section aria-labelledby="blog-cta-heading" className="rounded-2xl bg-soft px-6 py-10 text-center sm:px-10">
      <h2 id="blog-cta-heading" className="font-heading text-2xl font-bold text-midnight">
        Want to try this with your students?
      </h2>
      <p className="mx-auto mt-2 max-w-md text-midnight/85">Join a hands-on workshop, or learn at your own pace with one of our courses.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button href={joinHref}>
          Book a workshop
          <ChevronRight />
        </Button>
        <Button href="/courses" variant="secondary">
          Explore courses
        </Button>
      </div>
    </section>
  );
}
