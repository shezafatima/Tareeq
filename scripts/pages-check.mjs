// Checks the four placeholder pages and navigation. Usage: CHROME=<path> BASE=http://localhost:3000 node scripts/pages-check.mjs
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3000";
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
const pages = [["Programs", "/programs"], ["Courses", "/courses"], ["About", "/about"], ["Contact", "/contact"]];

for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));
  const tag = `[${w}px]`;

  for (const [title, href] of pages) {
    const res = await p.goto(base + href, { waitUntil: "load" });
    await p.waitForTimeout(500);
    check(`${tag} ${href} returns 200`, res.status() === 200);
    check(`${tag} ${href} has exactly one h1 reading "${title}"`, (await p.locator("h1").count()) === 1 && (await p.locator("h1").innerText()).trim() === title);
    check(`${tag} ${href} has header, main and a coming-soon line`, (await p.locator("header").count()) === 1 && (await p.locator("main").count()) === 1 && /coming soon/i.test(await p.locator("main").innerText()));
    check(`${tag} ${href} tab title contains "${title}"`, (await p.title()).includes(title), await p.title());
    check(`${tag} ${href} no horizontal scroll`, !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
  }

  if (w >= 768) {
    // aria-current on the active desktop link, and only on that link
    for (const [title, href] of pages) {
      await p.goto(base + href, { waitUntil: "load" });
      const marked = await p.getByRole("navigation", { name: "Main" }).locator('[aria-current="page"]').allInnerTexts();
      check(`${tag} ${href}: only "${title}" is marked aria-current`, marked.length === 1 && marked[0].trim() === title, marked.join(","));
    }
    // Clicking the desktop links reaches each page
    await p.goto(base + "/", { waitUntil: "load" });
    for (const [title, href] of pages) {
      await p.getByRole("navigation", { name: "Main" }).getByRole("link", { name: title }).click();
      await p.waitForURL("**" + href);
      check(`${tag} desktop link "${title}" navigates to ${href}`, true);
    }
  } else {
    // Mobile: every link in the menu reaches its page and closes the menu
    const dialog = p.getByRole("dialog", { name: "Main menu" });
    for (const [title, href] of pages) {
      await p.goto(base + "/", { waitUntil: "load" });
      await p.waitForTimeout(800);
      await p.getByRole("button", { name: "Open menu" }).click();
      await dialog.waitFor({ state: "visible" });
      await dialog.getByRole("link", { name: title }).click();
      await p.waitForURL("**" + href);
      await dialog.waitFor({ state: "hidden" });
      check(`${tag} menu link "${title}" navigates to ${href} and closes the menu`, true);
    }
    // aria-current inside the open menu
    await p.goto(base + "/about", { waitUntil: "load" });
    await p.waitForTimeout(800);
    await p.getByRole("button", { name: "Open menu" }).click();
    await dialog.waitFor({ state: "visible" });
    const marked = await dialog.locator('[aria-current="page"]').allInnerTexts();
    check(`${tag} menu marks only the current page (About)`, marked.length === 1 && marked[0].trim() === "About", marked.join(","));
    await p.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });

    // Back while the menu is open
    await p.goto(base + "/", { waitUntil: "load" });
    await p.waitForTimeout(800);
    await p.getByRole("button", { name: "Open menu" }).click();
    await dialog.waitFor({ state: "visible" });
    await dialog.getByRole("link", { name: "Courses" }).click();
    await p.waitForURL("**/courses");
    await p.getByRole("button", { name: "Open menu" }).click();
    await dialog.waitFor({ state: "visible" });
    await p.goBack();
    await p.waitForURL(base + "/");
    await p.waitForTimeout(1500);
    check(`${tag} Back while the menu is open leaves it closed`, (await dialog.count()) === 0);
    check(`${tag} page scroll is not left locked after Back`, (await p.evaluate(() => document.body.style.overflow)) !== "hidden");
  }

  check(`${tag} no console errors or warnings`, logs.length === 0, logs.join(" | ").slice(0, 200));
  await p.goto(base + "/about", { waitUntil: "load" });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `shots/page-about-${w}.png` });
  await ctx.close();
}

await b.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
