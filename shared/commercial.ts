/*
 * NeuroPed SaaS — contrato comercial canônico.
 *
 * Esta camada é deliberadamente separada de `shared/billing.ts`.
 * Billing responde "como cobrar"; este módulo responde "o que foi vendido".
 *
 * O primeiro produto vendável NÃO é o prontuário clínico, PANT, NeuroBoard,
 * apoio à decisão ou uma biblioteca irrestrita de escalas. É uma licença
 * institucional de escopo pequeno, auditável e sem tratamento de PHI pelo
 * produto comercial.
 */

export const commercialFeatureCodes = [
  "form.preconsultation",
  "form.change_log",
  "form.school_feedback",
  "form.approved_plan",
  "form.routine_log",
] as const;

export type CommercialFeatureCode = (typeof commercialFeatureCodes)[number];

export const commercialOfferCodes = [
  "institutional-pilot-1-0",
  "institutional-annual-1-0",
] as const;

export type CommercialOfferCode = (typeof commercialOfferCodes)[number];
export type CommercialSaleMode = "invite_only" | "gated" | "public";
export type CommercialLicenseStatus =
  | "pending"
  | "active"
  | "suspended"
  | "expired"
  | "canceled";

export interface CommercialOffer {
  code: CommercialOfferCode;
  name: string;
  priceCents: number;
  currency: "BRL";
  termDays: number;
  saleMode: CommercialSaleMode;
  maxUnits: number;
  maxAuthorizedUsers: number;
  maxLicenses: number | null;
  onboardingMinutes: number;
  supportMinutes: number;
  features: readonly CommercialFeatureCode[];
  guardrails: {
    acceptsPatientData: false;
    includesMedicalService: false;
    includesClinicalDecisionSupport: false;
    includesPsychometricScoring: false;
    includesPant: false;
    includesNeuroBoard: false;
    allowsRedistribution: false;
    allowsWhiteLabel: false;
  };
}

const commercialGuardrails = {
  acceptsPatientData: false,
  includesMedicalService: false,
  includesClinicalDecisionSupport: false,
  includesPsychometricScoring: false,
  includesPant: false,
  includesNeuroBoard: false,
  allowsRedistribution: false,
  allowsWhiteLabel: false,
} as const;

export const INSTITUTIONAL_PILOT_OFFER: CommercialOffer = Object.freeze({
  code: "institutional-pilot-1-0",
  name: "NeuroPed Institucional — Piloto 1.0",
  priceCents: 149_000,
  currency: "BRL",
  termDays: 365,
  saleMode: "invite_only",
  maxUnits: 1,
  maxAuthorizedUsers: 10,
  maxLicenses: 3,
  onboardingMinutes: 60,
  supportMinutes: 120,
  features: commercialFeatureCodes,
  guardrails: commercialGuardrails,
});

export const INSTITUTIONAL_ANNUAL_OFFER: CommercialOffer = Object.freeze({
  code: "institutional-annual-1-0",
  name: "NeuroPed Institucional — Anual 1.0",
  priceCents: 249_000,
  currency: "BRL",
  termDays: 365,
  // Permanece fechado até o gate pós-piloto. Alterar para `public` exige PR.
  saleMode: "gated",
  maxUnits: 1,
  maxAuthorizedUsers: 10,
  maxLicenses: null,
  onboardingMinutes: 60,
  supportMinutes: 120,
  features: commercialFeatureCodes,
  guardrails: commercialGuardrails,
});

export const COMMERCIAL_OFFERS: Readonly<Record<CommercialOfferCode, CommercialOffer>> =
  Object.freeze({
    "institutional-pilot-1-0": INSTITUTIONAL_PILOT_OFFER,
    "institutional-annual-1-0": INSTITUTIONAL_ANNUAL_OFFER,
  });

export function getCommercialOffer(code: string): CommercialOffer | null {
  return Object.prototype.hasOwnProperty.call(COMMERCIAL_OFFERS, code)
    ? COMMERCIAL_OFFERS[code as CommercialOfferCode]
    : null;
}

export interface CommercialOrderGateInput {
  offerCode: string;
  invited?: boolean;
  expansionGateOpen?: boolean;
}

export interface CommercialOrderGateResult {
  ok: boolean;
  reason:
    | null
    | "UNKNOWN_OFFER"
    | "INVITATION_REQUIRED"
    | "EXPANSION_GATE_CLOSED";
}

/**
 * Impede que checkout existente transforme, por acidente, um SKU ainda não
 * liberado em venda pública. O modo de venda pertence ao produto, não ao PSP.
 */
export function canOrderCommercialOffer(
  input: CommercialOrderGateInput,
): CommercialOrderGateResult {
  const offer = getCommercialOffer(input.offerCode);
  if (!offer) return { ok: false, reason: "UNKNOWN_OFFER" };
  if (offer.saleMode === "invite_only" && input.invited !== true) {
    return { ok: false, reason: "INVITATION_REQUIRED" };
  }
  if (offer.saleMode === "gated" && input.expansionGateOpen !== true) {
    return { ok: false, reason: "EXPANSION_GATE_CLOSED" };
  }
  return { ok: true, reason: null };
}

export interface CommercialActivationInput extends CommercialOrderGateInput {
  units: number;
  authorizedUsers: number;
  acceptsNoPatientData: boolean;
  acceptsNoMedicalService: boolean;
  acceptsNoRedistribution: boolean;
}

export interface CommercialActivationResult {
  ok: boolean;
  errors: string[];
}

export function validateCommercialActivation(
  input: CommercialActivationInput,
): CommercialActivationResult {
  const offer = getCommercialOffer(input.offerCode);
  if (!offer) return { ok: false, errors: ["UNKNOWN_OFFER"] };

  const errors: string[] = [];
  const orderGate = canOrderCommercialOffer(input);
  if (!orderGate.ok && orderGate.reason) errors.push(orderGate.reason);

  if (!Number.isInteger(input.units) || input.units < 1 || input.units > offer.maxUnits) {
    errors.push("UNIT_LIMIT_EXCEEDED");
  }
  if (
    !Number.isInteger(input.authorizedUsers) ||
    input.authorizedUsers < 1 ||
    input.authorizedUsers > offer.maxAuthorizedUsers
  ) {
    errors.push("AUTHORIZED_USER_LIMIT_EXCEEDED");
  }
  if (input.acceptsNoPatientData !== true) errors.push("NO_PATIENT_DATA_NOT_ACCEPTED");
  if (input.acceptsNoMedicalService !== true) errors.push("NO_MEDICAL_SERVICE_NOT_ACCEPTED");
  if (input.acceptsNoRedistribution !== true) errors.push("NO_REDISTRIBUTION_NOT_ACCEPTED");

  return { ok: errors.length === 0, errors };
}

export function offerHasCommercialFeature(
  offerCode: string,
  feature: string,
): feature is CommercialFeatureCode {
  const offer = getCommercialOffer(offerCode);
  return Boolean(offer?.features.includes(feature as CommercialFeatureCode));
}

export function commercialLicenseIsUsable(
  license: { status: CommercialLicenseStatus; activatedAt: string | null; expiresAt: string | null },
  now: Date = new Date(),
): boolean {
  if (license.status !== "active" || !license.activatedAt || !license.expiresAt) return false;
  const starts = new Date(license.activatedAt).getTime();
  const ends = new Date(license.expiresAt).getTime();
  const timestamp = now.getTime();
  return Number.isFinite(starts) && Number.isFinite(ends) && timestamp >= starts && timestamp < ends;
}

export const commercialUsageKinds = [
  "material_open",
  "material_export",
  "onboarding_minutes",
  "support_minutes",
  "authorized_user_added",
  "authorized_user_revoked",
] as const;
export type CommercialUsageKind = (typeof commercialUsageKinds)[number];

const ALLOWED_USAGE_METADATA_KEYS = new Set([
  "materialId",
  "deliveryChannel",
  "clientVersion",
  "sourceVersion",
  "supportCategory",
]);

/**
 * Eventos comerciais são telemetria operacional, nunca prontuário.
 * A allow-list de chaves torna difícil introduzir PHI por conveniência.
 */
export function validateCommercialUsageMetadata(
  metadata: Record<string, unknown> | null | undefined,
): { ok: boolean; reason?: string } {
  if (!metadata) return { ok: true };
  const entries = Object.entries(metadata);
  if (entries.length > 8) return { ok: false, reason: "COMMERCIAL_METADATA_TOO_LARGE" };

  for (const [key, value] of entries) {
    if (!ALLOWED_USAGE_METADATA_KEYS.has(key)) {
      return { ok: false, reason: "COMMERCIAL_METADATA_KEY_FORBIDDEN" };
    }
    if (
      !(
        value === null ||
        typeof value === "boolean" ||
        typeof value === "number" ||
        (typeof value === "string" && value.length <= 120)
      )
    ) {
      return { ok: false, reason: "COMMERCIAL_METADATA_VALUE_INVALID" };
    }
  }
  return { ok: true };
}
