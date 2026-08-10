/**
 * _middleware.ts — Middleware global para todas as functions/api/*
 * Aplicado automaticamente pelo Cloudflare Pages a todas as rotas filhas.
 *
 * Responsabilidades:
 *  - CORS fail-closed para os aliases públicos oficiais
 *  - Rate limiting básico por IP (via KV ou memória temporária)
 *  - Headers de segurança (X-Content-Type-Options, X-Frame-Options, etc.)
 *  - Validação de Content-Type em POSTs
 *  - Log de auditoria mínimo
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
  canWriteOperationalAgenda,
  type AuthContextData,
} from "./auth/_authorization";

// Rate limit em memória (fallback quando KV não disponível)
// Cloudflare Workers reusam instâncias no mesmo pop — suficiente para burst básico
const inMemoryRateMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000;   // 1 minuto
const RATE_LIMIT_MAX = 60;             // 60 req/min por IP

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy":
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

const OFFICIAL_CROSS_ORIGINS: ReadonlySet<string> = new Set([
  "https://superneuroped.vercel.app",
] as const);

function getCorsHeaders(
  origin: string | null,
  requestOrigin: string,
): Record<string, string> {
  const allowed =
    origin === requestOrigin ||
    Boolean(origin && OFFICIAL_CROSS_ORIGINS.has(origin));

  if (!allowed || !origin) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/version",
  "/api/cert",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/cert",
]);

function apiError(message: string, code: string, status: number): Response {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
  });
}

/**
 * Um banco D1 ativo pode conter dados clínicos, ainda que as tabelas históricas
 * tenham o sufixo `_demo`. Nesse cenário toda rota não pública exige access JWT.
 * Sem D1, o catálogo fictício continua disponível para demonstração/offline.
 *
 * `/api/cert` é uma exceção deliberada: o endpoint está aposentado e sempre
 * responde HTTP 410 sem expor certificado, senha ou metadado sensível. Mantê-lo
 * público permite provar remotamente que o antigo mecanismo de distribuição não
 * reapareceu, enquanto todas as rotas clínicas continuam autenticadas.
 */
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
  const isAgendaWrite =
    isWrite &&
    (path === "/api/agenda" || path.startsWith("/api/agenda/")) &&
    canWriteOperationalAgenda(user);

  if (isWrite && !isOwnConsentWrite && !isAgendaWrite && !canWriteClinicalData(user)) {
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
    return {
      failure: apiError(
        "Autenticação do servidor não configurada.",
        "AUTH_NOT_CONFIGURED",
        503,
      ),
      user: null,
    };
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  const payload = token ? await verifyJwt(token, secret) : null;
  if (!payload || payload.type !== "access") {
    return {
      failure: apiError("Não autenticado.", "UNAUTHENTICATED", 401),
      user: null,
    };
  }

  let row;
  try {
    row = await getUserById(env.DB, payload.sub);
    if (!row || !row.is_active) {
      return {
        failure: apiError("Sessão inválida.", "INVALID_SESSION", 401),
        user: null,
      };
    }
    if (!(await isSessionFamilyActive(env.DB, row.id, payload.sid))) {
      return {
        failure: apiError("Sessão revogada.", "INVALID_SESSION", 401),
        user: null,
      };
    }
  } catch {
    return {
      failure: apiError("Autenticação temporariamente indisponível.", "AUTH_UNAVAILABLE", 503),
      user: null,
    };
  }

  const user = publicUser(row);
  const forbidden = roleFailure(request, user);
  return { failure: forbidden, user };
}

function getRateLimitKey(request: Request): string {
  // Usa CF-Connecting-IP (Cloudflare) ou X-Forwarded-For como fallback
  const ip =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown";
  return `rl:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = inMemoryRateMap.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    inMemoryRateMap.set(key, entry);
  }

  entry.count += 1;
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);

  // Limpar entradas expiradas periodicamente (evitar memory leak)
  if (inMemoryRateMap.size > 10_000) {
    for (const [k, v] of inMemoryRateMap.entries()) {
      if (now > v.resetAt) inMemoryRateMap.delete(k);
    }
  }

  return {
    allowed: entry.count <= RATE_LIMIT_MAX,
    remaining,
    resetAt: entry.resetAt,
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin, new URL(request.url).origin);

  // Preflight CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders, ...SECURITY_HEADERS },
    });
  }

  // Rate limiting por IP
  const rlKey = getRateLimitKey(request);
  const rl = checkRateLimit(rlKey);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({
        error: "Muitas requisições. Aguarde antes de tentar novamente.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
          ...corsHeaders,
          ...SECURITY_HEADERS,
        },
      }
    );
  }

  // Validar Content-Type em POST/PATCH/PUT
  if (["POST", "PATCH", "PUT"].includes(request.method)) {
    const ct = request.headers.get("Content-Type") ?? "";
    if (!ct.includes("application/json")) {
      return new Response(
        JSON.stringify({
          error: "Content-Type deve ser application/json",
          code: "INVALID_CONTENT_TYPE",
        }),
        {
          status: 415,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            ...SECURITY_HEADERS,
          },
        }
      );
    }
  }

  const authorization = await authorizeClinicalApi(request, env);
  if (authorization.failure) {
    const headers = new Headers(authorization.failure.headers);
    for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
    return new Response(authorization.failure.body, {
      status: authorization.failure.status,
      headers,
    });
  }
  if (authorization.user) {
    const mutableContext = context as typeof context & { data?: AuthContextData };
    if (!mutableContext.data) mutableContext.data = {};
    mutableContext.data.authUser = authorization.user;
  }

  // Executa a função real
  const isProduction = (env.ENVIRONMENT ?? "").toLowerCase() === "production";
  const demoWritesEnabled = env.DEMO_API_WRITES_ENABLED === "true";
  // Auth (login/refresh/logout) é backend real, não escrita clínica demo — sempre
  // liberado, senão o login (POST) cairia no bloqueio read-only.
  const isAuthRoute = new URL(request.url).pathname.startsWith("/api/auth/");
  if (isProduction && !env.DB && !demoWritesEnabled && !isAuthRoute && ["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {
    return new Response(
      JSON.stringify({
        error: "API demo em modo somente leitura. Escritas clinicas exigem backend autenticado oficial.",
        code: "DEMO_API_READ_ONLY",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
          ...SECURITY_HEADERS,
        },
      }
    );
  }

  const response = await next();

  // Clona e adiciona headers de segurança e CORS
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries({ ...corsHeaders, ...SECURITY_HEADERS })) {
    newHeaders.set(k, v);
  }
  // /api/health é sondado em TODO carregamento (getAuthCapability) e não carrega
  // nenhum dado sensível — só informa se o backend exige login. O `no-store`
  // global (correto para os demais endpoints clínicos) fazia qualquer página que
  // sondasse health ficar inelegível ao back/forward cache do navegador
  // (JsNetworkRequestReceivedCacheControlNoStoreResource). `no-cache` mantém a
  // revalidação obrigatória (nunca serve estado obsoleto) sem bloquear o bfcache.
  // Nenhum outro endpoint muda: os sensíveis seguem `no-store`.
  const requestPath = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  if (requestPath === "/api/health") {
    newHeaders.set("Cache-Control", "no-cache");
  }
  newHeaders.set("X-RateLimit-Remaining", String(rl.remaining));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};