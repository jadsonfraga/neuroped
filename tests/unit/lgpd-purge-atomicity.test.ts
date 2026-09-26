/**
 * #1001: handler e schema reais; todas as identidades e cargas são sintéticas.
 * A alteração concorrente é aplicada DEPOIS dos preflights e imediatamente
 * ANTES da transação. Nenhum provedor externo, segredo ou banco de produção.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import Database from "better-sqlite3";
import { executeTenantScopedPurge } from "../../functions/api/live/governance/_purge";
import type { LgpdWorkerClaim } from "../../functions/api/live/governance/_worker-core";

class Statement {
  constructor(
    readonly db: Database.Database,
    readonly sql: string,
    readonly values: unknown[] = [],
  ) {}
  bind(...values: unknown[]) { return new Statement(this.db, this.sql, values); }
  async first<T>() {
    return (this.db.prepare(this.sql).get(...this.values) as T | undefined) ?? null;
  }
  async all<T>() {
    return { success: true, results: this.db.prepare(this.sql).all(...this.values) as T[], meta: {} };
  }
  async run() {
    const result = this.db.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: result.changes } };
  }
}

class D1Adapter {
  beforeBatch: (() => void) | undefined;
  constructor(readonly sqlite: Database.Database) {}
  prepare(sql: string) { return new Statement(this.sqlite, sql); }
  async batch(statements: Statement[]) {
    const hook = this.beforeBatch;
    this.beforeBatch = undefined;
    hook?.();
    return this.sqlite.transaction(() => statements.map((statement) => {
      const prepared = this.sqlite.prepare(statement.sql);
      if (prepared.reader) {
        return { success: true, results: prepared.all(...statement.values), meta: { changes: 0 } };
      }
      const result = prepared.run(...statement.values);
      return { success: true, results: [], meta: { changes: result.changes } };
    }))();
  }
}

const RED = "atomicity-clinic-red";
const BLUE = "atomicity-clinic-blue";
const ACTOR = "atomicity-actor";
const RED_PATIENT = "atomicity-patient-red";
const BLUE_PATIENT = "atomicity-patient-blue";
const NOW = "2026-09-26T12:00:00.000Z";
const PAST = "2020-01-01T00:00:00.000Z";
const FUTURE = "2099-01-01T00:00:00.000Z";
const TABLES = [
  "live_assessment_responses", "live_assessments", "live_scale_responses",
  "live_scale_invitations", "live_intake_submissions", "live_intake_invitations",
  "live_document_versions", "live_documents", "live_clinical_events", "live_patients",
  "live_deletion_requests", "live_lgpd_worker_jobs",
];

function fixture(scope: "patient" | "clinic") {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const file of readdirSync("db/migrations").filter((name) => name.endsWith(".sql")).sort()) {
    try { sqlite.exec(readFileSync(`db/migrations/${file}`, "utf8")); }
    catch (error) { assert.match((error as Error).message, /duplicate column name/, `migração ${file}`); }
  }
  sqlite.prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'admin')")
    .run(ACTOR, "Ator Sintético", "atomicity@example.test");
  for (const [clinic, patient] of [[RED, RED_PATIENT], [BLUE, BLUE_PATIENT]]) {
    sqlite.prepare(`INSERT INTO clinics (id, slug, name, timezone, status, created_by_user_id)
      VALUES (?, ?, ?, 'America/Recife', 'active', ?)`)
      .run(clinic, clinic, `Clínica Sintética ${clinic}`, ACTOR);
    sqlite.prepare(`INSERT INTO tenant_lifecycle (clinic_id, status, legal_hold)
      VALUES (?, 'active', 0) ON CONFLICT(clinic_id) DO UPDATE SET status = 'active', legal_hold = 0`)
      .run(clinic);
    sqlite.prepare(`INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted)
      VALUES (?, ?, ?, 'cipher-sintetico')`).run(patient, clinic, ACTOR);
    sqlite.prepare(`INSERT INTO live_clinical_events
      (id, clinic_id, patient_id, author_user_id, event_type, occurred_at,
       provenance_kind, provenance_source, payload_encrypted)
      VALUES (?, ?, ?, ?, 'observation', ?, 'documented', 'system', 'cipher-sintetico')`)
      .run(`event-${patient}`, clinic, patient, ACTOR, NOW);
    if (scope === "patient" || clinic === BLUE) {
      sqlite.prepare(`INSERT INTO live_documents
        (id, clinic_id, patient_id, author_user_id, document_type, origin)
        VALUES (?, ?, ?, ?, 'report', 'system')`).run(`doc-${patient}`, clinic, patient, ACTOR);
      sqlite.prepare(`INSERT INTO live_document_versions
        (id, clinic_id, document_id, patient_id, author_user_id, version, content_encrypted, origin, issued_at)
        VALUES (?, ?, ?, ?, ?, 1, 'cipher-sintetico', 'system', ?)`)
        .run(`version-${patient}`, clinic, `doc-${patient}`, patient, ACTOR, NOW);
    }
  }
  if (scope === "clinic") {
    sqlite.prepare("UPDATE clinics SET status = 'suspended' WHERE id = ?").run(RED);
    sqlite.prepare(`UPDATE tenant_lifecycle SET status = 'closure_requested', requested_at = ?,
      retention_until = ? WHERE clinic_id = ?`).run(NOW, PAST, RED);
  }
  sqlite.prepare(`INSERT INTO live_deletion_requests
    (id, clinic_id, patient_id, requested_by_user_id, scope, status)
    VALUES ('atomicity-request', ?, ?, ?, ?, 'processing')`).run(RED, RED_PATIENT, ACTOR, scope);
  sqlite.prepare(`INSERT INTO live_lgpd_worker_jobs (id, request_type, request_id, clinic_id, status)
    VALUES ('lgpd:delete:atomicity-request', 'delete', 'atomicity-request', ?, 'processing')`).run(RED);
  const adapter = new D1Adapter(sqlite);
  const claim: LgpdWorkerClaim = {
    jobId: "lgpd:delete:atomicity-request", requestType: "delete", requestId: "atomicity-request",
    clinicId: RED, attempt: 1, claimedAt: NOW, leaseUntil: "2026-09-26T12:10:00.000Z",
    workerRunId: "atomicity-synthetic-run",
  };
  const snapshot = (clinic: string) => Object.fromEntries(TABLES.map((table) => [
    table, sqlite.prepare(`SELECT * FROM ${table} WHERE clinic_id = ? ORDER BY id`).all(clinic),
  ]));
  const execute = async () => {
    const failures: string[] = [];
    const completions: Array<Record<string, number>> = [];
    const result = await executeTenantScopedPurge({
      db: adapter as unknown as D1Database, claim,
      targets: { scope, clinicId: RED, patientId: scope === "patient" ? RED_PATIENT : null },
      now: NOW,
      complete: async (counts) => { completions.push(counts); return true; },
      fail: async (code) => { failures.push(code); },
    });
    return { result, failures, completions };
  };
  return { sqlite, adapter, snapshot, execute };
}

const races: Array<{ name: string; scope: "patient" | "clinic"; mutate: (db: Database.Database) => void }> = [
  { name: "legal hold depois do preflight", scope: "patient", mutate: (db) => {
    db.prepare("UPDATE tenant_lifecycle SET legal_hold = 1 WHERE clinic_id = ?").run(RED);
  } },
  { name: "retenção estendida depois do preflight", scope: "patient", mutate: (db) => {
    db.prepare("UPDATE tenant_lifecycle SET retention_until = ? WHERE clinic_id = ?").run(FUTURE, RED);
  } },
  { name: "clínica reativada antes do batch", scope: "clinic", mutate: (db) => {
    db.prepare("UPDATE clinics SET status = 'active' WHERE id = ?").run(RED);
  } },
  { name: "retenção removida antes do batch", scope: "clinic", mutate: (db) => {
    db.prepare("UPDATE tenant_lifecycle SET retention_until = NULL WHERE clinic_id = ?").run(RED);
  } },
  { name: "lifecycle removido antes do batch", scope: "clinic", mutate: (db) => {
    db.prepare("DELETE FROM tenant_lifecycle WHERE clinic_id = ?").run(RED);
  } },
  { name: "documento fora do export chega depois da contagem", scope: "clinic", mutate: (db) => {
    db.prepare(`INSERT INTO live_documents (id, clinic_id, patient_id, author_user_id, document_type, origin)
      VALUES ('atomicity-late-document', ?, ?, ?, 'report', 'system')`).run(RED, RED_PATIENT, ACTOR);
  } },
];

for (const race of races) {
  test(`recusa sem exclusão ou conclusão: ${race.name}`, async () => {
    const f = fixture(race.scope);
    try {
      const blue = f.snapshot(BLUE);
      let before = f.snapshot(RED);
      let injected = false;
      f.adapter.beforeBatch = () => {
        race.mutate(f.sqlite);
        before = f.snapshot(RED);
        injected = true;
      };
      const outcome = await f.execute();
      assert.equal(injected, true, "a corrida deve ocorrer depois de todos os preflights");
      assert.deepEqual(f.snapshot(RED), before, "todas as linhas e referências de RED devem sobreviver");
      assert.deepEqual(f.snapshot(BLUE), blue, "BLUE nunca pode ser alterada");
      assert.equal(outcome.result, null);
      assert.equal(outcome.completions.length, 0, "não declarar completed sem autorização atual");
      assert.ok(outcome.failures.length > 0, "recusa precisa de falha explícita");
    } finally { f.sqlite.close(); }
  });
}

for (const scope of ["patient", "clinic"] as const) {
  test(`controle autorizado e replay idempotente: ${scope}`, async () => {
    const f = fixture(scope);
    try {
      const blue = f.snapshot(BLUE);
      const first = await f.execute();
      assert.deepEqual(first.failures, []);
      assert.equal(first.completions.length, 1);
      assert.equal(first.result?.deletedCounts.live_patients, 1);
      assert.equal(first.result?.deletedCounts.live_clinical_events, 1);
      assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM live_patients WHERE clinic_id = ?")
        .get(RED) && (f.sqlite.prepare("SELECT COUNT(*) AS n FROM live_patients WHERE clinic_id = ?")
        .get(RED) as { n: number }).n, 0);
      assert.deepEqual(f.snapshot(BLUE), blue);
      const request = f.sqlite.prepare("SELECT patient_id FROM live_deletion_requests WHERE id = 'atomicity-request'")
        .get() as { patient_id: string | null };
      assert.equal(request.patient_id, null, "preservar request e desassociar somente após exclusão autorizada");
      const replay = await f.execute();
      assert.deepEqual(replay.failures, []);
      assert.equal(replay.completions.length, 1);
      assert.ok(Object.values(replay.result!.deletedCounts).every((count) => count === 0));
      assert.deepEqual(f.snapshot(BLUE), blue);
    } finally { f.sqlite.close(); }
  });
}

test("falha tardia de DELETE reverte filhas e referências de governança", async () => {
  const f = fixture("patient");
  try {
    const red = f.snapshot(RED);
    const blue = f.snapshot(BLUE);
    f.sqlite.exec(`CREATE TRIGGER atomicity_synthetic_abort BEFORE DELETE ON live_patients
      WHEN OLD.id = 'atomicity-patient-red'
      BEGIN SELECT RAISE(ABORT, 'synthetic-delete-failure'); END;`);
    const outcome = await f.execute();
    assert.equal(outcome.result, null);
    assert.equal(outcome.completions.length, 0);
    assert.ok(outcome.failures.length > 0);
    assert.deepEqual(f.snapshot(RED), red);
    assert.deepEqual(f.snapshot(BLUE), blue);
  } finally { f.sqlite.close(); }
});
