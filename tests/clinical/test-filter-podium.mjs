// @ts-check
/**
 * Auditoria exaustiva do podio Ouro/Prata/Bronze do filtro.
 *
 * Cobre todas as variaveis expostas no filtro:
 * queixa, faixa etaria, respondente, verbalidade, alfabetizacao e finalidade.
 * Tambem varre pares de queixas para garantir que a regra curada escolhida
 * sobrevive ao contexto real do paciente.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales, faixasEtarias, queixas } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { noCostWorldScales } = await imp("client/src/data/noCostWorldScales.ts");
const {
  filterScalesIntelligently,
  getBroadbandFallback,
  clinicalHardBlock,
  getApplicationMode,
} = await imp("client/src/data/advancedFilterLogic.ts");
const { selectCuratedTiers, selectPodium } = await imp("client/src/data/filterPodium.ts");
const { getClinicalTiers } = await imp("client/src/data/clinicalRanking.ts");

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
};

const allIds = new Set(allScales.map((s) => s.id));
const resolveRoute = (s) => {
  if (s.appRoute && s.appRoute !== "/filtro") return s.appRoute;
  if (allIds.has(s.id)) return `/generic-scale/${s.id}`;
  if (s.id.startsWith("world-")) return "/escalas-neuropsiquiatria";
  return null;
};

const catalog = uniqueById([...mergeFilterableCatalog(allScales), ...noCostWorldScales]).filter(resolveRoute);
const queixaIds = queixas.map((q) => q.id);
const respondents = [null, "pais", "professor", "clinico", "autoaplicavel", "teste_direto_crianca"];
const verbalStates = [null, true, false];
const literacyStates = [null, true, false];
const uses = [null, "diagnostico", "monitorizacao"];
const ageContexts = faixasEtarias.map((band) => ({
  band,
  ageMonths: Math.round((band.min + band.max) / 2),
  ageBand: { min: band.min, max: band.max },
}));

let checks = 0;
let failures = 0;
const examples = [];

function fail(message, ctx) {
  failures++;
  if (examples.length < 25) examples.push(`${message} :: ${JSON.stringify(ctx)}`);
}

function ok(condition, message, ctx) {
  checks++;
  if (!condition) fail(message, ctx);
}

function rankSafely(ctx) {
  let matches = filterScalesIntelligently(catalog, ctx);
  if (matches.length === 0 && (ctx.queixas.length > 0 || ctx.ageBand || ctx.ageMonths != null)) {
    matches = getBroadbandFallback(catalog, ctx);
  }
  return matches;
}

function auditContext(ctx) {
  const matches = rankSafely(ctx);
  const refinedById = new Map(matches.map((m) => [m.scale.id, m]));
  const curated = selectCuratedTiers(ctx.queixas, ctx.ageMonths, refinedById, ctx.respondente ?? null);
  const podium = selectPodium(matches, curated);
  const slots = [podium.ouro, podium.prata, podium.bronze].filter(Boolean);
  const ids = slots.map((m) => m.scale.id);

  ok(matches.length > 0, "contexto com queixa/idade deve produzir ao menos uma recomendacao segura ou fallback", ctx);
  ok(Boolean(podium.ouro), "podio deve ter Ouro", ctx);
  ok(new Set(ids).size === ids.length, "Ouro/Prata/Bronze nao podem repetir escala", { ...ctx, ids });

  for (const slot of slots) {
    ok(refinedById.has(slot.scale.id), "slot do podio precisa vir dos candidatos seguros/fallback", { ...ctx, slot: slot.scale.id });
    ok(Boolean(resolveRoute(slot.scale)), "slot do podio precisa abrir internamente", { ...ctx, slot: slot.scale.id });
    ok(clinicalHardBlock(slot.scale, ctx) === null, "slot do podio nao pode violar bloqueio clinico duro", { ...ctx, slot: slot.scale.id });
  }

  const isFallback = matches.length > 0 && matches.every((m) => m.isBroadbandFallback);
  if (!isFallback && ctx.respondente) {
    for (const slot of slots) {
      const respondentFit =
        slot.scale.respondente.includes(ctx.respondente) ||
        (ctx.respondente === "teste_direto_crianca" && getApplicationMode(slot.scale) === "teste_direto_crianca");
      ok(
        respondentFit,
        "sem fallback, podio deve respeitar o respondente selecionado",
        { ...ctx, slot: slot.scale.id, respondenteEscala: slot.scale.respondente },
      );
    }
  }
}

// Toda queixa precisa ter regra curada para o fluxograma/podio.
for (const q of queixaIds) {
  ok(Boolean(getClinicalTiers(q, null)), "toda queixa deve ter regra curada representativa", { q });
}

// Varredura completa das variaveis para queixa unica.
for (const q of queixaIds) {
  for (const age of ageContexts) {
    for (const respondente of respondents) {
      for (const isVerbal of verbalStates) {
        for (const isLiterate of literacyStates) {
          for (const assessmentUse of uses) {
            auditContext({
              queixas: [q],
              ageMonths: age.ageMonths,
              ageBand: age.ageBand,
              respondente,
              isVerbal,
              isLiterate,
              assessmentUse,
              selectedSignals: [],
            });
          }
        }
      }
    }
  }
}

// Pares de queixas: todas as combinacoes, com idade e respondente.
for (let i = 0; i < queixaIds.length; i++) {
  for (let j = i + 1; j < queixaIds.length; j++) {
    for (const age of ageContexts) {
      for (const respondente of respondents) {
        auditContext({
          queixas: [queixaIds[i], queixaIds[j]],
          ageMonths: age.ageMonths,
          ageBand: age.ageBand,
          respondente,
          isVerbal: null,
          isLiterate: null,
          assessmentUse: null,
          selectedSignals: [],
        });
      }
    }
  }
}

console.log(`[filter-podium] catalog=${catalog.length} | queixas=${queixaIds.length} | checks=${checks}`);
if (failures > 0) {
  console.error(`[filter-podium] ${failures} falha(s). Exemplos:`);
  for (const e of examples) console.error("  - " + e);
  process.exit(1);
}
console.log("[filter-podium] OK — podio robusto em todas as variaveis auditadas.");
