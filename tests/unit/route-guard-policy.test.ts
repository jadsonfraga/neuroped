import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getAccessLevel } from "../../client/src/security/accessPolicy.ts";
import {
  decideRouteAccess,
  isRouteSensitive,
  SENSITIVE_ROUTES,
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
  "/login/admin",
  "/login%2Fadmin",
  "/familia/prontuario",
  "/pre-consulta/interno",
  "/verificar/relatorio",
  "/filtro/paciente",
  "/caa/prontuario",
  "/portal-familia/paciente/123",
  "/portal-familia/novidades/interno",
]) {
  assert.equal(getAccessLevel(path), "clinical", `${path} deve falhar fechado`);
}

for (const path of [
  "/login",
  "/login?next=%2Fpacientes",
  "/sessao-expirada",
  "/termos",
  "/familia",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
  "/verificar",
  "/portal-familia/novidades",
  "/portal-familia/novidades/",
  "/portal-familia/acesso",
  "/portal-familia/acesso?origem=app",
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

const REQUIRED_SENSITIVE_ROUTES = [
  "/pant",
  "/assinatura-digital",
  "/documentos",
  "/pacientes",
  "/paciente",
  "/prontuario",
  "/calculadora-dose",
  "/farmacologia",
  "/medicamentos",
  "/satisfacao-medicacao",
  "/plano-terapeutico",
  "/plano-intervencao",
  "/avaliacao-multiprofissional",
  "/fichas-registro",
  "/laudo-neuroped",
  "/receita-c1",
  "/receita-c1-express",
  "/diario-escola",
  "/inventarios-escola",
  "/generic-scale",
  "/cognitive-lab",
  "/testes-diretos",
  "/epilepsia",
  "/cefaleia",
  "/diario-sono",
  "/diario-alimentar",
  "/recepcao",
] as const;
const sensitiveRouteSet = new Set<string>(SENSITIVE_ROUTES);
assert.equal(sensitiveRouteSet.size, SENSITIVE_ROUTES.length);
for (const path of REQUIRED_SENSITIVE_ROUTES) {
  assert.equal(
    sensitiveRouteSet.has(path),
    true,
    `${path} não pode desaparecer do inventário sensível`,
  );
  assert.equal(isRouteSensitive(path), true);
}

const appSource = readFileSync(
  new URL("../../client/src/App.tsx", import.meta.url),
  "utf8",
);
const registeredRoutePatterns = [
  ...appSource.matchAll(/<Route\s+path="([^"]+)"/g),
].map((match) => match[1]);
const clinicalRouteSamples = [
  ...registeredRoutePatterns.map((route) =>
    route.replace(/:[^/]+/g, "__test_param__"),
  ),
  "/rota-clinica-adicionada-no-futuro",
].filter((path) => getAccessLevel(path) === "clinical");

for (const path of clinicalRouteSamples) {
  for (const userRole of ["reader", "operator"] as const) {
    const expected =
      path === "/recepcao" && userRole === "operator" ? "allow" : "forbidden";
    assert.equal(
      decideRouteAccess({
        path,
        accessMode: "remote",
        isAuthenticated: true,
        isLoading: false,
        userRole,
      }),
      expected,
      `${userRole} recebeu decisão incorreta em ${path}`,
    );
  }
  for (const userRole of ["admin", "professional"] as const) {
    assert.equal(
      decideRouteAccess({
        path,
        accessMode: "remote",
        isAuthenticated: true,
        isLoading: false,
        userRole,
      }),
      "allow",
      `${userRole} deve abrir a rota clínica ${path}`,
    );
  }
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
  "forbidden",
  "sessão remota sem papel atribuído deve falhar fechada",
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
  "✓ rotas remotas falham fechadas, sem herança pública e com RBAC defensivo",
);
