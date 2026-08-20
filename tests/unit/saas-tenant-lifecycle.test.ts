import assert from "node:assert/strict";
import fs from "node:fs";
import { POST_CANCEL_RETENTION_DAYS } from "../../shared/billing";
import {
  TENANT_EXPORT_SCHEMA_VERSION,
  TENANT_SYNC_EXPORT_LIMITS,
  canCancelTenantClosure,
  effectiveTenantLifecycleStatus,
  exportWithinSyncLimits,
  isTenantClosureReasonCode,
  retentionDeadline,
  tenantAccessMode,
} from "../../shared/tenantLifecycle";
import { evaluateEntitlement } from "../../server/lib/billingEntitlement";
import { clinicStatusDenial } from "../../functions/api/billing/_guard";

assert.equal(POST_CANCEL_RETENTION_DAYS, 30);
assert.equal(TENANT_EXPORT_SCHEMA_VERSION, "neuroped-tenant-export-v1");

{
  const requested = new Date("2026-08-20T12:00:00.000Z");
  assert.equal(retentionDeadline(requested), "2026-09-19T12:00:00.000Z");
}

{
  const now = new Date("2026-08-20T12:00:00.000Z");
  const future = "2026-09-19T12:00:00.000Z";
  const past = "2026-08-19T12:00:00.000Z";
  assert.equal(effectiveTenantLifecycleStatus({
    status: "active", requestedAt: null, retentionUntil: null, legalHold: false,
  }, now), "active");
  assert.equal(effectiveTenantLifecycleStatus({
    status: "closure_requested", requestedAt: now.toISOString(), retentionUntil: future, legalHold: false,
  }, now), "closure_requested");
  assert.equal(effectiveTenantLifecycleStatus({
    status: "closure_requested", requestedAt: "2026-07-01T00:00:00.000Z", retentionUntil: past, legalHold: false,
  }, now), "purge_ready");
  assert.equal(effectiveTenantLifecycleStatus({
    status: "closure_requested", requestedAt: "2026-07-01T00:00:00.000Z", retentionUntil: past, legalHold: true,
  }, now), "closure_requested");
  assert.equal(effectiveTenantLifecycleStatus({
    status: "closed", requestedAt: null, retentionUntil: null, legalHold: false,
  }, now), "closed");
  assert.equal(canCancelTenantClosure({
    status: "closure_requested", requestedAt: now.toISOString(), retentionUntil: future, legalHold: false,
  }, now), true);
  assert.equal(canCancelTenantClosure({
    status: "closure_requested", requestedAt: now.toISOString(), retentionUntil: past, legalHold: false,
  }, now), false);
  assert.equal(tenantAccessMode("active"), "normal");
  assert.equal(tenantAccessMode("closure_requested"), "export_only");
  assert.equal(tenantAccessMode("purge_ready"), "export_only");
  assert.equal(tenantAccessMode("closed"), "blocked");
}

assert.equal(isTenantClosureReasonCode("customer_request"), true);
assert.equal(isTenantClosureReasonCode("free_text_reason"), false);
assert.equal(exportWithinSyncLimits({ patients: 1, events: 2, memberships: 3, encryptedBytes: 1_000 }), true);
assert.equal(exportWithinSyncLimits({
  patients: 1,
  events: TENANT_SYNC_EXPORT_LIMITS.events + 1,
  memberships: 3,
  encryptedBytes: 1_000,
}), false);
assert.equal(exportWithinSyncLimits({
  patients: 1,
  events: 2,
  memberships: 3,
  encryptedBytes: TENANT_SYNC_EXPORT_LIMITS.encryptedBytes + 1,
}), false);

assert.equal(clinicStatusDenial("active", "clinical"), null);
assert.equal(clinicStatusDenial("suspended", "clinical"), "TENANT_EXPORT_ONLY");
assert.equal(clinicStatusDenial("suspended", "export"), null);
assert.equal(clinicStatusDenial("closed", "export"), "TENANT_CLOSED");

{
  const pending = {
    user_id: "u1",
    clinic_id: "c1",
    membership_role: "owner",
    plan_id: null,
    subscription_status: null,
    trial_active: 0,
    is_active: 1,
    trial_ends_at: null,
    customer_status: "pending",
    grace_ends_at: null,
  };
  assert.equal(evaluateEntitlement(pending, "clinical").deniedReason, "ENTITLEMENT_NO_SUBSCRIPTION");
  assert.equal(evaluateEntitlement(pending, "export").deniedReason, null);
}

const migration = fs.readFileSync("db/migrations/0014_saas_tenant_lifecycle.sql", "utf8");
const lifecycle = fs.readFileSync("functions/api/tenants/[id]/lifecycle.ts", "utf8");
const exportRoute = fs.readFileSync("functions/api/tenants/[id]/export.ts", "utf8");
const provider = fs.readFileSync("functions/api/billing/_provider.ts", "utf8");
const webhook = fs.readFileSync("functions/api/billing/webhook.ts", "utf8");
const guard = fs.readFileSync("functions/api/billing/_guard.ts", "utf8");
const deploy = fs.readFileSync(".github/workflows/deploy-cloudflare.yml", "utf8");

assert.match(migration, /CREATE TABLE IF NOT EXISTS tenant_lifecycle/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS tenant_export_events/);
assert.match(migration, /trg_clinic_create_tenant_lifecycle/);
assert.match(migration, /trg_tenant_lifecycle_closed_terminal/);
assert.match(migration, /legal_hold INTEGER NOT NULL DEFAULT 0/);
assert.doesNotMatch(migration, /DELETE\s+FROM/i, "Phase 3 não pode introduzir purge automático");

assert.match(lifecycle, /membership\.role !== "owner"/);
assert.match(lifecycle, /confirmSlug !== membership\.clinicSlug/);
assert.match(lifecycle, /cancelAsaasSubscription/);
assert.match(lifecycle, /cancelAsaasCheckout/);
assert.match(lifecycle, /status = 'closure_requested'/);
assert.match(lifecycle, /status = 'suspended'/);
assert.match(lifecycle, /billingRequiresReactivation/);
assert.doesNotMatch(lifecycle, /DELETE\s+FROM/i, "endpoint de lifecycle não pode apagar tenant");

assert.match(provider, /method: "POST" \| "PUT" \| "DELETE"/);
assert.match(provider, /\/subscriptions\/\$\{encodeURIComponent\(id\)\}/);
assert.match(provider, /"DELETE"/);
assert.match(provider, /\/checkouts\/\$\{encodeURIComponent\(id\)\}\/cancel/);

assert.match(webhook, /COALESCE\(tl\.status, 'active'\) AS lifecycle_status/);
assert.match(webhook, /lifecycleLocked/);
assert.match(webhook, /nextStatus = "suspended"/);

assert.match(exportRoute, /TENANT_EXPORT_TOO_LARGE/);
assert.match(exportRoute, /patient-profile:\$\{row\.id\}/);
assert.match(exportRoute, /clinical-event:\$\{row\.id\}/);
assert.match(exportRoute, /tenant_export_events/);
assert.match(exportRoute, /tenant_export_created/);
assert.match(exportRoute, /digestAlgorithm: "SHA-256"/);
assert.match(exportRoute, /complete: true/);
assert.doesNotMatch(exportRoute, /profileEncrypted:/);
assert.doesNotMatch(exportRoute, /payloadEncrypted:/);

assert.match(guard, /JOIN clinics c ON c\.id = cm\.clinic_id/);
assert.match(guard, /TENANT_EXPORT_ONLY/);
assert.match(guard, /TENANT_CLOSED/);

assert.match(deploy, /0014_saas_tenant_lifecycle\.sql/);
assert.match(deploy, /tenant_export_events/);
assert.match(deploy, /trg_clinic_create_tenant_lifecycle/);

console.log("saas-tenant-lifecycle: retenção, export íntegro e encerramento seguro aprovados ✔");
