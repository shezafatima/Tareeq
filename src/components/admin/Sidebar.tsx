import AdminNav from "./AdminNav";
import LogoutForm from "./LogoutForm";
import Wordmark from "./Wordmark";

/** Desktop navigation: a navy glass column fixed to the left edge (hidden below lg, where TopBar takes over). */
export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-8 border-r border-white/10 bg-midnight/95 p-4 backdrop-blur-xl lg:flex">
      <div className="px-2 pt-2">
        <Wordmark />
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <AdminNav />
        <LogoutForm />
      </div>
    </aside>
  );
}
