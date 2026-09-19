import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const runtimeRoots = ["client/src", "client/public"];
const explicitFiles = [".env.example", "vercel.json"];
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".html", ".css", ".md"]);

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else if (textExtensions.has(extname(entry.name)) || entry.name === "_headers") files.push(path);
  }
  return files;
}

test("o app não reintroduz superfícies ou dependências do site Manus", async () => {
  const files = [...explicitFiles];
  for (const root of runtimeRoots) files.push(...await collectFiles(root));

  const forbidden = [
    /https?:\/\/[^\s"']*manus\.space/i,
    /VITE_MANUS_[A-Z0-9_]+/,
    /["']\/manus["']/,
    /pages\/manus-integracoes/i,
    /Integrações Manus/i,
  ];

  const violations = [];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(content)) violations.push(`${file}: ${pattern}`);
    }
  }

  assert.deepEqual(violations, [], "referências Manus não podem voltar ao runtime do NeuroPed");
});
