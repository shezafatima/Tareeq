import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // /blog/preview is the owner's private view of unpublished posts (specs/033-admin-blog FR-017)
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/auth", "/blog/preview"] },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
