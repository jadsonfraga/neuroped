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
  "db/migrations/0019_saas_integrations_control.sql",
  "db/migrations/0020_saas_integration_idempotency.sql",
  "db/migrations/0021_saas_backup_evidence_append_only.sql",
  "db/migrations/0022_saas_webhook_deliveries.sql",
  "db/migrations/0023_saas_incident_events.sql",
]) db.exec(read(migration));

db.prepare(`INSERT INTO saas_module_settings(id, clinic_id, module_id, enabled, version) VALUES ('m1', 'clinic-a', 'privacy', 0, 0)`).run();
assert.throws(() => db.prepare(`UPDATE saas_module_settings SET clinic_id = 'clinic-b' WHERE id = 'm1'`).run(), /SAAS_MODULE_SETTING_SCOPE_IMMUTABLE/);
assert.throws(() => db.prepare(`UPDATE saas_module_settings SET version = 4 WHERE id = 'm1'`).run(), /SAAS_MODULE_SETTING_VERSION_CONFLICT/);
assert.throws(() => db.prepare(`INSERT INTO live_patient_search_tokens(id, clinic_id, patient_id, field, token) VALUES ('s1', 'clinic-b', 'patient-a', 'name', '${"a".repeat(64)}')`).run(), /LIVE_PATIENT_SEARCH_TOKEN_TENANT_MISMATCH/);
db.prepare(`INSERT INTO saas_audit_log(id, clinic_id, actor_user_id, action, target_type, target_id) VALUES ('a1', 'clinic-a', 'user-a', 'x', 'y', 'z')`).run();
assert.throws(() => db.prepare(`DELETE FROM saas_audit_log WHERE id = 'a1'`).run(), /SAAS_AUDIT_APPEND_ONLY/);
assert.throws(() => db.prepare(`INSERT INTO saas_audit_log(id, actor_user_id, action, target_type, metadata_json) VALUES ('a2', 'user-a', 'x', 'y', '${"x".repeat(4001)}')`).run(), /SAAS_AUDIT_METADATA_TOO_LARGE/);

 db.prepare(`INSERT INTO saas_backup_evidence(id, clinic_id, provider, snapshot_digest_sha256, status, rpo_minutes, rto_minutes, recorded_by_user_id) VALUES ('backup-a', 'clinic-a', 'staging-provider', '${"a".repeat(64)}', 'recorded', 60, 120, 'user-a')`).run();
assert.throws(() => db.prepare(`UPDATE saas_backup_evidence SET status = 'verified', restore_verified_at = CURRENT_TIMESTAMP WHERE id = 'backup-a'`).run(), /SAAS_BACKUP_EVIDENCE_APPEND_ONLY/);
assert.throws(() => db.prepare(`DELETE FROM saas_backup_evidence WHERE id = 'backup-a'`).run(), /SAAS_BACKUP_EVIDENCE_APPEND_ONLY/);

const insertWebhook = db.prepare(`INSERT INTO saas_webhook_deliveries(id, clinic_id, integration_id, environment, delivery_id, event_type, payload_digest_sha256, signature, status, created_at) VALUES (?, ?, 'webhooks', ?, ?, ?, ?, ?, 'queued', CURRENT_TIMESTAMP)`);
insertWebhook.run('webhook-a', 'clinic-a', 'sandbox', 'delivery-00000001', 'saas.module.updated', "a".repeat(64), "b".repeat(64));
assert.throws(() => db.prepare(`UPDATE saas_webhook_deliveries SET clinic_id = 'clinic-b' WHERE id = 'webhook-a'`).run(), /SAAS_WEBHOOK_SCOPE_IMMUTABLE/);
assert.throws(() => db.prepare(`DELETE FROM saas_webhook_deliveries WHERE id = 'webhook-a'`).run(), /SAAS_WEBHOOK_APPEND_ONLY/);
assert.throws(() => insertWebhook.run('webhook-b', 'clinic-a', 'sandbox', 'delivery-00000001', 'saas.module.updated', "a".repeat(64), "c".repeat(64)), /UNIQUE/);

const insertIncident = db.prepare(`INSERT INTO saas_incident_events(id, clinic_id, component, code, severity, status, correlation_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`);
insertIncident.run('incident-a', 'clinic-a', 'integration', 'WEBHOOK_DELIVERY_REUSE', 'medium', 'open', 'request-0001', '{"environment":"sandbox"}');
assert.throws(() => db.prepare(`UPDATE saas_incident_events SET clinic_id = 'clinic-b' WHERE id = 'incident-a'`).run(), /SAAS_INCIDENT_SCOPE_IMMUTABLE/);
assert.throws(() => db.prepare(`DELETE FROM saas_incident_events WHERE id = 'incident-a'`).run(), /SAAS_INCIDENT_APPEND_ONLY/);

const insertIntegration = db.prepare(`INSERT INTO saas_integration_connections(id, clinic_id, integration_id, environment, status, scopes_json, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
insertIntegration.run('i1', 'clinic-a', 'webhooks', 'sandbox', 'draft', '["module.read"]', 0);
assert.throws(() => db.prepare(`UPDATE saas_integration_connections SET clinic_id = 'clinic-b' WHERE id = 'i1'`).run(), /SAAS_INTEGRATION_SCOPE_IMMUTABLE/);
assert.throws(() => db.prepare(`UPDATE saas_integration_connections SET version = 4 WHERE id = 'i1'`).run(), /SAAS_INTEGRATION_VERSION_CONFLICT/);
assert.throws(() => insertIntegration.run('i2', 'clinic-a', 'webhooks', 'sandbox', 'draft', '["module.read"]', 0), /UNIQUE/);

const insertIdempotency = db.prepare(`INSERT INTO saas_integration_idempotency(id, clinic_id, idempotency_key, request_hash, response_json, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`);
insertIdempotency.run('idem-a', 'clinic-a', 'idempotency-key-0001', "a".repeat(64), '{"data":{"status":"draft"}}');
assert.throws(() => db.prepare(`UPDATE saas_integration_idempotency SET clinic_id = 'clinic-b' WHERE id = 'idem-a'`).run(), /SAAS_IDEMPOTENCY_IMMUTABLE/);
assert.throws(() => db.prepare(`DELETE FROM saas_integration_idempotency WHERE id = 'idem-a'`).run(), /SAAS_IDEMPOTENCY_APPEND_ONLY/);
assert.throws(() => insertIdempotency.run('idem-b', 'clinic-a', 'idempotency-key-0001', "b".repeat(64), '{}'), /UNIQUE/);

db.close();
console.log("[saas-migrations-smoke] ✓ migrations 0016–0023, FKs, triggers append-only, idempotência, webhooks, incidentes e versionamento validados");
