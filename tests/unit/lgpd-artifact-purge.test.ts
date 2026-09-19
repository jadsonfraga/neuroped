/**
 * lgpd-artifact-purge.test.ts — a eliminação LGPD precisa alcançar o storage.
 *
 * O purge de D1 apagava o prontuário e deixava intacto o ciphertext que uma
 * exportação anterior gravou no bucket privado. Este teste exercita o purge de
 * artefatos REAL contra o schema REAL (db/schema.d1.sql + todas as migrações),
 * com dois tenants sintéticos: RED, alvo, e BLUE, que jamais pode ser tocado.
 *
 * Nenhum dado clínico real: todo payload é 'cipher-sintetico'.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";
import { purgeExportArtifacts } from "../../functions/api/live/governance/_artifactPurge";
import type { PrivateArtifactStore } from "../../functions/api/live/governance/_worker-executor";

let assertions = 0;
const check = (value: unknown, message: string) => {
  assert.ok(value, message);
  assertions++;
};

class D1StatementMock {
  constructor(
    private readonly db: Database.Database,
    private readonly sql: string,
    private readonly values: unknown[] = [],
  ) {}
  bind(...values: unknown[]) {
    return new D1StatementMock(this.db, this.sql, values);
  }
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

class D1DatabaseMock {
  constructor(private readonly db: Database.Database) {}
  prepare(sql: string) {
    return new D1StatementMock(this.db, sql);
  }
}

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(readFileSync("db/schema.d1.sql", "utf8"));
for (const file of readdirSync("db/migrations").sort()) {
  try {
    sqlite.exec(readFileSync(`db/migrations/${file}`, "utf8"));
  } catch (error) {
    assert.match((error as Error).message, /duplicate column name/, `migração ${file}: ${(error as Error).message}`);
  }
}
const db = new D1DatabaseMock(sqlite) as unknown as D1Database;

const ACTOR = "user-actor-synthetic";
const RED = "clinic-red-synthetic";
const BLUE = "clinic-blue-synthetic";
const RED_PATIENT = "patient-red-synthetic";
const RED_PATIENT_2 = "patient-red-2-synthetic";
const BLUE_PATIENT = "patient-blue-synthetic";

sqlite.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'admin')`)
  .run(ACTOR, "Ator Sintético", "ator@example.test");

for (const [clinicId, slug] of [[RED, "red"], [BLUE, "blue"]]) {
  sqlite
    .prepare(
      `INSERT INTO clinics (id, slug, name, timezone, status, created_by_user_id)
       VALUES (?, ?, ?, 'America/Recife', 'active', ?)`,
    )
    .run(clinicId, slug, `Clínica ${slug}`, ACTOR);
}
for (const [clinicId, patientId] of [[RED, RED_PATIENT], [RED, RED_PATIENT_2], [BLUE, BLUE_PATIENT]]) {
  sqlite
    .prepare(
      `INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted)
       VALUES (?, ?, ?, 'cipher-sintetico')`,
    )
    .run(patientId, clinicId, ACTOR);
}

/** Exportação concluída com artefato: requisição + job do worker apontando para a chave. */
function exportComArtefato(requestId: string, clinicId: string, patientId: string | null, key: string) {
  sqlite
    .prepare(
      `INSERT INTO live_export_requests
         (id, clinic_id, requested_by_user_id, patient_id, scope, status, artifact_key)
       VALUES (?, ?, ?, ?, ?, 'processing', ?)`,
    )
    .run(requestId, clinicId, ACTOR, patientId, patientId ? "patient" : "clinic", key);
  sqlite
    .prepare(
      `INSERT INTO live_lgpd_worker_jobs
         (id, request_type, request_id, clinic_id, status, worker_run_id,
          artifact_key, artifact_digest_sha256, artifact_byte_length)
       VALUES (?, 'export', ?, ?, 'completed', ?, ?, ?, 64)`,
    )
    .run(`job-${requestId}`, requestId, clinicId, `run-${requestId}`, key, "a".repeat(64));
}

exportComArtefato("req-red-1", RED, RED_PATIENT, "private/export/red-1.enc");
exportComArtefato("req-red-2", RED, RED_PATIENT_2, "private/export/red-2.enc");
exportComArtefato("req-blue-1", BLUE, BLUE_PATIENT, "private/export/blue-1.enc");

function storeFake(seed: string[]) {
  const objects = new Map(seed.map((key) => [key, new Uint8Array([1, 2, 3])]));
  const store: PrivateArtifactStore & { objects: Map<string, Uint8Array> } = {
    objects,
    async put(key, value) {
      objects.set(key, value);
    },
    async get(key) {
      return objects.get(key) ?? null;
    },
    async delete(key) {
      objects.delete(key);
    },
  };
  return store;
}

const TODAS = ["private/export/red-1.enc", "private/export/red-2.enc", "private/export/blue-1.enc"];

// 1. Escopo de paciente apaga só o artefato daquele titular.
{
  const store = storeFake(TODAS);
  const result = await purgeExportArtifacts({ db, store, scope: "patient", clinicId: RED, patientId: RED_PATIENT });
  check(result.ok && result.outcome.keysFound === 1 && result.outcome.keysDeleted === 1, "paciente: uma chave encontrada e apagada");
  check(!store.objects.has("private/export/red-1.enc"), "o artefato do titular sai do bucket");
  check(store.objects.has("private/export/red-2.enc"), "o outro paciente da mesma clínica é preservado");
  check(store.objects.has("private/export/blue-1.enc"), "outra clínica jamais é tocada");
}

// 2. Escopo de clínica apaga todos os artefatos da clínica e nenhum de outra.
{
  const store = storeFake(TODAS);
  const result = await purgeExportArtifacts({ db, store, scope: "clinic", clinicId: RED });
  check(result.ok && result.outcome.keysDeleted === 2, "clínica: as duas chaves de RED apagadas");
  check(store.objects.has("private/export/blue-1.enc"), "BLUE permanece intacta no escopo de clínica");
}

// 3. Nada a apagar é sucesso mesmo sem bucket: quem nunca exportou não fica
//    impedido de eliminar por causa de um binding ausente.
{
  const semExport = await purgeExportArtifacts({ db, store: null, scope: "patient", clinicId: RED, patientId: "patient-inexistente" });
  check(semExport.ok && semExport.outcome.keysFound === 0, "sem artefato registrado, a eliminação segue sem bucket");
}

// 4. Havendo artefato registrado e nenhum bucket, recusa: declarar eliminado o
//    que não se alcança seria o falso `completed` que o resto do fluxo impede.
{
  const result = await purgeExportArtifacts({ db, store: null, scope: "patient", clinicId: RED, patientId: RED_PATIENT });
  check(!result.ok && result.failure === "EXPORT_ARTIFACT_STORE_REQUIRED", "artefato sem bucket recusa a eliminação");
}

// 5. Delete que lança não vira sucesso.
{
  const store = storeFake(TODAS);
  store.delete = async () => {
    throw new Error("r2 indisponível");
  };
  const result = await purgeExportArtifacts({ db, store, scope: "patient", clinicId: RED, patientId: RED_PATIENT });
  check(!result.ok && result.failure === "EXPORT_ARTIFACT_DELETE_FAILED", "falha do storage não é eliminação");
}

// 6. Delete silenciosamente ineficaz é detectado pelo readback. Este é o ponto:
//    "não deu erro" nunca é prova de ausência.
{
  const store = storeFake(TODAS);
  store.delete = async () => {};
  const result = await purgeExportArtifacts({ db, store, scope: "patient", clinicId: RED, patientId: RED_PATIENT });
  check(!result.ok && result.failure === "EXPORT_ARTIFACT_STILL_PRESENT", "objeto que sobrevive ao delete reprova a eliminação");
}

// 7. Isolamento por tenant no predicado: pedir o paciente de BLUE informando a
//    clínica RED não alcança nada.
{
  const store = storeFake(TODAS);
  const result = await purgeExportArtifacts({ db, store, scope: "patient", clinicId: RED, patientId: BLUE_PATIENT });
  check(result.ok && result.outcome.keysFound === 0, "paciente de outra clínica não é alcançável pelo tenant errado");
  check(store.objects.has("private/export/blue-1.enc"), "e o artefato dela permanece");
}

// 8. A ordem importa: o purge de D1 solta o patient_id das tabelas de
//    governança, então o artefato precisa cair antes.
{
  const runDeletion = readFileSync("functions/api/live/governance/run-deletion.ts", "utf8");
  check(
    runDeletion.indexOf("purgeExportArtifacts") < runDeletion.indexOf("executeTenantScopedPurge({"),
    "artefato é eliminado antes do purge de D1",
  );
  check(
    runDeletion.includes("await failLgpdJob(db, claim, artifactPurge.failure)"),
    "falha de artefato marca o job como falho, sem concluir",
  );
  const purgeCore = readFileSync("functions/api/live/governance/_purge.ts", "utf8");
  check(
    !/artifactStore|R2Bucket/.test(purgeCore),
    "o purge de D1 permanece sem acoplamento a storage",
  );
}

console.log(`LGPD — eliminação de artefatos no storage: ${assertions} asserções passaram.`);
