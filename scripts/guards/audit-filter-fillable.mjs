// GUARD: o Filtro de Escalas só pode CITAR escalas que abrem por completo,
// por extenso, com itens e respostas (aplicação preenchível de verdade).
//
// Regra (fail-closed): toda escala do catálogo REAL do filtro
// (opensInApp && isFullApp — o mesmo que filtro.tsx usa) precisa abrir como
// ferramenta APLICÁVEL por UMA das vias verificadas:
//   1. itens interativos (interactiveScaleItems / interactiveScales) → GenericScale/Runner;
//   2. sistema de classificação (classificationScales) → ClassificationScale;
//   3. rota dedicada cujo destino é uma PÁGINA DE APLICAÇÃO verificada (allowlist).
//
// Qualquer escala citável que não caia nessas vias é VIOLAÇÃO: seria uma ficha
// técnica / página de referência entrando no filtro. O allowlist é explícito de
// propósito: ao criar uma nova rota dedicada, é obrigatório verificar que ela
// abre itens+respostas e adicioná-la aqui — nunca por acidente.
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const imp = (r) => import(pathToFileURL(resolve(root, r)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { noCostWorldScales } = await imp("client/src/data/noCostWorldScales.ts");
const { getImplementationStatus } = await imp("client/src/data/advancedFilterLogic.ts");
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");
const { interactiveScales } = await imp("client/src/data/interactiveScales.ts");
let classificationScales = {};
try { ({ classificationScales } = await imp("client/src/data/classificationScales.ts")); } catch { /* opcional */ }

const INTERACTIVE = new Set([...Object.keys(interactiveScaleItems || {}), ...Object.keys(interactiveScales || {})]);
const CLASSIF = new Set(Object.keys(classificationScales || {}));

// Espelha EXATAMENTE filtro.tsx (opensInApp / isFullApp / opensAsUsableTool).
const allIds = new Set(allScales.map((s) => s.id));
const resolveAppRoute = (s) => s.appRoute ? s.appRoute : (allIds.has(s.id) ? `/generic-scale/${s.id}` : (s.id.startsWith("world-") ? "/escalas-neuropsiquiatria" : null));
const hasDedicatedRoute = (s) => { const r = s.appRoute; return !!r && !r.startsWith("/generic-scale/") && r !== "/escalas-neuropsiquiatria" && r !== "/filtro"; };
const opensAsUsableTool = (s) => hasDedicatedRoute(s) || INTERACTIVE.has(s.id);
const opensInApp = (s) => { const r = resolveAppRoute(s); return !!r && r !== "/escalas-neuropsiquiatria"; };
const isFullApp = (s) => s.applicationMode !== "psicoeducacao" && getImplementationStatus(s) === "complete" && opensAsUsableTool(s);

const uniq = (arr) => { const seen = new Set(); return arr.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true))); };
const catalog = uniq([...mergeFilterableCatalog(allScales), ...noCostWorldScales]).filter((s) => opensInApp(s) && isFullApp(s));

// Allowlist de ROTAS DEDICADAS verificadas como aplicação preenchível (itens+respostas
// ou tarefa/diário/classificação com registro). Verificadas manualmente.
const VERIFIED_INTERACTIVE_ROUTES = new Set([
  "/testes-diretos", "/testes-reconhecimento", "/testes-academicos",
  "/mchat", "/snap", "/vanderbilt", "/sdq", "/scared", "/phqa", "/cssrs",
  "/ygtss", "/crafft", "/denver", "/asq3", "/portage", "/cars", "/tea",
  "/tea-comportamentos", "/conners", "/brief2", "/cbcl", "/abc", "/cdi2",
  "/epilepsia", "/gmfcs", "/espasticidade", "/cshq", "/cefaleia", "/pedsql",
  "/ecar-si", "/pant", "/emdi", "/eaf", "/pdae", "/ecsm", "/ips", "/edi",
  "/eai", "/easi", "/ems", "/etare", "/eaah", "/ballard", "/tde2", "/ahsd-tea",
  "/eusm10", "/aq10", "/aq50", "/psc17", "/inventarios-auto",
]);
const isVerifiedClassificationRoute = (r) => r.startsWith("/classificacao/");

const violations = [];
for (const s of catalog) {
  const viaItems = INTERACTIVE.has(s.id);
  const viaClass = CLASSIF.has(s.id) || isVerifiedClassificationRoute(s.appRoute || "");
  const viaRoute = hasDedicatedRoute(s) && VERIFIED_INTERACTIVE_ROUTES.has(s.appRoute);
  if (!viaItems && !viaClass && !viaRoute) {
    violations.push(`${s.id} (rota=${resolveAppRoute(s)}, status=${getImplementationStatus(s)}) — não abre por itens, classificação nem rota dedicada verificada`);
  }
}

console.log(`[filter-fillable] catálogo do filtro = ${catalog.length} escalas citáveis`);
console.log(`[filter-fillable]   ${catalog.filter((s) => INTERACTIVE.has(s.id)).length} por itens interativos · ${catalog.filter((s) => hasDedicatedRoute(s)).length} por rota dedicada verificada`);

if (violations.length > 0) {
  console.error(`\n[filter-fillable] ✗ ${violations.length} escala(s) citável(is) pelo filtro que NÃO abrem por completo (itens+respostas):`);
  for (const v of violations) console.error("  · " + v);
  console.error("\nCorrija: dê itens interativos à escala, ou tire-a do filtro (rota /generic-scale ficha), ou — se a rota dedicada É uma aplicação preenchível verificada — adicione a rota ao allowlist VERIFIED_INTERACTIVE_ROUTES.");
  process.exit(1);
}
console.log("[filter-fillable] ✓ toda escala citável pelo filtro abre por completo (itens/respostas ou aplicação preenchível verificada).");
