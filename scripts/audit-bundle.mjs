// @ts-check
/**
 * audit-bundle.mjs — Gate de performance (Bloco 2, Consolidação 9.0).
 *
 * Lighthouse headless (puppeteer/chrome-launcher) NÃO é confiável no ambiente
 * alvo (Windows desktop sem Chrome headless garantido + CI). Por decisão
 * documentada na própria spec do Bloco 2.2, usamos o FALLBACK sancionado:
 * medir o tamanho do bundle de entrada E de todos os módulos marcados como
 * `modulepreload` (gzip), falhando se qualquer teto for excedido.
 *
 * Os tetos vêm de scripts/guards/baseline.json:
 * - bundleMaxGzipKb: apenas o entrypoint (preserva a catraca histórica);
 * - initialJsMaxGzipKb: entrypoint + modulepreloads realmente baixados no
 *   carregamento inicial. Sem isso, o gate subestimava a carga em ~5x.
 *
 * Se o build não existir, dispara `vite build` automaticamente.
 */
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

if (!existsSync(join(distPublic, "index.html"))) {
  console.log("[bundle] dist/public ausente — rodando `vite build`...");
  execSync("npx vite build", { cwd: repoRoot, stdio: "inherit" });
}

const html = readFileSync(join(distPublic, "index.html"), "utf8");
const parsedAssets = parseInitialJsAssets(html);
let entryFiles = parsedAssets.entryFiles;
const modulePreloadFiles = parsedAssets.modulePreloadFiles;
if (!entryFiles.length) {
  // Fallback defensivo: maior chunk index-*.js em assets/.
  const assets = resolve(distPublic, "assets");
  const idx = readdirSync(assets)
    .filter((file) => /^index-.*\.js$/.test(file))
    .sort((left, right) => statSync(join(assets, right)).size - statSync(join(assets, left)).size);
  if (idx.length) entryFiles.push(join("assets", idx[0]));
}

if (!entryFiles.length) {
  console.error("[bundle] ✗ não foi possível localizar o chunk de entrada em dist/public.");
  process.exit(1);
}

const initialFiles = Array.from(new Set([...entryFiles, ...modulePreloadFiles]));
const gzipCache = new Map();

function gzipKb(rel) {
  if (gzipCache.has(rel)) return gzipCache.get(rel);
  const absolutePath = resolve(distPublic, rel);
  if (!absolutePath.startsWith(`${distPublic}${sep}`) || !existsSync(absolutePath)) {
    throw new Error(`[bundle] Asset inicial ausente ou fora de dist/public: ${rel}`);
  }
  const kb = gzipSync(readFileSync(absolutePath)).length / 1024;
  gzipCache.set(rel, kb);
  return kb;
}

const entryKb = entryFiles.reduce((total, rel) => total + gzipKb(rel), 0);
for (const rel of entryFiles) {
  console.log(`[bundle] entrada ${rel}: ${gzipKb(rel).toFixed(2)} KB gzip`);
}
console.log(`[bundle] entrada total (gzip) = ${entryKb.toFixed(2)} KB (teto ${entryMaxKb} KB)`);

if (entryKb > entryMaxKb) {
  console.error(`[bundle] ✗ REGRESSÃO NO ENTRYPOINT: ${entryKb.toFixed(2)} KB > ${entryMaxKb} KB.`);
  process.exit(1);
}

for (const rel of modulePreloadFiles) {
  console.log(`[bundle] preload ${rel}: ${gzipKb(rel).toFixed(2)} KB gzip`);
}

const forbiddenMatches = modulePreloadFiles.filter((rel) =>
  forbiddenInitialChunks.some((forbidden) => rel.toLowerCase().includes(forbidden.toLowerCase())),
);
if (forbiddenMatches.length > 0) {
  console.error(
    `[bundle] ✗ CHUNK PROIBIDO NO PRELOAD INICIAL: ${forbiddenMatches.join(", ")}. ` +
    `Padroes bloqueados: ${forbiddenInitialChunks.join(", ")}.`,
  );
  process.exit(1);
}

const initialKb = initialFiles.reduce((total, rel) => total + gzipKb(rel), 0);
console.log(
  `[bundle] JS inicial real (entrypoint + ${modulePreloadFiles.length} modulepreloads) = ${initialKb.toFixed(2)} KB gzip (teto ${initialMaxKb} KB)`,
);

if (initialKb > initialMaxKb) {
  console.error(`[bundle] ✗ REGRESSÃO NA CARGA INICIAL: ${initialKb.toFixed(2)} KB > ${initialMaxKb} KB. Reduza imports/modulepreloads ou ajuste initialJsMaxGzipKb conscientemente.`);
  process.exit(1);
}
console.log("[bundle] ✓ dentro do teto de performance.");
