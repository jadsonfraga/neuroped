import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { emptyEvidence, snapshotObservation, evidenceSchema, evidenceReferencesValid, validMoment, canAddMedicalReview, momentChanged, reviewChanged, evidenceText, MAX_VIDEO_BYTES, type EvidenceBundle } from "../../client/src/features/obs10/evidence";
import { emptyPilot, pilotMetrics, elapsedWork, pilotSchema } from "../../client/src/features/obs10/pilot";
import { parseRecordJSON } from "../../client/src/features/obs10/importRecord";
import { type SessionRecord, emptyObservation, amendObservation } from "../../client/src/features/obs10/session";
const o = { ...emptyObservation("manual-1", 2, 120), task: "Comando sintético", response: "Uma ação executada.", outcome: "E" as const, quality: "Nítido" as const };
const record: SessionRecord = { version: "1.3.0", sessionId: "SINTETICO-13", context: { code: "CODIGO-NAO-EXPORTAR", chronologicalMonths: 84, correctedMonths: null, bandId: "y06", schooling: "", language: "", adaptations: "", conditions: "", familyReport: "RELATO-NAO-EXPORTAR", proneAllowed: false }, observations: [o], durationSeconds: 180, endReason: "Encerrado no teste", encodingSecond: null, recallSecond: null, recording: "Fictício" };
const sha = Array.from(new Uint8Array(await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode("synthetic clip"))), (b) => b.toString(16).padStart(2,"0")).join("");
const e: EvidenceBundle = { ...emptyEvidence(), clips: [{ id: "clip-1", sessionId: record.sessionId!, label: "Clipe 1", sha256: sha, bytes: 500, mime: "video/webm", durationSeconds: 20, associatedAt: "2026-09-17T12:00:00.000Z" }], moments: [{ id: "mark-1", observationId: o.id, clipId: "clip-1", startSecond: 1, endSecond: 4, sourceSnapshot: snapshotObservation(o), createdAt: "2026-09-17T12:00:01.000Z", method: "player-position" }], reviews: [{ id: "review-1", momentId: "mark-1", sourceSnapshot: snapshotObservation(o), decision: "Trecho insuficiente", comment: "Comentário fictício.", createdAt: "2026-09-17T12:00:02.000Z", role: "professional", origin: "local-session" }] };
assert.equal(evidenceSchema.safeParse(e).success, true);
assert.equal(evidenceReferencesValid(e, record.sessionId, record.observations), true);
assert.equal(evidenceReferencesValid(e, "OUTRA", record.observations), false);
assert.equal(evidenceReferencesValid(e, undefined, record.observations), false);
assert.equal(evidenceReferencesValid(e, record.sessionId, []), false);
assert.equal(evidenceReferencesValid({ ...e, clips: [...e.clips, e.clips[0]] }, record.sessionId, [o]), false);
assert.equal(evidenceReferencesValid({ ...e, moments: [...e.moments, e.moments[0]] }, record.sessionId, [o]), false);
assert.equal(evidenceReferencesValid({ ...e, reviews: [{ ...e.reviews[0], momentId: "missing" }] }, record.sessionId, [o]), false);
for (const [s,f,d] of [[2,1,20],[-1,2,20],[0,21,20],[0,0,20],[NaN,4,20],[1,Infinity,20],[0,3601,null]]) assert.equal(validMoment(s as number,f as number,d),false);
assert.equal(validMoment(0,10,null),true); assert.equal(validMoment(1,20,20),true);
assert.equal(evidenceSchema.safeParse({ ...e, clips: [{ ...e.clips[0], bytes: MAX_VIDEO_BYTES+1 }] }).success,false);
assert.equal(evidenceSchema.safeParse({ ...e, url: "https://untrusted.invalid/video" }).success,false);
for (const role of ["reader","operator",undefined,"unknown"]) assert.equal(canAddMedicalReview("remote",role),false);
for (const role of ["professional","admin"]) { assert.equal(canAddMedicalReview("remote",role),true); assert.equal(canAddMedicalReview("local",role),false); }
const changed = amendObservation(o,{response:"Retificação após rever."},true);
assert.equal(momentChanged(e.moments[0],[o]),false); assert.equal(momentChanged(e.moments[0],[changed]),true);
assert.equal(reviewChanged(e.reviews[0],e,[changed]),true); assert.equal(reviewChanged(e.reviews[0],e,[o]),false);
record.evidence=e; record.pilot=emptyPilot();
const imported=parseRecordJSON(JSON.stringify(record)); assert.equal(imported.ok,true);
if(imported.ok) { assert.equal(imported.record.evidence?.reviews[0].origin,"imported-unverified"); assert.equal(imported.record.handoff?.declaredAt,null); assert.equal(imported.record.evidence?.clips[0].sha256,sha); assert.equal(imported.record.pilot?.source,"imported-unverified"); }
for(const mutate of [
 (r: SessionRecord)=>r.evidence!.clips[0].sessionId="WRONG",
 (r: SessionRecord)=>r.evidence!.moments[0].observationId="WRONG",
 (r: SessionRecord)=>r.evidence!.moments[0].endSecond=22,
 (r: SessionRecord)=>r.evidence!.reviews[0].momentId="WRONG",
]) { const copy=structuredClone(record); mutate(copy); assert.equal(parseRecordJSON(JSON.stringify(copy)).ok,false); }
assert.equal(parseRecordJSON(JSON.stringify({...record,video:"data:video/webm;base64,AA"})).ok,false);
for (const version of ["1.0.0","1.1.0","1.2.0"]) assert.equal(parseRecordJSON(JSON.stringify({...record,version,evidence:undefined,pilot:undefined})).ok,true);
const metrics=pilotMetrics(record); assert.equal(metrics.workSecondsRecorded["Preparação"],null);
record.pilot.logs=[{phase:"Preparação",seconds:22,endedBy:"início da coleta"},{phase:"Revisão médica",seconds:31,endedBy:"manual"}];
assert.equal(pilotMetrics(record).workSecondsRecorded["Preparação"],22);
assert.equal(elapsedWork(1000,0),0);assert.equal(elapsedWork(0,100000000),7200);
assert.equal(pilotSchema.safeParse({...emptyPilot(), logs:[{phase:"Other",seconds:2,endedBy:"manual"}]}).success,false);
const mtext=JSON.stringify(pilotMetrics(record));
for (const sensitive of [record.context.code,record.sessionId!,record.context.familyReport,o.response,o.task,e.reviews[0].comment,sha]) assert.equal(mtext.includes(sensitive),false,`metrics exclude ${sensitive}`);
assert.match(evidenceText(record),/sem assinatura/); assert.match(evidenceText({...record,observations:[changed]}),/RECONFERIR/);
assert.equal(record.observations[0].applicationSecond,120);
for (const file of ["EvidencePanel.tsx","PilotPanel.tsx","AudioPreflight.tsx","useWorkClock.ts"]) { const code=readFileSync(`client/src/features/obs10/${file}`,"utf8"); assert.equal(/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(code),false,`no upload ${file}`); assert.equal(/\b(?:localStorage|sessionStorage|indexedDB)\s*\./.test(code),false,`no hidden persistence ${file}`); }
assert.ok(readFileSync("client/src/features/obs10/EvidencePanel.tsx","utf8").includes("crypto.subtle.digest"));
console.log("OBS-10 evidence/pilot: bounded references, local file identity, role gates, stale opinions, legacy roundtrip and minimal metrics passed.");
