// Feature 004 guard rails. Usage:
//   node scripts/polish-token-check.mjs --record    (once, before changing anything: stores hashes of protected files)
//   node scripts/polish-token-check.mjs             (checks the rules)
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HASHES = "specs/004-site-visual-polish/protected.sha.json";
// feature 005: how-it-works/ is no longer protected (rewritten); RobotEyes.tsx changes only by owner approval (ADR-0001)
const PROTECTED = ["src/components/Hero.tsx", "src/components/layout/preloader"];

const walk = (p) => {
  if (!existsSync(p)) return [];
  if (statSync(p).isFile()) return [p];
  return readdirSync(p).flatMap((f) => walk(join(p, f)));
};
// line endings are normalised: git on Windows may rewrite LF as CRLF in the working tree, which is not a change
const hash = (f) => createHash("sha256").update(readFileSync(f, "utf8").split(String.fromCharCode(13)).join("")).digest("hex");
const protectedFiles = PROTECTED.flatMap(walk).map((f) => f.replace(/\\/g, "/"));

if (process.argv.includes("--record")) {
  const out = Object.fromEntries(protectedFiles.map((f) => [f, hash(f)]));
  writeFileSync(HASHES, JSON.stringify(out, null, 1));
  console.log(`recorded ${protectedFiles.length} protected files`);
  process.exit(0);
}

const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

// 1. Protected files unchanged by this feature
if (existsSync(HASHES)) {
  const rec = JSON.parse(readFileSync(HASHES, "utf8"));
  const changed = protectedFiles.filter((f) => rec[f] !== hash(f));
  const missing = Object.keys(rec).filter((f) => !protectedFiles.includes(f));
  check("protected files (Hero.tsx, preloader/) are unchanged since the baseline", changed.length === 0 && missing.length === 0, [...changed, ...missing].join(", "));
} else {
  check("protected hashes recorded", false, "run with --record first");
}

// 2. Rules over the files this feature adds or changes
const FILES = [
  "src/components/ui/Reveal.tsx", "src/components/ui/RevealController.tsx", "src/components/ui/SectionDivider.tsx",
  "src/components/ui/IconTile.tsx", "src/components/ui/icons.tsx", "src/components/ui/Button.tsx", "src/components/ui/Card.tsx",
  "src/components/ui/ChevronRight.tsx", "src/components/ui/Badge.tsx",
  "src/components/layout/DesktopNav.tsx", "src/components/layout/MobileMenuContent.tsx", "src/components/layout/Footer.tsx",
  "src/components/sections/Section.tsx", "src/components/sections/HeroExtras.tsx", "src/components/sections/WhoItsFor.tsx",
  "src/components/sections/ProgramsPreview.tsx", "src/components/sections/ProgramCard.tsx", "src/components/sections/WhyTareeq.tsx",
  "src/components/sections/FinalCta.tsx", "src/components/sections/StorySection.tsx", 
  "src/components/sections/PageHeader.tsx", "src/components/sections/CtaBand.tsx",
  "src/app/(site)/page.tsx", "src/app/(site)/our-way/page.tsx", "src/app/(site)/programs/page.tsx",
].filter(existsSync);

const read = (f) => readFileSync(f, "utf8");
const offenders = (re, strip = (s) => s) => FILES.filter((f) => re.test(strip(read(f)))).map((f) => f.replace("src/", ""));

const hex = offenders(/#[0-9a-fA-F]{3,8}\b|rgba?\(/, (s) => s.replace(/\/\/.*$/gm, ""));
check("no hex or rgb() colours in changed component files", hex.length === 0, hex.join(", "));

// duration-* and ease-* utilities and literal times must come from the tokens
const oneOff = FILES.filter((f) => {
  const s = read(f);
  const utilities = [...s.matchAll(/\b(duration|ease)-(\[[^\]]*\]|[a-z0-9-]+)/g)].map((m) => m[0]);
  return utilities.some((u) => !/\[var\(--(dur|ease)-/.test(u));
}).map((f) => f.replace("src/", ""));
check("every duration-/ease- utility reads a token (var(--dur-*), var(--ease-soft))", oneOff.length === 0, oneOff.join(", "));

const literalTimes = offenders(/transition[^;"`]*\b\d+(\.\d+)?m?s\b/);
check("no literal transition times in changed component files", literalTimes.length === 0, literalTimes.join(", "));

const reveal = [...protectedFiles].filter((f) => /data-reveal(?!ed)|<Reveal\b|from "@\/components\/ui\/Reveal"/.test(read(f)));
check("no Reveal inside the hero or the preloader", reveal.length === 0, reveal.join(", "));

const useClient = FILES.filter((f) => /^\s*"use client"/m.test(read(f)));
check('"use client" appears only in RevealController among this feature\'s new files', useClient.every((f) => f.endsWith("RevealController.tsx")), useClient.join(", "));

const deps = JSON.parse(readFileSync("package.json", "utf8"));
// feature 006 added mongoose, resend and zod (owner-approved); feature 015 added marked and sanitize-html (named in its plan)
check("no new dependencies (same list as the last approved set)", JSON.stringify(Object.keys(deps.dependencies)) === JSON.stringify(["@phosphor-icons/react", "clsx", "framer-motion", "marked", "mongoose", "next", "react", "react-dom", "resend", "sanitize-html", "tailwind-merge", "zod"]), Object.keys(deps.dependencies).join(","));

console.log(results.join("\n"));
console.log(results.some((r) => r.startsWith("FAIL")) ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
