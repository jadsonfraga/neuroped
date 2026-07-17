import assert from "node:assert/strict";
import {
  authCapabilityFromHealth,
  fallbackAuthCapability,
  resolveAuthMode,
} from "../../client/src/lib/authCapabilityPolicy.ts";

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

console.log("✓ auth fail-closed e refresh concorrente isolado por sessão");
