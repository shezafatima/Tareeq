"use client"; // needs state and the current path (the menu is open only for the page it was opened on)

import { List } from "@phosphor-icons/react/dist/ssr";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Drawer from "./Drawer";

/** Menu button plus slide-in drawer for phones and tablets. Navigating closes it. `children` is the server-rendered menu content. */
export default function MobileMenu({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenAt(pathname)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10"
      >
        <List weight="bold" size={24} aria-hidden="true" />
      </button>
      <Drawer open={open} onClose={() => setOpenAt(null)} label="Admin menu" side="left" className="bg-midnight text-white">
        <div className="flex flex-1 flex-col gap-8 p-4 pt-16">{children}</div>
      </Drawer>
    </>
  );
}
