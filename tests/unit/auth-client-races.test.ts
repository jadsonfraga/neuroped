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

assert.match(authClientSource, /VITE_AUTH_MODE/);
assert.match(authClientSource, /cachedAuthCapability\(mode\)/);
assert.match(
  authContextSource,
  /queryClient\.cancelQueries\(\)[\s\S]*queryClient\.clear\(\)[\s\S]*secureClearAll\(\)/,
  "troca de sessão deve eliminar cache clínico e rascunhos",
);
assert.match(
  authContextSource,
  /function handleExpired\(\) \{[\s\S]{0,160}setUser\(null\);[\s\S]{0,160}clearSessionScopedClientState\(\)/,
  "expiração deve limpar estado clínico da conta anterior",
);
assert.match(
  authContextSource,
  /async function login\([\s\S]{0,260}loginRequest\([\s\S]{0,160}clearSessionScopedClientState\(\)[\s\S]{0,100}setUser\(data\.user\)/,
  "login de outra conta deve limpar o cache antes de expor a nova sessão",
);
assert.match(
  authContextSource,
  /async function logout\(\) \{\s*setUser\(null\);\s*await logoutRequest\(\);\s*await clearSessionScopedClientState\(\)/,
  "logout deve revogar credenciais e limpar estado clínico",
);
assert.match(
  pagesWorkflow,
  /path:\s*dist\/github-pages/,
  "GitHub Pages deve publicar somente o artefato de redirecionamento",
);
assert.doesNotMatch(pagesWorkflow, /VITE_PIN_HASH|verify-local-pin-env|npm run build:client/);
assert.match(pagesWorkflow, /test ! -d dist\/github-pages\/assets/);
assert.match(pagesRedirectHtml, /https:\/\/neuroped\.pages\.dev/);
assert.doesNotMatch(pagesRedirectHtml, /id="root"|type="module"/);
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
assert.doesNotMatch(vercelWorkflow, /secrets\.VITE_PIN_HASH|env add VITE_PIN_HASH/);

const vercelJobStart = vercelWorkflow.indexOf("  deploy-vercel:");
const vercelStepsStart = vercelWorkflow.indexOf("    steps:", vercelJobStart);
const vercelDeployStart = vercelWorkflow.indexOf(
  "      - name: Deploy and verify both Vercel projects",
  vercelStepsStart,
);
const vercelAuthStart = vercelWorkflow.indexOf(
  "      - name: Validate remote authentication from stable Vercel origins",
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
  assert.notEqual(marker, -1, "workflow Vercel deve preservar os steps de segurança");
}
const vercelJobHeader = vercelWorkflow.slice(vercelJobStart, vercelStepsStart);
const vercelDeployStep = vercelWorkflow.slice(vercelDeployStart, vercelAuthStart);
const vercelAuthStep = vercelWorkflow.slice(vercelAuthStart, vercelStatusStart);
assert.doesNotMatch(vercelJobHeader, /secrets\./, "secrets não podem ter escopo de job");
assert.match(vercelDeployStep, /secrets\.VERCEL_TOKEN/);
assert.doesNotMatch(vercelDeployStep, /ADMIN_MAIL|ADMIN_PW|NEUROPED_E2E_/);
assert.match(vercelAuthStep, /secrets\.NEUROPED_E2E_EMAIL/);
assert.match(vercelAuthStep, /secrets\.NEUROPED_E2E_PASSWORD/);
assert.doesNotMatch(vercelAuthStep, /VERCEL_TOKEN|VERCEL_ORG_ID/);
assert.match(vercelAuthStep, /ci-negative-\$\{GITHUB_RUN_ID\}@invalid\.example/);
assert.match(cloudflareWorkflow, /VITE_AUTH_MODE:\s*remote/);
assert.doesNotMatch(
  cloudflareWorkflow,
  /VITE_AUTH_MODE:\s*local|secrets\.VITE_PIN_HASH/,
  "Cloudflare full-stack jamais compila em modo local nem recebe o verificador",
);
assert.match(cloudflareWorkflow, /secrets\.NEUROPED_E2E_EMAIL \|\| secrets\.ADMIN_EMAIL/);
assert.match(cloudflareWorkflow, /secrets\.NEUROPED_E2E_PASSWORD \|\| secrets\.ADMIN_INITIAL_PASSWORD/);
assert.match(cloudflareWorkflow, /ci-negative-\$\{GITHUB_RUN_ID\}@invalid\.example/);

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
  if (new Headers(init?.headers).get("Authorization") === "Bearer access-refreshed") {
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
await waitFor(() => resolveRefreshes.length === 1, "refresh antigo não iniciou");

await auth.loginRequest("new@example.com", "valid-password");
const newSessionRequest = auth.authFetch("/api/consents");
await waitFor(
  () => resolveRefreshes.length === 2,
  "401 da sessão nova reutilizou incorretamente o refresh antigo",
);

resolveRefreshes[1](jsonResponse({
  accessToken: "access-refreshed",
  refreshToken: "refresh-rotated",
}));
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

console.log("✓ auth fail-closed, cache isolado e refresh concorrente seguro");
