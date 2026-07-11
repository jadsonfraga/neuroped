// @ts-check
/**
 * Piso REAL de escolha ideal do podio (Ouro/Prata/Bronze), caso a caso.
 *
 * Diferente da prova exaustiva (robustez) e da bateria pratica (qualidade
 * media), este guard mede se o TRIO recomendado e a escolha IDEAL em casos
 * clinicamente plausiveis — cada queixa do catalogo, em idades onde ha >=3
 * escalas aplicaveis, com sinais marcados como um usuario real faria.
 *
 * Regua por caso (todas precisam valer; a taxa de casos 100% ideais e o gate):
 *  R1 idade exata     — nenhuma medalha fora do intervalo [ageMin,ageMax] do
 *                       paciente quando ha >=3 candidatas que contem a idade.
 *  R2 cobertura       — toda queixa marcada com candidata disponivel aparece
 *                       em alguma medalha.
 *  R3 relevancia      — Ouro heuristico >=70 quando o catalogo permite (Ouro
 *                       curado/autoral e decisao clinica deliberada, isento);
 *                       media do podio >=60 fora do fallback.
 *  R4 sinais          — se o usuario marcou sinais e existe candidata viavel
 *                       (bate a tag, contem a idade, rel>=45), o podio contem
 *                       uma escala que fala aos sinais.
 *  R5 respondente     — respondente escolhido respeitado quando >=3 candidatas
 *                       atendem.
 *  R6 implementacao   — medalha "recomendacao" (nada aplicavel) so quando
 *                       nenhuma candidata aplicavel preserva a cobertura.
 *  R7 seguranca       — bloqueios clinicos duros, podio completo e sem
 *                       repeticao (invariante: ZERO tolerancia).
 *
 *  R8 regra de ouro  — medalha nao-aplicavel so quando nenhuma candidata com
 *                       aplicacao completa preserva idade+cobertura (ZERO tolerancia).
 *
 * Gate: taxa-ideal >= IDEAL_RATE_MIN (99%) e zero violacao R7/R8.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales, queixas } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { noCostWorldScales } = await imp("client/src/data/noCostWorldScales.ts");
const {
  clinicalHardBlock,
  filterScalesWithClinicalRescue,
  getBroadbandFallback,
  getImplementationStatus,
} = await imp("client/src/data/advancedFilterLogic.ts");
const { selectCuratedTiers, selectPodium } = await imp("client/src/data/filterPodium.ts");

const IDEAL_RATE_MIN = 99;
const CASES_PER_QUEIXA = 24;

const allIds = new Set(allScales.map((s) => s.id));
const uniq = (xs) => {
  const seen = new Set();
  return xs.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
};
const resolveRoute = (s) => {
  if (s.appRoute && s.appRoute !== "/filtro") return s.appRoute;
  if (allIds.has(s.id)) return `/generic-scale/${s.id}`;
  if (s.id.startsWith("world-")) return "/escalas-neuropsiquiatria";
  return null;
};
const catalog = uniq([...mergeFilterableCatalog(allScales), ...noCostWorldScales]).filter(resolveRoute);

// Vocabulario de sinais por queixa, extraido do proprio catalogo.
const signalsByQueixa = new Map();
for (const s of catalog) {
  for (const q of s.queixas) {
    if (!signalsByQueixa.has(q)) signalsByQueixa.set(q, new Set());
    for (const t of s.signalTags ?? []) signalsByQueixa.get(q).add(t);
  }
}
const AGE_GRID = [3, 6, 9, 12, 18, 24, 30, 36, 48, 60, 72, 84, 96, 120, 144, 168, 192, 210];
function plausibleAges(q) {
  return AGE_GRID.filter(
    (a) => catalog.filter((s) => s.queixas.includes(q) && s.ageMin <= a && s.ageMax >= a).length >= 3,
  );
}

const queixaIds = queixas.map((q) => q.id);
const respondents = ["pais", "clinico", "professor", "autoaplicavel", null];
// LCG deterministico: bateria reprodutivel, sem Math.random.
let rngState = 42;
const rng = () => (rngState = (rngState * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

const cases = [];
let caseNum = 0;
for (const q of queixaIds) {
  const ages = plausibleAges(q);
  if (!ages.length) continue;
  for (let k = 0; k < CASES_PER_QUEIXA; k++) {
    const ageMonths = pick(ages);
    const combo = [q];
    if (k % 3 === 1) {
      const q2 = pick(queixaIds);
      if (q2 !== q && plausibleAges(q2).includes(ageMonths)) combo.push(q2);
    }
    const sigPool = [...(signalsByQueixa.get(q) ?? [])];
    const selectedSignals =
      k % 2 === 0 && sigPool.length
        ? [pick(sigPool), pick(sigPool)].filter((v, i, a) => a.indexOf(v) === i)
        : [];
    cases.push({
      id: `ideal-${String(++caseNum).padStart(3, "0")}`,
      queixas: combo,
      ageMonths,
      ageBand: { min: Math.max(0, ageMonths - 6), max: Math.min(216, ageMonths + 6) },
      respondente: pick(respondents),
      isVerbal: k % 4 === 0 ? false : null,
      isLiterate: ageMonths >= 84 ? null : false,
      assessmentUse: k % 5 === 0 ? "diagnostico" : null,
      selectedSignals,
    });
  }
}

const failCounts = new Map();
const failures = [];
let safetyViolations = 0;

for (const ctx of cases) {
  let matches = filterScalesWithClinicalRescue(catalog, ctx);
  if (!matches.length) matches = getBroadbandFallback(catalog, ctx);
  const refinedById = new Map(matches.map((m) => [m.scale.id, m]));
  const curated = selectCuratedTiers(ctx.queixas, ctx.ageMonths, refinedById, ctx.respondente ?? null);
  const podium = selectPodium(matches, curated, {
    selectedQueixas: ctx.queixas,
    ageMonths: ctx.ageMonths,
    selectedSignals: ctx.selectedSignals,
  });
  const slots = [podium.ouro, podium.prata, podium.bronze].filter(Boolean);
  const isFallback = matches.length > 0 && matches.every((m) => m.isBroadbandFallback);
  const issues = [];

  // R1 — idade exata
  const exactAgeCands = matches.filter((m) => m.scale.ageMin <= ctx.ageMonths && m.scale.ageMax >= ctx.ageMonths);
  if (
    exactAgeCands.length >= 3 &&
    !slots.every((s) => s.scale.ageMin <= ctx.ageMonths && s.scale.ageMax >= ctx.ageMonths)
  )
    issues.push("R1-idade-exata");

  // R2 — cobertura total de queixas com candidata disponivel
  for (const q of ctx.queixas) {
    const hasCand = matches.some((m) => m.scale.queixas.includes(q));
    const covered = slots.some((s) => s.scale.queixas.includes(q));
    if (hasCand && !covered) {
      issues.push("R2-queixa-descoberta");
      break;
    }
  }

  // R3 — relevancia (Ouro curado/autoral e decisao clinica deliberada, isento).
  // Regra de ouro: se o Ouro e APLICAVEL e as candidatas >=70 sao todas
  // ficha/licenciada, ficar com o aplicavel e o acerto — a viabilidade de 70
  // so conta entre aplicaveis nesse caso.
  // Candidata "viavel para Ouro" precisa CONTER a idade exata — rel>=70 fora
  // da faixa do paciente nao e alternativa real.
  const inAge = (m) => m.scale.ageMin <= ctx.ageMonths && m.scale.ageMax >= ctx.ageMonths;
  const ouroApplicable = podium.ouro && getImplementationStatus(podium.ouro.scale) === "complete";
  const feasible70 = ouroApplicable
    ? matches.some((m) => m.relevanceScore >= 70 && inAge(m) && getImplementationStatus(m.scale) === "complete")
    : matches.some((m) => m.relevanceScore >= 70 && inAge(m));
  const avg = slots.length ? slots.reduce((t, s) => t + s.relevanceScore, 0) / slots.length : 0;
  const curatedIds = [curated?.ouro, curated?.prata, curated?.bronze].filter(Boolean);
  const ouroIsClinicalChoice =
    podium.ouro && (curatedIds.includes(podium.ouro.scale.id) || podium.ouro.scale.licencaUso === "autoral");
  if (!isFallback && feasible70 && !ouroIsClinicalChoice && (podium.ouro?.relevanceScore ?? 0) < 70)
    issues.push("R3-relevancia-ouro");
  if (!isFallback && avg < 60) issues.push("R3-media-baixa");

  // R4 — sinais marcados
  if (ctx.selectedSignals.length) {
    const hit = (s) => (s.scale.signalTags ?? []).some((t) => ctx.selectedSignals.includes(t));
    const viable = (m) =>
      hit(m) && m.scale.ageMin <= ctx.ageMonths && m.scale.ageMax >= ctx.ageMonths && m.relevanceScore >= 45;
    // Regra de ouro: se o podio inteiro e APLICAVEL e toda candidata que bate o
    // sinal e ficha/licenciada, manter o podio aplicavel e o acerto — nao flagra.
    const podiumAllApplicable = slots.every((s) => getImplementationStatus(s.scale) === "complete");
    const viableApplicable = (m) => viable(m) && getImplementationStatus(m.scale) === "complete";
    const exigivel = podiumAllApplicable ? matches.some(viableApplicable) : matches.some(viable);
    if (exigivel && !slots.some(hit)) issues.push("R4-sinais-ignorados");
  }

  // R5 — respondente
  if (ctx.respondente) {
    const fits = (m) => m.scale.respondente.includes(ctx.respondente);
    if (matches.filter(fits).length >= 3 && !slots.every(fits)) issues.push("R5-respondente");
  }

  // R6 — implementacao (mesma semantica do implFixSlot do motor)
  for (const slot of slots) {
    if (getImplementationStatus(slot.scale) !== "not_implemented") continue;
    const slotIds = new Set(slots.map((x) => x.scale.id));
    const uniqueQ = ctx.queixas.filter(
      (q) =>
        slot.scale.queixas.includes(q) &&
        !slots.some((o) => o.scale.id !== slot.scale.id && o.scale.queixas.includes(q)),
    );
    const alt = matches.find(
      (m) =>
        !slotIds.has(m.scale.id) &&
        getImplementationStatus(m.scale) !== "not_implemented" &&
        m.scale.ageMin <= ctx.ageMonths &&
        m.scale.ageMax >= ctx.ageMonths &&
        uniqueQ.every((q) => m.scale.queixas.includes(q)) &&
        m.relevanceScore >= slot.relevanceScore - 20,
    );
    if (alt) {
      issues.push("R6-implementacao");
      break;
    }
  }

  // R8 — REGRA DE OURO (obrigatoria, zero tolerancia): medalha que nao abre
  // como APLICACAO no app so e aceitavel quando nenhuma candidata aplicavel
  // contem a idade, preserva a cobertura unica e fica a ate 40 pontos de
  // relevancia (mesma semantica do applFixSlot do motor).
  const r8 = [];
  for (const slot of slots) {
    if (getImplementationStatus(slot.scale) === "complete") continue;
    const slotIds8 = new Set(slots.map((x) => x.scale.id));
    const uniqueQ8 = ctx.queixas.filter(
      (q) =>
        slot.scale.queixas.includes(q) &&
        !slots.some((o) => o.scale.id !== slot.scale.id && o.scale.queixas.includes(q)),
    );
    const alt8 = matches.find(
      (m) =>
        !slotIds8.has(m.scale.id) &&
        getImplementationStatus(m.scale) === "complete" &&
        m.scale.ageMin <= ctx.ageMonths &&
        m.scale.ageMax >= ctx.ageMonths &&
        uniqueQ8.every((q) => m.scale.queixas.includes(q)) &&
        m.relevanceScore >= slot.relevanceScore - 40,
    );
    if (alt8) {
      r8.push("R8-regra-de-ouro");
      break;
    }
  }
  if (r8.length) {
    safetyViolations += 1;
    issues.push(...r8);
  }

  // R7 — seguranca (invariante duro, zero tolerancia)
  const r7 = [];
  if (!slots.every((s) => clinicalHardBlock(s.scale, ctx) === null)) r7.push("R7-bloqueio-clinico");
  if (new Set(slots.map((s) => s.scale.id)).size !== slots.length) r7.push("R7-repetida");
  if (slots.length !== 3) r7.push("R7-incompleto");
  if (r7.length) {
    safetyViolations += 1;
    issues.push(...r7);
  }

  for (const i of issues) failCounts.set(i, (failCounts.get(i) ?? 0) + 1);
  if (issues.length) {
    failures.push({
      id: ctx.id,
      ageMonths: ctx.ageMonths,
      queixas: ctx.queixas.join("+"),
      respondente: ctx.respondente ?? "qualquer",
      sinais: ctx.selectedSignals.join(","),
      podio: slots.map((s) => s.scale.id).join(" | "),
      issues: issues.join("; "),
    });
  }
}

const idealRate = ((cases.length - failures.length) / cases.length) * 100;
console.log(
  `[filter-ideal-choice] casos=${cases.length} | ideais=${cases.length - failures.length} | taxa-ideal=${idealRate.toFixed(1)}% | gate>=${IDEAL_RATE_MIN}% | seguranca=${safetyViolations === 0 ? "integra" : `${safetyViolations} VIOLACAO(OES)`}`,
);
if (failures.length) {
  console.log("[filter-ideal-choice] falhas por criterio:", Object.fromEntries([...failCounts.entries()].sort((a, b) => b[1] - a[1])));
  for (const f of failures.slice(0, 20)) console.error("  -", JSON.stringify(f));
}
if (safetyViolations > 0) {
  console.error(`[filter-ideal-choice] ${safetyViolations} caso(s) com violacao de SEGURANCA — inaceitavel.`);
  process.exit(1);
}
if (idealRate < IDEAL_RATE_MIN) {
  console.error(`[filter-ideal-choice] taxa-ideal ${idealRate.toFixed(1)}% abaixo do gate ${IDEAL_RATE_MIN}%.`);
  process.exit(1);
}
console.log(`[filter-ideal-choice] OK — piso real de escolha ideal >= ${IDEAL_RATE_MIN}% respeitado.`);
