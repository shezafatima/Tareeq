// Tells you whether an email and password match the admin settings in .env.local, read exactly the way Next.js reads them.
// Usage (in your own terminal, so the password prompt stays hidden): node scripts/check-admin-login.mjs
// Prints only yes/no answers, never the settings or what you typed.
import bcrypt from "bcryptjs";
import nextEnv from "@next/env";
import { createInterface } from "node:readline";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error: console.error });

function ask(question, hidden) {
  const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
  if (hidden) rl._writeToOutput = (s) => (s.includes(question) ? process.stderr.write(s) : undefined);
  return new Promise((resolve) => rl.question(question, (answer) => (rl.close(), hidden && process.stderr.write("\n"), resolve(answer))));
}

const storedEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const storedHash = (process.env.ADMIN_PASSWORD_HASH ?? "").trim();
const hashOk = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedHash);

console.log("ADMIN_EMAIL is set:", storedEmail ? "yes" : "NO");
console.log("ADMIN_PASSWORD_HASH loads as a valid hash:", hashOk ? "yes" : "NO (check the backslash before each $)");
if (!storedEmail || !hashOk) process.exit(1);

const email = (await ask("Email: ", false)).trim().toLowerCase();
const password = await ask("Password: ", true);

const emailMatch = email === storedEmail;
const passwordMatch = await bcrypt.compare(password, storedHash);
console.log("email matches ADMIN_EMAIL:", emailMatch ? "yes" : "NO");
console.log("password matches ADMIN_PASSWORD_HASH:", passwordMatch ? "yes" : "NO");
if (password !== password.trim()) console.log("note: the password you typed starts or ends with a space");
if (emailMatch && passwordMatch) console.log("\nBoth match. If sign-in still fails, restart the dev server so it reads .env.local again.");
else if (!passwordMatch) console.log("\nMake a fresh hash with no argument, so no shell can change the password:\n  npm run hash-password\nthen paste the line it prints into .env.local and restart the dev server.");
process.exit(emailMatch && passwordMatch ? 0 : 1);
