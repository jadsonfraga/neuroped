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
  "membership do tenant não equivale a assento/licença autorizada",
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

// Contrato persistente: preços, cinco features e constraints devem coincidir
// com o domínio TypeScript. O teste usa somente entidades sintéticas.
{
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY);
    CREATE TABLE clinics (id TEXT PRIMARY KEY);
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
    INSERT INTO users(id) VALUES ('u-owner'), ('u-member');
    INSERT INTO clinics(id) VALUES ('clinic-a');
    INSERT INTO commercial_licenses(
      id, clinic_id, offer_id, status, unit_label, contract_version,
      created_by_user_id, activated_at, expires_at
    ) SELECT
      'lic-a', 'clinic-a', id, 'active', 'Unidade A', 'commercial-terms-v1',
      'u-owner', '2026-09-08T00:00:00Z', '2027-09-08T00:00:00Z'
    FROM commercial_offers WHERE code = 'institutional-pilot-1-0';
    INSERT INTO commercial_license_acceptances(
      license_id, accepted_by_user_id, terms_version,
      no_patient_data_accepted, no_medical_service_accepted, no_redistribution_accepted
    ) VALUES ('lic-a', 'u-owner', 'commercial-terms-v1', 1, 1, 1);
    INSERT INTO commercial_license_users(
      license_id, user_id, status, authorized_by_user_id
    ) VALUES ('lic-a', 'u-member', 'active', 'u-owner');
  `);

  assert.throws(
    () =>
      db.exec(`
        INSERT INTO commercial_license_acceptances(
          license_id, accepted_by_user_id, terms_version,
          no_patient_data_accepted, no_medical_service_accepted, no_redistribution_accepted
        ) VALUES ('lic-a', 'u-owner', 'v-invalid', 0, 1, 1);
      `),
    /constraint|unique/i,
  );
}

console.log("✓ SaaS commercial canonical contract: pricing, scope, privacy and persistence locked");
