// @ts-check
/**
 * Auditoria pratica do filtro de escalas em 100 casos simulados.
 *
 * A prova exaustiva garante que o filtro nao quebra em centenas de milhares de
 * combinacoes. Este arquivo mede a qualidade pratica do podio em casos com
 * idades, queixas, multiplas queixas e respondentes diferentes.
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
  filterScalesIntelligently,
  filterScalesWithClinicalRescue,
  getApplicationMode,
  getBroadbandFallback,
} = await imp("client/src/data/advancedFilterLogic.ts");
const { selectCuratedTiers, selectPodium } = await imp("client/src/data/filterPodium.ts");

const allIds = new Set(allScales.map((s) => s.id));
const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
};
const resolveRoute = (scale) => {
  if (scale.appRoute && scale.appRoute !== "/filtro") return scale.appRoute;
  if (allIds.has(scale.id)) return `/generic-scale/${scale.id}`;
  if (scale.id.startsWith("world-")) return "/escalas-neuropsiquiatria";
  return null;
};

const catalog = uniqueById([...mergeFilterableCatalog(allScales), ...noCostWorldScales]).filter(resolveRoute);
const queixaIds = queixas.map((q) => q.id);
const respondents = ["pais", "clinico", "professor", "autoaplicavel", "teste_direto_crianca", null];
const ageMonthsPool = [2, 5, 8, 11, 14, 18, 23, 30, 36, 47, 54, 66, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 215];

const preferredCombos = [
  ["tea", "linguagem"],
  ["tea", "comportamento"],
  ["tdah", "aprendizagem"],
  ["tdah", "comportamento"],
  ["ansiedade", "depressao"],
  ["depressao", "suicidio"],
  ["epilepsia", "cognicao"],
  ["pc", "motor"],
  ["pc", "alimentacao"],
  ["linguagem", "aprendizagem"],
  ["sono", "comportamento"],
  ["alimentacao", "sensorial"],
  ["dor", "ansiedade"],
  ["cognicao", "aprendizagem"],
  ["funcionalidade", "autonomia"],
  ["neonatal", "atraso"],
  ["psicose", "depressao"],
  ["tiques", "tdah"],
  ["toc", "ansiedade"],
  ["trauma", "ansiedade"],
  ["enurese", "comportamento"],
  ["motor", "sensorial"],
  ["social", "tea"],
  ["evolucao", "efeitos"],
  ["substancias", "comportamento"],
  ["tea", "tdah", "sono"],
  ["atraso", "linguagem", "motor"],
  ["ansiedade", "toc", "trauma"],
  ["depressao", "suicidio", "substancias"],
  ["pc", "motor", "funcionalidade"],
];

function ageBandAround(ageMonths) {
  return { min: Math.max(0, ageMonths - 6), max: Math.min(216, ageMonths + 6) };
}

function chooseAssessmentUse(queixasSelecionadas, index) {
  if (queixasSelecionadas.some((q) => q === "efeitos" || q === "evolucao" || q === "epilepsia")) {
    return "monitorizacao";
  }
  if (index % 5 === 0) return "diagnostico";
  if (index % 7 === 0) return "monitorizacao";
  return null;
}

function buildCases() {
  const cases = [];
  for (let i = 0; i < 100; i++) {
    const ageMonths = ageMonthsPool[i % ageMonthsPool.length];
    const directCombo = preferredCombos[i % preferredCombos.length];
    const generatedCombo = [queixaIds[i % queixaIds.length]];
    if (i % 2 === 1) generatedCombo.push(queixaIds[(i * 7 + 3) % queixaIds.length]);
    if (i % 11 === 0) generatedCombo.push(queixaIds[(i * 5 + 9) % queixaIds.length]);
    const selectedQueixas = uniqueById(i < preferredCombos.length * 2 ? directCombo : generatedCombo);
    const respondente = respondents[(i * 3 + Math.floor(i / 10)) % respondents.length];
    cases.push({
      id: `caso-${String(i + 1).padStart(3, "0")}`,
      queixas: selectedQueixas,
      ageMonths,
      ageBand: ageBandAround(ageMonths),
      respondente,
      isVerbal: i % 4 === 0 ? false : i % 4 === 1 ? true : null,
      isLiterate: ageMonths >= 84 ? (i % 3 === 0 ? true : null) : i % 3 === 0 ? false : null,
      assessmentUse: chooseAssessmentUse(selectedQueixas, i),
      selectedSignals: [],
    });
  }
  return cases;
}

function getMatches(ctx) {
  const matches = filterScalesWithClinicalRescue(catalog, ctx);
  if (matches.length > 0) return matches;
  return getBroadbandFallback(catalog, ctx);
}

function respondentFits(match, respondente) {
  if (!respondente) return true;
  if (match.scale.respondente.includes(respondente)) return true;
  return respondente === "teste_direto_crianca" && match.applicationMode === "teste_direto_crianca";
}

function scoreCase(ctx) {
  const matches = getMatches(ctx);
  const exactMatches = filterScalesIntelligently(catalog, ctx);
  const refinedById = new Map(matches.map((m) => [m.scale.id, m]));
  const curated = selectCuratedTiers(ctx.queixas, ctx.ageMonths, refinedById, ctx.respondente ?? null);
  const podium = selectPodium(matches, curated, { selectedQueixas: ctx.queixas });
  const slots = [podium.ouro, podium.prata, podium.bronze].filter(Boolean);
  const slotIds = slots.map((slot) => slot.scale.id);
  const isFallback = matches.length > 0 && matches.every((m) => m.isBroadbandFallback);
  const issues = [];
  let score = 0;

  const add = (ok, points, issue) => {
    if (ok) score += points;
    else issues.push(issue);
  };

  add(matches.length > 0, 1.0, "nao encontrou candidatos seguros");
  add(Boolean(podium.ouro), 1.0, "nao definiu escala Ouro");
  add(slots.length === 3, 1.0, "podio incompleto");
  add(new Set(slotIds).size === slotIds.length, 1.0, "podio repetiu escala");
  add(slots.every((slot) => Boolean(resolveRoute(slot.scale))), 1.0, "alguma escala do podio nao abre internamente");
  add(slots.every((slot) => clinicalHardBlock(slot.scale, ctx) === null), 1.5, "alguma escala viola bloqueio clinico duro");

  const complaintCoverage = new Set();
  for (const slot of slots) {
    for (const q of slot.scale.queixas) {
      if (ctx.queixas.includes(q)) complaintCoverage.add(q);
    }
  }
  const minCoverage = ctx.queixas.length > 1 ? 2 : 1;
  add(isFallback || complaintCoverage.size >= Math.min(minCoverage, ctx.queixas.length), 0.9, "cobre pouco as queixas marcadas");
  const respondentWasClinicallyRescued = ctx.respondente && exactMatches.length < 3;
  add(
    isFallback || respondentWasClinicallyRescued || slots.every((slot) => respondentFits(slot, ctx.respondente)),
    0.9,
    "nao respeita o respondente escolhido"
  );

  const curatedIds = [curated?.ouro, curated?.prata, curated?.bronze].filter(Boolean);
  const availableCuratedIds = curatedIds.filter((id) => refinedById.has(id));
  add(
    isFallback || availableCuratedIds.length === 0 || slotIds.some((id) => availableCuratedIds.includes(id)),
    0.8,
    "nao aproveitou nenhuma escala curada disponivel"
  );

  const averageRelevance = slots.length > 0 ? slots.reduce((sum, slot) => sum + slot.relevanceScore, 0) / slots.length : 0;
  add(isFallback || ((podium.ouro?.relevanceScore ?? 0) >= 55 && averageRelevance >= 50), 0.6, "relevancia pratica baixa");
  add(new Set(slots.map((slot) => getApplicationMode(slot.scale))).size >= 2 || ctx.queixas.length === 1, 0.3, "baixa diversidade de perspectiva no podio");

  return {
    id: ctx.id,
    score: Math.round(score * 10) / 10,
    issues,
    queixas: ctx.queixas,
    ageMonths: ctx.ageMonths,
    respondente: ctx.respondente ?? "qualquer",
    podium: {
      ouro: podium.ouro?.scale.id,
      prata: podium.prata?.scale.id,
      bronze: podium.bronze?.scale.id,
    },
  };
}

const results = buildCases().map(scoreCase);
const average = results.reduce((sum, result) => sum + result.score, 0) / results.length;
const min = Math.min(...results.map((result) => result.score));

/*
 * Gate honesto: separa invariantes de SEGURANCA (precisam valer em TODOS os casos,
 * independem da riqueza do catalogo) da QUALIDADE pratica do podio (que pode ser
 * legitimamente menor em combinacoes clinicamente impossiveis, ex.: TDAH aos 8 meses,
 * onde nao existem 3 escalas validas para formar podio completo de alta relevancia).
 *
 * - Seguranca: zero violacoes por caso, sempre; o pódio Ouro/Prata/Bronze
 *   completo agora é invariante obrigatório para todo contexto clínico.
 * - Qualidade: media >= QUALITY_AVG_MIN e nenhum caso abaixo de QUALITY_CASE_FLOOR.
 *   O piso por caso (8.0) corresponde a um combo impossivel que so perde "Ouro" +
 *   "podio completo" (2.0 pts); cair abaixo disso indica o motor falhando alem da
 *   limitacao natural de catalogo, nao apenas um combo raro.
 */
const SAFETY_ISSUES = new Set([
  "nao encontrou candidatos seguros",
  "podio incompleto",
  "podio repetiu escala",
  "alguma escala do podio nao abre internamente",
  "alguma escala viola bloqueio clinico duro",
]);
const QUALITY_AVG_MIN = 9.5;
const QUALITY_CASE_FLOOR = 8.0;

const unsafe = results.filter((result) => result.issues.some((issue) => SAFETY_ISSUES.has(issue)));
const belowFloor = results.filter((result) => result.score < QUALITY_CASE_FLOOR);
const weak = results.filter((result) => result.score < QUALITY_AVG_MIN);

console.log(
  `[filter-practical-100] casos=${results.length} | media=${average.toFixed(2)} | minimo=${min.toFixed(1)} | piso=${QUALITY_CASE_FLOOR} | abaixo-de-${QUALITY_AVG_MIN}=${weak.length}`
);

const fail = (label, offenders) => {
  console.error(`[filter-practical-100] ${label}:`);
  for (const result of offenders.slice(0, 20)) {
    console.error(
      `  - ${result.id} nota=${result.score} idade=${result.ageMonths}m respondente=${result.respondente} queixas=${result.queixas.join("+")} podio=${JSON.stringify(result.podium)} motivos=${result.issues.join("; ")}`
    );
  }
};

let failed = false;
if (unsafe.length > 0) {
  fail(`${unsafe.length} caso(s) violaram invariante de seguranca`, unsafe);
  failed = true;
}
if (average < QUALITY_AVG_MIN) {
  console.error(`[filter-practical-100] media ${average.toFixed(2)} abaixo do minimo exigido ${QUALITY_AVG_MIN}`);
  fail(`${weak.length} caso(s) abaixo de ${QUALITY_AVG_MIN}`, weak);
  failed = true;
}
if (belowFloor.length > 0) {
  fail(`${belowFloor.length} caso(s) abaixo do piso por caso ${QUALITY_CASE_FLOOR}`, belowFloor);
  failed = true;
}
if (failed) {
  process.exit(1);
}
console.log(
  `[filter-practical-100] OK - seguranca integra em todos os ${results.length} casos; media ${average.toFixed(2)} >= ${QUALITY_AVG_MIN}; piso por caso ${QUALITY_CASE_FLOOR} respeitado.`
);
