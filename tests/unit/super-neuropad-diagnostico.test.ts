// Correções do diagnóstico de 14/10/2026 (Super NeuroPad): cortes congelados (golden), rótulos
// sem norma, leitura da família que não esconde mundo em alerta e aviso de poucos itens aos 2–3 anos.
import assert from "node:assert/strict";
import test from "node:test";
import {
  LEVEL_LABELS,
  PHASE_ORDER,
  SUPER_NEUROPAD_VERSION,
  TODDLER_FEW_ITEMS_NOTE,
  buildGameReport,
  isJudged,
  itemsFor,
  levelCuts,
  recordBuild,
  recordJudged,
  recordTouch,
  summarize,
  type AnswerRecord,
  type AnswerStatus,
  type GameSession,
  type Item,
  type PhaseId,
} from "../../client/src/features/super-neuropad/model";
import { buildFamilySummary, familyReading } from "../../client/src/features/super-neuropad/familyDelivery";

function record(item: Item, phaseId: PhaseId, status: AnswerStatus): AnswerRecord {
  if (item.kind === "toque") {
    const chosen = status === "acerto" ? item.options.find((o) => o.label === item.answer)! : status === "erro" ? item.options.find((o) => o.label !== item.answer)! : null;
    return recordTouch(item, phaseId, chosen, 3, false, status === "recusa");
  }
  if (isJudged(item)) return recordJudged(item, phaseId, status, 5);
  return recordBuild(item, phaseId, status === "acerto" ? [...item.target] : null, 5, false, status === "recusa");
}
function play(years: number, plan: (item: Item, phaseId: PhaseId) => AnswerStatus = () => "acerto"): GameSession {
  const answers = PHASE_ORDER.flatMap((phaseId) => itemsFor(String(years), phaseId).map((item) => record(item, phaseId, plan(item, phaseId))));
  return { version: "test", ageYears: years, bandId: String(years), characterId: "robo", startedAt: "2026-10-15T12:00:00.000Z", finishedAt: "2026-10-15T12:15:00.000Z", answers };
}

test("golden: cortes por mundo e no total congelados (mudar exige justificativa clínica)", () => {
  const golden: Record<number, [number, number, number, number]> = {
    3: [3, 2, 3, 2], 4: [3, 2, 4, 3], 5: [4, 3, 4, 3], 6: [5, 3, 5, 4],
    18: [14, 9, 15, 11], 24: [18, 12, 20, 15], 30: [23, 15, 24, 18], 36: [27, 18, 29, 22],
  };
  for (const [total, [fe, fo, te, to]] of Object.entries(golden).map(([k, v]) => [Number(k), v] as const)) {
    assert.deepEqual(levelCuts(total, "fase"), { esperado: fe, observar: fo }, `fase ${total}`);
    assert.deepEqual(levelCuts(total, "total"), { esperado: te, observar: to }, `total ${total}`);
  }
});

test("rótulos e textos não soam como norma populacional", () => {
  assert.equal(LEVEL_LABELS.esperado, "Dentro da referência interna do jogo (não normativa)");
  const report = buildGameReport(play(8));
  assert.doesNotMatch(report, /esperado para a idade/i);
  assert.match(report, /referência interna para a idade: 29 ou mais/);
  assert.notEqual(SUPER_NEUROPAD_VERSION, "2026-09-30.1", "versão acompanha o banco de itens atual");
});

test("família: total na referência com um mundo em alerta não sai só tranquilizador", () => {
  const session = play(8, (_item, phaseId) => (phaseId === "memoria" ? "erro" : "acerto"));
  const summary = summarize(session);
  assert.equal(summary.level, "esperado", "30/36 fica na referência no total");
  assert.equal(summary.phases.find((phase) => phase.phase.id === "memoria")!.level, "alerta");
  assert.match(familyReading(summary), /mas Caverna da Memória merece conversa com o médico\(a\)/);
  const text = buildFamilySummary(session, { email: "familia@exemplo.com", phone: "" });
  assert.match(text, /Leitura do jogo: no conjunto, dentro da referência interna do jogo, mas Caverna da Memória merece/);
  const perfect = summarize(play(8));
  assert.doesNotMatch(familyReading(perfect), /merece/);
});

test("2–3 anos: relatório avisa que poucos itens por domínio tornam a leitura só descritiva", () => {
  for (const years of [2, 3]) assert.ok(buildGameReport(play(years)).includes(TODDLER_FEW_ITEMS_NOTE), `${years} anos`);
  assert.ok(!buildGameReport(play(8)).includes(TODDLER_FEW_ITEMS_NOTE));
});
