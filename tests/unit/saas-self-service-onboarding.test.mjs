import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("self-service registration is server-owned and fail-closed", () => {
  const source = read("functions/api/auth/register.ts");
  assert.match(source, /'professional'/);
  assert.doesNotMatch(source, /parsed\.role/);
  assert.doesNotMatch(source, /parsed\.clinicId/);
  assert.match(source, /password\.length >= 12/);
  assert.match(source, /REGISTRATION_RATE_LIMITED/);
  assert.match(source, /REGISTRATION_GUARD_UNAVAILABLE/);
  assert.match(source, /NEUROPED_E2E_EMAIL/);
  assert.match(source, /account_register/);
});

test("tenant creation derives owner and clinic identifiers on the server", () => {
  const source = read("functions/api/tenants/index.ts");
  assert.match(source, /const clinicId = crypto\.randomUUID\(\)/);
  assert.match(source, /VALUES \(\?, \?, 'owner', 1/);
  assert.match(source, /\.bind\(clinicId, user\.id, user\.id/);
  assert.doesNotMatch(source, /body\.clinicId/);
  assert.doesNotMatch(source, /body\.ownerUserId/);
  assert.match(source, /INSERT INTO clinic_settings/);
  assert.match(source, /clinic_create/);
});

test("organization settings require exact membership and manager permission", () => {
  const source = read("functions/api/tenants/[id]/settings.ts");
  assert.match(source, /getClinicMembership\(db, clinicId, user\)/);
  assert.match(source, /membershipCanManage\(membership\)/);
  assert.match(source, /WHERE c\.id = \?/);
  assert.match(source, /clinic_settings_update/);
  assert.doesNotMatch(source, /SELECT \* FROM clinic_settings/);
});

test("billing snapshot is scoped to the requested active tenant", () => {
  const source = read("functions/api/billing/me.ts");
  assert.match(source, /clinicIdFromRequest/);
  assert.match(source, /AND cm\.clinic_id = \?/);
  assert.match(source, /TENANT_REQUIRED/);
  assert.match(source, /TENANT_FORBIDDEN/);
  assert.doesNotMatch(source, /WHERE cm\.user_id = \? AND cm\.active = 1[\s\S]*LIMIT 1`/);
});

test("password reset tokens never persist or return plaintext", () => {
  const forgot = read("functions/api/auth/forgot-password.ts");
  const reset = read("functions/api/auth/reset-password.ts");
  const delivery = read("functions/api/auth/_passwordResetDelivery.ts");
  assert.match(forgot, /const tokenHash = await sha256Hex\(token\)/);
  assert.match(forgot, /token_hash/);
  assert.doesNotMatch(forgot, /token:\s*token/);
  assert.match(reset, /consumed_by_request_id/);
  assert.match(reset, /DELETE FROM auth_refresh_sessions/);
  assert.match(delivery, /url\.protocol !== "https:"/);
  assert.match(delivery, /AUTH_PUBLIC_APP_URL/);
});

test("migration is additive and tenant settings are clinic-scoped", () => {
  const sql = read("db/migrations/0019_saas_self_service_onboarding.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS clinic_settings/);
  assert.match(sql, /clinic_id TEXT PRIMARY KEY REFERENCES clinics\(id\) ON DELETE CASCADE/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS auth_password_reset_tokens/);
  assert.match(sql, /token_hash TEXT NOT NULL UNIQUE/);
  assert.match(sql, /INSERT OR IGNORE INTO clinic_settings/);
  assert.match(sql, /CREATE TRIGGER IF NOT EXISTS trg_clinic_create_settings/);
  assert.doesNotMatch(sql, /\bDROP\s+(TABLE|COLUMN|INDEX)\b/i);
});

test("login onboarding fails closed when tenant context cannot be loaded", () => {
  const source = read("client/src/pages/login.tsx");
  assert.match(source, /if \(!response\.ok\) \{/);
  assert.match(source, /throw new Error/);
  assert.match(source, /registerSelfService/);
  assert.match(source, /clinic-onboarding-form/);
});
