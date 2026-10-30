// Checks the mobile menu behaviour. Usage: CHROME=<path> BASE=http://localhost:3000 node scripts/menu-check.mjs
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

for (const [w, h] of [[360, 740], [390, 844], [767, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(1500);
  const tag = `[${w}px]`;

  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  check(`${tag} no horizontal scroll (closed)`, !overflow);

  const btn = p.getByRole("button", { name: "Open menu" });
  check(`${tag} menu button visible, aria-expanded=false`, (await btn.isVisible()) && (await btn.getAttribute("aria-expanded")) === "false");
  const box = await btn.boundingBox();
  check(`${tag} menu button is at least 44px`, box.width >= 44 && box.height >= 44, `${box.width}x${box.height}`);
  if (w === 390) await p.screenshot({ path: "shots/menu-closed-390.png" });

  await btn.click();
  const dialog = p.getByRole("dialog", { name: "Main menu" });
  await dialog.waitFor({ state: "visible" });
  await p.waitForTimeout(400);
  const rect = await dialog.boundingBox();
  const maxW = Math.min(w * 0.85, 320);
  check(`${tag} panel is a full-height right-hand sidebar`, Math.round(rect.x + rect.width) === w && Math.round(rect.height) === h && rect.width <= maxW + 1 && rect.width >= 200, `${rect.width}x${rect.height}`);
  const glass = await dialog.evaluate((el) => { const c = getComputedStyle(el); return { bf: c.backdropFilter, bg: c.backgroundColor }; });
  check(`${tag} panel has the glass blur and a translucent background`, /blur/.test(glass.bf) && /\/ |, 0\.|rgba|oklab|color\(/.test(glass.bg), `${glass.bf} ${glass.bg}`);
  check(`${tag} aria-expanded=true while open`, (await btn.getAttribute("aria-expanded")) === "true");
  const focusInPanel = () => p.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  check(`${tag} focus moves into panel`, await focusInPanel());
  if (w === 390) await p.screenshot({ path: "shots/menu-open-390.png" });

  let escaped = false;
  for (let i = 0; i < 12; i++) { await p.keyboard.press("Tab"); if (!(await focusInPanel())) escaped = true; }
  for (let i = 0; i < 12; i++) { await p.keyboard.press("Shift+Tab"); if (!(await focusInPanel())) escaped = true; }
  check(`${tag} Tab / Shift+Tab never leave the panel`, !escaped);

  const overflowStyle = await p.evaluate(() => document.body.style.overflow);
  const scrollBefore = await p.evaluate(() => window.scrollY);
  await p.mouse.wheel(0, 600);
  await p.waitForTimeout(200);
  const scrollAfter = await p.evaluate(() => window.scrollY);
  check(`${tag} page behind does not scroll`, overflowStyle === "hidden" && scrollBefore === scrollAfter, `overflow=${overflowStyle}, scrollY ${scrollBefore}->${scrollAfter}`);

  await p.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  check(`${tag} Escape closes the menu`, true);
  check(`${tag} focus returns to the menu button`, await p.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Open menu"));
  check(`${tag} scroll restored after close`, (await p.evaluate(() => document.body.style.overflow)) !== "hidden");

  await btn.click();
  await dialog.waitFor({ state: "visible" });
  await p.mouse.click(5, 300);
  await dialog.waitFor({ state: "hidden" });
  check(`${tag} tapping outside the sidebar closes it`, true);

  await btn.click();
  await dialog.waitFor({ state: "visible" });
  await dialog.getByRole("link", { name: "About" }).click();
  await p.waitForURL("**/about");
  await dialog.waitFor({ state: "hidden" });
  check(`${tag} link click navigates and closes the menu`, true);

  // Until the placeholder pages exist (Phase 6) /about is a 404 without the shell, so just come back.
  await p.goBack();
  await p.waitForURL(base + "/");
  await p.waitForTimeout(300);
  check(`${tag} Back after navigating shows the page with the menu closed`, (await dialog.count()) === 0);

  await btn.click();
  await dialog.waitFor({ state: "visible" });
  await p.setViewportSize({ width: 800, height: h });
  await p.waitForTimeout(1500);
  check(`${tag} growing to 800px closes the menu`, (await dialog.count()) === 0);

  check(`${tag} no console errors or warnings`, logs.length === 0, logs.join(" | ").slice(0, 200));
  await ctx.close();
}

// Reduced motion: no translate
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.getByRole("button", { name: "Open menu" }).click();
  const dialog = p.getByRole("dialog", { name: "Main menu" });
  await dialog.waitFor({ state: "visible" });
  const t = await dialog.evaluate((el) => getComputedStyle(el).transform);
  check("[reduced motion] panel has no slide", t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)", t);
  await ctx.close();
}

// Wide screen: no menu button, links inline
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  check("[1440px] menu button hidden", !(await p.getByRole("button", { name: "Open menu" }).isVisible()));
  check("[1440px] desktop links visible", await p.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Programs" }).isVisible());
  const hh = await p.evaluate(() => document.querySelector("header").getBoundingClientRect().height);
  check("[1440px] header height is 80px", hh === 80, String(hh));
  await ctx.close();
}

await b.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
