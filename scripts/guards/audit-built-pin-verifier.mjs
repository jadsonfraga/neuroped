import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createBuiltVisualDigestInspector } from "./lib/verified-built-visual-digests.mjs";

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

try {
  const inspect = createBuiltVisualDigestInspector(root);
  for (const path of walk(root)) {
    const content = readFileSync(path);
    const text = /\.(?:js|json)$/.test(path) ? content.toString("utf8") : content.toString("latin1");
    // Only verified public image digest fields in the canonical inventory and
    // its exact Vite module are distinguished. All other bytes remain scanned.
    const inspected = inspect(relative(root, path).replaceAll("\\", "/"), text);
    if (verifierPatterns.some((pattern) => pattern.test(inspected))) {
      console.error(`ERRO: verificador de PIN embutido no build: ${path}`);
      process.exit(1);
    }
  }
} catch (error) {
  console.error(`ERRO: integridade da inspeção do build: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

console.log("Build aprovado: nenhum verificador de PIN foi incorporado; digests visuais conferidos contra os arquivos empacotados.");
