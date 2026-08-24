export type ClinicalBrowserPersistenceDecision = "ALLOW" | "EPHEMERAL_ONLY" | "DENY";

export type ClinicalBrowserDataType =
  | "UI_PREFERENCE"
  | "NON_CLINICAL"
  | "LOCAL_ONLY_EXPLICIT"
  | "CLINICAL_EPHEMERAL"
  | "CLINICAL_LONGITUDINAL"
  | "LIVE_FORBIDDEN";

export type ClinicalBrowserPersistencePurpose =
  | "read"
  | "write"
  | "remove"
  | "restore"
  | "migrate";

export interface ClinicalBrowserPersistenceInput {
  environment: "development" | "production" | "test" | "unknown";
  authMode: "remote" | "local" | "auto" | "unknown";
  authenticated: boolean;
  dataType: ClinicalBrowserDataType;
  namespace: string;
  purpose: ClinicalBrowserPersistencePurpose;
}

const SECURE_NAMESPACE = "neuroped:secure:";
const AUTH_ACCESS_KEY = "neuroped:access";

// Capturado antes de instalar a fronteira. A leitura do token não pode passar
// pelo próprio wrapper, senão Storage.getItem entraria em recursão.
const nativeStorageGetItem =
  typeof Storage !== "undefined" ? Storage.prototype.getItem : null;

const exactClinicalNamespaces: Record<string, ClinicalBrowserDataType> = {
  "pre-consultas": "CLINICAL_EPHEMERAL",
  "pre-retornos": "CLINICAL_EPHEMERAL",
  "caa:workspace:v3": "CLINICAL_LONGITUDINAL",
  "assinatura:registros:v2": "CLINICAL_LONGITUDINAL",
  "cognitive-lab:sessions:v2": "CLINICAL_LONGITUDINAL",
  "agenda:workspace:v1": "CLINICAL_LONGITUDINAL",
  "neuroped:pre-consultas": "CLINICAL_EPHEMERAL",
  "neuroped:pre-retornos": "CLINICAL_EPHEMERAL",
  "neuroped:cognitive-lab:sessions": "CLINICAL_LONGITUDINAL",
  "neuroped:caa:board:v1": "CLINICAL_LONGITUDINAL",
  "neuroped:caa:favs:v1": "CLINICAL_LONGITUDINAL",
  "neuroped:caa:hist:v1": "CLINICAL_LONGITUDINAL",
  "neuroped:assinatura:registros:v1": "CLINICAL_LONGITUDINAL",
  "np_filtro_state_v1": "CLINICAL_EPHEMERAL",
  "neuroped:filter-flash": "CLINICAL_EPHEMERAL",
};

const clinicalNamespacePrefixes: Array<[string, ClinicalBrowserDataType]> = [
  ["scale-draft:", "CLINICAL_EPHEMERAL"],
  ["neuroped:scale-draft:", "CLINICAL_EPHEMERAL"],
  ["diario:", "CLINICAL_LONGITUDINAL"],
  ["neuroped:diario:", "CLINICAL_LONGITUDINAL"],
  ["conecta:events:", "CLINICAL_LONGITUDINAL"],
];

/**
 * Superfícies cuja função clínica depende de um workspace/histórico local e
 * que ainda não possuem fonte tenant-aware equivalente no backend canônico.
 * Em LIVE remoto elas falham fechadas ANTES do mount, em vez de montar e
 * depender apenas do guard de Storage para neutralizar tentativas legadas.
 */
export const LIVE_BROWSER_LOCAL_CLINICAL_ROUTES = [
  "/caa",
  "/assinatura-digital",
  "/cognitive-lab",
] as const;

function stripSecureNamespace(namespace: string): string {
  return namespace.startsWith(SECURE_NAMESPACE)
    ? namespace.slice(SECURE_NAMESPACE.length)
    : namespace;
}

export function classifyClinicalBrowserNamespace(
  namespace: string,
): ClinicalBrowserDataType | null {
  const normalized = stripSecureNamespace(String(namespace || ""));
  const exact = exactClinicalNamespaces[normalized];
  if (exact) return exact;
  for (const [prefix, dataType] of clinicalNamespacePrefixes) {
    if (normalized.startsWith(prefix)) return dataType;
  }
  return null;
}

export function clinicalBrowserPersistencePolicy(
  input: ClinicalBrowserPersistenceInput,
): ClinicalBrowserPersistenceDecision {
  if (input.dataType === "LIVE_FORBIDDEN") {
    return input.authMode === "remote" ? "DENY" : "ALLOW";
  }

  const clinical =
    input.dataType === "CLINICAL_EPHEMERAL" ||
    input.dataType === "CLINICAL_LONGITUDINAL";

  // Regra canônica LIVE: uma sessão autenticada no backend remoto não lê,
  // restaura, migra, grava nem remove PHI do storage do navegador. Remoções de
  // segurança continuam possíveis depois que clearAuth() encerra a sessão.
  if (input.authMode === "remote" && input.authenticated && clinical) {
    return "DENY";
  }

  if (input.dataType === "CLINICAL_EPHEMERAL") return "EPHEMERAL_ONLY";
  return "ALLOW";
}

export function isLiveBrowserLocalClinicalRouteDenied(
  path: string,
  accessMode: "remote" | "local",
  authenticated: boolean,
): boolean {
  if (accessMode !== "remote" || !authenticated) return false;
  const normalized = String(path || "/").split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  return LIVE_BROWSER_LOCAL_CLINICAL_ROUTES.some((route) =>
    normalized === route || normalized.startsWith(`${route}/`),
  );
}

function configuredEnvironment(): ClinicalBrowserPersistenceInput["environment"] {
  if (import.meta.env?.PROD === true) return "production";
  if (import.meta.env?.MODE === "test") return "test";
  if (import.meta.env?.DEV === true) return "development";
  return "unknown";
}

function configuredAuthMode(): ClinicalBrowserPersistenceInput["authMode"] {
  const mode = import.meta.env?.VITE_AUTH_MODE;
  return mode === "remote" || mode === "local" || mode === "auto"
    ? mode
    : "unknown";
}

function hasAuthenticatedRemoteSession(): boolean {
  if (!nativeStorageGetItem || typeof sessionStorage === "undefined") return false;
  try {
    return Boolean(nativeStorageGetItem.call(sessionStorage, AUTH_ACCESS_KEY));
  } catch {
    return false;
  }
}

export function clinicalBrowserPersistenceDecisionForNamespace(
  namespace: string,
  purpose: ClinicalBrowserPersistencePurpose,
): ClinicalBrowserPersistenceDecision {
  const dataType = classifyClinicalBrowserNamespace(namespace);
  if (!dataType) return "ALLOW";
  return clinicalBrowserPersistencePolicy({
    environment: configuredEnvironment(),
    authMode: configuredAuthMode(),
    authenticated: hasAuthenticatedRemoteSession(),
    dataType,
    namespace,
    purpose,
  });
}

export function isClinicalBrowserPersistenceDenied(
  namespace: string,
  purpose: ClinicalBrowserPersistencePurpose,
): boolean {
  return clinicalBrowserPersistenceDecisionForNamespace(namespace, purpose) === "DENY";
}

let storageBoundaryInstalled = false;

/**
 * Defesa transversal para código legado que ainda toca Storage diretamente.
 * A lista é intencionalmente estreita: preferências de UI e credenciais de auth
 * não são alteradas. Nenhum valor clínico é inspecionado ou logado.
 */
export function installClinicalBrowserPersistenceBoundary(): void {
  if (storageBoundaryInstalled || typeof Storage === "undefined") return;
  storageBoundaryInstalled = true;

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.getItem = function getItem(key: string): string | null {
    if (isClinicalBrowserPersistenceDenied(key, "read")) return null;
    return originalGetItem.call(this, key);
  };

  Storage.prototype.setItem = function setItem(key: string, value: string): void {
    if (isClinicalBrowserPersistenceDenied(key, "write")) return;
    originalSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function removeItem(key: string): void {
    if (isClinicalBrowserPersistenceDenied(key, "remove")) return;
    originalRemoveItem.call(this, key);
  };
}