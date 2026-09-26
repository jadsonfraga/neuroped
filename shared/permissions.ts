import {
  clinicMembershipRoles,
  isClinicMembershipRole,
  type ClinicMembershipRole,
} from "./tenant";

/**
 * Fonte única de RBAC do tenant (papel de membership → permissões).
 *
 * Rotas perguntam por permissão (`roleHasPermission(role, "team.manage")`),
 * nunca comparam o nome do papel. Mudar o que um papel pode fazer passa a ser
 * uma edição desta tabela, coberta pelo teste de matriz
 * `tests/unit/tenant-permissions.test.ts`, e não uma caça a `role === "..."`.
 *
 * Checagem de status da clínica NÃO mora aqui: `membershipHas` em
 * `functions/api/tenant/_core.ts` exige clínica ativa; rotas que precisam
 * funcionar com a clínica suspensa/encerrada (ciclo de vida, exportação)
 * usam `roleHasPermission` diretamente e tratam o status por conta própria.
 *
 * Papel global (`users.role`, ex.: admin de plataforma) não aparece aqui de
 * propósito: não é bypass entre clínicas.
 */
export const tenantPermissions = [
  "organization.manage",
  "organization.lifecycle.read",
  "organization.lifecycle.manage",
  "organization.export",
  "organization.metrics.read",
  "audit.read",
  "team.manage",
  "team.manage_owners",
  "billing.manage",
  "finance.read",
  "clinical.read",
  "clinical.write",
] as const;

export type TenantPermission = (typeof tenantPermissions)[number];

const MANAGERS: readonly ClinicMembershipRole[] = ["owner", "clinic_admin"];
const CLINICAL: readonly ClinicMembershipRole[] = [
  "owner",
  "clinic_admin",
  "professional",
];

const GRANTS: Readonly<
  Record<TenantPermission, readonly ClinicMembershipRole[]>
> = Object.freeze({
  "organization.manage": MANAGERS,
  "organization.lifecycle.read": MANAGERS,
  "organization.lifecycle.manage": ["owner"],
  "organization.export": MANAGERS,
  "organization.metrics.read": MANAGERS,
  // Trilha da própria clínica (saas_audit_log filtrada por clinic_id):
  // metadados de quem fez o quê, nunca conteúdo clínico.
  "audit.read": MANAGERS,
  "team.manage": MANAGERS,
  "team.manage_owners": ["owner"],
  "billing.manage": MANAGERS,
  "finance.read": ["owner", "clinic_admin", "financial"],
  "clinical.read": CLINICAL,
  "clinical.write": CLINICAL,
});

const PERMISSION_SET = new Set<string>(tenantPermissions);

export function isTenantPermission(value: unknown): value is TenantPermission {
  return typeof value === "string" && PERMISSION_SET.has(value);
}

/** Fail-closed: papel ou permissão desconhecidos nunca concedem acesso. */
export function roleHasPermission(
  role: unknown,
  permission: TenantPermission,
): boolean {
  if (!isClinicMembershipRole(role) || !isTenantPermission(permission))
    return false;
  return GRANTS[permission].includes(role);
}

export function permissionsForRole(role: unknown): TenantPermission[] {
  return tenantPermissions.filter((permission) =>
    roleHasPermission(role, permission),
  );
}

/** Papéis que detêm a permissão, na ordem canônica de `clinicMembershipRoles`. */
export function rolesWithPermission(
  permission: TenantPermission,
): ClinicMembershipRole[] {
  return clinicMembershipRoles.filter((role) =>
    roleHasPermission(role, permission),
  );
}
