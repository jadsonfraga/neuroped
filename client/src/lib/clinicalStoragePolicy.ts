import { getAccessToken } from "@/lib/authClient";

export type ClinicalStorageClass =
  | "clinical-record"
  | "clinical-local-draft"
  | "transient-clinical-draft"
  | "transient-clinical-result"
  | "user-preference";

export interface ClinicalStoragePolicyRule {
  id: string;
  storageClass: ClinicalStorageClass;
  match: "exact" | "prefix";
  remoteAuthenticatedLocal: "allow" | "deny";
}

const CLINICAL_STORAGE_POLICY: ClinicalStoragePolicyRule[] = [
  {
    id: "pre-consultas",
    storageClass: "clinical-record",
    match: "exact",
    remoteAuthenticatedLocal: "deny",
  },
  {
    id: "pre-retornos",
    storageClass: "clinical-record",
    match: "exact",
    remoteAuthenticatedLocal: "deny",
  },
  {
    id: "diario:",
    storageClass: "clinical-local-draft",
    match: "prefix",
    remoteAuthenticatedLocal: "deny",
  },
  {
    id: "scale-draft:",
    storageClass: "transient-clinical-draft",
    match: "prefix",
    remoteAuthenticatedLocal: "deny",
  },
  {
    id: "cognitive-lab:",
    storageClass: "transient-clinical-result",
    match: "prefix",
    remoteAuthenticatedLocal: "deny",
  },
];

export function listClinicalStoragePolicy(): readonly ClinicalStoragePolicyRule[] {
  return CLINICAL_STORAGE_POLICY;
}

export function getClinicalStoragePolicyRule(key: string): ClinicalStoragePolicyRule | null {
  return (
    CLINICAL_STORAGE_POLICY.find((rule) =>
      rule.match === "exact" ? key === rule.id : key.startsWith(rule.id),
    ) ?? null
  );
}

export function isRemoteAuthenticatedClinicalRuntime(): boolean {
  return (
    import.meta.env?.VITE_AUTH_MODE === "remote" &&
    Boolean(getAccessToken())
  );
}

/**
 * Política deny-by-default para qualquer helper que persista dado clínico no browser.
 * Chave clínica nova precisa ser classificada antes de poder usar persistência local.
 */
export function canUseLocalClinicalPersistence(key: string): boolean {
  const rule = getClinicalStoragePolicyRule(key);
  if (!rule) return false;
  if (!isRemoteAuthenticatedClinicalRuntime()) return true;
  return rule.remoteAuthenticatedLocal === "allow";
}
