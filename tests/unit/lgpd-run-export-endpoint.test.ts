/**
 * lgpd-run-export-endpoint.test.ts — prova do ORQUESTRADOR da exportação LGPD
 * (POST /api/live/governance/run-export).
 *
 * Roda o handler REAL contra o schema REAL (base + todas as migrações,
 * foreign_keys ligado) e a criptografia clínica REAL, com dois tenants
 * sintéticos — RED (alvo) e BLUE (que jamais pode aparecer no artefato).
 * Nenhum dado clínico real.
 *
 * Invariantes provados:
 *  1. sem bucket privado, recusa ANTES de reivindicar — nada suja o ledger;
 *  2. sem sessão → 401;
 *  3. membro sem gestão → 403;
 *  4. gestor de BLUE não exporta requisição de RED;
 *  5. requisição não aprovada → 409, sem claim;
 *  6. escopo de paciente é recusado explicitamente (nenhum coletor o produz);
 *  7. caminho feliz: artefato gravado, ledger `completed` com chave/digest/
 *     tamanho, e o digest bate com o objeto efetivamente armazenado;
 *  8. o storage recebe SÓ ciphertext — nem o nome do paciente de RED nem
 *     qualquer dado de BLUE aparecem no objeto;
 *  9. a trilha de auditoria não carrega conteúdo clínico;
 * 10. falha de gravação no storage não conclui o job nem deixa artefato órfão;
 * 11. admin de plataforma exige reason declarada (400 sem ela, sem tocar o
 *     ledger) e exporta com ela, deixando trilha PRÉVIA da razão
 *     (AUTHZ-P1-08/LTB-19).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";
import { onRequestPost as runExport } from "../../functions/api/live/governance/run-export";
import { encryptClinicalJson } from "../../functions/api/tenant/_crypto";
import { collectTenantExportPayload, countExportUncoveredRows } from "../../functions/api/tenant/_exportPayload";

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
        const prepared = raw.db.prepare(raw.sql);
        if (prepared.reader) return { success: true, results: prepared.all(...raw.values), meta: {} };
        const result = prepared.run(...raw.values);
        return { success: true, meta: { changes: result.changes } };
      }),
    )();
  }
}

/** Duplo de R2 com a mesma superfície do binding real. */
class BucketFake {
  objects = new Map<string, Uint8Array>();
  failPut = false;
  async put(key: string, value: Uint8Array) {
    if (this.failPut) throw new Error("synthetic-put-failure");
    this.objects.set(key, new Uint8Array(value));
    return {} as never;
  }
  async get(key: string) {
    const stored = this.objects.get(key);
    if (!stored) return null;
    return { arrayBuffer: async () => stored.buffer.slice(0) } as never;
  }
  async delete(key: string) {
    this.objects.delete(key);
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
      `migração ${file}: ${message}`,
    );
  }
}

const db = new D1DatabaseMock(sqlite) as unknown as D1Database;

const RED = "clinic-red-export";
const BLUE = "clinic-blue-export";
const RED_PATIENT = "patient-red-export";
const BLUE_PATIENT = "patient-blue-export";
const NOW = "2026-09-05T12:00:00.000Z";
const NOME_RED = "Marcador Sintetico Vermelho";
const NOME_BLUE = "Marcador Sintetico Azul";

const bucket = new BucketFake();
const baseEnv = {
  DB: db,
  CLINICAL_LIVE_ENABLED: "true",
  CLINICAL_DATA_KEY: "data-key-current-" + "d".repeat(48),
  CLINICAL_DATA_KEY_ID: "k1",
  CLINICAL_INDEX_KEY: "index-key-separated-" + "i".repeat(48),
};
const env = { ...baseEnv, LGPD_EXPORT_BUCKET: bucket };

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

const RED_OWNER = criarUsuario("user-red-owner-exp", "professional");
const RED_PROFESSIONAL = criarUsuario("user-red-prof-exp", "professional");
const BLUE_OWNER = criarUsuario("user-blue-owner-exp", "professional");
const PLATFORM_ADMIN = criarUsuario("user-platform-admin-exp", "admin");

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

async function criarPaciente(
  clinicId: string,
  patientId: string,
  autorId: string,
  nome: string,
) {
  const cifrado = await encryptClinicalJson(
    baseEnv as never,
    clinicId,
    `patient-profile:${patientId}`,
    { nome },
  );
  sqlite
    .prepare(
      `INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted, encryption_version)
       VALUES (?, ?, ?, ?, 'k1')`,
    )
    .run(patientId, clinicId, autorId, cifrado);
}

criarClinica(RED, "red-export", RED_OWNER.id);
criarClinica(BLUE, "blue-export", BLUE_OWNER.id);
sqlite
  .prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at)
     VALUES (?, ?, 'professional', 1, ?, ?)`,
  )
  .run(RED, RED_PROFESSIONAL.id, NOW, NOW);
await criarPaciente(RED, RED_PATIENT, RED_OWNER.id, NOME_RED);
await criarPaciente(BLUE, BLUE_PATIENT, BLUE_OWNER.id, NOME_BLUE);

function criarRequest(
  id: string,
  clinicId: string,
  scope: "clinic" | "patient",
  patientId: string | null,
  status: string,
  autorId: string,
) {
  sqlite
    .prepare(
      `INSERT INTO live_export_requests
        (id, clinic_id, requested_by_user_id, patient_id, scope, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(id, clinicId, autorId, patientId, scope, status);
}

criarRequest("req-exp-red", RED, "clinic", null, "approved", RED_OWNER.id);
criarRequest(
  "req-exp-pendente",
  RED,
  "clinic",
  null,
  "requested",
  RED_OWNER.id,
);
criarRequest(
  "req-exp-paciente",
  RED,
  "patient",
  RED_PATIENT,
  "approved",
  RED_OWNER.id,
);
criarRequest("req-exp-falha", RED, "clinic", null, "approved", RED_OWNER.id);
criarRequest("req-exp-admin", RED, "clinic", null, "approved", RED_OWNER.id);

function contexto(
  user: Ator | null,
  body: unknown,
  envOverride: unknown = env,
) {
  return {
    env: envOverride,
    params: {},
    data: user ? { authUser: user } : {},
    request: new Request(
      "https://app.neuroped.test/api/live/governance/run-export",
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
      `SELECT status, artifact_key, artifact_digest_sha256, artifact_byte_length, failure_code
         FROM live_lgpd_worker_jobs WHERE request_id = ?`,
    )
    .get(requestId) as
    | {
        status: string;
        artifact_key: string | null;
        artifact_digest_sha256: string | null;
        artifact_byte_length: number | null;
        failure_code: string | null;
      }
    | undefined;
}

// ── 1) Sem bucket: recusa ANTES de reivindicar ────────────────────────────
{
  const semBucket = { ...baseEnv };
  const response = await runExport(
    contexto(RED_OWNER, { clinicId: RED, requestId: "req-exp-red" }, semBucket),
  );
  assert.equal(response.status, 503);
  assert.equal(
    ((await response.json()) as { code: string }).code,
    "EXPORT_STORE_NOT_CONFIGURED",
  );
  assert.equal(
    ledger("req-exp-red"),
    undefined,
    "falta de infraestrutura não pode queimar tentativa no ledger",
  );
}

// ── 2) Sem sessão → 401 ───────────────────────────────────────────────────
{
  const response = await runExport(
    contexto(null, { clinicId: RED, requestId: "req-exp-red" }),
  );
  assert.equal(response.status, 401);
}

// ── 3) Membro sem gestão → 403 ────────────────────────────────────────────
{
  const response = await runExport(
    contexto(RED_PROFESSIONAL, { clinicId: RED, requestId: "req-exp-red" }),
  );
  assert.equal(response.status, 403);
}

// ── 4) Gestor de BLUE não exporta requisição de RED ───────────────────────
{
  const response = await runExport(
    contexto(BLUE_OWNER, { clinicId: BLUE, requestId: "req-exp-red" }),
  );
  assert.equal(
    response.status,
    404,
    "o requestId sozinho não pode decidir o tenant",
  );
}

// ── 5) Requisição não aprovada → 409, sem claim ───────────────────────────
{
  const response = await runExport(
    contexto(RED_OWNER, { clinicId: RED, requestId: "req-exp-pendente" }),
  );
  assert.equal(response.status, 409);
  assert.equal(
    ((await response.json()) as { code: string }).code,
    "REQUEST_NOT_APPROVED",
  );
  assert.equal(ledger("req-exp-pendente"), undefined);
}

// ── 6) Escopo de paciente é recusado explicitamente ───────────────────────
{
  const response = await runExport(
    contexto(RED_OWNER, { clinicId: RED, requestId: "req-exp-paciente" }),
  );
  assert.equal(response.status, 409);
  assert.equal(
    ((await response.json()) as { code: string }).code,
    "EXPORT_SCOPE_UNSUPPORTED",
  );
  assert.equal(ledger("req-exp-paciente"), undefined);
}

// ── 10) Falha de gravação: sem conclusão e sem artefato órfão ─────────────
{
  bucket.failPut = true;
  const response = await runExport(
    contexto(RED_OWNER, { clinicId: RED, requestId: "req-exp-falha" }),
  );
  assert.equal(response.status, 500);
  assert.equal(
    ((await response.json()) as { code: string }).code,
    "EXPORT_STORE_PUT_FAILED",
  );
  assert.equal(ledger("req-exp-falha")?.status, "failed");
  assert.equal(
    ledger("req-exp-falha")?.artifact_key,
    null,
    "nada pode ser registrado",
  );
  assert.equal(
    bucket.objects.size,
    0,
    "nenhum artefato órfão pode ficar no storage",
  );
  bucket.failPut = false;
}

// ── 7) Caminho feliz + 8) storage só com ciphertext ───────────────────────
{
  const response = await runExport(
    contexto(RED_OWNER, { clinicId: RED, requestId: "req-exp-red" }),
  );
  const raw = await response.text();
  assert.equal(response.status, 200, `esperava sucesso, veio ${raw}`);
  const body = JSON.parse(raw) as {
    ok: boolean;
    artifactKey: string;
    digestSha256: string;
    byteLength: number;
  };
  assert.equal(body.ok, true);
  assert.match(body.digestSha256, /^[0-9a-f]{64}$/);

  const job = ledger("req-exp-red");
  assert.equal(job?.status, "completed");
  assert.equal(
    job?.artifact_key,
    body.artifactKey,
    "o ledger aponta para o artefato entregue",
  );
  assert.equal(job?.artifact_digest_sha256, body.digestSha256);
  assert.equal(job?.artifact_byte_length, body.byteLength);

  const stored = bucket.objects.get(body.artifactKey);
  assert.ok(stored, "o artefato precisa existir no storage");
  const digest = await crypto.subtle.digest("SHA-256", stored);
  const digestHex = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  assert.equal(
    digestHex,
    body.digestSha256,
    "o digest precisa bater com o objeto efetivamente armazenado",
  );

  const texto = new TextDecoder().decode(stored);
  assert.ok(
    !texto.includes(NOME_RED),
    "o storage recebe ciphertext, nunca o dado em claro",
  );
  assert.ok(
    !texto.includes(NOME_BLUE),
    "nenhum dado de BLUE pode entrar no artefato de RED",
  );
  assert.ok(!texto.includes(BLUE_PATIENT), "nem o id de paciente de BLUE");
}

// ── 9) A trilha não carrega conteúdo clínico ──────────────────────────────
{
  const audit = sqlite
    .prepare(
      `SELECT * FROM saas_audit_log WHERE action = 'lgpd_export_executed'`,
    )
    .all() as Array<Record<string, unknown>>;
  assert.equal(audit.length, 1, "exportar precisa deixar trilha");
  assert.equal(audit[0].clinic_id, RED);
  const texto = JSON.stringify(audit[0]);
  assert.ok(
    !texto.includes(NOME_RED),
    "a trilha não pode carregar dado clínico",
  );
  assert.ok(
    !texto.includes(RED_PATIENT),
    "a trilha não pode expor o patient_id",
  );
}

// ── 11) Admin de plataforma exige reason declarada (AUTHZ-P1-08/LTB-19) ───
{
  // 11a) sem reason: recusado ANTES de sequer reivindicar o job.
  const semRazao = await runExport(
    contexto(PLATFORM_ADMIN, { clinicId: RED, requestId: "req-exp-admin" }),
  );
  assert.equal(
    semRazao.status,
    400,
    "admin de plataforma sem reason precisa ser recusado",
  );
  assert.equal(
    ((await semRazao.json()) as { code: string }).code,
    "REASON_REQUIRED",
  );
  assert.equal(
    ledger("req-exp-admin"),
    undefined,
    "sem reason, o job nem pode ser reivindicado",
  );

  // 11b) com reason: executa como o gestor comum, e a razão fica registrada
  // ANTES da exportação física.
  const response = await runExport(
    contexto(PLATFORM_ADMIN, {
      clinicId: RED,
      requestId: "req-exp-admin",
      reason: "Auditoria de plataforma solicitada pelo suporte, ticket 7734",
    }),
  );
  const raw = await response.text();
  assert.equal(
    response.status,
    200,
    `admin de plataforma deveria conseguir, veio ${raw}`,
  );
  assert.equal(ledger("req-exp-admin")?.status, "completed");

  const trilhaPrevia = sqlite
    .prepare(
      `SELECT clinic_id, actor_user_id, metadata_json FROM saas_audit_log
        WHERE action = 'platform_admin_run_export_initiated' AND target_id = ?`,
    )
    .get("req-exp-admin") as
    | { clinic_id: string; actor_user_id: string; metadata_json: string }
    | undefined;
  assert.ok(trilhaPrevia, "a razão do admin de plataforma precisa virar trilha");
  assert.equal(trilhaPrevia?.clinic_id, RED);
  assert.equal(trilhaPrevia?.actor_user_id, PLATFORM_ADMIN.id);
  assert.match(
    trilhaPrevia?.metadata_json ?? "",
    /ticket 7734/,
    "a metadata precisa carregar a razão declarada",
  );
}

// Uma lacuna conhecida não pode virar ledger completed nem artefato oficial.
{
  sqlite.prepare(`INSERT INTO live_documents
    (id, clinic_id, patient_id, author_user_id, document_type, origin)
    VALUES ('doc-synthetic-uncovered', ?, ?, ?, 'report', 'system')`)
    .run(RED, RED_PATIENT, RED_OWNER.id);
  criarRequest("req-exp-incomplete", RED, "clinic", null, "approved", RED_OWNER.id);
  const beforeObjects = bucket.objects.size;
  const response = await runExport(contexto(RED_OWNER, { clinicId: RED, requestId: "req-exp-incomplete" }));
  assert.equal(response.status, 409);
  assert.equal(((await response.json()) as { code: string }).code, "TENANT_EXPORT_INCOMPLETE");
  assert.equal(ledger("req-exp-incomplete")?.status, "failed");
  assert.equal(ledger("req-exp-incomplete")?.artifact_key, null);
  assert.equal(bucket.objects.size, beforeObjects, "sem escrita no bucket para export incompleto");
  sqlite.prepare("DELETE FROM live_documents WHERE id = 'doc-synthetic-uncovered'").run();
}

// Só ausência real de tabela é compatível com schema antigo. Falha de consulta
// não significa ausência de dados e precisa chegar ao ledger como falha.
{
  const bare = new Database(":memory:");
  const absent = await countExportUncoveredRows(new D1DatabaseMock(bare) as unknown as D1Database, RED);
  assert.ok(Object.values(absent).every((count) => count === 0));
  bare.exec("CREATE TABLE live_documents (id TEXT PRIMARY KEY)");
  await assert.rejects(() => countExportUncoveredRows(new D1DatabaseMock(bare) as unknown as D1Database, RED), /no such column/);
  bare.close();

  const unavailableDb = {
    prepare(sql: string) {
      if (sql.includes("SELECT COUNT(*) AS n FROM live_documents")) throw new Error("D1_ERROR: synthetic temporary failure");
      return db.prepare(sql);
    },
    batch: db.batch.bind(db),
  } as D1Database;
  criarRequest("req-exp-coverage-failure", RED, "clinic", null, "approved", RED_OWNER.id);
  const beforeObjects = bucket.objects.size;
  const response = await runExport(contexto(RED_OWNER, { clinicId: RED, requestId: "req-exp-coverage-failure" }, { ...env, DB: unavailableDb }));
  assert.equal(response.status, 503);
  assert.equal(((await response.json()) as { code: string }).code, "TENANT_EXPORT_COVERAGE_FAILED");
  assert.equal(ledger("req-exp-coverage-failure")?.status, "failed");
  assert.equal(ledger("req-exp-coverage-failure")?.artifact_key, null);
  assert.equal(bucket.objects.size, beforeObjects);
}

// Uma gravação entre consultas independentes não pode separar contagem e payload.
for (const enforceSyncLimits of [true, false]) {
  const id = "patient-red-during-export";
  const encrypted = await encryptClinicalJson(baseEnv as never, RED, `patient-profile:${id}`, { nome: "Concorrência sintética" });
  let written = false;
  const writeOnce = () => {
    if (written) return;
    written = true;
    sqlite.prepare(`INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted, encryption_version)
      VALUES (?, ?, ?, ?, 'k1')`).run(id, RED, RED_OWNER.id, encrypted);
  };
  const concurrentDb = {
    prepare(sql: string) {
      const wrap = (statement: D1PreparedStatement): D1PreparedStatement => new Proxy(statement, {
        get(target, key) {
          if (key === "bind") return (...values: unknown[]) => wrap(target.bind(...values));
          if (key === "first" && sql.includes("AS encrypted_bytes")) return async () => {
            const result = await target.first();
            writeOnce();
            return result;
          };
          const value = Reflect.get(target, key);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
      return wrap(db.prepare(sql));
    },
    async batch(statements: D1PreparedStatement[]) {
      const result = await db.batch(statements);
      writeOnce();
      return result;
    },
  } as D1Database;
  const result = await collectTenantExportPayload(concurrentDb, baseEnv as never, RED, { enforceSyncLimits });
  assert.ok(result.ok);
  if (!result.ok) throw new Error("snapshot export failed");
  assert.equal(written, true, "a gravação concorrente precisa ocorrer");
  assert.equal(result.counts.patients, (result.data.patients as unknown[]).length, "manifesto e pacientes pertencem ao mesmo snapshot");
  assert.equal(result.complete, true);
  assert.ok(Number.isFinite(Date.parse(String(result.data.snapshotAt))));
  sqlite.prepare("DELETE FROM live_patients WHERE id = ?").run(id);
}

sqlite.close();
console.log(
  "✓ lgpd-run-export-endpoint: sem bucket recusa antes do claim, RBAC e fronteira de tenant, escopo não suportado recusado, falha de storage sem artefato órfão, artefato cifrado com digest conferido contra o objeto armazenado, trilha sem conteúdo clínico e admin de plataforma exigindo reason com trilha prévia (AUTHZ-P1-08/LTB-19) — RED exportado, BLUE ausente",
);
