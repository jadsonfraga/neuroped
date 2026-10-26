import assert from "node:assert/strict";
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { filterScalesWithClinicalRescue, type RefinedScaleMatch } from "../../client/src/data/advancedFilterLogic.ts";
import { selectPodium, estimatedQuestionCount, PODIUM_QUESTION_CAP } from "../../client/src/data/filterPodium.ts";
import { refineFunctionalComplementarity, sameClinicalConstruct, FUNCTIONAL_AUTONOMY_ANCHOR_ID } from "../../client/src/data/filterPodiumComplementarity.ts";

function match(id: string, relevanceScore: number, count: number, group: string, queixas = ["tdah"]): RefinedScaleMatch {
  return {
    scale: {
      id, name: id, fullName: id, ageMin: 0, ageMax: 216,
      queixas, respondente: ["pais", "clinico"], prioridade: "triagem",
      tempo: "5 min", description: `${count} itens de registro sintético`,
      implementationStatus: "complete", appRoute: `/generic-scale/${id}`,
      overlapGroup: group, primaryDomain: queixas[0],
    },
    relevanceScore, clinicalReason: "Cenário sintético sem dados de paciente",
    warningFlags: [], tier: "gold", confidenceLevel: 85,
    implementationStatus: "complete", implementationLabel: "Aplicação completa",
    applicationMode: "questionario_pais", licenseRestricted: false,
  };
}

const ids = (p: ReturnType<typeof selectPodium>) =>
  [p.ouro, p.prata, p.bronze].filter((m): m is RefinedScaleMatch => Boolean(m)).map((m) => m.scale.id);
const total = (p: ReturnType<typeof selectPodium>) =>
  [p.ouro, p.prata, p.bronze].filter((m): m is RefinedScaleMatch => Boolean(m))
    .reduce((sum, m) => sum + estimatedQuestionCount(m.scale), 0);

// 1. O trio não se limita a desduplicar IDs: construtos redundantes devem ceder
// para dimensão funcional e outra perspectiva distinta.
{
  const candidates = [
    match("sintoma-a", 96, 25, "nucleo-sintomas"),
    match("sintoma-b", 94, 25, "nucleo-sintomas"),
    match("contexto", 88, 20, "impacto-contextual"),
    match(FUNCTIONAL_AUTONOMY_ANCHOR_ID, 65, 30, "autonomia-funcional", ["funcionalidade"]),
  ];
  const p = selectPodium(candidates, null, { selectedQueixas: ["tdah"], ageMonths: 120 });
  const chosen = [p.ouro, p.prata, p.bronze].filter((m): m is RefinedScaleMatch => Boolean(m));
  assert.equal(chosen.length, 3);
  assert.ok(ids(p).includes(FUNCTIONAL_AUTONOMY_ANCHOR_ID), "âncora funcional é obrigatória quando compatível");
  assert.equal(new Set(ids(p)).size, 3);
  assert.ok(total(p) <= PODIUM_QUESTION_CAP);
  for (let i = 0; i < chosen.length; i++) for (let j = i + 1; j < chosen.length; j++) {
    assert.equal(sameClinicalConstruct(chosen[i], chosen[j]), false, "não repetir construto equivalente");
  }
}

// 2. Sob o teto, a âncora continua obrigatória mesmo quando uma escala de
// sintomas longa consumiria o orçamento. Não extrapolar o limite para caber.
{
  const large = match("sintoma-longo", 99, 85, "sintoma-longo");
  const short = match("sintoma-curto", 78, 18, "sintoma-curto");
  const functional = match(FUNCTIONAL_AUTONOMY_ANCHOR_ID, 63, 30, "autonomia", ["funcionalidade"]);
  const p = selectPodium([large, short, functional], null, { selectedQueixas: ["tdah"], ageMonths: 48 });
  assert.ok(ids(p).includes(FUNCTIONAL_AUTONOMY_ANCHOR_ID));
  assert.ok(total(p) <= PODIUM_QUESTION_CAP);
  assert.ok(ids(p).includes("sintoma-curto"), "preservar ao menos uma avaliação da queixa");
}

// 3. Empate não é sinônimo de sobreposição: domínios ou informantes diferentes
// sem evidência de itens equivalentes não são removidos só por haver uma queixa.
{
  const a = match("a", 90, 10, "a");
  const b = match("b", 90, 10, "b");
  assert.equal(sameClinicalConstruct(a, b), false);
  const p = refineFunctionalComplementarity({
    ouro: a, prata: b, bronze: undefined, candidates: [a, b],
    selectedQueixas: ["tdah"], selectedSignals: [], ageMonths: 72,
    questionCap: PODIUM_QUESTION_CAP, countQuestions: (m) => estimatedQuestionCount(m.scale),
  });
  assert.deepEqual([p.ouro?.scale.id, p.prata?.scale.id], ["a", "b"]);
}

// 4. Catálogo REAL: acrescenta EFDI quando falta correspondência de queixa,
// mas nunca atropela respondente ou contexto clínico agudo.
{
  const catalog = mergeFilterableCatalog(allScales);
  const base = { queixas: ["sono"], ageMonths: 72, ageBand: null, respondente: "pais" as const };
  const matches = filterScalesWithClinicalRescue(catalog, base);
  const functional = matches.find((m) => m.scale.id === "eaf");
  assert.ok(functional, "pais + 6 anos + sono deve ter EAF como candidato funcional");
  assert.equal(functional?.implementationStatus, "complete");
  assert.match(functional?.clinicalReason ?? "", /ajuda|funcional/i);
  const realPodium = selectPodium(matches, null, { selectedQueixas: ["sono"], ageMonths: 72 });
  assert.ok(ids(realPodium).includes("eaf"), "a composição real deve reservar uma medalha funcional");
  assert.ok(total(realPodium) <= PODIUM_QUESTION_CAP);

  const infant = filterScalesWithClinicalRescue(catalog, { ...base, ageMonths: 12 });
  assert.ok(infant.some((m) => m.scale.id === FUNCTIONAL_AUTONOMY_ANCHOR_ID), "lactentes têm alternativa EFDI");
  const isFunctional = (id: string) => id === "eaf" || id === FUNCTIONAL_AUTONOMY_ANCHOR_ID;
  const teacher = filterScalesWithClinicalRescue(catalog, { ...base, respondente: "professor" });
  assert.equal(teacher.some((m) => isFunctional(m.scale.id)), false);
  const direct = filterScalesWithClinicalRescue(catalog, { ...base, respondente: "teste_direto_crianca" });
  assert.equal(direct.some((m) => isFunctional(m.scale.id)), false);
  const acute = filterScalesWithClinicalRescue(catalog, { ...base, queixas: ["suicidio"], ageMonths: 168 });
  assert.equal(acute.some((m) => isFunctional(m.scale.id)), false);
  const invalidAge = filterScalesWithClinicalRescue(catalog, { ...base, ageInputInvalid: true });
  assert.equal(invalidAge.some((m) => isFunctional(m.scale.id)), false);
}

// 5. Dois sinais selecionados devem ser preservados individualmente, não por "algum sinal".
{
  const inattentive = match("atencao-especifica", 88, 24, "desatencao");
  inattentive.scale.signalTags = ["desatencao"];
  const impulsive = match("impulso-especifico", 87, 24, "impulsividade");
  impulsive.scale.signalTags = ["impulsividade"];
  const broad = match("generico-alto", 100, 20, "inespecifico");
  const functional = match("efdi", 65, 30, "funcionalidade", ["funcionalidade"]);
  const p = selectPodium([broad, inattentive, impulsive, functional], null, {
    selectedQueixas: ["tdah"], selectedSignals: ["desatencao", "impulsividade"], ageMonths: 120,
  });
  assert.ok(ids(p).includes("efdi"), "âncora elegível deve permanecer");
  assert.ok(ids(p).includes("atencao-especifica"), "desatenção não pode desaparecer");
  assert.ok(ids(p).includes("impulso-especifico"), "impulsividade não pode desaparecer");
  assert.ok(total(p) <= PODIUM_QUESTION_CAP);
}

// 6. As duas âncoras funcionais não devem disputar duas das três medalhas.
{
  const eaf = match("eaf", 89, 24, "autonomia", ["funcionalidade"]);
  const efdi = match("efdi", 88, 30, "autonomia", ["funcionalidade"]);
  const core = match("principal", 94, 22, "tdah");
  const context = match("contextual", 80, 20, "contexto");
  const p = selectPodium([core, eaf, efdi, context], null, {
    selectedQueixas: ["tdah"], ageMonths: 120,
  });
  assert.equal(ids(p).filter((id) => id === "eaf" || id === "efdi").length, 1);
  assert.ok(ids(p).includes("principal"));
  assert.ok(total(p) <= PODIUM_QUESTION_CAP);
}

// 7. Queixas distintas precisam manter cobertura quando cabe a âncora e duas específicas.
{
  const a = match("tdah-relevante", 91, 25, "tdah", ["tdah"]);
  const b = match("sono-relevante", 90, 25, "sono", ["sono"]);
  const c = match("funcional-relevante", 62, 24, "funcional", ["funcionalidade"]);
  c.scale.id = "eaf";
  const p = selectPodium([a, b, c], null, {
    selectedQueixas: ["tdah", "sono"], ageMonths: 120,
  });
  assert.ok(ids(p).includes("tdah-relevante"));
  assert.ok(ids(p).includes("sono-relevante"));
  assert.ok(ids(p).includes("eaf"));
  assert.ok(total(p) <= PODIUM_QUESTION_CAP);
}

console.log("[filter-functional-complementarity] OK: autonomia/ajuda, não redundância, idade/respondente/risco e teto");
