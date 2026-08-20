import { COMMERCIAL_PLAN, type BillingStatus } from "../../../shared/billing";
import type { BillingEnv } from "./_core";

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_VERSION = "2026-06-24.dahlia";
const SIGNATURE_TOLERANCE_SECONDS = 300;

interface StripeErrorPayload {
  error?: { message?: string; type?: string };
}

function requireStripeSecret(env: BillingEnv): string {
  const secret = env.STRIPE_SECRET_KEY?.trim();
  if (!secret) throw new Error("STRIPE_NOT_CONFIGURED");
  return secret;
}

async function stripeRequest<T>(
  env: BillingEnv,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireStripeSecret(env)}`,
      "Stripe-Version": STRIPE_VERSION,
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json() as T & StripeErrorPayload;
  if (!response.ok) {
    const error = new Error(payload.error?.message || `Stripe respondeu ${response.status}`);
    Object.assign(error, { code: "STRIPE_API_ERROR", status: response.status });
    throw error;
  }
  return payload;
}

export function stripePost<T>(
  env: BillingEnv,
  path: string,
  values: URLSearchParams,
  idempotencyKey?: string,
): Promise<T> {
  return stripeRequest<T>(env, path, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: values.toString(),
  });
}

export function stripeGet<T>(env: BillingEnv, path: string): Promise<T> {
  return stripeRequest<T>(env, path, { method: "GET" });
}

export async function assertCommercialPrice(env: BillingEnv): Promise<void> {
  const priceId = env.STRIPE_PRICE_ID?.trim();
  if (!priceId) throw new Error("STRIPE_NOT_CONFIGURED");
  const price = await stripeGet<{
    active?: boolean;
    currency?: string;
    unit_amount?: number | null;
    recurring?: { interval?: string } | null;
  }>(env, `/prices/${encodeURIComponent(priceId)}`);
  if (
    price.active !== true
    || price.currency?.toUpperCase() !== COMMERCIAL_PLAN.currency
    || price.unit_amount !== COMMERCIAL_PLAN.unitAmountCents
    || price.recurring?.interval !== COMMERCIAL_PLAN.interval
  ) {
    throw new Error("STRIPE_PRICE_CONTRACT_MISMATCH");
  }
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

export async function sha256(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

export async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1_000),
): Promise<boolean> {
  const endpointSecret = secret?.trim();
  if (!endpointSecret || !header) return false;
  const parts = header.split(",").map((part) => part.trim().split("=", 2));
  const timestampRaw = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  const timestamp = Number(timestampRaw);
  if (!Number.isSafeInteger(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(endpointSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const expected = hex(signature);
  return signatures.some((candidate) => constantTimeEqual(candidate, expected));
}

export function mapStripeStatus(status: string): BillingStatus {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";
  if (status === "incomplete") return "incomplete";
  return "suspended";
}

export function canonicalAppUrl(env: BillingEnv): string {
  const fallback = "https://neuroped.pages.dev";
  try {
    const url = new URL(env.CANONICAL_APP_URL?.trim() || fallback);
    if (url.protocol !== "https:") return fallback;
    if (!new Set(["neuroped.pages.dev", "superneuroped.vercel.app"]).has(url.hostname)) return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}
