import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const main = read("client/src/main.tsx");
const css = read("client/src/styles/premium-sidebar-v16.css");
const layout = read("client/src/components/Layout.tsx");
const workflow = read(".github/workflows/premium-visual-v13.yml");

assert.ok(
  layout.includes('data-testid={`featured-${item.label}`}') &&
    layout.includes("visibleFeaturedNavigation.slice(0, 2)") &&
    layout.includes("visibleFeaturedNavigation.slice(2)"),
  "O refinamento deve continuar usando o inventário filtrado e a hierarquia canônicos da sidebar",
);

const v15A11y = main.indexOf(
  './styles/premium-internal-app-v15-a11y.css',
);
const v16 = main.indexOf('./styles/premium-sidebar-v16.css');
const touch = main.indexOf('./styles/tablet-coarse-perf.css');
assert.ok(v16 > v15A11y, "A sidebar v16 deve carregar depois das superfícies v15");
assert.ok(
  touch > v16,
  "A proteção de desempenho touch deve continuar como última camada",
);

for (const contract of [
  '@media screen and (min-width: 1280px)',
  'aside.np-app-sidebar[class~="lg:w-64"]',
  '#main-content[class~="lg:ml-64"]',
  '.grid.grid-cols-2',
  '[data-testid^="featured-"]',
  'min-height: 5rem !important',
  'flex-direction: column',
  '-webkit-line-clamp: 3',
  '> span:last-child',
  '@media (hover: hover) and (pointer: fine)',
  '@media (prefers-reduced-motion: reduce)',
  '@media print',
]) {
  assert.ok(css.includes(contract), `Contrato da sidebar v16 ausente: ${contract}`);
}

assert.match(
  css,
  /width:\s*17\.5rem\s*!important/,
  "A sidebar expandida deve ganhar largura operacional em desktops confortáveis",
);
assert.match(
  css,
  /font-size:\s*max\(11px,\s*0\.72rem\)\s*!important/,
  "Os rótulos compactos devem manter piso absoluto de 11 px",
);
assert.doesNotMatch(
  css,
  /url\(["']?https?:\/\//i,
  "A sidebar v16 não pode depender de ativos externos",
);

for (const guardedFile of [
  "client/src/styles/premium-sidebar-v16.css",
  "tests/unit/premium-sidebar-v16-contract.test.mjs",
  "tests/e2e/premium-sidebar-geometry.mjs",
]) {
  assert.ok(
    workflow.includes(guardedFile),
    `Mudanças em ${guardedFile} devem disparar a trava premium`,
  );
}

for (const command of [
  "node tests/unit/premium-sidebar-v16-contract.test.mjs",
  "node tests/e2e/premium-sidebar-geometry.mjs",
]) {
  assert.ok(
    workflow.includes(command),
    `Workflow não executa o gate da sidebar: ${command}`,
  );
}

console.log(
  "[premium-sidebar-v16] ✓ largura, app tiles, legibilidade, motion, impressão e ordem de cascata protegidos.",
);
