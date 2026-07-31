// AUDITORIA ESPIRAL DO FILTRO E DAS ESCALAS.
//
// Este guard cobre cinco contratos de release:
//   1. toda escala citável pelo filtro abre como aplicação real;
//   2. recomendações auxiliares têm ids, idades, rotas e curadorias íntegras;
//   3. sinais de queixas removidas não continuam influenciando o ranking;
//   4. cards navegáveis não contêm controles interativos aninhados;
//   5. os refinamentos visuais/acessíveis permanecem conectados ao gate oficial.
//
// A auditoria acumula todos os achados antes de falhar, para evitar o ciclo
// improdutivo de corrigir um único erro por execução.
import { pathToFileURL, fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const imp = (relativePath) =>
  import(pathToFileURL(resolve(root, relativePath)).href);
const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");

const {
  allScales,
  queixas,
} = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp(
  "client/src/data/filterableCatalog.ts"
);
const { noCostWorldScales } = await imp(
  "client/src/data/noCostWorldScales.ts"
);
const { getImplementationStatus } = await imp(
  "client/src/data/advancedFilterLogic.ts"
);
const { interactiveScaleItems } = await imp(
  "client/src/data/interactiveScaleItems.ts"
);
const { interactiveScales } = await imp(
  "client/src/data/interactiveScales.ts"
);
const {
  testesDiretosRecommendations,
  clinicalPaths,
  recommendDirectTests,
} = await imp("client/src/data/testesDiretosRecommendations.ts");
const {
  testesPaisRecommendations,
  parentAssessmentPaths,
  recommendParentTests,
} = await imp("client/src/data/testesPaisRecommendations.ts");
const { getAllSignalsForQueixa } = await imp(
  "client/src/data/signalsAndSymptoms.ts"
);
const { getOrphanFilterSignalIds } = await imp(
  "client/src/data/filterSignalState.ts"
);

let classificationScales = {};
try {
  ({ classificationScales } = await imp(
    "client/src/data/classificationScales.ts"
  ));
} catch {
  // O catálogo de classificação é opcional em builds reduzidos.
}

const violations = [];
const fail = (message) => violations.push(message);
const check = (condition, message) => {
  if (!condition) fail(message);
};

const unique = (items) => {
  const seen = new Set();
  return items.filter((item) =>
    seen.has(item.id) ? false : (seen.add(item.id), true)
  );
};

// ───────────────────────── 1. Catálogo preenchível ─────────────────────────
const INTERACTIVE = new Set([
  ...Object.keys(interactiveScaleItems || {}),
  ...Object.keys(interactiveScales || {}),
]);
const CLASSIFICATION = new Set(Object.keys(classificationScales || {}));
const allScaleIds = new Set(allScales.map((scale) => scale.id));

const resolveAppRoute = (scale) =>
  scale.appRoute
    ? scale.appRoute
    : allScaleIds.has(scale.id)
      ? `/generic-scale/${scale.id}`
      : scale.id.startsWith("world-")
        ? "/escalas-neuropsiquiatria"
        : null;
const hasDedicatedRoute = (scale) => {
  const route = scale.appRoute;
  return (
    Boolean(route) &&
    !route.startsWith("/generic-scale/") &&
    route !== "/escalas-neuropsiquiatria" &&
    route !== "/filtro"
  );
};
const opensAsUsableTool = (scale) =>
  hasDedicatedRoute(scale) || INTERACTIVE.has(scale.id);
const opensInApp = (scale) => {
  const route = resolveAppRoute(scale);
  return Boolean(route) && route !== "/escalas-neuropsiquiatria";
};
const isFullApp = (scale) =>
  scale.applicationMode !== "psicoeducacao" &&
  getImplementationStatus(scale) === "complete" &&
  opensAsUsableTool(scale);

const filterCatalog = unique([
  ...mergeFilterableCatalog(allScales),
  ...noCostWorldScales,
]).filter((scale) => opensInApp(scale) && isFullApp(scale));

const VERIFIED_INTERACTIVE_ROUTES = new Set([
  "/testes-diretos",
  "/testes-reconhecimento",
  "/testes-academicos",
  "/mchat",
  "/snap",
  "/vanderbilt",
  "/sdq",
  "/scared",
  "/phqa",
  "/cssrs",
  "/ygtss",
  "/crafft",
  "/denver",
  "/asq3",
  "/portage",
  "/cars",
  "/tea",
  "/tea-comportamentos",
  "/conners",
  "/brief2",
  "/cbcl",
  "/abc",
  "/cdi2",
  "/epilepsia",
  "/gmfcs",
  "/espasticidade",
  "/cshq",
  "/cefaleia",
  "/pedsql",
  "/ecar-si",
  "/pant",
  "/emdi",
  "/eaf",
  "/pdae",
  "/ecsm",
  "/ips",
  "/edi",
  "/eai",
  "/easi",
  "/ems",
  "/etare",
  "/eaah",
  "/ballard",
  "/tde2",
  "/ahsd-tea",
  "/eusm10",
  "/aq10",
  "/aq50",
  "/psc17",
  "/inventarios-auto",
]);
const isVerifiedClassificationRoute = (route) =>
  route.startsWith("/classificacao/");

for (const scale of filterCatalog) {
  const viaItems = INTERACTIVE.has(scale.id);
  const viaClassification =
    CLASSIFICATION.has(scale.id) ||
    isVerifiedClassificationRoute(scale.appRoute || "");
  const viaRoute =
    hasDedicatedRoute(scale) &&
    VERIFIED_INTERACTIVE_ROUTES.has(scale.appRoute);
  if (!viaItems && !viaClassification && !viaRoute) {
    fail(
      `escala ${scale.id}: citável pelo filtro, mas sem itens, classificação ou rota dedicada verificada (rota=${resolveAppRoute(scale)})`,
    );
  }
}

// ───────────────────── 2. Recomendações e rotas auxiliares ──────────────────
const appSource = read("client/src/App.tsx");
const registeredRoutes = new Set(
  [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map(
    (match) => match[1],
  ),
);

function validateRecommendationSet(label, items) {
  const ids = new Set();
  for (const item of items) {
    check(Boolean(item.id?.trim()), `${label}: recomendação sem id`);
    check(!ids.has(item.id), `${label}: id duplicado ${item.id}`);
    ids.add(item.id);
    check(Boolean(item.name?.trim()), `${label}/${item.id}: nome ausente`);
    check(
      Number.isInteger(item.ageMin) &&
        Number.isInteger(item.ageMax) &&
        item.ageMin >= 0 &&
        item.ageMax >= item.ageMin,
      `${label}/${item.id}: faixa etária inválida ${item.ageMin}-${item.ageMax}`,
    );
    check(
      Array.isArray(item.queixas) && item.queixas.length > 0,
      `${label}/${item.id}: nenhuma queixa associada`,
    );
    check(Boolean(item.tempo?.trim()), `${label}/${item.id}: tempo ausente`);
    check(
      typeof item.razao === "string" && item.razao.trim().length >= 20,
      `${label}/${item.id}: justificativa clínica insuficiente`,
    );
    check(
      typeof item.route === "string" && item.route.startsWith("/"),
      `${label}/${item.id}: rota inválida ${item.route}`,
    );
    check(item.route !== "/filtro", `${label}/${item.id}: loop para /filtro`);
    check(
      !item.route.includes("?"),
      `${label}/${item.id}: rota contém estado transitório em query (${item.route})`,
    );
    check(
      registeredRoutes.has(item.route),
      `${label}/${item.id}: rota não registrada em App.tsx (${item.route})`,
    );
  }
  return ids;
}

function validateCuratedPaths(label, paths, recommendationIds) {
  const pathQueixas = new Set();
  for (const path of paths) {
    check(Boolean(path.queixa?.trim()), `${label}: caminho sem queixa`);
    check(
      !pathQueixas.has(path.queixa),
      `${label}: queixa duplicada ${path.queixa}`,
    );
    pathQueixas.add(path.queixa);
    check(Boolean(path.label?.trim()), `${label}/${path.queixa}: rótulo ausente`);
    check(
      Array.isArray(path.primaryTests) && path.primaryTests.length > 0,
      `${label}/${path.queixa}: caminho sem testes primários`,
    );
    check(
      new Set(path.primaryTests).size === path.primaryTests.length,
      `${label}/${path.queixa}: teste primário duplicado`,
    );
    for (const id of path.primaryTests) {
      check(
        recommendationIds.has(id),
        `${label}/${path.queixa}: referência inexistente ${id}`,
      );
    }
  }
}

const directIds = validateRecommendationSet(
  "testes diretos",
  testesDiretosRecommendations,
);
const parentIds = validateRecommendationSet(
  "escalas para pais",
  testesPaisRecommendations,
);
validateCuratedPaths("caminhos diretos", clinicalPaths, directIds);
validateCuratedPaths(
  "caminhos parentais",
  parentAssessmentPaths,
  parentIds,
);

for (const item of testesDiretosRecommendations) {
  const midpoint = Math.floor((item.ageMin + item.ageMax) / 2);
  const selected = recommendDirectTests([item.queixas[0]], midpoint);
  check(
    selected.some((candidate) => candidate.id === item.id),
    `testes diretos/${item.id}: recomendação inalcançável pela própria queixa e idade`,
  );
}
for (const item of testesPaisRecommendations) {
  const midpoint = Math.floor((item.ageMin + item.ageMax) / 2);
  const selected = recommendParentTests([item.queixas[0]], midpoint);
  check(
    selected.some((candidate) => candidate.id === item.id),
    `escalas para pais/${item.id}: recomendação inalcançável pela própria queixa e idade`,
  );
}

// ───────────────────────── 3. Estado dos sintomas ──────────────────────────
const signalFixture = queixas
  .map((queixa) => ({
    queixaId: queixa.id,
    signals: getAllSignalsForQueixa(queixa.id),
  }))
  .find((fixture) => fixture.signals.length > 0);

check(Boolean(signalFixture), "sinais: nenhuma queixa possui sinal auditável");
if (signalFixture) {
  const sampleSignalId = signalFixture.signals[0].id;
  check(
    getOrphanFilterSignalIds(
      [signalFixture.queixaId],
      [sampleSignalId],
    ).length === 0,
    "sinais: um sinal válido foi classificado como órfão",
  );
  check(
    getOrphanFilterSignalIds([], [sampleSignalId]).join(",") === sampleSignalId,
    "sinais: um sinal oculto permaneceu ativo depois de remover a queixa",
  );
}

// ─────────────────────── 4. Semântica e estética estável ────────────────────
const directSource = read(
  "client/src/components/DirectTestsRecommender.tsx",
);
const parentSource = read(
  "client/src/components/ParentTestsRecommender.tsx",
);
const sharedCardSource = read(
  "client/src/components/FilterRecommendationLinkCard.tsx",
);
const symptomSource = read(
  "client/src/components/PopularSymptomPicker.tsx",
);
const podiumSource = read(
  "client/src/components/OPBRecommendationCards.tsx",
);
const fichaSource = read("client/src/components/ScaleFichaPage.tsx");

for (const [label, source] of [
  ["testes diretos", directSource],
  ["escalas para pais", parentSource],
]) {
  check(
    source.includes("FilterRecommendationLinkCard"),
    `${label}: deixou de usar o card navegável canônico`,
  );
  check(!/<a\b/.test(source), `${label}: âncora manual reintroduzida`);
  check(!/<Button\b/.test(source), `${label}: botão aninhável reintroduzido`);
  check(
    source.includes("role=\"list\"") && source.includes("role=\"listitem\""),
    `${label}: agrupamento semântico de recomendações ausente`,
  );
}
check(
  directSource.includes("href={test.route}"),
  "testes diretos: card deixou de abrir a rota real do teste",
);
check(
  !directSource.includes("/testes-diretos?"),
  "testes diretos: redirecionamento intermediário por idade voltou",
);

check(
  (sharedCardSource.match(/<Link\b/g) || []).length === 1,
  "card canônico: deve existir exatamente um link interativo",
);
check(
  !/<Button\b|<a\b/.test(sharedCardSource),
  "card canônico: controle interativo aninhado detectado",
);
check(
  sharedCardSource.includes("focus-visible:ring-2"),
  "card canônico: foco visível removido",
);
check(
  sharedCardSource.includes("<div className=\"min-w-0 flex-1\"") &&
    !sharedCardSource.includes("<span className=\"min-w-0 flex-1\""),
  "card canônico: contêiner de bloco inválido voltou a envolver badges",
);

check(
  symptomSource.includes("getOrphanFilterSignalIds") &&
    symptomSource.includes("useEffect"),
  "sintomas: limpeza automática de sinais órfãos desconectada",
);
check(
  symptomSource.includes("aria-pressed={active}") &&
    symptomSource.includes("focus-visible:ring-2"),
  "sintomas: estados acessíveis ou foco visível removidos",
);

check(
  podiumSource.includes("data-testid=\"opb-recommendation-podium\"") &&
    podiumSource.includes("data-tier={seal}"),
  "pódio: identificadores semânticos removidos",
);
check(
  podiumSource.includes("onSelectScale &&"),
  "pódio: ação voltou a parecer disponível sem callback",
);
check(
  !podiumSource.includes("h-[calc("),
  "pódio: altura voltou a depender de calc CSS frágil",
);
check(
  podiumSource.includes("flex h-full flex-col") &&
    podiumSource.includes("flex flex-1 flex-col"),
  "pódio: alinhamento responsivo de alturas removido",
);

check(
  fichaSource.includes("export function formatScaleAgeRange") &&
    fichaSource.includes("maxMonths < 24"),
  "ficha: precisão de idade em meses removida",
);
check(
  !fichaSource.includes("function anos(") &&
    !/Math\.floor\(min\s*\/\s*12\)/.test(fichaSource),
  "ficha: arredondamento regressivo para anos inteiros reintroduzido",
);
check(
  fichaSource.includes("Button asChild") &&
    fichaSource.includes('copyStatus === "error"'),
  "ficha: ação semântica ou feedback de cópia removido",
);

// ─────────────────────────── 5. Gate oficial ────────────────────────────────
const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["verify:release"]?.includes(
    "audit:filter-fillable",
  ),
  "release: audit:filter-fillable não está conectado ao verify:release",
);

console.log(
  `[filter-spiral] catálogo=${filterCatalog.length} · diretos=${testesDiretosRecommendations.length} · parentais=${testesPaisRecommendations.length}`,
);
console.log(
  `[filter-spiral] itens interativos=${filterCatalog.filter((scale) => INTERACTIVE.has(scale.id)).length} · rotas dedicadas=${filterCatalog.filter(hasDedicatedRoute).length}`,
);

if (violations.length > 0) {
  console.error(
    `\n[filter-spiral] ✗ ${violations.length} achado(s) de regressão:`,
  );
  for (const violation of violations) console.error(`  · ${violation}`);
  console.error(
    "\nCorrija todos os achados e execute novamente npm run audit:filter-fillable.",
  );
  process.exit(1);
}

console.log(
  "[filter-spiral] ✓ filtro, recomendações, sinais, fichas e contratos visuais convergiram sem achados automatizados.",
);
