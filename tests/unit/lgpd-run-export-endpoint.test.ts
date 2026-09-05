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
 * 10. falha de gravação no storage não conclui o job nem deixa artefato órfão.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";
import { onRequestPost as runExport } from "../../functions/api/live/governance/run-export";
import { encryptClinicalJson } from "../../functions/api/tenant/_crypto";

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

sqlite.close();
console.log(
  "✓ lgpd-run-export-endpoint: sem bucket recusa antes do claim, RBAC e fronteira de tenant, escopo não suportado recusado, falha de storage sem artefato órfão, artefato cifrado com digest conferido contra o objeto armazenado e trilha sem conteúdo clínico — RED exportado, BLUE ausente",
);
