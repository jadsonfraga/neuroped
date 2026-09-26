import assert from "node:assert/strict";
import { queixas } from "../../client/src/data/scaleFilter.ts";
import { inferComplaintIds } from "../../client/src/lib/filterClinicalInput.ts";
import { inferSignalIds } from "../../client/src/lib/filterSignalInference.ts";
import { getOrphanFilterSignalIds, getValidFilterSignalIds } from "../../client/src/data/filterSignalState.ts";
import { popularSymptomsByQueixa } from "../../client/src/data/popularSymptoms.ts";
import { getAllSignalsForQueixa } from "../../client/src/data/signalsAndSymptoms.ts";
import { parseFilterFavorites, toggleFilterFavorite, loadFilterFavorites, clearFilterFavorites, FILTER_FAVORITES_MAX } from "../../client/src/lib/filterFavorites.ts";

// Linguagem de família → queixa (vocabulário ÚNICO com a busca). Piso: 47/47
// medido na rodada 3 (antes: 20/47). Regressão = qualquer frase perder a queixa.
const lay: Array<[string, string[]]> = [
  ["meu filho não para quieto", ["tdah"]], ["não presta atenção na escola", ["tdah", "aprendizagem"]], ["menina de 7 anos muito agitada", ["tdah"]],
  ["não olha nos olhos e não aponta", ["tea"]], ["bebê de 18 meses não responde ao nome", ["tea"]], ["alinha os brinquedos e bate as mãos", ["tea"]],
  ["demora para andar", ["atraso"]], ["ainda não senta sozinho", ["atraso"]], ["fala pouco para a idade", ["linguagem"]], ["troca as letras quando fala", ["linguagem"]], ["gagueira", ["linguagem"]],
  ["muito medo de ficar longe da mãe", ["ansiedade"]], ["dor de barriga antes da escola", ["ansiedade"]], ["choro fácil e desânimo", ["depressao"]], ["disse que quer morrer", ["suicidio"]], ["se corta", ["suicidio"]],
  ["birras intensas e bate nos colegas", ["comportamento"]], ["desafia tudo e todos", ["comportamento"]], ["explosivo e irritado", ["comportamento"]],
  ["não dorme a noite toda", ["sono"]], ["ronca e acorda cansado", ["sono"]], ["pesadelos", ["sono"]],
  ["teve uma convulsão", ["epilepsia"]], ["crise de ausência", ["epilepsia"]],
  ["xixi na cama aos 8 anos", ["enurese"]], ["escapa cocô na roupa", ["enurese"]],
  ["só come 5 alimentos", ["alimentacao"]], ["engasga com sólidos", ["alimentacao"]],
  ["dor de cabeça toda semana", ["dor"]], ["enxaqueca", ["dor"]],
  ["não gosta de barulho nem de etiqueta de roupa", ["sensorial"]], ["se incomoda com texturas", ["sensorial"]],
  ["cai muito e é desajeitado", ["motor"]], ["dificuldade de leitura e escrita", ["aprendizagem"]], ["nota baixa em matemática", ["aprendizagem"]],
  ["pisca muito e faz caretas", ["tiques"]], ["lava as mãos toda hora", ["toc"]], ["rituais antes de dormir", ["toc"]],
  ["sofreu abuso", ["trauma"]], ["paralisia cerebral espástica", ["pc"]], ["prematuro de 30 semanas", ["neonatal", "atraso"]],
  ["sem amigos na escola", ["social"]], ["não fala na escola mas fala em casa", ["social", "linguagem"]], ["usa maconha", ["substancias"]],
  ["efeito colateral da ritalina", ["efeitos"]], ["retorno para ver evolução", ["evolucao"]], ["autonomia para se vestir", ["autonomia"]],
];
let ok = 0;
const misses: string[] = [];
for (const [text, expected] of lay) {
  const got = inferComplaintIds(text, queixas);
  if (expected.some((e) => got.includes(e))) ok += 1;
  else misses.push(`${text} → [${got.join(",")}]`);
}
console.log(`[filter-lay-language] queixa inferida: ${ok}/${lay.length}`);
assert.equal(misses.length, 0, misses.join(" ; "));

// Expressão mais longa consome o trecho: "dor de barriga" não vira cefaleia.
assert.deepEqual(inferComplaintIds("dor de barriga antes da escola", queixas).includes("dor"), false);
assert.deepEqual(inferComplaintIds("dor de cabeça e dor de barriga", queixas).sort(), ["ansiedade", "dor"]);
// Contratos antigos preservados: expressão inteira, nunca substring.
for (const text of ["cuidador", "protocolo", "medicamentos", "capacidade", "risco"]) assert.deepEqual(inferComplaintIds(text, queixas), [], text);
assert.deepEqual(inferComplaintIds("social", queixas), ["social"]);
assert.deepEqual(inferComplaintIds("sono e cefaleia", queixas), ["sono", "dor"]);

// Sinais do texto: ids reais do seletor, queixa-mãe junto, negação respeitada.
const tea = inferSignalIds("não olha nos olhos e não aponta", ["tea"]);
assert.ok(tea.some((s) => s.id === "tea-nao-aponta" && s.queixaId === "tea"), JSON.stringify(tea));
assert.ok(tea.some((s) => s.id === "tea-pouco-olho"));
assert.deepEqual(inferSignalIds("demora pra andar", ["atraso"]).map((s) => s.id), ["atraso-nao-anda"], "subconjunto ('demora pra falar') sai");
assert.deepEqual(inferSignalIds("aponta para tudo que quer", ["tea"]).filter((s) => s.id === "tea-nao-aponta"), [], "rótulo negado exige 'não' no texto");
assert.deepEqual(inferSignalIds("não aponta", []), [], "sem queixa ativa, sem sinal");
assert.ok(inferSignalIds("dificuldade de focar", ["tdah"]).some((s) => s.id === "tdah-dificuldade-focar"));
assert.ok(inferSignalIds("xyz", ["tdah"]).length === 0);
assert.ok(inferSignalIds("não para quieto não espera a vez não presta atenção", ["tdah"]).length <= 4, "limite");

// Sintomas populares são sinais VÁLIDOS da própria queixa (bug corrigido na
// rodada 3: 186/190 eram descartados como órfãos ao serem marcados) e viram
// órfãos quando a queixa sai. Sinais detalhados seguem válidos.
for (const [queixaId, symptoms] of Object.entries(popularSymptomsByQueixa)) {
  const ids = symptoms.map((s) => s.id);
  assert.deepEqual(getOrphanFilterSignalIds([queixaId], ids), [], `populares de ${queixaId} não são órfãos`);
  assert.deepEqual(getOrphanFilterSignalIds([], ids), ids, `populares de ${queixaId} ficam órfãos sem a queixa`);
  for (const signal of getAllSignalsForQueixa(queixaId)) assert.ok(getValidFilterSignalIds([queixaId]).has(signal.id));
}
assert.deepEqual(getOrphanFilterSignalIds(["tea"], ["tea-nao-aponta", "tdah-nao-para-quieto"]), ["tdah-nao-para-quieto"], "só o sinal da queixa ausente é órfão");

// Favoritos: só ids, alternância, limite, entrada inválida descartada.
const mem = new Map<string, string>();
const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
assert.deepEqual(toggleFilterFavorite("snap", storage), ["snap"]);
assert.deepEqual(toggleFilterFavorite("cars", storage), ["cars", "snap"]);
assert.deepEqual(toggleFilterFavorite("snap", storage), ["cars"]);
for (let i = 0; i < 40; i += 1) toggleFilterFavorite(`x${i}`, storage);
assert.equal(loadFilterFavorites(storage).length, FILTER_FAVORITES_MAX);
assert.deepEqual(parseFilterFavorites('["ok","bad id","ok",5,"/x?y"]'), ["ok"]);
assert.deepEqual(parseFilterFavorites("{"), []);
clearFilterFavorites(storage);
assert.deepEqual(loadFilterFavorites(storage), []);
console.log("✓ linguagem de família → queixa e sinal; favoritos sem PHI");
