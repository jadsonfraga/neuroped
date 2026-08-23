export type FrontendStorageApi =
  | "localStorage"
  | "sessionStorage"
  | "secureStorage"
  | "persistentSecureStorage";

export type StorageDataClass =
  | "clinical-record"
  | "clinical-local-draft"
  | "transient-clinical-draft"
  | "transient-clinical-result"
  | "clinical-workspace"
  | "clinical-document-registry"
  | "operational-clinical-record"
  | "auth-session"
  | "user-preference"
  | "device-preference"
  | "application-state";

export type StorageOwnerScope =
  | "tenant-patient"
  | "tenant"
  | "user"
  | "device"
  | "session"
  | "application";

export type LiveLocalPolicy = "allow" | "deny" | "explicit-only";

export interface ClinicalStoragePolicyRule {
  id: string;
  storage: readonly FrontendStorageApi[];
  key: {
    match: "exact" | "prefix";
    value: string;
  };
  dataClass: StorageDataClass;
  ownerScope: StorageOwnerScope;
  liveLocalPolicy: LiveLocalPolicy;
  ttlHours?: number;
  rationale: string;
}

/**
 * Registro canônico das chaves/superfícies de persistência conhecidas.
 *
 * Este arquivo começa como inventário + contrato arquitetural. O auditor de CI
 * exige que toda nova chamada de persistência do frontend seja coberta por uma
 * regra ou por uma exceção genérica explicitamente revisada.
 *
 * A integração runtime deny-by-default será feita por etapas para não alterar
 * silenciosamente semânticas de módulos ainda não auditados.
 */
export const CLINICAL_STORAGE_POLICY_REGISTRY: readonly ClinicalStoragePolicyRule[] = [
  {
    id: "pre-consulta-record",
    storage: ["localStorage", "secureStorage"],
    key: { match: "exact", value: "neuroped:pre-consultas" },
    dataClass: "clinical-record",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "deny",
    rationale: "Legado clínico da Pré-Consulta; não pode ser fonte local em LIVE.",
  },
  {
    id: "pre-consulta-secure-record",
    storage: ["secureStorage"],
    key: { match: "exact", value: "pre-consultas" },
    dataClass: "clinical-record",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "deny",
    rationale: "Registro cifrado efêmero de Pré-Consulta; bloqueado em LIVE autenticado.",
  },
  {
    id: "pre-retorno-record",
    storage: ["localStorage", "secureStorage"],
    key: { match: "exact", value: "neuroped:pre-retornos" },
    dataClass: "clinical-record",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "deny",
    rationale: "Legado clínico do Pré-Retorno; não pode ser fonte local em LIVE.",
  },
  {
    id: "pre-retorno-secure-record",
    storage: ["secureStorage"],
    key: { match: "exact", value: "pre-retornos" },
    dataClass: "clinical-record",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "deny",
    rationale: "Registro cifrado efêmero de Pré-Retorno; bloqueado em LIVE autenticado.",
  },
  {
    id: "clinical-diary",
    storage: ["persistentSecureStorage"],
    key: { match: "prefix", value: "diario:" },
    dataClass: "clinical-local-draft",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "deny",
    rationale: "Diários clínicos não podem formar prontuário local paralelo em LIVE.",
  },
  {
    id: "scale-draft",
    storage: ["secureStorage", "localStorage"],
    key: { match: "prefix", value: "scale-draft:" },
    dataClass: "transient-clinical-draft",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "explicit-only",
    ttlHours: 8,
    rationale: "Respostas parciais de escalas precisam de TTL e isolamento paciente/tenant.",
  },
  {
    id: "cognitive-lab-secure",
    storage: ["secureStorage"],
    key: { match: "exact", value: "cognitive-lab:sessions:v2" },
    dataClass: "transient-clinical-result",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "explicit-only",
    rationale: "Sessões e resultados cognitivos são clínicos e exigem política tenant-aware.",
  },
  {
    id: "cognitive-lab-legacy",
    storage: ["localStorage"],
    key: { match: "exact", value: "neuroped:cognitive-lab:sessions" },
    dataClass: "transient-clinical-result",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "deny",
    rationale: "Legado do Cognitive Lab só pode ser tratado fora do LIVE autenticado.",
  },
  {
    id: "caa-workspace-secure",
    storage: ["secureStorage"],
    key: { match: "exact", value: "caa:workspace:v3" },
    dataClass: "clinical-workspace",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "explicit-only",
    rationale: "Prancha personalizada, histórico e mensagens podem conter conteúdo clínico identificável.",
  },
  {
    id: "caa-workspace-legacy",
    storage: ["localStorage"],
    key: { match: "prefix", value: "neuroped:caa:" },
    dataClass: "clinical-workspace",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "deny",
    rationale: "Legado CAA em texto puro deve permanecer fora do fluxo LIVE.",
  },
  {
    id: "signature-registry-secure",
    storage: ["secureStorage"],
    key: { match: "exact", value: "assinatura:registros:v2" },
    dataClass: "clinical-document-registry",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "explicit-only",
    rationale: "Histórico de documentos inclui paciente/controle e hashes de documentos clínicos.",
  },
  {
    id: "signature-registry-legacy",
    storage: ["localStorage"],
    key: { match: "exact", value: "neuroped:assinatura:registros:v1" },
    dataClass: "clinical-document-registry",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "deny",
    rationale: "Registro legado de documentos não deve ser restaurado/migrado automaticamente em LIVE.",
  },
  {
    id: "legacy-local-agenda",
    storage: ["persistentSecureStorage"],
    key: { match: "exact", value: "agenda:workspace:v1" },
    dataClass: "operational-clinical-record",
    ownerScope: "tenant",
    liveLocalPolicy: "deny",
    rationale: "Agenda local legada contém identificação e notas operacionais; a Agenda oficial é cloud.",
  },
  {
    id: "conecta-local-events",
    storage: ["persistentSecureStorage"],
    key: { match: "prefix", value: "conecta:events:" },
    dataClass: "clinical-record",
    ownerScope: "tenant-patient",
    liveLocalPolicy: "deny",
    rationale: "Conecta usa API tenant-aware em LIVE; persistência local é somente fallback local/offline.",
  },
  {
    id: "auth-session-access",
    storage: ["sessionStorage"],
    key: { match: "exact", value: "neuroped:access" },
    dataClass: "auth-session",
    ownerScope: "session",
    liveLocalPolicy: "allow",
    rationale: "Token de acesso da sessão remota; não é prontuário clínico.",
  },
  {
    id: "auth-session-refresh",
    storage: ["sessionStorage"],
    key: { match: "exact", value: "neuroped:refresh" },
    dataClass: "auth-session",
    ownerScope: "session",
    liveLocalPolicy: "allow",
    rationale: "Token de renovação da sessão remota; não é prontuário clínico.",
  },
  {
    id: "auth-session-user",
    storage: ["sessionStorage"],
    key: { match: "exact", value: "neuroped:user" },
    dataClass: "auth-session",
    ownerScope: "session",
    liveLocalPolicy: "allow",
    rationale: "Cache mínimo da identidade autenticada usado no bootstrap da sessão.",
  },
] as const;

export interface GenericStorageCallsiteRule {
  id: string;
  file: string;
  api: FrontendStorageApi;
  keyExpression: string;
  policyRuleId: string;
  rationale: string;
}

/**
 * Exceções para abstrações onde a chave chega genericamente ao helper e não é
 * resolvível estaticamente no ponto de chamada. O auditor exige arquivo + API +
 * expressão exatos; uma nova abstração/callsite não herda permissão.
 */
export const GENERIC_STORAGE_CALLSITE_REGISTRY: readonly GenericStorageCallsiteRule[] = [
  {
    id: "scale-draft-secure-get",
    file: "client/src/hooks/useSecureScaleDraft.ts",
    api: "secureStorage",
    keyExpression: "key",
    policyRuleId: "scale-draft",
    rationale: "secureDraftStore recebe apenas storageKey scale-draft:* do hook.",
  },
  {
    id: "scale-draft-secure-set",
    file: "client/src/hooks/useSecureScaleDraft.ts",
    api: "secureStorage",
    keyExpression: "key",
    policyRuleId: "scale-draft",
    rationale: "secureDraftStore recebe apenas storageKey scale-draft:* do hook.",
  },
  {
    id: "scale-draft-secure-clear",
    file: "client/src/hooks/useSecureScaleDraft.ts",
    api: "secureStorage",
    keyExpression: "key",
    policyRuleId: "scale-draft",
    rationale: "secureDraftStore recebe apenas storageKey scale-draft:* do hook.",
  },
] as const;

export function findClinicalStoragePolicyRule(
  storage: FrontendStorageApi,
  key: string,
): ClinicalStoragePolicyRule | null {
  return (
    CLINICAL_STORAGE_POLICY_REGISTRY.find((rule) =>
      rule.storage.includes(storage) &&
      (rule.key.match === "exact" ? key === rule.key.value : key.startsWith(rule.key.value)),
    ) ?? null
  );
}

export function isClinicalStorageClass(dataClass: StorageDataClass): boolean {
  return [
    "clinical-record",
    "clinical-local-draft",
    "transient-clinical-draft",
    "transient-clinical-result",
    "clinical-workspace",
    "clinical-document-registry",
    "operational-clinical-record",
  ].includes(dataClass);
}
