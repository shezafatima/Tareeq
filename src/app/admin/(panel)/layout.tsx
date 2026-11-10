import Sidebar from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/Toast";
import TopBar from "@/components/admin/TopBar";
import { requireAdmin } from "@/lib/admin/session";

// The signed-in shell. requireAdmin() here is one of several checks: every page and every action checks again,
// because a layout does not re-run when the owner moves between pages.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <ToastProvider>
      <div className="min-h-svh lg:pl-64">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-xl focus:bg-midnight focus:px-4 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>
        <Sidebar />
        <TopBar />
        <main id="content" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
