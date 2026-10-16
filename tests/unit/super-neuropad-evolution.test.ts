import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { INTEGRATED_BANK, PHASE_ORDER, YEARS } from "../../client/src/features/super-neuropad/bank";
import { ANSWER_TONE, estimateBandSeconds, sessionLimitSeconds } from "../../client/src/features/super-neuropad/model";
import { RESULT_MARKER, RESULT_LEGEND } from "../../client/src/features/super-neuropad/pdf";

const snapshot: Record<string, string[]> = JSON.parse(readFileSync(new URL("../fixtures/super-neuropad-item-ids.main.json", import.meta.url), "utf8"));

test("nenhum item removido em relação ao snapshot de main (por idade)", () => {
  for (const years of YEARS) {
    const now = new Set(PHASE_ORDER.flatMap((phase) => INTEGRATED_BANK[years][phase].map((item) => `${phase}:${item.id}`)));
    for (const id of snapshot[years]) assert.ok(now.has(id), `${years} anos: item ${id} sumiu`);
  }
});

test("duração estimada continua dentro do teto por idade", () => {
  for (const years of YEARS) assert.ok(estimateBandSeconds(years).totalSeconds <= sessionLimitSeconds(years), `${years} anos`);
});

test("PDF: acerto azul, erro vermelho, sem resposta/recusa cinza, com marcador textual", () => {
  assert.deepEqual(ANSWER_TONE, { acerto: "correct", erro: "wrong", sem_resposta: "neutral", recusa: "neutral" });
  assert.equal(new Set(Object.values(RESULT_MARKER)).size, 4, "marcadores distintos para daltônicos");
  assert.deepEqual(RESULT_LEGEND.filter((line) => line.tone).map((line) => line.tone), ["correct", "wrong", "neutral"]);
  assert.match(RESULT_LEGEND[1].text, /AZUL/);
  assert.match(RESULT_LEGEND[2].text, /VERMELHO/);
});

test("cores do PDF são azul e vermelho (print-safe)", () => {
  const src = readFileSync(new URL("../../client/src/lib/documentPdf.ts", import.meta.url), "utf8");
  assert.match(src, /answerCorrect: rgb\(0\.114, 0\.306, 0\.847\)/);
  assert.match(src, /answerWrong: rgb\(0\.725, 0\.11, 0\.11\)/);
});
