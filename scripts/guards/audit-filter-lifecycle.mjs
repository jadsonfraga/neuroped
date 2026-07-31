// Contrato de ciclo de vida do seletor de sintomas do Filtro Clínico.
//
// O componente é desmontado quando a última queixa é removida. Esta auditoria
// impede que sinais selecionados sobrevivam invisíveis no estado e voltem a
// influenciar confiança ou desempates quando outra queixa for escolhida.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");
const importTs = (relativePath) =>
  import(pathToFileURL(resolve(root, relativePath)).href);

const pickerSource = read("client/src/components/PopularSymptomPicker.tsx");
const filterSource = read("client/src/pages/filtro.tsx");

assert.match(
  filterSource,
  /selectedQueixas\.length\s*>=\s*1[\s\S]{0,500}<PopularSymptomPicker/,
  "o contrato deve acompanhar o desmontar do seletor ao remover a última queixa",
);
assert.match(
  filterSource,
  /onClear=\{\(\) => \{[\s\S]{0,220}setSelectedSignalIds\(\[\]\)/,
  "o filtro precisa oferecer limpeza atômica de todos os sinais",
);

for (const requiredFragment of [
  "selectedSignalIdsRef",
  "onClearRef",
  "window.setTimeout",
  "pickerStillMounted",
  "remainsInFilter",
  'currentPath === "/filtro"',
  'currentPath === "/filtro-escalas"',
  "onClearRef.current?.()",
]) {
  assert.ok(
    pickerSource.includes(requiredFragment),
    `limpeza da última queixa perdeu o fragmento obrigatório: ${requiredFragment}`,
  );
}
assert.match(
  pickerSource,
  /document\.querySelector\([\s\S]{0,120}popular-symptom-picker/,
  "o cleanup deve distinguir desmontagem real do remount do React StrictMode",
);
assert.doesNotMatch(
  pickerSource,
  /selectedSignalIds\.(?:splice|pop|shift)|selectedSignalIds\[[^\]]+\]\s*=/,
  "props de sinais nunca podem ser mutadas diretamente",
);

const { getAllSignalsForQueixa } = await importTs(
  "client/src/data/signalsAndSymptoms.ts",
);
const { getOrphanFilterSignalIds } = await importTs(
  "client/src/data/filterSignalState.ts",
);
const { queixas } = await importTs("client/src/data/scaleFilter.ts");

const fixture = queixas
  .map((queixa) => ({
    queixaId: queixa.id,
    signals: getAllSignalsForQueixa(queixa.id),
  }))
  .find((entry) => entry.signals.length > 0);

assert.ok(fixture, "nenhum sinal disponível para testar o ciclo de vida");
const signalId = fixture.signals[0].id;
assert.deepEqual(
  getOrphanFilterSignalIds([fixture.queixaId], [signalId]),
  [],
  "sinal válido não pode ser apagado",
);
assert.deepEqual(
  getOrphanFilterSignalIds([], [signalId]),
  [signalId],
  "sinal deve virar órfão ao remover a última queixa",
);

console.log(
  "[filter-lifecycle] ✓ remoção da última queixa limpa sinais sem mutar props nem quebrar StrictMode.",
);
