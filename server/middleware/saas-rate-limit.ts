/**
 * SaaS Rate Limiting Middleware
 *
 * Per-clinic rate limiting with sliding window and status tracking
 * Prevents API abuse while ensuring fair usage across all clinics
 */

import type { Request, Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../storage.js";
import { rateLimitState } from "@shared/saas-schema-extended";

/**
 * Rate limit configuration per endpoint
 * { requestsPerMinute, requestsPerHour, requestsPerDay }
 */
export const rateLimitConfig: Record<string, { perMinute?: number; perHour: number; perDay?: number }> = {
  // Onboarding (moderate use)
  "GET /api/saas/onboarding/progress": { perHour: 500 },
  "POST /api/saas/onboarding/steps/:id/complete": { perHour: 100 },
  "GET /api/saas/onboarding/steps": { perHour: 500 },

  // Feedback (high frequency expected)
  "POST /api/saas/feedback/appointments/:id/submit": { perHour: 1000 },
  "GET /api/saas/feedback/appointments/:id": { perHour: 500 },
  "GET /api/saas/feedback/metrics": { perHour: 100 },

  // Lifecycle (low frequency)
  "POST /api/saas/lifecycle/request-reactivation": { perHour: 50 },
  "GET /api/saas/lifecycle/status": { perHour: 100 },

  // Templates (moderate use)
  "GET /api/saas/templates/availability": { perHour: 500 },
  "POST /api/saas/templates/availability": { perHour: 100 },
  "GET /api/saas/templates/availability/:id": { perHour: 500 },
  "PATCH /api/saas/templates/availability/:id": { perHour: 100 },
  "DELETE /api/saas/templates/availability/:id": { perHour: 50 },
  "POST /api/saas/templates/availability/:id/apply": { perHour: 100 },

  // Communication (new module)
  "GET /api/saas/templates/communication": { perHour: 500 },
  "POST /api/saas/templates/communication": { perHour: 100 },
  "POST /api/saas/communication/send": { perHour: 500 },
};

interface RateLimitCheckResult {
  allowed: boolean;
  requestCount: number;
  limitPerWindow: number;
  retryAfterSeconds?: number;
  remaining?: number;
}

/**
 * Check if request exceeds rate limit
 *
 * Uses sliding window with 1-hour windows
 * Returns true if allowed, false if blocked
 */
const WINDOW_MS = 60 * 60 * 1000;

/** Início do bucket horário fixo que contém `now`. */
export function windowStartFor(now: Date): Date {
  return new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS);
}

export function checkRateLimit(
  clinicId: string,
  endpoint: string,
  limitConfig: { perHour: number },
): RateLimitCheckResult {
  const now = new Date();
  // Bucket horário fixo. Derivar a janela de `now - 1h` a cada chamada daria a
  // cada pedido um windowStart distinto (precisão de milissegundo), criando uma
  // linha nova por requisição e zerando a contagem — o limite nunca dispararia.
  const windowStart = windowStartFor(now);
  const windowEnd = new Date(windowStart.getTime() + WINDOW_MS);

  const windowStartISO = windowStart.toISOString();
  const windowEndISO = windowEnd.toISOString();

  try {
    // Find or create rate limit record for this window
    let record = db
      .select()
      .from(rateLimitState)
      .where(
        and(
          eq(rateLimitState.clinicId, clinicId),
          eq(rateLimitState.endpoint, endpoint),
          eq(rateLimitState.windowStart, windowStartISO),
        ),
      )
      .get();

    if (!record) {
      // Create new window record
      const recordId = `rls_${crypto.randomUUID()}`;
      db.insert(rateLimitState).values({
        id: recordId,
        clinicId,
        endpoint,
        windowStart: windowStartISO,
        windowEnd: windowEndISO,
        requestCount: 0,
        limitPerWindow: limitConfig.perHour,
        status: "active",
        lastRequestAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }).run();

      record = db
        .select()
        .from(rateLimitState)
        .where(eq(rateLimitState.id, recordId))
        .get();
    }

    const currentCount = record?.requestCount || 0;
    const limit = limitConfig.perHour;

    if (currentCount >= limit) {
      // Update status to throttled/blocked
      db.update(rateLimitState)
        .set({
          status: currentCount >= limit * 1.5 ? "blocked" : "throttled",
          updatedAt: now.toISOString(),
        })
        .where(eq(rateLimitState.id, record!.id))
        .run();

      return {
        allowed: false,
        requestCount: currentCount,
        limitPerWindow: limit,
        retryAfterSeconds: 60,
      };
    }

    // Increment counter
    db.update(rateLimitState)
      .set({
        requestCount: currentCount + 1,
        lastRequestAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .where(eq(rateLimitState.id, record!.id))
      .run();

    return {
      allowed: true,
      requestCount: currentCount + 1,
      limitPerWindow: limit,
      remaining: limit - (currentCount + 1),
    };
  } catch (err) {
    console.error("Rate limit check error:", err);
    // On error, allow request but log
    return {
      allowed: true,
      requestCount: 0,
      limitPerWindow: limitConfig.perHour,
    };
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Um segmento é identificador quando é um UUID puro ou um id prefixado do tipo
 * `tpl_<uuid>` / `inst_<uuid>` que esta base emite.
 *
 * A normalização é por segmento — substituir por regex sobre o caminho inteiro
 * quebra em ids prefixados, porque o casamento para no primeiro hífen do UUID e
 * deixa o resto do identificador na chave.
 */
export function isIdSegment(segment: string): boolean {
  if (UUID.test(segment)) return true;
  const underscore = segment.indexOf("_");
  if (underscore > 0 && UUID.test(segment.slice(underscore + 1))) return true;
  return false;
}

/**
 * Converte um caminho concreto na chave de configuração correspondente.
 * Ex.: "GET /api/saas/templates/availability/tpl_<uuid>"
 *   -> "GET /api/saas/templates/availability/:id"
 */
export function normalizeEndpoint(method: string, pathname: string): string {
  const normalized = pathname
    .split("/")
    .map((segment) => (isIdSegment(segment) ? ":id" : segment))
    .join("/");
  return `${method} ${normalized}`;
}

/**
 * Express middleware: Apply rate limiting
 *
 * Monte depois de `requireAuth`. Sem clínica resolvida ainda, a janela é
 * contada por usuário — o que mantém o limite efetivo em vez de deixar o
 * pedido passar sem contabilizar.
 */
export function saasRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  const subject = ((req as any).clinicId as string | undefined) ?? (user ? `user_${user.id}` : null);

  if (!subject) {
    return next();
  }

  const normalizedEndpoint = normalizeEndpoint(
    req.method,
    `${req.baseUrl}${req.path}`,
  );

  const config = rateLimitConfig[normalizedEndpoint];
  if (!config) {
    return next();
  }

  const result = checkRateLimit(subject, normalizedEndpoint, config);

  // Set response headers for rate limit info
  res.setHeader("X-RateLimit-Limit", config.perHour);
  res.setHeader("X-RateLimit-Remaining", result.remaining || 0);

  if (!result.allowed) {
    res.setHeader("Retry-After", result.retryAfterSeconds || 60);
    return res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: result.retryAfterSeconds || 60,
      limit: result.limitPerWindow,
      current: result.requestCount,
    });
  }

  next();
}
