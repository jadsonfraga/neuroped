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

export function canManageClinic(role: ClinicMembershipRole): boolean {
  return role === "owner" || role === "clinic_admin";
}

export function canReadClinicClinicalData(role: ClinicMembershipRole): boolean {
  return role === "owner" || role === "clinic_admin" || role === "professional";
}

export function canWriteClinicClinicalData(role: ClinicMembershipRole): boolean {
  return role === "owner" || role === "clinic_admin" || role === "professional";
}

export function canAccessClinicFinance(role: ClinicMembershipRole): boolean {
  return role === "owner" || role === "clinic_admin" || role === "financial";
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
