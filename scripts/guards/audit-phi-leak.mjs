import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const excluded = new Set([".test.ts", ".test.tsx", ".test.js", ".test.jsx", ".test.mjs", ".spec.ts", ".spec.tsx"]);
const findings = [];

function gitFiles(args) {
  try { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).split(/\r?\n/).filter(Boolean); }
  catch { return []; }
}
const changed = new Set([
  ...gitFiles(["diff", "--name-only", "origin/main", "--"]),
  ...gitFiles(["ls-files", "--others", "--exclude-standard"]),
]);
const files = [...changed].filter((file) => extensions.has(path.extname(file)) && ![...excluded].some((suffix) => file.endsWith(suffix)));

for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/console\.(log|error|warn)\([^\n]*(?:patient|email|phone|diagnos|medicat|payload|content|profile|birth)/i.test(line)) findings.push(`${file}:${index + 1}: console statement references a sensitive field`);
    if (/console\.(log|error|warn)\([^\n]*(?:,\s*error\b|\{\s*error\s*\}|error\s*\})/i.test(line)) findings.push(`${file}:${index + 1}: exception object may serialize sensitive context; emit a safe error code instead`);
    if (/localStorage\.(?:getItem|setItem|removeItem)\([^\n]*(?:clinical|prontuario|document|medicat|diar|scale|pre-consulta|pre-retorno)/i.test(line)) findings.push(`${file}:${index + 1}: clinical browser persistence must use the LIVE policy or server autosave`);
    if (/(?:searchParams|URLSearchParams)[^\n]*(?:diagnos|medicat|payload|content|note|profile)/i.test(line)) findings.push(`${file}:${index + 1}: clinical content must not be placed in a URL`);
  });
}
if (findings.length) { console.error(findings.join("\n")); process.exit(1); }
console.log(JSON.stringify({ ok: true, filesAudited: files.length, findings: 0 }));
