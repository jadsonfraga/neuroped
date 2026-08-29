import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const home = read("client/src/pages/home.tsx");
const main = read("client/src/main.tsx");
const visual = read("client/src/styles/premium-visual-v13.css");
const mobileVisual = read(
  "client/src/styles/premium-visual-v13-mobile.css",
);
const a11yVisual = read(
  "client/src/styles/premium-visual-v13-a11y.css",
);
const workflow = read(".github/workflows/premium-visual-v13.yml");

const requiredRoutes = [
  "/mchat",
  "/filtro",
  "/avaliacao-cognitiva-infantil",
  "/testes-reconhecimento",
  "/marcos-desenvolvimento",
  "/filtro-escalas?mode=flash",
  "/pacientes",
  "/agenda",
  "/laudo-neuroped",
];

for (const route of requiredRoutes) {
  assert.ok(
    home.includes(`"${route}"`),
    `A home premium não pode remover a rota funcional ${route}`,
  );
}

const requiredTestIds = [
  "premium-home-v13",
  "text-page-title",
  "search-container",
  "input-search",
  "premium-primary-action",
  "premium-secondary-action",
  "premium-system-status",
  "premium-quick-link",
  "premium-metric-card",
  "premium-flow-grid",
  "premium-responsible-note",
];

for (const testId of requiredTestIds) {
  assert.ok(
    home.includes(testId),
    `Contrato estrutural ausente na home premium: ${testId}`,
  );
}

assert.match(
  home,
  /data-testid=\{`home-flow-\$\{index \+ 1\}`\}/,
  "Os cinco fluxos devem preservar os IDs home-flow-1…5 usados pelos testes",
);

assert.ok(
  home.includes("mergeFilterableCatalog(allScales)"),
  "A busca da home deve continuar consultando o catálogo completo de escalas",
);
assert.ok(
  home.includes("<FavoritesRecents />"),
  "Favoritos e recentes não podem ser removidos",
);
assert.ok(
  home.includes('<Mascote contexto="home"'),
  "A identidade visual do guia NeuroPED deve permanecer integrada",
);
assert.ok(
  home.includes("appMetrics.scaleCount") &&
    home.includes("appMetrics.filterableInstrumentCount") &&
    home.includes("appMetrics.directTestCount") &&
    home.includes("appMetrics.pageCount"),
  "As métricas devem continuar derivadas da fonte canônica appMetrics",
);

const v12Index = main.indexOf('./styles/premium-app-shell-v12.css');
const v13Index = main.indexOf('./styles/premium-visual-v13.css');
const mobileIndex = main.indexOf('./styles/premium-visual-v13-mobile.css');
const a11yIndex = main.indexOf('./styles/premium-visual-v13-a11y.css');
const touchIndex = main.indexOf('./styles/tablet-coarse-perf.css');

assert.ok(v12Index >= 0, "A camada visual v12 continua obrigatória");
assert.ok(v13Index > v12Index, "A v13 deve ser carregada depois da v12");
assert.ok(
  mobileIndex > v13Index,
  "A proteção móvel da v13 deve ser carregada depois da camada principal",
);
assert.ok(
  a11yIndex > mobileIndex,
  "O reforço WCAG deve ser carregado depois das camadas visuais da v13",
);
assert.ok(
  touchIndex > a11yIndex,
  "A proteção de desempenho/touch deve continuar sendo a última camada",
);

const visualContracts = [
  ".np-v13-home",
  ".np-v13-hero",
  ".np-v13-control-panel",
  ".np-v13-metric-grid",
  ".np-v13-flow-grid",
  ".np-v13-responsible-note",
  ".dark .np-v13-control-panel",
  "@media screen and (max-width: 1023px)",
  "@media screen and (max-width: 767px)",
  "@media (prefers-reduced-motion: reduce)",
  "@media print",
];

for (const contract of visualContracts) {
  assert.ok(
    visual.includes(contract),
    `Camada visual v13 sem proteção obrigatória: ${contract}`,
  );
}

for (const contract of [
  "@media screen and (max-width: 767px)",
  "display: flex !important",
  "flex-direction: column !important",
  "grid-column: 1 / -1 !important",
  "width: 100% !important",
]) {
  assert.ok(
    mobileVisual.includes(contract),
    `Proteção móvel sem contrato anticolisão: ${contract}`,
  );
}

for (const contract of [
  ".np-app-content:has(.np-v13-home) > p.flex-wrap > span",
  "color: hsl(var(--muted-foreground))",
]) {
  assert.ok(
    a11yVisual.includes(contract),
    `Reforço WCAG ausente ou enfraquecido: ${contract}`,
  );
}

assert.match(
  visual,
  /min-height:\s*44px/,
  "A camada premium deve preservar alvos táteis mínimos de 44 px",
);
assert.match(
  visual,
  /overflow-x:\s*(?:clip|hidden)/,
  "A home deve declarar contenção de overflow horizontal",
);
assert.doesNotMatch(
  `${visual}\n${mobileVisual}\n${a11yVisual}`,
  /url\(["']?https?:\/\//i,
  "A camada visual não pode depender de ativos externos em tempo de execução",
);

for (const guardedFile of [
  "client/src/styles/premium-visual-v13-mobile.css",
  "client/src/styles/premium-visual-v13-a11y.css",
]) {
  assert.ok(
    workflow.includes(guardedFile),
    `Mudanças em ${guardedFile} devem sempre disparar o workflow visual`,
  );
}

for (const step of [
  "node tests/unit/premium-visual-v13-contract.test.mjs",
  "npm run audit:a11y",
  "node tests/e2e/responsive-shell-smoke.mjs",
  "node tests/e2e/premium-visual-proof.mjs",
  "scripts/guards/a11y-report.json",
  "steps.a11y.outcome != 'success'",
  "actions/upload-artifact",
]) {
  assert.ok(
    workflow.includes(step),
    `Workflow de antirregressão não executa: ${step}`,
  );
}

console.log(
  "[premium-v13-contract] ✓ rotas, busca, identidade, métricas, ordem de CSS, anticolisão móvel, contraste WCAG, responsividade e CI preservados.",
);
