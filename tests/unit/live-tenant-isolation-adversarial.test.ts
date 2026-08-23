import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { resolveBillingClinicId } from "../../functions/api/billing/_guard";
import {
  onRequestDelete as deletePatient,
  onRequestGet as getPatient,
  onRequestPatch as patchPatient,
} from "../../functions/api/live/patients/[id]";
import { encryptClinicalJson } from "../../functions/api/tenant/_crypto";

const TENANT_RED = "tenant-red-synthetic";
const TENANT_BLUE = "tenant-blue-synthetic";
const USER_RED = "user-red-synthetic";
const USER_BLUE = "user-blue-synthetic";
const PATIENT_RED = "patient-red-known-uuid";
const PATIENT_BLUE = "patient-blue-known-uuid";

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
    return this.db.transaction(() => statements.map((statement) => {
      // Os handlers aguardam o resultado depois do batch. O mock precisa manter
      // `changes()` na mesma conexão e ordem; portanto reproduzimos o statement
      // de forma síncrona pela implementação interna abaixo.
      const raw = statement as unknown as {
        db: Database.Database;
        sql: string;
        values: unknown[];
      };
      const result = raw.db.prepare(raw.sql).run(...raw.values);
      return { success: true, meta: { changes: result.changes } };
    }))();
  }
}

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL
  );
  CREATE TABLE clinics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE clinic_memberships (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE TABLE billing_customers (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    status TEXT NOT NULL,
    trial_ends_at TEXT,
    grace_ends_at TEXT
  );
  CREATE TABLE billing_subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    plan_id TEXT,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE live_patients (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    primary_professional_user_id TEXT,
    external_reference_hash TEXT,
    patient_identity_hash TEXT,
    profile_encrypted TEXT NOT NULL,
    encryption_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE saas_audit_log (
    id TEXT PRIMARY KEY,
    clinic_id TEXT,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const now = new Date().toISOString();
const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
for (const [tenant, user, color] of [
  [TENANT_RED, USER_RED, "RED"],
  [TENANT_BLUE, USER_BLUE, "BLUE"],
] as const) {
  sqlite.prepare("INSERT INTO users VALUES (?, ?, ?, 'professional')")
    .run(user, `${color.toLowerCase()}@example.test`, `User ${color}`);
  sqlite.prepare("INSERT INTO clinics VALUES (?, ?, ?, 'active')")
    .run(tenant, `Tenant ${color} Synthetic`, tenant);
  sqlite.prepare("INSERT INTO clinic_memberships VALUES (?, ?, ?, 'professional', 1, ?)")
    .run(`membership-${color}`, tenant, user, now);
  sqlite.prepare("INSERT INTO billing_customers VALUES (?, ?, 'trial', ?, NULL)")
    .run(`customer-${color}`, tenant, future);
}

const env = {
  DB: new D1DatabaseMock(sqlite) as unknown as D1Database,
  CLINICAL_LIVE_ENABLED: "true",
  CLINICAL_DATA_KEY: "production-readiness-data-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  CLINICAL_DATA_KEY_ID: "k-pr-2026-08-23",
  CLINICAL_INDEX_KEY: "production-readiness-index-key-9876543210-ZYXWVUTSRQPONMLKJIHGFEDCBA",
};

for (const [tenant, patient, color] of [
  [TENANT_RED, PATIENT_RED, "RED"],
  [TENANT_BLUE, PATIENT_BLUE, "BLUE"],
] as const) {
  const profile = {
    name: `Sentinela ${color}`,
    birthDate: "2020-01-01",
    guardianName: null,
    guardianPhone: null,
    diagnosisCode: null,
    notes: `synthetic-${color.toLowerCase()}`,
  };
  const encrypted = await encryptClinicalJson(env, tenant, `patient-profile:${patient}`, profile);
  sqlite.prepare(`
    INSERT INTO live_patients
      (id, clinic_id, profile_encrypted, encryption_version, status, created_at, updated_at)
    VALUES (?, ?, ?, 'clinical-v1:k-pr-2026-08-23', 'active', ?, ?)
  `).run(patient, tenant, encrypted, now, now);
}

const redUser = {
  id: USER_RED,
  email: "red@example.test",
  name: "User RED",
  role: "professional",
  mustChangePassword: false,
};

function context(method: string, url: string, patientId: string, body?: unknown) {
  return {
    env,
    data: { authUser: redUser },
    params: { id: patientId },
    request: new Request(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  } as never;
}

async function body(response: Response) {
  return JSON.parse(await response.text()) as Record<string, unknown>;
}

// 1) Header spoofing: RED nunca resolve BLUE como tenant válido.
const spoofed = await resolveBillingClinicId(
  env.DB,
  USER_RED,
  new Request("https://example.test/api/live/patients", {
    headers: { "x-clinic-id": TENANT_BLUE },
  }),
);
assert.equal(spoofed, null, "RED não pode selecionar BLUE apenas forjando x-clinic-id");

// 2) UUID conhecido: RED consulta o UUID BLUE sob seu tenant legítimo => 404.
const getCross = await getPatient(context(
  "GET",
  `https://example.test/api/live/patients/${PATIENT_BLUE}?clinicId=${TENANT_RED}`,
  PATIENT_BLUE,
));
assert.equal(getCross.status, 404);
assert.equal((await body(getCross)).code, "PATIENT_NOT_FOUND");

// 3) UUID conhecido + clinicId BLUE => membership falha antes de decriptar.
const getBlueContext = await getPatient(context(
  "GET",
  `https://example.test/api/live/patients/${PATIENT_BLUE}?clinicId=${TENANT_BLUE}`,
  PATIENT_BLUE,
));
assert.equal(getBlueContext.status, 403);
assert.equal((await body(getBlueContext)).code, "TENANT_FORBIDDEN");

// 4) PATCH direto não altera registro BLUE.
const blueBefore = sqlite.prepare("SELECT profile_encrypted, updated_at FROM live_patients WHERE id = ?")
  .get(PATIENT_BLUE) as { profile_encrypted: string; updated_at: string };
const patchCross = await patchPatient(context(
  "PATCH",
  `https://example.test/api/live/patients/${PATIENT_BLUE}`,
  PATIENT_BLUE,
  { clinicId: TENANT_RED, name: "Tentativa RED" },
));
assert.equal(patchCross.status, 404);
const blueAfterPatch = sqlite.prepare("SELECT profile_encrypted, updated_at FROM live_patients WHERE id = ?")
  .get(PATIENT_BLUE) as { profile_encrypted: string; updated_at: string };
assert.deepEqual(blueAfterPatch, blueBefore, "PATCH cross-tenant não pode tocar ciphertext nem timestamp BLUE");

// 5) DELETE/archive direto não altera status BLUE.
const deleteCross = await deletePatient(context(
  "DELETE",
  `https://example.test/api/live/patients/${PATIENT_BLUE}?clinicId=${TENANT_RED}`,
  PATIENT_BLUE,
));
assert.equal(deleteCross.status, 404);
assert.equal(
  (sqlite.prepare("SELECT status FROM live_patients WHERE id = ?").get(PATIENT_BLUE) as { status: string }).status,
  "active",
);

// 6) Controle positivo: RED lê seu próprio sentinela, provando que 404 acima não
// é falha genérica do fixture.
const getOwn = await getPatient(context(
  "GET",
  `https://example.test/api/live/patients/${PATIENT_RED}?clinicId=${TENANT_RED}`,
  PATIENT_RED,
));
assert.equal(getOwn.status, 200);
const ownPayload = await body(getOwn);
assert.equal(ownPayload.clinicId, TENANT_RED);
assert.equal((ownPayload.profile as { name: string }).name, "Sentinela RED");

// 7) Recursos subordinados: contrato obrigatório clinic + patient/request ID.
const sources = {
  patients: readFileSync("functions/api/live/patients/[id].ts", "utf8"),
  events: readFileSync("functions/api/live/events/index.ts", "utf8"),
  assessments: readFileSync("functions/api/live/assessments/index.ts", "utf8"),
  documents: readFileSync("functions/api/live/documents/index.ts", "utf8"),
  governance: readFileSync("functions/api/live/governance/index.ts", "utf8"),
};

assert.match(sources.patients, /FROM live_patients WHERE id = \? AND clinic_id = \?/);
for (const name of ["events", "assessments", "documents"] as const) {
  const source = sources[name];
  assert.match(source, /getClinicMembership/);
  assert.match(source, /requireBillingEntitlement/);
  assert.match(source, /patientBelongsToClinic/);
  assert.match(source, /clinic_id = \? AND patient_id = \?/);
}
assert.match(sources.events, /WHERE id = \? AND clinic_id = \? AND patient_id = \?/);
assert.match(sources.assessments, /WHERE id = \? AND clinic_id = \? AND patient_id = \?/);
assert.match(sources.documents, /WHERE id = \? AND clinic_id = \?/);
assert.match(sources.governance, /WHERE clinic_id = \?/);
assert.match(sources.governance, /WHERE id = \? AND clinic_id = \?/);
assert.match(sources.governance, /Paciente não encontrado nesta clínica/);

// 8) O próprio banco mantém barreiras adicionais para tabelas LIVE subordinadas.
const migration = readFileSync("db/migrations/0014_saas_tenant_lifecycle.sql", "utf8");
for (const trigger of [
  "LIVE_ASSESSMENT_PATIENT_TENANT_MISMATCH",
  "LIVE_ASSESSMENT_SUPERSESSION_TENANT_MISMATCH",
  "LIVE_ASSESSMENT_RESPONSE_TENANT_MISMATCH",
  "LIVE_DOCUMENT_PATIENT_TENANT_MISMATCH",
  "LIVE_DOCUMENT_VERSION_TENANT_MISMATCH",
  "LIVE_EXPORT_PATIENT_TENANT_MISMATCH",
  "LIVE_DELETION_PATIENT_TENANT_MISMATCH",
]) {
  assert.ok(migration.includes(trigger), `trigger tenant ausente: ${trigger}`);
}

// 9) Cache/memória: o contexto é esvaziado antes da limpeza e o novo tenant só é
// ativado depois de cancelar/limpar todas as queries. Logout/login também destrói
// Query cache e o cofre persistente.
const clinicContext = readFileSync("client/src/contexts/ClinicContext.tsx", "utf8");
const authContext = readFileSync("client/src/contexts/AuthContext.tsx", "utf8");
assert.match(
  clinicContext,
  /async function clearClinicalClientCaches\(\)[\s\S]*queryClient\.cancelQueries\(\)[\s\S]*queryClient\.clear\(\)/,
);
assert.match(
  clinicContext,
  /setActiveClinicIdState\(null\)[\s\S]*persistClinicId\(null\)[\s\S]*await clearClinicalClientCaches\(\)[\s\S]*setActiveClinicIdState\(clinicId\)[\s\S]*persistClinicId\(clinicId\)/,
);
assert.match(authContext, /queryClient\.clear\(\)/);
assert.match(authContext, /secureClearAll\(\)/);

sqlite.close();
console.log("✓ TENANT_RED × TENANT_BLUE: header spoof, GET, PATCH, DELETE, subordinados e cache fail-closed");
