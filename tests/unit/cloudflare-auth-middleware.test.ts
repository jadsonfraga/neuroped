import assert from "node:assert/strict";
import "./refresh-sessions.test";
import "./cloudflare-request-validation.test";
import "./memory-search-ownership.test";
import { onRequest } from "../../functions/api/_middleware";
import { signJwt } from "../../functions/api/auth/_crypto";
import { onRequestGet as healthCheck } from "../../functions/api/health";
import { onRequestGet as certificateHandler } from "../../functions/api/cert";
import { onRequestPost as resultHandler } from "../../functions/api/results";
import { onRequestPost as scaleResultHandler } from "../../functions/api/scales/results";
import { onRequestPost as documentHandler } from "../../functions/api/documents/index";
import { onRequestPost as consultationHandler } from "../../functions/api/consultations/index";

const secret = "segredo-de-teste-com-comprimento-suficiente-123456";
const next = async () => new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

async function call(path: string, env: Record<string, unknown>, token?: string, origin?: string) {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (origin) headers.set("Origin", origin);
  return onRequest({
    request: new Request(`https://neuroped.test${path}`, { headers }),
    env,
    next,
    data: {},
  } as never);
}

function authDb(role = "professional", active = 1, sessionActive = 1) {
  return {
    prepare: (sql: string) => ({
      bind: () => ({
        first: async () => sql.includes("auth_refresh_sessions")
          ? (sessionActive ? { active: 1 } : null)
          : ({
              id: "user-1",
              name: "Usuário",
              email: "medico@example.com",
              role,
              is_active: active,
              password_hash: "irrelevante",
              must_change_password: 0,
              failed_login_attempts: 0,
              locked_until: null,
            }),
      }),
    }),
  };
}

assert.equal((await call("/api/patients", {})).status, 200, "demo sem D1 permanece disponível");
assert.equal(
  (await call("/api/patients", { ENVIRONMENT: "production" })).status,
  503,
  "produção sem D1 falha fechada também em leitura protegida",
);
assert.equal((await call("/api/patients", { DB: {} })).status, 503, "D1 sem segredo falha fechado");
assert.equal((await call("/api/patients", { DB: {}, NEUROPED_JWT_SECRET: secret })).status, 401);
assert.equal((await call("/api/health", { DB: {} })).status, 200, "health é público");

const distributedBlockUntil = Date.now() + 45_000;
const blockedByKv = await onRequest({
  request: new Request("https://neuroped.test/api/health", {
    headers: { "CF-Connecting-IP": "203.0.113.55" },
  }),
  env: {
    RATE_LIMIT_KV: {
      get: async () => String(distributedBlockUntil),
      put: async () => undefined,
    },
  },
  next,
  data: {},
} as never);
assert.equal(blockedByKv.status, 429, "bloqueio distribuído em KV deve ser respeitado entre isolates");

const unhealthyDb = {
  prepare: () => ({ first: async () => { throw new Error("database unavailable"); } }),
};
const healthResponse = await healthCheck({
  env: { DB: unhealthyDb, NEUROPED_JWT_SECRET: secret },
} as never);
const healthBody = await healthResponse.json() as {
  database: string;
  authentication: { required: boolean; configured: boolean };
};
assert.equal(healthBody.database, "error");
assert.deepEqual(
  healthBody.authentication,
  { required: true, configured: true },
  "binding D1 indisponível ainda deve falhar fechado no cliente",
);

const token = await signJwt(
  { sub: "user-1", email: "medico@example.com", name: "Médico", role: "professional", type: "access", sid: "session-1" },
  secret,
  60,
);
const authorized = await call(
  "/api/patients",
  { DB: authDb(), NEUROPED_JWT_SECRET: secret },
  token,
  "https://evil.example",
);
assert.equal(authorized.status, 200);
assert.equal(authorized.headers.get("Access-Control-Allow-Origin"), null, "CORS não abre por padrão");

const importMultipart = new FormData();
importMultipart.set("mode", "preview");
importMultipart.set("file", new File(["Paciente;Data\nTeste;10/08/2018"], "export.csv", { type: "text/csv" }));
const importMultipartResponse = await onRequest({
  request: new Request("https://neuroped.test/api/integrations/boaconsulta/import", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: importMultipart,
  }),
  env: { DB: authDb(), NEUROPED_JWT_SECRET: secret },
  next,
  data: {},
} as never);
assert.equal(
  importMultipartResponse.status,
  200,
  "bridge BoaConsulta deve atravessar o middleware com multipart/form-data",
);

const forbiddenMultipart = new FormData();
forbiddenMultipart.set("file", new File(["x"], "x.txt", { type: "text/plain" }));
const genericMultipartResponse = await onRequest({
  request: new Request("https://neuroped.test/api/patients", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: forbiddenMultipart,
  }),
  env: { DB: authDb(), NEUROPED_JWT_SECRET: secret },
  next,
  data: {},
} as never);
assert.equal(genericMultipartResponse.status, 415, "multipart continua proibido nas rotas clínicas JSON");

for (const origin of [
  "https://superneuroped.vercel.app",
]) {
  const response = await call("/api/health", {}, undefined, origin);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal(response.headers.get("Vary"), "Origin");
}

for (const origin of [
  "https://neuroped.vercel.app",
  "https://evil-neuroped.vercel.app",
  "https://neuroped.vercel.app.evil.example",
  "http://neuroped.vercel.app",
  "https://neuroped.vercel.app:444",
  "https://jadsonfraga.github.io",
  "https://jadsonfraga.github.io.evil.example",
]) {
  const response = await call("/api/health", {}, undefined, origin);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
}

const configuredOrigin = "https://console.neuroped.example";
const configuredCors = await call(
  "/api/health",
  { CORS_ORIGINS: configuredOrigin, ENVIRONMENT: "production" },
  undefined,
  configuredOrigin,
);
assert.equal(
  configuredCors.headers.get("Access-Control-Allow-Origin"),
  null,
  "configuração externa não amplia a allowlist compilada",
);

const productionWildcard = await call(
  "/api/health",
  { CORS_ORIGINS: "*" },
  undefined,
  "https://evil.example",
);
assert.equal(
  productionWildcard.headers.get("Access-Control-Allow-Origin"),
  null,
  "CORS wildcard nunca abre a API",
);

const sharedPagesOrigin = await call(
  "/api/health",
  { CORS_ORIGINS: "https://jadsonfraga.github.io" },
  undefined,
  "https://jadsonfraga.github.io",
);
assert.equal(
  sharedPagesOrigin.headers.get("Access-Control-Allow-Origin"),
  null,
  "origin compartilhada do GitHub Pages não pode ser liberada por configuração",
);

const preflight = await onRequest({
  request: new Request("https://neuroped.test/api/auth/login", {
    method: "OPTIONS",
    headers: {
      Origin: "https://superneuroped.vercel.app",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type, Authorization",
    },
  }),
  env: {},
  next,
  data: {},
} as never);
assert.equal(preflight.status, 204);
assert.equal(
  preflight.headers.get("Access-Control-Allow-Origin"),
  "https://superneuroped.vercel.app",
);
assert.match(preflight.headers.get("Access-Control-Allow-Headers") ?? "", /Authorization/);

const deniedPreflight = await onRequest({
  request: new Request("https://neuroped.test/api/auth/login", {
    method: "OPTIONS",
    headers: {
      Origin: "https://neuroped.vercel.app",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type, Authorization",
    },
  }),
  env: {},
  next,
  data: {},
} as never);
assert.equal(deniedPreflight.status, 204);
assert.equal(deniedPreflight.headers.get("Access-Control-Allow-Origin"), null);

const refreshToken = await signJwt(
  { sub: "user-1", email: "medico@example.com", name: "Médico", role: "professional", type: "refresh", sid: "session-1", jti: "refresh-1" },
  secret,
  60,
);
assert.equal(
  (await call("/api/patients", { DB: authDb(), NEUROPED_JWT_SECRET: secret }, refreshToken)).status,
  401,
  "refresh token nunca autoriza rota clínica",
);

const readerToken = await signJwt(
  { sub: "user-1", email: "reader@example.com", name: "Leitor", role: "reader", type: "access", sid: "session-1" },
  secret,
  60,
);
assert.equal(
  (await call("/api/patients", { DB: authDb("reader"), NEUROPED_JWT_SECRET: secret }, readerToken)).status,
  200,
  "reader pode passar pela autenticação em leitura; ownership ainda filtra os registros",
);

async function callWithMethod(path: string, method: string, role: string, token: string) {
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  if (["POST", "PATCH", "PUT"].includes(method)) headers.set("Content-Type", "application/json");
  return onRequest({
    request: new Request(`https://neuroped.test${path}`, {
      method,
      headers,
      body: ["POST", "PATCH", "PUT"].includes(method) ? "{}" : undefined,
    }),
    env: { DB: authDb(role), NEUROPED_JWT_SECRET: secret },
    next,
    data: {},
  } as never);
}

assert.equal((await callWithMethod("/api/patients", "POST", "reader", readerToken)).status, 403);
assert.equal(
  (await callWithMethod("/api/consents", "POST", "reader", readerToken)).status,
  200,
  "reader autenticado pode registrar somente o próprio consentimento",
);
assert.equal((await callWithMethod("/api/results/x", "DELETE", "reader", readerToken)).status, 403);
assert.equal(
  (await call("/api/cert", { DB: authDb("reader"), NEUROPED_JWT_SECRET: secret })).status,
  200,
  "middleware deixa a rota aposentada pública para o handler responder 410",
);

const retiredCertificateThroughMiddleware = await onRequest({
  request: new Request("https://neuroped.test/api/cert"),
  env: { DB: authDb(), NEUROPED_JWT_SECRET: secret },
  next: async () => certificateHandler({} as never),
  data: {},
} as never);
assert.equal(
  retiredCertificateThroughMiddleware.status,
  410,
  "contrato completo /api/cert deve responder 410 mesmo com D1/auth ativos",
);
const retiredCertificateBody = await retiredCertificateThroughMiddleware.json() as Record<string, unknown>;
assert.equal(retiredCertificateBody.code, "CERT_ENDPOINT_RETIRED");
assert.equal("cert" in retiredCertificateBody, false);
assert.equal("password" in retiredCertificateBody, false);
assert.equal((await call("/api/audit-log", { DB: authDb(), NEUROPED_JWT_SECRET: secret }, token)).status, 403);
assert.equal(
  (await call("/api/patients", { DB: authDb("professional", 0), NEUROPED_JWT_SECRET: secret }, token)).status,
  401,
  "token assinado não reativa conta desabilitada",
);
assert.equal(
  (await call("/api/patients", { DB: authDb("professional", 1, 0), NEUROPED_JWT_SECRET: secret }, token)).status,
  401,
  "access token de família revogada falha imediatamente",
);

const certificateEnv = {
  DB: authDb(),
  NEUROPED_JWT_SECRET: secret,
  CERT_P12_B64: "UDEy",
  CERT_P12_PASSWORD: "senha",
};
const readerCertificate = await certificateHandler({
  env: certificateEnv,
  data: {
    authUser: {
      id: "user-1",
      email: "reader@example.com",
      name: "Leitor",
      role: "reader",
      mustChangePassword: false,
    },
  },
} as never);
assert.equal(readerCertificate.status, 410, "endpoint aposentado não exporta certificado");

const professionalCertificate = await certificateHandler({
  env: certificateEnv,
  data: {
    authUser: {
      id: "user-1",
      email: "medico@example.com",
      name: "Médico",
      role: "professional",
      mustChangePassword: false,
    },
  },
} as never);
assert.equal(
  professionalCertificate.status,
  410,
  "profissional usa certificado próprio local; endpoint remoto está aposentado",
);

const adminCertificate = await certificateHandler({
  env: certificateEnv,
  data: {
    authUser: {
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      mustChangePassword: false,
    },
  },
} as never);
assert.equal(adminCertificate.status, 410, "nem admin exporta o certificado compartilhado");
for (const response of [readerCertificate, professionalCertificate, adminCertificate]) {
  const body = await response.json() as Record<string, unknown>;
  assert.equal(body.code, "CERT_ENDPOINT_RETIRED");
  assert.equal("cert" in body, false);
  assert.equal("password" in body, false);
}

const readerContext = {
  env: { DB: {} },
  data: {
    authUser: {
      id: "user-1",
      email: "reader@example.com",
      name: "Leitor",
      role: "reader",
      mustChangePassword: false,
    },
  },
};

async function callReaderWrite(
  handler: PagesFunction<Record<string, unknown>>,
  body: Record<string, unknown>,
) {
  return handler({
    ...readerContext,
    request: new Request("https://neuroped.test/api/clinical-write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  } as never);
}

const readerWriteCases = [
  callReaderWrite(resultHandler as never, {
    patientId: "demo-001",
    scaleName: "Escala",
    responses: [{ question: "Pergunta", answer: "Resposta" }],
  }),
  callReaderWrite(scaleResultHandler as never, {
    patient_id: "demo-001",
    scale_id: "escala",
    scale_name: "Escala",
    responses: [{ question: "Pergunta", answer: "Resposta" }],
  }),
  callReaderWrite(documentHandler as never, {
    patient_id: "demo-001",
    type: "laudo",
    title: "Documento clínico",
    content: "Conteúdo",
  }),
  callReaderWrite(consultationHandler as never, { patient_id: "demo-001" }),
];
for (const response of await Promise.all(readerWriteCases)) {
  assert.equal(response.status, 403, "handler clínico também bloqueia escrita do reader");
}
console.log("✓ Functions clínicas exigem JWT quando D1 está ativo");
