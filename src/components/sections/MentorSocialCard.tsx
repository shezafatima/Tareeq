import BrandIcon from "@/components/ui/BrandIcon";
import type { MentorSocial } from "@/content";

// Presentation only: official glyph colour per platform id (tokens in globals.css).
const colors: Record<string, string> = {
  youtube: "text-[var(--color-youtube)]",
  linkedin: "text-[var(--color-linkedin)]",
  instagram: "text-[var(--color-instagram)]",
};

/** One public profile as a compact link card. Server component. Opens in a new tab; the caller skips socials without a url. */
export default function MentorSocialCard({ social }: { social: MentorSocial & { url: string } }) {
  return (
    <a
      href={social.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Sheza Fatima on ${social.platform}${social.followers ? `, ${social.followers}` : ""}`}
      className="mentor-social lift flex min-h-14 items-center gap-3 rounded-card border border-royal/10 bg-white px-3.5 py-2.5 text-midnight"
    >
      <BrandIcon id={social.id} size={26} className={`shrink-0 ${colors[social.id] ?? ""}`} />
      <span className="flex min-w-0 flex-col">
        <span className="font-heading text-base font-semibold leading-tight">{social.platform}</span>
        <span className="break-words text-sm leading-snug text-midnight/80">{social.handle}</span>
        {social.followers && <span className="text-xs leading-snug text-midnight/70">{social.followers}</span>}
      </span>
    </a>
  );
}
