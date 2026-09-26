import { roleHasPermission } from "./permissions";

export const clinicMembershipRoles = [
  "owner",
  "clinic_admin",
  "professional",
  "assistant",
  "financial",
] as const;

export type ClinicMembershipRole = (typeof clinicMembershipRoles)[number];

const ROLE_SET = new Set<string>(clinicMembershipRoles);

export function isClinicMembershipRole(value: unknown): value is ClinicMembershipRole {
  return typeof value === "string" && ROLE_SET.has(value);
}

// Os predicados abaixo são atalhos estáveis sobre o catálogo central de
// permissões (`shared/permissions.ts`); a tabela papel → permissão mora lá.
export function canManageClinic(role: ClinicMembershipRole): boolean {
  return roleHasPermission(role, "organization.manage");
}

export function canReadClinicClinicalData(role: ClinicMembershipRole): boolean {
  return roleHasPermission(role, "clinical.read");
}

export function canWriteClinicClinicalData(role: ClinicMembershipRole): boolean {
  return roleHasPermission(role, "clinical.write");
}

export function canAccessClinicFinance(role: ClinicMembershipRole): boolean {
  return roleHasPermission(role, "finance.read");
}

export function normalizeClinicSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function isValidClinicSlug(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(value);
}
