#!/usr/bin/env node

import { readFile, access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { resolveOfflineShellRoots } from "./lib/offline-shell-roots.mjs";

const root = process.cwd();
const outDir = path.join(root, "dist", "public");
const manifest = JSON.parse(
  await readFile(path.join(outDir, ".vite", "manifest.json"), "utf8"),
);
const swAssetsSource = await readFile(path.join(outDir, "sw-assets.js"), "utf8");
const match = swAssetsSource.match(/=\s*(\[[\s\S]*\]);?\s*$/);
if (!match) throw new Error("sw-assets.js não contém um array de precache válido.");
const precache = new Set(JSON.parse(match[1]));
const [appSource, webManifestSource] = await Promise.all([
  readFile(path.join(root, "client", "src", "App.tsx"), "utf8"),
  readFile(path.join(root, "client", "public", "manifest.json"), "utf8"),
]);
const { roots, shortcutRoutes } = resolveOfflineShellRoots({
  appSource,
  webManifest: JSON.parse(webManifestSource),
  buildManifest: manifest,
});

const visited = new Set();
const expected = new Set();
function visit(source) {
  if (visited.has(source)) return;
  visited.add(source);
  const chunk = manifest[source];
  if (!chunk) throw new Error(`Import estático ausente: ${source}`);
  expected.add(`./${chunk.file}`);
  for (const file of chunk.css || []) expected.add(`./${file}`);
  for (const file of chunk.assets || []) expected.add(`./${file}`);
  for (const imported of chunk.imports || []) visit(imported);
}
roots.forEach(visit);

const missing = [...expected].filter((file) => !precache.has(file));
if (missing.length) {
  throw new Error(`Shell offline incompleto: ${missing.join(", ")}`);
}

for (const file of precache) {
  if (!file.startsWith("./")) throw new Error(`Caminho de precache não relativo: ${file}`);
  await access(path.join(outDir, file.slice(2)));
}

console.log(
  `✅ Shell offline íntegro: ${precache.size} assets; Home + ${shortcutRoutes.length} atalhos e imports estáticos disponíveis.`,
);
