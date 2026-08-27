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
  CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, role TEXT);
  CREATE TABLE live_patients (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, status TEXT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL);
  CREATE TABLE saas_audit_log (
    id TEXT PRIMARY KEY, clinic_id TEXT, actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT,
    metadata_json TEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO clinics(id, name, slug, status) VALUES ('clinic-a', 'A', 'a', 'active'), ('clinic-b', 'B', 'b', 'active');
  INSERT INTO users(id, email, role) VALUES ('user-a', 'admin@a.test', 'clinic_admin');
`);
for (const migration of [
  "db/migrations/0016_saas_control_plane_hardening.sql",
  "db/migrations/0017_saas_membership_invites.sql",
  "db/migrations/0018_saas_privacy_governance.sql",
  "db/migrations/0019_saas_integrations_control.sql",
  "db/migrations/0020_saas_integration_idempotency.sql",
]) db.exec(read(migration));

const insertInvite = db.prepare(`INSERT INTO saas_membership_invites(id, clinic_id, email_hash, role, token_hash, expires_at, invited_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const oldCreated = "2026-08-27T12:00:00.000Z";
insertInvite.run("invite-old", "clinic-a", "e".repeat(64), "professional", "t".repeat(64), "2026-08-28T12:00:00.000Z", "user-a", oldCreated);
const resendAt = "2026-08-27T12:05:00.000Z";
const revoke = db.prepare(`UPDATE saas_membership_invites SET revoked_at = ? WHERE id = ? AND clinic_id = ? AND accepted_at IS NULL AND revoked_at IS NULL`);
assert.equal(revoke.run(resendAt, "invite-old", "clinic-a").changes, 1);
insertInvite.run("invite-new", "clinic-a", "e".repeat(64), "professional", "u".repeat(64), "2026-08-29T12:05:00.000Z", "user-a", resendAt);
const invites = db.prepare(`SELECT id, clinic_id, revoked_at, accepted_at FROM saas_membership_invites WHERE clinic_id = ? ORDER BY created_at`).all("clinic-a");
assert.equal(invites.length, 2);
assert.equal(invites[0].revoked_at, resendAt);
assert.equal(invites[1].revoked_at, null);
assert.equal(invites[1].accepted_at, null);
assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM saas_membership_invites WHERE clinic_id = 'clinic-b'`).get().count, 0);

const response = JSON.stringify({ data: { clinicId: "clinic-a", integrationId: "webhooks", environment: "sandbox", status: "connected", scopes: ["module.read"], credentialConfigured: true, endpointConfigured: true, version: 1 } });
const insertIdempotency = db.prepare(`INSERT INTO saas_integration_idempotency(id, clinic_id, idempotency_key, request_hash, response_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
insertIdempotency.run("idem-1", "clinic-a", "request-key-000001", "a".repeat(64), response, "2026-08-27T12:00:00.000Z");
const replay = db.prepare(`SELECT request_hash, response_json FROM saas_integration_idempotency WHERE clinic_id = ? AND idempotency_key = ?`).get("clinic-a", "request-key-000001");
assert.equal(replay.request_hash, "a".repeat(64));
assert.deepEqual(JSON.parse(replay.response_json), JSON.parse(response));
assert.equal(replay.request_hash === "b".repeat(64), false, "a mesma chave deve rejeitar payload divergente");
assert.throws(() => insertIdempotency.run("idem-2", "clinic-a", "request-key-000001", "b".repeat(64), "{}", "2026-08-27T12:01:00.000Z"), /UNIQUE/);
assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM saas_integration_idempotency WHERE clinic_id = 'clinic-b'`).get().count, 0);

const consoleSource = read("client/src/pages/saas-central.tsx");
assert.match(consoleSource, /pendingAction/);
assert.match(consoleSource, /recalculateReadiness/);
assert.match(consoleSource, /retentionDrafts/);
assert.match(consoleSource, /resendInvite/);
assert.doesNotMatch(consoleSource, /localStorage\.setItem\([^\n]*lastInviteUrl/);

db.close();
console.log("[saas-operational-flow] ✓ reenvio, replay idempotente, isolamento e estados da Central validados");
