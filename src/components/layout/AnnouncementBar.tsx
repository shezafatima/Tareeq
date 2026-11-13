import Link from "next/link";
import Container from "@/components/ui/Container";
import type { AnnouncementView } from "@/lib/announcement/rules";
import AnnouncementDismiss from "./AnnouncementDismiss";

type AnnouncementBarProps = {
  view: AnnouncementView;
  /** the admin preview: always the phone layout, whatever the screen, so the owner sees the tightest case */
  phone?: boolean;
};

/**
 * The slim bar above the header on every public page (specs/034-pricing-certificate-announcement FR-019..FR-024).
 * Server-rendered into the page. Its height is the --announce-h variable (globals.css), which the hero reads; the pre-paint
 * script hides it (data-announce="off" on <html>) when dismissed or outside its date window. Text clamps to 2 lines on phones.
 */
export default function AnnouncementBar({ view, phone = false }: AnnouncementBarProps) {
  const clamp = view.compact ? "line-clamp-1" : phone ? "line-clamp-2" : "line-clamp-2 lg:line-clamp-1";
  const size = phone ? "text-[0.8125rem] leading-5" : "text-[0.8125rem] leading-5 lg:text-sm";

  const message = (
    <span className={`${clamp} ${size} min-w-0 text-center`}>
      {view.text}
      {view.link ? <span className="ml-1 font-semibold underline underline-offset-2">{view.link.label} →</span> : null}
    </span>
  );

  return (
    <div role="region" aria-label="Announcement" data-style={view.style} className="announcement-bar">
      <Container className="flex h-full items-center justify-center gap-2">
        {view.link ? (
          view.link.external ? (
            <a href={view.link.href} className="announcement-link flex min-h-11 min-w-0 items-center">
              {message}
            </a>
          ) : (
            <Link href={view.link.href} className="announcement-link flex min-h-11 min-w-0 items-center">
              {message}
            </Link>
          )
        ) : (
          <p className="flex min-h-11 min-w-0 items-center">{message}</p>
        )}
        {view.dismissible ? <AnnouncementDismiss version={view.version} /> : null}
      </Container>
    </div>
  );
}
