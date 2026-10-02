#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { exit, stderr } from "node:process";

const EXCEPTIONS = new Set([
  "node-forge",
  "@signpdf/signer-p12",
]);
const EXCEPTION_ADVISORY = "GHSA-86w9-cpqp-85rv (CVE-2026-85393)";

function auditJson() {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const stdout = execFileSync("npm", ["audit", "--audit-level=high", "--json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 64 * 1024 * 1024,
      });
      return JSON.parse(stdout);
    } catch (err) {
      if (err.stdout) {
        try {
          return JSON.parse(err.stdout);
        } catch {
          if (attempt === 1) throw err;
        }
      } else if (attempt === 1) throw err;
    }
  }
  throw new Error("npm audit falhou antes de concluir");
}

const report = auditJson();
const vulnerabilities = Object.values(report.vulnerabilities ?? {});
const blocking = vulnerabilities.filter(
  (v) =>
    ["high", "critical"].includes(v.severity) &&
    !EXCEPTIONS.has(v.name) &&
    !v.effects?.some?.((e) => EXCEPTIONS.has(e)),
);

for (const v of blocking) {
  stderr.write(`\u274c ${v.severity}: ${v.name}\n`);
}
const excused = vulnerabilities.filter((v) => EXCEPTIONS.has(v.name));
if (excused.length) {
  stderr.write(
    `\u26a0\ufe0f  Exce\u00e7\u00e3o documentada (${EXCEPTION_ADVISORY}): ` +
      `${excused.map((v) => v.name).join(", ")} — sem corre\u00e7\u00e3o upstream. ` +
      "Ver coment\u00e1rio em scripts/guards/audit-high-critical.mjs.\n",
  );
}
if (blocking.length > 0) {
  exit(1);
}
