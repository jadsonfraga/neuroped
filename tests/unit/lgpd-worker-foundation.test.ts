import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  LGPD_WORKER_LEASE_MS,
  normalizeDeletedCounts,
  normalizeExportEvidence,
} from "../../functions/api/live/governance/_worker-core";

assert.equal(LGPD_WORKER_LEASE_MS, 10 * 60 * 1000, "lease padrão deve permanecer em 10 minutos");
assert.deepEqual(
  normalizeExportEvidence({
    artifactKey: " private/export/request-1.enc ",
    digestSha256: "A".repeat(64),
    byteLength: 123,
  }),
  {
    artifactKey: "private/export/request-1.enc",
    digestSha256: "a".repeat(64),
    byteLength: 123,
  },
);
assert.throws(
  () => normalizeExportEvidence({ artifactKey: "x", digestSha256: "bad", byteLength: 1 }),
  /LGPD_EXPORT_DIGEST_INVALID/,
);
assert.deepEqual(
  normalizeDeletedCounts({ deletedCounts: { live_events: 3, live_documents: 1 } }),
  { live_events: 3, live_documents: 1 },
);
assert.throws(
  () => normalizeDeletedCounts({ deletedCounts: { "patient name": 1 } }),
  /LGPD_DELETE_COUNT_KEY_INVALID/,
  "nomes livres/PHI não podem virar chaves de contagem",
);

const migration = readFileSync("db/migrations/0017_lgpd_operational_worker_foundation.sql", "utf8");
const workerCore = readFileSync("functions/api/live/governance/_worker-core.ts", "utf8");

assert.match(migration, /UNIQUE\s*\(request_type,\s*request_id\)/i, "um request só pode ter um job lógico");
assert.match(migration, /idx_live_lgpd_worker_claim/, "ledger precisa de índice de claim/lease");
assert.match(migration, /LGPD_EXPORT_PHYSICAL_PROOF_REQUIRED/, "D1 deve bloquear falso completed de export");
assert.match(migration, /LGPD_DELETE_PHYSICAL_PROOF_REQUIRED/, "D1 deve bloquear falso completed de delete");
assert.match(workerCore, /status IN \('queued','failed'\)/, "claim deve aceitar fila/falha recuperável");
assert.match(workerCore, /lease_until IS NULL OR lease_until < \?/, "claim deve permitir retomada só após lease expirado");
assert.match(workerCore, /attempts = attempts \+ 1/, "cada claim precisa incrementar tentativa");
assert.doesNotMatch(workerCore, /NEUROPED_JWT_SECRET|ADMIN_INITIAL_PASSWORD|ADMIN_EMAIL/, "worker não pode reutilizar segredo/conta humana");

// Prova SQL executável das invariantes do ledger e dos triggers de conclusão.
const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE clinics (id TEXT PRIMARY KEY);
  CREATE TABLE live_export_requests (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id),
    status TEXT NOT NULL,
    artifact_key TEXT,
    completed_at TEXT,
    updated_at TEXT
  );
  CREATE TABLE live_deletion_requests (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id),
    status TEXT NOT NULL,
    completed_at TEXT,
    updated_at TEXT
  );
`);
db.exec(migration);
db.exec(`
  INSERT INTO clinics(id) VALUES ('clinic-red'), ('clinic-blue');
  INSERT INTO live_export_requests(id, clinic_id, status, updated_at)
    VALUES ('export-1', 'clinic-red', 'processing', CURRENT_TIMESTAMP);
  INSERT INTO live_deletion_requests(id, clinic_id, status, updated_at)
    VALUES ('delete-1', 'clinic-red', 'processing', CURRENT_TIMESTAMP);
`);

assert.throws(
  () => db.exec(`INSERT INTO live_lgpd_worker_jobs
    (id, request_type, request_id, clinic_id)
    VALUES ('job-cross', 'export', 'export-1', 'clinic-blue');`),
  /LGPD_WORKER_EXPORT_REQUEST_TENANT_MISMATCH/,
  "job BLUE nunca pode apontar para request RED",
);

db.exec(`INSERT INTO live_lgpd_worker_jobs
  (id, request_type, request_id, clinic_id)
  VALUES ('job-export', 'export', 'export-1', 'clinic-red');`);
assert.throws(
  () => db.exec(`UPDATE live_export_requests SET status='completed' WHERE id='export-1';`),
  /LGPD_EXPORT_PHYSICAL_PROOF_REQUIRED/,
  "request de export não pode concluir antes da prova material",
);
assert.throws(
  () => db.exec(`UPDATE live_lgpd_worker_jobs SET status='completed' WHERE id='job-export';`),
  /LGPD_EXPORT_COMPLETION_EVIDENCE_REQUIRED/,
  "job de export não pode concluir sem artifact/digest/bytes",
);
db.exec(`
  UPDATE live_lgpd_worker_jobs
     SET status='processing', attempts=1, worker_run_id='run-1'
   WHERE id='job-export';
  UPDATE live_lgpd_worker_jobs
     SET artifact_key='private/export-1.enc',
         artifact_digest_sha256='${"a".repeat(64)}',
         artifact_byte_length=42,
         status='completed'
   WHERE id='job-export';
  UPDATE live_export_requests SET status='completed' WHERE id='export-1';
`);
assert.equal(
  (db.prepare("SELECT status FROM live_export_requests WHERE id='export-1'").get() as { status: string }).status,
  "completed",
);

db.exec(`INSERT INTO live_lgpd_worker_jobs
  (id, request_type, request_id, clinic_id)
  VALUES ('job-delete', 'delete', 'delete-1', 'clinic-red');`);
assert.throws(
  () => db.exec(`UPDATE live_lgpd_worker_jobs SET deleted_counts_json='not-json', status='completed' WHERE id='job-delete';`),
  /LGPD_DELETE_COMPLETION_EVIDENCE_REQUIRED/,
);
db.exec(`
  UPDATE live_lgpd_worker_jobs
     SET status='processing', attempts=1, worker_run_id='run-2'
   WHERE id='job-delete';
  UPDATE live_lgpd_worker_jobs
     SET deleted_counts_json='{"live_events":2}', status='completed'
   WHERE id='job-delete';
  UPDATE live_deletion_requests SET status='completed' WHERE id='delete-1';
`);
assert.equal(
  (db.prepare("SELECT status FROM live_deletion_requests WHERE id='delete-1'").get() as { status: string }).status,
  "completed",
);

console.log("✓ ledger LGPD: tenant binding, lease, idempotência e prova material fail-closed");
