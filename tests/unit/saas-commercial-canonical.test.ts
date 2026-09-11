import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  COMMERCIAL_OFFERS,
  INSTITUTIONAL_ANNUAL_OFFER,
  INSTITUTIONAL_PILOT_OFFER,
  canOrderCommercialOffer,
  commercialFeatureCodes,
  commercialLicenseIsUsable,
  validateCommercialActivation,
  validateCommercialUsageMetadata,
} from "../../shared/commercial";
import {
  evaluateCommercialAccess,
  type CommercialLicenseSnapshot,
} from "../../functions/api/commercial/_core";

assert.equal(commercialFeatureCodes.length, 5, "produto inicial deve ter exatamente cinco materiais");
assert.equal(INSTITUTIONAL_PILOT_OFFER.priceCents, 149_000);
assert.equal(INSTITUTIONAL_ANNUAL_OFFER.priceCents, 249_000);
assert.equal(INSTITUTIONAL_PILOT_OFFER.saleMode, "invite_only");
assert.equal(INSTITUTIONAL_ANNUAL_OFFER.saleMode, "gated");
assert.equal(INSTITUTIONAL_PILOT_OFFER.maxLicenses, 3);
assert.equal(INSTITUTIONAL_PILOT_OFFER.maxUnits, 1);
assert.equal(INSTITUTIONAL_PILOT_OFFER.maxAuthorizedUsers, 10);
assert.equal(INSTITUTIONAL_PILOT_OFFER.supportMinutes, 120);

for (const offer of Object.values(COMMERCIAL_OFFERS)) {
  assert.equal(offer.guardrails.acceptsPatientData, false);
  assert.equal(offer.guardrails.includesMedicalService, false);
  assert.equal(offer.guardrails.includesClinicalDecisionSupport, false);
  assert.equal(offer.guardrails.includesPsychometricScoring, false);
  assert.equal(offer.guardrails.includesPant, false);
  assert.equal(offer.guardrails.includesNeuroBoard, false);
  assert.equal(offer.guardrails.allowsRedistribution, false);
  assert.equal(offer.guardrails.allowsWhiteLabel, false);
}

assert.deepEqual(canOrderCommercialOffer({ offerCode: "institutional-pilot-1-0" }), {
  ok: false,
  reason: "INVITATION_REQUIRED",
});
assert.deepEqual(
  canOrderCommercialOffer({ offerCode: "institutional-pilot-1-0", invited: true }),
  { ok: true, reason: null },
);
assert.deepEqual(canOrderCommercialOffer({ offerCode: "institutional-annual-1-0" }), {
  ok: false,
  reason: "EXPANSION_GATE_CLOSED",
});
assert.deepEqual(
  canOrderCommercialOffer({ offerCode: "institutional-annual-1-0", expansionGateOpen: true }),
  { ok: true, reason: null },
);

const refusedBoundary = validateCommercialActivation({
  offerCode: "institutional-pilot-1-0",
  invited: true,
  units: 1,
  authorizedUsers: 3,
  acceptsNoPatientData: false,
  acceptsNoMedicalService: true,
  acceptsNoRedistribution: true,
});
assert.equal(refusedBoundary.ok, false);
assert.ok(refusedBoundary.errors.includes("NO_PATIENT_DATA_NOT_ACCEPTED"));

const excessiveScope = validateCommercialActivation({
  offerCode: "institutional-pilot-1-0",
  invited: true,
  units: 2,
  authorizedUsers: 11,
  acceptsNoPatientData: true,
  acceptsNoMedicalService: true,
  acceptsNoRedistribution: true,
});
assert.equal(excessiveScope.ok, false);
assert.ok(excessiveScope.errors.includes("UNIT_LIMIT_EXCEEDED"));
assert.ok(excessiveScope.errors.includes("AUTHORIZED_USER_LIMIT_EXCEEDED"));

const validPilot = validateCommercialActivation({
  offerCode: "institutional-pilot-1-0",
  invited: true,
  units: 1,
  authorizedUsers: 10,
  acceptsNoPatientData: true,
  acceptsNoMedicalService: true,
  acceptsNoRedistribution: true,
});
assert.deepEqual(validPilot, { ok: true, errors: [] });

assert.equal(
  commercialLicenseIsUsable(
    {
      status: "active",
      activatedAt: "2026-09-08T00:00:00Z",
      expiresAt: "2027-09-08T00:00:00Z",
    },
    new Date("2026-12-01T00:00:00Z"),
  ),
  true,
);
assert.equal(
  commercialLicenseIsUsable(
    {
      status: "suspended",
      activatedAt: "2026-09-08T00:00:00Z",
      expiresAt: "2027-09-08T00:00:00Z",
    },
    new Date("2026-12-01T00:00:00Z"),
  ),
  false,
);

const activeSnapshot: CommercialLicenseSnapshot = {
  licenseId: "lic-synthetic",
  clinicId: "clinic-synthetic",
  offerCode: "institutional-pilot-1-0",
  offerName: "NeuroPed Institucional — Piloto 1.0",
  priceCents: 149_000,
  currency: "BRL",
  status: "active",
  unitLabel: "Unidade Sintética",
  activatedAt: "2026-09-08T00:00:00Z",
  expiresAt: "2027-09-08T00:00:00Z",
  maxAuthorizedUsers: 10,
  authorizedUsers: 1,
  onboardingMinutes: 60,
  supportMinutes: 120,
  supportMinutesUsed: 0,
  features: [...commercialFeatureCodes],
};
assert.deepEqual(
  evaluateCommercialAccess(
    activeSnapshot,
    "form.preconsultation",
    false,
    new Date("2026-12-01T00:00:00Z"),
  ),
  { ok: false, reason: "COMMERCIAL_USER_NOT_AUTHORIZED" },
  "membership do tenant não equivale a usuário autorizado na licença",
);
assert.deepEqual(
  evaluateCommercialAccess(
    activeSnapshot,
    "form.preconsultation",
    true,
    new Date("2026-12-01T00:00:00Z"),
  ),
  { ok: true },
);
assert.deepEqual(
  evaluateCommercialAccess(
    activeSnapshot,
    "feature.inexistente",
    true,
    new Date("2026-12-01T00:00:00Z"),
  ),
  { ok: false, reason: "COMMERCIAL_FEATURE_NOT_LICENSED" },
);

assert.equal(
  validateCommercialUsageMetadata({ materialId: "form.preconsultation", clientVersion: "1.0" }).ok,
  true,
);
for (const forbidden of [
  { patientName: "Paciente" },
  { cpf: "00000000000" },
  { diagnosis: "texto" },
  { prontuario: "123" },
]) {
  assert.deepEqual(validateCommercialUsageMetadata(forbidden), {
    ok: false,
    reason: "COMMERCIAL_METADATA_KEY_FORBIDDEN",
  });
}

// Contrato persistente e adversarial: o banco precisa impor os mesmos limites
// mesmo se uma rota futura esquecer de chamar os guards TypeScript.
{
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

  const pilot = db
    .prepare(
      `SELECT price_cents, sale_mode, max_units, max_authorized_users, max_licenses,
              accepts_patient_data, includes_medical_service,
              includes_clinical_decision_support, includes_pant, includes_neuroboard
         FROM commercial_offers WHERE code = 'institutional-pilot-1-0'`,
    )
    .get() as Record<string, number | string | null>;
  assert.equal(pilot.price_cents, 149_000);
  assert.equal(pilot.sale_mode, "invite_only");
  assert.equal(pilot.max_units, 1);
  assert.equal(pilot.max_authorized_users, 10);
  assert.equal(pilot.max_licenses, 3);
  assert.equal(pilot.accepts_patient_data, 0);
  assert.equal(pilot.includes_medical_service, 0);
  assert.equal(pilot.includes_clinical_decision_support, 0);
  assert.equal(pilot.includes_pant, 0);
  assert.equal(pilot.includes_neuroboard, 0);

  const annual = db
    .prepare(`SELECT price_cents, sale_mode FROM commercial_offers WHERE code = 'institutional-annual-1-0'`)
    .get() as { price_cents: number; sale_mode: string };
  assert.equal(annual.price_cents, 249_000);
  assert.equal(annual.sale_mode, "gated");

  for (const code of ["institutional-pilot-1-0", "institutional-annual-1-0"]) {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS total
           FROM commercial_offer_features f
           JOIN commercial_offers o ON o.id = f.offer_id
          WHERE o.code = ? AND f.enabled = 1`,
      )
      .get(code) as { total: number };
    assert.equal(row.total, 5, `${code} deve licenciar cinco features`);
  }

  db.exec(`
    INSERT INTO users(id) VALUES ('u-owner'), ('u-other');
    INSERT INTO clinics(id) VALUES ('clinic-a'), ('clinic-b'), ('clinic-c'), ('clinic-d'), ('clinic-e');
    INSERT INTO clinic_memberships(clinic_id, user_id, role, active) VALUES
      ('clinic-a', 'u-owner', 'owner', 1),
      ('clinic-b', 'u-other', 'owner', 1);
  `);

  // Licença nunca nasce ativa.
  assert.throws(
    () =>
      db.exec(`
        INSERT INTO commercial_licenses(
          id, clinic_id, offer_id, status, unit_label, contract_version,
          billing_reference, created_by_user_id, activated_at, expires_at
        ) SELECT
          'illegal-active', 'clinic-a', id, 'active', 'A', 'terms-v1',
          'bill-x', 'u-owner', datetime('now'), datetime('now', '+365 days')
        FROM commercial_offers WHERE code = 'institutional-pilot-1-0';
      `),
    /must start pending/i,
  );

  db.exec(`
    INSERT INTO commercial_licenses(
      id, clinic_id, offer_id, status, unit_label, contract_version,
      billing_reference, created_by_user_id
    ) SELECT
      'lic-a', 'clinic-a', id, 'pending', 'Unidade A', 'commercial-terms-v1',
      'bill-a', 'u-owner'
    FROM commercial_offers WHERE code = 'institutional-pilot-1-0';
  `);

  // Cobrança sem aceite não ativa.
  assert.throws(
    () =>
      db.exec(`UPDATE commercial_licenses
                 SET status='active', activated_at=datetime('now'), expires_at=datetime('now','+365 days')
               WHERE id='lic-a';`),
    /manager acceptance required/i,
  );

  db.exec(`
    INSERT INTO commercial_license_acceptances(
      license_id, accepted_by_user_id, terms_version,
      no_patient_data_accepted, no_medical_service_accepted, no_redistribution_accepted
    ) VALUES ('lic-a', 'u-owner', 'commercial-terms-v1', 1, 1, 1);
  `);

  // Aceite sem usuário autorizado ainda não ativa.
  assert.throws(
    () =>
      db.exec(`UPDATE commercial_licenses
                 SET status='active', activated_at=datetime('now'), expires_at=datetime('now','+365 days')
               WHERE id='lic-a';`),
    /authorized user required/i,
  );

  db.exec(`
    INSERT INTO commercial_license_users(license_id, user_id, status, authorized_by_user_id)
    VALUES ('lic-a', 'u-owner', 'active', 'u-owner');
    UPDATE commercial_licenses
       SET status='active', activated_at=datetime('now'), expires_at=datetime('now','+365 days')
     WHERE id='lic-a';
  `);
  assert.equal(
    (db.prepare(`SELECT status FROM commercial_licenses WHERE id='lic-a'`).get() as { status: string }).status,
    "active",
  );

  // Usuário de outra unidade não ganha assento comercial na clínica A.
  assert.throws(
    () =>
      db.exec(`INSERT INTO commercial_license_users(license_id, user_id, status, authorized_by_user_id)
               VALUES ('lic-a', 'u-other', 'active', 'u-owner');`),
    /active clinic member/i,
  );

  // O banco também impõe o teto de 10 usuários autorizados.
  for (let index = 2; index <= 11; index += 1) {
    const id = `u-${index}`;
    db.prepare(`INSERT INTO users(id) VALUES (?)`).run(id);
    db.prepare(
      `INSERT INTO clinic_memberships(clinic_id, user_id, role, active)
       VALUES ('clinic-a', ?, 'professional', 1)`,
    ).run(id);
  }
  for (let index = 2; index <= 10; index += 1) {
    const id = `u-${index}`;
    db.prepare(
      `INSERT INTO commercial_license_users(license_id, user_id, status, authorized_by_user_id)
       VALUES ('lic-a', ?, 'active', 'u-owner')`,
    ).run(id);
  }
  assert.throws(
    () =>
      db.prepare(
        `INSERT INTO commercial_license_users(license_id, user_id, status, authorized_by_user_id)
         VALUES ('lic-a', 'u-11', 'active', 'u-owner')`,
      ).run(),
    /authorized user cap reached/i,
  );

  // Licença ativa + feature válida + ator autorizado: telemetria permitida.
  db.exec(`
    INSERT INTO commercial_usage_events(
      id, clinic_id, license_id, actor_user_id, kind, feature_code, metadata_json
    ) VALUES (
      'event-ok', 'clinic-a', 'lic-a', 'u-owner', 'material_open',
      'form.preconsultation', '{"materialId":"form.preconsultation"}'
    );
  `);
  assert.throws(
    () =>
      db.exec(`
        INSERT INTO commercial_usage_events(
          id, clinic_id, license_id, actor_user_id, kind, feature_code
        ) VALUES (
          'event-unauthorized', 'clinic-a', 'lic-a', 'u-11', 'material_open',
          'form.preconsultation'
        );
      `),
    /authorized active user/i,
  );
  assert.throws(
    () =>
      db.exec(`
        INSERT INTO commercial_usage_events(
          id, clinic_id, license_id, actor_user_id, kind, feature_code
        ) VALUES (
          'event-cross-tenant', 'clinic-b', 'lic-a', 'u-owner', 'material_open',
          'form.preconsultation'
        );
      `),
    /license\/clinic mismatch/i,
  );

  // Coorte piloto é estruturalmente limitada a três licenças vivas.
  db.exec(`
    INSERT INTO commercial_licenses(
      id, clinic_id, offer_id, status, unit_label, contract_version,
      billing_reference, created_by_user_id
    ) SELECT 'lic-c', 'clinic-c', id, 'pending', 'C', 'terms-v1', 'bill-c', 'u-owner'
      FROM commercial_offers WHERE code='institutional-pilot-1-0';
    INSERT INTO commercial_licenses(
      id, clinic_id, offer_id, status, unit_label, contract_version,
      billing_reference, created_by_user_id
    ) SELECT 'lic-d', 'clinic-d', id, 'pending', 'D', 'terms-v1', 'bill-d', 'u-owner'
      FROM commercial_offers WHERE code='institutional-pilot-1-0';
  `);
  assert.throws(
    () =>
      db.exec(`
        INSERT INTO commercial_licenses(
          id, clinic_id, offer_id, status, unit_label, contract_version,
          billing_reference, created_by_user_id
        ) SELECT 'lic-e', 'clinic-e', id, 'pending', 'E', 'terms-v1', 'bill-e', 'u-owner'
          FROM commercial_offers WHERE code='institutional-pilot-1-0';
      `),
    /license cap reached/i,
  );

  // Aceite que viole explicitamente a fronteira de dados é recusado por CHECK.
  db.exec(`
    INSERT INTO commercial_licenses(
      id, clinic_id, offer_id, status, unit_label, contract_version,
      billing_reference, created_by_user_id
    ) SELECT 'lic-annual', 'clinic-b', id, 'pending', 'B', 'terms-annual-v1', 'bill-b', 'u-other'
      FROM commercial_offers WHERE code='institutional-annual-1-0';
  `);
  assert.throws(
    () =>
      db.exec(`
        INSERT INTO commercial_license_acceptances(
          license_id, accepted_by_user_id, terms_version,
          no_patient_data_accepted, no_medical_service_accepted, no_redistribution_accepted
        ) VALUES ('lic-annual', 'u-other', 'terms-annual-v1', 0, 1, 1);
      `),
    /constraint/i,
  );
}

console.log("✓ SaaS commercial canonical: pricing, scope, privacy, lifecycle and tenant limits locked");
