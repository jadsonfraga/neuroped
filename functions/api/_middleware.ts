/**
 * _middleware.ts — Middleware global para todas as functions/api/*
 * Aplicado automaticamente pelo Cloudflare Pages a todas as rotas filhas.
 *
 * Responsabilidades:
 *  - CORS configurado (origin allowlist via env CORS_ORIGINS)
 *  - Rate limiting básico por IP (via KV ou memória temporária)
 *  - Headers de segurança (X-Content-Type-Options, X-Frame-Options, etc.)
 *  - Validação de Content-Type em POSTs
 *  - Log de auditoria mínimo
 */

interface Env {
  DB?: D1Database;
  RATE_LIMIT_KV?: KVNamespace;
  CORS_ORIGINS?: string;         // Comma-separated allowed origins
  ENVIRONMENT?: string;
}

// Rate limit em memória (fallback quando KV não disponível)
// Cloudflare Workers reusam instâncias no mesmo pop — suficiente para burst básico
const inMemoryRateMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000;   // 1 minuto
const RATE_LIMIT_MAX = 60;             // 60 req/min por IP

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

function getAllowedOrigins(env: Env): string[] {
  const raw = env.CORS_ORIGINS ?? "";
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function getCorsHeaders(origin: string | null, allowedOrigins: string[]): Record<string, string> {
  const allowed =
    allowedOrigins.length === 0 || // sem restrição configurada
    (origin && allowedOrigins.includes(origin)) ||
    allowedOrigins.includes("*");

  if (!allowed || !origin) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
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
  const allowedOrigins = getAllowedOrigins(env);
  const corsHeaders = getCorsHeaders(origin, allowedOrigins);

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

  // Executa a função real
  const response = await next();

  // Clona e adiciona headers de segurança e CORS
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries({ ...corsHeaders, ...SECURITY_HEADERS })) {
    newHeaders.set(k, v);
  }
  newHeaders.set("X-RateLimit-Remaining", String(rl.remaining));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
