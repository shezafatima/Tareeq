// Saves the visible text of <main> for each page, to prove copy did not change between builds.
// Usage: CHROME=<path> BASE=http://localhost:3100 node scripts/text-snapshot.mjs <out-prefix>   e.g. shots/004/text-before
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const prefix = process.argv[2];
if (!prefix) throw new Error("usage: text-snapshot.mjs <out-prefix>");
mkdirSync(dirname(prefix), { recursive: true });
const base = process.env.BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.CHROME });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }); // reduced motion: everything visible
const p = await ctx.newPage();
for (const [name, href] of [["home", "/"], ["our-way", "/our-way"], ["programs", "/programs"]]) {
  await p.goto(base + href, { waitUntil: "load" });
  await p.waitForTimeout(800);
  // textContent, not innerText: counts text that is present even if visually hidden by a reveal state
  const text = await p.locator("main").evaluate((el) => [...el.querySelectorAll("h1,h2,h3,h4,p,li,dt,dd,a,span,button")].map((n) => ([...n.children].every((c) => c.tagName.toLowerCase() === "svg") ? n.textContent.trim() : "")).filter(Boolean).join("\n"));
  writeFileSync(`${prefix}-${name}.txt`, text + "\n");
}
await b.close();
console.log("text snapshot written to", prefix + "-*.txt");
