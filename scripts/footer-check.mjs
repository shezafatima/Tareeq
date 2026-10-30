// Checks the footer and its interaction with the WhatsApp button.
// Usage: CHROME=<path> BASE=http://localhost:3000 [EXPECT=filled] node scripts/footer-check.mjs
import { chromium } from "@playwright/test";
import { contrastInPage } from "./contrast.mjs";

const base = process.env.BASE ?? "http://localhost:3000";
const filled = process.env.EXPECT === "filled";
const routes = ["/", "/programs", "/courses", "/about", "/contact"];
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

for (const [w, h] of [[360, 740], [390, 844], [1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));

  for (const route of routes) {
    const tag = `[${w}px] ${route}`;
    await p.goto(base + route, { waitUntil: "load" });
    await p.waitForTimeout(600);
    const footer = p.getByRole("contentinfo");
    check(`${tag} exactly one footer landmark`, (await footer.count()) === 1);
    await footer.scrollIntoViewIfNeeded();
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(300);

    const text = await footer.innerText();
    check(`${tag} shows the tagline "AI, the practical way."`, text.includes("AI, the practical way."));
    check(`${tag} shows a copyright line with the current year`, text.includes(`© ${new Date().getFullYear()} Tareeq`));
    check(`${tag} has the logo linking home`, (await footer.getByRole("link", { name: "tareeq, home" }).getAttribute("href")) === "/");
    const navHrefs = await footer.getByRole("navigation", { name: "Footer" }).getByRole("link").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    check(`${tag} footer nav links to the four pages`, JSON.stringify(navHrefs) === JSON.stringify(["/programs", "/courses", "/about", "/contact"]), navHrefs.join(","));
    check(`${tag} contact block is ${filled ? "shown" : "absent while empty"}`, ((await footer.getByRole("heading", { name: "Contact" }).count()) > 0) === filled);
    check(`${tag} social block is ${filled ? "shown" : "absent while empty"}`, ((await footer.getByRole("heading", { name: "Follow us" }).count()) > 0) === filled);

    check(`${tag} no horizontal scroll`, !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
    const small = await footer.locator("a").evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.textContent.trim()));
    check(`${tag} every footer link is at least 44px tall`, small.length === 0, small.join(","));

    // Footer reaches the bottom of the viewport on short pages
    const fb = await p.evaluate(() => Math.round(document.querySelector("footer").getBoundingClientRect().bottom));
    check(`${tag} footer sits at the bottom of the viewport or page`, fb >= h - 1, `bottom ${fb}, viewport ${h}`);

    // WhatsApp button must not cover any footer link or text when scrolled to the bottom
    const wa = await p.locator('a[href^="https://wa.me/"]').boundingBox();
    if (wa) {
      const covered = await footer.locator("a, p, li").evaluateAll((els, r) => els.filter((e) => { const b = e.getBoundingClientRect(); const textW = (() => { const g = document.createRange(); g.selectNodeContents(e); const rc = g.getBoundingClientRect(); return rc; })(); return !(textW.right < r.x || textW.left > r.x + r.width || textW.bottom < r.y || textW.top > r.y + r.height) && textW.width > 0; }).map((e) => e.textContent.trim().slice(0, 20)), wa);
      check(`${tag} WhatsApp button does not cover footer content`, covered.length === 0, covered.join(" | "));
    }
  }

  // Detailed checks once per width on /about
  await p.goto(base + "/about", { waitUntil: "load" });
  await p.waitForTimeout(600);
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const low = await p.evaluate(contrastInPage, "footer");
  check(`[${w}px] footer text meets AA contrast`, low.length === 0, low.join("; "));

  const links = p.getByRole("contentinfo").locator("a");
  const n = await links.count();
  let noRing = [];
  for (let i = 0; i < n; i++) {
    await links.nth(i).focus();
    await p.keyboard.press("Shift+Tab"); await p.keyboard.press("Tab");
    const r = await p.evaluate(() => { const c = getComputedStyle(document.activeElement); return { t: document.activeElement.textContent.trim(), s: c.outlineStyle, w: parseFloat(c.outlineWidth), c: c.outlineColor }; });
    if (r.s === "none" || r.w < 2) noRing.push(r.t);
  }
  check(`[${w}px] all ${n} footer links show a focus outline`, noRing.length === 0, noRing.join(","));
  await p.screenshot({ path: `shots/footer-${w}${filled ? "-filled" : ""}.png` });

  check(`[${w}px] no console errors or warnings`, logs.length === 0, logs.join(" | ").slice(0, 200));
  await ctx.close();
}

await b.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
