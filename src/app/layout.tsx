import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import JsFlagScript from "@/components/layout/JsFlagScript";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-sora", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });
// The Urdu word on Our Way. The file holds only its letters and joining forms (about 11 KB); browsers fetch a font only
// when text uses it, so no other page downloads it. It is declared here because importing it on the route gives that
// route its own stylesheet, which every page's nav link then preloads for nothing. See specs/016-our-way-page/research.md.
const urdu = localFont({
  src: "./(site)/our-way/fonts/noto-nastaliq-urdu-tareeq-700.woff2",
  weight: "700",
  variable: "--font-urdu",
  // a moment's wait, not a swap: a fallback draws this word in the wrong letter shapes, and the swap moves it
  display: "block",
  preload: false,
  adjustFontFallback: false,
});

const title = "Tareeq | AI, the practical way";
const description =
  "Hands-on AI training for teachers, students and professionals across Asia. You bring the work. We show you the way.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: title, template: "%s | Tareeq" },
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${sora.variable} ${inter.variable} ${urdu.variable}`}>
      <body>
        <JsFlagScript />
        {children}
      </body>
    </html>
  );
}
