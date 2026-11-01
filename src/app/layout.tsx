import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-sora", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });

const title = "Tareeq | AI, the practical way";
const description =
  "Hands-on AI training for teachers, students and professionals across Asia. You bring the work. We show you the way.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Tareeq",
    images: [{ url: "/robot.png", width: 408, height: 612, alt: "Tareeq robot assistant" }],
  },
  twitter: { card: "summary", title, description, images: ["/robot.png"] },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${sora.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
