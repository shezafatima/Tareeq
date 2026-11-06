// Feature 015 check: /programs and /programs/[slug]. Writes temporary programs to the dev database and removes them.
// Usage: CHROME=<path> BASE=http://localhost:3100 [WA=0] node --env-file=.env.local scripts/programs-pages-check.mjs
// WA=0 expects a build made with no WhatsApp number. Refuses to run against any database other than tareeq_dev.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { MongoClient } from "mongodb";

const base = process.env.BASE ?? "http://localhost:3100";
const expectWa = process.env.WA !== "0";
const uri = process.env.MONGODB_URI;
if (new URL(uri).pathname !== "/tareeq_dev") throw new Error("Refusing: not the tareeq_dev database");
mkdirSync("shots/015", { recursive: true });

const mongo = await new MongoClient(uri).connect();
const programs = mongo.db().collection("programs");
const b = await chromium.launch({ executablePath: process.env.CHROME });
let pass = 0;
let fail = 0;
const check = (n, ok, d = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : `  (${d})`}`);
};

const WIDTHS = [360, 390, 768, 1024, 1440];
const SLUGS = ["teachers-workshop", "student-workshops", "college-university", "corporate-teams"];
const FIXED = "online-courses"; // the fixed card, last in the list; not a stored program
const FILTERS = { teachers: "teachers-workshop", students: "student-workshops", college: "college-university", online: FIXED, corporate: "corporate-teams" };
const NAVY = "rgb(13, 27, 61)";
const PAPER = "rgb(250, 247, 242)";
const SOFT = "rgb(230, 240, 255)";

async function open(ctx, path, { js = true } = {}) {
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/404/.test(m.text())) p.errors.push(m.text()); });
  await p.goto(base + path, { waitUntil: "load" });
  if (js) {
    await p.waitForFunction(() => document.documentElement.getAttribute("data-preloader") !== "run", null, { timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(400);
  }
  return p;
}
const noHScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const visibleItems = (p) =>
  p.evaluate(() => [...document.querySelectorAll("#program-list > li")].filter((li) => getComputedStyle(li).display !== "none").map((li) => li.dataset.item));
const panelBg = (p) =>
  p.evaluate(() => [...document.querySelectorAll("#program-list > li")].filter((li) => getComputedStyle(li).display !== "none").map((li) => getComputedStyle(li.querySelector(".program-panel")).backgroundColor));

// WCAG contrast of each text element in a panel against the panel's surface
const panelContrast = (p) =>
  p.evaluate(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    const parse = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const blend = (f, bg) => [0, 1, 2].map((i) => f[i] * f[3] + bg[i] * (1 - f[3]));
    const lum = (c) => { const a = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
    const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c[3] > 0.99) return c; } return [250, 247, 242, 1]; };
    return [...document.querySelectorAll(".program-panel")].flatMap((panel) =>
      [...panel.querySelectorAll("h2, p, dd, a")].filter((e) => e.textContent.trim()).map((e) => {
        const bg = bgOf(e);
        const f = blend(parse(getComputedStyle(e).color), bg);
        const [x, y] = [lum(f), lum(bg)];
        return { text: e.textContent.trim().slice(0, 24), r: (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) };
      }));
  });

// ---------- Index ----------
for (const w of WIDTHS) {
  const tag = `[${w}px] /programs`;
  const phone = w < 1024;
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, hasTouch: phone, isMobile: phone });
  const p = await open(ctx, "/programs");

  check(`${tag} one h1, "Pick your way in."`, (await p.locator("h1").count()) === 1 && (await p.locator("h1").innerText()) === "Pick your way in.");
  check(`${tag} all programs in order, coming-soon last`, JSON.stringify(await visibleItems(p)) === JSON.stringify([...SLUGS, FIXED]), (await visibleItems(p)).join());
  check(`${tag} surfaces alternate`, JSON.stringify(await panelBg(p)) === JSON.stringify([NAVY, PAPER, NAVY, PAPER, SOFT]), (await panelBg(p)).join());
  check(`${tag} six chips, All pressed`, (await p.locator(".program-filter button").count()) === 6 && (await p.locator('.program-filter button[aria-pressed="true"]').innerText()) === "All");
  check(`${tag} no horizontal scroll`, await noHScroll(p));
  const small = await p.evaluate(() => [...document.querySelectorAll(".program-filter button, .program-panel a")].filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.textContent.trim()));
  check(`${tag} controls at least 44px tall`, small.length === 0, small.join());
  const low = (await panelContrast(p)).filter((c) => c.r < 4.5);
  check(`${tag} panel text passes AA`, low.length === 0, JSON.stringify(low.slice(0, 3)));
  const each = await p.evaluate(() => [...document.querySelectorAll("#program-list > li:not([data-fixed]) .program-panel")].every((a) => a.querySelector("h2") && a.querySelector('a[href^="/programs/"]') && a.querySelectorAll("dd").length <= 3 && a.querySelectorAll("dd").length >= 1));
  check(`${tag} each panel has title, link and 1-3 facts`, each);
  const fixed = p.locator('#program-list > li[data-fixed]');
  check(`${tag} fixed Online courses card links to /register, with no number or program page`, (await fixed.locator("h2").innerText()) === "Online courses" && (await fixed.locator('a[href="/register"]').count()) === 1 && (await fixed.locator(".program-number").count()) === 0 && (await fixed.locator('a[href^="/programs/"]').count()) === 0);

  // filter chips
  const requests = [];
  p.on("request", (r) => { if (new URL(r.url()).pathname === "/programs") requests.push(r.url()); }); // links elsewhere may prefetch as they come into view
  const historyBefore = await p.evaluate(() => history.length);
  for (const [value, slug] of Object.entries(FILTERS)) {
    await p.locator(".program-filter button", { hasText: new RegExp(`^${value}$`, "i") }).click();
    const list = await visibleItems(p);
    check(`${tag} "${value}" shows only its program`, JSON.stringify(list) === JSON.stringify([slug]), list.join());
    check(`${tag} "${value}" sets the address`, new URL(p.url()).searchParams.get("for") === value, p.url());
    check(`${tag} "${value}" first visible panel has the right surface`, (await panelBg(p))[0] === (value === "online" ? SOFT : NAVY));
    check(`${tag} "${value}" announces the count`, (await p.locator('.program-filter [role="status"]').innerText()) === "1 program");
    check(`${tag} "${value}" no horizontal scroll`, await noHScroll(p));
  }
  if (w === 1440 || w === 390) await p.screenshot({ path: `shots/015/filter-corporate-${w}.png` });
  check(`${tag} filtering sends no requests`, requests.length === 0, requests.join());
  check(`${tag} filtering adds no history entries`, (await p.evaluate(() => history.length)) === historyBefore);
  await p.locator(".program-filter button", { hasText: /^All$/ }).click();
  check(`${tag} "All" restores everything and clears the address`, (await visibleItems(p)).length === 5 && !p.url().includes("for="), p.url());
  check(`${tag} no console errors`, p.errors.length === 0, p.errors.join(" | ").slice(0, 200));
  await p.close();

  // shared links
  const shared = await open(ctx, "/programs?for=college");
  check(`${tag} shared link shows only its program`, JSON.stringify(await visibleItems(shared)) === '["college-university"]');
  check(`${tag} shared link presses its chip`, (await shared.locator('.program-filter button[aria-pressed="true"]').innerText()) === "College");
  await shared.close();
  const junk = await open(ctx, "/programs?for=xyz");
  check(`${tag} unknown filter shows everything`, (await visibleItems(junk)).length === 5);
  check(`${tag} unknown filter causes no errors`, junk.errors.length === 0, junk.errors.join(" | ").slice(0, 200));
  await junk.close();

  // covers and hover
  const h = await open(ctx, "/programs");
  if (phone) {
    check(`${tag} no cover on touch or phone`, await h.evaluate(() => [...document.querySelectorAll(".program-panel__cover")].every((c) => getComputedStyle(c).display === "none")));
  } else {
    const measure = () => h.evaluate(() => [...document.querySelectorAll(".program-panel")].map((a) => a.offsetWidth + "x" + a.offsetHeight).join() + "/" + document.documentElement.scrollHeight);
    const before = await measure();
    for (const [i, surface] of [[0, "navy"], [1, "paper"]]) {
      const panel = h.locator(".program-panel").nth(i);
      await panel.hover();
      await h.waitForTimeout(450);
      const s = await panel.evaluate((a) => {
        const num = a.querySelector(".program-number");
        return {
          transform: getComputedStyle(a).transform,
          cover: getComputedStyle(a.querySelector(".program-panel__cover")).opacity,
          plain: getComputedStyle(num, "::before").opacity,
          saffron: getComputedStyle(num, "::after").opacity,
          shape: getComputedStyle(a.querySelector(".program-number__shape")).opacity,
          overlap: a.querySelector(".program-panel__body").getBoundingClientRect().right <= a.querySelector(".program-panel__cover").getBoundingClientRect().left,
        };
      });
      check(`${tag} ${surface} hover expands the panel`, s.transform !== "none", s.transform);
      check(`${tag} ${surface} hover reveals the cover clear of the text`, s.cover === "1" && s.overlap, JSON.stringify(s));
      if (surface === "navy") check(`${tag} navy hover shows saffron numerals`, s.saffron === "1" && s.plain === "0", JSON.stringify(s));
      else check(`${tag} paper hover shows a saffron shape, never saffron numerals`, s.shape === "1" && s.saffron === "0" && s.plain === "1", JSON.stringify(s));
      check(`${tag} ${surface} hover: no horizontal scroll`, await noHScroll(h));
    }
    const after = await measure();
    check(`${tag} hover causes no layout shift`, before === after, `${before} then ${after}`);
    await h.mouse.move(0, 0);
    await h.locator('.program-panel').nth(2).locator("a").first().focus();
    await h.waitForTimeout(450);
    check(`${tag} keyboard focus gives the same reveal`, (await h.locator(".program-panel__cover").nth(2).evaluate((c) => getComputedStyle(c).opacity)) === "1");
    const props = await h.evaluate(() => {
      const a = document.querySelector(".program-panel");
      return [getComputedStyle(a).transitionProperty, getComputedStyle(a.querySelector(".program-panel__cover")).transitionProperty, getComputedStyle(a.querySelector(".program-number"), "::before").transitionProperty, getComputedStyle(a.querySelector(".program-number__shape")).transitionProperty];
    });
    check(`${tag} animates only transform and opacity`, props.join(",").split(/,\s*/).every((x) => x === "transform" || x === "opacity"), props.join(" | "));
  }
  await ctx.close();
}

// shared link before any JavaScript from the app has run: nothing else may flash
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.route("**/_next/static/chunks/**/*.js", (r) => r.abort());
  await p.goto(`${base}/programs?for=online`, { waitUntil: "load" });
  check("shared link is filtered before the app loads", JSON.stringify(await visibleItems(p)) === '["online-courses"]', (await visibleItems(p)).join());
  await ctx.close();
}

// JavaScript off
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const p = await open(ctx, "/programs", { js: false });
  check("no JavaScript: all programs in the page", (await p.locator("#program-list > li").count()) === 5);
  check("no JavaScript: chips hidden", !(await p.locator(".program-filter").isVisible()));
  check("no JavaScript: panels visible", await p.locator(".program-panel").first().isVisible());
  const d = await open(ctx, "/programs/teachers-workshop", { js: false });
  check("no JavaScript: timeline visible", await d.locator(".program-timeline__step").first().isVisible());
  await ctx.close();
}

// reduced motion
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await open(ctx, "/programs");
  const hidden = await p.evaluate(() => [...document.querySelectorAll("#program-list > li")].filter((li) => getComputedStyle(li).opacity !== "1").length);
  check("reduced motion: every panel shown at once", hidden === 0, String(hidden));
  const panel = p.locator(".program-panel").first();
  await panel.hover();
  await p.waitForTimeout(100);
  const s = await panel.evaluate((a) => ({ t: getComputedStyle(a).transform, ct: getComputedStyle(a.querySelector(".program-panel__cover")).transform, co: getComputedStyle(a.querySelector(".program-panel__cover")).opacity }));
  check("reduced motion: hover shows the cover with no movement", s.t === "none" && s.ct === "none" && s.co === "1", JSON.stringify(s));
  const d = await open(ctx, "/programs/teachers-workshop");
  check("reduced motion: timeline shown at once", await d.evaluate(() => [...document.querySelectorAll(".program-timeline__step")].every((e) => getComputedStyle(e).opacity === "1" && getComputedStyle(e).transform === "none")));
  await ctx.close();
}

// ---------- Detail ----------
const stamp = Date.now();
const TEMP = { draft: `qa-draft-${stamp}`, bare: `qa-bare-${stamp}`, unsafe: `qa-unsafe-${stamp}` };
const doc = (slug, over) => ({ slug, title: `QA ${slug}`, audience: "teachers", status: "register-interest", ctaType: "register", summary: "QA summary", description: "", outcomes: [], curriculum: [], facts: { format: "", duration: "", groupSize: "", location: "" }, priceText: "", order: 99, published: true, createdAt: new Date(), updatedAt: new Date(), ...over });
await programs.insertMany([
  doc(TEMP.draft, { published: false }),
  doc(TEMP.bare),
  doc(TEMP.unsafe, { description: 'Safe words <script>window.__xss=1</script><img src="x" onerror="window.__xss=2"> [bad](javascript:window.__xss=3)\n\n# Top' }),
]);

try {
  const status = async (path) => (await fetch(base + path)).status;
  check("unknown slug gives 404", (await status(`/programs/qa-none-${stamp}`)) === 404);
  check("malformed slug gives 404", (await status("/programs/NOT_a_slug")) === 404);
  check("unpublished program gives 404", (await status(`/programs/${TEMP.draft}`)) === 404);
  check("program added after the build works without a rebuild", (await status(`/programs/${TEMP.bare}`)) === 200);
  check("online courses have no program page", (await status("/programs/online-courses")) === 404);

  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const bare = await open(ctx, `/programs/${TEMP.bare}`);
  check("empty blocks leave no headings", (await bare.locator("main h2").count()) === 0, (await bare.locator("main h2").allInnerTexts()).join());
  check("no cover means the brand pattern shows", await bare.locator("header.relative .program-pattern").isVisible());
  const unsafe = await open(ctx, `/programs/${TEMP.unsafe}`);
  check("unsafe description does not run", (await unsafe.evaluate(() => window.__xss)) === undefined);
  const prose = await unsafe.locator(".program-prose").innerHTML();
  check("unsafe markup stripped, safe words kept", !/<script|<img|javascript:/.test(prose) && /Safe words/.test(prose), prose);
  check("markdown h1 becomes h2: one h1 on the page", (await unsafe.locator("h1").count()) === 1);
  await ctx.close();

  for (const slug of SLUGS) {
    const res = await fetch(`${base}/programs/${slug}`);
    const html = await res.text();
    const stored = await programs.findOne({ slug });
    const meta = (key) => (html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`)) ?? [])[1]?.replace(/&amp;/g, "&");
    check(`${slug}: 200`, res.status === 200);
    check(`${slug}: page title`, html.includes(`<title>${stored.title.replace(/&/g, "&amp;")} | Tareeq</title>`));
    check(`${slug}: description and Open Graph are its own`, meta("description") === stored.summary && meta("og:title") === stored.title && meta("og:description") === stored.summary, `${meta("og:title")}`);
    check(`${slug}: Open Graph image and address`, /robot\.png/.test(meta("og:image") ?? "") && (meta("og:url") ?? "").endsWith(`/programs/${slug}`));
  }

  for (const w of [360, 390, 1024, 1440]) {
    const desktop = w >= 1024;
    const c = await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: !desktop, isMobile: !desktop });
    for (const slug of SLUGS) {
      const tag = `[${w}px] ${slug}`;
      const stored = await programs.findOne({ slug });
      const p = await open(c, `/programs/${slug}`);
      check(`${tag} one h1`, (await p.locator("h1").count()) === 1);
      check(`${tag} no horizontal scroll`, await noHScroll(p));
      const headings = await p.locator("main h2").allInnerTexts();
      check(`${tag} outcomes, timeline, facts`, ["You'll leave with", "What we'll work through", "The details"].every((x) => headings.includes(x)), headings.join());
      check(`${tag} timeline steps`, (await p.locator(".program-timeline__step").count()) === stored.curriculum.length);

      const scope = desktop ? p.locator(".program-booking-card") : p.locator("[data-program-cta-bar]");
      check(`${tag} ${desktop ? "booking card" : "bottom bar"} visible, price shown`, (await scope.isVisible()) && (await scope.innerText()).includes(stored.priceText));
      check(`${tag} the other one hidden`, !(await (desktop ? p.locator("[data-program-cta-bar]") : p.locator(".program-booking-card")).isVisible()));
      const cta = scope.locator("a").first();
      const href = await cta.getAttribute("href");
      const want = stored.ctaType === "workshop-modal" ? "/workshop?book=1" : stored.ctaType === "register" ? "/register" : expectWa ? "https://wa.me/" : "#footer-";
      check(`${tag} call to action goes to ${want}`, href.startsWith(want), href);
      if (stored.ctaType === "whatsapp" && expectWa) check(`${tag} WhatsApp message names the program`, decodeURIComponent(href).includes(stored.title));
      check(`${tag} call to action at least 44px`, (await cta.boundingBox()).height >= 44);

      await p.evaluate(() => window.scrollTo(0, 700));
      await p.waitForTimeout(200);
      if (desktop) {
        const top = (await scope.boundingBox()).y;
        const header = await p.evaluate(() => document.querySelector("header").getBoundingClientRect().bottom);
        check(`${tag} booking card stays in view below the header`, top >= header && top < 200, String(top));
      } else {
        const bar = await scope.boundingBox();
        check(`${tag} bar stays at the bottom`, Math.abs(bar.y + bar.height - 800) < 2, JSON.stringify(bar));
        const wa = p.locator("[data-whatsapp-float]");
        if (expectWa) {
          const f = await wa.boundingBox();
          check(`${tag} floating button clear of the bar`, f.y + f.height <= bar.y, `${f.y + f.height} > ${bar.y}`);
        }
        await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await p.waitForTimeout(300);
        const end = await p.evaluate(() => document.querySelector("footer").getBoundingClientRect().bottom);
        check(`${tag} bar covers no page content`, end <= (await scope.boundingBox()).y + 1, String(end));
      }
      check(`${tag} no console errors`, p.errors.length === 0, p.errors.join(" | ").slice(0, 200));
      await p.close();
    }
    await c.close();
  }

  // the call to action really works
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await open(c, "/programs/teachers-workshop");
  await p.locator(".program-booking-card a").first().click();
  await p.waitForURL("**/workshop?book=1", { timeout: 15000 });
  await p.locator('[role="dialog"]').waitFor({ state: "visible", timeout: 10000 });
  check("workshop call to action opens the booking dialog", await p.locator('[role="dialog"]').isVisible());
  const r = await open(c, `/programs/${TEMP.bare}`);
  await r.locator(".program-booking-card a").first().click();
  await r.waitForURL("**/register", { timeout: 15000 });
  check("register call to action reaches the form", (await r.locator("#field-fullName").count()) === 1);
  const f = await open(c, "/programs?for=online");
  await f.locator('#program-list > li[data-fixed] a[href="/register"]').click();
  await f.waitForURL("**/register", { timeout: 15000 });
  check("fixed card reaches the form", (await f.locator("#field-fullName").count()) === 1);
  const index = await open(c, "/programs");
  await index.locator('.program-panel a[href="/programs/student-workshops"]').click();
  await index.waitForURL("**/programs/student-workshops", { timeout: 15000 });
  check("View program opens the program page", (await index.locator("h1").innerText()) === "School student workshops");
  await index.goBack();
  await index.waitForURL("**/programs", { timeout: 15000 });
  check("back to the index keeps the page working", (await visibleItems(index)).length === 5);
  await c.close();
} finally {
  await programs.deleteMany({ slug: { $in: Object.values(TEMP) } });
}

// ---------- Database down ----------
{
  const port = 3199;
  const url = `http://localhost:${port}`;
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { env: { ...process.env, MONGODB_URI: "mongodb://127.0.0.1:1/x" }, stdio: "ignore" });
  try {
    for (let i = 0; i < 60; i++) {
      if (await fetch(url).then(() => true, () => false)) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    const home = await fetch(url);
    check("database down: home page loads", home.status === 200);
    const index = await fetch(`${url}/programs`);
    check("database down: /programs keeps its last good page", index.status === 200 && (await index.text()).includes("AI for Teachers workshop"));
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    const res = await p.goto(`${url}/programs/qa-never-built-${stamp}`, { waitUntil: "load" });
    await p.waitForTimeout(500);
    const text = await p.locator("main").innerText().catch(() => "");
    check("database down: a new program page shows the error state, not a 404", res.status() !== 404 && /Something went wrong on our side/.test(text), `${res.status()} ${text.slice(0, 80)}`);
    check("database down: no raw error shown", !/mongo|ECONN|stack/i.test(text));
    await ctx.close();
  } finally {
    server.kill();
  }
}

await b.close();
await mongo.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
