import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const storage = readFileSync("client/src/lib/secureStorage.ts", "utf8");
const sync = readFileSync("client/src/lib/workspaceSync.ts", "utf8");
const merge = readFileSync("client/src/lib/workspaceMerge.ts", "utf8");
const fixture = readFileSync("scripts/lib/synthetic-clinical-api.mjs", "utf8");
const client = readFileSync("client/src/lib/accountWorkspace.ts", "utf8");
const route = readFileSync("functions/api/me/workspace.ts", "utf8");
const migration = readFileSync("db/migrations/0041_account_workspace_items.sql", "utf8");
const bootstrap = readFileSync("db/schema.d1.sql", "utf8");

assert.match(storage, /if \(hasAccountWorkspaceSession\(\)\) \{\n    return remoteSecureSet\(key, value, ttlMs\);/, "authenticated remote session writes only to the account backend");
assert.match(storage, /if \(hasAccountWorkspaceSession\(\)\) \{\n    return remoteSecureGet<T>\(key\);/, "authenticated remote session reads only from the account backend");
assert.match(storage, /createWorkspaceSync\(\{\n  getItem: getAccountWorkspaceItem,\n  putItem: putAccountWorkspaceItem,/, "secureStorage uses the versioned sync layer");
assert.doesNotMatch(sync, /localStorage|sessionStorage|indexedDB/, "version snapshots stay in memory only (LIVE: no PHI in browser storage)");
assert.match(sync, /snapshots\.delete\(key\);\n        return null;/, "a failed read forgets the base instead of pretending the item is empty");
assert.match(sync, /transport\.putItem\(key, candidate, options\.expiresAt, baseVersion\)/, "every write carries the version it was based on");
assert.match(merge, /export function mergeRecordLists/, "record lists merge by id against the common base");
assert.match(client, /if \(body\.found === false\) return null;/, "absence is an explicit found:false, never a swallowed error");
assert.match(client, /response\.status === 409/, "version conflicts are surfaced to the sync layer");
assert.match(client, /body\.code === "WORKSPACE_VERSION_CONFLICT"/, "only a version conflict is treated as mergeable");
assert.match(client, /if \(isVisitorSession\(\)\) return false;/, "visitor sessions never call the workspace API (server would refuse)");
assert.match(client, /mustChangePassword !== true/, "sessions pending a password change never call the workspace API");
assert.match(client, /JSON\.stringify\(\{ key, data, expiresAt, baseVersion \}\)/, "PUT declares baseVersion");
assert.match(client, /authFetch\("\/api\/me\/workspace"/, "workspace calls use authenticated fetch");
assert.match(route, /WHERE clinic_id = \? AND user_id = \? AND item_key_hash = \?/, "workspace queries are tenant-and-owner scoped");
assert.match(route, /resolveBillingClinicId\(/, "workspace requires an active clinic context");
assert.match(route, /getClinicMembership\(/, "workspace validates active clinic membership");
assert.match(route, /membershipCanReadClinical\(/, "workspace reads require clinical read permission");
assert.match(route, /membershipCanWriteClinical\(/, "workspace writes require clinical write permission");
assert.match(route, /clinicalBlindIndex\(/, "workspace keys are blind-indexed instead of stored in plaintext");
assert.match(route, /encryptClinicalJson\(/, "workspace payload is encrypted before D1 persistence");
assert.match(route, /decryptClinicalJson<unknown>\(/, "workspace payload is decrypted only for its owner");
assert.match(route, /prepareSaasAudit\(/, "writes and deletions create metadata-only audit events");
assert.match(route, /MAX_PLAINTEXT_BYTES = 1_400_000/, "D1 row limit is bounded before encryption");
assert.match(route, /if \(!row\) return tenantJson\(\{ found: false \}\);/, "missing item answers 200 found:false (no console 404)");
assert.doesNotMatch(route, /WORKSPACE_ITEM_NOT_FOUND/, "absence is not modelled as an HTTP error");
assert.match(route, /baseVersion obrigatório/, "blind overwrites are rejected");
assert.match(route, /AND item_key_hash = \? AND version = \?/, "updates require the version the client read");
assert.match(route, /WORKSPACE_VERSION_CONFLICT/, "stale writes answer 409 with the current version");
assert.match(route, /result\.meta\.changes !== 1/, "a write that changed nothing is reported as a conflict");
assert.match(route, /\}, true\);\n    const \[result\] = await db\.batch/, "write audit only exists when the write happened");
assert.match(migration, /version TEXT NOT NULL CHECK \(length\(version\) BETWEEN 16 AND 64\)/, "each row carries an opaque version token");
assert.match(migration, /trg_account_workspace_active_membership_update\nBEFORE UPDATE ON account_workspace_items/, "D1 also blocks updates without active membership");
assert.match(fixture, /pathname === "\/api\/me\/workspace"/, "visual/E2E fixture implements the same workspace contract");
assert.match(migration, /PRIMARY KEY \(clinic_id, user_id, item_key_hash\)/, "workspace keys are isolated by clinic and account");
assert.match(migration, /trg_account_workspace_active_membership/, "D1 blocks writes without active clinic membership");
assert.ok(
  migration.indexOf("CREATE TABLE IF NOT EXISTS account_workspace_items")
    < migration.indexOf("CREATE TRIGGER IF NOT EXISTS trg_account_workspace_active_membership"),
  "migration creates the table before its trigger",
);
assert.match(migration, /ON DELETE CASCADE/, "deleting a clinic or account removes owned workspace rows");
assert.match(bootstrap, /CREATE TABLE IF NOT EXISTS account_workspace_items/, "D1 bootstrap schema includes the workspace table");
assert.match(bootstrap, /PRIMARY KEY \(clinic_id, user_id, item_key_hash\)/, "bootstrap schema preserves tenant-and-owner isolation");

const clearAll = storage.slice(storage.indexOf("export async function secureClearAll"), storage.indexOf("export function securePurgeExpired"));
assert.doesNotMatch(clearAll, /deleteAccountWorkspaceItem/, "logout clears local caches without deleting account data");
console.log("✓ account workspace is encrypted, tenant-scoped, versioned and restored after authenticated login");
