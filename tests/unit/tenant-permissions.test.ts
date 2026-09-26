import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isTenantPermission,
  permissionsForRole,
  roleHasPermission,
  rolesWithPermission,
  tenantPermissions,
  type TenantPermission,
} from "../../shared/permissions";
import {
  canAccessClinicFinance,
  canManageClinic,
  canReadClinicClinicalData,
  canWriteClinicClinicalData,
  clinicMembershipRoles,
  type ClinicMembershipRole,
} from "../../shared/tenant";
import {
  membershipCanAccessFinance,
  membershipCanManage,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  membershipHas,
  membershipPermissions,
  type ClinicMembership,
} from "../../functions/api/tenant/_core";

// 1) Matriz papel × permissão fixada literalmente. Qualquer mudança de acesso
//    precisa editar esta tabela junto com o catálogo, de forma visível na PR.
const EXPECTED: Record<ClinicMembershipRole, TenantPermission[]> = {
  owner: [
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
  ],
  clinic_admin: [
    "organization.manage",
    "organization.lifecycle.read",
    "organization.export",
    "organization.metrics.read",
    "audit.read",
    "team.manage",
    "billing.manage",
    "finance.read",
    "clinical.read",
    "clinical.write",
  ],
  professional: ["clinical.read", "clinical.write"],
  assistant: [],
  financial: ["finance.read"],
};

assert.deepEqual(
  Object.keys(EXPECTED).sort(),
  [...clinicMembershipRoles].sort(),
);
for (const role of clinicMembershipRoles) {
  assert.deepEqual(
    permissionsForRole(role),
    EXPECTED[role],
    `matriz divergente para ${role}`,
  );
  for (const permission of tenantPermissions) {
    assert.equal(
      roleHasPermission(role, permission),
      EXPECTED[role].includes(permission),
      `${role} × ${permission}`,
    );
  }
}
assert.deepEqual(rolesWithPermission("team.manage_owners"), ["owner"]);
assert.deepEqual(rolesWithPermission("organization.metrics.read"), [
  "owner",
  "clinic_admin",
]);
assert.deepEqual(rolesWithPermission("audit.read"), ["owner", "clinic_admin"]);

// Mínimo necessário: assistente e financeiro nunca tocam conteúdo clínico.
for (const role of ["assistant", "financial"] as const) {
  assert.equal(roleHasPermission(role, "clinical.read"), false);
  assert.equal(roleHasPermission(role, "clinical.write"), false);
}

// 2) Fail-closed para papel/permissão desconhecidos, incluindo papéis globais.
for (const role of [
  "admin",
  "reader",
  "operator",
  "OWNER",
  "",
  null,
  undefined,
  1,
  {},
]) {
  assert.deepEqual(
    permissionsForRole(role),
    [],
    `papel ${String(role)} não pode herdar permissão`,
  );
  assert.equal(roleHasPermission(role, "clinical.read"), false);
}
assert.equal(isTenantPermission("clinical.read"), true);
assert.equal(isTenantPermission("clinical.*"), false);
assert.equal(
  roleHasPermission("owner", "clinical.*" as TenantPermission),
  false,
);

// 3) Equivalência com a semântica anterior dos predicados (antes deste
//    catálogo, cada um era uma comparação de papel escrita à mão).
const legacy = {
  manage: (r: ClinicMembershipRole) => r === "owner" || r === "clinic_admin",
  clinical: (r: ClinicMembershipRole) =>
    r === "owner" || r === "clinic_admin" || r === "professional",
  finance: (r: ClinicMembershipRole) =>
    r === "owner" || r === "clinic_admin" || r === "financial",
};
for (const role of clinicMembershipRoles) {
  assert.equal(canManageClinic(role), legacy.manage(role));
  assert.equal(canReadClinicClinicalData(role), legacy.clinical(role));
  assert.equal(canWriteClinicClinicalData(role), legacy.clinical(role));
  assert.equal(canAccessClinicFinance(role), legacy.finance(role));
  // Portas que antes eram literais nas rotas.
  assert.equal(
    roleHasPermission(role, "billing.manage"),
    legacy.manage(role),
    "checkout",
  );
  assert.equal(
    roleHasPermission(role, "team.manage"),
    legacy.manage(role),
    "equipe/convites",
  );
  assert.equal(
    roleHasPermission(role, "organization.export"),
    legacy.manage(role),
    "export",
  );
  assert.equal(
    roleHasPermission(role, "organization.lifecycle.read"),
    legacy.manage(role),
    "lifecycle GET",
  );
  assert.equal(
    roleHasPermission(role, "organization.lifecycle.manage"),
    role === "owner",
    "lifecycle POST",
  );
  assert.equal(
    roleHasPermission(role, "team.manage_owners"),
    role === "owner",
    "conceder/remover owner",
  );
}

// 4) Membership efetiva exige clínica ativa.
function membership(
  role: ClinicMembershipRole,
  clinicStatus: ClinicMembership["clinicStatus"],
): ClinicMembership {
  return {
    clinicId: "c-alfa",
    userId: "u-1",
    role,
    clinicName: "Alfa",
    clinicSlug: "alfa",
    clinicStatus,
  };
}
for (const role of clinicMembershipRoles) {
  const active = membership(role, "active");
  assert.deepEqual(membershipPermissions(active), EXPECTED[role]);
  assert.equal(membershipCanManage(active), legacy.manage(role));
  assert.equal(membershipCanReadClinical(active), legacy.clinical(role));
  assert.equal(membershipCanWriteClinical(active), legacy.clinical(role));
  assert.equal(membershipCanAccessFinance(active), legacy.finance(role));
  for (const status of ["suspended", "closed"] as const) {
    const inactive = membership(role, status);
    assert.deepEqual(membershipPermissions(inactive), [], `${role}/${status}`);
    for (const permission of tenantPermissions) {
      assert.equal(
        membershipHas(inactive, permission),
        false,
        `${role}/${status}/${permission}`,
      );
    }
  }
}

// 5) Trava estática: autorização de ator nas rotas tenant pergunta permissão,
//    nunca compara o nome do papel. (Comparar o papel do ALVO, como
//    `currentMembership.role === "owner"` para proteger o último owner, é dado
//    e não autorização, e continua permitido.)
const root = fileURLToPath(new URL("../../", import.meta.url));
const scanned = [
  "functions/api/tenants",
  "functions/api/billing",
  "functions/api/live",
  "functions/api/tenant",
];
const actorRoleLiteral =
  /\b(?:auth\.)?membership\.role\s*[!=]==\s*["']|\.includes\(\s*(?:auth\.)?membership\.role\s*\)|m\.role\s+IN\s*\(\s*'/;
const offenders: string[] = [];
function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (
      path.endsWith(".ts") &&
      actorRoleLiteral.test(readFileSync(path, "utf8"))
    ) {
      offenders.push(relative(root, path));
    }
  }
}
for (const dir of scanned) walk(join(root, dir));
assert.deepEqual(
  offenders,
  [],
  `comparação literal de papel do ator: ${offenders.join(", ")}`,
);

// A trava precisa de fato pegar o padrão antigo.
assert.ok(actorRoleLiteral.test(`if (auth.membership.role !== "owner") {`));
assert.ok(
  actorRoleLiteral.test(`!["owner", "clinic_admin"].includes(membership.role)`),
);
assert.ok(actorRoleLiteral.test(`AND m.role IN ('owner', 'clinic_admin')`));
assert.ok(!actorRoleLiteral.test(`currentMembership.role === "owner"`));

const tenantDetail = readFileSync(
  join(root, "functions/api/tenants/[id]/index.ts"),
  "utf8",
);
assert.match(
  tenantDetail,
  /permissions: membershipPermissions\(membership\)/,
  "UI recebe permissões efetivas",
);

// 6) Cliente: a tela de configurações decide o que mostrar pela lista
//    `permissions` devolvida pelo servidor — nunca por `canManage` nem por
//    comparação de nome de papel. Cada seção restrita declara a permissão
//    que a torna visível, com nome que precisa existir no catálogo.
const settingsPage = readFileSync(
  join(root, "client/src/pages/configuracoes.tsx"),
  "utf8",
);
assert.doesNotMatch(settingsPage, /canManage/, "configuracoes não pode depender de canManage");
assert.doesNotMatch(
  settingsPage,
  /\.role\s*[!=]==\s*["']|\.includes\(\s*[a-zA-Z.]*role\s*\)/,
  "configuracoes não pode autorizar por nome de papel",
);
assert.match(settingsPage, /permissions: TenantPermission\[\]/, "TenantDetail carrega permissions tipadas");
const declaredRequirements = [...settingsPage.matchAll(/requires: "([^"]+)"/g)].map((match) => match[1]);
assert.ok(declaredRequirements.length >= 3, "seções restritas declaram a permissão exigida");
for (const requirement of declaredRequirements) {
  assert.ok(isTenantPermission(requirement), `seção exige permissão fora do catálogo: ${requirement}`);
}
for (const gate of [
  /hasPermission\(permissions, "team\.manage"\) && <EquipeSection/,
  /hasPermission\(permissions, "billing\.manage"\) && <PlanoSection/,
  /hasPermission\(permissions, "organization\.metrics\.read"\) && <TenantMetricsPanel/,
  /readOnly = !hasPermission\(detail\.permissions, "organization\.manage"\)/,
]) {
  assert.match(settingsPage, gate, `porta da tela ausente: ${gate}`);
}
// Lista ausente (resposta antiga) nunca vira acesso.
assert.match(settingsPage, /Array\.isArray\(detail\.permissions\) \? detail\.permissions : \[\]/);

console.log(
  "tenant-permissions: matriz, fail-closed, equivalência, trava estática e tela por permissão OK",
);
