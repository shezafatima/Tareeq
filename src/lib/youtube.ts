// Pure helper (spec 012). Relative imports only so `node --test` can run it.
const ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const PATH_FORMS = ["shorts", "embed", "live"];

/** Returns the 11-character YouTube video id for a Shorts, watch, youtu.be, embed or live URL, otherwise null. Never throws. */
export function parseYouTubeId(url: string): string | null {
  if (typeof url !== "string") return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  const parts = u.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  if (host === "youtu.be" || host === "www.youtu.be") {
    id = parts[0] ?? null;
  } else if (HOSTS.has(host)) {
    if (parts[0] === "watch") id = u.searchParams.get("v");
    else if (PATH_FORMS.includes(parts[0])) id = parts[1] ?? null;
  }
  return id && ID.test(id) ? id : null;
}
