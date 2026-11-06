// Feature 015: lead capture must behave the same when a setting is missing (specs/015-programs-pages/contracts/env.md).
// For each setting: starts a production server with that setting blank, sends a valid form (generic error, nothing stored)
// and an invalid form (field error). Sends no email: no submission gets past the settings check. Prints no personal data.
// Usage: CHROME=<path> DIR=<folder with a build> node --env-file=.env.local scripts/leads-env-check.mjs
// Refuses to run against any database other than tareeq_dev.
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { MongoClient } from "mongodb";

const dir = resolve(process.env.DIR ?? ".");
const port = Number(process.env.PORT ?? 3300);
const base = `http://localhost:${port}`;
const uri = process.env.MONGODB_URI;
if (new URL(uri).pathname !== "/tareeq_dev") throw new Error("Refusing: not the tareeq_dev database");

const mongo = await new MongoClient(uri).connect();
const leads = mongo.db().collection("leads");
const b = await chromium.launch({ executablePath: process.env.CHROME });
let pass = 0;
let fail = 0;
const check = (n, ok, d = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : `  (${d})`}`);
};

async function startServer(blank) {
  const child = spawn(process.execPath, [join(dir, "node_modules/next/dist/bin/next"), "start", "-p", String(port)], {
    cwd: dir,
    env: { ...process.env, ...(blank ? { [blank]: "" } : {}) },
    stdio: "ignore",
  });
  for (let i = 0; i < 60; i++) {
    const up = await fetch(`${base}/register`).then(() => true, () => false);
    if (up) return child;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}

const fill = async (p, phone) => {
  await p.fill("#field-fullName", "QA Env Check");
  await p.fill("#field-phone", phone);
  await p.fill("#field-email", "qa-015@example.com");
  await p.selectOption("#field-courseId", "not-sure");
  await p.locator('input[name="level"][value="beginner"]').check();
  await p.locator('input[name="ageGroup"][value="18-plus"]').check();
  await p.check("#field-consent");
};

for (const name of ["RESEND_API_KEY", "LEAD_NOTIFICATION_TO", "RATE_LIMIT_SECRET", "MONGODB_URI"]) {
  const server = await startServer(name);
  try {
    const before = await leads.countDocuments();
    const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();

    await p.goto(`${base}/register`);
    await fill(p, "+44 7700 900123");
    await p.click('button[type="submit"]');
    await p.locator('[role="alert"]').first().waitFor({ timeout: 20000 });
    const text = await p.locator('[role="alert"]').first().innerText();
    check(`${name} blank, valid form: generic error`, /Something went wrong on our side/.test(text), text.slice(0, 80));
    check(`${name} blank, valid form: nothing stored`, (await leads.countDocuments()) === before);

    await p.goto(`${base}/register`);
    await fill(p, "12345");
    await p.click('button[type="submit"]');
    await p.waitForLoadState("load");
    const body = await p.locator("main").innerText();
    check(`${name} blank, invalid form: field error first`, /valid phone number/.test(body) && !/Something went wrong/.test(body));
    await ctx.close();
  } finally {
    server.kill();
    await new Promise((r) => setTimeout(r, 1000));
  }
}

await b.close();
await mongo.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
