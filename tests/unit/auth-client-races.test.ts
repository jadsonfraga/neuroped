import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  authCapabilityFromHealth,
  fallbackAuthCapability,
  resolveAuthMode,
} from "../../client/src/lib/authCapabilityPolicy.ts";

const source = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

assert.equal(
  resolveAuthMode(undefined, true),
  "remote",
  "build de produção sem declaração explícita deve falhar fechado",
);
assert.equal(resolveAuthMode(undefined, false), "auto");
assert.equal(resolveAuthMode("local", true), "local");
assert.deepEqual(fallbackAuthCapability("remote", null), {
  required: true,
  configured: false,
  reachable: false,
});
assert.deepEqual(
  fallbackAuthCapability("remote", { required: false, configured: true }),
  { required: true, configured: true, reachable: false },
  "modo remoto nunca pode herdar required=false do storage",
);
assert.deepEqual(fallbackAuthCapability("auto", null), {
  required: false,
  configured: false,
  reachable: false,
});
assert.deepEqual(
  authCapabilityFromHealth("remote", {
    authentication: { required: false, configured: true },
  }),
  { required: true, configured: false, reachable: true },
  "health inesperado não pode desligar autenticação de um build remoto",
);
assert.deepEqual(
  authCapabilityFromHealth("auto", {
    authentication: { required: true, configured: true },
  }),
  { required: true, configured: true, reachable: true },
);

const authClientSource = source("client/src/lib/authClient.ts");
const authContextSource = source("client/src/contexts/AuthContext.tsx");
const pagesWorkflow = source(".github/workflows/deploy.yml");
const cloudflareWorkflow = source(".github/workflows/deploy-cloudflare.yml");
const vercelWorkflow = source(".github/workflows/deploy-vercel.yml");
const vercelConfig = source("vercel.json");
const pagesRedirectHtml = source("github-pages-redirect/index.html");
const pagesRedirectScript = source("github-pages-redirect/redirect.js");
const legacyDeployHelper = source("deploy.sh");
const legacyDeployScript = source("deploy-production.sh");
const deploymentWebGuide = source("DEPLOYMENT_WEB_GUIDE.md");
const deploymentFinalSession = source("DEPLOYMENT_FINAL_SESSION.md");
const envExample = source(".env.example");

assert.match(authClientSource, /VITE_AUTH_MODE/);
assert.match(authClientSource, /cachedAuthCapability\(mode\)/);
assert.match(
  authContextSource,
  /getStoredUser,[\s\S]{0,120}loginRequest,[\s\S]{0,120}logoutRequest,[\s\S]{0,120}getAuthCapability/,
  "o contexto deve restaurar a autenticação remota nominal",
);
assert.doesNotMatch(
  authContextSource,
  /OPEN_ACCESS_USER|const LOCAL_USER|accessMode:\s*"local"/,
  "nenhum usuário administrativo local pode ser injetado automaticamente",
);
assert.match(
  authContextSource,
  /useState<AccessMode>\("checking"\)[\s\S]{0,900}getAuthCapability\(\)/,
  "o bootstrap deve começar fechado e descobrir a capacidade do backend",
);
assert.match(
  authContextSource,
  /const hasSessionCredentials = Boolean\(getAccessToken\(\) \|\| getRefreshToken\(\)\)/,
  "sessão anônima não deve gerar probe autenticado desnecessário",
);
assert.match(
  authContextSource,
  /if \(!hasSessionCredentials\)[\s\S]{0,240}setUser\(null\);[\s\S]{0,120}setIsLoading\(false\)/,
  "sem credenciais o bootstrap deve permanecer fail-closed",
);
assert.match(
  authContextSource,
  /async function clearSessionScopedClientState\(\): Promise<void> \{[\s\S]{0,260}queryClient\.clear\(\);[\s\S]{0,80}secureClearAll\(\);/,
  "limpeza explícita deve eliminar credenciais e cache clínico",
);
assert.doesNotMatch(
  authContextSource,
  /Referência de migração para as catracas históricas/,
);
assert.match(
  pagesWorkflow,
  /path:\s*dist\/github-pages/,
  "GitHub Pages deve publicar somente o artefato de redirecionamento",
);
assert.doesNotMatch(
  pagesWorkflow,
  /VITE_PIN_HASH|verify-local-pin-env|npm run build:client/,
);
assert.match(pagesWorkflow, /test ! -d dist\/github-pages\/assets/);
assert.match(pagesRedirectHtml, /https:\/\/neuroped\.pages\.dev/);
assert.doesNotMatch(pagesRedirectHtml, /id="root"|type="module"/);
assert.match(legacyDeployHelper, /exit 1/);
assert.doesNotMatch(
  legacyDeployHelper,
  /npm install -g|vercel\s+(?:deploy|--prod|login)|railway\s+(?:init|up|login)/,
  "helper legado deve falhar fechado sem orientar publicação manual",
);
assert.match(legacyDeployScript, /exit 1/);
assert.doesNotMatch(
  legacyDeployScript,
  /npm install -g|vercel\s+(?:deploy|--prod|login)|railway\s+(?:init|up|login)/,
  "script legado deve falhar fechado sem publicar em provedores",
);
assert.doesNotMatch(deploymentFinalSession, /\.\/deploy-production\.sh/);
assert.doesNotMatch(deploymentWebGuide, /vercel\.com\/new|railway\.app/);
assert.doesNotMatch(envExample, /domínios oficiais \([^\n]*github\.io/);
for (const contract of [
  /const TARGET = "https:\/\/neuroped\.pages\.dev"/,
  /startsWith\("neuroped:"\)/,
  /startsWith\("np_"\)/,
  /registration\.unregister\(\)/,
  /startsWith\("neuroped-"\)/,
  /deleteDatabase\("neuroped-icp"\)/,
  /window\.location\.replace\(destination\)/,
]) {
  assert.match(pagesRedirectScript, contract);
}
assert.match(
  vercelConfig,
  /VITE_AUTH_MODE=remote/,
  "Vercel deve exigir autenticação nominal remota",
);
assert.match(vercelConfig, /VITE_API_URL=https:\/\/neuroped\.pages\.dev/);
assert.match(vercelConfig, /VITE_PIN_HASH=\s/);
assert.match(vercelConfig, /VITE_ZONE=full/);
assert.match(vercelConfig, /VITE_ALLOWED_HOSTS=\s/);
assert.match(vercelWorkflow, /VITE_AUTH_MODE:\s*remote/);
assert.match(vercelWorkflow, /VITE_API_URL:\s*https:\/\/neuroped\.pages\.dev/);
assert.match(vercelWorkflow, /VITE_PIN_HASH=\s*\\/);
assert.match(vercelWorkflow, /api\/auth\/login/);
assert.match(vercelWorkflow, /api\/auth\/me/);
assert.match(vercelWorkflow, /api\/auth\/logout/);
assert.match(vercelWorkflow, /Wait for matching Cloudflare backend release/);
assert.match(
  vercelWorkflow,
  /deploy-check\.json[\s\S]*\.provider == "cloudflare-pages" and \.commit == \$sha/,
  "Vercel só pode publicar após o backend canônico confirmar o mesmo SHA",
);
assert.doesNotMatch(
  vercelWorkflow,
  /secrets\.VITE_PIN_HASH|env add VITE_PIN_HASH/,
);

const vercelJobStart = vercelWorkflow.indexOf("  deploy-vercel:");
const vercelStepsStart = vercelWorkflow.indexOf("    steps:", vercelJobStart);
const vercelDeployStart = vercelWorkflow.indexOf(
  "      - name: Deploy and verify the public Vercel mirror",
  vercelStepsStart,
);
const vercelAuthStart = vercelWorkflow.indexOf(
  "      - name: Validate remote authentication from the stable Vercel origin",
  vercelDeployStart,
);
const vercelStatusStart = vercelWorkflow.indexOf(
  "      - name: Publish consolidated Vercel production status",
  vercelAuthStart,
);
for (const marker of [
  vercelJobStart,
  vercelStepsStart,
  vercelDeployStart,
  vercelAuthStart,
  vercelStatusStart,
]) {
  assert.notEqual(
    marker,
    -1,
    "workflow Vercel deve preservar os steps de segurança",
  );
}
const vercelJobHeader = vercelWorkflow.slice(vercelJobStart, vercelStepsStart);
const vercelDeployStep = vercelWorkflow.slice(
  vercelDeployStart,
  vercelAuthStart,
);
const vercelAuthStep = vercelWorkflow.slice(vercelAuthStart, vercelStatusStart);
assert.doesNotMatch(
  vercelJobHeader,
  /secrets\./,
  "secrets não podem ter escopo de job",
);
assert.match(vercelDeployStep, /secrets\.VERCEL_TOKEN/);
assert.match(
  vercelDeployStep,
  /"superneuroped:prj_8gsXbaQoOZHgbhjnqiMPR9A5jg5b"/,
);
assert.doesNotMatch(vercelDeployStep, /prj_4gm4R9pG7oJqqtBL9QFMjhNakzxC/);
assert.doesNotMatch(vercelDeployStep, /ADMIN_MAIL|ADMIN_PW|NEUROPED_E2E_/);
assert.match(vercelAuthStep, /secrets\.NEUROPED_E2E_EMAIL/);
assert.match(vercelAuthStep, /secrets\.NEUROPED_E2E_PASSWORD/);
assert.doesNotMatch(vercelAuthStep, /VERCEL_TOKEN|VERCEL_ORG_ID/);
assert.match(vercelAuthStep, /https:\/\/superneuroped\.vercel\.app/);
assert.doesNotMatch(vercelAuthStep, /https:\/\/neuroped\.vercel\.app/);
assert.doesNotMatch(vercelWorkflow, /secrets\.[A-Z0-9_]+\s*\|\|\s*secrets\./);
assert.match(
  vercelAuthStep,
  /ci-negative-\$\{GITHUB_RUN_ID\}@invalid\.example/,
);
assert.match(cloudflareWorkflow, /VITE_AUTH_MODE:\s*remote/);
assert.doesNotMatch(
  cloudflareWorkflow,
  /VITE_AUTH_MODE:\s*local|secrets\.VITE_PIN_HASH/,
  "Cloudflare full-stack jamais compila em modo local nem recebe o verificador",
);
assert.match(
  cloudflareWorkflow,
  /E2E_MAIL:\s*\$\{\{ secrets\.NEUROPED_E2E_EMAIL \}\}/,
);
assert.match(
  cloudflareWorkflow,
  /FALLBACK_MAIL:\s*\$\{\{ secrets\.ADMIN_EMAIL \}\}/,
);
assert.doesNotMatch(
  cloudflareWorkflow,
  /secrets\.[A-Z0-9_]+\s*\|\|\s*secrets\./,
);
assert.match(
  cloudflareWorkflow,
  /if \[ -n "\$E2E_MAIL" \] \|\| \[ -n "\$E2E_PW" \]/,
);
assert.match(
  cloudflareWorkflow,
  /ci-negative-\$\{GITHUB_RUN_ID\}@invalid\.example/,
);

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const session = new MemoryStorage();
const local = new MemoryStorage();
let expiredEvents = 0;

Object.assign(globalThis, {
  sessionStorage: session,
  localStorage: local,
  window: {
    setTimeout,
    clearTimeout,
    dispatchEvent(event: Event) {
      if (event.type === "auth:expired") expiredEvents += 1;
      return true;
    },
  },
});

const auth = await import("../../client/src/lib/authClient.ts");

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const resolveRefreshes: Array<(response: Response) => void> = [];
let protectedRequests = 0;
let refreshRequests = 0;

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.endsWith("/api/auth/login")) {
    return jsonResponse({
      accessToken: "access-new",
      refreshToken: "refresh-new",
      expiresIn: 900,
      user: {
        id: "user-new",
        email: "new@example.com",
        name: "Nova sessão",
        role: "professional",
      },
    });
  }
  if (url.endsWith("/api/auth/refresh")) {
    refreshRequests += 1;
    return new Promise<Response>((resolve) => {
      resolveRefreshes.push(resolve);
    });
  }
  protectedRequests += 1;
  if (
    new Headers(init?.headers).get("Authorization") ===
    "Bearer access-refreshed"
  ) {
    return jsonResponse({ ok: true });
  }
  return new Response(null, { status: 401 });
}) as typeof fetch;

async function waitFor(predicate: () => boolean, message: string) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error(message);
}

session.setItem("neuroped:access", "access-old");
session.setItem("neuroped:refresh", "refresh-old");
session.setItem(
  "neuroped:user",
  JSON.stringify({
    id: "user-old",
    email: "old@example.com",
    name: "Sessão antiga",
    role: "professional",
  }),
);

const staleRequest = auth.authFetch("/api/patients");
await waitFor(
  () => resolveRefreshes.length === 1,
  "refresh antigo não iniciou",
);

await auth.loginRequest("new@example.com", "valid-password");
const newSessionRequest = auth.authFetch("/api/consents");
await waitFor(
  () => resolveRefreshes.length === 2,
  "401 da sessão nova reutilizou incorretamente o refresh antigo",
);

resolveRefreshes[1](
  jsonResponse({
    accessToken: "access-refreshed",
    refreshToken: "refresh-rotated",
  }),
);
const newSessionResponse = await newSessionRequest;
assert.equal(newSessionResponse.status, 200);

resolveRefreshes[0](jsonResponse({ error: "Refresh expirado" }, 401));
await staleRequest;

assert.equal(protectedRequests, 3);
assert.equal(auth.getAccessToken(), "access-refreshed");
assert.equal(auth.getRefreshToken(), "refresh-rotated");
assert.equal(auth.getStoredUser()?.id, "user-new");
assert.equal(expiredEvents, 0);
assert.equal(refreshRequests, 2);

auth.clearAuth();
await auth.authFetch("/api/consents");
assert.equal(
  refreshRequests,
  2,
  "401 anônimo não deve tentar refresh sem credenciais",
);
assert.equal(expiredEvents, 0, "401 anônimo não representa sessão expirada");

// O contexto autenticado não pode apagar de forma síncrona uma sessão candidata
// antes de validá-la em /api/auth/me; expiração e logout continuam chamando
// clearAuth pelo cliente autenticado.
session.setItem("neuroped:access", "legacy-admin-token");
session.setItem("neuroped:refresh", "legacy-refresh-token");
session.setItem(
  "neuroped:user",
  JSON.stringify({
    id: "legacy-admin",
    email: "admin@example.test",
    name: "Admin",
    role: "admin",
  }),
);
await import("../../client/src/contexts/AuthContext.tsx");
assert.equal(auth.getAccessToken(), "legacy-admin-token");
assert.equal(auth.getRefreshToken(), "legacy-refresh-token");
assert.equal(auth.getStoredUser()?.id, "legacy-admin");
auth.clearAuth();

console.log("✓ auth fail-closed, cache isolado e refresh concorrente seguro");
