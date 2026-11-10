// End-to-end checks for the admin panel (feature 022): guards, sign-in, rate limit, indexing, then (as they land) leads and programs.
// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... BASE=http://localhost:3000 [CHROME=<path>] node scripts/admin-check.mjs
// Start the dev server with the same ADMIN_EMAIL, an ADMIN_PASSWORD_HASH made from ADMIN_PASSWORD, and AUTH_SECRET.
// Each run uses made-up network addresses (the sign-in limit counts per address), so repeated runs never share a count.
import { mkdirSync } from "node:fs";
import { chromium, request } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3000";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (the plain password behind the running server's hash).");
  process.exit(2);
}
const shots = "shots/022";
mkdirSync(shots, { recursive: true });

const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

const runRange = 1 + Math.floor(Math.random() * 250);
let nextHost = 10;
const freshAddress = () => `198.18.${runRange}.${nextHost++}`;

const browser = await chromium.launch({ executablePath: process.env.CHROME });

async function session(viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, extraHTTPHeaders: { "x-forwarded-for": freshAddress() } });
  return { context, page: await context.newPage() };
}

async function signIn(page, pw = password, mail = email) {
  await page.goto(`${base}/admin/login`);
  await page.getByLabel("Email").fill(mail);
  await page.getByLabel("Password").fill(pw);
  await page.getByRole("button", { name: /sign in/i }).click();
}

// ---------- US1: guards
{
  const api = await request.newContext({ baseURL: base, maxRedirects: 0 });
  for (const path of ["/admin", "/admin/programs", "/admin/programs/new", "/admin/programs/000000000000000000000000/edit"]) {
    const res = await api.get(path);
    const where = res.headers()["location"] ?? "";
    check(`logged out: ${path} redirects to login`, res.status() >= 300 && res.status() < 400 && where.endsWith("/admin/login"), `${res.status()} ${where}`);
  }
  const robots = await (await api.get("/robots.txt")).text();
  check("robots.txt disallows /admin", /Disallow:\s*\/admin/.test(robots));
  const login = await api.get("/admin/login");
  check("login page sends X-Robots-Tag noindex", /noindex/.test(login.headers()["x-robots-tag"] ?? ""));
  check("login page has a noindex meta tag", /<meta name="robots" content="noindex/.test(await login.text()));
  const sess = await api.get("/api/auth/session");
  const body = (await sess.text()).trim();
  check("no session cookie: /api/auth/session is empty", sess.ok() && (body === "null" || body === "{}" || body === ""), body.slice(0, 40));
  await api.dispose();
}

// ---------- US1: sign-in and rate limit
{
  const { context, page } = await session();
  await signIn(page, "definitely-wrong-password");
  await page.getByText("Invalid credentials").waitFor({ timeout: 15000 });
  check("wrong password shows the generic message", true);
  await page.screenshot({ path: `${shots}/login-error-1440.png` });
  for (let i = 0; i < 4; i++) {
    await signIn(page, `wrong-attempt-${i}`);
    await page.getByText("Invalid credentials").waitFor({ timeout: 15000 });
  }
  check("five wrong attempts all show 'Invalid credentials'", true);
  await signIn(page, password); // the sixth attempt, with the RIGHT password
  const locked = await page.getByText(/too many attempts/i).waitFor({ timeout: 15000 }).then(() => true, () => false);
  check("the 6th attempt in 15 minutes is blocked even with the right password", locked && !page.url().endsWith("/admin"));
  await context.close();
}
{
  const { context, page } = await session();
  await signIn(page, "nope", "someone-else@example.com");
  await page.getByText("Invalid credentials").waitFor({ timeout: 15000 });
  check("unknown email shows the same generic message", true);
  await context.close();
}
{
  const { context, page } = await session({ width: 360, height: 740 });
  await page.goto(`${base}/admin/login`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  check("login page has no horizontal scroll at 360px", !overflow);
  await page.screenshot({ path: `${shots}/login-360.png` });
  await context.close();
}
{
  const { context, page } = await session();
  await signIn(page);
  await page.waitForURL(`${base}/admin`, { timeout: 20000 });
  check("correct credentials open /admin", (await page.locator("h1").first().innerText()).trim() === "Submissions");
  await page.screenshot({ path: `${shots}/panel-1440.png` });
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL(/\/admin\/login/, { timeout: 15000 });
  await page.goto(`${base}/admin`);
  check("after log out /admin sends the visitor back to login", page.url().endsWith("/admin/login"));
  await context.close();
}

// ---------- US2: leads (needs the test leads from scripts/admin-seed-test-leads.mts)
if (process.env.SKIP_LEADS !== "1") {
  const { context, page } = await session();
  await signIn(page);
  await page.waitForURL(`${base}/admin`, { timeout: 20000 });

  // stat strip, filters in the address
  const strip = page.getByRole("list", { name: "Submissions by status" });
  await strip.getByRole("link", { name: /^Contacted/ }).click();
  await page.waitForURL(/status=contacted/);
  const contactedRows = await page.locator("tbody tr").count();
  const chips = await page.locator("tbody tr td:nth-child(4)").allInnerTexts();
  check("a stat card applies its status filter", contactedRows >= 1 && chips.every((c) => c.trim() === "Contacted"), `${contactedRows} rows`);
  await page.reload();
  check("the status filter survives a refresh", /status=contacted/.test(page.url()) && (await page.locator("tbody tr").count()) === contactedRows);
  await page.goto(`${base}/admin`);

  await page.getByLabel("Search by name, phone, email or organization").fill("Ayesha");
  await page.waitForURL(/q=Ayesha/);
  check("search by name filters the list", (await page.locator("tbody tr").count()) >= 1 && (await page.getByRole("link", { name: "QA Ayesha Workshop" }).count()) === 1);
  await page.getByLabel("Search by name, phone, email or organization").fill("0300 1110002");
  await page.waitForURL(/q=0300/);
  check("search by phone (typed with a leading 0) finds the lead", (await page.getByRole("link", { name: "QA Bilal Workshop" }).count()) === 1);
  await page.getByLabel("Search by name, phone, email or organization").fill("QA Sunrise");
  await page.waitForURL(/q=QA\+Sunrise|q=QA%20Sunrise/);
  check("search by organization finds the lead", (await page.getByRole("link", { name: "QA Ayesha Workshop" }).count()) === 1);
  await page.goto(`${base}/admin?type=course`);
  check("type filter shows course sign-ups only", (await page.locator("tbody tr td:nth-child(2)").allInnerTexts()).every((t) => t.trim() === "Course sign-up"));
  for (const bad of ["?page=999", "?status=bogus", "?type=bogus", "?lead=bogus", "?lead=ffffffffffffffffffffffff"]) {
    const res = await page.goto(`${base}/admin${bad}`);
    check(`odd address ${bad} does not error`, res?.status() === 200 && (await page.locator("h1").first().innerText()).trim() === "Submissions");
  }

  // the detail drawer
  await page.goto(`${base}/admin?q=QA+Ayesha`);
  const rowLink = page.getByRole("link", { name: "QA Ayesha Workshop" });
  await rowLink.click();
  const drawer = page.getByRole("dialog", { name: /Submission from QA Ayesha Workshop/ });
  await drawer.waitFor();
  check("clicking a row opens the detail drawer with ?lead=<id>", /lead=[0-9a-f]{24}/.test(page.url()));
  check("the drawer shows the stored fields", (await drawer.innerText()).includes("QA Sunrise School") && (await drawer.innerText()).includes("Lahore"));
  const wa = await drawer.getByRole("link", { name: /Open in WhatsApp/ }).getAttribute("href");
  check("WhatsApp link goes to the lead's number with a greeting", /^https:\/\/wa\.me\/923001110001\?text=/.test(wa ?? ""));
  await page.screenshot({ path: `${shots}/drawer-1440.png` });

  await drawer.getByLabel("Status").selectOption("contacted");
  await page.getByText(/Status set to Contacted/).waitFor();
  await page.reload();
  check("a status change persists after a refresh", (await page.getByRole("dialog").getByLabel("Status").inputValue()) === "contacted");
  await page.getByRole("dialog").getByLabel("Status").selectOption("new");
  await page.getByText(/Status set to New/).waitFor();

  const note = `QA note ${Date.now()}`;
  await page.getByRole("dialog").getByLabel("Admin notes").fill(note);
  await page.getByRole("button", { name: "Save notes" }).click();
  await page.getByText("Notes saved").waitFor();
  await page.reload();
  check("notes persist after a refresh", (await page.getByRole("dialog").getByLabel("Admin notes").inputValue()) === note);
  await page.getByRole("dialog").getByLabel("Admin notes").fill("");
  await page.getByRole("button", { name: "Save notes" }).click();
  await page.getByText("Notes saved").first().waitFor();

  await page.keyboard.press("Escape");
  await drawer.waitFor({ state: "hidden" });
  const dropped = await page.waitForURL((u) => !/lead=/.test(u.href), { timeout: 10000 }).then(() => true, () => false);
  check("Escape closes the drawer and the address drops ?lead", dropped);
  check("focus returns to the row that opened it", await page.evaluate(() => document.activeElement?.textContent?.includes("QA Ayesha Workshop") ?? false));

  // delete with the in-app dialog
  await page.goto(`${base}/admin?q=QA+Hira`);
  await page.getByRole("link", { name: "QA Hira Course" }).click();
  await page.getByRole("button", { name: "Delete submission" }).click();
  const confirm = page.getByRole("alertdialog");
  await confirm.waitFor();
  await page.keyboard.press("Escape");
  await confirm.waitFor({ state: "hidden" });
  check("Escape closes only the confirmation, the drawer stays", (await page.getByRole("dialog").count()) === 1);
  await page.getByRole("button", { name: "Delete submission" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByText("Submission deleted").waitFor();
  await page.reload();
  check("a deleted submission is gone", (await page.getByRole("link", { name: "QA Hira Course" }).count()) === 0);

  // phone width: cards, full-screen drawer, no horizontal scroll
  const mobile = await session({ width: 360, height: 740 });
  await signIn(mobile.page);
  await mobile.page.waitForURL(`${base}/admin`, { timeout: 20000 });
  check("360px: the table is replaced by cards", (await mobile.page.locator("table").isVisible()) === false);
  await mobile.page.getByRole("link", { name: /QA Ayesha Workshop/ }).first().click();
  const md = mobile.page.getByRole("dialog");
  await md.waitFor();
  const box = await md.boundingBox();
  check("360px: the drawer fills the screen", Boolean(box) && box.width >= 359);
  const scroll = await mobile.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  check("360px: no horizontal scroll with the drawer open", !scroll);
  await mobile.page.screenshot({ path: `${shots}/drawer-360.png` });
  await mobile.page.keyboard.press("Escape");
  await mobile.page.screenshot({ path: `${shots}/submissions-360.png` });
  await mobile.context.close();
  await context.close();
}

await browser.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
