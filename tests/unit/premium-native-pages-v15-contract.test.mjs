import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const main = read("client/src/main.tsx");
const visual = read("client/src/styles/premium-native-pages-v15.css");
const workflow = read(".github/workflows/premium-visual-v13.yml");

const v14Index = main.indexOf('./styles/premium-native-app-v14-responsive.css');
const v15Index = main.indexOf('./styles/premium-native-pages-v15.css');
const touchIndex = main.indexOf('./styles/tablet-coarse-perf.css');

assert.ok(v14Index >= 0, "A proteção responsiva v14 continua obrigatória");
assert.ok(v15Index > v14Index, "A camada interna v15 deve carregar depois da v14");
assert.ok(
  touchIndex > v15Index,
  "A proteção touch/desempenho deve continuar sendo a última camada visual",
);

const requiredContracts = [
  ".np-app-content:not(:has(.np-v13-home))",
  ".np-page-hero",
  ".shadcn-card",
  '[data-slot="card"]',
  '[role="tablist"]',
  '[role="dialog"]',
  "table",
  "min-height: 44px",
  "max-height: min(90dvh",
  "@media screen and (max-width: 767px)",
  "@media (any-pointer: coarse)",
  "@media (prefers-reduced-motion: reduce)",
  "@media print",
];

for (const contract of requiredContracts) {
  assert.ok(
    visual.includes(contract),
    `Camada v15 sem contrato obrigatório: ${contract}`,
  );
}

assert.ok(
  visual.includes("PageHero deixa de parecer banner/landing page"),
  "A intenção anti-landing-page deve permanecer documentada",
);
assert.match(
  visual,
  /\.np-app-content:not\(:has\(\.np-v13-home\)\) \.np-page-hero \{[\s\S]*?min-height:\s*0\s*!important/,
  "PageHero interno não pode voltar a ter altura promocional",
);
assert.match(
  visual,
  /\.np-app-content:not\(:has\(\.np-v13-home\)\) \.np-page-hero h1 \{[\s\S]*?font-size:\s*clamp\(/,
  "Títulos internos devem manter escala operacional",
);
assert.match(
  visual,
  /input:not\(\[type="checkbox"\]\)[\s\S]*?min-height:\s*44px/,
  "Controles de formulário devem preservar alvo mínimo de 44 px",
);
assert.match(
  visual,
  /font-size:\s*max\(16px,\s*1rem\)/,
  "Inputs touch devem evitar zoom involuntário no iOS",
);
assert.doesNotMatch(
  visual,
  /url\(["']?https?:\/\//i,
  "A camada v15 não pode depender de ativos remotos",
);
assert.doesNotMatch(
  visual,
  /font-size:\s*(?:[3-9]|\d{2,})rem/,
  "Telas internas não podem reintroduzir tipografia de landing page",
);

for (const guardedPath of [
  "client/src/styles/premium-native-pages-v15.css",
  "tests/unit/premium-native-pages-v15-contract.test.mjs",
  "tests/e2e/premium-native-pages-v15.mjs",
]) {
  assert.ok(
    workflow.includes(guardedPath),
    `Alterações em ${guardedPath} devem disparar o gate premium`,
  );
}

assert.ok(
  workflow.includes("node tests/unit/premium-native-pages-v15-contract.test.mjs"),
  "O contrato v15 deve ser executado no workflow",
);
assert.ok(
  workflow.includes("node tests/e2e/premium-native-pages-v15.mjs"),
  "A prova dos arquétipos internos deve ser obrigatória",
);

console.log(
  "[premium-native-pages-v15] ✓ canvas, heróis, cards, formulários, tabs, tabelas, dialogs, touch, acessibilidade, impressão e CI protegidos.",
);
