import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AGE_BANDS, APPLICATION_RULES, OBS10_VERSION, OUTCOMES, PHASES } from "../../client/src/features/obs10/protocol";
import { KITS, MATERIALS, PRACTICAL_TASKS } from "../../client/src/features/obs10/practical";
import { NOT_EXAMINED, OUTCOME_PROSE, ageText, makeDossier, makeScript } from "../../client/src/features/obs10/dossier";
import { emptyEvidence } from "../../client/src/features/obs10/evidence";
import { emptyObservation, exportFilename, type SessionRecord } from "../../client/src/features/obs10/session";
import { parseRecordJSON } from "../../client/src/features/obs10/importRecord";
import { JOURNEY, journeyStage } from "../../client/src/features/obs10/Journey";

let assertions = 0;
const check = (value: unknown, message: string) => { assert.ok(value, message); assertions++; };
const empty = (bandId: string, months: number): SessionRecord => ({
  version: OBS10_VERSION, sessionId: "SINTETICO-DOSSIE", context: { code: "SINT-01", chronologicalMonths: months, correctedMonths: null, bandId, schooling: "", language: "", adaptations: "", conditions: "", familyReport: "", proneAllowed: false },
  observations: [], durationSeconds: 600, endReason: "Limite", encodingSecond: null, recallSecond: null, recording: "Sem captação no teste",
});

check(ageText(0) === "0 meses" && ageText(1) === "1 mês" && ageText(12) === "1 ano" && ageText(38) === "3 anos e 2 meses", "age wording");

// Every sheet: the script and the empty dossier carry every proposal, and never a fabricated observation.
for (const band of AGE_BANDS) {
  const script = makeScript(band.id, { months: band.min });
  const dossier = makeDossier(empty(band.id, band.min));
  for (const task of PRACTICAL_TASKS[band.id]) {
    check(script.includes(task.title) && script.includes(task.say) && script.includes(task.record), `${band.id}: script carries ${task.id}`);
    for (const step of task.steps) check(script.includes(step), `${band.id}: script step ${task.id}`);
    check(dossier.includes(`**Proposta:** ${task.title}.`), `${band.id}: dossier lists ${task.id}`);
  }
  for (const { id } of KITS[band.id]) check(script.includes(MATERIALS[id].label) && script.includes(MATERIALS[id].substitute), `${band.id}: kit in script`);
  for (const phase of PHASES) check(script.includes(phase.title.toUpperCase()) && script.includes(phase.camera) && dossier.includes(phase.title), `${band.id}: blocks in both`);
  for (const rule of APPLICATION_RULES) check(script.includes(rule), `${band.id}: rules in script`);
  check(script.includes(band.reference) && script.includes(band.caution) && dossier.includes(band.reference), `${band.id}: reference carried`);
  check(!Object.values(OUTCOME_PROSE).some((prose) => dossier.includes(prose)), `${band.id}: empty record fabricates no behaviour`);
  check((dossier.match(/Sem observação registrada para esta proposta/g) ?? []).length === PRACTICAL_TASKS[band.id].length, `${band.id}: each unmarked proposal is explicit`);
  check(dossier.includes(NOT_EXAMINED) && dossier.includes("lei PRÉ") && dossier.includes("Sem diagnóstico"), `${band.id}: limits and writing rules`);
  check(!/Fachetária/.test(dossier + script), `${band.id}: consistent label`);
  if (band.min < 9) check(makeScript(band.id).includes("Prono NÃO autorizado") && makeScript(band.id, { proneAllowed: true }).includes("Prono autorizado"), `${band.id}: prone authorization stated`);
}
check(makeScript("nope") === "", "unknown sheet yields nothing");
check(makeScript("m24", { months: 26 }).includes("OMITIR NESTA IDADE") && !makeScript("m24", { months: 31 }).includes("OMITIR NESTA IDADE"), "age-dependent omission printed only when it applies");

// A filled record: literal description first, category as prose, sources separated, gaps explicit.
const y06 = PRACTICAL_TASKS.y06;
const guided = (task: (typeof y06)[number], outcome: SessionRecord["observations"][number]["outcome"], extra: Partial<SessionRecord["observations"][number]> = {}) =>
  ({ ...emptyObservation(`guided-${task.id}`, task.phase, 60 + task.phase * 60), task: task.title, outcome, modelInInstruction: Boolean(task.model), ...extra });
const encode = y06.find((t) => t.title === "Apresente as três palavras")!;
const hands = y06.find((t) => t.title === "Observe os movimentos das mãos")!;
const command = y06.find((t) => t.title === "Dê uma instrução em etapas")!;
const filled: SessionRecord = {
  ...empty("y06", 86), durationSeconds: 430, endReason: "Encerramento antecipado pela aplicadora; conferir tarefas não realizadas.",
  context: { ...empty("y06", 86).context, schooling: "2º ano, ensino de teste", language: "Português", conditions: "Dormiu pouco, relatado pela mãe", familyReport: "RELATO-FAMILIAR-SINTETICO", missingMaterials: [MATERIALS.path.label] },
  observations: [
    guided(encode, "V", { response: "Repetiu casa, gato e pão na segunda apresentação.", assistance: "Uma repetição verbal", quality: "Nítido", clip: "A", videoTime: "01:20" }),
    guided(hands, "E", { response: "Tocou os dedos em sequência com a direita; pulou o anelar com a esquerda.", quality: "Parcial" }),
    guided(command, "NA", { response: "Tarefa não aplicada.", assistance: "Sem tempo no bloco" }),
    { ...emptyObservation("manual-1", 1, 40), task: "Conversa inicial", response: "Falou do jogo preferido; olhou para a mãe antes de responder.", outcome: "R", assistance: "", quality: "", recordedAfterEnd: true },
  ],
  encodingSecond: 140, recallSecond: 400,
  evidence: { ...emptyEvidence(), clips: [{ id: "c1", sessionId: "SINTETICO-DOSSIE", label: "Clipe 1", sha256: "a".repeat(64), bytes: 10, mime: "video/webm", durationSeconds: 60, associatedAt: "2026-09-17T12:00:00.000Z" }],
    moments: [{ id: "m1", clipId: "c1", observationId: `guided-${encode.id}`, startSecond: 1, endSecond: 4, sourceSnapshot: "x", createdAt: "2026-09-17T12:00:00.000Z", method: "player-position" }],
    reviews: [{ id: "r1", momentId: "m1", decision: "Concordante com o registro", comment: "COMENTARIO-PROFISSIONAL-SINTETICO", sourceSnapshot: "x", createdAt: "2026-09-17T12:01:00.000Z", role: "professional", origin: "imported-unverified" }] },
};
const text = makeDossier(filled);
check(text.includes("7 anos e 2 meses (86 meses)") && text.includes("2º ano, ensino de teste"), "age and schooling anchor");
check(text.includes(OUTCOME_PROSE.V) && text.includes("«Repetiu casa, gato e pão na segunda apresentação.»"), "literal description beside the category prose");
check(text.includes(OUTCOME_PROSE.E) && text.includes("A proposta inclui demonstração"), "model-in-instruction flagged");
check(text.includes(OUTCOME_PROSE.NA) && text.includes("Sem tempo no bloco"), "non-application reason carried");
check(text.includes("**Registro livre da aplicadora:** Conversa inicial.") && text.includes(OUTCOME_PROSE.R) && text.includes("Anotação feita após o encerramento"), "free record with timing flag");
check(text.includes("Registro incompleto:"), "incomplete records stay visible");
check(text.includes("Memória: intervalo entre a apresentação das palavras e a evocação, marcado pela aplicadora: 260 segundos"), "real marked interval");
check(!makeDossier({ ...filled, encodingSecond: null }).includes("260 segundos"), "missing encoding not manufactured");
const family = text.indexOf("RELATO-FAMILIAR-SINTETICO");
check(family > text.indexOf("## 4. Relato do responsável") && family < text.indexOf("## 5."), "family report only in its own section");
check(text.indexOf("RELATO-FAMILIAR-SINTETICO") === text.lastIndexOf("RELATO-FAMILIAR-SINTETICO"), "family report not repeated as observation");
check(text.includes("Trecho 00:01.0–00:04.0 (Clipe 1)") && text.includes("importado, autoria não autenticada") && text.includes("«COMENTARIO-PROFISSIONAL-SINTETICO»"), "video moments and professional comments as distinct source");
check(!text.includes("a".repeat(64)), "hashes are noise for the writer");
check(text.includes("material declarado ausente: Trajeto livre e duas marcas"), "missing material shown on dependent proposal");
check(text.includes("- Sem observação registrada no bloco 1 (Acolher e observar): Observe antes de pedir."), "gaps listed per block");
check(text.includes("Não demonstrado, recusado ou não aplicado: Dê uma instrução em etapas (Não avaliável / não aplicado); Conversa inicial (Recusou)"), "non-findings listed as pending, in record order");
check(text.includes("Observação encerrada antes dos dez minutos: Encerramento antecipado pela aplicadora; conferir tarefas não realizadas.") && !text.includes(".."), "early end is a pending item, without doubled punctuation");
check(text.includes("Comando: «Toque o polegar nos outros dedos, uma mão de cada vez.» (demonstração faz parte da proposta)\n"), "no stray period after a quoted command");
check(text.includes("Registro reaberto de arquivo exportado") === false, "no import notice for a live session");
const reopened = parseRecordJSON(JSON.stringify({ ...filled, evidence: undefined, version: "1.4.0" }));
check(reopened.ok && makeDossier(reopened.record).includes("Registro reaberto de arquivo exportado"), "import notice when reopened; v1.4.0 accepted");
check(OUTCOMES.every((o) => OUTCOME_PROSE[o.id].length > 10), "every category has prose");
check(exportFilename("SINT-01", "md", "s1") === "OBS10-SINT-01-s1.md", "markdown export name");
check(JOURNEY.length === 4 && journeyStage("setup", false) === "setup" && journeyStage("running", false) === "running" && journeyStage("finished", false) === "review" && journeyStage("finished", true) === "deliver", "journey stages");

const page = readFileSync("client/src/pages/pre-consulta-obs10.tsx", "utf8");
const journey = readFileSync("client/src/features/obs10/Journey.tsx", "utf8");
const dossierSource = readFileSync("client/src/features/obs10/dossier.ts", "utf8");
check(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|\b(?:localStorage|sessionStorage|indexedDB)\./.test(journey + dossierSource), "dossier stays local");
check(!/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(journey), "text rendered as text");
check(page.includes("<JourneyMap") && page.includes("<Readiness items={readiness}") && page.includes("<DossierPanel"), "page wires journey, readiness and dossier");
check(page.indexOf("<JourneyMap") < page.indexOf("<PracticalMaterials") && page.indexOf("<PilotPanel") > page.indexOf('className="obs10-guide obs10-no-print"'), "journey first; optional pilot after the quick guide");
check(!/running\s*&&[^\n]*printScript|printScript[^\n]*running/.test(page), "printing never opens a window during collection");
console.log(`OBS-10 v1.4: ${assertions} dossier, script, journey and readiness assertions passed.`);
