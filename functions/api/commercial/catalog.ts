import {
  COMMERCIAL_OFFERS,
  type CommercialOffer,
} from "../../../shared/commercial";
import { tenantJson } from "../tenant/_core";

function publicProjection(offer: CommercialOffer) {
  return {
    code: offer.code,
    name: offer.name,
    priceCents: offer.priceCents,
    currency: offer.currency,
    termDays: offer.termDays,
    saleMode: offer.saleMode,
    orderablePublicly: offer.saleMode === "public",
    maxUnits: offer.maxUnits,
    maxAuthorizedUsers: offer.maxAuthorizedUsers,
    onboardingMinutes: offer.onboardingMinutes,
    supportMinutes: offer.supportMinutes,
    features: [...offer.features],
    exclusions: {
      patientData: true,
      medicalService: true,
      clinicalDecisionSupport: true,
      psychometricScoring: true,
      pant: true,
      neuroBoard: true,
      redistribution: true,
      whiteLabel: true,
    },
  };
}

/**
 * GET /api/commercial/catalog
 *
 * Catálogo informativo. Não inicia checkout e não contorna `saleMode`.
 * `institutional-pilot-1-0` permanece por convite; o plano anual permanece
 * gated até decisão formal pós-piloto.
 */
export const onRequestGet: PagesFunction = async () => {
  return tenantJson({
    version: "2026-09-08",
    offers: Object.values(COMMERCIAL_OFFERS).map(publicProjection),
  });
};
