// Final screenshots for feature 004: every page at 1440x900 and 390x844 (fully revealed) plus a scroll sequence
// (start, mid-reveal, settled) for / and /programs. Usage: CHROME=<path> BASE=http://localhost:3100 node scripts/final-shots.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE ?? "http://localhost:3100";
mkdirSync("shots/004/final", { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME });
const names = { "/": "home", "/our-way": "our-way", "/programs": "programs", "/contact": "contact" };
const waitPreloader = async (p) => {
  await p.waitForFunction(() => document.documentElement.getAttribute("data-preloader") !== "run", null, { timeout: 20000 });
  await p.waitForTimeout(1300);
};
const scrollTo = (p, y) => p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);

for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  for (const [href, name] of Object.entries(names)) {
    const p = await ctx.newPage();
    await p.goto(base + href, { waitUntil: "load" });
    await waitPreloader(p);
    await p.screenshot({ path: `shots/004/final/${name}-${w}-viewport.png` });
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    // scroll sequence for / and /programs: start, mid-reveal, settled
    if (href === "/" || href === "/programs") {
      let n = 0;
      for (let y = Math.round(h * 0.6); y < total && n < 4; y += Math.round(h * 0.8), n++) {
        await scrollTo(p, y);
        await p.waitForTimeout(260);
        await p.screenshot({ path: `shots/004/final/${name}-${w}-seq${n + 1}-mid.png` });
        await p.waitForTimeout(1000);
        await p.screenshot({ path: `shots/004/final/${name}-${w}-seq${n + 1}-settled.png` });
      }
    }
    for (let y = 0; y <= total; y += Math.round(h * 0.5)) { await scrollTo(p, y); await p.waitForTimeout(180); }
    await p.waitForTimeout(1200);
    await scrollTo(p, 0);
    await p.waitForTimeout(500);
    await p.screenshot({ path: `shots/004/final/${name}-${w}-full.png`, fullPage: true });
    await p.close();
  }
  await ctx.close();
}
await b.close();
console.log("final screenshots written to shots/004/final/");
