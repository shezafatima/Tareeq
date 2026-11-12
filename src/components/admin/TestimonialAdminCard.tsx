import { PencilSimple } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { setTestimonialPublished } from "@/lib/admin/testimonials-actions";
import type { AdminTestimonial } from "@/lib/admin/testimonials-read";
import PublishedToggle from "./PublishedToggle";
import StatusChip from "./StatusChip";

/** One testimonial in the admin grid: tall thumbnail, who and what they said, consent badge, instant published switch and an edit link. */
export default function TestimonialAdminCard({ item }: { item: AdminTestimonial }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-soft shadow-sm ring-1 ring-midnight/10">
      <div className="relative aspect-[9/16] w-full bg-midnight/10">
        <Image
          src={`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`}
          alt=""
          fill
          unoptimized
          sizes="(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 46vw"
          className="object-cover"
        />
        <StatusChip
          label={item.consent ? "Consent given" : "No consent"}
          tone={item.consent ? "royal" : "grey"}
          className="absolute left-2 top-2"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h2 className="font-heading text-base font-bold text-midnight">{item.name}</h2>
        <p className="text-xs font-semibold text-midnight/80">
          {item.role}
          {item.organization ? ` · ${item.organization}` : ""}
        </p>
        <p className="line-clamp-3 text-sm text-midnight/80">{item.quote}</p>
        <p className="text-xs text-midnight/70">order {item.order}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <PublishedToggle
            id={item.id}
            title={item.name}
            published={item.published}
            action={setTestimonialPublished}
            lockedReason={item.consent ? undefined : "Tick consent on the edit page before publishing."}
          />
          <Link
            href={`/admin/testimonials/${item.id}/edit`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-midnight/70 bg-white px-4 text-sm font-semibold text-midnight hover:bg-midnight/5"
          >
            <PencilSimple weight="duotone" size={18} aria-hidden="true" />
            Edit
            <span className="sr-only"> {item.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
