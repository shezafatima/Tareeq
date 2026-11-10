// Checks the admin panel when the database cannot be reached (feature 022, spec FR-028 / SC-011).
// Needs TWO servers: BASE (normal, to sign in) and DOWN_BASE (started with a MONGODB_URI that cannot connect, same AUTH_SECRET).
// The session is a signed cookie, so it works on both; that is exactly the situation after the database goes away mid-session.
// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... BASE=http://localhost:3022 DOWN_BASE=http://localhost:3023 node scripts/admin-db-down-check.mjs
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3022";
const down = process.env.DOWN_BASE ?? "http://localhost:3023";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(2);
}

const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
const address = `198.${18 + Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;

const browser = await chromium.launch({ executablePath: process.env.CHROME });
const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": address } });
const page = await context.newPage();

await page.goto(`${base}/admin/login`);
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password").fill(password);
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForURL(`${base}/admin`, { timeout: 20000 });

for (const path of ["/admin", "/admin/programs", "/admin/programs/000000000000000000000000/edit"]) {
  const res = await page.goto(`${down}${path}`, { timeout: 30000 });
  const notice = page.getByRole("alert").filter({ hasText: /can.t reach the database/i });
  const shown = await notice.waitFor({ timeout: 15000 }).then(() => true, () => false);
  check(`database down: ${path} shows the clear message, not a crash`, shown && (res?.status() ?? 0) < 500, `status ${res?.status()}`);
  check(`database down: ${path} has a Retry button`, shown && (await notice.getByRole("button", { name: "Retry" }).count()) === 1);
}
await page.goto(`${down}/admin`);
await page.getByRole("button", { name: "Retry" }).click();
check("database down: Retry runs again and the message stays up", await page.getByText(/can.t reach the database/i).waitFor({ timeout: 20000 }).then(() => true, () => false));
await page.screenshot({ path: "shots/022/db-down-1440.png" });

// sign-in fails closed while the database is down
const fresh = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": address.replace(/\.\d+$/, ".250") } });
const p2 = await fresh.newPage();
await p2.goto(`${down}/admin/login`);
await p2.getByLabel("Email").fill(email);
await p2.getByLabel("Password").fill(password);
await p2.getByRole("button", { name: /sign in/i }).click();
check("database down: sign-in fails closed with a clear message", await p2.getByText(/sign-in is unavailable/i).waitFor({ timeout: 30000 }).then(() => true, () => false));

await browser.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
