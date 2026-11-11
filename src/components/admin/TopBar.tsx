import type { NewCounts } from "@/lib/admin/leads-query";
import AdminNav from "./AdminNav";
import LogoutForm from "./LogoutForm";
import MobileMenu from "./MobileMenu";
import Wordmark from "./Wordmark";

/** Mobile and tablet top bar (hidden from lg up): wordmark and a button that opens the navigation drawer. */
export default function TopBar({ badges }: { badges: NewCounts | null }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-midnight px-4 lg:hidden">
      <Wordmark className="h-6" />
      <MobileMenu>
        <AdminNav badges={badges} />
        <div className="mt-auto">
          <LogoutForm />
        </div>
      </MobileMenu>
    </header>
  );
}
