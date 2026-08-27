import type { SaasModuleId } from "./saas-modules";

export const PRIVACY_REQUEST_STATUSES = ["open", "verified", "in_progress", "completed", "rejected", "canceled"] as const;
export type PrivacyRequestStatus = (typeof PRIVACY_REQUEST_STATUSES)[number];

export const INVITE_STATUSES = ["pending", "accepted", "expired", "revoked"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

export const INTEGRATION_IDS = ["email", "webhooks", "fhir", "object-storage", "observability"] as const;
export type IntegrationId = (typeof INTEGRATION_IDS)[number];

export const INTEGRATION_SCOPES = ["module.read", "module.write", "clinical.read", "clinical.write", "admin.read", "admin.write"] as const;
export type IntegrationScope = (typeof INTEGRATION_SCOPES)[number];

export type OperationalIntegration = {
  id: IntegrationId;
  label: string;
  purpose: string;
  moduleIds: SaasModuleId[];
  allowedScopes: IntegrationScope[];
  handlesPhi: boolean;
  requiresSandbox: boolean;
};

export const OPERATIONAL_INTEGRATIONS: readonly OperationalIntegration[] = [
  { id: "email", label: "Mensageria transacional", purpose: "Convites e comunicações neutras", moduleIds: ["access", "messaging", "reminders"], allowedScopes: ["admin.read", "admin.write", "module.read"], handlesPhi: false, requiresSandbox: true },
  { id: "webhooks", label: "Webhooks assinados", purpose: "Eventos operacionais idempotentes", moduleIds: ["developer", "observability", "analytics"], allowedScopes: ["module.read", "admin.read"], handlesPhi: false, requiresSandbox: true },
  { id: "fhir", label: "Interoperabilidade FHIR", purpose: "Intercâmbio explícito com sistemas autorizados", moduleIds: ["interoperability", "developer"], allowedScopes: ["clinical.read", "clinical.write", "module.read"], handlesPhi: true, requiresSandbox: true },
  { id: "object-storage", label: "Object storage", purpose: "Arquivos tenant-aware com URLs temporárias", moduleIds: ["documents", "continuity", "intake"], allowedScopes: ["module.read", "module.write", "clinical.read", "clinical.write"], handlesPhi: true, requiresSandbox: true },
  { id: "observability", label: "Observabilidade", purpose: "Métricas e alertas sem conteúdo clínico", moduleIds: ["observability", "analytics"], allowedScopes: ["admin.read", "module.read"], handlesPhi: false, requiresSandbox: false },
] as const;

export function isPrivacyRequestStatus(value: unknown): value is PrivacyRequestStatus {
  return typeof value === "string" && (PRIVACY_REQUEST_STATUSES as readonly string[]).includes(value);
}

export function isInviteStatus(value: unknown): value is InviteStatus {
  return typeof value === "string" && (INVITE_STATUSES as readonly string[]).includes(value);
}

export function integrationById(value: unknown): OperationalIntegration | null {
  return OPERATIONAL_INTEGRATIONS.find((integration) => integration.id === value) ?? null;
}

export function isIntegrationScope(value: unknown): value is IntegrationScope {
  return typeof value === "string" && (INTEGRATION_SCOPES as readonly string[]).includes(value);
}
