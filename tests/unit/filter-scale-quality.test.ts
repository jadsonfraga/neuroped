/**
 * Regressão de qualidade do pódio do Filtro Clínico (idade, queixas, sinais,
 * respondente, redundância, teto, catálogo e exportação).
 *
 * Fixtures 100% SINTÉTICAS: nomes genéricos, sem dados de pessoas ou instrumentos
 * reais. As regras de segurança são exercitadas com o motor real; a suíte não
 * relaxa nenhum bloqueio existente.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScaleEntry } from "../../client/src/data/scaleFilter.ts";
import { allScales, faixasEtarias } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import {
  filterScalesWithClinicalRescue,
  type FilterContext,
  type RefinedScaleMatch,
} from "../../client/src/data/advancedFilterLogic.ts";
import { selectCuratedTiers, selectPodiumDetailed, PODIUM_QUESTION_CAP, estimatedQuestionCount, getPodiumQuestionCountInfo } from "../../client/src/data/filterPodium.ts";
import { auditPodium } from "../../client/src/data/filterPodiumAudit.ts";
import { resolveRedundantMedals, sameClinicalConstruct } from "../../client/src/data/filterPodiumComplementarity.ts";
import { scaleAgeFit } from "../../client/src/data/scaleAgeFit.ts";
import { getClinicalTiers } from "../../client/src/data/clinicalRanking.ts";
import { clinicalHardBlock } from "../../client/src/data/advancedFilterLogic.ts";
import { parseFilterQueryIntent } from "../../client/src/lib/filterClinicalInput.ts";
import { buildFilterCsv, type FilterExportRow } from "../../client/src/lib/filterExport.ts";

// ───────────────────────── fixtures sintéticas ─────────────────────────
const scale = (over: Partial<ScaleEntry> & { id: string }): ScaleEntry =>
  ({
    name: over.id,
    fullName: `Instrumento sintético ${over.id}`,
    ageMin: 0,
    ageMax: 216,
    queixas: [],
    respondente: ["clinico"],
    prioridade: "triagem",
    tempo: "10 min",
    appRoute: `/generic-scale/${over.id}`,
    description: "Instrumento sintético com 20 perguntas.",
    licencaUso: "livre",
    implementationStatus: "complete",
    applicationMode: "observacional_clinico",
    assessmentUse: "triagem",
    fonte: "sintético",
    ...over,
  }) as ScaleEntry;

const SUICIDE_OK = scale({ id: "sint-risco-suicidio", queixas: ["suicidio"], respondente: ["clinico"], ageMin: 144, ageMax: 216, suicideRiskInstrument: true, description: "Rastreio sintético com 12 perguntas." });
const TEA_PAIS = scale({ id: "sint-tea-pais", queixas: ["tea"], respondente: ["pais"], ageMin: 12, ageMax: 72, applicationMode: "questionario_pais", overlapGroup: "g-tea", primaryDomain: "tea", signalTags: ["sinal-alfa"], description: "Questionário sintético com 20 perguntas." });
const TEA_CLIN = scale({ id: "sint-tea-clinico", queixas: ["tea"], respondente: ["clinico"], ageMin: 24, ageMax: 216, applicationMode: "observacional_clinico", overlapGroup: "g-tea-clin", primaryDomain: "tea", signalTags: ["sinal-beta"], description: "Roteiro sintético com 30 perguntas." });
const TDAH_PROF = scale({ id: "sint-tdah-prof", queixas: ["tdah"], respondente: ["professor"], ageMin: 72, ageMax: 144, applicationMode: "questionario_professor", overlapGroup: "g-tdah", primaryDomain: "tdah", signalTags: ["sinal-gama"], description: "Questionário sintético com 18 perguntas." });
const TDAH_PAIS = scale({ id: "sint-tdah-pais", queixas: ["tdah"], respondente: ["pais"], ageMin: 72, ageMax: 144, applicationMode: "questionario_pais", overlapGroup: "g-tdah", primaryDomain: "tdah", description: "Questionário sintético com 18 perguntas." });
const LING_PAIS = scale({ id: "sint-ling-pais", queixas: ["linguagem"], respondente: ["pais"], ageMin: 24, ageMax: 72, applicationMode: "questionario_pais", overlapGroup: "g-ling", primaryDomain: "linguagem", verbalRequirement: "verbal", description: "Questionário sintético com 25 perguntas." });
const AUTO_ANX = scale({ id: "sint-autorrelato-ansiedade", queixas: ["ansiedade"], respondente: ["autoaplicavel"], ageMin: 96, ageMax: 216, applicationMode: "autoquestionario_crianca_adolescente", description: "Autorrelato sintético com 15 perguntas." });
const EFEITOS = scale({ id: "sint-efeitos", queixas: ["efeitos"], respondente: ["clinico"], prioridade: "monitorizacao", assessmentUse: "monitorizacao", ageMin: 0, ageMax: 216, description: "Monitorização sintética com 10 perguntas." });
const BAND_FULL = scale({ id: "sint-atraso-amplo", queixas: ["atraso"], respondente: ["pais"], ageMin: 0, ageMax: 216, applicationMode: "questionario_pais", overlapGroup: "g-atraso-a", primaryDomain: "atraso", description: "Rastreio sintético com 12 perguntas." });
const BAND_PARTIAL = scale({ id: "sint-atraso-curto", queixas: ["atraso"], respondente: ["pais"], ageMin: 12, ageMax: 30, applicationMode: "questionario_pais", overlapGroup: "g-atraso-b", primaryDomain: "atraso", description: "Rastreio sintético com 10 perguntas." });
const TDAH_PRE = scale({ id: "sint-tdah-pre", queixas: ["tdah"], respondente: ["pais"], ageMin: 24, ageMax: 72, applicationMode: "questionario_pais", overlapGroup: "g-tdah-pre", primaryDomain: "tdah", description: "Questionário sintético com 12 perguntas." });
const MON_TEA = scale({ id: "sint-monitor-tea", queixas: ["tea"], respondente: ["clinico"], prioridade: "monitorizacao", assessmentUse: "monitorizacao", ageMin: 0, ageMax: 216, applicationMode: "registro_clinico", overlapGroup: "g-monitor-tea", primaryDomain: "tea", description: "Monitorização sintética com 10 perguntas." });
const LONG_TEA = scale({ id: "sint-longo-tea", queixas: ["tea"], respondente: ["clinico"], ageMin: 0, ageMax: 216, applicationMode: "observacional_clinico", overlapGroup: "g-long-a", primaryDomain: "tea", description: "Bateria sintética com 60 perguntas." });
const LONG_TDAH = scale({ id: "sint-longo-tdah", queixas: ["tdah"], respondente: ["clinico"], ageMin: 0, ageMax: 216, applicationMode: "observacional_clinico", overlapGroup: "g-long-b", primaryDomain: "tdah", description: "Bateria sintética com 60 perguntas." });
const LONG_TIQUE = scale({ id: "sint-longo-tique", queixas: ["tiques"], respondente: ["clinico"], ageMin: 0, ageMax: 216, applicationMode: "observacional_clinico", overlapGroup: "g-long-c", primaryDomain: "tiques", description: "Bateria sintética com 60 perguntas." });
const NO_ROUTE = scale({ id: "sint-sem-rota", queixas: ["tea"], respondente: ["pais"], ageMin: 0, ageMax: 216, applicationMode: "questionario_pais", implementationStatus: "not_implemented", appRoute: undefined, overlapGroup: "g-sem-rota", primaryDomain: "tea", description: "Ficha sintética sem rota com 20 perguntas." });
const LICENSED = scale({ id: "sint-licenciado", queixas: ["tea"], respondente: ["pais"], ageMin: 0, ageMax: 216, applicationMode: "questionario_pais", implementationStatus: "external_only", licencaUso: "restrita", overlapGroup: "g-licenciado", primaryDomain: "tea", description: "Instrumento sintético licenciado com 20 perguntas." });

const SYNTHETIC: ScaleEntry[] = [
  SUICIDE_OK, TEA_PAIS, TEA_CLIN, TDAH_PROF, TDAH_PAIS, TDAH_PRE, LING_PAIS, AUTO_ANX, EFEITOS, MON_TEA,
  BAND_FULL, BAND_PARTIAL, LONG_TEA, LONG_TDAH, LONG_TIQUE, NO_ROUTE, LICENSED,
];

const ctx = (over: Partial<FilterContext> = {}): FilterContext => ({
  queixas: [],
  ageMonths: null,
  ageBand: null,
  ageInputInvalid: false,
  respondente: null,
  isVerbal: null,
  isLiterate: null,
  assessmentUse: null,
  selectedSignals: [],
  ...over,
});

/** Motor do filtro + pódio + auditoria, como a página faz (faixa: ageMonths nulo). */
function run(catalog: ScaleEntry[], c: FilterContext) {
  const matches = filterScalesWithClinicalRescue(catalog, c);
  const byId = new Map(matches.map((m) => [m.scale.id, m]));
  const band = c.ageBand ?? null;
  const curated = selectCuratedTiers(c.queixas, c.ageMonths, byId, c.respondente ?? null, band);
  const detail = selectPodiumDetailed(matches, curated, {
    selectedQueixas: c.queixas,
    ageMonths: c.ageMonths,
    selectedSignals: c.selectedSignals,
    ageBand: band,
  });
  const audit = auditPodium({
    podium: detail,
    candidates: matches,
    selectedQueixas: c.queixas,
    selectedSignals: c.selectedSignals ?? [],
    selection: { exactAge: c.ageMonths, ageBand: band },
  });
  const medals = [detail.podium.ouro, detail.podium.prata, detail.podium.bronze].filter(Boolean) as RefinedScaleMatch[];
  return { matches, detail, audit, medals };
}

// ─────────────────────── 1. idade exata × faixa etária ───────────────────────
test("encaixe etário: idade exata exige conter a idade; faixa usa cobertura e sobreposição", () => {
  assert.equal(scaleAgeFit({ ageMin: 12, ageMax: 72 }, { exactAge: 30 }), "exact");
  assert.equal(scaleAgeFit({ ageMin: 12, ageMax: 72 }, { exactAge: 96 }), "none");
  assert.equal(scaleAgeFit({ ageMin: 0, ageMax: 216 }, { exactAge: null, ageBand: { min: 24, max: 47.99 } }), "full");
  assert.equal(scaleAgeFit({ ageMin: 12, ageMax: 30 }, { exactAge: null, ageBand: { min: 24, max: 47.99 } }), "partial");
  assert.equal(scaleAgeFit({ ageMin: 60, ageMax: 216 }, { exactAge: null, ageBand: { min: 24, max: 47.99 } }), "none");
  // Faixa fracionária do catálogo (0–5,99 meses) cabe em instrumento 0–6 meses.
  assert.equal(scaleAgeFit({ ageMin: 0, ageMax: 6 }, { exactAge: null, ageBand: { min: 0, max: 5.99 } }), "full");
  assert.equal(scaleAgeFit({ ageMin: 0, ageMax: 6 }, { exactAge: null, ageBand: null }), "unknown");
});

test("idade exata: o pódio só recomenda instrumento que contém a idade", () => {
  const { medals } = run(SYNTHETIC, ctx({ queixas: ["tea"], ageMonths: 30, respondente: null }));
  assert.ok(medals.length >= 1);
  for (const m of medals) assert.ok(m.scale.ageMin <= 30 && m.scale.ageMax >= 30, `${m.scale.id} não contém 30 meses`);
});

test("faixa ampla: a escala que cobre toda a faixa vence a que cobre só parte dela", () => {
  const band = { min: 24, max: 47.99 };
  const { detail, audit } = run(SYNTHETIC, ctx({ queixas: ["atraso"], ageMonths: null, ageBand: band }));
  assert.equal(detail.podium.ouro?.scale.id, "sint-atraso-amplo");
  const ouroAudit = audit.medals.find((m) => m.slot === "ouro");
  assert.equal(ouroAudit?.ageFit, "full");
  // Cobertura parcial continua disponível, mas exige confirmação da idade exata.
  const partial = audit.medals.find((m) => m.id === "sint-atraso-curto");
  if (partial) {
    assert.equal(partial.ageFit, "partial");
    assert.ok(audit.gaps.some((g) => g.kind === "faixa" && g.message.includes("confirme a idade exata")));
  }
});

test("faixa ampla sem escala que a cubra por inteiro: compatibilidade parcial é sinalizada", () => {
  const onlyPartial = [BAND_PARTIAL];
  const band = { min: 24, max: 47.99 };
  const { medals, audit } = run(onlyPartial, ctx({ queixas: ["atraso"], ageBand: band }));
  assert.equal(medals.length, 1, "parcial continua elegível quando é a única opção");
  assert.equal(audit.medals[0].ageFit, "partial");
  assert.ok(audit.gaps.some((g) => g.kind === "faixa"), "compatibilidade parcial precisa aparecer ao usuário");
});

test("TDAH como queixa principal abaixo de 4 anos continua bloqueado, também em faixa", () => {
  const band = { min: 24, max: 47.99 };
  const block = /TDAH não recomendado como principal abaixo de 4 anos/;
  assert.match(String(clinicalHardBlock(TDAH_PRE, ctx({ queixas: ["tdah"], ageBand: band }))), block);
  assert.match(String(clinicalHardBlock(TDAH_PRE, ctx({ queixas: ["tdah"], ageMonths: 40 }))), block);
  // Faixa que começa aos 4 anos não é bloqueada por essa regra.
  assert.equal(clinicalHardBlock(TDAH_PROF, ctx({ queixas: ["tdah"], ageBand: { min: 72, max: 143.99 } })), null);
});

test("ponto médio de faixa não valida instrumento como idade exata", () => {
  // Faixa 2–4 anos: o ponto médio (36 meses) NÃO pode fazer uma escala 30–36 meses
  // parecer compatível com a faixa inteira.
  const narrow = scale({ id: "sint-estreito", queixas: ["tea"], respondente: ["pais"], ageMin: 30, ageMax: 36, applicationMode: "questionario_pais", description: "Instrumento sintético com 10 perguntas." });
  const band = { min: 24, max: 47.99 };
  const { detail } = run([narrow, TEA_PAIS], ctx({ queixas: ["tea"], ageBand: band }));
  assert.ok(detail.podium.ouro, "há principal");
  assert.notEqual(detail.podium.ouro.scale.id, "sint-estreito", "cobertura parcial não vira principal");
  assert.equal(scaleAgeFit(detail.podium.ouro.scale, { ageBand: band }), "full", "principal cobre a faixa inteira");
});

test("curadoria: idade exata fora de qualquer regra não usa regra de outra idade", () => {
  // Enurese tem regras de 18–48 e 48–216 meses e nenhum fluxograma: aos 6 meses há lacuna.
  assert.equal(getClinicalTiers("enurese", 6), undefined, "lacuna entre faixas curadas: nenhuma regra de outra idade");
  assert.equal(getClinicalTiers("enurese", 100)?.queixa, "enurese");
  assert.equal(getClinicalTiers("enurese", null)?.queixa, "enurese", "sem idade: regra representativa");
});

test("curadoria em faixa usa a regra que cobre a faixa, sem ponto médio", () => {
  const full = getClinicalTiers("tea", null, { min: 0, max: 5.99 });
  assert.ok(full && full.ageMin <= 0 && full.ageMax >= 5.99, "regra cobre toda a faixa 0–5,99");
  const overlap = getClinicalTiers("tea", null, { min: 24, max: 47.99 });
  assert.ok(overlap, "sem regra cobrindo a faixa: maior sobreposição");
});

// ─────────────────────── 2. uma, duas e três queixas ───────────────────────
test("uma queixa: a principal é a primeira vaga e cobre a queixa", () => {
  const { medals, audit } = run(SYNTHETIC, ctx({ queixas: ["tea"], ageMonths: 30 }));
  assert.ok(medals.length > 0);
  assert.ok(medals.some((m) => m.scale.queixas.includes("tea")));
  assert.equal(audit.gaps.filter((g) => g.kind === "queixa").length, 0);
});

test("duas queixas: ambas cobertas quando há instrumentos seguros para cada uma", () => {
  const { medals, audit } = run(SYNTHETIC, ctx({ queixas: ["tea", "tdah"], ageMonths: 96 }));
  assert.ok(medals.some((m) => m.scale.queixas.includes("tea")), "TEA coberta");
  assert.ok(medals.some((m) => m.scale.queixas.includes("tdah")), "TDAH coberta");
  assert.equal(audit.gaps.filter((g) => g.kind === "queixa").length, 0);
});

test("três queixas: a lacuna sem instrumento seguro é descrita, não escondida", () => {
  const { audit, medals } = run(SYNTHETIC, ctx({ queixas: ["tea", "tdah", "linguagem"], ageMonths: 96 }));
  assert.ok(medals.length <= 3);
  const gap = audit.gaps.find((g) => g.kind === "queixa" && g.message.toLowerCase().includes("linguagem"));
  assert.ok(gap, "linguagem não coberta precisa aparecer como lacuna");
  assert.match(gap.message, /sem instrumento seguro|sem instrumento no trio/);
});

// ─────────────────────── 3. sintomas selecionados ───────────────────────
test("sintoma marcado que uma escala segura cobre entra no trio", () => {
  const { medals, audit } = run(SYNTHETIC, ctx({ queixas: ["tdah"], ageMonths: 96, selectedSignals: ["sinal-gama"] }));
  assert.ok(medals.some((m) => m.scale.id === "sint-tdah-prof"), "o sinal marcado deve trazer a escala que o cobre");
  assert.equal(audit.gaps.filter((g) => g.kind === "sinal").length, 0);
});

test("sintoma sem instrumento seguro que o cubra gera lacuna explícita", () => {
  const { audit } = run(SYNTHETIC, ctx({ queixas: ["tdah"], ageMonths: 96, selectedSignals: ["sinal-inexistente"] }));
  const gap = audit.gaps.find((g) => g.kind === "sinal");
  assert.ok(gap, "sinal sem cobertura deve ser reportado");
  assert.match(gap.message, /sem instrumento aplicável seguro/);
});

test("sinal cujo instrumento não cabe no teto é reportado com o motivo de orçamento", () => {
  const heavy = scale({ id: "sint-pesado", queixas: ["tea"], respondente: ["clinico"], ageMin: 0, ageMax: 216, applicationMode: "observacional_clinico", overlapGroup: "g-pesado", primaryDomain: "tea", signalTags: ["sinal-pesado"], description: "Bateria sintética com 100 perguntas." });
  const { audit, medals } = run([TEA_PAIS, TEA_CLIN, heavy], ctx({ queixas: ["tea"], ageMonths: 30, selectedSignals: ["sinal-pesado"] }));
  assert.ok(audit.totalQuestions <= PODIUM_QUESTION_CAP);
  if (!medals.some((m) => m.scale.id === "sint-pesado")) {
    const gap = audit.gaps.find((g) => g.kind === "sinal");
    assert.ok(gap && /teto de 100 perguntas/.test(gap.message), "motivo de orçamento visível");
    assert.ok(gap.message.includes(heavy.name), 'mostra alternativa segura pelo nome');
    assert.equal(gap.alternativeId, heavy.id, "alternativa segura pode ser aberta sem integrar o trio");
  }
});

// ─────────────────────── 4. respondente, verbalidade, alfabetização, finalidade ───────────────────────
test("respondente escolhido é obrigatório: nenhuma medalha de outro respondente", () => {
  const { medals } = run(SYNTHETIC, ctx({ queixas: ["tea"], ageMonths: 30, respondente: "pais" }));
  for (const m of medals) assert.ok(m.scale.respondente.includes("pais"), `${m.scale.id} sem respondente pais`);
});

test("verbalidade: escala que exige fala é bloqueada para criança não verbal", () => {
  const blocked = run([LING_PAIS], ctx({ queixas: ["linguagem"], ageMonths: 36, isVerbal: false }));
  assert.equal(blocked.medals.length, 0);
  const allowed = run([LING_PAIS], ctx({ queixas: ["linguagem"], ageMonths: 36, isVerbal: true }));
  assert.equal(allowed.medals.length, 1);
});

test("alfabetização e idade do autorrelato são travas clínicas", () => {
  assert.match(String(clinicalHardBlock(AUTO_ANX, ctx({ queixas: ["ansiedade"], ageMonths: 120, isLiterate: false }))), /alfabetizada|alfabetização/);
  assert.match(String(clinicalHardBlock(AUTO_ANX, ctx({ queixas: ["ansiedade"], ageMonths: 60 }))), /Fora da faixa|Autoaplicável/);
  assert.equal(run([AUTO_ANX], ctx({ queixas: ["ansiedade"], ageMonths: 120, isLiterate: true })).medals.length, 1);
});

test("finalidade: escala de monitorização só entra em contexto de monitorização", () => {
  assert.equal(run([EFEITOS], ctx({ queixas: ["efeitos"], ageMonths: 96 })).medals.length, 1, "efeitos é pós-consulta: entra");
  assert.equal(run([MON_TEA], ctx({ queixas: ["tea"], ageMonths: 96, assessmentUse: null })).medals.length, 0, "triagem não inclui monitorização");
  assert.equal(run([MON_TEA], ctx({ queixas: ["tea"], ageMonths: 96, assessmentUse: "monitorizacao" })).medals.length, 1, "com finalidade de monitorização, entra");
});

// ─────────────────────── 5. risco agudo fail-closed ───────────────────────
test("risco agudo: sem instrumento de risco seguro, nada de outro domínio preenche o pódio", () => {
  const withoutRisk = SYNTHETIC.filter((s) => s.id !== SUICIDE_OK.id);
  const result = filterScalesWithClinicalRescue(withoutRisk, ctx({ queixas: ["suicidio"], ageMonths: 150 }));
  assert.ok(result.every((m) => m.scale.queixas.includes("suicidio")), "não pode trazer escala de outro domínio");
  assert.ok(result.every((m) => !m.isBroadbandFallback), "sem fallback de triagem ampla em risco agudo");
  assert.equal(result.length, 0, "ausência de instrumento seguro é saída válida");
});

test("risco agudo: com instrumento de risco seguro, ele é a primeira linha", () => {
  const { medals } = run(SYNTHETIC, ctx({ queixas: ["suicidio"], ageMonths: 150 }));
  assert.equal(medals[0]?.scale.id, "sint-risco-suicidio");
  assert.ok(medals.every((m) => m.scale.queixas.includes("suicidio")));
});

// ─────────────────────── 6. redundância e complementaridade ───────────────────────
test("duplicatas do mesmo grupo de redundância não ocupam vagas diferentes sem justificativa", () => {
  const { medals, detail } = run(SYNTHETIC, ctx({ queixas: ["tdah"], ageMonths: 96 }));
  const tdahGroup = medals.filter((m) => m.scale.overlapGroup === "g-tdah");
  assert.ok(tdahGroup.length <= 1, "uma forma do mesmo construto basta");
  for (const d of detail.redundancy) assert.ok(["replaced", "dropped", "kept_justified"].includes(d.action));
});

test("complementaridade real: duas medalhas do mesmo construto diferem em modalidade ou informante", () => {
  const { medals } = run(SYNTHETIC, ctx({ queixas: ["tea"], ageMonths: 30 }));
  for (let i = 0; i < medals.length; i++) for (let j = i + 1; j < medals.length; j++) {
    if (sameClinicalConstruct(medals[i], medals[j])) {
      assert.fail(`${medals[i].scale.id} e ${medals[j].scale.id} repetem construto`);
    }
  }
});

test("resolveRedundantMedals: troca por outro construto que também cobre a queixa", () => {
  const funcoes = scale({ id: "sint-tdah-funcoes", queixas: ["tdah"], respondente: ["clinico"], overlapGroup: "g-tdah-funcoes", primaryDomain: "funcoes", applicationMode: "observacional_clinico", description: "Roteiro sintético com 15 perguntas." });
  const a = { scale: TDAH_PROF, relevanceScore: 90, applicationMode: TDAH_PROF.applicationMode } as unknown as RefinedScaleMatch;
  const b = { scale: TDAH_PAIS, relevanceScore: 88, applicationMode: TDAH_PAIS.applicationMode } as unknown as RefinedScaleMatch;
  const alt = { scale: funcoes, relevanceScore: 80, applicationMode: funcoes.applicationMode } as unknown as RefinedScaleMatch;
  const out = resolveRedundantMedals({
    ouro: a, prata: b, bronze: undefined, candidates: [a, b, alt], selectedQueixas: ["tdah"], selectedSignals: [],
    eligible: () => true, questionCap: 100, countQuestions: () => 20,
  });
  assert.equal(out.trio.prata?.scale.id, "sint-tdah-funcoes");
  assert.ok(out.decisions.some((d) => d.action === "replaced" && d.withId === "sint-tdah-funcoes"));
});

test("resolveRedundantMedals: remove a duplicata quando não há alternativa nem queixa única", () => {
  const a = { scale: TDAH_PROF, relevanceScore: 90, applicationMode: TDAH_PROF.applicationMode } as unknown as RefinedScaleMatch;
  const b = { scale: TDAH_PAIS, relevanceScore: 88, applicationMode: TDAH_PAIS.applicationMode } as unknown as RefinedScaleMatch;
  const out = resolveRedundantMedals({
    ouro: a, prata: b, bronze: undefined, candidates: [a, b], selectedQueixas: ["tdah"], selectedSignals: [],
    eligible: () => true, questionCap: 100, countQuestions: () => 20,
  });
  assert.equal(out.trio.prata, undefined);
  assert.ok(out.decisions.some((d) => d.action === "dropped"));
});

test("resolveRedundantMedals: mantém a duplicata só quando cobre queixa única (justificativa)", () => {
  const a = { scale: TDAH_PROF, relevanceScore: 90, applicationMode: TDAH_PROF.applicationMode } as unknown as RefinedScaleMatch;
  const extra = { scale: scale({ id: "sint-tdah-extra", queixas: ["tdah", "ansiedade"], overlapGroup: "g-tdah", primaryDomain: "tdah", applicationMode: "questionario_pais", respondente: ["pais"] }), relevanceScore: 85, applicationMode: "questionario_pais" } as unknown as RefinedScaleMatch;
  const out = resolveRedundantMedals({
    ouro: a, prata: extra, bronze: undefined, candidates: [a, extra], selectedQueixas: ["tdah", "ansiedade"], selectedSignals: [],
    eligible: () => true, questionCap: 100, countQuestions: () => 20,
  });
  assert.equal(out.trio.prata?.scale.id, "sint-tdah-extra", "cobre ansiedade, que o ouro não cobre");
  assert.ok(out.decisions.some((d) => d.action === "kept_justified"));
});

// ─────────────────────── 7. teto de 100 perguntas e trio incompleto ───────────────────────
test("teto de 100 perguntas: o trio nunca ultrapassa o limite", () => {
  const { detail, audit } = run(SYNTHETIC, ctx({ queixas: ["tea", "tdah", "tiques"], ageMonths: 96 }));
  const total = [detail.podium.ouro, detail.podium.prata, detail.podium.bronze]
    .filter(Boolean)
    .reduce((sum, m) => sum + estimatedQuestionCount((m as RefinedScaleMatch).scale), 0);
  assert.ok(total <= PODIUM_QUESTION_CAP, `total ${total} excede ${PODIUM_QUESTION_CAP}`);
  assert.equal(audit.withinCap, true);
});

test("menos de três quando não há trio seguro: o pódio não é preenchido por obrigação", () => {
  const { medals, audit } = run([TEA_PAIS], ctx({ queixas: ["tea"], ageMonths: 30 }));
  assert.equal(medals.length, 1);
  assert.ok(audit.gaps.some((g) => g.kind === "vaga" && /1 de 3/.test(g.message)));
});

// ─────────────────────── 8. catálogo: rota, ficha, licença e escala incompleta ───────────────────────
test("catálogo sem rota, ficha ou licenciada: a principal é sempre aplicável no app", () => {
  const { detail, audit } = run(SYNTHETIC, ctx({ queixas: ["tea"], ageMonths: 30, respondente: "pais" }));
  const ouro = audit.medals.find((m) => m.slot === "ouro");
  assert.ok(ouro, "há principal");
  assert.equal(ouro.opensInApp, true, "a principal abre e aplica no app");
  assert.ok(detail.podium.ouro?.scale.id !== "sint-licenciado");
  assert.ok(detail.podium.ouro?.scale.id !== "sint-sem-rota");
});

test("medalha que não abre no app é declarada como tal", () => {
  const only = [NO_ROUTE];
  const { audit, medals } = run(only, ctx({ queixas: ["tea"], ageMonths: 30, respondente: "pais" }));
  assert.equal(medals.length, 1);
  assert.equal(audit.medals[0].opensInApp, false, "não abre no app: a UI precisa saber");
});

test("idade inválida falha fechado: nenhuma escala é recomendada", () => {
  const result = filterScalesWithClinicalRescue(SYNTHETIC, ctx({ queixas: ["tea"], ageMonths: 30, ageInputInvalid: true }));
  assert.equal(result.length, 0);
});

// ─────────────────────── 9. busca livre (intenção) ───────────────────────
test("busca livre: respondente, tempo, comunicação e finalidade continuam sendo lidos", () => {
  const intent = parseFilterQueryIntent("criança de 5 anos não fala, pais, 10 min, acompanhamento");
  assert.equal(intent.respondent, "pais");
  assert.equal(intent.timeBudgetMinutes, 10);
  assert.equal(intent.communication, "nonverbal");
  assert.equal(intent.assessmentType, "monitoring");
});

// ─────────────────────── 10. exportação ───────────────────────
test("exportação: colunas existentes mantêm a ordem; papel e encaixe são acrescentados", () => {
  const row: FilterExportRow = {
    slot: "Ouro", clinicalTier: "", name: "Escala sintética", fullName: "Escala sintética", ageRange: "2–6 anos",
    respondente: "Pais/cuidadores", validacaoBrasil: "", tempo: "10 min", scoringCutoff: "", fonte: "sintético",
    reason: "Motivo sintético", papel: "Escala principal", compatibilidadeEtaria: "Compatível com toda a faixa selecionada",
  };
  const csv = buildFilterCsv(
    { age: "2 anos", queixas: "TEA", respondente: "pais", generatedAtLabel: "01/01/2026", lacunas: ["Queixa sem instrumento no trio: exemplo."] },
    [row],
  );
  const header = csv.split("\r\n").find((line) => line.startsWith("Prioridade")) ?? "";
  assert.equal(header.split(";").slice(0, 11).join(";"), "Prioridade;Linha clinica;Escala;Nome completo;Faixa etaria;Respondente;Validacao Brasil;Tempo;Ponto de corte;Fonte;Motivo");
  assert.match(header, /Papel no trio;Encaixe etario$/);
  assert.match(csv, /Lacunas do trio;/);
  assert.match(csv, /Escala principal/);
});

// ─────────────────────── 11. invariantes no catálogo real (amostra) ───────────────────────
test("catálogo real (amostra sintética de perfis): idade, respondente, teto e risco", () => {
  const catalog = mergeFilterableCatalog(allScales);
  const band = faixasEtarias[3];
  const profiles: Array<FilterContext> = [
    ctx({ queixas: ["tea"], ageMonths: 30 }),
    ctx({ queixas: ["tdah"], ageMonths: 96, respondente: "professor" }),
    ctx({ queixas: ["tea", "linguagem"], ageMonths: 48, respondente: "pais" }),
    ctx({ queixas: ["tea"], ageBand: { min: band.min, max: band.max } }),
    ctx({ queixas: ["suicidio"], ageMonths: 180 }),
  ];
  for (const profile of profiles) {
    const { medals, audit } = run(catalog, profile);
    assert.ok(audit.withinCap, "teto de 100 perguntas");
    for (const m of medals) {
      if (profile.ageMonths != null) assert.ok(m.scale.ageMin <= profile.ageMonths && m.scale.ageMax >= profile.ageMonths, `${m.scale.id} fora da idade exata`);
      if (profile.ageBand) assert.ok(m.scale.ageMax >= profile.ageBand.min && m.scale.ageMin <= profile.ageBand.max, `${m.scale.id} fora da faixa`);
      if (profile.respondente) assert.ok(m.scale.respondente.includes(profile.respondente), `${m.scale.id} respondente incompatível`);
    }
    if (profile.queixas.includes("suicidio")) {
      assert.ok(medals.every((m) => m.scale.queixas.includes("suicidio")), "risco agudo sem domínio estranho");
      assert.ok(medals.every((m) => !m.isBroadbandFallback), "risco agudo sem fallback");
    }
  }
});


test("contagem sem itens verificáveis é explicitamente estimada", () => {
  const unknown = scale({ id: "sint-contagem-incerta", queixas: ["tea"], description: "Descrição sem número de perguntas.", scoringCutoff: "" });
  const info = getPodiumQuestionCountInfo(unknown);
  assert.deepEqual(info, { count: 20, source: "estimated" });
  const declared = scale({ id: "sint-contagem-declarada", queixas: ["tea"], description: "Questionário com 48 perguntas.", scoringCutoff: "" });
  assert.deepEqual(getPodiumQuestionCountInfo(declared), { count: 48, source: "declared" });
});

test("auditoria sinaliza carga provisória sem declarar o teto verificado", () => {
  const unknown = scale({ id: "sint-sem-carga", queixas: ["tea"], description: "Sem informação quantitativa.", scoringCutoff: "" });
  const { audit } = run([unknown], ctx({ queixas: ["tea"], ageMonths: 30 }));
  assert.ok(audit.gaps.some((gap) => gap.kind === "teto" && /provisório/.test(gap.message)));
});
