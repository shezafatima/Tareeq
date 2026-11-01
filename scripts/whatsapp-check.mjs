// Checks the floating WhatsApp button.
// Usage: CHROME=<path> BASE=http://localhost:3000 [EXPECT=absent] [NUMBER=923001234567] node scripts/whatsapp-check.mjs
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3000";
const absent = process.env.EXPECT === "absent";
const number = process.env.NUMBER ?? "923001234567";
const routes = ["/", "/programs", "/courses", "/about", "/contact"];
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));

  for (const route of routes) {
    const tag = `[${w}px] ${route}`;
    await p.goto(base + route, { waitUntil: "load" });
    await p.waitForTimeout(600);
    const link = p.locator('a[href^="https://wa.me/"]');

    if (absent) {
      check(`${tag} no WhatsApp button is rendered`, (await link.count()) === 0);
      continue;
    }

    check(`${tag} exactly one WhatsApp button`, (await link.count()) === 1);
    check(`${tag} button is visible`, await link.isVisible());
    const box = await link.boundingBox();
    const fromRight = w - (box.x + box.width);
    const fromBottom = h - (box.y + box.height);
    check(`${tag} fixed at the bottom right`, fromRight >= 16 && fromRight <= 40 && fromBottom >= 16 && fromBottom <= 40, `right ${Math.round(fromRight)}, bottom ${Math.round(fromBottom)}`);
    check(`${tag} touch target is at least 44px`, box.width >= 44 && box.height >= 44, `${box.width}x${box.height}`);
    const href = await link.getAttribute("href");
    const url = new URL(href);
    check(`${tag} opens wa.me/${number} with a prefilled message`, url.pathname === `/${number}` && (url.searchParams.get("text") ?? "").length > 0, decodeURIComponent(url.search).slice(0, 70));
    check(`${tag} opens in a new tab safely`, (await link.getAttribute("target")) === "_blank" && /noopener/.test(await link.getAttribute("rel")) && /noreferrer/.test(await link.getAttribute("rel")));
    check(`${tag} has an accessible name`, /WhatsApp/.test((await link.getAttribute("aria-label")) ?? ""));
    check(`${tag} stays in place after scrolling`, await (async () => {
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await p.waitForTimeout(300);
      const b2 = await link.boundingBox();
      return Math.abs(b2.y - box.y) < 1;
    })());
  }

  check(`[${w}px] no console errors or warnings`, logs.length === 0, logs.join(" | ").slice(0, 200));
  if (!absent) { await p.goto(base + "/", { waitUntil: "load" }); await p.waitForTimeout(2200); await p.screenshot({ path: `shots/whatsapp-${w}.png` }); }
  await ctx.close();
}

await b.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
