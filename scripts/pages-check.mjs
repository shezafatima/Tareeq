// Checks the pages, navigation and redirect. Usage: CHROME=<path> BASE=http://localhost:3100 node scripts/pages-check.mjs
// Env: EXPECT_EMAIL / EXPECT_LOCATION (optional) - values the contact page must show; when unset the page must show neither.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE ?? "http://localhost:3100";
mkdirSync("shots/003", { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

// [nav label, href, expected h1, title fragment, screenshot name]
const pages = [
  ["Programs", "/programs", "Workshops you can use the next day", "Programs", "programs"],
  ["Courses", "/courses", "Courses", "Courses", "courses"],
  ["Our Way", "/our-way", "Learn the way you work", "Our Way", "our-way"],
  ["Contact", "/contact", "Talk to us", "Contact", "contact"],
];

// ---------- redirect ----------
{
  const ctx = await b.newContext();
  const res = await ctx.request.get(base + "/about", { maxRedirects: 0 });
  check("/about responds 308 to /our-way", res.status() === 308 && (res.headers()["location"] ?? "").endsWith("/our-way"), `${res.status()} ${res.headers()["location"]}`);
  await ctx.close();
}

for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));
  const tag = `[${w}px]`;

  for (const [, href, h1, titleBit, shot] of pages) {
    const res = await p.goto(base + href, { waitUntil: "load" });
    await p.waitForTimeout(700);
    check(`${tag} ${href} returns 200`, res.status() === 200);
    check(`${tag} ${href} has exactly one h1 reading "${h1}"`, (await p.locator("h1").count()) === 1 && (await p.locator("h1").innerText()).trim() === h1, await p.locator("h1").allInnerTexts().then((t) => t.join("|")));
    check(`${tag} ${href} has header, main and footer`, (await p.locator("header").first().count()) === 1 && (await p.locator("main").count()) === 1 && (await p.locator("footer").count()) === 1);
    check(`${tag} ${href} tab title contains "${titleBit}" and the site name`, (await p.title()).includes(titleBit) && (await p.title()).includes("Tareeq"), await p.title());
    if (href !== "/courses") {
      const desc = await p.locator('meta[name="description"]').getAttribute("content");
      check(`${tag} ${href} has its own meta description`, !!desc && desc.length >= 80 && desc.length <= 200, `${desc?.length}`);
    }
    check(`${tag} ${href} no horizontal scroll`, !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
    await p.waitForTimeout(6000); // the preloader plays on every load; wait it out so the screenshot shows the page
    await p.screenshot({ path: `shots/003/${shot}-${w}.png`, fullPage: true });
  }

  // Our Way content
  await p.goto(base + "/our-way", { waitUntil: "load" });
  check(`${tag} /our-way covers story, meaning, approach, vision, mission, people`, (await p.locator("main h2").count()) === 6, (await p.locator("main h2").allInnerTexts()).join(" | "));
  check(`${tag} /our-way shows the Urdu word with lang and direction`, (await p.locator('[lang="ur"][dir="rtl"]').innerText()).includes("طریق"));
  check(`${tag} /our-way has no hype words`, !/empower|unlock|revolutioni[sz]e/i.test(await p.locator("main").innerText()));

  // Programs content
  await p.goto(base + "/programs", { waitUntil: "load" });
  const cards = p.locator("main article");
  const n = await cards.count();
  check(`${tag} /programs lists programs (2 to 3)`, n >= 2 && n <= 3, String(n));
  let allFacts = true;
  let soon = 0;
  for (let i = 0; i < n; i++) {
    const t = await cards.nth(i).innerText();
    const isSoon = /coming soon/i.test(t);
    if (isSoon) soon++;
    const need = isSoon ? ["Who it’s for", "After this you will be able to", "What to bring"] : ["Who it’s for", "Duration", "Format", "After this you will be able to", "What to bring"];
    if (!need.every((x) => t.includes(x))) allFacts = false;
  }
  check(`${tag} /programs: every program shows its facts (coming-soon ones need no duration or format)`, allFacts);
  check(`${tag} /programs: at least one program is marked "Coming soon"`, soon >= 1, String(soon));
  const joins = await p.locator('main a:has-text("Join this workshop")').count();
  check(`${tag} /programs: booking button only on programs that are available`, joins === n - soon, `${joins} buttons, ${n - soon} available`);
  check(`${tag} /programs: calls to action go to /contact`, (await p.locator('main a[href="/contact"]').count()) >= 1);

  // Contact content
  await p.goto(base + "/contact", { waitUntil: "load" });
  check(`${tag} /contact has no form`, (await p.locator("main form").count()) === 0);
  const wa = await p.locator('main a[href^="https://wa.me/"]').count();
  check(`${tag} /contact: WhatsApp links open wa.me`, wa >= 1, String(wa));
  const text = await p.locator("main").innerText();
  check(`${tag} /contact shows a response-time note`, /reply within/i.test(text));
  const email = process.env.EXPECT_EMAIL;
  const loc = process.env.EXPECT_LOCATION;
  check(`${tag} /contact email ${email ? "shown as mailto" : "hidden"}`, email ? (await p.locator(`main a[href="mailto:${email}"]`).count()) === 1 : (await p.locator('main a[href^="mailto:"]').count()) === 0);
  check(`${tag} /contact location ${loc ? "shown" : "hidden"}`, loc ? text.includes(loc) : !/Location/.test(text));
  const footerText = await p.locator("footer").innerText();
  check(`${tag} footer contact block matches the page (WhatsApp${email ? ", email" : ""}${loc ? ", location" : ""})`, footerText.includes("WhatsApp") && (email ? footerText.includes(email) : !footerText.includes("Email")) && (loc ? footerText.includes(loc) : !footerText.includes("Location")));

  // Navigation labels
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(500);
  const footerNav = await p.getByRole("navigation", { name: "Footer" }).locator("a").allInnerTexts();
  check(`${tag} footer nav says "Our Way" and not "About"`, footerNav.includes("Our Way") && !footerNav.includes("About"), footerNav.join(","));
  check(`${tag} no link to /about anywhere on the home page`, (await p.locator('a[href="/about"]').count()) === 0);

  if (w >= 768) {
    for (const [title, href] of pages.map((x) => [x[0], x[1]])) {
      await p.goto(base + href, { waitUntil: "load" });
      const marked = await p.getByRole("navigation", { name: "Main" }).locator('[aria-current="page"]').allInnerTexts();
      check(`${tag} ${href}: only "${title}" is marked aria-current`, marked.length === 1 && marked[0].trim() === title, marked.join(","));
    }
    await p.goto(base + "/", { waitUntil: "load" });
    for (const [title, href] of pages.map((x) => [x[0], x[1]])) {
      await p.getByRole("navigation", { name: "Main" }).getByRole("link", { name: title }).click();
      await p.waitForURL("**" + href);
      check(`${tag} desktop link "${title}" navigates to ${href}`, true);
    }
  } else {
    const dialog = p.getByRole("dialog", { name: "Main menu" });
    for (const [title, href] of pages.map((x) => [x[0], x[1]])) {
      await p.goto(base + "/", { waitUntil: "load" });
      await p.waitForTimeout(800);
      await p.getByRole("button", { name: "Open menu" }).click();
      await dialog.waitFor({ state: "visible" });
      await dialog.getByRole("link", { name: title }).click();
      await p.waitForURL("**" + href);
      await dialog.waitFor({ state: "hidden" });
      check(`${tag} menu link "${title}" navigates to ${href} and closes the menu`, true);
    }
    await p.goto(base + "/our-way", { waitUntil: "load" });
    await p.waitForTimeout(800);
    await p.getByRole("button", { name: "Open menu" }).click();
    await dialog.waitFor({ state: "visible" });
    const marked = await dialog.locator('[aria-current="page"]').allInnerTexts();
    check(`${tag} menu marks only the current page (Our Way)`, marked.length === 1 && marked[0].trim() === "Our Way", marked.join(","));
    await p.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  }

  // Courses is still a placeholder
  await p.goto(base + "/courses", { waitUntil: "load" });
  check(`${tag} /courses is still the coming-soon placeholder`, /coming soon/i.test(await p.locator("main").innerText()));

  const real = logs.filter((l) => !/Failed to load resource/.test(l));
  check(`${tag} no console errors or warnings`, real.length === 0, real.join(" | ").slice(0, 200));
  await ctx.close();
}

// ---------- width sweep ----------
for (const w of [360, 390, 768, 1024, 1440, 1920]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  const p = await ctx.newPage();
  const bad = [];
  for (const href of ["/", "/our-way", "/programs", "/contact"]) {
    await p.goto(base + href, { waitUntil: "load" });
    await p.waitForTimeout(href === "/" ? 6500 : 400);
    if (await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) bad.push(href);
  }
  check(`[${w}px] no horizontal scroll on /, /our-way, /programs, /contact`, bad.length === 0, bad.join(","));
  await ctx.close();
}

await b.close();
console.log(results.join("\n"));
console.log(results.some((r) => r.startsWith("FAIL")) ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
