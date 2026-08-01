import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  classifyRecommendationAgeFit,
  formatRecommendationAgeRange,
  getRecommendationAgeFitLabel,
  isValidRecommendationAgeBand,
  rankRecommendationsForAgeBand,
} from "../../client/src/data/recommendationAgeFit.ts";
import { faixasEtarias } from "../../client/src/data/scaleFilter.ts";
import {
  testesDiretosRecommendations,
} from "../../client/src/data/testesDiretosRecommendations.ts";
import {
  testesPaisRecommendations,
} from "../../client/src/data/testesPaisRecommendations.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

assert.equal(
  classifyRecommendationAgeFit(36, 144, { min: 36, max: 60 }),
  "full",
  "instrumento que cobre toda a banda deve ser classificado como full",
);
assert.equal(
  classifyRecommendationAgeFit(48, 144, { min: 36, max: 60 }),
  "partial",
  "instrumento que começa dentro da banda deve ser explicitamente parcial",
);
assert.equal(
  classifyRecommendationAgeFit(72, 168, { min: 36, max: 60 }),
  "none",
  "instrumento fora da banda não pode ser recomendado",
);
assert.equal(
  classifyRecommendationAgeFit(18, 48, { min: 48, max: 48 }),
  "full",
  "idade pontual no limite superior permanece inclusiva",
);
assert.equal(
  classifyRecommendationAgeFit(48, 144, { min: 60, max: 36 }),
  "none",
  "banda invertida deve falhar fechada",
);
assert.equal(
  classifyRecommendationAgeFit(0, 216, { min: 36, max: 47.99 }),
  "full",
  "limite fracionário canônico deve ser aceito",
);
assert.equal(
  classifyRecommendationAgeFit(0, 216, { min: Number.NaN, max: 47.99 }),
  "none",
  "limite não finito deve falhar fechado",
);

const fractionalBands = faixasEtarias.filter(
  (band) => !Number.isInteger(band.min) || !Number.isInteger(band.max),
);
assert.ok(
  fractionalBands.length > 0,
  "fixture real deve conter limites fracionários para impedir falso verde",
);

const syntheticUniversalRecommendation = [
  {
    id: "fixture-universal",
    name: "Fixture universal",
    ageMin: 0,
    ageMax: 216,
    queixas: ["fixture"],
    priority: 0,
  },
];

for (const band of faixasEtarias) {
  assert.equal(
    isValidRecommendationAgeBand(band),
    true,
    `faixa real ${band.id} (${band.min}-${band.max}) foi rejeitada`,
  );
  const matches = rankRecommendationsForAgeBand(
    syntheticUniversalRecommendation,
    ["fixture"],
    band,
    (recommendation) => recommendation.priority,
  );
  assert.equal(
    matches.length,
    1,
    `faixa real ${band.id} apagou uma recomendação universal`,
  );
  assert.equal(
    matches[0].ageFit,
    "full",
    `faixa real ${band.id} deixou de ser reconhecida integralmente`,
  );
  assert.equal(
    matches[0].coverageRatio,
    1,
    `faixa real ${band.id} produziu cobertura diferente de 100%`,
  );
}

const canonicalPartialMatches = rankRecommendationsForAgeBand(
  [
    {
      id: "fixture-partial",
      name: "Fixture parcial",
      ageMin: 36,
      ageMax: 144,
      queixas: ["fixture"],
      priority: 0,
    },
  ],
  ["fixture"],
  { min: 24, max: 47.99 },
  (recommendation) => recommendation.priority,
);
assert.equal(
  canonicalPartialMatches.length,
  1,
  "fixture parcial real deve permanecer recomendável",
);
assert.equal(
  canonicalPartialMatches[0].ageFit,
  "partial",
  "fixture 36–144 deve ser parcial na faixa 24–47.99",
);
assert.equal(
  canonicalPartialMatches[0].overlapMonths,
  12,
  "sobreposição 36–47.99 deve representar exatamente 12 meses",
);
assert.equal(
  canonicalPartialMatches[0].coverageRatio,
  0.5,
  "12 meses dentro de uma faixa de 24 meses devem produzir 50%",
);

const directPriority = { primaria: 0, secundaria: 1, complementar: 2 };
const directMatches = rankRecommendationsForAgeBand(
  testesDiretosRecommendations,
  ["tdah"],
  { min: 36, max: 60 },
  (recommendation) => directPriority[recommendation.prioridade],
);
const directIds = directMatches.map((match) => match.recommendation.id);
assert.equal(
  directIds[0],
  "memoria-teste",
  "dentro da mesma prioridade, cobertura integral deve preceder cobertura parcial",
);
assert.equal(
  directMatches.find(
    (match) => match.recommendation.id === "atencao-concentracao",
  )?.ageFit,
  "partial",
  "atenção 4–12a deve ser rotulada como parcial numa banda que começa aos 3a",
);
assert.ok(
  !directIds.includes("academico-interativo"),
  "teste sem sobreposição etária não pode vazar para a recomendação",
);

const parentPriority = { ouro: 0, prata: 1, bronze: 2 };
const parentMatches = rankRecommendationsForAgeBand(
  testesPaisRecommendations,
  ["linguagem"],
  { min: 24, max: 48 },
  (recommendation) => parentPriority[recommendation.seal],
);
const parentGold = parentMatches.filter(
  (match) => match.recommendation.seal === "ouro",
);
assert.ok(
  parentGold.length >= 2,
  "catálogo parental deve produzir escolha integral e parcial na mesma prioridade",
);
const firstPartialGold = parentGold.findIndex(
  (match) => match.ageFit === "partial",
);
const lastFullGold = parentGold
  .map((match) => match.ageFit)
  .lastIndexOf("full");
assert.ok(
  firstPartialGold > lastFullGold,
  "dentro do selo Ouro, compatibilidade integral deve vir antes da parcial",
);
assert.equal(
  parentMatches.find(
    (match) => match.recommendation.id === "asq3-pais",
  )?.ageFit,
  "full",
  "ASQ-3 canônico (1–66 meses) deve cobrir integralmente a banda 24–48",
);
assert.equal(
  parentMatches.find(
    (match) => match.recommendation.id === "mchat-pais",
  )?.ageFit,
  "partial",
  "M-CHAT (16–30 meses) deve ser explicitamente parcial na banda 24–48",
);

assert.deepEqual(
  rankRecommendationsForAgeBand(
    testesDiretosRecommendations,
    ["tdah"],
    { min: 60, max: 36 },
    (recommendation) => directPriority[recommendation.prioridade],
  ),
  [],
  "banda inválida deve retornar saída vazia",
);
assert.equal(formatRecommendationAgeRange(18, 48), "18 meses–4 anos");
assert.equal(formatRecommendationAgeRange(48, 144), "4–12 anos");
assert.equal(
  getRecommendationAgeFitLabel("partial"),
  "Compatível em parte · confirme a idade",
);

const directSource = read("client/src/components/DirectTestsRecommender.tsx");
const parentSource = read("client/src/components/ParentTestsRecommender.tsx");
const ageFitSource = read("client/src/data/recommendationAgeFit.ts");
const workflowSource = read(".github/workflows/filter-spiral.yml");

for (const [label, source] of [
  ["diretos", directSource],
  ["parentais", parentSource],
]) {
  assert.match(
    source,
    /rankRecommendationsForAgeBand/,
    `${label}: recomendador deixou de usar a faixa inteira`,
  );
  assert.doesNotMatch(
    source,
    /Math\.round\(\(ageRange\.min \+ ageRange\.max\) \/ 2\)/,
    `${label}: regressão para o ponto médio da faixa`,
  );
  assert.match(
    source,
    /getRecommendationAgeFitLabel/,
    `${label}: aviso de compatibilidade parcial deixou de ser exibido`,
  );
  assert.match(
    source,
    /Faixa analisada:/,
    `${label}: contexto etário deixou de ser visível no cabeçalho`,
  );
}

assert.doesNotMatch(
  ageFitSource,
  /Number\.isInteger\(value\)/,
  "validação inteira reintroduzida e incompatível com as faixas reais",
);
assert.match(
  ageFitSource,
  /Number\.isFinite\(value\)/,
  "validação de limites finitos foi removida",
);
assert.match(
  ageFitSource,
  /AGE_ENDPOINT_SCALE = 100/,
  "aritmética em centésimos de mês deixou de ser explícita",
);
assert.match(
  ageFitSource,
  /overlapUnits \/ AGE_ENDPOINT_SCALE/,
  "sobreposição deixou de ser convertida de unidades inteiras para meses",
);
assert.match(
  workflowSource,
  /test-auxiliary-age-band\.mjs/,
  "teste de faixa etária auxiliar não está conectado ao workflow espiral",
);

console.log(
  `[auxiliary-age-band] faixas-reais=${faixasEtarias.length} · fracionárias=${fractionalBands.length}`,
);
console.log(
  `[auxiliary-age-band] diretos=${directMatches.length} · parentais=${parentMatches.length}`,
);
console.log(
  "[auxiliary-age-band] ✓ catálogo real, cobertura parcial exata, ordenação e avisos aprovados.",
);
