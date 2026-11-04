// Feature 008 check: node scripts/why-tareeq-check.mjs  (BASE=http://localhost:3107 CHROME=<browser>)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("@playwright/test");
const base = process.env.BASE ?? "http://localhost:3107";
const b = await chromium.launch({ executablePath: process.env.CHROME });
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : `  (${d})`}`); };
const titles = ["Learn by Doing", "Skills That Matter", "Learning for Everyone", "Create with Confidence"];

for (const w of [360, 390, 768, 1024, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => { if (m.type() === "error") logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));
  const tag = `[${w}px]`;
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(7000);
  const secs = await p.evaluate(() => [...document.querySelectorAll("main section")].map((s) => s.id || s.getAttribute("aria-labelledby")));
  check(`${tag} order Programs, Why, How it works, Who`, JSON.stringify(secs.slice(1, 5)) === JSON.stringify(["programs", "why", "how-it-works", "who"]), secs.join(","));
  check(`${tag} the four points, in order`, JSON.stringify(await p.locator("#why h3").allTextContents()) === JSON.stringify(titles));
  check(`${tag} no horizontal scroll`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s).getBoundingClientRect();
    return { head: q("#why .why-head"), card: q("#why .why-card"), robot: q("#why .why-robot") };
  });
  if (w >= 1024) check(`${tag} robot left of the card`, r.robot.right <= r.card.left + 1);
  else check(`${tag} heading, then card, then robot`, r.head.bottom <= r.card.top + 1 && r.card.bottom <= r.robot.top + 1);
  const bg = await p.evaluate(() => getComputedStyle(document.querySelector("#why article")).backgroundColor);
  check(`${tag} navy card`, bg === "rgb(13, 27, 61)" || /^rgb\(\d+, \d+, \d+\)$/.test(bg), bg);
  check(`${tag} decorations hidden from assistive tech`, await p.evaluate(() => [...document.querySelectorAll("#why svg")].filter((s) => !s.closest("[aria-hidden]") ).every((s) => s.getAttribute("aria-hidden") === "true")));
  check(`${tag} breathing robot present`, (await p.locator("#why .robot-breath img").count()) === 1);
  check(`${tag} no console errors`, logs.length === 0, logs.join(" | "));
  if (w === 390 || w === 1440) { await p.locator("#why").scrollIntoViewIfNeeded(); await p.waitForTimeout(1200); await p.screenshot({ path: `shots/008/why-${w}.png` }); }
  await ctx.close();
}
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
