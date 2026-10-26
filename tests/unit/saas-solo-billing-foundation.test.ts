import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import {
  CANONICAL_PLAN_DISPLAY_NAME,
  CANONICAL_PLAN_ID,
  CANONICAL_PRIMARY_SEATS,
} from "../../shared/billing";

const relevantMigrations = [
  "0007_operational_suite.sql",
  "0008_operational_hardening.sql",
  "0009_saas_phase1_foundation.sql",
  "0010_saas_phase1_hardening.sql",
  "0012_saas_billing_onboarding.sql",
  "0013_saas_billing_provider.sql",
  "0014_saas_tenant_lifecycle.sql",
  "0015_saas_billing_trial_seats_hardening.sql",
] as const;

function insertOwnerAndClinic(db: DatabaseSync, suffix: string): void {
  const userId = `owner-${suffix}`;
  db.prepare(
    `INSERT INTO users (id, name, email, role)
     VALUES (?, ?, ?, 'professional')`,
  ).run(userId, `Owner ${suffix}`, `${suffix}@neuroped.invalid`);
  db.prepare(
    `INSERT INTO clinics
      (id, slug, name, timezone, status, created_by_user_id)
     VALUES (?, ?, ?, 'America/Recife', 'active', ?)`,
  ).run(`clinic-${suffix}`, `clinic-${suffix}`, `Consultório ${suffix}`, userId);
}

function subscription(db: DatabaseSync, clinicId: string): {
  plan_id: string;
  seats: number;
} {
  return db.prepare(
    `SELECT bs.plan_id, bs.seats
       FROM billing_subscriptions bs
       JOIN billing_customers bc ON bc.id = bs.customer_id
      WHERE bc.clinic_id = ?`,
  ).get(clinicId) as { plan_id: string; seats: number };
}

test("novos trials Solo usam um assento sem converter subscriptions existentes", () => {
  assert.equal(CANONICAL_PLAN_DISPLAY_NAME, "NeuroPed Solo");
  assert.equal(CANONICAL_PRIMARY_SEATS, 1);

  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const migration of relevantMigrations) {
    db.exec(readFileSync(`db/migrations/${migration}`, "utf8"));
  }

  insertOwnerAndClinic(db, "legacy");
  const legacy = subscription(db, "clinic-legacy");
  assert.equal(legacy.plan_id, CANONICAL_PLAN_ID);
  assert.equal(legacy.seats, 2);

  const soloMigration = readFileSync(
    "db/migrations/0038_neuroped_solo_default_seat.sql",
    "utf8",
  );
  assert.doesNotMatch(
    soloMigration,
    /UPDATE\s+billing_subscriptions/i,
    "a migração Solo não pode converter assinaturas existentes",
  );
  db.exec(soloMigration);

  const physicalTrigger = db.prepare(
    `SELECT CASE
       WHEN instr(
         replace(replace(replace(sql, char(10), ''), char(13), ''), ' ', ''),
         '''saas-professional'',1,''trial'''
       ) > 0 THEN 'SOLO_TRIGGER_OK'
       ELSE 'SOLO_TRIGGER_INVALID'
     END AS status
     FROM sqlite_master
     WHERE type = 'trigger' AND name = 'trg_clinic_create_billing_trial'`,
  ).get() as { status: string };
  assert.equal(physicalTrigger.status, "SOLO_TRIGGER_OK");

  assert.equal(
    subscription(db, "clinic-legacy").seats,
    2,
    "tenant existente mantém os assentos contratados",
  );

  insertOwnerAndClinic(db, "solo");
  const solo = subscription(db, "clinic-solo");
  assert.equal(solo.plan_id, CANONICAL_PLAN_ID);
  assert.equal(solo.seats, 1);

  const capacity = db.prepare(
    `SELECT CASE WHEN COUNT(*) = 0
       THEN 'SOLO_TRIAL_POLICY_OK'
       ELSE 'SOLO_TRIAL_POLICY_VIOLATION'
     END AS status
     FROM billing_subscriptions bs
     JOIN billing_customers bc ON bc.id = bs.customer_id
     WHERE bs.status = 'trial'
       AND COALESCE(bs.seats, 0) < (
         SELECT COUNT(*) FROM clinic_memberships cm
         WHERE cm.clinic_id = bc.clinic_id AND cm.active = 1
       )`,
  ).get() as { status: string };
  assert.equal(capacity.status, "SOLO_TRIAL_POLICY_OK");
});
