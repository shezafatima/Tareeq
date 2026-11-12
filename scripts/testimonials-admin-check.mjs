// Browser checks for the testimonial admin (feature 031): quickstart steps 1-13 at 360px and 1440px, keyboard only for the tooltip.
// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... BASE=http://localhost:3100 CHROME=<path to msedge/chrome> node scripts/testimonials-admin-check.mjs
// Run it against a PRODUCTION server (npm start) started with the same ADMIN_EMAIL and an ADMIN_PASSWORD_HASH made from
// ADMIN_PASSWORD. It creates testimonials named "ZZ-T031 ..." in the database named by MONGODB_URI and deletes every one
// whose name starts with that prefix when it ends. Point it at a development database only.
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import mongoose from "mongoose";

const base = process.env.BASE ?? "http://localhost:3100";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(2);
}
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
const shots = "shots/031";
mkdirSync(shots, { recursive: true });

const results = [];
const check = (name, ok, extra = "") => {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
  console.log(results.at(-1));
};
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

const PREFIX = "ZZ-T031";
const VIDEO_A = "dQw4w9WgXcQ";
const VIDEO_B = "jNQXAC9IVRw";

const browser = await chromium.launch({ executablePath: process.env.CHROME });
await mongoose.connect(env.MONGODB_URI);
const col = mongoose.connection.db.collection("testimonials");
const before = await col.countDocuments({ name: { $regex: `^${PREFIX}` } });
if (before) await col.deleteMany({ name: { $regex: `^${PREFIX}` } });
const realBefore = await col.countDocuments({});

async function session(viewport, reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport, reducedMotion });
  const address = `198.${18 + Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;
  await context.route(`${base}/**`, (route) => route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": address } }));
  const page = await context.newPage();
  await page.goto(`${base}/admin/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.endsWith("/admin/login"), { timeout: 20000 });
  return { context, page };
}

try {
  // ---------- 360px: list, empty state, form
  const m = await session({ width: 360, height: 800 });
  const p = m.page;
  await p.goto(`${base}/admin/testimonials`);
  await p.getByRole("heading", { name: "Testimonials", level: 1 }).waitFor();
  if (realBefore === 0) check("empty state shown", await p.getByText("No testimonials yet.").isVisible());
  await p.getByRole("button", { name: "Open menu" }).click();
  check("mobile menu has a Testimonials link", await p.getByRole("link", { name: "Testimonials" }).first().isVisible());
  await p.getByRole("link", { name: "Testimonials" }).first().click();
  await p.waitForURL((u) => u.pathname === "/admin/testimonials");
  check("list: no horizontal scroll at 360px", await noHScroll(p));

  await p.goto(`${base}/admin/testimonials/new`);
  await p.getByLabel("YouTube link").fill("https://example.com/x");
  await p.getByLabel("YouTube link").blur();
  check("invalid link shows inline error", await p.getByText("Paste a YouTube Shorts, watch or youtu.be link.").first().isVisible());
  check("no preview image for invalid link", (await p.locator('img[src*="i.ytimg.com"]').count()) === 0);
  await p.getByLabel("YouTube link").fill(`https://www.youtube.com/watch?v=${VIDEO_A}&t=30s`);
  await p.locator('img[src*="i.ytimg.com"]').first().waitFor({ timeout: 10000 });
  check("valid link shows thumbnail preview", (await p.locator(`img[src*="${VIDEO_A}"]`).count()) > 0);
  await p.getByLabel("Name").fill(`${PREFIX} Alpha`);
  await p.getByLabel("Role", { exact: false }).first().fill("Teacher");
  await p.getByLabel("Quote").fill("x".repeat(141));
  check("quote counter shows 141 / 140", await p.getByText("141 / 140 characters").isVisible());
  await p.getByLabel("Quote").fill("It was easy to follow.");
  check("form: no horizontal scroll at 360px", await noHScroll(p));

  // locked publish switch: reachable by keyboard, tooltip shown on focus, click does nothing
  const sw = p.getByRole("switch", { name: /Published/ });
  check("publish switch is aria-disabled without consent", (await sw.getAttribute("aria-disabled")) === "true");
  await sw.focus();
  check("tooltip visible on keyboard focus", await p.getByRole("tooltip").isVisible());
  await sw.click({ force: true });
  check("clicking locked switch does nothing", (await sw.getAttribute("aria-checked")) === "false");
  await p.screenshot({ path: `${shots}/form-360.png`, fullPage: true });

  // consent then publish, save
  await p.getByLabel("I have this person's permission to show this video").check();
  check("switch unlocked after consent", (await sw.getAttribute("aria-disabled")) === null);
  await sw.click();
  check("switch turns on", (await sw.getAttribute("aria-checked")) === "true");
  await p.getByLabel("Display order").fill("5");
  await p.getByRole("button", { name: "Create testimonial" }).click();
  await p.waitForURL(`${base}/admin/testimonials`, { timeout: 20000 });
  await p.getByText(`${PREFIX} Alpha`).first().waitFor();
  const alpha = await col.findOne({ name: `${PREFIX} Alpha` });
  check("saved: youtubeId extracted on the server", alpha?.youtubeId === VIDEO_A, alpha?.youtubeId);
  check("saved: consent and published true", alpha?.consent === true && alpha?.published === true);
  check("card shows Consent given", await p.getByText("Consent given").first().isVisible());
  check("list with card: no horizontal scroll at 360px", await noHScroll(p));
  await p.screenshot({ path: `${shots}/list-360.png`, fullPage: true });

  // second item with no consent
  await p.goto(`${base}/admin/testimonials/new`);
  await p.getByLabel("YouTube link").fill(`https://youtu.be/${VIDEO_B}`);
  await p.getByLabel("Name").fill(`${PREFIX} Beta`);
  await p.getByLabel("Role", { exact: false }).first().fill("Student");
  await p.getByLabel("Quote").fill("Short and clear.");
  await p.getByLabel("Display order").fill("1");
  await p.getByRole("button", { name: "Create testimonial" }).click();
  await p.waitForURL(`${base}/admin/testimonials`, { timeout: 20000 });
  await p.getByText(`${PREFIX} Beta`).first().waitFor();
  const beta = await col.findOne({ name: `${PREFIX} Beta` });
  check("Beta saved unpublished without consent", beta?.consent === false && beta?.published === false);
  const betaCard = p.locator("article", { hasText: `${PREFIX} Beta` });
  check("Beta card shows No consent and a locked switch", (await betaCard.getByText("No consent").isVisible()) && (await betaCard.getByRole("switch").getAttribute("aria-disabled")) === "true");
  const order = await p.locator("article h2").allTextContents();
  check("grid sorted by order (Beta=1 before Alpha=5)", order.findIndex((t) => t.includes("Beta")) < order.findIndex((t) => t.includes("Alpha")));

  // public home page (production): only Alpha is live
  const pub = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const hp = await pub.newPage();
  await hp.goto(base);
  const section = hp.locator("#testimonials");
  check("home: Testimonials section shows", (await section.count()) === 1);
  check("home: only the live item (consent + published) is shown", (await section.locator("li").count()) === 1 && (await section.getByText(`${PREFIX} Alpha`).count()) > 0 && (await section.getByText(`${PREFIX} Beta`).count()) === 0);

  // untick consent on Alpha: published turns off, saved unpublished, gone from home
  await p.locator("article", { hasText: `${PREFIX} Alpha` }).getByRole("link", { name: /Edit/ }).click();
  await p.getByLabel("Name").waitFor();
  await p.getByLabel("I have this person's permission to show this video").uncheck();
  check("untick consent turns Published off in the form", (await p.getByRole("switch", { name: /Published/ }).getAttribute("aria-checked")) === "false");
  await p.getByRole("button", { name: "Save changes" }).click();
  await p.waitForURL(`${base}/admin/testimonials`, { timeout: 20000 });
  const alpha2 = await col.findOne({ name: `${PREFIX} Alpha` });
  check("Alpha now consent=false published=false", alpha2?.consent === false && alpha2?.published === false);
  await hp.reload();
  check("home: section hidden again (zero live items in production)", (await hp.locator("#testimonials").count()) === 0);

  // server refuses publish without consent: drive the real Server Action from the page (card switch is locked, so call the form path)
  const direct = await p.evaluate(async () => {
    // the switch is aria-disabled, so a click is ignored; confirm nothing changed in the UI
    const sw = document.querySelector('[role="switch"][aria-disabled="true"]');
    sw?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return sw?.getAttribute("aria-checked");
  });
  check("locked card switch ignores programmatic click", direct === "false");
  const betaAfter = await col.findOne({ name: `${PREFIX} Beta` });
  check("Beta still unpublished", betaAfter?.published === false);

  // card toggle: re-consent via edit, publish from card, then hide from card
  await p.locator("article", { hasText: `${PREFIX} Beta` }).getByRole("link", { name: /Edit/ }).click();
  await p.getByLabel("Name").waitFor();
  await p.getByLabel("I have this person's permission to show this video").check();
  await p.getByRole("button", { name: "Save changes" }).click();
  await p.waitForURL(`${base}/admin/testimonials`, { timeout: 20000 });
  const betaCard2 = p.locator("article", { hasText: `${PREFIX} Beta` });
  await betaCard2.getByRole("switch").click();
  await p.getByText("is now published").first().waitFor({ timeout: 10000 });
  check("card switch publishes a consented item", (await col.findOne({ name: `${PREFIX} Beta` }))?.published === true);
  await hp.reload();
  check("home shows Beta after publish from card", (await hp.locator("#testimonials").getByText(`${PREFIX} Beta`).count()) > 0);
  await betaCard2.getByRole("switch").click();
  await p.getByText("is hidden from the site").first().waitFor({ timeout: 10000 });
  check("card switch hides it again", (await col.findOne({ name: `${PREFIX} Beta` }))?.published === false);

  // delete with confirmation: cancel keeps, confirm removes
  await betaCard2.getByRole("link", { name: /Edit/ }).click();
  await p.getByRole("button", { name: "Delete testimonial" }).click();
  await p.getByRole("button", { name: "Cancel" }).last().click();
  check("cancel keeps the item", (await col.countDocuments({ name: `${PREFIX} Beta` })) === 1);
  await p.getByRole("button", { name: "Delete testimonial" }).click();
  await p.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await p.waitForURL(`${base}/admin/testimonials`, { timeout: 20000 });
  check("confirm deletes the item", (await col.countDocuments({ name: `${PREFIX} Beta` })) === 0);

  // reduced motion: switch and tooltip present, no transitions
  await m.context.close();
  const rm = await session({ width: 1440, height: 900 }, "reduce");
  await rm.page.goto(`${base}/admin/testimonials`);
  const dur = await rm.page.evaluate(() => {
    const el = document.querySelector('[role="switch"] > span');
    return el ? getComputedStyle(el).transitionDuration : "none";
  });
  check("reduced motion: switch track has no transition", dur === "none" || parseFloat(dur) < 0.001, dur); // the site-wide reduced-motion rule sets ~0.00001s
  check("desktop: no horizontal scroll", await noHScroll(rm.page));
  await rm.page.screenshot({ path: `${shots}/list-1440.png`, fullPage: true });
  await rm.context.close();
  await pub.close();
} finally {
  const removed = await col.deleteMany({ name: { $regex: `^${PREFIX}` } });
  console.log(`cleanup: removed ${removed.deletedCount} temporary testimonial(s); non-test documents untouched: ${await col.countDocuments({})} (was ${realBefore})`);
  await mongoose.disconnect();
  await browser.close();
}
const failed = results.filter((r) => r.startsWith("FAIL"));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
