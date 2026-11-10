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

await browser.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
