// Prints a bcrypt hash for ADMIN_PASSWORD_HASH (specs/022-admin-panel/contracts/env.md).
// Usage: npm run hash-password -- "your password"   (or run it with no argument to type the password)
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";

async function ask() {
  const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
  rl._writeToOutput = (s) => (s.includes("Password") ? process.stderr.write(s) : undefined); // hide what is typed
  return new Promise((resolve) => rl.question("Password: ", (answer) => (rl.close(), process.stderr.write("\n"), resolve(answer))));
}

const password = process.argv[2] ?? (await ask());
if (!password || password.length < 12) {
  console.error("Use a password of at least 12 characters.");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log(hash);
console.error("\nPut this in .env.local, wrapped in single quotes:\nADMIN_PASSWORD_HASH='" + hash + "'");
