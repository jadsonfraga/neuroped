import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";

const workDir = mkdtempSync(join(tmpdir(), "neuroped-live-pilot-"));
const sourcePath = join(workDir, "source.db");
const backupPath = join(workDir, "backup.db");
const restorePath = join(workDir, "restore.db");

function applySql(db, relativePath) {
  db.exec(readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8"));
}

function expectSqlFailure(fn, marker) {
  assert.throws(fn, (error) => String(error?.message || error).includes(marker), `expected ${marker}`);
}

try {
  const db = new Database(sourcePath);
  db.pragma("foreign_keys = ON");
  applySql(db, "db/schema.d1.sql");
  applySql(db, "db/migrations/0009_saas_phase1_foundation.sql");
  applySql(db, "db/migrations/0010_saas_phase1_hardening.sql");

  const user = "user-pilot-001";
  const clinic = "clinic-pilot-001";
  const patient = "patient-pilot-001";
  const event = "event-pilot-001";
  const now = "2026-08-19T15:00:00.000Z";
  const encryptedProfile = "clinical-v1:7a91c5e8b4d2f03a1c9e";
  const encryptedEvent = "clinical-v1:4f28b7d0a6e193c5e2ab";

  const insertUser = db.prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)");
  insertUser.run(user, "Pilot Operator", "pilot@example.invalid", "professional");
  db.prepare("INSERT INTO clinics (id, slug, name, created_by_user_id) VALUES (?, ?, ?, ?)")
    .run(clinic, "pilot-clinic", "Synthetic Pilot Clinic", user);
  db.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, ?)")
    .run(clinic, user, "owner");
  db.prepare(`
    INSERT INTO live_patients
      (id, clinic_id, created_by_user_id, patient_identity_hash, profile_encrypted, encryption_version)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(patient, clinic, user, "sha256:synthetic-patient", encryptedProfile, "clinical-v1");
  db.prepare(`
    INSERT INTO live_clinical_events
      (id, clinic_id, patient_id, author_user_id, event_type, occurred_at, provenance_kind, provenance_source, payload_encrypted, encryption_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(event, clinic, patient, user, "encounter", now, "documented", "clinician", encryptedEvent, "clinical-v1");
  db.prepare(`
    INSERT INTO saas_audit_log
      (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("audit-pilot-001", clinic, user, "clinical.read", "patient", patient, JSON.stringify({ source: "pilot" }));

  const hardeningIndexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'ux_live_clinical_events_%' ORDER BY name").all();
  assert.ok(hardeningIndexes.some((row) => row.name === "ux_live_clinical_events_supersedes_once"), "successor uniqueness index missing");
  const originalEvent = db.prepare("SELECT supersedes_event_id FROM live_clinical_events WHERE id = ?").get(event);
  assert.equal(originalEvent.supersedes_event_id, null);

  db.prepare(`
    INSERT INTO live_clinical_events
      (id, clinic_id, patient_id, author_user_id, event_type, occurred_at, provenance_kind, provenance_source, payload_encrypted, supersedes_event_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("event-pilot-successor", clinic, patient, user, "observation", now, "observed", "clinician", "clinical-v1:2f77c0d9a4e1", event);

  expectSqlFailure(
    () => db.prepare(`
      INSERT INTO live_clinical_events
        (id, clinic_id, patient_id, author_user_id, event_type, occurred_at, provenance_kind, provenance_source, payload_encrypted, supersedes_event_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("event-pilot-duplicate-successor", clinic, patient, user, "observation", now, "observed", "clinician", "clinical-v1:9e20a1c44b7d", event),
    "UNIQUE",
  );
  expectSqlFailure(
    () => db.prepare(`
      INSERT INTO live_clinical_events
        (id, clinic_id, patient_id, author_user_id, event_type, occurred_at, provenance_kind, provenance_source, payload_encrypted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("event-pilot-invalid-source", clinic, patient, user, "observation", now, "observed", "free-text-pii", "clinical-v1:8b01d9f5c2a6"),
    "INVALID_PROVENANCE_SOURCE",
  );
  expectSqlFailure(
    () => db.prepare("UPDATE clinic_memberships SET active = 0 WHERE clinic_id = ? AND user_id = ?").run(clinic, user),
    "LAST_OWNER_PROTECTED",
  );

  const plaintextRows = db.prepare(`
    SELECT COUNT(*) AS count
      FROM live_patients
     WHERE profile_encrypted LIKE '%Synthetic%'
        OR profile_encrypted LIKE '%Pilot%'
  `).get();
  const plaintextEvents = db.prepare(`
    SELECT COUNT(*) AS count
      FROM live_clinical_events
     WHERE payload_encrypted LIKE '%Synthetic%'
        OR payload_encrypted LIKE '%Pilot%'
  `).get();
  assert.equal(plaintextRows.count, 0);
  assert.equal(plaintextEvents.count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM patients_demo").get().count, 0);

  db.close();
  copyFileSync(sourcePath, backupPath);
  copyFileSync(backupPath, restorePath);

  const restored = new Database(restorePath, { readonly: true });
  restored.pragma("foreign_keys = ON");
  assert.equal(restored.prepare("SELECT COUNT(*) AS count FROM live_patients").get().count, 1);
  assert.equal(restored.prepare("SELECT COUNT(*) AS count FROM live_clinical_events").get().count, 2);
  assert.equal(restored.prepare("SELECT COUNT(*) AS count FROM saas_audit_log").get().count, 1);
  assert.equal(restored.prepare("SELECT COUNT(*) AS count FROM patients_demo").get().count, 0);
  restored.close();

  console.log(JSON.stringify({
    status: "pass",
    mode: "synthetic-only",
    migration: "0009+0010",
    livePatients: 1,
    liveEvents: 2,
    auditRows: 1,
    demoPatientRows: 0,
    restore: "pass",
    invariants: ["tenant membership", "encrypted payload columns", "single event successor", "controlled provenance", "last owner protection"],
  }, null, 2));
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
