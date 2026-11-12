import { Images } from "@phosphor-icons/react/dist/ssr";
import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import { joinHref } from "@/lib/site";

/** Shown on /gallery while no album is public yet. */
export default function GalleryEmpty() {
  return (
    <div className="rounded-2xl bg-soft px-6 py-12 text-center sm:px-10">
      <Images size={44} weight="duotone" className="mx-auto text-royal" aria-hidden="true" />
      <h2 className="mt-4 font-heading text-2xl font-bold text-midnight">Photos coming after our first workshop</h2>
      <p className="mx-auto mt-2 max-w-md text-midnight/85">{"We'll share pictures here once our first workshop has run."}</p>
      <div className="mt-6">
        <Button href={joinHref}>
          Book a workshop
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
