import { getAccessToken } from "@/lib/authClient";

export type ClinicalStorageClassification =
  | "clinical-record"
  | "transient-clinical-draft"
  | "clinical-local-draft"
  | "user-preference";

export interface ClinicalStoragePolicyRule {
  classification: ClinicalStorageClassification;
  liveLocalPersistence: "allow" | "deny" | "explicit-only";
  rationale: string;
}

const EXACT_RULES: Record<string, ClinicalStoragePolicyRule> = {
  "pre-consultas": {
    classification: "clinical-record",
    liveLocalPersistence: "deny",
    rationale: "Pré-consulta contém dados identificáveis e clínicos que pertencem ao tenant LIVE.",
  },
  "pre-retornos": {
    classification: "clinical-record",
    liveLocalPersistence: "deny",
    rationale: "Pré-retorno contém evolução, medicação e outros dados clínicos do paciente.",
  },
};

const PREFIX_RULES: Array<{ prefix: string; rule: ClinicalStoragePolicyRule }> = [
  {
    prefix: "diario:",
    rule: {
      classification: "clinical-local-draft",
      liveLocalPersistence: "deny",
      rationale: "Diários clínicos locais não podem formar prontuário paralelo em sessão LIVE.",
    },
  },
  {
    prefix: "scale-draft:",
    rule: {
      classification: "transient-clinical-draft",
      liveLocalPersistence: "explicit-only",
      rationale: "Rascunhos de escala exigem política explícita de escopo, TTL e paciente antes de LIVE.",
    },
  },
  {
    prefix: "cognitive-lab:",
    rule: {
      classification: "transient-clinical-draft",
      liveLocalPersistence: "explicit-only",
      rationale: "Resultados cognitivos temporários exigem vínculo explícito de sessão/paciente antes de LIVE.",
    },
  },
];

export function getClinicalStoragePolicy(key: string): ClinicalStoragePolicyRule | null {
  const exact = EXACT_RULES[key];
  if (exact) return exact;
  return PREFIX_RULES.find(({ prefix }) => key.startsWith(prefix))?.rule ?? null;
}

export function isRemoteAuthenticatedBuild(): boolean {
  return (
    import.meta.env?.VITE_AUTH_MODE === "remote" &&
    Boolean(getAccessToken())
  );
}

/**
 * Regra fail-closed para chaves classificadas como dado clínico que não podem
 * persistir no dispositivo durante uma sessão LIVE autenticada.
 *
 * A função não bloqueia chaves desconhecidas nesta fase para evitar regressão
 * fora do inventário. O CI da Fase 4 deve ampliar o catálogo e tornar novas
 * persistências clínicas não classificadas um erro de build.
 */
export function isLiveLocalPersistenceDenied(key: string): boolean {
  const rule = getClinicalStoragePolicy(key);
  return Boolean(
    rule &&
    rule.liveLocalPersistence === "deny" &&
    isRemoteAuthenticatedBuild()
  );
}
