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
 *     (AUTHZ-P1-08/LTB-19);
 * 12. S12B — os oito domínios que antes faziam o export recusar por
 *     incompleto (avaliações e respostas, documentos e versões, intake e
 *     escala remota com convite e resposta) agora saem decifrados no
 *     payload, `complete` permanece true, BLUE nunca aparece no export de
 *     RED, e token_hash nunca é exportado (nem cifrado nem em claro).
 *     clinic_settings e live_retention_policies (pedidos no backlog
 *     original de S12B, corrigido em revisão) também saem no payload.
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

// S12B (2026-09-26): documentos, avaliações, intake e escala remota deixaram
// de ser uma lacuna do export. Prova RED/BLUE nos oito domínios de uma vez:
// nenhum bloqueia mais o export por incompletude, o conteúdo decifrado sai
// no payload de RED, nada de BLUE aparece, e token_hash nunca é exportado.
async function semearDominiosS12b(clinicId: string, patientId: string, ownerId: string, marcador: string) {
  const id = (dominio: string) => `${dominio}-${marcador}`;
  sqlite.prepare(`INSERT INTO live_assessments
    (id, clinic_id, patient_id, instrument_id, instrument_version, applied_by_user_id, applied_at, provenance_source, payload_encrypted)
    VALUES (?, ?, ?, 'mchat', 'v1', ?, ?, 'clinician', ?)`)
    .run(id("assess"), clinicId, patientId, ownerId, NOW,
      await encryptClinicalJson(baseEnv as never, clinicId, `assessment:${id("assess")}`, { marcador }));
  sqlite.prepare(`INSERT INTO live_assessment_responses
    (id, clinic_id, patient_id, assessment_id, item_id, item_position, response_encrypted)
    VALUES (?, ?, ?, ?, 'item-1', 1, ?)`)
    .run(id("resp"), clinicId, patientId, id("assess"),
      await encryptClinicalJson(baseEnv as never, clinicId, `assessment-response:${id("resp")}`, { marcador }));
  sqlite.prepare(`INSERT INTO live_documents
    (id, clinic_id, patient_id, author_user_id, document_type, origin)
    VALUES (?, ?, ?, ?, 'report', 'system')`)
    .run(id("doc"), clinicId, patientId, ownerId);
  sqlite.prepare(`INSERT INTO live_document_versions
    (id, clinic_id, document_id, patient_id, author_user_id, version, content_encrypted, encryption_version, origin, issued_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, 'k1', 'system', ?)`)
    .run(id("docver"), clinicId, id("doc"), patientId, ownerId,
      await encryptClinicalJson(baseEnv as never, clinicId, `document-version:${id("docver")}`, { marcador }), NOW);
  sqlite.prepare(`INSERT INTO live_intake_invitations
    (id, clinic_id, patient_id, created_by_user_id, respondent_kind, form_kind, form_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?, 'family', 'pre_consulta', 'form-1', ?, ?)`)
    .run(id("intake-inv"), clinicId, patientId, ownerId, `hash-${marcador}`, "2099-01-01T00:00:00.000Z");
  sqlite.prepare(`INSERT INTO live_intake_submissions
    (id, invitation_id, clinic_id, patient_id, respondent_kind, form_kind, form_id, payload_encrypted, encryption_version, consent_notice_version, consented_at, submitted_at)
    VALUES (?, ?, ?, ?, 'family', 'pre_consulta', 'form-1', ?, 'v1', 'consent-v1', ?, ?)`)
    .run(id("intake-sub"), id("intake-inv"), clinicId, patientId,
      await encryptClinicalJson(baseEnv as never, clinicId, `remote-intake-submission:${id("intake-sub")}`, { marcador }), NOW, NOW);
  sqlite.prepare(`INSERT INTO live_scale_invitations
    (id, clinic_id, patient_id, created_by_user_id, respondent_kind, scale_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?, 'family', 'mchat', ?, ?)`)
    .run(id("scale-inv"), clinicId, patientId, ownerId, `hash-${marcador}`, "2099-01-01T00:00:00.000Z");
  sqlite.prepare(`INSERT INTO live_scale_responses
    (id, invitation_id, clinic_id, patient_id, respondent_kind, scale_id, answers_encrypted, encryption_version, consent_notice_version, consented_at, submitted_at)
    VALUES (?, ?, ?, ?, 'family', 'mchat', ?, 'v1', 'consent-v1', ?, ?)`)
    .run(id("scale-resp"), id("scale-inv"), clinicId, patientId,
      await encryptClinicalJson(baseEnv as never, clinicId, `remote-scale-response:${id("scale-resp")}`, { marcador }), NOW, NOW);
  // Correção de escopo pedida em revisão: clinic_settings/live_retention_policies
  // (plaintext, não bloqueiam purge) também precisam sair no export.
  sqlite.prepare(`INSERT INTO clinic_settings
    (clinic_id, display_name, updated_by_user_id) VALUES (?, ?, ?)`)
    .run(clinicId, `Timbre ${marcador}`, ownerId);
  sqlite.prepare(`INSERT INTO live_retention_policies
    (id, clinic_id, retention_days, auto_delete_enabled, configured_by_user_id)
    VALUES (?, ?, 90, 1, ?)`)
    .run(id("retention"), clinicId, ownerId);
}

{
  await semearDominiosS12b(RED, RED_PATIENT, RED_OWNER.id, "vermelho-s12b");
  await semearDominiosS12b(BLUE, BLUE_PATIENT, BLUE_OWNER.id, "azul-s12b");

  criarRequest("req-exp-s12b", RED, "clinic", null, "approved", RED_OWNER.id);
  const response = await runExport(contexto(RED_OWNER, { clinicId: RED, requestId: "req-exp-s12b" }));
  const raw = await response.text();
  assert.equal(response.status, 200, `os oito domínios não podem mais bloquear o export, veio ${raw}`);
  assert.equal(ledger("req-exp-s12b")?.status, "completed");

  const collected = await collectTenantExportPayload(db, baseEnv as never, RED, { enforceSyncLimits: false });
  assert.ok(collected.ok);
  if (!collected.ok) throw new Error("export deveria ter sucesso");
  assert.equal(collected.complete, true, "S12B: nenhum domínio deveria ficar fora do manifesto");
  assert.deepEqual(collected.uncoveredCounts, {});

  const payloadText = JSON.stringify(collected.data);
  assert.doesNotMatch(payloadText, /azul-s12b/, "nenhum dado de BLUE pode aparecer no export de RED");
  assert.doesNotMatch(payloadText, /token_hash|hash-vermelho-s12b|hash-azul-s12b/, "token_hash nunca é exportado, nem cifrado nem em claro");

  const assessments = collected.data.assessments as Array<{ id: string; payload: unknown }>;
  assert.deepEqual(assessments.find((a) => a.id === "assess-vermelho-s12b")?.payload, { marcador: "vermelho-s12b" });
  const assessmentResponses = collected.data.assessmentResponses as Array<{ id: string; response: unknown }>;
  assert.deepEqual(assessmentResponses.find((r) => r.id === "resp-vermelho-s12b")?.response, { marcador: "vermelho-s12b" });
  const documents = collected.data.documents as Array<{ id: string }>;
  assert.ok(documents.some((d) => d.id === "doc-vermelho-s12b"));
  const documentVersions = collected.data.documentVersions as Array<{ id: string; content: unknown }>;
  assert.deepEqual(documentVersions.find((v) => v.id === "docver-vermelho-s12b")?.content, { marcador: "vermelho-s12b" });
  const intakeInvitations = collected.data.intakeInvitations as Array<{ id: string }>;
  assert.ok(intakeInvitations.some((i) => i.id === "intake-inv-vermelho-s12b"));
  const intakeSubmissions = collected.data.intakeSubmissions as Array<{ id: string; payload: unknown }>;
  assert.deepEqual(intakeSubmissions.find((s) => s.id === "intake-sub-vermelho-s12b")?.payload, { marcador: "vermelho-s12b" });
  const scaleInvitations = collected.data.scaleInvitations as Array<{ id: string }>;
  assert.ok(scaleInvitations.some((i) => i.id === "scale-inv-vermelho-s12b"));
  const scaleResponses = collected.data.scaleResponses as Array<{ id: string; answers: unknown }>;
  assert.deepEqual(scaleResponses.find((r) => r.id === "scale-resp-vermelho-s12b")?.answers, { marcador: "vermelho-s12b" });

  const clinicSettings = collected.data.clinicSettings as { displayName: string } | null;
  assert.equal(clinicSettings?.displayName, "Timbre vermelho-s12b", "o timbre de RED precisa sair no export de RED");
  const retentionPolicy = collected.data.retentionPolicy as { retentionDays: number; autoDeleteEnabled: boolean; configuredByUserId: string } | null;
  assert.equal(retentionPolicy?.retentionDays, 90);
  assert.equal(retentionPolicy?.autoDeleteEnabled, true);
  assert.equal(retentionPolicy?.configuredByUserId, RED_OWNER.id);

  for (const table of [
    "live_scale_responses", "live_scale_invitations", "live_intake_submissions", "live_intake_invitations",
    "live_document_versions", "live_documents", "live_assessment_responses", "live_assessments",
    "clinic_settings", "live_retention_policies",
  ]) {
    sqlite.prepare(`DELETE FROM ${table} WHERE clinic_id IN (?, ?)`).run(RED, BLUE);
  }
}

// Só ausência real de tabela é compatível com schema antigo. Falha de consulta
// não significa ausência de dados e precisa chegar ao ledger como falha.
// EXPORT_UNCOVERED_CLINIC_TABLES está vazia hoje (S12B cobriu os oito
// domínios que a compunham) — a lista é passada explicitamente aqui só para
// continuar provando as duas ramificações de erro da função genérica.
{
  const bare = new Database(":memory:");
  const absent = await countExportUncoveredRows(new D1DatabaseMock(bare) as unknown as D1Database, RED, ["live_documents"]);
  assert.deepEqual(absent, { live_documents: 0 });
  bare.exec("CREATE TABLE live_documents (id TEXT PRIMARY KEY)");
  await assert.rejects(
    () => countExportUncoveredRows(new D1DatabaseMock(bare) as unknown as D1Database, RED, ["live_documents"]),
    /no such column/,
  );
  bare.close();

  const unavailableDb = {
    prepare(sql: string) {
      if (sql.includes("FROM live_documents WHERE clinic_id = ?")) throw new Error("D1_ERROR: synthetic temporary failure");
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
