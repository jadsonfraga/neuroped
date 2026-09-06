// @ts-check
/**
 * audit-tailwind-opacity-modifiers.mjs — nenhum valor de opacidade Tailwind
 * inválido em `client/src`.
 *
 * Por que este gate existe: em 06/09/2026, `dark:text-white/76` em
 * especialidades-premium.tsx compilava para NADA. A escala de opacidade deste
 * projeto (tailwind.config.ts, sem `theme.extend.opacity`) só gera múltiplos
 * de 5 — `/76` não é um deles. Sem erro de build, sem warning: o navegador
 * simplesmente não tem essa regra, e o texto herdava a cor de outra classe do
 * MESMO elemento (no caso, a variante clara, mesmo com `.dark` ativo). Um
 * parágrafo do hero ficou ilegível no modo escuro sem nenhum gate acusar nada.
 *
 * O caso de `dark:` é o mais perigoso (duas classes de cor competem pelo
 * mesmo elemento; a que falha faz a outra "vencer" no tema errado), mas até
 * um `bg-primary/12` sozinho, sem `dark:` competindo, ainda renderiza uma
 * superfície diferente da pretendida — só não quebra legibilidade porque
 * cai para "sem esta regra" em vez de "cor errada".
 *
 * Escopo: só os prefixos de cor documentados no Tailwind (bg, text, border,
 * ring, from, to, via, divide, outline, decoration, placeholder, accent,
 * caret, fill, stroke) — evita falso positivo em URLs (`wa.me/558799...`),
 * rotas (`/cognitive-lab/123`) ou frações fora de contexto Tailwind.
 * `/[NN%]` (colchetes, valor arbitrário) sempre funciona e não entra na
 * varredura — o gate cobre apenas a sintaxe curta `/NN`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname, relative, sep } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

const COLOR_PREFIXES =
  "bg|text|border|ring|from|to|via|divide|outline|decoration|placeholder|accent|caret|fill|stroke";
// Captura `prefixo-token/NN` sem colchetes (valor arbitrário `/[76%]` fica de fora,
// esse sempre compila). `(?<!in-)(?<!out-)` evita falso positivo nas classes de
// animação do tailwindcss-animate (`slide-in-from-left-1/2`,
// `slide-out-to-top-[48%]`) — ali "from"/"to" são direção de animação, "1/2" é
// fração de distância, nada disso é opacidade de cor.
const PATTERN = new RegExp(
  `\\b(?:dark:)?(?<!in-)(?<!out-)(?:${COLOR_PREFIXES})-[a-zA-Z0-9_-]+/(\\d{1,3})\\b`,
  "g",
);
const EXT = new Set([".tsx", ".ts", ".jsx", ".js"]);

function walk(dir) {
  let out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) out = out.concat(walk(full));
    else if (EXT.has(extname(entry))) out.push(full);
  }
  return out;
}

const failures = [];
for (const file of walk(resolve(repoRoot, "client/src"))) {
  const relativeFile = relative(repoRoot, file).split(sep).join("/");
  const content = readFileSync(file, "utf8");
  for (const match of content.matchAll(PATTERN)) {
    const value = Number(match[1]);
    if (value > 100 || value % 5 === 0) continue;
    const line = content.slice(0, match.index).split("\n").length;
    failures.push(`${relativeFile}:${line}: \`${match[0]}\` — /${value} não é múltiplo de 5, não gera CSS`);
  }
}

if (failures.length > 0) {
  console.error(`[tailwind-opacity] ✗ ${failures.length} modificador(es) de opacidade inválido(s):`);
  for (const failure of failures.slice(0, 50)) console.error(`  - ${failure}`);
  if (failures.length > 50) console.error(`  … e mais ${failures.length - 50}.`);
  console.error(
    "[tailwind-opacity] arredonde para o múltiplo de 5 mais próximo, ou use a sintaxe com colchetes `/[NN%]`.",
  );
  process.exit(1);
}
console.log("[tailwind-opacity] ✓ nenhum modificador de opacidade fora da escala do tema.");
