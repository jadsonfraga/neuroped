import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "dist/public");
const verifierPatterns = [
  /pbkdf2\$[1-9][0-9]{5,}\$[0-9a-f]{16,128}\$[0-9a-f]{64}/i,
  /["'`][0-9a-f]{64}["'`]/i,
];

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

for (const path of walk(root)) {
  const content = readFileSync(path);
  const text = content.toString("latin1");
  if (verifierPatterns.some((pattern) => pattern.test(text))) {
    console.error(`ERRO: verificador de PIN embutido no build: ${path}`);
    process.exit(1);
  }
}

console.log("Build aprovado: nenhum verificador de PIN foi incorporado.");
