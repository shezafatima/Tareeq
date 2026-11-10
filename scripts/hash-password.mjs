// Makes the bcrypt hash for ADMIN_PASSWORD_HASH (specs/022-admin-panel/contracts/env.md).
//
//   npm run hash-password -- --save     type the password at a hidden prompt; the line is written into .env.local for you
//   npm run hash-password               type the password; the lines to paste are printed
//   npm run hash-password -- "password" same, with the password on the command line (a shell can change $ ! % ^ & characters)
//
// Next.js expands $ signs in .env files, even inside quotes, so in .env.local each $ of the hash needs a backslash.
// --save writes it that way, which avoids copy-and-paste mistakes. Restart the dev server afterwards.
import bcrypt from "bcryptjs";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

async function ask() {
  const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
  rl._writeToOutput = (s) => (s.includes("Password") ? process.stderr.write(s) : undefined); // hide what is typed
  return new Promise((resolve) => rl.question("Password: ", (answer) => (rl.close(), process.stderr.write("\n"), resolve(answer))));
}

const args = process.argv.slice(2);
const save = args.includes("--save");
const password = args.find((a) => a !== "--save") ?? (await ask());
if (!password || password.length < 12) {
  console.error("Use a password of at least 12 characters.");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
const envLine = "ADMIN_PASSWORD_HASH=" + hash.replaceAll("$", "\\$");

if (save) {
  const file = ".env.local";
  const raw = existsSync(file) ? readFileSync(file, "utf8") : "";
  const nl = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw === "" ? [] : raw.split(/\r?\n/);
  const at = lines.findIndex((l) => /^\s*ADMIN_PASSWORD_HASH\s*=/.test(l));
  if (at >= 0) lines[at] = envLine;
  else {
    while (lines.length && lines[lines.length - 1] === "") lines.pop();
    lines.push(envLine, "");
  }
  // keep only one definition, so an older line further down cannot win
  const out = lines.filter((l, i) => i === at || at < 0 || !/^\s*ADMIN_PASSWORD_HASH\s*=/.test(l));
  writeFileSync(file, out.join(nl));
  console.error(`\nSaved to ${file} (${at >= 0 ? "replaced the existing line" : "added a new line"}). Restart the dev server, then sign in with this password.`);
  console.error("For a host dashboard (Vercel and similar), use the plain hash printed below, with no backslashes:");
  console.log(hash);
} else {
  console.log(hash);
  console.error(
    "\nFor .env.local (Next.js expands $ signs even inside quotes, so each one needs a backslash):\n" +
      envLine +
      "\n\nFor a host dashboard (Vercel and similar), paste the plain hash printed above, with no backslashes." +
      "\nTip: `npm run hash-password -- --save` writes the .env.local line for you.",
  );
}
