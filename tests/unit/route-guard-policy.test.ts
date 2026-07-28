import assert from "node:assert/strict";
import { getAccessLevel } from "../../client/src/security/accessPolicy.ts";
import {
  decideRouteAccess,
  isRouteSensitive,
} from "../../client/src/security/routeGuardPolicy.ts";

for (const path of [
  "/",
  "/mchat",
  "/cars",
  "/generic-scale/smfq",
  "/recepcao",
  "/prontuario",
  "/documentos",
  "/assinatura-digital",
  "/satisfacao-medicacao",
  "/plano-terapeutico",
  "/plano-intervencao",
  "/fichas-registro",
  "/laudo-neuroped",
  "/receita-c1",
  "/receita-c1-express",
  "/diario-escola",
  "/inventarios-escola",
  "/rota-clinica-adicionada-no-futuro",
  "/familiares",
  "/login-admin",
]) {
  assert.equal(getAccessLevel(path), "clinical", `${path} deve falhar fechado`);
}

for (const path of [
  "/login",
  "/login?next=%2Fpacientes",
  "/sessao-expirada",
  "/familia",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
  "/verificar",
  "/portal-familia/novidades",
  "/filtro",
  "/filtro-escalas",
]) {
  assert.equal(
    getAccessLevel(path),
    "public",
    `${path} deve permanecer pública`,
  );
}

assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "checking",
    isAuthenticated: false,
    isLoading: true,
  }),
  "checking",
);

for (const path of ["/pant", "/pacientes", "/paciente/abc", "/calculadora-dose"]) {
  for (const userRole of ["reader", "operator"] as const) {
    assert.equal(
      decideRouteAccess({
        path,
        accessMode: "remote",
        isAuthenticated: true,
        isLoading: false,
        userRole,
      }),
      "forbidden",
      `${userRole} não pode abrir rota sensível ${path} sem RBAC explícito`,
    );
  }
  assert.equal(
    decideRouteAccess({
      path,
      accessMode: "remote",
      isAuthenticated: true,
      isLoading: false,
      userRole: "professional",
    }),
    "allow",
  );
}
assert.equal(isRouteSensitive("/pant"), true);
assert.equal(isRouteSensitive("/pant/relatorio?print=1"), true);
assert.equal(isRouteSensitive("/pantanal"), false, "prefixo deve respeitar segmento");
assert.equal(isRouteSensitive("/paciente-feliz"), false, "prefixo deve respeitar segmento");
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "remote",
    isAuthenticated: false,
    isLoading: true,
  }),
  "checking",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: true,
  }),
  "checking",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "remote",
    isAuthenticated: false,
    isLoading: false,
  }),
  "login",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: false,
  }),
  "allow",
);

assert.equal(
  decideRouteAccess({
    path: "/recepcao",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: false,
    userRole: "reader",
    allowedRoles: ["admin", "professional", "operator"],
  }),
  "forbidden",
);
assert.equal(
  decideRouteAccess({
    path: "/recepcao",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: false,
    userRole: "operator",
    allowedRoles: ["admin", "professional", "operator"],
  }),
  "allow",
);
assert.equal(
  decideRouteAccess({
    path: "/familia",
    accessMode: "remote",
    isAuthenticated: false,
    isLoading: true,
  }),
  "allow",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "local",
    isAuthenticated: false,
    isLoading: false,
  }),
  "forbidden",
  "modo local sem PIN configurado deve falhar fechado",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "local",
    isAuthenticated: false,
    isLoading: false,
    localPinConfigured: false,
    localPinUnlocked: true,
  }),
  "forbidden",
  "marcador de desbloqueio antigo não substitui um verificador configurado",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "local",
    isAuthenticated: false,
    isLoading: false,
    localPinConfigured: true,
    localPinUnlocked: false,
  }),
  "forbidden",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "local",
    isAuthenticated: false,
    isLoading: false,
    localPinConfigured: true,
    localPinUnlocked: true,
  }),
  "allow",
);

assert.equal(
  decideRouteAccess({
    path: "/documentos",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: false,
    userRole: "reader",
    allowedRoles: ["admin", "professional"],
  }),
  "forbidden",
  "perfil reader não pode ignorar o RBAC declarado pela rota",
);
assert.equal(
  decideRouteAccess({
    path: "/documentos",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: false,
    userRole: "professional",
    allowedRoles: ["admin", "professional"],
  }),
  "allow",
);

console.log(
  "✓ rotas remotas falham fechadas e aguardam o bootstrap de autenticação",
);
