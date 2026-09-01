import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const root = process.cwd();
const operationalMigration = fs.readFileSync(path.join(root, "db/migrations/0007_operational_suite.sql"), "utf8");
const consentMigration = fs.readFileSync(path.join(root, "db/migrations/0016_public_booking_consent_evidence.sql"), "utf8");
const publicBooking = fs.readFileSync(path.join(root, "functions/api/public-booking.ts"), "utf8");
const bookingPage = fs.readFileSync(path.join(root, "client/src/pages/agendar.tsx"), "utf8");

const noticeTitle = "Aviso de privacidade do agendamento.";
const noticeBody = "Concordo com o uso destes dados mínimos para solicitar, confirmar, remarcar ou cancelar a consulta. Não informe diagnóstico, medicação ou detalhes clínicos nesta etapa.";
const expectedHash = `sha256:${crypto.createHash("sha256").update(`${noticeTitle}\n${noticeBody}`, "utf8").digest("hex")}`;

assert.equal(
  expectedHash,
  "sha256:d0a7e8c1ed9dff137adb2532a1ce4b11a3e91accf5ce6880fd3108a918932ece",
  "hash do aviso precisa ser deliberadamente versionado",
);
assert.match(publicBooking, /action === "book"[\s\S]*privacyAccepted !== true[\s\S]*CONSENT_REQUIRED/);
assert.match(publicBooking, /action === "waitlist"[\s\S]*privacyAccepted !== true[\s\S]*CONSENT_REQUIRED/);
assert.ok(bookingPage.includes(noticeTitle));
assert.ok(bookingPage.includes(noticeBody));
assert.match(consentMigration, new RegExp(expectedHash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.doesNotMatch(consentMigration, /INSERT[\s\S]+SELECT[\s\S]+FROM appointments/i, "migração não pode fabricar consentimento histórico");

const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
db.exec("CREATE TABLE users (id TEXT PRIMARY KEY);");
db.exec(operationalMigration);
db.prepare("INSERT INTO users (id) VALUES (?)").run("provider-1");
db.prepare(`
  INSERT INTO booking_services
    (id, provider_user_id, name, duration_minutes, price_cents, modality, active, public_visible)
  VALUES ('service-1', 'provider-1', 'Consulta', 60, 80000, 'in_person', 1, 1)
`).run();

const now = new Date().toISOString();
db.prepare(`
  INSERT INTO appointments
    (id, provider_user_id, service_id, starts_at_local, ends_at_local, timezone, source, booking_token_hash, created_at, updated_at)
  VALUES ('legacy-public', 'provider-1', 'service-1', '2026-09-02T09:00:00', '2026-09-02T10:00:00', 'America/Recife', 'public', 'legacy-token', ?, ?)
`).run(now, now);

db.exec(consentMigration);

const legacyEvidence = db.prepare(`SELECT id FROM public_booking_consent_evidence WHERE appointment_id = 'legacy-public'`).get();
assert.equal(legacyEvidence, undefined, "registro histórico não pode receber aceite presumido");

db.prepare(`
  INSERT INTO appointments
    (id, provider_user_id, service_id, starts_at_local, ends_at_local, timezone, source, booking_token_hash, created_at, updated_at)
  VALUES ('public-new', 'provider-1', 'service-1', '2026-09-03T09:00:00', '2026-09-03T10:00:00', 'America/Recife', 'public', 'public-token', ?, ?)
`).run(now, now);

const appointmentEvidence = db.prepare(`
  SELECT appointment_id, waitlist_entry_id, notice_version, notice_sha256, purpose, accepted_at
    FROM public_booking_consent_evidence
   WHERE appointment_id = 'public-new'
`).get() as Record<string, unknown>;
assert.equal(appointmentEvidence.appointment_id, "public-new");
assert.equal(appointmentEvidence.waitlist_entry_id, null);
assert.equal(appointmentEvidence.notice_version, "public-booking-privacy-v1");
assert.equal(appointmentEvidence.notice_sha256, expectedHash);
assert.equal(appointmentEvidence.purpose, "appointment_scheduling_and_management");
assert.equal(appointmentEvidence.accepted_at, now);

db.prepare(`
  INSERT INTO appointments
    (id, provider_user_id, service_id, starts_at_local, ends_at_local, timezone, source, booking_token_hash, created_at, updated_at)
  VALUES ('professional-new', 'provider-1', 'service-1', '2026-09-04T09:00:00', '2026-09-04T10:00:00', 'America/Recife', 'professional', 'professional-token', ?, ?)
`).run(now, now);
const professionalEvidence = db.prepare(`SELECT id FROM public_booking_consent_evidence WHERE appointment_id = 'professional-new'`).get();
assert.equal(professionalEvidence, undefined, "agendamento profissional não pode ganhar aceite público presumido");

db.prepare(`
  INSERT INTO waitlist_entries
    (id, provider_user_id, service_id, preferred_date, status, access_token_hash, created_at, updated_at)
  VALUES ('wait-new', 'provider-1', 'service-1', '2026-09-05', 'waiting', 'wait-token', ?, ?)
`).run(now, now);
const waitlistEvidence = db.prepare(`
  SELECT appointment_id, waitlist_entry_id, notice_version, notice_sha256, purpose, accepted_at
    FROM public_booking_consent_evidence
   WHERE waitlist_entry_id = 'wait-new'
`).get() as Record<string, unknown>;
assert.equal(waitlistEvidence.appointment_id, null);
assert.equal(waitlistEvidence.waitlist_entry_id, "wait-new");
assert.equal(waitlistEvidence.notice_version, "public-booking-privacy-v1");
assert.equal(waitlistEvidence.notice_sha256, expectedHash);
assert.equal(waitlistEvidence.purpose, "appointment_scheduling_and_management");
assert.equal(waitlistEvidence.accepted_at, now);

const triggerCount = db.prepare(`
  SELECT COUNT(*) AS count
    FROM sqlite_master
   WHERE type = 'trigger'
     AND name IN ('trg_public_appointment_consent_evidence', 'trg_public_waitlist_consent_evidence')
`).get() as { count: number };
assert.equal(triggerCount.count, 2);

db.close();
console.log("✓ Booking público: aceite LGPD versionado, atômico e sem retropreenchimento histórico");
