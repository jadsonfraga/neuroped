import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const main = read("client/src/main.tsx");
const css = read("client/src/styles/premium-native-app-v14.css");
const home = read("client/src/pages/home.tsx");
const workflow = read(".github/workflows/premium-visual-v13.yml");

const v13A11y = main.indexOf('./styles/premium-visual-v13-a11y.css');
const v14 = main.indexOf('./styles/premium-native-app-v14.css');
const touch = main.indexOf('./styles/tablet-coarse-perf.css');

assert.ok(v14 > v13A11y, "v14 deve carregar depois da proteção WCAG da v13");
assert.ok(touch > v14, "proteção touch/performance deve continuar sendo a última camada");

for (const contract of [
  ".np-v13-hero",
  ".np-v13-control-panel",
  ".np-v13-metric-card",
  ".np-v13-flow-card",
  "scroll-snap-type: x mandatory",
  "overflow-x: auto",
  "flex-direction: row !important",
  "overscroll-behavior-inline: contain",
  "-webkit-overflow-scrolling: touch",
  '[data-testid="mobile-primary-dock"]',
  '[data-testid="mobile-dock-nesplora"]',
  "@media screen and (max-width: 767px)",
  "@media screen and (max-width: 1023px)",
  "@media (prefers-reduced-motion: reduce)",
  "@media print",
]) {
  assert.ok(css.includes(contract), `Contrato app-like ausente: ${contract}`);
}

assert.match(
  css,
  /min-height:\s*2\.75rem/,
  "ações móveis devem preservar alvo tátil de 44 px",
);
assert.ok(
  css.includes("width: min(82vw, 19rem) !important"),
  "cards do rail móvel devem manter preview do próximo item",
);
assert.ok(
  css.includes("max-width: 15ch") && css.includes("3.65rem"),
  "hero deve permanecer compacto e operacional no desktop",
);
assert.doesNotMatch(
  css,
  /url\(["']?https?:\/\//i,
  "v14 não pode depender de ativos externos",
);

for (const testId of [
  "premium-home-v13",
  "premium-primary-action",
  "premium-secondary-action",
  "premium-flow-grid",
  "premium-responsible-note",
]) {
  assert.ok(home.includes(testId), `v14 não pode perder o contrato ${testId}`);
}

for (const route of [
  "/mchat",
  "/filtro",
  "/avaliacao-cognitiva-infantil",
  "/testes-reconhecimento",
  "/marcos-desenvolvimento",
]) {
  assert.ok(home.includes(`"${route}"`), `v14 não pode remover ${route}`);
}

assert.ok(
  workflow.includes("client/src/styles/premium-native-app-v14.css"),
  "alterações no acabamento app-like devem disparar CI",
);
assert.ok(
  workflow.includes("node tests/unit/premium-native-app-v14-contract.test.mjs"),
  "workflow deve executar o gate app-like v14",
);

console.log(
  "[premium-native-app-v14] ✓ densidade de app, rail móvel, dock, touch, rotas e ordem de CSS protegidos.",
);
