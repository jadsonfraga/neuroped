import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { findUnreviewedBuiltSha256Literals } from "./public-provenance-digests.mjs";

const BUILD_DIR = join(process.cwd(), "dist", "public");

function walkFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walkFiles(full, files);
    else files.push(full);
  }
  return files;
}

if (!existsSync(BUILD_DIR)) {
  console.error(
    "ERRO: dist/public não existe. Execute npm run build:client antes de auditar o bundle.",
  );
  process.exit(1);
}

const builtFiles = walkFiles(BUILD_DIR).filter((file) =>
  /\.(js|html|css|json|map|txt)$/i.test(file),
);
const verifierPatterns = [
  {
    name: "verificador PBKDF2",
    pattern: /pbkdf2\$[1-9]\d{4,}\$[A-Za-z0-9+/_=-]{16,}\$[A-Za-z0-9+/_=-]{24,}/,
  },
];

const findings = [];
for (const file of builtFiles) {
  const content = readFileSync(file, "utf8");
  const path = relative(BUILD_DIR, file).replaceAll("\\", "/");
  if (findUnreviewedBuiltSha256Literals(path, content).length > 0) {
    findings.push(`hash SHA-256 literal em ${path}`);
  }
  for (const { name, pattern } of verifierPatterns) {
    if (pattern.test(content)) {
      findings.push(`${name} em ${path}`);
    }
  }
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`ERRO: ${finding}`);
  }
  process.exit(1);
}

console.log(
  `✅ Bundle frontend auditado: ${builtFiles.length} arquivos sem verificador fixo de PIN.`,
);
