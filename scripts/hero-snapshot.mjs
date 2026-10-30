// Captures hero screenshots and computed colour styles for before/after comparison.
// Usage: CHROME=<path> BASE=http://localhost:3100 node scripts/hero-snapshot.mjs <out-dir>
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const out = process.argv[2];
if (!out) throw new Error("usage: hero-snapshot.mjs <out-dir>");
mkdirSync(out, { recursive: true });
const base = process.env.BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.CHROME });

const PROPS = ["color", "backgroundColor", "backgroundImage", "fill", "stroke", "borderTopColor", "boxShadow", "filter", "outlineColor", "opacity"];
const snapshot = () => {
  const root = document.querySelector("main");
  const props = ["color", "backgroundColor", "backgroundImage", "fill", "stroke", "borderTopColor", "boxShadow", "filter", "outlineColor"];
  const rows = [];
  let i = 0;
  for (const el of root.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    const row = { i: i++, tag: el.tagName.toLowerCase(), cls: (el.getAttribute("class") || "").toString().slice(0, 40) };
    for (const p of props) row[p] = cs[p];
    rows.push(row);
  }
  const bs = getComputedStyle(document.body);
  return { bodyVars: { start: bs.getPropertyValue("--gradient-background-start").trim(), end: bs.getPropertyValue("--gradient-background-end").trim() }, resolved: { start: null }, rows };
};

for (const [w, h] of [[1440, 900], [390, 844]]) {
  // 1) Reduced motion: frozen, deterministic, used for pixel diff
  {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(base + "/", { waitUntil: "load" });
    await p.waitForTimeout(3500);
    await p.screenshot({ path: `${out}/reduced-${w}.png` });
    writeFileSync(`${out}/styles-reduced-${w}.json`, JSON.stringify(await p.evaluate(snapshot), null, 1));
    await ctx.close();
  }
  // 2) Normal motion: idle, hover on the Learn card, and eye tracking (desktop)
  {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.goto(base + "/", { waitUntil: "load" });
    await p.waitForTimeout(6000);
    writeFileSync(`${out}/styles-idle-${w}.json`, JSON.stringify(await p.evaluate(snapshot), null, 1));
    await p.screenshot({ path: `${out}/idle-${w}.png` });
    if (w >= 1024) {
      const box = await p.getByText("Learn", { exact: true }).boundingBox(); // cards float, so move the mouse to where it is
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
      await p.waitForTimeout(900);
      writeFileSync(`${out}/styles-hover-learn-${w}.json`, JSON.stringify(await p.evaluate(snapshot), null, 1));
      await p.screenshot({ path: `${out}/hover-learn-${w}.png` });
      await p.mouse.move(900, 300);
      await p.waitForTimeout(900);
      await p.screenshot({ path: `${out}/eyes-${w}.png` });
    }
    await ctx.close();
  }
}
await b.close();
console.log("snapshot written to", out);
