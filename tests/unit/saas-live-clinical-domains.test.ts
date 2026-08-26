import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root, "db/migrations/0014_saas_tenant_lifecycle.sql"), "utf8");
const assessments = fs.readFileSync(path.join(root, "functions/api/live/assessments/index.ts"), "utf8");
const documents = fs.readFileSync(path.join(root, "functions/api/live/documents/index.ts"), "utf8");
const governance = fs.readFileSync(path.join(root, "functions/api/live/governance/index.ts"), "utf8");
const events = fs.readFileSync(path.join(root, "functions/api/live/events/index.ts"), "utf8");
const clientContext = fs.readFileSync(path.join(root, "client/src/contexts/ClinicContext.tsx"), "utf8");
const patientsPage = fs.readFileSync(path.join(root, "client/src/pages/pacientes.tsx"), "utf8");
const patientDetailPage = fs.readFileSync(path.join(root, "client/src/pages/paciente-detalhe.tsx"), "utf8");
const prontuarioPage = fs.readFileSync(path.join(root, "client/src/pages/prontuario.tsx"), "utf8");
const scaleSaver = fs.readFileSync(path.join(root, "client/src/components/SaveToPatient.tsx"), "utf8");
const invitations = fs.readFileSync(path.join(root, "functions/api/billing/invitations.ts"), "utf8");
const commandPalette = fs.readFileSync(path.join(root, "client/src/components/CommandPalette.tsx"), "utf8");
const agendaPage = fs.readFileSync(path.join(root, "client/src/pages/agenda.tsx"), "utf8");
const prescriptionPage = fs.readFileSync(path.join(root, "client/src/pages/receita-c1.tsx"), "utf8");
const familyPortalPage = fs.readFileSync(path.join(root, "client/src/pages/portal-familia.tsx"), "utf8");
const persistencePolicy = fs.readFileSync(
  path.join(root, "client/src/lib/clinicalBrowserPersistencePolicy.ts"),
  "utf8",
);

for (const table of [
  "live_assessments",
  "live_assessment_responses",
  "live_documents",
  "live_document_versions",
  "live_retention_policies",
  "live_export_requests",
  "live_deletion_requests",
]) {
  assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
}
assert.doesNotMatch(
  migration,
  /\b(?:CREATE|ALTER|INSERT INTO|UPDATE|DELETE FROM)\s+\w*_demo\b/i,
  "a migração LIVE não pode executar SQL contra tabelas DEMO",
);
assert.match(migration, /clinic_id TEXT NOT NULL REFERENCES clinics\(id\)/);
assert.match(migration, /content_encrypted TEXT NOT NULL/);
assert.match(migration, /response_encrypted TEXT NOT NULL/);
assert.match(migration, /UNIQUE \(document_id, version\)/);
assert.match(migration, /LIVE_DOCUMENT_VERSION_IMMUTABLE/);
assert.match(migration, /LIVE_ASSESSMENT_IMMUTABLE/);
assert.match(migration, /LIVE_ASSESSMENT_RESPONSE_IMMUTABLE/);
assert.match(migration, /LIVE_ASSESSMENT_SUPERSESSION_TENANT_MISMATCH/);
assert.match(migration, /LIVE_DOCUMENT_VERSION_TENANT_MISMATCH/);
assert.match(migration, /LIVE_EXPORT_PATIENT_TENANT_MISMATCH/);
assert.match(migration, /LIVE_DELETION_PATIENT_TENANT_MISMATCH/);

for (const source of [events, assessments, documents, governance]) {
  assert.match(source, /requireBillingEntitlement/);
}
for (const source of [assessments, documents]) {
  assert.match(source, /getClinicMembership/);
  assert.match(source, /membershipCanReadClinical/);
  assert.match(source, /membershipCanWriteClinical/);
  assert.match(source, /encryptClinicalJson/);
  assert.match(source, /decryptClinicalJson/);
  assert.match(source, /prepareSaasAudit/);
  assert.match(source, /CLINICAL_LIVE_DISABLED/);
  assert.match(source, /CLINICAL_CRYPTO_NOT_CONFIGURED/);
}
assert.match(governance, /live_retention_policies/);
assert.match(governance, /requested.*approved.*processing.*completed.*rejected/s);
assert.match(governance, /physicalDeletionAutomatic: false/);
assert.match(events, /import \{ z \} from "zod"/);
assert.match(clientContext, /queryClient\.clear\(\)/);
assert.match(clientContext, /sessionStorage/);
assert.doesNotMatch(clientContext, /localStorage/);
for (const source of [patientsPage, patientDetailPage, prontuarioPage, scaleSaver]) {
  assert.match(source, /isRemoteClinical/);
  assert.match(source, /\/api\/live\//);
}
assert.match(prontuarioPage, /provenanceKind: "documented"/);
assert.match(scaleSaver, /instrumentVersion: "client-v1"/);
assert.match(scaleSaver, /\/api\/live\/documents/);
assert.match(invitations, /buildInvitationUrl/);
assert.match(invitations, /ONBOARDING_BASE_URL_NOT_CONFIGURED/);
assert.match(invitations, /invitationUrl/);
assert.doesNotMatch(invitations, /https:\/\/superneuroped\.vercel\.app/);

for (const source of [commandPalette, agendaPage, prescriptionPage]) {
  assert.match(source, /\/api\/live\/patients/);
  assert.match(source, /useClinic/);
}
assert.match(prescriptionPage, /currentAppSearchParams/);
assert.match(familyPortalPage, /\/api\/live\/documents/);
assert.match(familyPortalPage, /familyVisibility === true/);
assert.match(patientDetailPage, /!isRemoteClinical[\s\S]*<PatientCockpit/);
assert.match(persistencePolicy, /"\/conecta"/);
assert.match(persistencePolicy, /"\/memoria-clinica"/);

const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY);
  CREATE TABLE clinics (id TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'active');
  CREATE TABLE live_patients (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id),
    status TEXT NOT NULL DEFAULT 'active'
  );
`);
db.exec(migration);
db.prepare("INSERT INTO users (id) VALUES (?)").run("u1");
db.prepare("INSERT INTO clinics (id) VALUES (?), (?)").run("c1", "c2");
db.prepare("INSERT INTO live_patients (id, clinic_id, status) VALUES (?, ?, 'active'), (?, ?, 'active')").run("p1", "c1", "p2", "c2");

const now = new Date().toISOString();
db.prepare(`
  INSERT INTO live_assessments
    (id, clinic_id, patient_id, instrument_id, instrument_version, applied_by_user_id,
     applied_at, provenance_source, payload_encrypted, encryption_version, status, created_at, updated_at)
  VALUES ('a1', 'c1', 'p1', 'mchat', '2.0', 'u1', ?, 'instrument', 'ciphertext', 'clinical-v1:k1', 'active', ?, ?)
`).run(now, now, now);

assert.throws(
  () => db.prepare(`UPDATE live_assessments SET payload_encrypted = 'changed' WHERE id = 'a1'`).run(),
  /LIVE_ASSESSMENT_IMMUTABLE/,
);

assert.throws(
  () => db.prepare(`
    INSERT INTO live_assessments
      (id, clinic_id, patient_id, instrument_id, instrument_version, applied_by_user_id,
       applied_at, provenance_source, payload_encrypted, encryption_version, status, created_at, updated_at)
    VALUES ('a-cross', 'c2', 'p1', 'mchat', '2.0', 'u1', ?, 'instrument', 'ciphertext', 'clinical-v1:k1', 'active', ?, ?)
  `).run(now, now, now),
  /LIVE_ASSESSMENT_PATIENT_TENANT_MISMATCH/,
);

assert.throws(
  () => db.prepare(`
    INSERT INTO live_assessments
      (id, clinic_id, patient_id, instrument_id, instrument_version, applied_by_user_id,
       applied_at, provenance_source, payload_encrypted, encryption_version,
       supersedes_assessment_id, status, created_at, updated_at)
    VALUES ('a-cross-supersession', 'c2', 'p2', 'mchat', '2.0', 'u1', ?, 'instrument', 'ciphertext', 'clinical-v1:k1', 'a1', 'active', ?, ?)
  `).run(now, now, now),
  /LIVE_ASSESSMENT_SUPERSESSION_TENANT_MISMATCH/,
);

db.prepare(`
  INSERT INTO live_assessment_responses
    (id, clinic_id, patient_id, assessment_id, item_id, item_position, response_encrypted, encryption_version, created_at)
  VALUES ('ar1', 'c1', 'p1', 'a1', 'item-1', 0, 'ciphertext', 'clinical-v1:k1', ?)
`).run(now);
assert.throws(
  () => db.prepare(`UPDATE live_assessment_responses SET response_encrypted = 'changed' WHERE id = 'ar1'`).run(),
  /LIVE_ASSESSMENT_RESPONSE_IMMUTABLE/,
);
assert.throws(
  () => db.prepare(`
    INSERT INTO live_assessment_responses
      (id, clinic_id, patient_id, assessment_id, item_id, item_position, response_encrypted, encryption_version, created_at)
    VALUES ('ar-cross', 'c2', 'p2', 'a1', 'item-2', 1, 'ciphertext', 'clinical-v1:k1', ?)
  `).run(now),
  /LIVE_ASSESSMENT_RESPONSE_TENANT_MISMATCH/,
);

db.prepare(`
  INSERT INTO live_documents
    (id, clinic_id, patient_id, author_user_id, document_type, origin, status, family_visibility, current_version, created_at, updated_at)
  VALUES ('d1', 'c1', 'p1', 'u1', 'report', 'clinician', 'published', 0, 1, ?, ?)
`).run(now, now);
db.prepare(`
  INSERT INTO live_document_versions
    (id, clinic_id, document_id, patient_id, author_user_id, version, content_encrypted,
     encryption_version, origin, issued_at, status, family_visibility, created_at)
  VALUES ('dv1', 'c1', 'd1', 'p1', 'u1', 1, 'ciphertext', 'clinical-v1:k1', 'clinician', ?, 'published', 0, ?)
`).run(now, now);
assert.throws(
  () => db.prepare(`
    UPDATE live_document_versions SET content_encrypted = 'changed' WHERE id = 'dv1'
  `).run(),
  /LIVE_DOCUMENT_VERSION_IMMUTABLE/,
);
assert.throws(
  () => db.prepare(`
    INSERT INTO live_document_versions
      (id, clinic_id, document_id, patient_id, author_user_id, version, content_encrypted,
       encryption_version, origin, issued_at, status, family_visibility, created_at)
    VALUES ('dv-cross', 'c2', 'd1', 'p2', 'u1', 2, 'ciphertext', 'clinical-v1:k1', 'clinician', ?, 'draft', 0, ?)
  `).run(now, now),
  /LIVE_DOCUMENT_VERSION_TENANT_MISMATCH/,
);

assert.throws(
  () => db.prepare(`
    INSERT INTO live_export_requests
      (id, clinic_id, requested_by_user_id, patient_id, scope, status, requested_at, updated_at)
    VALUES ('ex-cross', 'c2', 'u1', 'p1', 'patient', 'requested', ?, ?)
  `).run(now, now),
  /LIVE_EXPORT_PATIENT_TENANT_MISMATCH/,
);

const triggerCount = db.prepare(`
  SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'trigger' AND name IN (
    'trg_live_assessments_patient_tenant_insert',
    'trg_live_assessment_responses_tenant_insert',
    'trg_live_documents_patient_tenant_insert',
    'trg_live_document_versions_append_only',
    'trg_live_assessments_append_only',
    'trg_live_assessment_responses_append_only'
  )
`).get() as { count: number };
assert.equal(triggerCount.count, 6);

db.close();
console.log("✓ SaaS LIVE: migração, isolamento tenant, respostas, documentos append-only e governança protegidos");
