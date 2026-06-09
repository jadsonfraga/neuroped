import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const allowed = new Set(["emerald", "amber", "orange", "red"]);
const roots = ["client/src/pages", "client/src/components"];
const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(tsx|ts)$/.test(entry)) continue;
    auditFile(full);
  }
}

function auditFile(file) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("GenericScale")) return;

  const matches = source.matchAll(/\bcolor\s*:\s*["']([^"']+)["']/g);
  for (const match of matches) {
    const value = match[1];
    if (value.startsWith("text-") || value.includes(" ")) continue;
    if (!allowed.has(value)) {
      offenders.push(`${file}: color "${value}" is outside GenericScale contract`);
    }
  }

}

for (const root of roots) walk(root);

if (offenders.length) {
  console.error(["GenericScale color contract failed:", ...offenders].join("\n"));
  process.exit(1);
}

console.log("GenericScale color contract OK: emerald/amber/orange/red only.");
