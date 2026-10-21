// Super NeuroPad: o app só descreve a aplicação e as respostas. Sem cortes, níveis, rótulos interpretativos
// nem leitura "tranquilizadora" ou "alarmante" para a família (diretriz do Dr. Jadson, 16/10/2026).
import assert from "node:assert/strict";
import test from "node:test";
import {
  PHASE_ORDER,
  SUPER_NEUROPAD_VERSION,
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
import * as familyDelivery from "../../client/src/features/super-neuropad/familyDelivery";
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

test("o relatório e o resumo da família descrevem contagens e não trazem leitura do jogo", () => {
  const session = play(8, (_item, phaseId) => (phaseId === "memoria" ? "erro" : "acerto"));
  const summary = summarize(session);
  assert.equal(summary.hits, 42);
  assert.equal(summary.phases.find((phase) => phase.phase.id === "memoria")!.errors, 8);
  assert.equal("familyReading" in familyDelivery, false);
  const text = buildFamilySummary(session, { email: "familia@exemplo.com", phone: "" });
  assert.match(text, /Caverna da Memória: 0\/8/);
  assert.doesNotMatch(text, /Leitura do jogo|merece conversa|referência interna|dentro d/i);
  assert.match(buildGameReport(session), /Registro descritivo; sem classificação\. Interpretação a cargo do profissional\./);
  assert.notEqual(SUPER_NEUROPAD_VERSION, "2026-09-30.1", "versão acompanha o banco de itens atual");
});
