/**
 * Regressões das corridas do worker LGPD:
 *
 * 1. Rejeição concorrente entre o claim do job e a promoção da request não
 *    pode deixar job zumbi em 'processing' nem executar export de request
 *    rejeitada (claim é liberado como 'failed' REQUEST_STATE_CHANGED).
 * 2. Conclusão concorrente com rejeição do gestor não pode gravar o job como
 *    'completed' com evidência de artefato que o executor apaga em seguida
 *    (o batch é guardado pelo invariante "request ainda em processing").
 * 3. Ack perdido após o commit da conclusão não pode apagar o artefato que o
 *    ledger já registra como prova material (confirmCompleted preserva-o).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  claimLgpdRequest,
  completeExportJob,
  isExportJobCompletedWithEvidence,
  type LgpdWorkerClaim,
} from "../../functions/api/live/governance/_worker-core";
import {
  executeEncryptedExport,
  type PrivateArtifactStore,
} from "../../functions/api/live/governance/_worker-executor";

// ── D1 fake sobre node:sqlite (prepare/bind/first/run/batch) ────────────────
interface PreparedLike {
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
}

function makeDb(raw: DatabaseSync, hooks: { beforeSql?: (sql: string) => void } = {}) {
  const prepare = (sql: string) => ({
    bind: (...args: unknown[]): PreparedLike => ({
      async first<T>() {
        hooks.beforeSql?.(sql);
        return (raw.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
      },
      async run() {
        hooks.beforeSql?.(sql);
        const info = raw.prepare(sql).run(...(args as never[]));
        return { meta: { changes: Number(info.changes) } };
      },
    }),
  });
  return {
    prepare,
    async batch(statements: PreparedLike[]) {
      raw.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        raw.exec("COMMIT");
        return results;
      } catch (error) {
        raw.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;
}

function freshLedger(): DatabaseSync {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON;");
  raw.exec(`
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
  raw.exec(readFileSync("db/migrations/0017_lgpd_operational_worker_foundation.sql", "utf8"));
  raw.exec(`
    INSERT INTO clinics(id) VALUES ('clinic-red');
    INSERT INTO live_export_requests(id, clinic_id, status, updated_at)
      VALUES ('req-1', 'clinic-red', 'approved', CURRENT_TIMESTAMP);
  `);
  return raw;
}

function jobRow(raw: DatabaseSync) {
  return raw
    .prepare("SELECT status, failure_code, artifact_key, worker_run_id FROM live_lgpd_worker_jobs WHERE request_id='req-1'")
    .get() as { status: string; failure_code: string | null; artifact_key: string | null } | undefined;
}

// ── 1. Rejeição entre claim e promoção: claim liberado, sem zumbi ───────────
{
  const raw = freshLedger();
  const db = makeDb(raw, {
    beforeSql: (sql) => {
      // Gestor rejeita exatamente quando o worker promove a request.
      if (sql.includes("SET status = 'processing', updated_at = ?")) {
        raw.prepare("UPDATE live_export_requests SET status='rejected' WHERE id='req-1'").run();
      }
    },
  });
  const claim = await claimLgpdRequest(db, "export", "req-1", "run-1", "2026-09-01T18:00:00.000Z");
  assert.equal(claim, null, "request rejeitada durante o claim não pode ser adquirida");
  const job = jobRow(raw);
  assert.equal(job?.status, "failed", "claim liberado não pode deixar job zumbi em processing");
  assert.equal(job?.failure_code, "REQUEST_STATE_CHANGED");
}

// ── 2. Conclusão × rejeição concorrente: batch não grava prova fantasma ─────
let survivingClaim: LgpdWorkerClaim;
{
  const raw = freshLedger();
  const db = makeDb(raw);
  const claim = await claimLgpdRequest(db, "export", "req-1", "run-1", "2026-09-01T18:00:00.000Z");
  assert.ok(claim, "claim normal deve funcionar");
  survivingClaim = claim!;

  raw.prepare("UPDATE live_export_requests SET status='rejected' WHERE id='req-1'").run();
  const evidence = { artifactKey: "lgpd/v1/x.enc", digestSha256: "a".repeat(64), byteLength: 42 };
  const completed = await completeExportJob(db, claim!, evidence, "2026-09-01T18:05:00.000Z");
  assert.equal(completed, false, "request rejeitada não pode concluir");
  const job = jobRow(raw);
  assert.equal(job?.status, "processing", "job não pode ficar 'completed' com evidência fantasma");
  assert.equal(job?.artifact_key, null);
  assert.equal(
    await isExportJobCompletedWithEvidence(db, claim!, evidence),
    false,
    "confirmação não pode reconhecer conclusão que não commitou",
  );
}

// ── 3. Ack perdido após commit: artefato preservado como prova material ─────
{
  const raw = freshLedger();
  const db = makeDb(raw);
  const claim = await claimLgpdRequest(db, "export", "req-1", "run-1", "2026-09-01T18:00:00.000Z");
  assert.ok(claim);

  class MemoryStore implements PrivateArtifactStore {
    objects = new Map<string, Uint8Array>();
    deleteCount = 0;
    async put(key: string, value: Uint8Array) {
      this.objects.set(key, new Uint8Array(value));
    }
    async get(key: string) {
      const value = this.objects.get(key);
      return value ? new Uint8Array(value) : null;
    }
    async delete(key: string) {
      this.deleteCount += 1;
      this.objects.delete(key);
    }
  }
  const store = new MemoryStore();
  const env = {
    CLINICAL_DATA_KEY: "data-key-current-" + "d".repeat(48),
    CLINICAL_DATA_KEY_ID: "k1",
    CLINICAL_INDEX_KEY: "index-key-separated-" + "i".repeat(48),
  };
  const failures: string[] = [];

  const evidence = await executeEncryptedExport({
    env,
    claim: claim!,
    scope: "patient",
    data: { ok: true },
    store,
    complete: async (proof) => {
      const committed = await completeExportJob(db, claim!, proof, "2026-09-01T18:05:00.000Z");
      assert.equal(committed, true, "pré-condição: a conclusão commita de verdade");
      throw new Error("synthetic-network-blip-after-commit");
    },
    fail: async (code) => failures.push(code),
    confirmCompleted: (proof) => isExportJobCompletedWithEvidence(db, claim!, proof),
  });

  assert.ok(evidence, "ack perdido após commit deve ser tratado como sucesso");
  assert.equal(store.deleteCount, 0, "o artefato registrado no ledger não pode ser apagado");
  assert.equal(store.objects.has(evidence!.artifactKey), true);
  assert.deepEqual(failures, [], "sucesso não pode ser rebaixado a falha");
  const job = jobRow(raw);
  assert.equal(job?.status, "completed");
  assert.equal(job?.artifact_key, evidence!.artifactKey);
}

// ── 3b. confirmCompleted nega quando a conclusão realmente não commitou ─────
{
  const raw = freshLedger();
  const db = makeDb(raw);
  const claim = await claimLgpdRequest(db, "export", "req-1", "run-1", "2026-09-01T18:00:00.000Z");
  assert.ok(claim);
  raw.prepare("UPDATE live_export_requests SET status='rejected' WHERE id='req-1'").run();

  class MemoryStore implements PrivateArtifactStore {
    objects = new Map<string, Uint8Array>();
    deleteCount = 0;
    async put(key: string, value: Uint8Array) {
      this.objects.set(key, new Uint8Array(value));
    }
    async get(key: string) {
      const value = this.objects.get(key);
      return value ? new Uint8Array(value) : null;
    }
    async delete(key: string) {
      this.deleteCount += 1;
      this.objects.delete(key);
    }
  }
  const store = new MemoryStore();
  const env = {
    CLINICAL_DATA_KEY: "data-key-current-" + "d".repeat(48),
    CLINICAL_DATA_KEY_ID: "k1",
    CLINICAL_INDEX_KEY: "index-key-separated-" + "i".repeat(48),
  };
  const failures: string[] = [];

  const evidence = await executeEncryptedExport({
    env,
    claim: claim!,
    scope: "patient",
    data: { ok: true },
    store,
    complete: (proof) => completeExportJob(db, claim!, proof, "2026-09-01T18:05:00.000Z"),
    fail: async (code) => failures.push(code),
    confirmCompleted: (proof) => isExportJobCompletedWithEvidence(db, claim!, proof),
  });

  assert.equal(evidence, null);
  assert.deepEqual(failures, ["EXPORT_COMPLETION_FAILED"]);
  assert.equal(store.objects.size, 0, "falha real de conclusão deve remover o artefato");
}

void survivingClaim;
console.log("✓ worker LGPD: claim/conclusão fecham corridas sem zumbi, prova fantasma ou perda de artefato");
