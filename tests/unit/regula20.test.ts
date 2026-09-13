import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { allScales } from "../../client/src/data/scaleFilter";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog";
import { mergeFilterableCatalog as legacyComposition } from "../../client/src/data/filterableCatalogBase";
import { recommendPreConsultaScales } from "../../client/src/lib/preConsultaCore";
import {
  REGULA20_ID, REGULA20_ROUTE, REGULA20_VERSION, REGULA20_SOURCE,
  REGULA20_ITEMS, REGULA20_OPTIONS, REGULA20_DOMAINS, REGULA20_RED_FLAGS,
  calculateRegula20, compareRegula20, regula20Eligibility, regula20SafetyState,
} from "../../client/src/data/regula20";

const eligibilityInput = { ageMonths: 96, respondent: "pais", purpose: "basal-funcional", focus: "irritabilidade-funcional" };
const record = (answers: unknown[]) => ({ version: REGULA20_VERSION, respondent: "pais", observer: "cuidador-fixture", context: "casa", answers });

test("20 itens preservam o PDF canônico: apenas espaços/quebras normalizados", () => {
  // Hash de JSON UTF-8 dos itens extraídos, em ordem, das páginas 2 e 3 do PDF.
  assert.equal(REGULA20_ITEMS.length, 20);
  assert.equal(`sha256:${createHash("sha256").update(JSON.stringify(REGULA20_ITEMS)).digest("hex")}`, "sha256:8632ccb4efe560bc2e61d48833167577f2d838b8c15c996b34770312ebe166c0");
  assert.equal(REGULA20_SOURCE.integrity, "sha256:035f93b584f7b2580de5567e1fd8b8eeaf0a32a88d042dca442d9bbc3151777a");
  assert.equal(REGULA20_DOMAINS.length, 4);
  assert.equal(REGULA20_OPTIONS.length, 6);
  assert.equal(REGULA20_RED_FLAGS.length, 7);
  assert.match(REGULA20_OPTIONS[5].description, /Não entra no cálculo/);
});

test("idade exata, finalidade explícita e observador: falha fechada", () => {
  for (const ageMonths of [36, 37, 96, 215]) assert.equal(regula20Eligibility({ ...eligibilityInput, ageMonths }).eligible, true);
  for (const ageMonths of [-1, 0, 35, 216, NaN, Infinity, 96.5]) assert.equal(regula20Eligibility({ ...eligibilityInput, ageMonths }).eligible, false);
  for (const purpose of ["", "triagem", "diagnostico", "diagnostic", "monitorizacao"]) assert.equal(regula20Eligibility({ ...eligibilityInput, purpose }).eligible, false);
  assert.equal(regula20Eligibility({ ...eligibilityInput, purpose: "seguimento-funcional" }).eligible, true);
  for (const respondent of ["", "autoaplicavel", "adolescente", "crianca", "secretaria"]) assert.equal(regula20Eligibility({ ...eligibilityInput, respondent }).eligible, false);
  for (const respondent of ["pais", "professor", "clinico"]) assert.equal(regula20Eligibility({ ...eligibilityInput, respondent }).eligible, true);
  for (const focus of ["", "tea", "tdah", "comportamento", "suicidio"]) assert.equal(regula20Eligibility({ ...eligibilityInput, focus }).eligible, false);
});

test("zeros são observados; N/O não vira zero, nem cinco pontos", () => {
  const zero = calculateRegula20(Array(20).fill(0));
  assert.equal(zero.complete, true);
  assert.equal(zero.observed, 20);
  assert.equal(zero.globalMean, 0);
  assert.equal(zero.rawTotal, 0);
  const max = calculateRegula20(Array(20).fill(4));
  assert.equal(max.globalMean, 4);
  assert.equal(max.rawTotal, 80);
  const no = calculateRegula20(Array(20).fill(5));
  assert.equal(no.complete, true);
  assert.equal(no.observed, 0);
  assert.equal(no.notObserved, 20);
  assert.equal(no.globalMean, null);
  assert.equal(no.rawTotal, null);
  for (const d of no.domains) { assert.equal(d.mean, null); assert.equal(d.observed, 0); }
});

test("16/20 observáveis: limiar de cobertura, não corte clínico", () => {
  const sixteen = calculateRegula20([...Array(16).fill(3), ...Array(4).fill(5)]);
  assert.equal(sixteen.globalMean, 3);
  assert.equal(sixteen.rawTotal, null);
  assert.equal(sixteen.notObserved, 4);
  assert.equal(calculateRegula20([...Array(15).fill(4), ...Array(5).fill(5)]).globalMean, null);
  const example = calculateRegula20([2, 1, 3, 2, 5]);
  assert.equal(example.domains[0].mean, 2);
  assert.equal(example.domains[0].observed, 4);
  assert.equal(example.missing, 15);
  assert.equal(example.complete, false);
  const sparse = Array(20); sparse[19] = 5;
  assert.equal(calculateRegula20(sparse).missing, 19);
  assert.equal(calculateRegula20(sparse).complete, false);
});

test("não aceitar respostas corrompidas ou índices inválidos", () => {
  for (const bad of [-1, 6, 2.5, NaN, Infinity, "2", null, true, {}]) assert.throws(() => calculateRegula20([bad]), /Resposta inválida/);
  assert.throws(() => calculateRegula20(Array(21).fill(0)), /Resposta inválida/);
});

test("alertas são independentes do escore e incerteza exige revisão", () => {
  assert.deepEqual(regula20SafetyState(Array(7).fill("nao-relatado")), { complete: true, needsReview: false });
  for (const flag of ["presente", "nao-sei"]) {
    assert.deepEqual(regula20SafetyState([flag, ...Array(6).fill("nao-relatado")]), { complete: true, needsReview: true });
  }
  for (const incomplete of [[], Array(7), ["nao-relatado"], ["bad", ...Array(6).fill("nao-relatado")]]) {
    assert.equal(regula20SafetyState(incomplete).complete, false);
    assert.equal(regula20SafetyState(incomplete).needsReview, true);
  }
  assert.equal(calculateRegula20(Array(20).fill(0)).globalMean, 0);
  assert.equal(regula20SafetyState(["presente", ...Array(6).fill("nao-relatado")]).needsReview, true);
});

test("delta só existe entre registros comparáveis e completos", () => {
  const basal = record(Array(20).fill(3));
  const current = record(Array(20).fill(1));
  assert.equal(compareRegula20(basal, current).delta, -2);
  for (const changed of [
    { ...current, version: "outro-contrato" },
    { ...current, respondent: "professor" },
    { ...current, context: "escola" },
    { ...current, observer: "outro-fixture" },
    { ...current, observer: "" },
    { ...current, answers: [...Array(19).fill(1), 5] },
    { ...current, answers: Array(20).fill(5) },
    { ...current, answers: [1] },
  ]) assert.equal(compareRegula20(basal, changed).delta, null);
  const maskA = record([...Array(16).fill(2), ...Array(4).fill(5)]);
  const maskB = record([...Array(4).fill(5), ...Array(16).fill(2)]);
  assert.equal(compareRegula20(maskA, maskB).delta, null);
});

test("catálogo único, rota dedicada e nenhuma entrada na bateria automática", () => {
  const entries = allScales.filter((scale) => scale.id === REGULA20_ID);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].appRoute, REGULA20_ROUTE);
  assert.equal(entries[0].licencaUso, "autoral");
  assert.equal(entries[0].prioridade, "monitorizacao");
  assert.equal(entries[0].pendente_validacao_clinica, true);
  const filtered = mergeFilterableCatalog(allScales);
  assert.equal(filtered.some((scale) => scale.id === REGULA20_ID), false);
  const previous = legacyComposition(allScales.filter((scale) => scale.id !== REGULA20_ID));
  assert.deepEqual(filtered, previous, "sem alterações silenciosas na composição anterior");
});

test("pré-consulta explícita: um formulário; nunca completa posições redundantes", () => {
  const input = { idadeMeses: 96, queixa: "irritabilidade-funcional", respondente: "pais" as const, contexto: "primeira-consulta" as const };
  const result = recommendPreConsultaScales(input);
  assert.equal(result.length, 1);
  assert.equal(result[0].label, "Monitor autoral");
  assert.equal(result[0].scale?.id, REGULA20_ID);
  for (const idadeMeses of [0, 35, 216, NaN]) assert.equal(recommendPreConsultaScales({ ...input, idadeMeses })[0].scale, undefined);
  assert.equal(recommendPreConsultaScales({ ...input, respondente: "adolescente" })[0].scale, undefined);
  assert.equal(recommendPreConsultaScales({ ...input, respondente: "secretaria" })[0].scale?.id, REGULA20_ID);
  for (const queixa of ["tea", "tdah", "sono", "comportamento", "efeitos"]) assert.equal(recommendPreConsultaScales({ ...input, queixa }).some((item) => item.scale?.id === REGULA20_ID), false);
});
