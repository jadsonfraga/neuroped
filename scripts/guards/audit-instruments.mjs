// @ts-check
/**
 * audit-instruments.mjs — reconciliação catálogo × implementação × rotas.
 *
 * Por que este gate existe: em 09/2026 o catálogo apontava
 * `appRoute: "/generic-scale/wisc5"` (e mais 10 instrumentos licenciados) para
 * uma rota que caía em "Escala não encontrada", enquanto rotas nominais
 * paralelas (/wisc5, /bayley…) renderizavam uma segunda ficha sem o banner de
 * disponibilidade — e, no caso do RCADS, ESCONDIAM a aplicação interativa real.
 * Nenhum guard reconciliava as três fontes de verdade (catálogo, acervos
 * interativos, rotas do App), então superfície e promessa podiam divergir em
 * silêncio.
 *
 * Contratos travados aqui:
 *   1. todo appRoute do catálogo COMPLETO (allScalesComFichas) leva a uma
 *      superfície que resolve: /generic-scale/<id> com id existente, ou rota
 *      literal registrada no App.tsx que não seja redirect legado;
 *   2. status "complete" (explícito ou derivado) exige aplicação real: itens
 *      interativos, runner, ou rota dedicada própria no App.tsx;
 *   3. instrumento de licença restritiva sem aplicação real exige
 *      implementationStatus explícito não-"complete" — dado revisado, nunca
 *      heurística, para ficha de instrumento proprietário;
 *   4. redirects legados: origem não colide com rota real, destino existe e
 *      não é outro redirect (anti-circular);
 *   5. a ficha paralela (ScaleFichaPage) não ressuscita: a superfície canônica
 *      de ficha é /generic-scale/:id;
 *   6. ids únicos no catálogo completo (validate-catalog cobre só allScales).
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const imp = (relativePath) =>
  import(pathToFileURL(resolve(root, relativePath)).href);
const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");

const { allScalesComFichas } = await imp("client/src/data/scaleFilter.ts");
const { getImplementationStatus } = await imp(
  "client/src/data/advancedFilterLogic.ts",
);
const { INTERACTIVE_SCALE_IDS } = await imp(
  "client/src/data/interactiveScaleIds.generated.ts",
);
const { interactiveScales } = await imp("client/src/data/interactiveScales.ts");
const { LEGACY_INSTRUMENT_REDIRECTS, LEGACY_DIRECT_TEST_REDIRECTS } = await imp(
  "client/src/data/legacyInstrumentRoutes.ts",
);
// Um único universo de redirects legados: instrumentos nominais e rotas
// antigas de teste direto (Sonda Dez) obedecem aos mesmos contratos.
const ALL_LEGACY_REDIRECTS = {
  ...LEGACY_INSTRUMENT_REDIRECTS,
  ...LEGACY_DIRECT_TEST_REDIRECTS,
};

const appSource = read("client/src/App.tsx");
const appRoutePaths = new Set(
  [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]),
);
// Rotas paramétricas (ex.: /classificacao/:id) viram matchers.
const appRouteMatchers = [...appRoutePaths].map(
  (p) => new RegExp(`^${p.replace(/:[^/]+/g, "[^/]+")}$`),
);
const pathnameOf = (route) => route.split(/[?#]/)[0];
const routeRegistered = (route) => {
  const pathname = pathnameOf(route);
  return (
    appRoutePaths.has(pathname) ||
    appRouteMatchers.some((m) => m.test(pathname))
  );
};
const runnerIds = new Set(Object.keys(interactiveScales));
const catalogIds = new Set(allScalesComFichas.map((s) => s.id));
const redirectFroms = new Set(
  Object.keys(ALL_LEGACY_REDIRECTS).map((from) => pathnameOf(from)),
);

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ── 6. ids únicos no catálogo completo ──────────────────────────────────────
const seen = new Map();
for (const s of allScalesComFichas) {
  check(!seen.has(s.id), `slug duplicado no catálogo completo: "${s.id}"`);
  seen.set(s.id, true);
}

const isDedicatedRoute = (route) =>
  !!route &&
  !route.startsWith("/generic-scale/") &&
  pathnameOf(route) !== "/escalas-neuropsiquiatria" &&
  pathnameOf(route) !== "/filtro";
// Aplicação real: acervo de itens, runner, aplicação autoral embutida no
// /filtro (autorais SDG abrem por querystring), ou página dedicada própria
// registrada no App. Depois da remoção das fichas nominais (ScaleFichaPage),
// toda rota dedicada registrada É uma aplicação — o contrato 5 impede que
// uma segunda ficha nominal volte a ocupar rota dedicada.
const hasRealApplication = (s) =>
  INTERACTIVE_SCALE_IDS.has(s.id) ||
  runnerIds.has(s.id) ||
  (!!s.appRoute && pathnameOf(s.appRoute) === "/filtro") ||
  (isDedicatedRoute(s.appRoute) &&
    routeRegistered(s.appRoute) &&
    !redirectFroms.has(pathnameOf(s.appRoute)));

for (const s of allScalesComFichas) {
  const route = s.appRoute;

  // ── 1. appRoute resolve de verdade ────────────────────────────────────────
  if (route) {
    if (route.startsWith("/generic-scale/")) {
      const target = route.slice("/generic-scale/".length);
      check(
        catalogIds.has(target),
        `${s.id}: appRoute ${route} aponta para id inexistente no catálogo (ficha cairia em "Escala não encontrada")`,
      );
    } else {
      check(
        routeRegistered(route),
        `${s.id}: appRoute ${route} não está registrado como <Route> em App.tsx`,
      );
      check(
        !redirectFroms.has(pathnameOf(route)),
        `${s.id}: appRoute ${route} aponta para um redirect legado — atualize para o destino canônico`,
      );
    }
  }

  // ── 2/3. "complete" exige aplicação real ──────────────────────────────────
  // getImplementationStatus respeita o dado explícito e, na ausência dele,
  // deriva. Se qualquer um dos dois disser "complete" sem aplicação real por
  // trás (o caso WISC-V/Bayley de 09/2026: rota dedicada que renderizava
  // ficha), este contrato quebra o build.
  const status = getImplementationStatus(s);
  if (status === "complete") {
    check(
      hasRealApplication(s),
      `${s.id}: status "complete" sem aplicação real (sem itens interativos, sem runner, sem página dedicada registrada)`,
    );
  }
}

// ── 4. sanidade dos redirects legados ───────────────────────────────────────
for (const [from, to] of Object.entries(ALL_LEGACY_REDIRECTS)) {
  check(
    !appRoutePaths.has(from),
    `redirect legado ${from} colide com <Route> real ainda registrada em App.tsx`,
  );
  check(
    !redirectFroms.has(to),
    `redirect legado ${from} → ${to} encadeia em outro redirect (proibido: redirect circular/em cadeia)`,
  );
  if (to.startsWith("/generic-scale/")) {
    check(
      catalogIds.has(to.slice("/generic-scale/".length)),
      `redirect legado ${from} → ${to} aponta para id inexistente no catálogo`,
    );
  } else {
    check(
      appRoutePaths.has(to),
      `redirect legado ${from} → ${to} aponta para rota inexistente em App.tsx`,
    );
  }
}

// ── 5. a ficha paralela não ressuscita ──────────────────────────────────────
check(
  !existsSync(resolve(root, "client/src/components/ScaleFichaPage.tsx")),
  "ScaleFichaPage.tsx ressuscitou — a superfície canônica de ficha é /generic-scale/:id; não recrie uma segunda ficha paralela",
);
check(
  !appSource.includes("ScaleFichaPage"),
  "App.tsx voltou a referenciar ScaleFichaPage",
);

if (failures.length > 0) {
  console.error(
    `[instruments] ✗ ${failures.length} inconsistência(s) catálogo × rotas × implementação:`,
  );
  for (const f of failures.slice(0, 60)) console.error(`  - ${f}`);
  if (failures.length > 60)
    console.error(`  … e mais ${failures.length - 60}.`);
  process.exit(1);
}
console.log(
  `[instruments] ✓ ${allScalesComFichas.length} instrumentos reconciliados: todo appRoute resolve, todo "complete" tem aplicação real, redirects legados sãos, ficha paralela extinta.`,
);
