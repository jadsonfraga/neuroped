import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";

const read = (relative: string) =>
  readFileSync(new URL(`../../${relative}`, import.meta.url), "utf8");

const foundationMigration = read("db/migrations/0009_saas_phase1_foundation.sql");
const hardeningMigration = read("db/migrations/0010_saas_phase1_hardening.sql");
const tenantCore = read("functions/api/tenant/_core.ts");
const tenantsApi = read("functions/api/tenants/index.ts");
const membersApi = read("functions/api/tenants/[id]/members.ts");
const livePatientsApi = read("functions/api/live/patients/index.ts");
const liveEventsApi = read("functions/api/live/events/index.ts");
const migrationWorkflow = read(".github/workflows/saas-phase1-d1-migration.yml");

// Travas estáticas: autorização do handler não pode confundir "não conceder owner"
// com "poder demover owner". A mutação continua protegida fisicamente pelo D1.
assert.match(
  membersApi,
  /currentMembership\?\.active === 1[\s\S]{0,160}currentMembership\.role === "owner"[\s\S]{0,180}auth\.membership\.role !== "owner"/,
);
assert.match(membersApi, /Somente owner pode alterar o papel de outro owner/);
assert.match(membersApi, /otherActiveOwnerCount/);
assert.match(membersApi, /isLastOwnerConstraintError/);
assert.match(membersApi, /results\[0\]\?\.meta\?\.changes/);
assert.match(membersApi, /results\[1\]\?\.meta\?\.changes/);

// O papel global é teto de privilégio: uma membership clínica não pode elevar
// reader/operator para owner, clinic_admin ou professional.
assert.match(membersApi, /GLOBAL_CLINICAL_ROLES/);
assert.match(membersApi, /TENANT_CLINICAL_ROLES/);
assert.match(membersApi, /GLOBAL_ROLE_INCOMPATIBLE/);
assert.match(membersApi, /role AS global_role/);

// Timezone da clínica precisa ser um identificador operacional real.
assert.match(tenantsApi, /isValidTimeZone/);
assert.match(tenantsApi, /timezone deve ser um identificador IANA válido/);

// Clinical LIVE reutiliza o contrato canônico, não aceita provenance_source livre
// e mantém a cadeia de correções com estado explícito.
assert.match(liveEventsApi, /clinicalEventInputSchema/);
assert.match(liveEventsApi, /clinicalSources/);
assert.match(liveEventsApi, /PROVENANCE_SOURCES\.has\(provenanceSource\)/);
assert.match(liveEventsApi, /Evento canônico importado deve ser normalizado/);
assert.match(liveEventsApi, /SET status = 'corrected'/);
assert.match(liveEventsApi, /EVENT_ALREADY_SUPERSEDED/);
assert.match(liveEventsApi, /STALE_SUPERSESSION/);
assert.match(liveEventsApi, /payload clínico deve ser um objeto JSON/);
assert.match(liveEventsApi, /encounterId deve ser um identificador opaco/);
assert.doesNotMatch(liveEventsApi, /const provenanceSource = cleanText\(body\.provenanceSource, 240\)/);

// Auditoria não é uma segunda transação. O helper de #595 condiciona o INSERT
// a changes()=1; pacientes/eventos e agora memberships compõem tudo em D1.batch().
assert.match(tenantCore, /export function prepareSaasAudit/);
assert.match(tenantCore, /onlyIfPreviousChanged/);
assert.match(tenantCore, /WHERE changes\(\) = 1/);
assert.match(livePatientsApi, /prepareSaasAudit\([\s\S]{0,320}true/);
assert.match(livePatientsApi, /await db\.batch\(\[/);
assert.doesNotMatch(livePatientsApi, /await writeSaasAudit\(/);
assert.match(liveEventsApi, /prepareSaasAudit\(db, auditParams, true\)/);
assert.match(liveEventsApi, /await db\.batch\(/);
assert.doesNotMatch(liveEventsApi, /await writeSaasAudit\(/);
assert.match(membersApi, /prepareSaasAudit\([\s\S]{0,320}true/);
assert.match(membersApi, /auth\.db\.batch\(\[/);
assert.doesNotMatch(membersApi, /await writeSaasAudit\(/);

assert.match(hardeningMigration, /ux_live_clinical_events_supersedes_once/);
assert.match(hardeningMigration, /trg_clinic_memberships_keep_last_owner_update/);
assert.match(hardeningMigration, /trg_clinic_memberships_keep_last_owner_delete/);
assert.match(hardeningMigration, /trg_live_events_provenance_source_insert/);
assert.match(hardeningMigration, /INVALID_PROVENANCE_SOURCE/);
assert.match(migrationWorkflow, /0010_saas_phase1_hardening\.sql/);
assert.match(migrationWorkflow, /ux_live_clinical_events_supersedes_once/);
assert.match(migrationWorkflow, /saas-phase1-hardening\.test\.ts/);
assert.match(migrationWorkflow, /npm run verify/);
assert.match(migrationWorkflow, /Catraca completa antes de tocar no D1 remoto/);

// Prova as invariantes no próprio SQLite: elas não dependem de um único handler
// nem de um SELECT anterior que possa perder a corrida.
const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    role TEXT,
    is_active INTEGER DEFAULT 1
  );
`);
db.exec(foundationMigration);
db.exec(hardeningMigration);

const insertUser = db.prepare(
  "INSERT INTO users (id, name, email, role, is_active) VALUES (?, ?, ?, ?, 1)",
);
insertUser.run("u1", "Owner 1", "owner1@example.test", "professional");
insertUser.run("u2", "Owner 2", "owner2@example.test", "professional");
insertUser.run("u3", "Admin", "admin@example.test", "professional");

db.prepare(
  `INSERT INTO clinics
    (id, slug, name, timezone, status, created_by_user_id)
   VALUES ('c1', 'clinica-teste', 'Clínica Teste', 'America/Recife', 'active', 'u1')`,
).run();

db.prepare(
  `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, invited_by_user_id)
   VALUES ('c1', 'u1', 'owner', 1, 'u1')`,
).run();
db.prepare(
  `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, invited_by_user_id)
   VALUES ('c1', 'u3', 'clinic_admin', 1, 'u1')`,
).run();

assert.throws(
  () => db.prepare("UPDATE clinic_memberships SET role = 'professional' WHERE clinic_id = 'c1' AND user_id = 'u1'").run(),
  /LAST_OWNER_PROTECTED/,
  "nem corrida nem endpoint alternativo pode demover o último owner",
);

db.prepare(
  `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, invited_by_user_id)
   VALUES ('c1', 'u2', 'owner', 1, 'u1')`,
).run();
db.prepare("UPDATE clinic_memberships SET role = 'professional' WHERE clinic_id = 'c1' AND user_id = 'u1'").run();
assert.throws(
  () => db.prepare("DELETE FROM clinic_memberships WHERE clinic_id = 'c1' AND user_id = 'u2'").run(),
  /LAST_OWNER_PROTECTED/,
  "remoção física também preserva o último owner",
);

db.prepare("UPDATE clinic_memberships SET role = 'owner', active = 1 WHERE clinic_id = 'c1' AND user_id = 'u1'").run();
db.prepare("DELETE FROM clinic_memberships WHERE clinic_id = 'c1' AND user_id = 'u2'").run();

// Dados clínicos sintéticos mínimos para testar provenance e cadeia de correções.
db.prepare(
  `INSERT INTO live_patients
    (id, clinic_id, created_by_user_id, profile_encrypted, encryption_version, status)
   VALUES ('p1', 'c1', 'u1', 'ciphertext', 'clinical-v1:k1', 'active')`,
).run();

const insertEvent = db.prepare(
  `INSERT INTO live_clinical_events
    (id, clinic_id, patient_id, author_user_id, event_type, occurred_at,
     provenance_kind, provenance_source, payload_encrypted, encryption_version,
     supersedes_event_id, status)
   VALUES (?, 'c1', 'p1', 'u1', 'observation', '2026-08-12T08:00:00.000Z',
           'observed', ?, 'ciphertext', 'clinical-v1:k1', ?, 'active')`,
);

assert.throws(
  () => insertEvent.run("bad-source", "mãe de paciente identificável", null),
  /INVALID_PROVENANCE_SOURCE/,
  "texto livre/PII não atravessa provenance_source em plaintext",
);
insertEvent.run("e1", "clinician", null);
insertEvent.run("e2", "clinician", "e1");
assert.throws(
  () => insertEvent.run("e3", "clinician", "e1"),
  /UNIQUE constraint failed/,
  "um evento só pode ter um sucessor direto",
);

db.close();
console.log("✓ SaaS hardening: owner, provenance, atomicidade, roles e supersessão protegidos");
