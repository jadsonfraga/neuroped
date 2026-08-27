import { POST_CANCEL_RETENTION_DAYS } from "./billing";

export const TENANT_EXPORT_SCHEMA_VERSION = "neuroped-tenant-export-v1";

export const TENANT_SYNC_EXPORT_LIMITS = {
  patients: 1_000,
  events: 2_000,
  memberships: 500,
  encryptedBytes: 20_000_000,
  outputBytes: 25_000_000,
} as const;

export const tenantLifecycleStatuses = ["active", "closure_requested", "reactivation_requested", "closed"] as const;
export type TenantLifecycleStatus = (typeof tenantLifecycleStatuses)[number];

export const tenantClosureReasonCodes = [
  "customer_request",
  "duplicate_tenant",
  "migration",
  "other",
] as const;
export type TenantClosureReasonCode = (typeof tenantClosureReasonCodes)[number];

export type EffectiveTenantLifecycleStatus = TenantLifecycleStatus | "purge_ready";
export type TenantAccessMode = "normal" | "export_only" | "blocked";

export interface TenantLifecycleSnapshot {
  status: TenantLifecycleStatus;
  requestedAt: string | null;
  retentionUntil: string | null;
  legalHold: boolean;
}

const DAY_MS = 86_400_000;

export function retentionDeadline(
  requestedAt: Date,
  retentionDays: number = POST_CANCEL_RETENTION_DAYS,
): string {
  if (!Number.isFinite(requestedAt.getTime()) || !Number.isInteger(retentionDays) || retentionDays < 1) {
    throw new Error("TENANT_RETENTION_INPUT_INVALID");
  }
  return new Date(requestedAt.getTime() + retentionDays * DAY_MS).toISOString();
}

export function effectiveTenantLifecycleStatus(
  snapshot: TenantLifecycleSnapshot,
  now: Date = new Date(),
): EffectiveTenantLifecycleStatus {
  if (snapshot.status === "closed") return "closed";
  if (snapshot.status === "active") return "active";
  if (snapshot.status === "reactivation_requested") return "reactivation_requested";
  if (snapshot.legalHold) return "closure_requested";
  const retentionUntil = snapshot.retentionUntil ? Date.parse(snapshot.retentionUntil) : Number.NaN;
  if (!Number.isFinite(retentionUntil)) return "closure_requested";
  return now.getTime() >= retentionUntil ? "purge_ready" : "closure_requested";
}

export function canCancelTenantClosure(
  snapshot: TenantLifecycleSnapshot,
  now: Date = new Date(),
): boolean {
  if (snapshot.status !== "closure_requested") return false;
  const retentionUntil = snapshot.retentionUntil ? Date.parse(snapshot.retentionUntil) : Number.NaN;
  return Number.isFinite(retentionUntil) && now.getTime() < retentionUntil;
}

export function daysUntilRetention(retentionUntil: string | null, now: Date = new Date()): number {
  if (!retentionUntil) return 0;
  const deadline = Date.parse(retentionUntil);
  if (!Number.isFinite(deadline)) return 0;
  return Math.max(0, Math.ceil((deadline - now.getTime()) / DAY_MS));
}

export function tenantAccessMode(status: EffectiveTenantLifecycleStatus): TenantAccessMode {
  if (status === "active") return "normal";
  if (status === "closed") return "blocked";
  return "export_only";
}

export function isTenantClosureReasonCode(value: unknown): value is TenantClosureReasonCode {
  return typeof value === "string" && tenantClosureReasonCodes.includes(value as TenantClosureReasonCode);
}

export function exportWithinSyncLimits(counts: {
  patients: number;
  events: number;
  memberships: number;
  encryptedBytes: number;
}): boolean {
  return (
    Number.isInteger(counts.patients)
    && Number.isInteger(counts.events)
    && Number.isInteger(counts.memberships)
    && Number.isInteger(counts.encryptedBytes)
    && counts.patients >= 0
    && counts.events >= 0
    && counts.memberships >= 0
    && counts.encryptedBytes >= 0
    && counts.patients <= TENANT_SYNC_EXPORT_LIMITS.patients
    && counts.events <= TENANT_SYNC_EXPORT_LIMITS.events
    && counts.memberships <= TENANT_SYNC_EXPORT_LIMITS.memberships
    && counts.encryptedBytes <= TENANT_SYNC_EXPORT_LIMITS.encryptedBytes
  );
}
