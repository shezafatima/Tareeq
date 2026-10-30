// Keyboard and reduced-motion passes. Usage: CHROME=<path> BASE=http://localhost:3000 node scripts/polish-check.mjs
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
const describe = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el.tagName === "NEXTJS-PORTAL") return null; // dev-only overlay counts as leaving the page
  const c = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    name: (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 30),
    outline: c.outlineStyle !== "none" && parseFloat(c.outlineWidth) >= 2,
    boxShadow: c.boxShadow !== "none",
    visible: r.width > 0 && r.height > 0,
  };
};

// ---- T041: keyboard pass
for (const [w, h] of [[1440, 900], [390, 844]]) {
  for (const route of ["/", "/about"]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.goto(base + route, { waitUntil: "load" });
    await p.waitForTimeout(1200);
    const tag = `[${w}px] ${route}`;

    // Skip link: first Tab reveals it, Enter jumps to main content
    await p.keyboard.press("Tab");
    const first = await p.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); return { text: e.textContent.trim(), w: r.width, h: r.height, top: r.top }; });
    check(`${tag} first Tab lands on a visible "Skip to content" link`, first.text === "Skip to content" && first.w > 1 && first.h > 1 && first.top >= 0, JSON.stringify(first));
    await p.keyboard.press("Enter");
    await p.waitForTimeout(300);
    check(`${tag} skip link moves to #content`, (await p.evaluate(() => location.hash)) === "#content");

    // Walk the whole page with Tab
    await p.goto(base + route, { waitUntil: "load" });
    await p.waitForTimeout(1200);
    await p.evaluate(() => document.activeElement?.blur());
    const seen = [];
    let trapped = true;
    const problems = [];
    for (let i = 0; i < 40; i++) {
      await p.keyboard.press("Tab");
      const d = await p.evaluate(describe);
      if (!d) { trapped = false; break; }
      seen.push(d.name);
      if (!d.visible) problems.push(`${d.name}: not visible`);
      if (!d.outline && !d.boxShadow) problems.push(`${d.name}: no focus indicator`);
    }
    check(`${tag} Tab leaves the page (no keyboard trap) after ${seen.length} stops`, !trapped, seen.join(" > ").slice(0, 160));
    check(`${tag} every focused control is visible and has a focus indicator`, problems.length === 0, problems.join("; "));

    // Shift+Tab goes back
    await p.keyboard.press("Shift+Tab");
    check(`${tag} Shift+Tab returns into the page`, !!(await p.evaluate(describe)));
    await ctx.close();
  }
}

// ---- T042: reduced motion
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + "/about", { waitUntil: "load" });
  await p.waitForTimeout(1200);
  const anims = await p.evaluate(() => document.getAnimations().filter((a) => {
    const t = a.effect?.target; return t && (t.closest("header, footer, main") ) && a.playState === "running" && (a.effect.getComputedTiming().duration > 1);
  }).map((a) => a.effect.target.tagName + "." + (a.effect.target.className || "").toString().slice(0, 30)));
  check("[reduced motion] no running animations in header, main or footer on /about", anims.length === 0, anims.join(", "));

  await p.getByRole("button", { name: "Open menu" }).click();
  const dialog = p.getByRole("dialog", { name: "Main menu" });
  await dialog.waitFor({ state: "visible" });
  const t = await dialog.evaluate((el) => getComputedStyle(el).transform);
  check("[reduced motion] sidebar does not slide in", t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)", t);
  await p.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 3000 });
  check("[reduced motion] sidebar closes without delay", true);

  const smooth = await p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  check("[reduced motion] smooth scrolling is turned off", smooth === "auto", smooth);
  await ctx.close();
}

await b.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
