// Checks the home page sections and content. Usage: CHROME=<path> BASE=http://localhost:3100 node scripts/home-check.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE ?? "http://localhost:3100";
mkdirSync("shots/003", { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));
  const tag = `[${w}px]`;
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(7000); // preloader (6 s) then settle
  check(`${tag} exactly one h1`, (await p.locator("h1").count()) === 1);
  const headings = await p.locator("main section > div > div > h2, main section h2").allInnerTexts();
  const order = ["Programs", "Why Tareeq", "How it works", "Who it’s for"]; // feature 008: Programs, Why Tareeq, How it works, Who it’s for
  check(`${tag} section headings in order`, order.every((t, i) => headings.map((x) => x.trim())[i] === t), headings.join(" | "));
  check(`${tag} 4 audience cards (Teachers, School students, College students, Professionals and teams)`,
    JSON.stringify(await p.locator("section[aria-labelledby='who-title'] ul > li h3").allInnerTexts()) === JSON.stringify(["Teachers", "School students", "College students", "Professionals and teams"]),
    (await p.locator("section[aria-labelledby='who-title'] ul > li h3").allInnerTexts()).join(","));
  const steps = await p.locator("#how-it-works .hiw-card h3").count();
  check(`${tag} 3 steps`, steps === 3);
  check(`${tag} in "How it works" the cards hold no links or fields (only their example buttons take focus)`, (await p.locator("#how-it-works .hiw-card").evaluateAll((els) => els.reduce((n, el) => n + [...el.querySelectorAll("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((c) => !c.classList.contains("hiw-flip-btn")).length, 0))) === 0);
  check(`${tag} step names Prompt, Build, Learn`, JSON.stringify(await p.locator("#how-it-works .hiw-face-front h3").allTextContents()) === JSON.stringify(["Prompt", "Build", "Learn"]));
  const progs = await p.locator("section[aria-labelledby='programs-title'] ul > li").count();
  check(`${tag} 2 to 3 programs in the preview`, progs >= 2 && progs <= 3, String(progs));
  const progText = await p.locator("section[aria-labelledby='programs-title'] ul").innerText();
  check(`${tag} programs show who it's for, duration and format`, /Who it’s for/.test(progText) && /Duration/.test(progText) && /Format/.test(progText));
  check(`${tag} a coming-soon program is marked`, /coming soon/i.test(progText));
  check(`${tag} link to /programs`, (await p.locator('main a[href="/programs"]').count()) >= 1);
  const principles = await p.locator("section[aria-labelledby='why-title'] ol > li").count();
  check(`${tag} 4 Why Tareeq points`, principles === 4, String(principles));
  const cta = p.locator('main a:has-text("Join a workshop")');
  check(`${tag} "Join a workshop" button exists and goes to /workshop?book=1 (feature 006)`, (await cta.count()) === 1 && (await cta.getAttribute("href")) === "/workshop?book=1");
  const bodyText = await p.locator("main").innerText();
  check(`${tag} no hype words`, !/empower|unlock|revolutioni[sz]e/i.test(bodyText));
  check(`${tag} no horizontal scroll`, !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
  check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" / "));
  await p.screenshot({ path: `shots/003/home-${w}.png`, fullPage: true });
  await ctx.close();
}
await b.close();
console.log(results.join("\n"));
console.log(results.some((r) => r.startsWith("FAIL")) ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
