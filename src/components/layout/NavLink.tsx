"use client"; // reads the current pathname (usePathname) to mark the active link

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
};

export default function NavLink({ href, className, onClick, children }: NavLinkProps) {
  const current = usePathname() === href;
  return (
    <Link href={href} onClick={onClick} aria-current={current ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}
