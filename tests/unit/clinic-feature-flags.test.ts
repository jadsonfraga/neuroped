import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import {
  clinicFeatureCatalog,
  clinicFeatureDefault,
  clinicFeatureKeys,
  isClinicFeatureKey,
  resolveClinicFeatures,
} from "../../shared/clinicFeatures";
import { isClinicFeatureEnabled } from "../../functions/api/tenant/_features";
import { PURGE_PRESERVED_TABLES } from "../../functions/api/live/governance/_purge";
import {
  onRequestGet as getFeatures,
  onRequestPatch as patchFeatures,
} from "../../functions/api/tenants/[id]/features";
import { onRequestPost as createScaleInvitation } from "../../functions/api/live/scale-invitations/index";
import { onRequestGet as publicGetScale } from "../../functions/api/public-scale";

/**
 * Feature flags por clínica, de ponta a ponta com dados sintéticos:
 * catálogo fail-closed → migração 0030 → rota de gestão (permissão +
 * auditoria) → porta na criação do convite remoto → porta na superfície
 * pública. A clínica vizinha nunca é afetada.
 */

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
  async batch(statements: D1StatementMock[]) {
    return this.db.transaction(() =>
      statements.map((statement) => {
        const raw = statement as unknown as { db: Database.Database; sql: string; values: unknown[] };
        const result = raw.db.prepare(raw.sql).run(...raw.values);
        return { success: true, meta: { changes: result.changes } };
      }),
    )();
  }
}

// ── 1) Catálogo ────────────────────────────────────────────────────────────
assert.deepEqual([...clinicFeatureKeys], ["remote_intake", "remote_scales"]);
assert.equal(new Set(clinicFeatureCatalog.map((entry) => entry.key)).size, clinicFeatureCatalog.length);
for (const entry of clinicFeatureCatalog) {
  assert.equal(entry.defaultEnabled, true, `${entry.key}: recurso pré-existente nasce ligado`);
  assert.ok(entry.label && entry.description);
}
for (const unknown of ["", "REMOTE_INTAKE", "ai_drafting", null, undefined, 1, {}]) {
  assert.equal(isClinicFeatureKey(unknown), false);
  assert.equal(clinicFeatureDefault(unknown), false, "chave desconhecida nunca está ligada");
}
{
  const resolved = resolveClinicFeatures([
    { key: "remote_intake", enabled: false, updatedAt: "2026-09-20T00:00:00.000Z" },
    { key: "ghost_flag", enabled: true, updatedAt: null },
  ]);
  assert.deepEqual(resolved.map((entry) => [entry.key, entry.enabled, entry.source]), [
    ["remote_intake", false, "clinic"],
    ["remote_scales", true, "default"],
  ]);
  assert.equal(resolved.some((entry) => (entry.key as string) === "ghost_flag"), false, "linha fora do catálogo é ignorada");
}
assert.ok(PURGE_PRESERVED_TABLES.includes("clinic_feature_flags"), "configuração da clínica é preservada no purge LGPD");

// ── 2) Schema sintético + migrações reais 0021/0023/0030 ─────────────────
const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL);
  CREATE TABLE clinics (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active');
  CREATE TABLE clinic_memberships (
    id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
  );
  CREATE TABLE billing_customers (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, status TEXT NOT NULL, trial_ends_at TEXT, grace_ends_at TEXT);
  CREATE TABLE billing_subscriptions (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, plan_id TEXT, status TEXT NOT NULL, updated_at TEXT NOT NULL);
  CREATE TABLE live_patients (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active');
  CREATE TABLE saas_audit_log (
    id TEXT PRIMARY KEY, clinic_id TEXT, actor_user_id TEXT NOT NULL, action TEXT NOT NULL,
    target_type TEXT NOT NULL, target_id TEXT, metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
sqlite.exec(readFileSync("db/migrations/0021_remote_scale_response.sql", "utf8"));
sqlite.exec(readFileSync("db/migrations/0023_public_submission_audit.sql", "utf8"));
sqlite.exec(readFileSync("db/migrations/0030_clinic_feature_flags.sql", "utf8"));
sqlite.exec(readFileSync("db/migrations/0030_clinic_feature_flags.sql", "utf8")); // idempotente
{
  const columns = sqlite.prepare("SELECT name FROM pragma_table_info('clinic_feature_flags')").all() as Array<{ name: string }>;
  assert.deepEqual(columns.map((column) => column.name), ["clinic_id", "flag_key", "enabled", "updated_by_user_id", "updated_at"]);
  assert.throws(
    () => sqlite.prepare("INSERT INTO clinic_feature_flags (clinic_id, flag_key, enabled) VALUES ('x', 'remote_intake', 2)").run(),
    /CHECK|FOREIGN KEY/,
    "enabled só aceita 0/1",
  );
}

const RED = "clinic-red-synthetic";
const BLUE = "clinic-blue-synthetic";
const OWNER_RED = "user-owner-red";
const PRO_RED = "user-pro-red";
const OWNER_BLUE = "user-owner-blue";
const PATIENT_RED = "patient-red-synthetic";
const PATIENT_BLUE = "patient-blue-synthetic";
const now = new Date().toISOString();
const future = new Date(Date.now() + 7 * 86_400_000).toISOString();

for (const [id, name] of [[OWNER_RED, "Owner Red"], [PRO_RED, "Pro Red"], [OWNER_BLUE, "Owner Blue"]]) {
  sqlite.prepare("INSERT INTO users VALUES (?, ?, ?, 'professional')").run(id, `${id}@example.test`, name);
}
for (const [clinic, owner, patient, color] of [[RED, OWNER_RED, PATIENT_RED, "Red"], [BLUE, OWNER_BLUE, PATIENT_BLUE, "Blue"]]) {
  sqlite.prepare("INSERT INTO clinics VALUES (?, ?, ?, 'active')").run(clinic, color, color.toLowerCase());
  sqlite.prepare("INSERT INTO clinic_memberships VALUES (?, ?, ?, 'owner', 1, ?)").run(`m-${clinic}-owner`, clinic, owner, now);
  sqlite.prepare("INSERT INTO billing_customers VALUES (?, ?, 'trial', ?, NULL)").run(`customer-${clinic}`, clinic, future);
  sqlite.prepare("INSERT INTO live_patients VALUES (?, ?, 'active')").run(patient, clinic);
}
sqlite.prepare("INSERT INTO clinic_memberships VALUES (?, ?, ?, 'professional', 1, ?)").run(`m-${RED}-pro`, RED, PRO_RED, now);

const env = {
  DB: new D1DatabaseMock(sqlite) as unknown as D1Database,
  CLINICAL_LIVE_ENABLED: "true",
  CLINICAL_DATA_KEY: "synthetic-data-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789",
  CLINICAL_DATA_KEY_ID: "k-synthetic-2026-09-26",
  CLINICAL_INDEX_KEY: "synthetic-index-key-9876543210-ZYXWVUTSRQPONMLKJIHGFEDCBA-9876543210",
};

function authUser(id: string) {
  return { id, email: `${id}@example.test`, name: id, role: "professional", mustChangePassword: false };
}
function tenantContext(method: string, userId: string | null, clinicId: string, body?: unknown) {
  return {
    env,
    data: userId ? { authUser: authUser(userId) } : {},
    params: { id: clinicId },
    request: new Request(`https://app.neuroped.example/api/tenants/${clinicId}/features`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  } as never;
}
function staffContext(userId: string, body: unknown) {
  return {
    env,
    data: { authUser: authUser(userId) },
    params: {},
    request: new Request("https://app.neuroped.example/api/live/scale-invitations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  } as never;
}
function publicContext(token: string) {
  return {
    env,
    data: {},
    params: {},
    request: new Request("https://app.neuroped.example/api/public-scale", { headers: { Authorization: `Scale ${token}` } }),
  } as never;
}
async function json(response: Response) {
  return JSON.parse(await response.text()) as {
    code?: string;
    token?: string;
    canManage?: boolean;
    features?: Array<{ key: string; enabled: boolean; source: string }>;
  };
}
function featureMap(body: Awaited<ReturnType<typeof json>>) {
  return Object.fromEntries((body.features ?? []).map((entry) => [entry.key, [entry.enabled, entry.source]]));
}

// ── 3) GET: membro lê padrões; não-membro e sem sessão são recusados ──────
assert.equal((await getFeatures(tenantContext("GET", null, RED))).status, 401);
assert.equal((await getFeatures(tenantContext("GET", OWNER_BLUE, RED))).status, 403);
assert.equal((await getFeatures(tenantContext("GET", OWNER_RED, "clinic-missing"))).status, 403);
{
  const asPro = await json(await getFeatures(tenantContext("GET", PRO_RED, RED)));
  assert.equal(asPro.canManage, false);
  assert.deepEqual(featureMap(asPro), { remote_intake: [true, "default"], remote_scales: [true, "default"] });
}

// ── 4) PATCH: só organization.manage; validação inteira ou nada ───────────
assert.equal((await patchFeatures(tenantContext("PATCH", PRO_RED, RED, { features: { remote_scales: false } }))).status, 403);
assert.equal((await patchFeatures(tenantContext("PATCH", OWNER_BLUE, RED, { features: { remote_scales: false } }))).status, 403);
for (const body of [
  {},
  { features: [] },
  { features: {} },
  { features: { ai_drafting: false } },
  { features: { remote_scales: "off" } },
  { features: { remote_intake: true, remote_scales: "off" } },
]) {
  const response = await patchFeatures(tenantContext("PATCH", OWNER_RED, RED, body));
  assert.equal(response.status, 400, JSON.stringify(body));
}
assert.equal(
  (sqlite.prepare("SELECT COUNT(*) AS n FROM clinic_feature_flags").get() as { n: number }).n,
  0,
  "pedido inválido não grava nada, nem parcialmente",
);

// ── 5) Convite remoto com a flag no padrão: criado; GET público responde ──
const created = await createScaleInvitation(
  staffContext(OWNER_RED, { clinicId: RED, patientId: PATIENT_RED, respondentKind: "family", scaleId: "mchat" }),
);
assert.equal(created.status, 201);
const redToken = (await json(created)).token as string;
assert.equal((await publicGetScale(publicContext(redToken))).status, 200);
const createdBlue = await createScaleInvitation(
  staffContext(OWNER_BLUE, { clinicId: BLUE, patientId: PATIENT_BLUE, respondentKind: "family", scaleId: "mchat" }),
);
assert.equal(createdBlue.status, 201);
const blueToken = (await json(createdBlue)).token as string;

// ── 6) Gestor da RED desliga questionários remotos ────────────────────────
{
  const response = await patchFeatures(tenantContext("PATCH", OWNER_RED, RED, { features: { remote_scales: false } }));
  assert.equal(response.status, 200);
  const body = await json(response);
  assert.equal(body.canManage, true);
  assert.deepEqual(featureMap(body), { remote_intake: [true, "default"], remote_scales: [false, "clinic"] });
  const audit = sqlite
    .prepare("SELECT action, target_type, target_id, metadata_json FROM saas_audit_log WHERE clinic_id = ? AND action = 'clinic_feature_update'")
    .all(RED) as Array<{ action: string; target_type: string; target_id: string; metadata_json: string }>;
  assert.equal(audit.length, 1, "toda mudança de flag entra na trilha da clínica");
  assert.equal(audit[0].target_id, "remote_scales");
  assert.deepEqual(JSON.parse(audit[0].metadata_json), { key: "remote_scales", enabled: false });
}
assert.equal(await isClinicFeatureEnabled(env.DB, RED, "remote_scales"), false);
assert.equal(await isClinicFeatureEnabled(env.DB, RED, "remote_intake"), true);
assert.equal(await isClinicFeatureEnabled(env.DB, BLUE, "remote_scales"), true, "vizinha intacta");

// Criação recusada na RED, permitida na BLUE; link já emitido da RED para de servir.
{
  const denied = await createScaleInvitation(
    staffContext(OWNER_RED, { clinicId: RED, patientId: PATIENT_RED, respondentKind: "family", scaleId: "mchat" }),
  );
  assert.equal(denied.status, 403);
  assert.equal((await json(denied)).code, "FEATURE_DISABLED");
  const count = sqlite.prepare("SELECT COUNT(*) AS n FROM live_scale_invitations WHERE clinic_id = ?").get(RED) as { n: number };
  assert.equal(count.n, 1, "recusa não cria linha");

  const gone = await publicGetScale(publicContext(redToken));
  assert.equal(gone.status, 410);
  assert.equal((await json(gone)).code, "FEATURE_DISABLED");
  assert.equal((await publicGetScale(publicContext(blueToken))).status, 200, "link da BLUE continua servindo");
  // Token inválido continua 404: a flag nunca vira oráculo de existência.
  assert.equal((await publicGetScale(publicContext("fake-id.".padEnd(48, "a")))).status, 404);
  assert.equal(
    (await createScaleInvitation(staffContext(OWNER_BLUE, { clinicId: BLUE, patientId: PATIENT_BLUE, respondentKind: "family", scaleId: "mchat" }))).status,
    201,
  );
}

// ── 7) Religar restaura; upsert não duplica linha ─────────────────────────
{
  const response = await patchFeatures(tenantContext("PATCH", OWNER_RED, RED, { features: { remote_scales: true, remote_intake: true } }));
  assert.equal(response.status, 200);
  assert.deepEqual(featureMap(await json(response)), { remote_intake: [true, "clinic"], remote_scales: [true, "clinic"] });
  const rows = sqlite.prepare("SELECT COUNT(*) AS n FROM clinic_feature_flags WHERE clinic_id = ?").get(RED) as { n: number };
  assert.equal(rows.n, 2);
  assert.equal((await publicGetScale(publicContext(redToken))).status, 200);
}

// A falha no segundo recurso ou na sua auditoria desfaz o pedido inteiro.
// Os triggers executam SQL real; nenhuma implementação de produção é substituída.
{
  const snapshot = () => ({
    flags: sqlite.prepare("SELECT * FROM clinic_feature_flags ORDER BY clinic_id, flag_key").all(),
    audit: sqlite.prepare("SELECT * FROM saas_audit_log ORDER BY id").all(),
  });
  for (const trigger of [
    "BEFORE UPDATE ON clinic_feature_flags WHEN NEW.flag_key = 'remote_scales'",
    "BEFORE INSERT ON saas_audit_log WHEN NEW.target_id = 'remote_scales' AND NEW.action = 'clinic_feature_update'",
  ]) {
    const before = snapshot();
    sqlite.exec(`CREATE TRIGGER synthetic_feature_failure ${trigger} BEGIN SELECT RAISE(ABORT, 'synthetic batch failure'); END`);
    try {
      const response = await patchFeatures(tenantContext("PATCH", OWNER_RED, RED, {
        features: { remote_intake: false, remote_scales: false },
      }));
      assert.equal(response.status, 500, "falha no banco nunca responde sucesso");
      assert.equal((await json(response)).code, "DB_ERROR");
      assert.deepEqual(snapshot(), before, "todas as flags e auditorias devem ser revertidas");
    } finally {
      sqlite.exec("DROP TRIGGER synthetic_feature_failure");
    }
  }
  const before = snapshot();
  const response = await patchFeatures(tenantContext("PATCH", OWNER_RED, RED, {
    features: { remote_intake: false, remote_scales: false },
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(featureMap(await json(response)), { remote_intake: [false, "clinic"], remote_scales: [false, "clinic"] });
  assert.equal(snapshot().audit.length, before.audit.length + 2, "sucesso audita ambos os recursos");
  assert.equal(await isClinicFeatureEnabled(env.DB, BLUE, "remote_scales"), true, "rollback e sucesso preservam a vizinha");
}

// ── 8) Tabela ausente (0030 ainda não aplicada) = padrões, nunca erro ─────
{
  const bare = new Database(":memory:");
  bare.exec("CREATE TABLE clinics (id TEXT PRIMARY KEY)");
  const bareDb = new D1DatabaseMock(bare) as unknown as D1Database;
  assert.equal(await isClinicFeatureEnabled(bareDb, RED, "remote_intake"), true);
  assert.equal(await isClinicFeatureEnabled(bareDb, RED, "ghost" as never), false);
  bare.close();
}

// ── 9) Trava estática: portas existem nas quatro superfícies ──────────────
for (const [file, key] of [
  ["functions/api/live/intake/index.ts", "remote_intake"],
  ["functions/api/public-intake.ts", "remote_intake"],
  ["functions/api/live/scale-invitations/index.ts", "remote_scales"],
  ["functions/api/public-scale.ts", "remote_scales"],
]) {
  const source = readFileSync(file, "utf8");
  assert.match(source, new RegExp(`isClinicFeatureEnabled\\(db, [a-zA-Z._]+, "${key}"\\)`), file);
  assert.match(source, /"FEATURE_DISABLED"/, file);
}
for (const file of ["functions/api/public-intake.ts", "functions/api/public-scale.ts"]) {
  const source = readFileSync(file, "utf8");
  const tokenCheck = source.indexOf("!resolved.tokenValid");
  const gate = source.indexOf('"FEATURE_DISABLED"');
  assert.ok(tokenCheck >= 0 && gate > tokenCheck, `${file}: a flag só é consultada depois do token válido`);
}

sqlite.close();
console.log("clinic-feature-flags: catálogo fail-closed, 0030, rota com permissão e auditoria, portas de criação e públicas, vizinha intacta OK");
