// @ts-check
/**
 * audit-design.mjs — Gate de design tokens (Bloco 4, Consolidação 9.0).
 *
 * Conta valores de cor "crus" (hex #rgb/#rrggbb e rgb()/rgba()) em
 * client/src. Catraca: falha se o total exceder baseline.designRawValues
 * (não pode piorar). Atualize o baseline conscientemente ao reduzir.
 *
 * Também protege decisões estruturais da camada Signature Clinical: ouro é
 * acento, cards estáticos não "pulam", cabeçalhos clínicos não viram galeria
 * de retratos e a área familiar mantém hierarquia editorial calma.
 *
 * Observação: tokens do design system vivem como CSS variables
 * (var(--...)) e classes utilitárias Tailwind (text-primary, bg-card…),
 * que NÃO são contadas — só valores literais crus.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname, relative, sep } from "node:path";

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
  const relativeFile = relative(repoRoot, f).split(sep).join("/");
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

const brandCss = readFileSync(
  resolve(repoRoot, "client/src/styles/brand-signature-v14.css"),
  "utf8",
);
const pageHero = readFileSync(
  resolve(repoRoot, "client/src/components/PageHero.tsx"),
  "utf8",
);
const premiumPanel = readFileSync(
  resolve(repoRoot, "client/src/components/PremiumVisualPanel.tsx"),
  "utf8",
);
const familyPortal = readFileSync(
  resolve(repoRoot, "client/src/pages/portal-familia.tsx"),
  "utf8",
);
const layout = readFileSync(
  resolve(repoRoot, "client/src/components/Layout.tsx"),
  "utf8",
);
const appShellCss = readFileSync(
  resolve(repoRoot, "client/src/styles/premium-app-shell-v12.css"),
  "utf8",
);

const contractFailures = [];
if (/\.shadcn-card:hover\s*\{/.test(brandCss)) {
  contractFailures.push("cards estáticos voltaram a receber hover global");
}
if (!/\.shadcn-card\.cursor-pointer:hover/.test(brandCss)) {
  contractFailures.push("cards interativos perderam o hover seletivo");
}
if (/brandAssets\.mascots\.doctorSelfie/.test(pageHero)) {
  contractFailures.push("PageHero voltou a repetir retrato médico em todas as telas");
}
if (!/brandAssets\.masterShield/.test(pageHero)) {
  contractFailures.push("PageHero perdeu a assinatura institucional compacta");
}
if (/Cuidado com identidade e propósito/.test(premiumPanel)) {
  contractFailures.push("painel premium voltou ao slogan redundante");
}
if (!/headingLevel/.test(premiumPanel)) {
  contractFailures.push("painel premium perdeu hierarquia semântica configurável");
}
if (/AssetShowcase|AlertTriangle/.test(familyPortal)) {
  contractFailures.push("portal da família voltou a parecer galeria/auditoria ou alerta de risco");
}
if (!/Área segura para famílias/.test(familyPortal) || !/headingLevel="h1"/.test(familyPortal)) {
  contractFailures.push("portal da família perdeu hierarquia editorial ou sinal de confiança");
}

// Chrome escuro: a sidebar e a barra móvel são pintadas de marinho nos dois
// temas. Uma superfície escura só é legível se levar consigo o conjunto escuro
// de tokens (classe `dark` no Layout) E declarar a própria tinta — `color`
// herdado é resolvido no elemento que o declarou, então todo `<button>`, que o
// preflight deixa em `color: inherit`, puxava a tinta quase preta do `body`.
// Foi assim que o modo claro chegou a 1:1 de contraste na navegação inteira.
if (/\.np-app-sidebar,\s*\n\.np-app-mobile-header\s*\{/.test(brandCss)) {
  if (!/\.np-app-sidebar,\s*\n\.np-app-mobile-header\s*\{\s*\n\s*color:/.test(brandCss)) {
    contractFailures.push("chrome escuro sem tinta própria declarada (texto volta a herdar a cor do body)");
  }
  if (!/"dark np-app-sidebar/.test(layout)) {
    contractFailures.push("sidebar marinho perdeu a ilha de tokens escuros (classe `dark` no Layout)");
  }
  if (!/"dark np-app-mobile-header/.test(layout)) {
    contractFailures.push("barra móvel marinho perdeu a ilha de tokens escuros (classe `dark` no Layout)");
  }
}
// O cabeçalho móvel tem dono único. Enquanto premium-app-shell-v12 disputava a
// mesma propriedade com `!important` e vencia por especificidade, a marca ficava
// marinho no rail e creme no topo — a mesma identidade em duas cores.
if (!/header\.fixed\.lg\\:hidden:not\(\.np-app-mobile-header\)/.test(appShellCss)) {
  contractFailures.push("premium-app-shell voltou a disputar a cor do cabeçalho móvel com a camada de marca");
}

if (contractFailures.length > 0) {
  console.error("[design] ✗ contrato Signature Clinical regressou:");
  for (const failure of contractFailures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("[design] ✓ contrato Signature Clinical: hierarquia, confiança e interação seletiva preservadas.");
