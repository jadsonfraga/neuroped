import { tenantJson } from "../tenant/_core";

export type RateLimitResult =
  | { allowed: true; remaining: number; retryAfterSeconds: 0 }
  | { allowed: false; remaining: 0; retryAfterSeconds: number };

function safeBucketKey(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9._:-]/g, "-").slice(0, 80);
}

function rateLimitHeaders(retryAfterSeconds: number): HeadersInit {
  return {
    "Retry-After": String(Math.max(1, retryAfterSeconds)),
  };
}

export async function consumeTenantRateLimit(
  db: D1Database,
  clinicId: string,
  bucket: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const bucketKey = safeBucketKey(bucket);
  if (!clinicId || bucketKey.length < 3 || !Number.isInteger(maxRequests) || maxRequests < 1 || !Number.isInteger(windowSeconds) || windowSeconds < 1) {
    return { allowed: false, remaining: 0, retryAfterSeconds: windowSeconds > 0 ? windowSeconds : 60 };
  }
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000).toISOString();
  const row = await db.prepare(
    `INSERT INTO saas_rate_limit_buckets
       (clinic_id, bucket_key, window_started_at, window_expires_at, request_count, updated_at)
     VALUES (?, ?, ?, ?, 1, ?)
     ON CONFLICT(clinic_id, bucket_key) DO UPDATE SET
       request_count = CASE
         WHEN saas_rate_limit_buckets.window_expires_at <= ? THEN 1
         ELSE saas_rate_limit_buckets.request_count + 1
       END,
       window_started_at = CASE
         WHEN saas_rate_limit_buckets.window_expires_at <= ? THEN ?
         ELSE saas_rate_limit_buckets.window_started_at
       END,
       window_expires_at = CASE
         WHEN saas_rate_limit_buckets.window_expires_at <= ? THEN ?
         ELSE saas_rate_limit_buckets.window_expires_at
       END,
       updated_at = ?
     RETURNING request_count, window_expires_at`,
  ).bind(clinicId, bucketKey, nowIso, expiresAt, nowIso, nowIso, nowIso, nowIso, nowIso, expiresAt, nowIso).first<{ request_count: number; window_expires_at: string }>();
  if (!row) return { allowed: false, remaining: 0, retryAfterSeconds: windowSeconds };
  const retryAfterSeconds = Math.max(1, Math.ceil((new Date(row.window_expires_at).getTime() - Date.now()) / 1000));
  if (row.request_count > maxRequests) return { allowed: false, remaining: 0, retryAfterSeconds };
  return { allowed: true, remaining: Math.max(0, maxRequests - row.request_count), retryAfterSeconds: 0 };
}

export async function enforceTenantRateLimit(
  db: D1Database,
  clinicId: string,
  bucket: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<Response | null> {
  try {
    const result = await consumeTenantRateLimit(db, clinicId, bucket, maxRequests, windowSeconds);
    if (result.allowed) return null;
    const response = tenantJson({ error: "Limite operacional temporariamente excedido.", code: "TENANT_RATE_LIMITED" }, 429);
    Object.entries(rateLimitHeaders(result.retryAfterSeconds)).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  } catch (error) {
    if (String(error).toLowerCase().includes("no such table")) {
      return tenantJson({ error: "Rate limit operacional não configurado.", code: "SAAS_RATE_LIMIT_NOT_CONFIGURED" }, 503);
    }
    throw error;
  }
}
