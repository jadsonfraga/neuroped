export const SAAS_MODULE_IDS = [
  "workspace",
  "entitlements",
  "onboarding",
  "access",
  "white-label",
  "observability",
  "continuity",
  "privacy",
  "messaging",
  "documents",
  "reminders",
  "intake",
  "network",
  "school-family",
  "tasks",
  "analytics",
  "catalog",
  "playbooks",
  "interoperability",
  "developer",
] as const;

export type SaasModuleId = (typeof SAAS_MODULE_IDS)[number];

const SAAS_MODULE_ID_SET = new Set<string>(SAAS_MODULE_IDS);

export function isSaasModuleId(value: unknown): value is SaasModuleId {
  return typeof value === "string" && SAAS_MODULE_ID_SET.has(value);
}

export interface SaasModuleSetting {
  moduleId: SaasModuleId;
  enabled: boolean;
  version: number;
  updatedAt: string | null;
  updatedByUserId?: string | null;
}

export function defaultSaasModuleSetting(moduleId: SaasModuleId): SaasModuleSetting {
  return {
    moduleId,
    enabled: false,
    version: 0,
    updatedAt: null,
  };
}

export function defaultSaasModuleSettings(): SaasModuleSetting[] {
  return SAAS_MODULE_IDS.map(defaultSaasModuleSetting);
}
