import { getAccessToken } from "@/lib/authClient";

export type ClinicalStorageClassification =
  | "clinical-record"
  | "clinical-local-draft"
  | "transient-clinical-draft"
  | "transient-clinical-result"
  | "user-preference";

export interface ClinicalStoragePolicyEntry {
  classification: ClinicalStorageClassification;
  liveAuthenticatedLocalPersistence: "deny" | "allow";
  legacyLocalStorageKeys: readonly string[];
  description: string;
}

/**
 * Registro canônico de persistências clínicas do frontend.
 *
 * A Fase 4 começa pelas superfícies P0 de Pré-Consulta/Pré-Retorno. Novas
 * superfícies clínicas devem ser adicionadas aqui antes de ganhar persistência
 * local. O inventário completo e o gate deny-by-default entram nas etapas
 * seguintes da mesma fase, sem misturar módulos não auditados neste PR.
 */
export const CLINICAL_STORAGE_POLICY = {
  "pre-consultas": {
    classification: "clinical-record",
    liveAuthenticatedLocalPersistence: "deny",
    legacyLocalStorageKeys: ["neuroped:pre-consultas"],
    description: "Fila e resumo operacional de pré-consulta com identificação e queixa clínica.",
  },
  "pre-retornos": {
    classification: "clinical-record",
    liveAuthenticatedLocalPersistence: "deny",
    legacyLocalStorageKeys: ["neuroped:pre-retornos"],
    description: "Pré-retorno com evolução, crises, medicação e demais dados clínicos.",
  },
} as const satisfies Record<string, ClinicalStoragePolicyEntry>;

export type RegisteredClinicalStorageKey = keyof typeof CLINICAL_STORAGE_POLICY;

export interface ClinicalPersistenceContext {
  accessMode?: string | null;
  isAuthenticated: boolean;
}

export function isRemoteAuthenticatedClinicalSession(
  context: ClinicalPersistenceContext,
): boolean {
  return context.accessMode === "remote" && context.isAuthenticated;
}

export function getClinicalStoragePolicy(
  key: string,
): ClinicalStoragePolicyEntry | undefined {
  return CLINICAL_STORAGE_POLICY[key as RegisteredClinicalStorageKey];
}

export function isRegisteredClinicalStorageKey(
  key: string,
): key is RegisteredClinicalStorageKey {
  return Boolean(getClinicalStoragePolicy(key));
}

export function isClinicalLocalPersistenceBlocked(
  key: string,
  context?: ClinicalPersistenceContext,
): boolean {
  const policy = getClinicalStoragePolicy(key);
  if (!policy) return false;

  const resolvedContext = context ?? {
    accessMode: import.meta.env?.VITE_AUTH_MODE,
    isAuthenticated: Boolean(getAccessToken()),
  };

  return (
    isRemoteAuthenticatedClinicalSession(resolvedContext) &&
    policy.liveAuthenticatedLocalPersistence === "deny"
  );
}
