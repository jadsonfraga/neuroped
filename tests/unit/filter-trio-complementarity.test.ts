/**
 * Trio complementar do pódio: nunca três escalas repetitivas.
 *
 * Cenários 100% sintéticos (idade, queixa, respondente). Nenhum dado de
 * paciente. O teste cobre: identidade de instrumento (edição, forma
 * curta/longa, faixa etária vizinha, módulo de bateria, inventário amplo),
 * complementaridade legítima de informantes diferentes, as duas falhas da
 * resolução de redundância (cópia de medalha e teto de perguntas) e o
 * desempate por especificidade etária.
 */
import assert from "node:assert/strict";
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { filterScalesWithClinicalRescue, type RefinedScaleMatch } from "../../client/src/data/advancedFilterLogic.ts";
import {
  PODIUM_QUESTION_CAP,
  estimatedQuestionCount,
  selectCuratedTiers,
  selectPodiumDetailed,
} from "../../client/src/data/filterPodium.ts";
import {
  repetitionCount,
  resolveRedundantMedals,
  sameClinicalConstruct,
} from "../../client/src/data/filterPodiumComplementarity.ts";
import {
  familyOverflow,
  isBroadbandInventory,
  repetitiveByFamily,
  sameInstrumentFamily,
} from "../../client/src/data/scaleConstructFamily.ts";
import { ageSpecificityBonus } from "../../client/src/data/scaleAgeFit.ts";

const catalog = mergeFilterableCatalog(allScales);
const byId = new Map(catalog.map((s) => [s.id, s]));
const scale = (id: string) => {
  const found = byId.get(id);
  assert.ok(found, `escala ${id} existe no catálogo`);
  return found!;
};

// 1. Identidade de instrumento pelo MESMO informante = repetição.
for (const [a, b, why] of [
  ["bisq", "bisq-r", "edição revisada do mesmo questionário"],
  ["psc17", "psc35", "forma curta e longa"],
  ["phq2", "phqa", "itens iniciais do mesmo instrumento"],
  ["flacc", "rflacc", "versão revisada"],
  ["nrs-pain", "fps-r", "mesmo construto (intensidade de dor) por autorrelato"],
  ["flacc", "comfort-b", "mesmo construto (dor comportamental) por observação"],
  ["j26-001", "j26-002", "mesmo protocolo em faixas etárias vizinhas"],
  ["na-funcoes-executivas-ampliado-pais", "na-funcoes-executivas-casa-pais", "duas formas de funções executivas para pais"],
  ["na-qualidade-vida-pais", "na-qualidade-vida-epilepsia", "qualidade de vida genérica e específica para pais"],
  ["ipn-lfc-anamnese-20", "ipn-lfc-diferenciais-15", "dois módulos clínicos da mesma bateria"],
  ["ipn-tea-18-30m", "ipn-tea-31-47m", "módulos etários vizinhos da mesma bateria"],
  ["einpi-360", "integra-kids-360", "dois inventários amplos de pais"],
] as const) {
  assert.equal(repetitiveByFamily(scale(a), scale(b)), true, `${a} × ${b}: ${why}`);
}

// 2. Mesmo instrumento por informantes DIFERENTES = outra perspectiva (permitido).
for (const [a, b] of [
  ["na-atencao-atividade-pais", "na-atencao-atividade-professor"],
  ["na-perfil-emocional-comportamental-pais", "na-perfil-emocional-comportamental-professor"],
  ["ipn-lfc-familia-50", "ipn-lfc-escola-30"],
  ["cybocs", "cybocs-sr"],
  ["na-funcoes-executivas-casa-pais", "funcoes-executivas"],
] as const) {
  assert.equal(sameInstrumentFamily(scale(a), scale(b)), true, `${a} e ${b} são da mesma família`);
  assert.equal(repetitiveByFamily(scale(a), scale(b)), false, `${a} × ${b}: informantes diferentes complementam`);
}

// 3. Construtos distintos não colapsam por nome parecido ou sigla igual.
for (const [a, b] of [
  ["j26-107", "j26-008"], // motor grosso × motor fino
  ["j26-101", "j26-102"], // discalculia × cópia e ditado
  ["na-efeitos-estimulantes-pais", "na-efeitos-antiepilepticos-pais"],
  ["na-ansiedade-seguimento-pais", "na-toc-seguimento-pais"],
  ["cries", "cries13"], // dor neonatal × trauma (siglas iguais, instrumentos diferentes)
  ["gad7", "gad7-cuidador"], // ansiedade da criança × do cuidador
] as const) {
  assert.equal(repetitiveByFamily(scale(a), scale(b)), false, `${a} × ${b} são construtos distintos`);
}
assert.equal(isBroadbandInventory(scale("einpi-360")), true);
assert.equal(isBroadbandInventory(scale("efdi")), false);

// 4. Uma família não ocupa as três vagas, mesmo com três informantes.
assert.equal(
  familyOverflow([scale("ipn-lfc-familia-50"), scale("ipn-lfc-escola-30"), scale("ipn-lfc-autopercepcao-20")]),
  1,
);
assert.equal(familyOverflow([scale("ipn-lfc-familia-50"), scale("ipn-lfc-escola-30"), scale("efdi")]), 0);

// 5. Catálogo real: nenhum trio repetitivo sem justificativa de cobertura única.
function podiumFor(queixas: string[], ageMonths: number, respondente: string | null = null, selectedSignals: string[] = []) {
  const ctx = { queixas, ageMonths, ageBand: null, respondente: respondente as never, selectedSignals };
  const matches = filterScalesWithClinicalRescue(catalog, ctx);
  const curated = selectCuratedTiers(queixas, ageMonths, new Map(matches.map((m) => [m.scale.id, m])), respondente as never, null);
  const detail = selectPodiumDetailed(matches, curated, { selectedQueixas: queixas, ageMonths, selectedSignals, ageBand: null });
  const trio = [detail.podium.ouro, detail.podium.prata, detail.podium.bronze].filter((m): m is RefinedScaleMatch => Boolean(m));
  return { trio, detail, matches };
}
const scenarios: Array<[string[], number, string | null]> = [];
for (const queixa of ["dor", "sono", "tdah", "tea", "atraso", "linguagem", "ansiedade", "epilepsia", "depressao", "motor", "aprendizagem", "comportamento"]) {
  for (const age of [6, 15, 30, 54, 96, 144, 192]) {
    for (const respondente of [null, "pais", "clinico", "professor", "autoaplicavel"]) scenarios.push([[queixa], age, respondente]);
  }
}
let checked = 0;
for (const [queixas, age, respondente] of scenarios) {
  const { trio, detail, matches } = podiumFor(queixas, age, respondente);
  if (matches.length === 0) continue;
  checked++;
  const label = `${queixas.join("+")} · ${age}m · ${respondente ?? "qualquer"}`;
  assert.equal(new Set(trio.map((m) => m.scale.id)).size, trio.length, `${label}: medalha duplicada`);
  assert.ok(trio.reduce((sum, m) => sum + estimatedQuestionCount(m.scale), 0) <= PODIUM_QUESTION_CAP, `${label}: teto`);
  assert.ok(detail.podium.prata || !detail.podium.bronze, `${label}: Bronze sem Prata`);
  if (repetitionCount(trio) > 0) {
    // Só é aceitável quando a medalha parecida responde a uma queixa ou sinal que nenhuma outra cobre.
    assert.ok(
      detail.redundancy.some((decision) => decision.action === "kept_justified"),
      `${label}: trio repetitivo sem justificativa → ${trio.map((m) => m.scale.id).join(", ")}`,
    );
  }
}
assert.ok(checked > 300, `cenários avaliados: ${checked}`);

// 6. Exemplos clínicos concretos.
{
  const pain = podiumFor(["dor"], 6, "clinico").trio.map((m) => m.scale.id);
  const behavioral = pain.filter((id) => ["flacc", "rflacc", "comfort-b", "cheops", "cries"].includes(id));
  assert.equal(behavioral.length, 1, `dor aos 6 meses: uma escala comportamental basta (${pain.join(", ")})`);
  const sleep = podiumFor(["sono"], 12, "pais").trio.map((m) => m.scale.id);
  assert.ok(!(sleep.includes("bisq") && sleep.includes("bisq-r")), `sono aos 12 meses: BISQ e BISQ-R não dividem o pódio (${sleep.join(", ")})`);
}

// 7. Resolução de redundância: trocar Prata não copia o Bronze nem estoura o teto.
{
  const mk = (id: string, relevanceScore: number, items: number, overlapGroup: string): RefinedScaleMatch => ({
    scale: {
      id, name: id, fullName: id, ageMin: 0, ageMax: 216, queixas: ["tdah"], respondente: ["pais"],
      prioridade: "triagem", tempo: "5 min", description: `${items} itens de registro sintético`,
      implementationStatus: "complete", appRoute: `/generic-scale/${id}`, overlapGroup,
    },
    relevanceScore, clinicalReason: "Cenário sintético", warningFlags: [], tier: "gold",
    confidenceLevel: 85, implementationStatus: "complete", implementationLabel: "Aplicação completa",
    applicationMode: "questionario_pais", licenseRestricted: false,
  });
  // Contagem declarada no cenário sintético (o registro real exige contagem verificada).
  const countQuestions = (m: RefinedScaleMatch) => Number(/(\d+) itens/.exec(m.scale.description ?? "")?.[1] ?? Infinity);
  const ouro = mk("ouro-a", 95, 40, "grupo-1");
  const prata = mk("prata-a", 92, 40, "grupo-1"); // repete o Ouro
  const bronze = mk("bronze-b", 90, 40, "grupo-2");
  const longOther = mk("longo-c", 89, 40, "grupo-3"); // 40 + 40 + 40 > 100
  const run = (candidates: RefinedScaleMatch[]) => {
    const { trio } = resolveRedundantMedals({
      ouro, prata, bronze, candidates,
      selectedQueixas: ["tdah"], selectedSignals: [],
      eligible: () => true, questionCap: 100, countQuestions,
    });
    return [trio.ouro, trio.prata, trio.bronze].filter(Boolean).map((m) => m!.scale.id);
  };
  // 7a. A substituta candidata é o próprio Bronze: não pode ser copiada.
  const copy = run([ouro, prata, bronze, longOther]);
  assert.equal(new Set(copy).size, copy.length, `sem cópia de medalha: ${copy.join(", ")}`);
  assert.deepEqual(copy, ["ouro-a", "bronze-b"], "a repetitiva sai e o Bronze sobe para Prata");
  // 7b. A substituta só caberia ignorando a carga do Bronze: não entra.
  const cap = run([ouro, prata, longOther, bronze]);
  assert.ok(!cap.includes("longo-c"), `teto somado ao Bronze: ${cap.join(", ")}`);
  assert.ok(cap.length * 40 <= 100, "cada escala sintética tem 40 itens: no máximo duas cabem no teto");
  assert.equal(sameClinicalConstruct(ouro, prata), true);
}

// 8. Especificidade etária: desempate, nunca trava.
assert.equal(ageSpecificityBonus({ ageMin: 6, ageMax: 8 }, { exactAge: 6 }), 4);
assert.equal(ageSpecificityBonus({ ageMin: 0, ageMax: 60 }, { exactAge: 30 }), 2);
assert.equal(ageSpecificityBonus({ ageMin: 0, ageMax: 216 }, { exactAge: 30 }), 0);
assert.equal(ageSpecificityBonus({ ageMin: 6, ageMax: 8 }, { exactAge: 30 }), 0, "fora da idade não ganha nada");
assert.equal(ageSpecificityBonus({ ageMin: 6, ageMax: 8 }, { ageBand: { min: 0, max: 12 } }), 0, "faixa não usa ponto médio");

console.log(`[filter-trio-complementarity] OK: ${checked} cenários reais sem trio repetitivo injustificado`);
