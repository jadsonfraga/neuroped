import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const main = read("client/src/main.tsx");
const workspace = read("client/src/lib/workspaceSurface.ts");
const css = read("client/src/styles/premium-internal-app-v15.css");
const a11yCss = read(
  "client/src/styles/premium-internal-app-v15-a11y.css",
);
const responsiveCss = read(
  "client/src/styles/premium-internal-app-v15-responsive.css",
);
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const workflow = read(".github/workflows/premium-visual-v13.yml");

assert.ok(
  workspace.includes(
    'import { currentHashPath, isPublicRoute } from "@/lib/publicRoutes"',
  ),
  "A classificação visual deve reutilizar a allowlist pública canônica",
);
assert.ok(
  workspace.includes(
    'surface: WorkspaceSurface = isPublicRoute(path) ? "public" : "clinical"',
  ),
  "Rotas não públicas devem permanecer clínicas por padrão",
);
assert.ok(
  workspace.includes('root.dataset.npWorkspace = surface') &&
    workspace.includes('root.dataset.npRoute = routeToken(path)') &&
    workspace.includes('window.addEventListener("hashchange", sync)'),
  "Workspace visual deve sincronizar no primeiro paint e em toda navegação",
);
assert.ok(
  workspace.includes('path.split("/").filter(Boolean)[0]') &&
    workspace.includes("IDs de paciente"),
  "Metadados visuais devem usar somente o primeiro segmento e nunca copiar IDs dinâmicos para o DOM",
);
assert.doesNotMatch(
  workspace,
  /path\s*\.replace\(\/\^\\\/\+\|\\\/\+\$\/g/,
  "O token visual não pode serializar o caminho clínico completo",
);
assert.ok(
  publicRoutes.includes("const PUBLIC_ROUTE_SET") &&
    publicRoutes.includes("export function isPublicRoute"),
  "A v15 não pode criar uma segunda lista de rotas públicas",
);

assert.ok(
  main.includes(
    'import { installWorkspaceSurface } from "./lib/workspaceSurface"',
  ),
  "main deve instalar a classificação de workspace",
);
assert.ok(
  main.includes("installWorkspaceSurface();"),
  "A classificação precisa ocorrer antes do render do aplicativo",
);

const v14Responsive = main.indexOf(
  './styles/premium-native-app-v14-responsive.css',
);
const v15 = main.indexOf('./styles/premium-internal-app-v15.css');
const v15A11y = main.indexOf(
  './styles/premium-internal-app-v15-a11y.css',
);
const v15Responsive = main.indexOf(
  './styles/premium-internal-app-v15-responsive.css',
);
const v16 = main.indexOf('./styles/premium-sidebar-v16.css');
const touch = main.indexOf('./styles/tablet-coarse-perf.css');
assert.ok(v15 > v14Responsive, "v15 deve carregar depois do acabamento v14");
assert.ok(v15A11y > v15, "O reforço WCAG interno deve carregar depois da v15");
assert.ok(
  v15Responsive > v15A11y,
  "A contenção responsiva deve carregar depois do acabamento principal da v15",
);
assert.ok(v16 > v15Responsive, "A sidebar v16 deve carregar depois da v15");
assert.ok(
  touch > v16,
  "tablet-coarse-perf deve continuar sendo a última camada de desempenho",
);

const requiredContracts = [
  'html[data-np-workspace="clinical"]:not([data-np-route="home"])',
  "#main-content",
  "> .np-app-content",
  ".np-page-hero",
  ".shadcn-card",
  "input:not([type=\"checkbox\"])",
  '[role="tablist"]:not([aria-orientation="vertical"])',
  "div:has(> table)",
  '[role="dialog"]',
  ".np-legal-disclosure",
  "@media screen and (max-width: 1023px)",
  "@media screen and (max-width: 767px)",
  "@media (any-pointer: coarse)",
  "@media (prefers-reduced-motion: reduce)",
  "@media print",
];

for (const contract of requiredContracts) {
  assert.ok(css.includes(contract), `Contrato interno ausente: ${contract}`);
}

for (const declaration of [
  "border-radius: 0 !important",
  "background: transparent !important",
  "min-height: 44px",
  "scroll-snap-type: x proximity",
  "overscroll-behavior-inline: contain",
  "font-variant-numeric: tabular-nums",
]) {
  assert.ok(css.includes(declaration), `Declaração v15 ausente: ${declaration}`);
}

for (const contrastContract of [
  'html[data-np-workspace="clinical"]:not([data-np-route="home"])',
  ".np-app-content",
  "> p.flex-wrap",
  "> span",
  "color: hsl(var(--muted-foreground))",
]) {
  assert.ok(
    a11yCss.includes(contrastContract),
    `Reforço WCAG interno ausente: ${contrastContract}`,
  );
}

for (const tableContract of [
  "@media screen and (max-width: 767px)",
  "div:has(> table)",
  "width: 100% !important",
  "max-width: 100% !important",
  "min-width: 0",
]) {
  assert.ok(
    responsiveCss.includes(tableContract),
    `Contenção de tabela móvel ausente: ${tableContract}`,
  );
}
assert.doesNotMatch(
  responsiveCss,
  /100vw/,
  "A correção de tabelas aninhadas não pode ser dimensionada pelo viewport",
);

assert.doesNotMatch(
  `${css}\n${a11yCss}\n${responsiveCss}`,
  /html\[data-np-workspace="public"\]/,
  "A camada clínica não pode reestilizar deliberadamente as rotas públicas",
);
assert.doesNotMatch(
  `${css}\n${a11yCss}\n${responsiveCss}`,
  /url\(["']?https?:\/\//i,
  "A v15 não pode depender de ativos externos em tempo de execução",
);
assert.doesNotMatch(
  css,
  /(?:form|table|input|textarea|button|\.shadcn-card)[^{]*\{[^}]*display:\s*none/i,
  "A uniformização visual não pode ocultar conteúdo funcional",
);

for (const guardedFile of [
  "client/src/components/Layout.tsx",
  "client/src/data/navigation.ts",
  "client/src/lib/publicRoutes.ts",
  "client/src/lib/workspaceSurface.ts",
  "client/src/security/routeGuardPolicy.ts",
  "client/src/styles/premium-internal-app-v15.css",
  "client/src/styles/premium-internal-app-v15-a11y.css",
  "client/src/styles/premium-internal-app-v15-responsive.css",
  "tests/unit/premium-internal-app-v15-contract.test.mjs",
  "tests/e2e/premium-internal-workspace.mjs",
]) {
  assert.ok(
    workflow.includes(guardedFile),
    `Mudanças em ${guardedFile} devem sempre disparar a trava premium`,
  );
}

for (const command of [
  "node tests/unit/premium-internal-app-v15-contract.test.mjs",
  "node tests/e2e/premium-internal-workspace.mjs",
]) {
  assert.ok(
    workflow.includes(command),
    `Workflow não executa o gate v15: ${command}`,
  );
}

console.log(
  "[premium-internal-v15] ✓ classificação fail-closed sem IDs, canvas de app, superfícies, formulários, tabs, tabelas aninhadas, WCAG, touch, dark e impressão protegidos.",
);
