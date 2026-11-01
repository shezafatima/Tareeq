// Usage: CHROME=<path> node scripts/snap.mjs <url-path> <out-prefix> [more sizes via env SIZES="1440x900,390x844"]
import { chromium } from "@playwright/test";
const [path = "/", out = "shots/snap"] = process.argv.slice(2);
const base = process.env.BASE ?? "http://localhost:3100";
const sizes = (process.env.SIZES ?? "1440x900,390x844").split(",").map((s) => s.split("x").map(Number));
const b = await chromium.launch({ executablePath: process.env.CHROME });
for (const [width, height] of sizes) {
  const p = await b.newPage({ viewport: { width, height } });
  const logs = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));
  await p.goto(base + (path.startsWith("/") ? path : "/" + path.replace(/^home$/, "")), { waitUntil: "load" });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}-${width}.png` });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(`${path} ${width}x${height} overflowX=${overflow} console=${logs.length ? logs.join(" | ") : "none"}`);
  await p.close();
}
await b.close();
