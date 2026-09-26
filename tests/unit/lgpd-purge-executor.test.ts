/**
 * lgpd-purge-executor.test.ts — prova RED/BLUE da eliminação LGPD física.
 *
 * A 0017 deu o ledger com claim/lease e `evaluateDeletionEligibility` decide SE
 * pode apagar; faltava o que apaga. Este teste exercita o executor REAL contra
 * o schema REAL (db/schema.d1.sql + todas as migrações, com foreign_keys
 * ligado) sobre dois tenants sintéticos — RED, alvo da eliminação, e BLUE, que
 * jamais pode ser tocado.
 *
 * Nenhum dado clínico real: todo payload aqui é a string 'cipher-sintetico'.
 *
 * Invariantes provados:
 *  1. legal hold bloqueia e não apaga nada;
 *  2. retenção ainda não vencida bloqueia;
 *  3. tenant ativo bloqueia o escopo de clínica;
 *  4. a elegibilidade é relida NO MOMENTO do purge: um legal hold aposto DEPOIS
 *     do enfileiramento bloqueia, mesmo com o job já reivindicado;
 *  5. alvo de outra clínica é recusado antes de qualquer DELETE;
 *  6. purge por paciente apaga o titular inteiro em RED e não encosta em BLUE;
 *  7. replay é idempotente: reexecutar apaga zero linhas e conclui;
 *  8. purge por clínica limpa RED por completo e não encosta em BLUE;
 *  9. a trilha que prova a eliminação sobrevive (auditoria, request, ledger);
 * 10. falha ao concluir NÃO finge sucesso — reporta PURGE_COMPLETION_FAILED.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";
import {
  PURGE_PRESERVED_TABLES,
  executeTenantScopedPurge,
} from "../../functions/api/live/governance/_purge";
import type { LgpdWorkerClaim } from "../../functions/api/live/governance/_worker-core";

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
    return (
      (this.db.prepare(this.sql).get(...this.values) as T | undefined) ?? null
    );
  }
  async all<T>() {
    return {
      success: true,
      results: this.db.prepare(this.sql).all(...this.values) as T[],
      meta: {},
    };
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
  async batch(statements: D1StatementMock[]) {
    return this.db.transaction(() =>
      statements.map((statement) => {
        const raw = statement as unknown as {
          db: Database.Database;
          sql: string;
          values: unknown[];
        };
        const result = raw.db.prepare(raw.sql).run(...raw.values);
        return { success: true, meta: { changes: result.changes } };
      }),
    )();
  }
}

// Schema REAL: base canônica + todas as migrações, na ordem. As duas primeiras
// migrações repetem colunas que a base já traz (duplicate column name) — o
// schema resultante é o mesmo, então só essas são toleradas.
const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(readFileSync("db/schema.d1.sql", "utf8"));
for (const file of readdirSync("db/migrations").sort()) {
  try {
    sqlite.exec(readFileSync(`db/migrations/${file}`, "utf8"));
  } catch (error) {
    const message = (error as Error).message;
    assert.match(
      message,
      /duplicate column name/,
      `migração ${file} não aplicou por um motivo inesperado: ${message}`,
    );
  }
}

const db = new D1DatabaseMock(sqlite) as unknown as D1Database;

const RED = "clinic-red-synthetic";
const BLUE = "clinic-blue-synthetic";
const RED_PATIENT = "patient-red-synthetic";
const RED_PATIENT_2 = "patient-red-2-synthetic";
const RED_PATIENT_3 = "patient-red-3-synthetic";
const BLUE_PATIENT = "patient-blue-synthetic";
const ACTOR = "user-actor-synthetic";
const CIPHER = "cipher-sintetico";
const PAST = "2020-01-01T00:00:00.000Z";
const FUTURE = "2099-01-01T00:00:00.000Z";
const NOW = "2026-09-05T12:00:00.000Z";

sqlite
  .prepare(
    `INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'admin')`,
  )
  .run(ACTOR, "Ator Sintético", "ator@example.test");

function criarClinica(clinicId: string, slug: string) {
  sqlite
    .prepare(
      `INSERT INTO clinics (id, slug, name, timezone, status, created_by_user_id)
       VALUES (?, ?, ?, 'America/Recife', 'active', ?)`,
    )
    .run(clinicId, slug, `Clínica ${slug}`, ACTOR);
  // O schema já cria a linha de ciclo de vida por trigger ao inserir a clínica;
  // aqui só garantimos o estado inicial explícito.
  sqlite
    .prepare(
      `INSERT INTO tenant_lifecycle (clinic_id, status, legal_hold) VALUES (?, 'active', 0)
       ON CONFLICT(clinic_id) DO UPDATE SET status = 'active', legal_hold = 0`,
    )
    .run(clinicId);
}

/** Popula TODA a cadeia clínica de um paciente — filhas incluídas. */
function criarPaciente(clinicId: string, patientId: string) {
  const p = (sql: string, ...args: unknown[]) =>
    sqlite.prepare(sql).run(...args);
  p(
    `INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted)
     VALUES (?, ?, ?, ?)`,
    patientId,
    clinicId,
    ACTOR,
    CIPHER,
  );
  p(
    `INSERT INTO live_assessments
      (id, clinic_id, patient_id, instrument_id, instrument_version, applied_by_user_id,
       applied_at, provenance_source, payload_encrypted)
     VALUES (?, ?, ?, 'mchat', 'v1', ?, ?, 'system', ?)`,
    `assess-${patientId}`,
    clinicId,
    patientId,
    ACTOR,
    NOW,
    CIPHER,
  );
  p(
    `INSERT INTO live_assessment_responses
      (id, clinic_id, patient_id, assessment_id, item_id, item_position, response_encrypted)
     VALUES (?, ?, ?, ?, 'item-1', 1, ?)`,
    `resp-${patientId}`,
    clinicId,
    patientId,
    `assess-${patientId}`,
    CIPHER,
  );
  p(
    `INSERT INTO live_clinical_events
      (id, clinic_id, patient_id, author_user_id, event_type, occurred_at,
       provenance_kind, provenance_source, payload_encrypted)
     VALUES (?, ?, ?, ?, 'observation', ?, 'documented', 'system', ?)`,
    `event-${patientId}`,
    clinicId,
    patientId,
    ACTOR,
    NOW,
    CIPHER,
  );
  p(
    `INSERT INTO live_documents
      (id, clinic_id, patient_id, author_user_id, document_type, origin)
     VALUES (?, ?, ?, ?, 'report', 'system')`,
    `doc-${patientId}`,
    clinicId,
    patientId,
    ACTOR,
  );
  p(
    `INSERT INTO live_document_versions
      (id, clinic_id, document_id, patient_id, author_user_id, version,
       content_encrypted, origin, issued_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, 'system', ?)`,
    `docver-${patientId}`,
    clinicId,
    `doc-${patientId}`,
    patientId,
    ACTOR,
    CIPHER,
    NOW,
  );
  p(
    `INSERT INTO live_intake_invitations
      (id, clinic_id, patient_id, created_by_user_id, respondent_kind, form_kind,
       form_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?, 'family', 'pre_consulta', 'form-1', ?, ?)`,
    `intake-inv-${patientId}`,
    clinicId,
    patientId,
    ACTOR,
    `hash-intake-${patientId}`,
    FUTURE,
  );
  p(
    `INSERT INTO live_intake_submissions
      (id, invitation_id, clinic_id, patient_id, respondent_kind, form_kind, form_id,
       payload_encrypted, encryption_version, consent_notice_version, consented_at, submitted_at)
     VALUES (?, ?, ?, ?, 'family', 'pre_consulta', 'form-1', ?, 'v1', 'consent-v1', ?, ?)`,
    `intake-sub-${patientId}`,
    `intake-inv-${patientId}`,
    clinicId,
    patientId,
    CIPHER,
    NOW,
    NOW,
  );
  p(
    `INSERT INTO live_scale_invitations
      (id, clinic_id, patient_id, created_by_user_id, respondent_kind, scale_id,
       token_hash, expires_at)
     VALUES (?, ?, ?, ?, 'family', 'mchat', ?, ?)`,
    `scale-inv-${patientId}`,
    clinicId,
    patientId,
    ACTOR,
    `hash-scale-${patientId}`,
    FUTURE,
  );
  p(
    `INSERT INTO live_scale_responses
      (id, invitation_id, clinic_id, patient_id, respondent_kind, scale_id,
       answers_encrypted, encryption_version, consent_notice_version, consented_at, submitted_at)
     VALUES (?, ?, ?, ?, 'family', 'mchat', ?, 'v1', 'consent-v1', ?, ?)`,
    `scale-resp-${patientId}`,
    `scale-inv-${patientId}`,
    clinicId,
    patientId,
    CIPHER,
    NOW,
    NOW,
  );
}

criarClinica(RED, "red");
criarClinica(BLUE, "blue");
criarPaciente(RED, RED_PATIENT);
criarPaciente(RED, RED_PATIENT_2);
criarPaciente(BLUE, BLUE_PATIENT);

const CLINICAL_TABLES = [
  "live_assessment_responses",
  "live_assessments",
  "live_scale_responses",
  "live_scale_invitations",
  "live_intake_submissions",
  "live_intake_invitations",
  "live_document_versions",
  "live_documents",
  "live_clinical_events",
  "live_patients",
];

function contarClinica(clinicId: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const table of CLINICAL_TABLES) {
    counts[table] = (
      sqlite
        .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE clinic_id = ?`)
        .get(clinicId) as { n: number }
    ).n;
  }
  return counts;
}

function contarPaciente(clinicId: string, patientId: string): number {
  let total = 0;
  for (const table of CLINICAL_TABLES) {
    const column = table === "live_patients" ? "id" : "patient_id";
    total += (
      sqlite
        .prepare(
          `SELECT COUNT(*) AS n FROM ${table} WHERE clinic_id = ? AND ${column} = ?`,
        )
        .get(clinicId, patientId) as { n: number }
    ).n;
  }
  return total;
}

const blueBaseline = contarClinica(BLUE);
assert.ok(
  Object.values(blueBaseline).every((n) => n > 0),
  "premissa do teste: BLUE precisa começar com dado em todas as tabelas",
);

// Request + ledger reais: os triggers da 0017 exigem que o job aponte para uma
// request do mesmo tenant.
function criarRequestEJob(
  requestId: string,
  clinicId: string,
  scope: "patient" | "clinic",
) {
  sqlite
    .prepare(
      `INSERT INTO live_deletion_requests (id, clinic_id, requested_by_user_id, scope, status)
       VALUES (?, ?, ?, ?, 'processing')`,
    )
    .run(requestId, clinicId, ACTOR, scope);
  sqlite
    .prepare(
      `INSERT INTO live_lgpd_worker_jobs (id, request_type, request_id, clinic_id, status)
       VALUES (?, 'delete', ?, ?, 'processing')`,
    )
    .run(`lgpd:delete:${requestId}`, requestId, clinicId);
}

criarRequestEJob("req-paciente", RED, "patient");
criarRequestEJob("req-clinica", RED, "clinic");

function claimPara(requestId: string, clinicId: string): LgpdWorkerClaim {
  return {
    jobId: `lgpd:delete:${requestId}`,
    requestType: "delete",
    requestId,
    clinicId,
    attempt: 1,
    claimedAt: NOW,
    leaseUntil: "2026-09-05T12:10:00.000Z",
    workerRunId: "run-sintetico",
  };
}

interface Corrida {
  falhas: string[];
  conclusoes: Array<Record<string, number>>;
}

async function rodarPurge(
  requestId: string,
  scope: "patient" | "clinic",
  patientId: string | null,
  options: { clinicIdAlvo?: string; completeRetorna?: boolean; dbOverride?: D1Database } = {},
): Promise<Corrida> {
  const corrida: Corrida = { falhas: [], conclusoes: [] };
  await executeTenantScopedPurge({
    db: options.dbOverride ?? db,
    claim: claimPara(requestId, RED),
    targets: { scope, clinicId: options.clinicIdAlvo ?? RED, patientId },
    now: NOW,
    complete: async (counts) => {
      corrida.conclusoes.push(counts);
      return options.completeRetorna ?? true;
    },
    fail: async (code) => {
      corrida.falhas.push(code);
    },
  });
  return corrida;
}

// ── 1) Legal hold bloqueia e não apaga nada ───────────────────────────────
{
  sqlite
    .prepare(`UPDATE tenant_lifecycle SET legal_hold = 1 WHERE clinic_id = ?`)
    .run(RED);
  const antes = contarPaciente(RED, RED_PATIENT);
  const corrida = await rodarPurge("req-paciente", "patient", RED_PATIENT);
  assert.deepEqual(corrida.falhas, ["LEGAL_HOLD"]);
  assert.equal(corrida.conclusoes.length, 0, "bloqueado não pode concluir");
  assert.equal(
    contarPaciente(RED, RED_PATIENT),
    antes,
    "legal hold não pode apagar nada",
  );
  sqlite
    .prepare(`UPDATE tenant_lifecycle SET legal_hold = 0 WHERE clinic_id = ?`)
    .run(RED);
}

// ── 2) Retenção ainda não vencida bloqueia ────────────────────────────────
{
  sqlite
    .prepare(
      `UPDATE tenant_lifecycle SET retention_until = ?, requested_at = ?, reason_code = 'other' WHERE clinic_id = ?`,
    )
    .run(FUTURE, NOW, RED);
  const corrida = await rodarPurge("req-paciente", "patient", RED_PATIENT);
  assert.deepEqual(corrida.falhas, ["RETENTION_PENDING"]);
  assert.equal(contarPaciente(RED, RED_PATIENT) > 0, true);
  sqlite
    .prepare(
      `UPDATE tenant_lifecycle SET retention_until = NULL, requested_at = NULL, reason_code = NULL WHERE clinic_id = ?`,
    )
    .run(RED);
}

// ── 3) Tenant ativo bloqueia o escopo de clínica ──────────────────────────
{
  const corrida = await rodarPurge("req-clinica", "clinic", null);
  assert.deepEqual(corrida.falhas, ["ACTIVE_TENANT"]);
  assert.ok(contarClinica(RED).live_patients > 0);
}

// ── 5) Alvo de outra clínica é recusado antes de qualquer DELETE ──────────
{
  const antesBlue = contarClinica(BLUE);
  const corrida = await rodarPurge("req-paciente", "patient", BLUE_PATIENT, {
    clinicIdAlvo: BLUE,
  });
  assert.deepEqual(corrida.falhas, ["PURGE_TENANT_MISMATCH"]);
  assert.deepEqual(contarClinica(BLUE), antesBlue, "BLUE não pode perder nada");
}

// ── 6) Purge por paciente: RED limpo, BLUE intocado ───────────────────────
{
  const beforeRed = contarClinica(RED);
  const beforeBlue = contarClinica(BLUE);
  const unavailableDb = {
    prepare(sql: string) {
      if (sql.includes("SELECT COUNT(*) AS n FROM appointments")) throw new Error("D1_ERROR: synthetic temporary failure");
      return db.prepare(sql);
    },
    batch: db.batch.bind(db),
  } as D1Database;
  const result = await rodarPurge("req-paciente", "patient", RED_PATIENT, { dbOverride: unavailableDb });
  assert.deepEqual(result.falhas, ["PURGE_PREFLIGHT_FAILED:appointments"]);
  assert.equal(result.conclusoes.length, 0);
  assert.deepEqual(contarClinica(RED), beforeRed);
  assert.deepEqual(contarClinica(BLUE), beforeBlue);
}

{
  const antesBlue = contarClinica(BLUE);
  const antesOutroPaciente = contarPaciente(RED, RED_PATIENT_2);
  assert.ok(
    antesOutroPaciente > 0,
    "premissa: o outro paciente de RED tem dado",
  );

  const corrida = await rodarPurge("req-paciente", "patient", RED_PATIENT);
  assert.deepEqual(
    corrida.falhas,
    [],
    `não deveria falhar: ${corrida.falhas.join(",")}`,
  );
  assert.equal(corrida.conclusoes.length, 1);

  const counts = corrida.conclusoes[0];
  for (const table of CLINICAL_TABLES) {
    assert.equal(
      counts[table],
      1,
      `${table} deveria ter apagado exatamente 1 linha`,
    );
  }

  assert.equal(
    contarPaciente(RED, RED_PATIENT),
    0,
    "o titular precisa sumir por inteiro",
  );
  assert.equal(
    contarPaciente(RED, RED_PATIENT_2),
    antesOutroPaciente,
    "o purge por paciente não pode atingir outro paciente da mesma clínica",
  );
  assert.deepEqual(
    contarClinica(BLUE),
    antesBlue,
    "BLUE precisa ficar byte a byte igual",
  );
}

// ── 7) Replay é idempotente ───────────────────────────────────────────────
{
  const corrida = await rodarPurge("req-paciente", "patient", RED_PATIENT);
  assert.deepEqual(corrida.falhas, [], "replay não pode falhar");
  assert.equal(corrida.conclusoes.length, 1);
  for (const table of CLINICAL_TABLES) {
    assert.equal(
      corrida.conclusoes[0][table],
      0,
      `${table} deveria apagar 0 no replay`,
    );
  }
}

// ── 4) Elegibilidade é relida NO purge, não no enfileiramento ─────────────
// O job foi reivindicado quando não havia hold; o hold entra depois. Este é o
// invariante que separa "checou uma vez" de "checou quando importava".
{
  sqlite
    .prepare(`UPDATE tenant_lifecycle SET legal_hold = 1 WHERE clinic_id = ?`)
    .run(RED);
  const antes = contarPaciente(RED, RED_PATIENT_2);
  const corrida = await rodarPurge("req-paciente", "patient", RED_PATIENT_2);
  assert.deepEqual(
    corrida.falhas,
    ["LEGAL_HOLD"],
    "hold aposto depois do claim precisa bloquear o purge",
  );
  assert.equal(contarPaciente(RED, RED_PATIENT_2), antes);
  sqlite
    .prepare(`UPDATE tenant_lifecycle SET legal_hold = 0 WHERE clinic_id = ?`)
    .run(RED);
}

// ── 10) Falha ao concluir não finge sucesso ───────────────────────────────
{
  const corrida = await rodarPurge("req-paciente", "patient", RED_PATIENT_2, {
    completeRetorna: false,
  });
  assert.deepEqual(corrida.falhas, ["PURGE_COMPLETION_FAILED"]);
  assert.equal(
    contarPaciente(RED, RED_PATIENT_2),
    0,
    "o dado realmente foi apagado — o executor precisa reportar a falha de conclusão, não escondê-la",
  );
}

// LTB-02 (ciclo 4, 2026-09-26 — docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md):
// o export do tenant não cobre documentos, avaliações, intake nem respostas
// de escala. O purge por CLÍNICA precisa recusar enquanto sobrar linha de
// RED nessas tabelas — nunca apagar o que o export nunca levou.
const EXPORT_UNCOVERED_TABLES_TESTE = [
  "live_documents",
  "live_document_versions",
  "live_assessments",
  "live_assessment_responses",
  "live_intake_invitations",
  "live_intake_submissions",
  "live_scale_invitations",
  "live_scale_responses",
];

// ── 8a) Purge por clínica recusa com dado fora do alcance do export ───────
// RED_PATIENT e RED_PATIENT_2 já foram apagados individualmente pelas
// corridas 6/7/10 acima — um paciente novo garante dado fresco nas tabelas
// fora do export no momento desta prova.
criarPaciente(RED, RED_PATIENT_3);
{
  sqlite.prepare(`UPDATE clinics SET status = 'closed' WHERE id = ?`).run(RED);
  sqlite
    .prepare(
      `UPDATE tenant_lifecycle
          SET status = 'closed', requested_at = ?, retention_until = ?, reason_code = 'other', finalized_at = ?
        WHERE clinic_id = ?`,
    )
    .run(PAST, PAST, PAST, RED);

  const antesRed = contarClinica(RED);
  const beforeBlue = contarClinica(BLUE);
  const unavailableDb = {
    prepare(sql: string) {
      if (sql.includes("SELECT COUNT(*) AS n") && EXPORT_UNCOVERED_TABLES_TESTE.some((table) => sql.includes(`FROM ${table} WHERE clinic_id = ?`))) {
        throw new Error("D1_ERROR: synthetic temporary database failure");
      }
      return db.prepare(sql);
    },
    batch: db.batch.bind(db),
  } as D1Database;
  const unavailable = await rodarPurge("req-clinica", "clinic", null, { dbOverride: unavailableDb });
  assert.deepEqual(unavailable.falhas, ["PURGE_PREFLIGHT_FAILED:live_documents"]);
  assert.equal(unavailable.conclusoes.length, 0);
  assert.deepEqual(contarClinica(RED), antesRed, "falha de contagem não pode liberar exclusão");
  assert.deepEqual(contarClinica(BLUE), beforeBlue);
  const temDadoForaDoExport = EXPORT_UNCOVERED_TABLES_TESTE.some(
    (table) => antesRed[table] > 0,
  );
  assert.ok(
    temDadoForaDoExport,
    "premissa: RED tem dado em ao menos uma tabela fora do export",
  );

  const corrida = await rodarPurge("req-clinica", "clinic", null);
  assert.equal(corrida.falhas.length, 1);
  assert.match(
    corrida.falhas[0],
    /^EXPORT_MANIFEST_INCOMPLETE:/,
    "purge por clínica com dado não exportado precisa recusar nomeando a tabela",
  );
  assert.deepEqual(
    contarClinica(RED),
    antesRed,
    "recusa não pode apagar nada, nem parcialmente",
  );
}

// Simula o dado tendo sido coberto pelo export (S12b, backlog): limpa só as
// tabelas fora do alcance de hoje, deixando o resto intocado.
for (const table of EXPORT_UNCOVERED_TABLES_TESTE) {
  sqlite.prepare(`DELETE FROM ${table} WHERE clinic_id = ?`).run(RED);
}

// ── 8b) Purge por clínica: RED zerado, BLUE intocado ──────────────────────
{
  const antesBlue = contarClinica(BLUE);
  const corrida = await rodarPurge("req-clinica", "clinic", null);
  assert.deepEqual(
    corrida.falhas,
    [],
    `não deveria falhar: ${corrida.falhas.join(",")}`,
  );

  const depoisRed = contarClinica(RED);
  for (const table of CLINICAL_TABLES) {
    assert.equal(depoisRed[table], 0, `${table} deveria estar zerada em RED`);
  }
  assert.deepEqual(
    contarClinica(BLUE),
    antesBlue,
    "BLUE precisa ficar byte a byte igual",
  );
  assert.deepEqual(
    contarClinica(BLUE),
    blueBaseline,
    "BLUE precisa estar idêntico ao estado inicial, depois de todas as corridas",
  );
}

// ── 9) A trilha que prova a eliminação sobrevive ──────────────────────────
{
  const request = sqlite
    .prepare(
      `SELECT COUNT(*) AS n FROM live_deletion_requests WHERE clinic_id = ?`,
    )
    .get(RED) as { n: number };
  assert.ok(
    request.n >= 2,
    "as requests de eliminação não podem ser apagadas pelo purge",
  );

  const jobs = sqlite
    .prepare(
      `SELECT COUNT(*) AS n FROM live_lgpd_worker_jobs WHERE clinic_id = ?`,
    )
    .get(RED) as { n: number };
  assert.ok(jobs.n >= 2, "o ledger do worker não pode ser apagado pelo purge");

  const lifecycle = sqlite
    .prepare(`SELECT COUNT(*) AS n FROM tenant_lifecycle WHERE clinic_id = ?`)
    .get(RED) as { n: number };
  assert.equal(
    lifecycle.n,
    1,
    "o ciclo de vida do tenant é registro de conformidade",
  );

  // E a lista de preservadas do módulo precisa bater com tabelas que existem
  // de verdade — uma preservada com nome errado não protege nada.
  for (const table of PURGE_PRESERVED_TABLES) {
    const exists = sqlite
      .prepare(
        `SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name = ?`,
      )
      .get(table) as { n: number };
    assert.equal(
      exists.n,
      1,
      `tabela preservada inexistente no schema: ${table}`,
    );
  }
}

sqlite.close();
console.log(
  "✓ lgpd-purge-executor: legal hold, retenção pendente, tenant ativo, revalidação no purge, alvo cross-tenant, purge por paciente e por clínica, replay idempotente, trilha preservada e falha de conclusão honesta — RED apagado, BLUE intacto",
);
