// Absolute URLs and JSON-LD for search engines and feeds (specs/033-admin-blog research R16, R18). Pure: no server code.

/** An absolute address on this site. The base comes from NEXT_PUBLIC_SITE_URL, as the root layout's metadataBase does. */
export function siteUrl(path: string = "/"): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** JSON for a <script type="application/ld+json">: "<" is escaped so stored text can never close the tag. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
