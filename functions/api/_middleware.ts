/**
 * _middleware.ts — Middleware global para todas as functions/api/*
 * Aplicado automaticamente pelo Cloudflare Pages a todas as rotas filhas.
 */

interface Env {
  DB?: D1Database;
  RATE_LIMIT_KV?: KVNamespace;
  ENVIRONMENT?: string;
  DEMO_API_WRITES_ENABLED?: string;
  NEUROPED_JWT_SECRET?: string;
}

import { verifyJwt } from "./auth/_crypto";
import { getUserById, publicUser, type PublicUser } from "./auth/_shared";
import { isSessionFamilyActive } from "./auth/_sessions";
import {
  canReadAuditLog,
  canWriteClinicalData,
  type AuthContextData,
} from "./auth/_authorization";

const inMemoryRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

const OFFICIAL_CROSS_ORIGINS: ReadonlySet<string> = new Set([
  "https://superneuroped.vercel.app",
] as const);

function getCorsHeaders(origin: string | null, requestOrigin: string): Record<string, string> {
  const allowed = origin === requestOrigin || Boolean(origin && OFFICIAL_CROSS_ORIGINS.has(origin));
  if (!allowed || !origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/version",
  "/api/cert",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/public-booking",
]);

function apiError(message: string, code: string, status: number): Response {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
  });
}

interface AuthorizationResult {
  failure: Response | null;
  user: PublicUser | null;
}

function roleFailure(request: Request, user: PublicUser): Response | null {
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();

  if (path === "/api/audit-log" && !canReadAuditLog(user)) {
    return apiError("Acesso restrito ao administrador.", "FORBIDDEN", 403);
  }

  const isWrite = ["POST", "PATCH", "PUT", "DELETE"].includes(method);
  const isOwnConsentWrite = path === "/api/consents" && method === "POST";
  const isOwnPasswordChange = path === "/api/auth/change-password" && method === "POST";
  // `operator` pode escrever somente no endpoint operacional. A própria função
  // /api/operations resolve o vínculo com o profissional e filtra as ações;
  // nenhuma rota clínica herda esta exceção.
  const isDelegatedOperationalWrite =
    user.role === "operator" && path === "/api/operations" && method === "POST";

  if (
    isWrite &&
    !isOwnConsentWrite &&
    !isOwnPasswordChange &&
    !isDelegatedOperationalWrite &&
    !canWriteClinicalData(user)
  ) {
    return apiError("Perfil sem permissão para alterar dados clínicos.", "FORBIDDEN", 403);
  }
  return null;
}

async function authorizeClinicalApi(request: Request, env: Env): Promise<AuthorizationResult> {
  if (!env.DB) return { failure: null, user: null };
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  if (PUBLIC_API_PATHS.has(path)) return { failure: null, user: null };

  const secret = env.NEUROPED_JWT_SECRET;
  if (!secret?.trim() || secret.trim().length < 32) {
    return { failure: apiError("Autenticação do servidor não configurada.", "AUTH_NOT_CONFIGURED", 503), user: null };
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const payload = token ? await verifyJwt(token, secret) : null;
  if (!payload || payload.type !== "access") {
    return { failure: apiError("Não autenticado.", "UNAUTHENTICATED", 401), user: null };
  }

  let row;
  try {
    row = await getUserById(env.DB, payload.sub);
    if (!row || !row.is_active) return { failure: apiError("Sessão inválida.", "INVALID_SESSION", 401), user: null };
    if (!(await isSessionFamilyActive(env.DB, row.id, payload.sid))) {
      return { failure: apiError("Sessão revogada.", "INVALID_SESSION", 401), user: null };
    }
  } catch {
    return { failure: apiError("Autenticação temporariamente indisponível.", "AUTH_UNAVAILABLE", 503), user: null };
  }

  const user = publicUser(row);
  return { failure: roleFailure(request, user), user };
}

function getRateLimitKey(request: Request): string {
  const ip = request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ?? "unknown";
  return `rl:${ip}`;
}

async function checkRateLimit(
  key: string,
  kv?: KVNamespace,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const blockKey = `rate-limit:block:${key}`;
  if (kv) {
    try {
      const distributedReset = Number(await kv.get(blockKey));
      if (Number.isFinite(distributedReset) && distributedReset > now) {
        return { allowed: false, remaining: 0, resetAt: distributedReset };
      }
    } catch {
      // KV é reforço distribuído; falha dele não derruba a API nem elimina o teto local.
    }
  }

  let entry = inMemoryRateMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    inMemoryRateMap.set(key, entry);
  }
  entry.count += 1;
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);
  const allowed = entry.count <= RATE_LIMIT_MAX;
  if (!allowed && kv) {
    try {
      await kv.put(blockKey, String(entry.resetAt), { expirationTtl: 60 });
    } catch {
      // Mantém o bloqueio local mesmo se a propagação distribuída falhar.
    }
  }
  if (inMemoryRateMap.size > 10_000) {
    for (const [k, v] of inMemoryRateMap.entries()) if (now > v.resetAt) inMemoryRateMap.delete(k);
  }
  return { allowed, remaining, resetAt: entry.resetAt };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin, new URL(request.url).origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...corsHeaders, ...SECURITY_HEADERS } });
  }

  const rl = await checkRateLimit(getRateLimitKey(request), env.RATE_LIMIT_KV);
  if (!rl.allowed) {
    return new Response(JSON.stringify({
      error: "Muitas requisições. Aguarde antes de tentar novamente.",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000),
    }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Remaining": "0",
        ...corsHeaders,
        ...SECURITY_HEADERS,
      },
    });
  }

  if (["POST", "PATCH", "PUT"].includes(request.method)) {
    const ct = (request.headers.get("Content-Type") ?? "").toLowerCase();
    const bodyPath = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    const multipartAllowed =
      request.method === "POST" &&
      bodyPath === "/api/integrations/boaconsulta/import" &&
      ct.includes("multipart/form-data");
    if (!ct.includes("application/json") && !multipartAllowed) {
      return new Response(JSON.stringify({ error: "Content-Type deve ser application/json", code: "INVALID_CONTENT_TYPE" }), {
        status: 415,
        headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
      });
    }
  }

  const requestPathBeforeAuth = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  const isProductionBeforeAuth = (env.ENVIRONMENT ?? "").toLowerCase() === "production";
  if (
    isProductionBeforeAuth &&
    !env.DB &&
    !PUBLIC_API_PATHS.has(requestPathBeforeAuth)
  ) {
    return new Response(JSON.stringify({
      error: "Backend persistente indisponível. A rota protegida falhou fechada.",
      code: "DB_REQUIRED",
    }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
    });
  }

  const authorization = await authorizeClinicalApi(request, env);
  if (authorization.failure) {
    const headers = new Headers(authorization.failure.headers);
    for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
    return new Response(authorization.failure.body, { status: authorization.failure.status, headers });
  }
  if (authorization.user) {
    const mutableContext = context as typeof context & { data?: AuthContextData };
    if (!mutableContext.data) mutableContext.data = {};
    mutableContext.data.authUser = authorization.user;
  }

  const isProduction = (env.ENVIRONMENT ?? "").toLowerCase() === "production";
  const demoWritesEnabled = env.DEMO_API_WRITES_ENABLED === "true";
  const isAuthRoute = new URL(request.url).pathname.startsWith("/api/auth/");
  if (!isProduction && !env.DB && !demoWritesEnabled && !isAuthRoute && ["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {
    return new Response(JSON.stringify({
      error: "API demo em modo somente leitura. Escritas clinicas exigem backend autenticado oficial.",
      code: "DEMO_API_READ_ONLY",
    }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders, ...SECURITY_HEADERS },
    });
  }

  const response = await next();
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries({ ...corsHeaders, ...SECURITY_HEADERS })) newHeaders.set(k, v);
  const requestPath = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  if (requestPath === "/api/health") newHeaders.set("Cache-Control", "no-cache");
  newHeaders.set("X-RateLimit-Remaining", String(rl.remaining));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};