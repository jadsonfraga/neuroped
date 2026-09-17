import assert from "node:assert/strict";
import { parseRecordJSON, MAX_RECORD_BYTES } from "../../client/src/features/obs10/importRecord";
import { amendObservation, emptyHandoff, emptyObservation, makeReport, observationIssues, type SessionRecord } from "../../client/src/features/obs10/session";
import { reviewSession, reviewText } from "../../client/src/features/obs10/review";
import { AGE_BANDS } from "../../client/src/features/obs10/protocol";
import { PRACTICAL_TASKS } from "../../client/src/features/obs10/practical";

const base: SessionRecord = {
  version: "1.2.0", sessionId: "OBS12-SYNTHETIC-ONE",
  context: { code: "SINTETICO", chronologicalMonths: 84, correctedMonths: null, bandId: "y06", schooling: "2 ano ficticio", language: "Portugues", adaptations: "", conditions: "", familyReport: "Relato de teste", proneAllowed: false },
  observations: [{ ...emptyObservation("manual-1", 2, 150), task: "Comando", response: "Concluiu apos repetir.", outcome: "V", assistance: "Uma repeticao verbal", quality: "Parcial", clip: "A", videoTime: "02:30", recordedAfterEnd: false }],
  durationSeconds: 500, endReason: "Encerramento de teste", encodingSecond: 140, recallSecond: 450,
  recording: "Video disponivel no dispositivo anterior, declaracao nao verificada",
  handoff: { recordsReviewed: true, mediaReviewed: true, filesChecked: true, declaredAt: "2026-09-17T12:00:00.000Z" },
};
let assertions = 0;
function rejected(record: unknown) { assertions++; assert.equal(parseRecordJSON(JSON.stringify(record)).ok, false); }
for (const version of ["1.0.0", "1.1.0", "1.2.0"]) {
  const imported = parseRecordJSON(JSON.stringify({ ...base, version }));
  assert.ok(imported.ok); if (!imported.ok) throw new Error("Unexpected failed import");
  assert.equal(imported.record.version, version);
  assert.deepEqual(imported.record.handoff, emptyHandoff());
  assert.match(imported.record.recording, /não incluído no JSON/);
  assert.equal(imported.record.sourceRecording, base.recording);
  assert.equal(imported.record.importedForReview, true);
  assert.equal(imported.record.observations[0].applicationSecond, 150);
  const twice = parseRecordJSON(JSON.stringify(imported.record));
  assert.ok(twice.ok); if (twice.ok) assert.equal(twice.record.sourceRecording, base.recording);
  assertions += 9;
}
rejected({ ...base, version: "9.0.0" });
rejected({ ...base, context: { ...base.context, chronologicalMonths: 216 } });
rejected({ ...base, context: { ...base.context, chronologicalMonths: 18, correctedMonths: 20, bandId: "m18" } });
rejected({ ...base, context: { ...base.context, correctedMonths: 6 } });
rejected({ ...base, context: { ...base.context, bandId: "y12" } });
rejected({ ...base, durationSeconds: 601 });
rejected({ ...base, recallSecond: 100 });
rejected({ ...base, encodingSecond: null });
rejected({ ...base, encodingSecond: 550 });
rejected({ ...base, observations: [base.observations[0], base.observations[0]] });
rejected({ ...base, observations: [{ ...base.observations[0], id: "guided-y12-0-0" }] });
rejected({ ...base, observations: [{ ...base.observations[0], id: "guided-y06-0-0", phase: 5 }] });
rejected({ ...base, observations: [{ ...base.observations[0], outcome: "NORMAL" }] });
rejected({ ...base, observations: [{ ...base.observations[0], applicationSecond: 501 }] });
rejected({ ...base, observations: [{ ...base.observations[0], response: "a".repeat(2001) }] });
rejected({ ...base, observations: Array.from({ length: 201 }, (_, i) => ({ ...base.observations[0], id: `many-${i}` })) });
rejected({ ...base, videoURL: "https://invalid.example/unsafe" });
rejected({ ...base, context: { ...base.context, missingMaterials: ["unknown material"] } });
rejected(JSON.parse(JSON.stringify(base).slice(0, -1) + ',"__proto__":{"polluted":true}}'));
assert.equal(({} as Record<string, unknown>).polluted, undefined);
assert.equal(parseRecordJSON("{".repeat(400)).ok, false);
assert.equal(parseRecordJSON(" ".repeat(MAX_RECORD_BYTES + 1)).ok, false);
assert.ok(parseRecordJSON("\uFEFF" + JSON.stringify(base)).ok);
// Every current guided task can be exchanged without changing ID, phase or model provenance.
for (const band of AGE_BANDS) for (const task of PRACTICAL_TASKS[band.id]) {
  const item = { ...base, context: { ...base.context, chronologicalMonths: band.min, bandId: band.id },
    encodingSecond: null, recallSecond: null,
    observations: [{ ...base.observations[0], id: `guided-${task.id}`, phase: task.phase, modelInInstruction: false }] };
  const result = parseRecordJSON(JSON.stringify(item)); assert.ok(result.ok, task.id);
  if (result.ok) assert.equal(result.record.observations[0].modelInInstruction, Boolean(task.model));
  assertions += 2;
}
const original = base.observations[0];
const amended = amendObservation(original, { response: "Complementado", id: "wrong", applicationSecond: 600, recordedAfterEnd: true }, true);
assert.equal(amended.id, original.id);
assert.equal(amended.applicationSecond, 150);
assert.equal(amended.recordedAfterEnd, false);
assert.equal(amended.editedAfterEnd, true);
assert.match(makeReport({ ...base, observations: [amended] }), /Registro iniciado aos 02:30/);
assert.match(makeReport({ ...base, observations: [amended] }), /Descrição complementada/);
assert.deepEqual(observationIssues(original), []);
assert.ok(observationIssues({ ...original, assistance: "" }).length);
assert.ok(observationIssues({ ...original, videoTime: "02:79" }).length);
assert.ok(observationIssues({ ...original, clip: "" }).length);
assert.ok(observationIssues({ ...original, quality: "" }).length);
assert.deepEqual(observationIssues({ ...original, outcome: "NA", response: "Nao aplicado", quality: "", clip: "", videoTime: "", assistance: "Sem material" }), []);
const review = reviewSession(base);
assert.equal(review.blocks.length, 6);
assert.equal(review.blocks[2].freeRecords, 1);
assert.equal(review.warnings.length, 0);
assert.match(reviewText(base), /Sem marcação guiada/);
assert.match(reviewText(base), /NÃO É PONTUAÇÃO CLÍNICA/);
const prone = PRACTICAL_TASKS.m03.find((task) => task.prone)!;
assert.ok(reviewSession({ ...base, context: { ...base.context, chronologicalMonths: 4, bandId: "m03" }, observations: [{ ...original, id: `guided-${prone.id}`, phase: prone.phase }] }).warnings.some((w) => w.message.includes("prono")));
const model = PRACTICAL_TASKS.y06.find((task) => task.model)!;
const pending = parseRecordJSON(JSON.stringify({ ...base, observations: [{ ...original, id: `guided-${model.id}`, phase: model.phase, response: "", quality: "" }] }));
assert.ok(pending.ok, "partial records remain recoverable; import is not clinical approval");
assert.match(makeReport(base), /não autenticado/);
assert.match(makeReport(base), /Não comprova recebimento/);
console.log(`OBS-10 v1.2: ${assertions + 25} review/import checks; all 145 guided IDs roundtrip; no restored camera or inherited acceptance.`);
