// Checks the desktop header. Usage: CHROME=<path> BASE=http://localhost:3000 node scripts/desktop-check.mjs
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

for (const [w, h, headerH] of [[1024, 768, 80], [1280, 720, 80], [1440, 900, 80], [768, 1024, 64]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(1500);
  const tag = `[${w}px]`;

  const hh = await p.evaluate(() => document.querySelector("header").getBoundingClientRect().height);
  check(`${tag} header height is ${headerH}px`, hh === headerH, String(hh));
  check(`${tag} no horizontal scroll`, !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
  check(`${tag} menu button hidden`, !(await p.getByRole("button", { name: "Open menu" }).isVisible()));

  const nav = p.getByRole("navigation", { name: "Main" });
  for (const name of ["Programs", "Courses", "About", "Contact"]) {
    const link = nav.getByRole("link", { name });
    const box = await link.boundingBox();
    check(`${tag} "${name}" link visible, hit area >= 44px`, (await link.isVisible()) && box.height >= 44, `${Math.round(box.height)}px`);
  }
  const join = p.getByRole("banner").getByRole("link", { name: "Book a workshop" });
  check(`${tag} "Book a workshop" visible, links to /contact`, (await join.isVisible()) && (await join.getAttribute("href")) === "/contact");

  // Tab order: skip link, logo, four links, join button
  const order = [];
  await p.evaluate(() => document.activeElement?.blur());
  for (let i = 0; i < 7; i++) {
    await p.keyboard.press("Tab");
    order.push(await p.evaluate(() => (document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "").trim()));
  }
  const expected = ["Skip to content", "tareeq, home", "Programs", "Courses", "About", "Contact", "Book a workshop"];
  check(`${tag} tab order`, JSON.stringify(order) === JSON.stringify(expected), order.join(" > "));

  // Focus ring visible on the last focused control (join button)
  const ring = await p.evaluate(() => { const c = getComputedStyle(document.activeElement); return { style: c.outlineStyle, width: parseFloat(c.outlineWidth) }; });
  check(`${tag} focused control shows an outline`, ring.style !== "none" && ring.width >= 2, `${ring.style} ${ring.width}px`);

  // Hero fits one screen below the header from 1024px
  const hero = await p.evaluate(() => { const r = document.querySelector("main section").getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height) }; });
  if (w >= 1024) check(`${tag} hero is exactly one screen below the header`, hero.top === headerH && hero.h === h - headerH, `top ${hero.top}, height ${hero.h}, expected ${h - headerH}`);

  await ctx.close();
}

await b.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
