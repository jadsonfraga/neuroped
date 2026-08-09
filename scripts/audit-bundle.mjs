// @ts-check
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, sep } from "node:path";
import { parseInitialJsAssets } from "./lib/bundle-audit-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const distPublic = resolve(repoRoot, "dist/public");
const baseline = JSON.parse(readFileSync(resolve(__dirname, "guards/baseline.json"), "utf8"));
const entryMaxKb = typeof baseline.bundleMaxGzipKb === "number" ? baseline.bundleMaxGzipKb : 250;
const initialMaxKb = typeof baseline.initialJsMaxGzipKb === "number" ? baseline.initialJsMaxGzipKb : entryMaxKb;
const forbiddenInitialChunks = Array.isArray(baseline.initialJsForbiddenChunks)
  ? baseline.initialJsForbiddenChunks.filter((value) => typeof value === "string" && value.length > 0)
  : [];
const largestChunkMaxKb = typeof baseline.largestJsChunkMaxKb === "number" ? baseline.largestJsChunkMaxKb : Infinity;
const largestChunkMaxGzipKb = typeof baseline.largestJsChunkMaxGzipKb === "number" ? baseline.largestJsChunkMaxGzipKb : Infinity;

if (!existsSync(join(distPublic, "index.html"))) {
  console.log("[bundle] dist/public ausente — rodando `vite build`...");
  execSync("npx vite build", { cwd: repoRoot, stdio: "inherit" });
}

const html = readFileSync(join(distPublic, "index.html"), "utf8");
const parsed = parseInitialJsAssets(html);
let entryFiles = parsed.entryFiles;
const modulePreloadFiles = parsed.modulePreloadFiles;

if (!entryFiles.length) {
  const assets = resolve(distPublic, "assets");
  const candidates = readdirSync(assets)
    .filter((file) => /^index-.*\.js$/.test(file))
    .sort((left, right) => statSync(join(assets, right)).size - statSync(join(assets, left)).size);
  if (candidates.length) entryFiles = [join("assets", candidates[0])];
}

if (!entryFiles.length) {
  console.error("[bundle] ✗ não foi possível localizar o chunk de entrada.");
  process.exit(1);
}

const gzipCache = new Map();
function gzipKb(relativePath) {
  if (gzipCache.has(relativePath)) return gzipCache.get(relativePath);
  const absolutePath = resolve(distPublic, relativePath);
  if (!absolutePath.startsWith(`${distPublic}${sep}`) || !existsSync(absolutePath)) {
    throw new Error(`[bundle] asset inicial ausente ou inseguro: ${relativePath}`);
  }
  const size = gzipSync(readFileSync(absolutePath)).length / 1024;
  gzipCache.set(relativePath, size);
  return size;
}

const entryKb = entryFiles.reduce((sum, file) => sum + gzipKb(file), 0);
const initialFiles = Array.from(new Set([...entryFiles, ...modulePreloadFiles]));
const initialKb = initialFiles.reduce((sum, file) => sum + gzipKb(file), 0);
const allJsFiles = readdirSync(resolve(distPublic, "assets"))
  .filter((file) => file.endsWith(".js"))
  .map((file) => join("assets", file));
const largestRaw = allJsFiles
  .map((file) => ({ file, kb: statSync(resolve(distPublic, file)).size / 1024 }))
  .sort((left, right) => right.kb - left.kb)[0];
const largestGzip = allJsFiles
  .map((file) => ({ file, kb: gzipKb(file) }))
  .sort((left, right) => right.kb - left.kb)[0];

for (const file of entryFiles) console.log(`[bundle] entrada ${file}: ${gzipKb(file).toFixed(2)} KB gzip`);
for (const file of modulePreloadFiles) console.log(`[bundle] preload ${file}: ${gzipKb(file).toFixed(2)} KB gzip`);
console.log(`[bundle] entrypoint = ${entryKb.toFixed(2)} KB gzip (teto ${entryMaxKb} KB)`);
console.log(`[bundle] JS inicial real = ${initialKb.toFixed(2)} KB gzip (teto ${initialMaxKb} KB)`);
console.log(`[bundle] maior chunk bruto = ${largestRaw.kb.toFixed(2)} KB (${largestRaw.file}; teto ${largestChunkMaxKb} KB)`);
console.log(`[bundle] maior chunk gzip = ${largestGzip.kb.toFixed(2)} KB (${largestGzip.file}; teto ${largestChunkMaxGzipKb} KB)`);

if (entryKb > entryMaxKb) {
  console.error(`[bundle] ✗ entrypoint acima do teto: ${entryKb.toFixed(2)} KB.`);
  process.exit(1);
}

const forbidden = modulePreloadFiles.filter((file) =>
  forbiddenInitialChunks.some((pattern) => file.toLowerCase().includes(pattern.toLowerCase())),
);
if (forbidden.length) {
  console.error(`[bundle] ✗ chunk proibido no preload inicial: ${forbidden.join(", ")}.`);
  process.exit(1);
}

if (initialKb > initialMaxKb) {
  console.error(`[bundle] ✗ carga inicial acima do teto: ${initialKb.toFixed(2)} KB.`);
  process.exit(1);
}

if (largestRaw.kb > largestChunkMaxKb || largestGzip.kb > largestChunkMaxGzipKb) {
  console.error("[bundle] ✗ maior chunk tardio excedeu o orçamento anti-regressão.");
  process.exit(1);
}

console.log("[bundle] ✓ carga inicial dentro do teto.");
