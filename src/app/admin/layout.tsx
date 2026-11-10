import type { Metadata } from "next";

// Every admin page is private: not indexed, not followed (specs/022-admin-panel FR-007).
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Tareeq admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
