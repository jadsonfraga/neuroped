import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  INSTITUTIONAL_ANNUAL_OFFER,
  INSTITUTIONAL_PILOT_OFFER,
  offerAcceptsTermsVersion,
} from "../../shared/commercial";

assert.equal(INSTITUTIONAL_PILOT_OFFER.termsVersion, "institutional-pilot-terms-v1");
assert.equal(INSTITUTIONAL_ANNUAL_OFFER.termsVersion, "institutional-annual-terms-v1");
assert.equal(
  offerAcceptsTermsVersion("institutional-pilot-1-0", "institutional-pilot-terms-v1"),
  true,
);
assert.equal(
  offerAcceptsTermsVersion("institutional-pilot-1-0", "institutional-annual-terms-v1"),
  false,
);
assert.equal(offerAcceptsTermsVersion("unknown", "institutional-pilot-terms-v1"), false);

const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY);
  CREATE TABLE clinics (id TEXT PRIMARY KEY);
  CREATE TABLE clinic_memberships (
    clinic_id TEXT NOT NULL REFERENCES clinics(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (clinic_id, user_id)
  );
`);
db.exec(readFileSync("db/migrations/0026_saas_commercial_catalog.sql", "utf8"));
db.exec(readFileSync("db/migrations/0027_saas_commercial_terms_binding.sql", "utf8"));

const persisted = db
  .prepare(`SELECT code, terms_version FROM commercial_offers ORDER BY code`)
  .all() as Array<{ code: string; terms_version: string }>;
const termsByCode = new Map(persisted.map((row) => [row.code, row.terms_version]));
assert.equal(
  termsByCode.get("institutional-pilot-1-0"),
  INSTITUTIONAL_PILOT_OFFER.termsVersion,
);
assert.equal(
  termsByCode.get("institutional-annual-1-0"),
  INSTITUTIONAL_ANNUAL_OFFER.termsVersion,
);

db.exec(`
  INSERT INTO users(id) VALUES ('owner');
  INSERT INTO clinics(id) VALUES ('clinic-a');
  INSERT INTO clinic_memberships(clinic_id, user_id, role, active)
  VALUES ('clinic-a', 'owner', 'owner', 1);
`);

assert.throws(
  () =>
    db.exec(`
      INSERT INTO commercial_licenses(
        id, clinic_id, offer_id, status, unit_label, contract_version,
        billing_reference, created_by_user_id
      ) SELECT
        'lic-wrong', 'clinic-a', id, 'pending', 'A', 'invented-terms-v99',
        'bill-1', 'owner'
      FROM commercial_offers WHERE code='institutional-pilot-1-0';
    `),
  /terms version mismatch/i,
  "licença não pode nascer contra versão contratual inventada",
);

db.exec(`
  INSERT INTO commercial_licenses(
    id, clinic_id, offer_id, status, unit_label, contract_version,
    billing_reference, created_by_user_id
  ) SELECT
    'lic-ok', 'clinic-a', id, 'pending', 'A', 'institutional-pilot-terms-v1',
    'bill-2', 'owner'
  FROM commercial_offers WHERE code='institutional-pilot-1-0';
`);

assert.throws(
  () =>
    db.exec(`
      INSERT INTO commercial_license_acceptances(
        license_id, accepted_by_user_id, terms_version,
        no_patient_data_accepted, no_medical_service_accepted, no_redistribution_accepted
      ) VALUES (
        'lic-ok', 'owner', 'invented-terms-v99', 1, 1, 1
      );
      INSERT INTO commercial_license_users(
        license_id, user_id, status, authorized_by_user_id
      ) VALUES ('lic-ok', 'owner', 'active', 'owner');
      UPDATE commercial_licenses
         SET status='active', activated_at=datetime('now'), expires_at=datetime('now','+365 days')
       WHERE id='lic-ok';
    `),
  /manager acceptance required/i,
  "ativação exige aceite da mesma versão contratual da licença",
);

console.log("✓ SaaS commercial terms: offer → license → acceptance version binding locked");
