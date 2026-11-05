import type { ResolvedTestimonial } from "@/content";

/** One 4:5 testimonial card: the video slot (children) fills it, a glass caption (quote, name, role, organization) sits over the bottom. Server component. */
export default function TestimonialCard({ item, children }: { item: ResolvedTestimonial; children: React.ReactNode }) {
  const org = item.organization?.trim();
  return (
    <li>
      <figure className="glass-card relative aspect-[4/5] overflow-hidden">
        {children}
        <div className="glass-blur absolute inset-x-2 bottom-2 z-10 flex flex-col gap-2 rounded-xl bg-white/90 p-3">
          {item.isPlaceholder && (
            <span className="self-start rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-royal">Placeholder</span>
          )}
          <blockquote className="line-clamp-2 text-sm leading-snug text-midnight/90">“{item.quote}”</blockquote>
          <figcaption>
            <span className="block font-heading text-sm font-semibold text-midnight [overflow-wrap:anywhere]">{item.name}</span>
            <span className="block text-xs text-midnight/75 [overflow-wrap:anywhere]">
              {item.role}
              {org ? ` · ${org}` : ""}
            </span>
          </figcaption>
        </div>
      </figure>
    </li>
  );
}
