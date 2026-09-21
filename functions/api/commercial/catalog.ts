import { COMMERCIAL_OFFERS, COMMERCIAL_MATERIALS, type CommercialOffer } from "../../../shared/commercial";
import { tenantJson } from "../tenant/_core";

function publicProjection(offer: CommercialOffer) {
  return {
    code: offer.code,
    name: offer.name,
    priceCents: offer.priceCents,
    currency: offer.currency,
    termDays: offer.termDays,
    termsVersion: offer.termsVersion,
    saleMode: offer.saleMode,
    orderablePublicly: offer.saleMode === "public",
    maxUnits: offer.maxUnits,
    maxAuthorizedUsers: offer.maxAuthorizedUsers,
    onboardingMinutes: offer.onboardingMinutes,
    supportMinutes: offer.supportMinutes,
    // Mantém os códigos históricos, sem equiparar inclusão a exclusividade.
    features: [...offer.features],
    licensedMaterials: offer.features.filter((code) => COMMERCIAL_MATERIALS[code].surface === "institutional"),
    publicCompanions: offer.features.filter((code) => COMMERCIAL_MATERIALS[code].surface === "public-intake"),
    publicIntakeAutomaticallyLinkedToUnit: false,
    exclusions: {
      patientData: true, medicalService: true, clinicalDecisionSupport: true,
      psychometricScoring: true, pant: true, neuroBoard: true,
      redistribution: true, whiteLabel: true,
    },
  };
}

/** Catálogo informativo: não inicia checkout nem contorna saleMode. */
export const onRequestGet: PagesFunction = async () => tenantJson({
  version: "2026-09-21",
  offers: Object.values(COMMERCIAL_OFFERS).map(publicProjection),
});
