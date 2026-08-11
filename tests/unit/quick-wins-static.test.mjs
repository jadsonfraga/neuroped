import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const auth = read("client/src/contexts/AuthContext.tsx");
assert.doesNotMatch(auth, /VITE_APP_SECRET|FIXED_EMAIL/);
assert.match(
  auth,
  /getStoredUser,[\s\S]{0,120}loginRequest,[\s\S]{0,120}logoutRequest,[\s\S]{0,120}getAuthCapability/,
  "o fluxo autenticado deve usar a capacidade e a sessão remota",
);
assert.doesNotMatch(
  auth,
  /OPEN_ACCESS_USER|const LOCAL_USER|accessMode:\s*"local"/,
  "não pode existir usuário administrativo local automático",
);
assert.match(
  auth,
  /useState<AccessMode>\("checking"\)[\s\S]{0,900}getAuthCapability\(\)/,
  "a autenticação deve iniciar fechada durante o bootstrap",
);

const authClient = read("client/src/lib/authClient.ts");
assert.match(authClient, /CAPABILITY_KEY/);
assert.match(authClient, /cachedAuthCapability/);
assert.match(authClient, /refreshInFlight/);
assert.match(authClient, /authEpoch !== epochAtStart/);
assert.match(
  authClient,
  /const refreshToken = getRefreshToken\(\);[\s\S]*?clearAuth\(\);[\s\S]*?keepalive: true/,
);
assert.match(
  auth,
  /(?:async function logout\(\)(?:: Promise<void>)? \{|const logout = useCallback\(async \(\)(?:: Promise<void>)? => \{)[\s\S]{0,220}await clearSessionScopedClientState\(\);/,
  "logout deve limpar dados da sessão mesmo quando memoizado com useCallback",
);

const app = read("client/src/App.tsx");
for (const component of [
  "AppErrorBoundary",
  "PrivateGate",
  "RouteGuard",
  "ServiceWorkerManager",
  "MotionConfig",
]) {
  assert.match(app, new RegExp(component));
}
assert.match(app, /<MotionConfig reducedMotion="user">/);

const restoredRoutes = [
  "/recepcao",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
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
  "/verificar",
  "/diario-escola",
  "/inventarios-escola",
];
for (const route of restoredRoutes) {
  assert.match(app, new RegExp(`path=\\"${route.replaceAll("/", "\\/")}\\"`));
}

const routes = read("client/src/data/navigation.ts");
assert.doesNotMatch(routes, /placeholder|TODO/i);

console.log("✓ proteções das melhorias críticas permanecem conectadas ao app");
