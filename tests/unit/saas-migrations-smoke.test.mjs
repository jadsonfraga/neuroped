import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE clinics (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL, status TEXT NOT NULL);
  CREATE TABLE users (id TEXT PRIMARY KEY);
  CREATE TABLE live_patients (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, status TEXT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL);
  CREATE TABLE saas_audit_log (
    id TEXT PRIMARY KEY, clinic_id TEXT, actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT,
    metadata_json TEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO clinics(id, name, slug, status) VALUES ('clinic-a', 'A', 'a', 'active'), ('clinic-b', 'B', 'b', 'active');
  INSERT INTO users(id) VALUES ('user-a');
  INSERT INTO live_patients(id, clinic_id, status, created_at, updated_at) VALUES ('patient-a', 'clinic-a', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
`);
for (const migration of [
  "db/migrations/0016_saas_control_plane_hardening.sql",
  "db/migrations/0017_saas_membership_invites.sql",
  "db/migrations/0018_saas_privacy_governance.sql",
]) db.exec(read(migration));

db.prepare(`INSERT INTO saas_module_settings(id, clinic_id, module_id, enabled, version) VALUES ('m1', 'clinic-a', 'privacy', 0, 0)`).run();
assert.throws(() => db.prepare(`UPDATE saas_module_settings SET clinic_id = 'clinic-b' WHERE id = 'm1'`).run(), /SAAS_MODULE_SETTING_SCOPE_IMMUTABLE/);
assert.throws(() => db.prepare(`UPDATE saas_module_settings SET version = 4 WHERE id = 'm1'`).run(), /SAAS_MODULE_SETTING_VERSION_CONFLICT/);
assert.throws(() => db.prepare(`INSERT INTO live_patient_search_tokens(id, clinic_id, patient_id, field, token) VALUES ('s1', 'clinic-b', 'patient-a', 'name', '${"a".repeat(64)}')`).run(), /LIVE_PATIENT_SEARCH_TOKEN_TENANT_MISMATCH/);
db.prepare(`INSERT INTO saas_audit_log(id, clinic_id, actor_user_id, action, target_type, target_id) VALUES ('a1', 'clinic-a', 'user-a', 'x', 'y', 'z')`).run();
assert.throws(() => db.prepare(`DELETE FROM saas_audit_log WHERE id = 'a1'`).run(), /SAAS_AUDIT_APPEND_ONLY/);
assert.throws(() => db.prepare(`INSERT INTO saas_audit_log(id, actor_user_id, action, target_type, metadata_json) VALUES ('a2', 'user-a', 'x', 'y', '${"x".repeat(4001)}')`).run(), /SAAS_AUDIT_METADATA_TOO_LARGE/);

db.close();
console.log("[saas-migrations-smoke] ✓ migrations 0016–0018, FKs, triggers e versionamento validados");
