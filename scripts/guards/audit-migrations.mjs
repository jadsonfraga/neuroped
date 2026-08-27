import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("db/migrations");
const files = fs.readdirSync(dir).filter((file) => /^\d{4}_.+\.sql$/.test(file)).sort();
const errors = [];
const seen = new Map();
let previous = 0;
for (const file of files) {
  const number = Number(file.slice(0, 4));
  if (seen.has(number)) {
    const legacyPair = number === 8 && new Set([file, seen.get(number)]).has("0008_operational_hardening.sql") && new Set([file, seen.get(number)]).has("0008_boaconsulta_import_bridge.sql");
    if (!legacyPair) errors.push(`migration number duplicated: ${file} and ${seen.get(number)}`);
  }
  seen.set(number, file);
  if (number < previous) errors.push(`migration order regression: ${file}`);
  previous = Math.max(previous, number);
  const source = fs.readFileSync(path.join(dir, file), "utf8");
  if (/\bDROP\s+(TABLE|COLUMN|INDEX)\b/i.test(source)) errors.push(`destructive DDL requires explicit review: ${file}`);
  if (number >= 16 && /ALTER\s+TABLE[\s\S]+ADD\s+COLUMN/i.test(source) && !/idempotent|duplicate column/i.test(source)) errors.push(`add-column migration must document idempotent deployment: ${file}`);
}
if (!files.some((file) => file.startsWith("0016_"))) errors.push("migration 0016 operational hardening is missing");
if (errors.length) { for (const error of errors) console.error(error); process.exit(1); }
console.log(JSON.stringify({ ok: true, migrations: files, latest: files.at(-1) ?? null }));
