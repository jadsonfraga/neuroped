// Correções do diagnóstico de 14/10/2026 (Super NeuroPad): cortes congelados (golden), rótulos
// sem norma, leitura da família que não esconde mundo em alerta e aviso de poucos itens aos 2–3 anos.
import assert from "node:assert/strict";
import test from "node:test";
import {
  PHASE_ORDER,
  SUPER_NEUROPAD_VERSION,
  TODDLER_FEW_ITEMS_NOTE,
  buildGameReport,
  isJudged,
  itemsFor,
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
import { buildFamilySummary } from "../../client/src/features/super-neuropad/familyDelivery";

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

test("rótulos e textos não soam como norma populacional e não trazem corte nem nível", () => {
  const report = buildGameReport(play(8));
  assert.doesNotMatch(report, /esperado para a idade|referência interna para a idade|= esperado|= observar|= alerta/i);
  assert.match(report, /Total: 36 de 36 acertos/);
  assert.notEqual(SUPER_NEUROPAD_VERSION, "2026-09-30.1", "versão acompanha o banco de itens atual");
});

test("família: só contagem de acertos, sem leitura classificatória", () => {
  const session = play(8, (_item, phaseId) => (phaseId === "memoria" ? "erro" : "acerto"));
  const text = buildFamilySummary(session, { email: "familia@exemplo.com", phone: "" });
  assert.match(text, /30 de 36 desafios certos/);
  assert.doesNotMatch(text, /Leitura do jogo|referência interna|merece conversa/);
});

test("2–3 anos: relatório avisa que poucos itens por domínio tornam a leitura só descritiva", () => {
  for (const years of [2, 3]) assert.ok(buildGameReport(play(years)).includes(TODDLER_FEW_ITEMS_NOTE), `${years} anos`);
  assert.ok(!buildGameReport(play(8)).includes(TODDLER_FEW_ITEMS_NOTE));
});
