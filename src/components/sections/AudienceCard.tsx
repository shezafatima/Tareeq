import Link from "next/link";
import { Briefcase, ChalkboardTeacher, GraduationCap, Laptop, Student } from "@phosphor-icons/react/dist/ssr";
import ChevronRight from "@/components/ui/ChevronRight";
import type { Audience } from "@/content";

type AudienceCardProps = {
  audience: Audience;
  /** resolved by the section: an internal path or a WhatsApp link */
  href: string;
  external?: boolean;
};

// Presentation only: which icon goes with which audience. An unknown id (for example one added later in the admin) gets Student.
const icons: Record<string, typeof Student> = {
  teachers: ChalkboardTeacher,
  "school-students": Student,
  "college-students": GraduationCap,
  "online-learners": Laptop,
  "corporate-teams": Briefcase,
};

/**
 * One audience on the home page. Server component; the whole card is the link. Tint and icon motion are CSS
 * (`.aud-*` in globals.css, keyed by data-audience). See specs/010-audiences-section/contracts/audience-card.md.
 */
export default function AudienceCard({ audience, href, external = false }: AudienceCardProps) {
  const Glyph = icons[audience.id] ?? Student;
  const className =
    "aud-card lift group flex items-center gap-4 rounded-card border border-royal/10 p-4 text-midnight sm:flex-col sm:items-start sm:gap-5 sm:p-5";
  const body = (
    <>
      <span aria-hidden="true" className="aud-tile">
        <span className="aud-icon">
          <Glyph size={30} weight="duotone" aria-hidden="true" />
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-heading text-lg font-bold leading-snug text-midnight">{audience.name}</h3>
        <p className="mt-1.5 text-base leading-snug text-midnight/85">{audience.benefit}</p>
        <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-royal">
          {audience.cta.label}
          <ChevronRight />
        </span>
      </span>
    </>
  );

  return (
    <div className="aud-item" data-audience={audience.id}>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" data-audience={audience.id} className={className}>
          {body}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <Link href={href} data-audience={audience.id} className={className}>
          {body}
        </Link>
      )}
      <span aria-hidden="true" className="aud-back" />
    </div>
  );
}
