import AnnouncementBar from "@/components/layout/AnnouncementBar";
import AnnouncementScript from "@/components/layout/AnnouncementScript";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Preloader from "@/components/layout/preloader/Preloader";
import PreloaderScript from "@/components/layout/preloader/PreloaderScript";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import RevealController from "@/components/ui/RevealController";
import { getAnnouncement } from "@/lib/announcement/data";
import { hasPublishedPostsSafe } from "@/lib/blog/data";
import { navItemsFor } from "@/lib/site";

// Blog is in the navigation only while a post is published (specs/033-admin-blog research R17): one cached read, passed down.
// A failed read just hides the link. The gallery is reached from the Workshop page, not the navigation.
//
// The announcement bar (specs/034-pricing-certificate-announcement research R9–R11) is part of the page, above the header, so
// pages stay static. data-announce gives the bar's height to CSS (--announce-h); the inline script before it hides a dismissed
// or out-of-window bar before first paint. /admin has its own layout, so the bar never appears there.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [blog, announcement] = await Promise.all([hasPublishedPostsSafe(), getAnnouncement()]);
  const items = navItemsFor({ blog });
  return (
    <div className="flex min-h-svh flex-col" data-announce={announcement ? (announcement.compact ? "compact" : "on") : undefined}>
      <PreloaderScript />
      <Preloader />
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-gutter focus:top-3 focus:z-50 focus:rounded-control focus:bg-midnight focus:px-4 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>
      {announcement ? (
        <>
          <AnnouncementScript view={announcement} />
          <AnnouncementBar view={announcement} />
        </>
      ) : null}
      <Header items={items} />
      <main id="content" className="flex-1">
        {children}
      </main>
      <Footer items={items} />
      <WhatsAppButton />
      <RevealController />
    </div>
  );
}
