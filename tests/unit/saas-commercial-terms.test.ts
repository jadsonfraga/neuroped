import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  INSTITUTIONAL_ANNUAL_OFFER,
  INSTITUTIONAL_PILOT_OFFER,
  offerAcceptsTermsVersion,
} from "../../shared/commercial";
import {
  commercialContractHasDrift,
  evaluateCommercialAccess,
  type CommercialLicenseSnapshot,
} from "../../functions/api/commercial/_core";

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

// A versão contratual persistida na licença não é escolhida pelo caller/admin:
// provision.ts deve derivá-la do offer canônico e rejeitar precondição divergente.
const provisionSource = readFileSync("functions/api/commercial/provision.ts", "utf8");
assert.match(provisionSource, /requestedTermsVersion\s*!==\s*offer\.termsVersion/);
assert.match(provisionSource, /COMMERCIAL_TERMS_VERSION_MISMATCH/);
assert.match(provisionSource, /offer\.termsVersion,\s*billingReference/);
assert.doesNotMatch(
  provisionSource,
  /\.bind\([\s\S]{0,300}requestedTermsVersion[\s\S]{0,300}billingReference/,
  "requestedTermsVersion não pode ser persistida como contract_version",
);

// Verificar o comportamento, não a grafia ===/!== de uma implementação.
// A leitura SQL real e as respostas HTTP estão em saas-commercial-integrity.
const snapshot: CommercialLicenseSnapshot = {
  licenseId: "synthetic-license", clinicId: "synthetic-clinic",
  offerCode: INSTITUTIONAL_PILOT_OFFER.code, offerName: INSTITUTIONAL_PILOT_OFFER.name,
  priceCents: INSTITUTIONAL_PILOT_OFFER.priceCents, currency: "BRL",
  contractVersion: INSTITUTIONAL_PILOT_OFFER.termsVersion, contractState: "valid",
  status: "active", unitLabel: "Synthetic", activatedAt: "2020-01-01T00:00:00Z",
  expiresAt: "2099-01-01T00:00:00Z", maxAuthorizedUsers: 10, authorizedUsers: 1,
  onboardingMinutes: 60, supportMinutes: 120, supportMinutesUsed: 0,
  features: [...INSTITUTIONAL_PILOT_OFFER.features],
};
assert.equal(commercialContractHasDrift(snapshot), false);
for (const drift of [
  { ...snapshot, contractVersion: "another-v9" },
  { ...snapshot, contractVersion: "" },
  { ...snapshot, offerCode: "unknown" },
  { ...snapshot, contractState: "drift" as const },
]) {
  assert.equal(commercialContractHasDrift(drift), true);
  assert.deepEqual(evaluateCommercialAccess(drift, "form.change_log", true), {
    ok: false, reason: "COMMERCIAL_OFFER_UNKNOWN",
  });
}
assert.deepEqual(evaluateCommercialAccess(snapshot, "form.change_log", true), { ok: true });
assert.deepEqual(evaluateCommercialAccess(null, "form.change_log", true), {
  ok: false, reason: "COMMERCIAL_LICENSE_MISSING",
});
const acceptSource = readFileSync("functions/api/commercial/accept.ts", "utf8");
assert.match(acceptSource, /license\.contract_version\s*!==\s*termsVersion/);
assert.match(acceptSource, /COMMERCIAL_TERMS_VERSION_MISMATCH/);

console.log("✓ SaaS commercial terms: SKU → license → acceptance version binding locked");
