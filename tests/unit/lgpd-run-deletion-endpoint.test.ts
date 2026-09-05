/**
 * lgpd-run-deletion-endpoint.test.ts — prova do ORQUESTRADOR da eliminação
 * LGPD (POST /api/live/governance/run-deletion).
 *
 * O purge físico já é provado em lgpd-purge-executor.test.ts. O que se prova
 * aqui é o que faltava para a eliminação ser operacional: quem pode disparar,
 * contra qual tenant, em que estado, e o que sobra de trilha depois.
 *
 * Roda o handler REAL contra o schema REAL (base + todas as migrações,
 * foreign_keys ligado), com dois tenants sintéticos — RED (alvo) e BLUE (que
 * jamais pode ser tocado). Nenhum dado clínico real: todo payload é
 * 'cipher-sintetico'.
 *
 * Invariantes provados:
 *  1. sem sessão → 401, sem tocar no ledger;
 *  2. membro sem gestão (professional) → 403;
 *  3. gestor de BLUE não executa requisição de RED — o requestId sozinho não
 *     decide o tenant;
 *  4. requisição ainda não aprovada → 409, sem claim;
 *  5. escopo de clínica sem admin de plataforma → 403;
 *  6. legal hold responde 409 com o CÓDIGO da política (não erro genérico);
 *  7. caminho feliz: gestor elimina o titular, o ledger fecha como completed
 *     com as contagens, e BLUE fica intacto;
 *  8. a trilha de auditoria não carrega patient_id;
 *  9. replay imediato não apaga de novo nem duplica evidência;
 * 10. admin de plataforma executa o escopo de clínica no tenant encerrado.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";
import { onRequestPost as runDeletion } from "../../functions/api/live/governance/run-deletion";

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

const RED = "clinic-red-run";
const BLUE = "clinic-blue-run";
const RED_PATIENT = "patient-red-run";
const BLUE_PATIENT = "patient-blue-run";
const CIPHER = "cipher-sintetico";
const NOW = "2026-09-05T12:00:00.000Z";
const FUTURE = "2099-01-01T00:00:00.000Z";

// Chaves sintéticas de teste, nunca usadas fora deste processo.
const env = {
  DB: db,
  CLINICAL_LIVE_ENABLED: "true",
  CLINICAL_DATA_KEY: "data-key-current-" + "d".repeat(48),
  CLINICAL_DATA_KEY_ID: "k1",
  CLINICAL_INDEX_KEY: "index-key-separated-" + "i".repeat(48),
};

interface Ator {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
}

function criarUsuario(id: string, role: string): Ator {
  sqlite
    .prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)`)
    .run(id, `Usuário ${id}`, `${id}@example.test`, role);
  return {
    id,
    email: `${id}@example.test`,
    name: `Usuário ${id}`,
    role,
    mustChangePassword: false,
  };
}

const PLATFORM_ADMIN = criarUsuario("user-platform-admin", "admin");
const RED_OWNER = criarUsuario("user-red-owner", "professional");
const RED_PROFESSIONAL = criarUsuario("user-red-professional", "professional");
const BLUE_OWNER = criarUsuario("user-blue-owner", "professional");

function criarClinica(clinicId: string, slug: string, ownerId: string) {
  sqlite
    .prepare(
      `INSERT INTO clinics (id, slug, name, timezone, status, created_by_user_id)
       VALUES (?, ?, ?, 'America/Recife', 'active', ?)`,
    )
    .run(clinicId, slug, `Clínica ${slug}`, ownerId);
  sqlite
    .prepare(
      `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at)
       VALUES (?, ?, 'owner', 1, ?, ?)`,
    )
    .run(clinicId, ownerId, NOW, NOW);
}

function criarPaciente(clinicId: string, patientId: string, autorId: string) {
  const p = (sql: string, ...args: unknown[]) =>
    sqlite.prepare(sql).run(...args);
  p(
    `INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted) VALUES (?, ?, ?, ?)`,
    patientId,
    clinicId,
    autorId,
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
    autorId,
    NOW,
    CIPHER,
  );
  p(
    `INSERT INTO live_scale_invitations
      (id, clinic_id, patient_id, created_by_user_id, respondent_kind, scale_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?, 'family', 'mchat', ?, ?)`,
    `scale-inv-${patientId}`,
    clinicId,
    patientId,
    autorId,
    `hash-${patientId}`,
    FUTURE,
  );
}

criarClinica(RED, "red-run", RED_OWNER.id);
criarClinica(BLUE, "blue-run", BLUE_OWNER.id);
sqlite
  .prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at)
     VALUES (?, ?, 'professional', 1, ?, ?)`,
  )
  .run(RED, RED_PROFESSIONAL.id, NOW, NOW);
criarPaciente(RED, RED_PATIENT, RED_OWNER.id);
criarPaciente(BLUE, BLUE_PATIENT, BLUE_OWNER.id);

const TABELAS = [
  "live_patients",
  "live_clinical_events",
  "live_scale_invitations",
];
function contar(clinicId: string): number {
  return TABELAS.reduce(
    (total, table) =>
      total +
      (
        sqlite
          .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE clinic_id = ?`)
          .get(clinicId) as { n: number }
      ).n,
    0,
  );
}
const blueBaseline = contar(BLUE);

function criarRequest(
  id: string,
  clinicId: string,
  scope: "patient" | "clinic",
  patientId: string | null,
  status: string,
  autorId: string,
) {
  sqlite
    .prepare(
      `INSERT INTO live_deletion_requests
        (id, clinic_id, requested_by_user_id, patient_id, scope, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(id, clinicId, autorId, patientId, scope, status);
}

criarRequest(
  "req-red-paciente",
  RED,
  "patient",
  RED_PATIENT,
  "approved",
  RED_OWNER.id,
);
criarRequest(
  "req-red-pendente",
  RED,
  "patient",
  RED_PATIENT,
  "requested",
  RED_OWNER.id,
);
criarRequest("req-red-clinica", RED, "clinic", null, "approved", RED_OWNER.id);

function contexto(user: Ator | null, body: unknown) {
  return {
    env,
    params: {},
    data: user ? { authUser: user } : {},
    request: new Request(
      "https://app.neuroped.test/api/live/governance/run-deletion",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    ),
  } as never;
}

function ledger(requestId: string) {
  return sqlite
    .prepare(
      `SELECT status, attempts, deleted_counts_json, failure_code FROM live_lgpd_worker_jobs WHERE request_id = ?`,
    )
    .get(requestId) as
    | {
        status: string;
        attempts: number;
        deleted_counts_json: string | null;
        failure_code: string | null;
      }
    | undefined;
}

// ── 1) Sem sessão → 401, sem tocar no ledger ──────────────────────────────
{
  const response = await runDeletion(
    contexto(null, { clinicId: RED, requestId: "req-red-paciente" }),
  );
  assert.equal(response.status, 401);
  assert.equal(
    ledger("req-red-paciente"),
    undefined,
    "sem sessão não pode criar job",
  );
}

// ── 2) Membro sem gestão → 403 ────────────────────────────────────────────
{
  const response = await runDeletion(
    contexto(RED_PROFESSIONAL, {
      clinicId: RED,
      requestId: "req-red-paciente",
    }),
  );
  assert.equal(response.status, 403);
  assert.equal(ledger("req-red-paciente"), undefined);
}

// ── 3) Gestor de BLUE não executa requisição de RED ───────────────────────
{
  const response = await runDeletion(
    contexto(BLUE_OWNER, { clinicId: BLUE, requestId: "req-red-paciente" }),
  );
  assert.equal(
    response.status,
    404,
    "o requestId sozinho não pode decidir o tenant",
  );
  assert.equal(contar(RED) > 0, true, "RED não pode perder nada");
  assert.equal(contar(BLUE), blueBaseline);
}

// ── 4) Requisição não aprovada → 409, sem claim ───────────────────────────
{
  const response = await runDeletion(
    contexto(RED_OWNER, { clinicId: RED, requestId: "req-red-pendente" }),
  );
  assert.equal(response.status, 409);
  assert.equal(
    ((await response.json()) as { code: string }).code,
    "REQUEST_NOT_APPROVED",
  );
  assert.equal(ledger("req-red-pendente"), undefined);
}

// ── 5) Escopo de clínica sem admin de plataforma → 403 ────────────────────
// Sem esta regra, ninguém conseguiria eliminar um tenant encerrado, porque
// membershipCanManage exige clínica ativa.
{
  const response = await runDeletion(
    contexto(RED_OWNER, { clinicId: RED, requestId: "req-red-clinica" }),
  );
  assert.equal(response.status, 403);
  assert.equal(
    ((await response.json()) as { code: string }).code,
    "PLATFORM_ADMIN_REQUIRED",
  );
  assert.equal(ledger("req-red-clinica"), undefined);
}

// ── 6) Legal hold → 409 com o CÓDIGO da política ──────────────────────────
{
  sqlite
    .prepare(`UPDATE tenant_lifecycle SET legal_hold = 1 WHERE clinic_id = ?`)
    .run(RED);
  const antes = contar(RED);
  const response = await runDeletion(
    contexto(RED_OWNER, { clinicId: RED, requestId: "req-red-paciente" }),
  );
  assert.equal(
    response.status,
    409,
    "bloqueio de política não é erro de servidor",
  );
  assert.equal(
    ((await response.json()) as { code: string }).code,
    "LEGAL_HOLD",
  );
  assert.equal(contar(RED), antes, "legal hold não pode apagar nada");
  assert.equal(ledger("req-red-paciente")?.failure_code, "LEGAL_HOLD");
  sqlite
    .prepare(`UPDATE tenant_lifecycle SET legal_hold = 0 WHERE clinic_id = ?`)
    .run(RED);
}

// ── 7) Caminho feliz: elimina o titular e fecha o ledger ──────────────────
{
  const response = await runDeletion(
    contexto(RED_OWNER, { clinicId: RED, requestId: "req-red-paciente" }),
  );
  const raw = await response.text();
  assert.equal(response.status, 200, `esperava sucesso, veio ${raw}`);
  const body = JSON.parse(raw) as {
    ok: boolean;
    scope: string;
    deletedCounts: Record<string, number>;
  };
  assert.equal(body.ok, true);
  assert.equal(body.scope, "patient");
  assert.equal(body.deletedCounts.live_patients, 1);
  assert.equal(body.deletedCounts.live_clinical_events, 1);
  assert.equal(body.deletedCounts.live_scale_invitations, 1);

  assert.equal(contar(RED), 0, "o titular de RED precisa sumir por inteiro");
  assert.equal(
    contar(BLUE),
    blueBaseline,
    "BLUE precisa ficar idêntico ao estado inicial",
  );

  // A requisição sobrevive como evidência, mas SEM apontar para o titular
  // apagado: o ponteiro é solto no mesmo batch (senão o ON DELETE RESTRICT da
  // própria requisição impediria a eliminação).
  const requestRow = sqlite
    .prepare(
      `SELECT id, scope, status, patient_id FROM live_deletion_requests WHERE id = ?`,
    )
    .get("req-red-paciente") as {
    id: string;
    scope: string;
    status: string;
    patient_id: string | null;
  };
  assert.ok(
    requestRow,
    "a requisição precisa sobreviver como prova da eliminação",
  );
  assert.equal(requestRow.scope, "patient");
  assert.equal(
    requestRow.patient_id,
    null,
    "o identificador do titular não pode sobreviver à própria eliminação",
  );

  const job = ledger("req-red-paciente");
  assert.equal(
    job?.status,
    "completed",
    "o ledger precisa fechar como completed",
  );
  assert.ok(
    job?.deleted_counts_json,
    "a evidência de contagem precisa estar no ledger",
  );
  assert.equal(
    job?.failure_code,
    null,
    "o failure_code do bloqueio anterior precisa ser limpo",
  );
}

// ── 8) A trilha não carrega patient_id ────────────────────────────────────
{
  const audit = sqlite
    .prepare(
      `SELECT * FROM saas_audit_log WHERE action = 'lgpd_deletion_executed'`,
    )
    .all() as Array<Record<string, unknown>>;
  assert.equal(audit.length, 1, "executar precisa deixar trilha");
  assert.equal(audit[0].clinic_id, RED);
  assert.equal(audit[0].actor_user_id, RED_OWNER.id);
  assert.ok(
    !JSON.stringify(audit[0]).includes(RED_PATIENT),
    "a trilha não pode expor o patient_id",
  );
}

// ── 9) Replay imediato não apaga de novo nem duplica evidência ────────────
{
  const antesBlue = contar(BLUE);
  const response = await runDeletion(
    contexto(RED_OWNER, { clinicId: RED, requestId: "req-red-paciente" }),
  );
  // A request saiu de 'approved'/'processing' ao concluir, então o claim
  // recusa — o replay é rejeitado antes de qualquer DELETE.
  assert.ok(
    [409, 200].includes(response.status),
    `replay deveria ser recusado ou idempotente, veio ${response.status}`,
  );
  assert.equal(contar(RED), 0);
  assert.equal(contar(BLUE), antesBlue, "BLUE segue intacto depois de tudo");

  const jobs = sqlite
    .prepare(
      `SELECT COUNT(*) AS n FROM live_lgpd_worker_jobs WHERE request_id = 'req-red-paciente'`,
    )
    .get() as { n: number };
  assert.equal(
    jobs.n,
    1,
    "o ledger não pode ganhar um segundo job para a mesma request",
  );
}

// ── 10) Admin de plataforma executa o escopo de clínica ───────────────────
// Contraparte positiva do gate 5: com o tenant encerrado e a retenção vencida,
// quem PODE executar é o admin de plataforma — e ele consegue.
{
  sqlite.prepare(`UPDATE clinics SET status = 'closed' WHERE id = ?`).run(RED);
  sqlite
    .prepare(
      `UPDATE tenant_lifecycle
          SET status = 'closed', requested_at = ?, retention_until = ?,
              reason_code = 'other', finalized_at = ?
        WHERE clinic_id = ?`,
    )
    .run(
      "2020-01-01T00:00:00.000Z",
      "2020-01-01T00:00:00.000Z",
      "2020-01-01T00:00:00.000Z",
      RED,
    );

  const antesBlue = contar(BLUE);
  const response = await runDeletion(
    contexto(PLATFORM_ADMIN, { clinicId: RED, requestId: "req-red-clinica" }),
  );
  const raw = await response.text();
  assert.equal(
    response.status,
    200,
    `admin de plataforma deveria conseguir, veio ${raw}`,
  );

  assert.equal(
    contar(RED),
    0,
    "o tenant encerrado precisa ficar sem dado clínico",
  );
  assert.equal(contar(BLUE), antesBlue, "BLUE segue intacto");
  assert.equal(
    contar(BLUE),
    blueBaseline,
    "BLUE idêntico ao estado inicial, ao fim de tudo",
  );
  assert.equal(ledger("req-red-clinica")?.status, "completed");
}

sqlite.close();
console.log(
  "✓ lgpd-run-deletion-endpoint: 401 sem sessão, 403 sem gestão, fronteira de tenant, 409 sem aprovação, escopo de clínica exige admin de plataforma, legal hold com código de política, eliminação concluída com ledger fechado, trilha sem patient_id, replay sem segundo apagamento e admin de plataforma eliminando o tenant encerrado — RED eliminado, BLUE intacto",
);
