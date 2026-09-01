import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decryptClinicalJson } from "../../functions/api/tenant/_crypto";
import {
  evaluateDeletionEligibility,
  executeEncryptedExport,
  LGPD_EXPORT_SCHEMA_VERSION,
  type PrivateArtifactStore,
} from "../../functions/api/live/governance/_worker-executor";
import type { LgpdWorkerClaim } from "../../functions/api/live/governance/_worker-core";

const env = {
  CLINICAL_DATA_KEY: "data-key-current-" + "d".repeat(48),
  CLINICAL_DATA_KEY_ID: "k1",
  CLINICAL_INDEX_KEY: "index-key-separated-" + "i".repeat(48),
};

const claim: LgpdWorkerClaim = {
  jobId: "lgpd:export:request-1",
  requestType: "export",
  requestId: "request-1",
  clinicId: "clinic-red",
  attempt: 1,
  claimedAt: "2026-09-01T18:00:00.000Z",
  leaseUntil: "2026-09-01T18:10:00.000Z",
  workerRunId: "run-1",
};

class MemoryStore implements PrivateArtifactStore {
  objects = new Map<string, Uint8Array>();
  putCount = 0;
  deleteCount = 0;
  failPut = false;
  tamperReadback = false;

  async put(key: string, value: Uint8Array): Promise<void> {
    this.putCount += 1;
    if (this.failPut) throw new Error("synthetic-store-put-failure");
    this.objects.set(key, new Uint8Array(value));
  }

  async get(key: string): Promise<Uint8Array | null> {
    const value = this.objects.get(key);
    if (!value) return null;
    if (!this.tamperReadback) return new Uint8Array(value);
    const copy = new Uint8Array(value);
    copy[copy.length - 1] = copy[copy.length - 1] ^ 1;
    return copy;
  }

  async delete(key: string): Promise<void> {
    this.deleteCount += 1;
    this.objects.delete(key);
  }
}

const phiSentinel = "SENTINEL-PHI-CRIANCA-TESTE";
const store = new MemoryStore();
const failures: string[] = [];
let completionEvidence: { artifactKey: string; digestSha256: string; byteLength: number } | null = null;

const evidence = await executeEncryptedExport({
  env,
  claim,
  scope: "patient",
  data: { patient: { name: phiSentinel, note: "conteúdo sintético" } },
  store,
  generatedAt: "2026-09-01T18:01:00.000Z",
  complete: async (value) => {
    completionEvidence = value;
    return true;
  },
  fail: async (code) => {
    failures.push(code);
  },
});

assert.ok(evidence, "export sintético deve concluir com storage íntegro");
assert.deepEqual(evidence, completionEvidence, "completion deve receber a evidência do objeto armazenado");
assert.equal(failures.length, 0, "caminho feliz não deve registrar failure code");
assert.match(evidence.artifactKey, /^lgpd\/v1\/[0-9a-f-]+\.enc$/i, "artifact key deve ser opaca e aleatória");
assert.equal(evidence.artifactKey.includes(claim.requestId), false, "artifact key não deve carregar request id");
assert.match(evidence.digestSha256, /^[a-f0-9]{64}$/);
assert.ok(evidence.byteLength > 0);

const stored = store.objects.get(evidence.artifactKey);
assert.ok(stored, "objeto cifrado deve existir no storage sintético");
const storedText = new TextDecoder().decode(stored);
assert.equal(storedText.includes(phiSentinel), false, "storage nunca pode receber plaintext clínico");
assert.match(storedText, /^v1\.k1\./, "artefato deve usar envelope do keyring clínico canônico");

const decrypted = await decryptClinicalJson<{
  schemaVersion: string;
  clinicId: string;
  scope: string;
  generatedAt: string;
  data: { patient: { name: string } };
}>(env, claim.clinicId, `lgpd-export:${claim.requestId}`, storedText);
assert.equal(decrypted.schemaVersion, LGPD_EXPORT_SCHEMA_VERSION);
assert.equal(decrypted.clinicId, claim.clinicId);
assert.equal(decrypted.scope, "patient");
assert.equal(decrypted.data.patient.name, phiSentinel, "readback cifrado deve preservar portabilidade sem plaintext no storage");

const failedPutStore = new MemoryStore();
failedPutStore.failPut = true;
const putFailures: string[] = [];
let putCompleted = false;
const failedPut = await executeEncryptedExport({
  env,
  claim: { ...claim, requestId: "request-put-fail", jobId: "lgpd:export:request-put-fail" },
  scope: "patient",
  data: { sentinel: phiSentinel },
  store: failedPutStore,
  complete: async () => {
    putCompleted = true;
    return true;
  },
  fail: async (code) => putFailures.push(code),
});
assert.equal(failedPut, null);
assert.equal(putCompleted, false, "falha de upload nunca pode marcar request completed");
assert.deepEqual(putFailures, ["EXPORT_STORE_PUT_FAILED"]);

const tamperedStore = new MemoryStore();
tamperedStore.tamperReadback = true;
const tamperFailures: string[] = [];
let tamperCompleted = false;
const tampered = await executeEncryptedExport({
  env,
  claim: { ...claim, requestId: "request-tamper", jobId: "lgpd:export:request-tamper" },
  scope: "clinic",
  data: { sentinel: phiSentinel },
  store: tamperedStore,
  complete: async () => {
    tamperCompleted = true;
    return true;
  },
  fail: async (code) => tamperFailures.push(code),
});
assert.equal(tampered, null);
assert.equal(tamperCompleted, false, "readback divergente não pode concluir export");
assert.deepEqual(tamperFailures, ["EXPORT_STORE_INTEGRITY_FAILED"]);
assert.equal(tamperedStore.deleteCount, 1, "objeto inconsistente deve ser removido best-effort");
assert.equal(tamperedStore.objects.size, 0);

const completionFailStore = new MemoryStore();
const completionFailures: string[] = [];
const completionFailed = await executeEncryptedExport({
  env,
  claim: { ...claim, requestId: "request-complete-fail", jobId: "lgpd:export:request-complete-fail" },
  scope: "patient",
  data: { sentinel: phiSentinel },
  store: completionFailStore,
  complete: async () => false,
  fail: async (code) => completionFailures.push(code),
});
assert.equal(completionFailed, null);
assert.deepEqual(completionFailures, ["EXPORT_COMPLETION_FAILED"]);
assert.equal(completionFailStore.objects.size, 0, "falha de persistência do completed não deve deixar artefato órfão deliberado");

assert.deepEqual(
  evaluateDeletionEligibility({
    scope: "patient",
    clinicStatus: "active",
    lifecycleStatus: "active",
    legalHold: true,
    retentionUntil: null,
    now: "2026-09-01T18:00:00.000Z",
  }),
  { allowed: false, code: "LEGAL_HOLD" },
  "legal hold deve bloquear qualquer purge",
);
assert.deepEqual(
  evaluateDeletionEligibility({
    scope: "clinic",
    clinicStatus: "active",
    lifecycleStatus: "active",
    legalHold: false,
    retentionUntil: "2026-08-31T18:00:00.000Z",
    now: "2026-09-01T18:00:00.000Z",
  }),
  { allowed: false, code: "ACTIVE_TENANT" },
  "clinic purge de tenant ativo deve falhar fechado",
);
assert.deepEqual(
  evaluateDeletionEligibility({
    scope: "clinic",
    clinicStatus: "suspended",
    lifecycleStatus: "closure_requested",
    legalHold: false,
    retentionUntil: null,
    now: "2026-09-01T18:00:00.000Z",
  }),
  { allowed: false, code: "RETENTION_NOT_MATERIALIZED" },
);
assert.deepEqual(
  evaluateDeletionEligibility({
    scope: "clinic",
    clinicStatus: "suspended",
    lifecycleStatus: "closure_requested",
    legalHold: false,
    retentionUntil: "2026-09-03T18:00:00.000Z",
    now: "2026-09-01T18:00:00.000Z",
  }),
  { allowed: false, code: "RETENTION_PENDING" },
);
assert.deepEqual(
  evaluateDeletionEligibility({
    scope: "clinic",
    clinicStatus: "suspended",
    lifecycleStatus: "closure_requested",
    legalHold: false,
    retentionUntil: "2026-08-31T18:00:00.000Z",
    now: "2026-09-01T18:00:00.000Z",
  }),
  { allowed: true, code: null },
  "tenant em encerramento + retenção vencida + sem legal hold pode avançar para executor real futuro",
);

const executorSource = readFileSync("functions/api/live/governance/_worker-executor.ts", "utf8");
assert.doesNotMatch(executorSource, /DELETE\s+FROM/i, "esta etapa não pode introduzir eliminação física");
assert.doesNotMatch(executorSource, /console\.(log|error|warn)/, "executor não deve registrar payload/PHI em console");
assert.match(executorSource, /encryptClinicalJson/, "export deve reutilizar keyring clínico canônico");
assert.doesNotMatch(executorSource, /R2Bucket|\.put\([^,]+,[^)]*JSON\.stringify/, "core não deve acoplar storage provider nem enviar JSON plaintext");

console.log("✓ executor LGPD: ciphertext-only, readback+digest, fail-closed e barreiras de purge");
