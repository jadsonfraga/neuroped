// @ts-check
/**
 * audit-bundle.mjs — Gate de performance (Bloco 2, Consolidação 9.0).
 *
 * Lighthouse headless (puppeteer/chrome-launcher) NÃO é confiável no ambiente
 * alvo (Windows desktop sem Chrome headless garantido + CI). Por decisão
 * documentada na própria spec do Bloco 2.2, usamos o FALLBACK sancionado:
 * medir o tamanho do bundle de entrada (gzip) e falhar se exceder o teto.
 *
 * O teto vem de scripts/guards/baseline.json -> bundleMaxGzipKb (250 KB).
 * O chunk de entrada atual gzip ~184 KB, então 250 KB é uma catraca real.
 *
 * Mede o módulo de entrada referenciado em dist/public/index.html (carga
 * inicial). Se o build não existir, dispara `vite build` automaticamente.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const distPublic = resolve(repoRoot, "dist/public");
const baseline = JSON.parse(readFileSync(resolve(__dirname, "guards/baseline.json"), "utf8"));
const maxKb = typeof baseline.bundleMaxGzipKb === "number" ? baseline.bundleMaxGzipKb : 250;

if (!existsSync(join(distPublic, "index.html"))) {
  console.log("[bundle] dist/public ausente — rodando `vite build`...");
  execSync("npx vite build", { cwd: repoRoot, stdio: "inherit" });
}

const html = readFileSync(join(distPublic, "index.html"), "utf8");
// Entrada = <script type="module" ... src="...index-XXXX.js">
const entryMatch = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/);
let entryFiles = [];
if (entryMatch) {
  entryFiles.push(entryMatch[1].replace(/^\.?\//, ""));
} else {
  // Fallback: maior chunk index-*.js em assets/
  const assets = resolve(distPublic, "assets");
  const idx = readdirSync(assets).filter((f) => /^index-.*\.js$/.test(f));
  if (idx.length) entryFiles.push(join("assets", idx[0]));
}

if (!entryFiles.length) {
  console.error("[bundle] ✗ não foi possível localizar o chunk de entrada em dist/public.");
  process.exit(1);
}

let totalGzip = 0;
for (const rel of entryFiles) {
  const buf = readFileSync(resolve(distPublic, rel));
  const gz = gzipSync(buf).length;
  totalGzip += gz;
  console.log(`[bundle] entrada ${rel}: ${(gz / 1024).toFixed(2)} KB gzip`);
}

const totalKb = totalGzip / 1024;
console.log(`[bundle] carga inicial (gzip) = ${totalKb.toFixed(2)} KB (teto ${maxKb} KB)`);

if (totalKb > maxKb) {
  console.error(`[bundle] ✗ REGRESSÃO: ${totalKb.toFixed(2)} KB > ${maxKb} KB. Reduza o bundle ou ajuste bundleMaxGzipKb conscientemente.`);
  process.exit(1);
}
console.log("[bundle] ✓ dentro do teto de performance.");
