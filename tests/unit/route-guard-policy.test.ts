import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getAccessLevel, OPEN_ACCESS } from "../../client/src/security/accessPolicy.ts";
import {
  decideRouteAccess,
  isReaderClinicalRoute,
  isRouteSensitive,
  READER_CLINICAL_ROUTES,
  SENSITIVE_ROUTES,
} from "../../client/src/security/routeGuardPolicy.ts";

// Modo ACESSO ABERTO (decisão do autor): sem qualquer senha, TODA rota é pública
// e o RouteGuard sempre libera. As asserções de fail-closed abaixo (o modelo
// seguro por padrão) valem apenas quando OPEN_ACCESS === false.
if (OPEN_ACCESS) {
  for (const path of ["/", "/prontuario", "/pacientes", "/documentos", "/mchat", "/filtro", "/receita-c1"]) {
    assert.equal(getAccessLevel(path), "public", `${path} deve abrir sem senha no modo aberto`);
    assert.equal(
      decideRouteAccess({ path, accessMode: "remote", isAuthenticated: false, isLoading: false }),
      "allow",
      `${path} deve liberar no modo aberto`,
    );
  }
  // Referencia os símbolos importados para não disparar no-unused sob o early-exit.
  void isReaderClinicalRoute; void isRouteSensitive; void READER_CLINICAL_ROUTES; void SENSITIVE_ROUTES; void readFileSync;
  console.log("✓ modo ACESSO ABERTO: app inteiro libera sem PIN nem login");
  process.exit(0);
}

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
  "/brincando-e-aprendendo",
  "/missao-saude",
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
const registeredRouteSet = new Set(registeredRoutePatterns);
assert.equal(registeredRouteSet.size, registeredRoutePatterns.length);

const materializeRoute = (route: string) =>
  route.replace(/:[^/]+/g, "__test_param__");
const clinicalRouteSamples = registeredRoutePatterns
  .map(materializeRoute)
  .filter((path) => getAccessLevel(path) === "clinical");

const readerRouteSet = new Set<string>(READER_CLINICAL_ROUTES);
assert.equal(readerRouteSet.size, READER_CLINICAL_ROUTES.length);
for (const route of READER_CLINICAL_ROUTES) {
  assert.equal(
    registeredRouteSet.has(route),
    true,
    `${route} deve corresponder a uma rota real antes de liberar reader`,
  );
  const samplePath = materializeRoute(route);
  assert.equal(getAccessLevel(samplePath), "clinical");
  assert.equal(isRouteSensitive(samplePath), false);
  assert.equal(isReaderClinicalRoute(samplePath), true);
}

for (const path of clinicalRouteSamples) {
  assert.equal(
    isRouteSensitive(path) || isReaderClinicalRoute(path),
    true,
    `${path} precisa ser classificada explicitamente como sensível ou reader`,
  );

  for (const userRole of ["reader", "operator"] as const) {
    const expected =
      userRole === "reader" && isReaderClinicalRoute(path)
        ? "allow"
        : (path === "/recepcao" || path === "/testes-diretos") && userRole === "operator"
          ? "allow"
          : "forbidden";
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

assert.equal(isReaderClinicalRoute("/classificacao/exemplo"), true);
assert.equal(isReaderClinicalRoute("/classificacao/exemplo/extra"), false);
assert.equal(isReaderClinicalRoute("/mchat?origem=menu"), true);
assert.equal(isReaderClinicalRoute("/mchat/"), true);
assert.equal(isReaderClinicalRoute("/mchat/interno"), false);
assert.equal(isReaderClinicalRoute("/rota-clinica-adicionada-no-futuro"), false);
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
    path: "/rota-clinica-adicionada-no-futuro",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: false,
    userRole: "reader",
  }),
  "forbidden",
  "rota clínica futura não pode herdar acesso reader",
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
    path: "/testes-diretos",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: false,
    userRole: "operator",
  }),
  "allow",
  "assistente/operator deve poder abrir a Sonda Dez sem ampliar acesso às demais rotas clínicas",
);
assert.equal(
  decideRouteAccess({
    path: "/recepcao/interno",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: false,
    userRole: "operator",
  }),
  "forbidden",
  "descendente futuro da recepção não pode herdar a exceção de operator",
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
  "✓ rotas remotas falham fechadas, preservam reader inventariado e aplicam RBAC defensivo",
);
