import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Preloader from "@/components/layout/preloader/Preloader";
import PreloaderScript from "@/components/layout/preloader/PreloaderScript";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import RevealController from "@/components/ui/RevealController";
import { hasPublishedPostsSafe } from "@/lib/blog/data";
import { navItemsFor } from "@/lib/site";

// Blog is in the navigation only while a post is published (specs/033-admin-blog research R17): one cached read, passed down.
// A failed read just hides the link. The gallery is reached from the Workshop page, not the navigation.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const items = navItemsFor({ blog: await hasPublishedPostsSafe() });
  return (
    <div className="flex min-h-svh flex-col">
      <PreloaderScript />
      <Preloader />
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-gutter focus:top-3 focus:z-50 focus:rounded-control focus:bg-midnight focus:px-4 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>
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
