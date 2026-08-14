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

const { allScales, faixasEtarias, queixas } = await imp(
  "client/src/data/scaleFilter.ts",
);
const { mergeFilterableCatalog } = await imp(
  "client/src/data/filterableCatalog.ts",
);
const {
  filterScalesWithClinicalRescue,
  clinicalHardBlock,
  getApplicationMode,
  isAcuteRiskContext,
} = await imp("client/src/data/advancedFilterLogic.ts");
const {
  selectCuratedTiers,
  selectPodium,
  PODIUM_QUESTION_CAP,
  estimatedQuestionCount,
} = await imp("client/src/data/filterPodium.ts");
const { getClinicalTiers } = await imp("client/src/data/clinicalRanking.ts");

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) =>
    seen.has(item.id) ? false : (seen.add(item.id), true),
  );
};

const allIds = new Set(allScales.map((s) => s.id));
const resolveRoute = (s) => {
  if (s.appRoute && s.appRoute !== "/filtro") return s.appRoute;
  if (allIds.has(s.id)) return `/generic-scale/${s.id}`;
  if (s.id.startsWith("world-")) return "/escalas-neuropsiquiatria";
  return null;
};

const catalog = uniqueById(mergeFilterableCatalog(allScales)).filter(
  resolveRoute,
);
const queixaIds = queixas.map((q) => q.id);
const respondents = [
  null,
  "pais",
  "professor",
  "clinico",
  "autoaplicavel",
  "teste_direto_crianca",
];
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
  if (examples.length < 25)
    examples.push(`${message} :: ${JSON.stringify(ctx)}`);
}

function ok(condition, message, ctx) {
  checks++;
  if (!condition) fail(message, ctx);
}

function rankSafely(ctx) {
  return filterScalesWithClinicalRescue(catalog, ctx);
}

function auditContext(ctx) {
  const matches = rankSafely(ctx);
  const refinedById = new Map(matches.map((m) => [m.scale.id, m]));
  const curated = selectCuratedTiers(
    ctx.queixas,
    ctx.ageMonths,
    refinedById,
    ctx.respondente ?? null,
  );
  const podium = selectPodium(matches, curated, {
    selectedQueixas: ctx.queixas,
    ageMonths: ctx.ageMonths ?? null,
    selectedSignals: ctx.selectedSignals ?? [],
  });
  const slots = [podium.ouro, podium.prata, podium.bronze].filter(Boolean);
  const ids = slots.map((m) => m.scale.id);
  const questionCounts = slots.map((m) => estimatedQuestionCount(m.scale));
  const podiumQuestionTotal = questionCounts.reduce(
    (sum, count) => sum + count,
    0,
  );

  const feasibleCounts = matches
    .filter(
      (m) =>
        ctx.ageMonths == null ||
        (m.scale.ageMin <= ctx.ageMonths && m.scale.ageMax >= ctx.ageMonths),
    )
    .map((m) => estimatedQuestionCount(m.scale))
    .filter(
      (count) =>
        Number.isFinite(count) && count > 0 && count <= PODIUM_QUESTION_CAP,
    )
    .sort((a, b) => a - b);
  const trioFitsBudget =
    feasibleCounts.length >= 3 &&
    feasibleCounts[0] + feasibleCounts[1] + feasibleCounts[2] <=
      PODIUM_QUESTION_CAP;

  const acuteRisk = isAcuteRiskContext(ctx);
  if (acuteRisk) {
    ok(
      matches.every((match) => !match.isBroadbandFallback),
      "risco agudo nunca pode ser preenchido com fallback irrelevante",
      ctx,
    );
    if (matches.length === 0) {
      ok(
        slots.length === 0,
        "sem instrumento primario seguro em risco agudo, o podio deve falhar fechado",
        ctx,
      );
    }
  } else if (!ctx.respondente) {
    ok(
      matches.length > 0,
      "contexto nao agudo com queixa/idade deve produzir recomendacao segura ou fallback",
      ctx,
    );
  } else if (matches.length === 0) {
    ok(
      slots.length === 0,
      "sem instrumento do respondente selecionado, o podio deve falhar fechado",
      ctx,
    );
  }
  if (trioFitsBudget) {
    ok(
      slots.length === 3,
      "quando existe trio viavel, o podio deve produzir Ouro, Prata e Bronze",
      {
        ...ctx,
        slots: ids,
        candidatos: matches.map((m) => m.scale.id),
        menoresCargas: feasibleCounts.slice(0, 3),
      },
    );
  }

  const hasQualifiedCandidate = matches.some((m) => m.relevanceScore >= 60);
  if (hasQualifiedCandidate) {
    ok(
      Boolean(podium.ouro),
      "podio deve ter Ouro quando ha candidato com score >= 60",
      ctx,
    );
  }
  ok(
    new Set(ids).size === ids.length,
    "Ouro/Prata/Bronze nao podem repetir escala",
    { ...ctx, ids },
  );
  ok(
    podiumQuestionTotal <= PODIUM_QUESTION_CAP,
    "REGRA DE OURO ABSOLUTA: Ouro + Prata + Bronze nao podem ultrapassar 100 perguntas",
    {
      ...ctx,
      ids,
      questionCounts,
      podiumQuestionTotal,
      cap: PODIUM_QUESTION_CAP,
    },
  );

  for (const slot of slots) {
    ok(
      refinedById.has(slot.scale.id),
      "slot do podio precisa vir dos candidatos seguros/fallback",
      { ...ctx, slot: slot.scale.id },
    );
    ok(
      Boolean(resolveRoute(slot.scale)),
      "slot do podio precisa abrir internamente",
      { ...ctx, slot: slot.scale.id },
    );
    ok(
      clinicalHardBlock(slot.scale, ctx) === null,
      "slot do podio nao pode violar bloqueio clinico duro",
      { ...ctx, slot: slot.scale.id },
    );
  }

  if (ctx.respondente) {
    ok(
      matches.every(
        (match) =>
          match.scale.respondente.includes(ctx.respondente) ||
          (ctx.respondente === "teste_direto_crianca" &&
            getApplicationMode(match.scale) === "teste_direto_crianca"),
      ),
      "todo candidato deve preservar o respondente selecionado",
      ctx,
    );
    for (const slot of slots) {
      const respondentFit =
        slot.scale.respondente.includes(ctx.respondente) ||
        (ctx.respondente === "teste_direto_crianca" &&
          getApplicationMode(slot.scale) === "teste_direto_crianca");
      ok(
        respondentFit,
        "podio deve respeitar o respondente selecionado",
        {
          ...ctx,
          slot: slot.scale.id,
          respondenteEscala: slot.scale.respondente,
        },
      );
    }
  }
}

for (const q of queixaIds) {
  ok(
    Boolean(getClinicalTiers(q, null)),
    "toda queixa deve ter regra curada representativa",
    { q },
  );
}

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

console.log(
  `[filter-podium] catalog=${catalog.length} | queixas=${queixaIds.length} | checks=${checks}`,
);
if (failures > 0) {
  console.error(`[filter-podium] ${failures} falha(s). Exemplos:`);
  for (const e of examples) console.error("  - " + e);
  process.exit(1);
}
console.log(
  "[filter-podium] OK — teto absoluto <=100 e medalhas clinicamente viaveis auditados.",
);
