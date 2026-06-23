// @ts-check
/**
 * audit-design.mjs — Gate de design tokens (Bloco 4, Consolidação 9.0).
 *
 * Conta valores de cor "crus" (hex #rgb/#rrggbb e rgb()/rgba()) em
 * client/src. Catraca: falha se o total exceder baseline.designRawValues
 * (não pode piorar). Atualize o baseline conscientemente ao reduzir.
 *
 * Observação: tokens do design system vivem como CSS variables
 * (var(--...)) e classes utilitárias Tailwind (text-primary, bg-card…),
 * que NÃO são contadas — só valores literais crus.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const baseline = JSON.parse(readFileSync(resolve(__dirname, "guards/baseline.json"), "utf8"));

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGB = /\brgba?\(/g;
const EXT = new Set([".tsx", ".ts", ".css", ".jsx", ".js"]);
const DESIGN_SYSTEM_SOURCES = new Set(["client/src/index.css", "client/src/styles/tokens.css"]);

function walk(d) {
  let out = [];
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    const s = statSync(p);
    if (s.isDirectory()) out = out.concat(walk(p));
    else if (EXT.has(extname(f))) out.push(p);
  }
  return out;
}

const perFile = {};
let total = 0;
for (const f of walk(resolve(repoRoot, "client/src"))) {
  const relativeFile = f.replace(repoRoot + "\\", "").replace(repoRoot + "/", "");
  if (DESIGN_SYSTEM_SOURCES.has(relativeFile)) continue;

  const c = readFileSync(f, "utf8");
  const n = (c.match(HEX)?.length ?? 0) + (c.match(RGB)?.length ?? 0);
  if (n > 0) {
    perFile[relativeFile] = n;
    total += n;
  }
}

const top = Object.entries(perFile).sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log("[design] arquivos com mais valores crus:");
for (const [f, n] of top) console.log(`  ${String(n).padStart(4)}  ${f}`);
console.log(`[design] total de valores de cor crus = ${total}`);

const limit = baseline.designRawValues;
if (typeof limit === "number") {
  if (total > limit) {
    console.error(`[design] ✗ REGRESSÃO: ${total} > baseline ${limit}. Substitua por tokens ou ajuste o baseline.`);
    process.exit(1);
  }
  console.log(`[design] ✓ dentro da catraca (${total} <= ${limit}).`);
} else {
  console.log("[design] baseline.designRawValues = null — execução informativa (catraca ainda não travada).");
}
