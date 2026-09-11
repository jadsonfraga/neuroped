import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

// O snapshot real recusa licença cuja contract_version tenha drift em relação
// ao SKU atual, e accept.ts exige o mesmo valor antes de ativar.
const coreSource = readFileSync("functions/api/commercial/_core.ts", "utf8");
const acceptSource = readFileSync("functions/api/commercial/accept.ts", "utf8");
assert.match(coreSource, /row\.contract_version\s*!==\s*canonicalOffer\.termsVersion/);
assert.match(acceptSource, /license\.contract_version\s*!==\s*termsVersion/);
assert.match(acceptSource, /COMMERCIAL_TERMS_VERSION_MISMATCH/);

console.log("✓ SaaS commercial terms: SKU → license → acceptance version binding locked");
