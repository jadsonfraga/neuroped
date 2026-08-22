import fs from "node:fs";
import path from "node:path";
import { hasRegisteredRoute } from "./lib/route-matcher.mjs";

const root = process.cwd();
const rel = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(rel(file), "utf8");
const exists = (file) => fs.existsSync(rel(file));

const app = read("client/src/App.tsx");
const navigation = read("client/src/data/navigation.ts");

const routePaths = [...app.matchAll(/<Route\b[^>]*\bpath="([^"]+)"/g)].map(
  (match) => match[1],
);
const navEntries = [
  ...navigation.matchAll(/\{\s*href:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g),
].map((match) => ({
  href: match[1],
  label: match[2],
}));

const lazyImports = [
  ...[
    ...app.matchAll(
      /const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*"@\/pages\/([^"]+)"\s*\)\s*,?\s*\)/g,
    ),
  ].map((match) => ({ symbol: match[1], page: match[2] })),
  ...[...app.matchAll(/import\s+(\w+)\s+from\s+"@\/pages\/([^"]+)"/g)].map(
    (match) => ({ symbol: match[1], page: match[2] }),
  ),
];

const pageFiles = fs
  .readdirSync(rel("client/src/pages"))
  .filter((file) => file.endsWith(".tsx"));
const dataFiles = fs
  .readdirSync(rel("client/src/data"))
  .filter((file) => file.endsWith(".ts"));
const componentFiles = fs
  .readdirSync(rel("client/src/components"))
  .filter((file) => file.endsWith(".tsx"));
const assetFiles = [
  ...fs
    .readdirSync(rel("client/public"))
    .map((file) => `client/public/${file}`),
  ...fs
    .readdirSync(rel("client/src/assets/images"))
    .map((file) => `client/src/assets/images/${file}`),
].filter((file) => exists(file) && fs.statSync(rel(file)).isFile());

const localStorageKeys = new Set();
for (const base of [
  "client/src/components",
  "client/src/hooks",
  "client/src/lib",
  "client/src/pages",
]) {
  const stack = [rel(base)];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        const text = fs.readFileSync(full, "utf8");
        for (const match of text.matchAll(
          /localStorage\.(?:getItem|setItem|removeItem)\(\s*"([^"]+)"/g,
        )) {
          localStorageKeys.add(match[1]);
        }
      }
    }
  }
}

/**
 * Páginas preservadas como patrimônio, mas deliberadamente sem rota própria.
 * Toda substituição aponta para a implementação que assumiu o fluxo. Uma nova
 * página sem import/rota e sem entrada explícita aqui reprova o inventário.
 */
const intentionalPageReplacements = new Map([
  [
    "filtro-engine",
    {
      replacementRoute: "/filtro",
      reason: "engine lazy interno da rota do filtro; não é página independente",
    },
  ],
  [
    "bloco3-showcase",
    {
      replacementRoute: null,
      reason: "showcase interno de desenvolvimento; não é tela de produção",
    },
  ],
  [
    "diario-epilepsia",
    {
      replacementRoute: "/epilepsia",
      reason: "substituída pelo diário longitudinal epilepsy-diary",
    },
  ],
  [
    "efeitos-colaterais",
    {
      replacementRoute: "/efeitos-colaterais",
      reason:
        "placeholder substituído pelo fluxo familiar completo de pré-retorno",
    },
  ],
  [
    "portal-novidades",
    {
      replacementRoute: "/portal-familia/novidades",
      reason: "substituída pela variante segura do portal familiar",
    },
  ],
  [
    "tea-checklists",
    {
      replacementRoute: "/tea",
      reason: "conteúdo consolidado na página TEA registrada",
    },
  ],
]);

const essentialRoutePaths = [
  "/",
  "/filtro",
  "/qualidade",
  "/portal-familia",
  "/pant",
  "/pacientes",
  "/paciente/:id",
  "/calculadora-dose",
  "/farmacologia",
  "/avaliacao-multiprofissional",
  "/recepcao",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
  "/prontuario",
  "/documentos",
  "/assinatura-digital",
  "/satisfacao-medicacao",
  "/plano-terapeutico",
  "/plano-intervencao",
  "/fichas-registro",
  "/laudo-neuroped",
  "/receita-c1",
  "/receita-c1-express",
  "/verificar",
  "/diario-escola",
  "/inventarios-escola",
];

const restoredRouteContracts = [
  {
    path: "/recepcao",
    page: "recepcao",
    symbol: "RecepcaoPage",
    roles: ["admin", "professional", "operator"],
  },
  { path: "/pre-consulta", page: "pre-consulta", symbol: "PreConsultaPage" },
  { path: "/pre-retorno", page: "pre-retorno", symbol: "PreRetornoPage" },
  {
    path: "/efeitos-colaterais",
    page: "pre-retorno",
    symbol: "PreRetornoPage",
  },
  {
    path: "/prontuario",
    page: "prontuario",
    symbol: "ProntuarioPage",
    roles: ["admin", "professional"],
  },
  {
    path: "/documentos",
    page: "documentos",
    symbol: "DocumentosPage",
    roles: ["admin", "professional"],
  },
  {
    path: "/assinatura-digital",
    page: "assinatura-digital",
    symbol: "AssinaturaDigitalPage",
    roles: ["admin", "professional"],
  },
  {
    path: "/satisfacao-medicacao",
    page: "satisfacao-medicacao",
    symbol: "SatisfacaoMedicacaoPage",
    roles: ["admin", "professional"],
  },
  {
    path: "/plano-terapeutico",
    page: "plano-terapeutico",
    symbol: "PlanoTerapeuticoPage",
    roles: ["admin", "professional"],
  },
  {
    path: "/plano-intervencao",
    page: "plano-intervencao",
    symbol: "PlanoIntervencaoPage",
    roles: ["admin", "professional"],
  },
  {
    path: "/fichas-registro",
    page: "fichas-registro",
    symbol: "FichasRegistroPage",
    roles: ["admin", "professional"],
  },
  {
    path: "/laudo-neuroped",
    page: "laudo-neuroped",
    symbol: "LaudoNeuropedPage",
    roles: ["admin", "professional"],
  },
  {
    path: "/receita-c1",
    page: "receita-c1",
    symbol: "ReceitaC1Page",
    roles: ["admin", "professional"],
  },
  {
    path: "/receita-c1-express",
    page: "receita-c1-express",
    symbol: "ReceitaC1ExpressPage",
    roles: ["admin", "professional"],
  },
  { path: "/verificar", page: "verificar", symbol: "VerificarPage" },
  {
    path: "/diario-escola",
    page: "diario-escola",
    symbol: "DiarioEscolaPage",
    roles: ["admin", "professional"],
  },
  {
    path: "/inventarios-escola",
    page: "inventarios-escola",
    symbol: "InventariosEscolaPage",
    roles: ["admin", "professional"],
  },
];

function routeSourceBlock(routePath) {
  const marker = `<Route path="${routePath}"`;
  const start = app.indexOf(marker);
  if (start === -1) return "";
  const openingEnd = app.indexOf(">", start);
  if (openingEnd === -1) return "";
  const opening = app.slice(start, openingEnd + 1);
  if (/\/\s*>$/.test(opening)) return opening;
  const closingEnd = app.indexOf("</Route>", openingEnd);
  return closingEnd === -1
    ? opening
    : app.slice(start, closingEnd + "</Route>".length);
}

const missingNavRoutes = navEntries.filter(
  (entry) => !hasRegisteredRoute(routePaths, entry.href),
);
const missingImportedPages = lazyImports.filter(
  ({ page }) => !exists(`client/src/pages/${page}.tsx`),
);
const allOrphanPages = pageFiles
  .map((file) => file.replace(/\.tsx$/, ""))
  .filter(
    (page) =>
      page !== "not-found" && !lazyImports.some((item) => item.page === page),
  );
const intentionalOrphanPages = allOrphanPages.filter((page) =>
  intentionalPageReplacements.has(page),
);
const unclassifiedOrphanPages = allOrphanPages.filter(
  (page) => !intentionalPageReplacements.has(page),
);

const missingEssentialRoutes = essentialRoutePaths.filter(
  (route) => !hasRegisteredRoute(routePaths, route),
);
const brokenReplacementTargets = [...intentionalPageReplacements.entries()]
  .filter(([, value]) => value.replacementRoute)
  .filter(
    ([, value]) => !hasRegisteredRoute(routePaths, value.replacementRoute),
  );
const brokenRestoredRouteContracts = restoredRouteContracts.filter(
  (contract) => {
    const imported = lazyImports.some(
      (item) => item.page === contract.page && item.symbol === contract.symbol,
    );
    const block = routeSourceBlock(contract.path);
    const rendersExpectedPage =
      block.includes(`component={${contract.symbol}}`) ||
      block.includes(`<${contract.symbol}`);
    return !imported || !rendersExpectedPage;
  },
);
const brokenRoleContracts = restoredRouteContracts.filter((contract) => {
  if (!contract.roles) return false;
  const block = routeSourceBlock(contract.path);
  return (
    !block.includes("<RouteGuard") ||
    contract.roles.some((role) => !block.includes(`"${role}"`))
  );
});

const blockingIssues =
  missingNavRoutes.length +
  missingImportedPages.length +
  missingEssentialRoutes.length +
  brokenReplacementTargets.length +
  brokenRestoredRouteContracts.length +
  brokenRoleContracts.length +
  unclassifiedOrphanPages.length;

const classifications = [
  [
    "A",
    "Núcleo clínico operacional",
    `${essentialRoutePaths.length} rotas essenciais verificadas`,
  ],
  [
    "A",
    "Persistência de preferências",
    [...localStorageKeys].sort().join(", ") || "sem chaves detectadas",
  ],
  [
    "B",
    "Páginas substituídas/legadas documentadas",
    intentionalOrphanPages.join(", ") || "nenhuma",
  ],
  [
    "B",
    "Assets e mascotes",
    `${assetFiles.length} assets públicos/de imagem inventariados`,
  ],
  [
    "C",
    "Duplicação reduzida",
    "navegação lateral e paleta de comandos usam client/src/data/navigation.ts",
  ],
  [
    "D",
    "Abandonado crítico",
    blockingIssues
      ? `${blockingIssues} inconsistência(s) bloqueante(s)`
      : "nenhum item bloqueante encontrado",
  ],
];

console.log("\nInventário NeuroPed — consolidação 8,5");
console.log("=======================================");
console.log(`Rotas declaradas: ${routePaths.length}`);
console.log(`Itens navegáveis: ${navEntries.length}`);
console.log(`Páginas TSX: ${pageFiles.length}`);
console.log(`Módulos de dados: ${dataFiles.length}`);
console.log(`Componentes: ${componentFiles.length}`);
console.log(`Assets: ${assetFiles.length}`);
console.log(`Chaves localStorage: ${localStorageKeys.size}`);
console.log("\nClassificação A/B/C/D:");
for (const [grade, title, detail] of classifications) {
  console.log(`- ${grade} — ${title}: ${detail}`);
}

if (missingNavRoutes.length) {
  console.error("\nRotas ausentes para itens de navegação:");
  for (const item of missingNavRoutes) {
    console.error(`- ${item.href} (${item.label})`);
  }
}

if (missingImportedPages.length) {
  console.error("\nImports de páginas sem arquivo correspondente:");
  for (const item of missingImportedPages) {
    console.error(`- ${item.symbol}: client/src/pages/${item.page}.tsx`);
  }
}

if (missingEssentialRoutes.length) {
  console.error("\nRotas essenciais ausentes:");
  for (const route of missingEssentialRoutes) console.error(`- ${route}`);
}

if (brokenRestoredRouteContracts.length) {
  console.error("\nRotas restauradas sem a página esperada:");
  for (const contract of brokenRestoredRouteContracts) {
    console.error(
      `- ${contract.path} -> ${contract.symbol} (${contract.page}.tsx)`,
    );
  }
}

if (brokenRoleContracts.length) {
  console.error("\nRotas elevadas sem o RouteGuard/roles esperado:");
  for (const contract of brokenRoleContracts) {
    console.error(`- ${contract.path}: ${contract.roles.join(", ")}`);
  }
}

if (brokenReplacementTargets.length) {
  console.error("\nPáginas legadas com substituição ausente:");
  for (const [page, value] of brokenReplacementTargets) {
    console.error(`- ${page}.tsx -> ${value.replacementRoute}`);
  }
}

if (unclassifiedOrphanPages.length) {
  console.error("\nPáginas sem rota e sem classificação explícita:");
  for (const page of unclassifiedOrphanPages) {
    console.error(`- client/src/pages/${page}.tsx`);
  }
}

if (intentionalOrphanPages.length) {
  console.log("\nPáginas preservadas sem rota própria:");
  for (const page of intentionalOrphanPages) {
    const replacement = intentionalPageReplacements.get(page);
    const target = replacement.replacementRoute
      ? ` -> ${replacement.replacementRoute}`
      : "";
    console.log(`- ${page}.tsx${target}: ${replacement.reason}`);
  }
}

if (blockingIssues) process.exitCode = 1;
