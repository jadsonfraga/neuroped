import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const storage = readFileSync("client/src/lib/secureStorage.ts", "utf8");
const client = readFileSync("client/src/lib/accountWorkspace.ts", "utf8");
const route = readFileSync("functions/api/me/workspace.ts", "utf8");
const migration = readFileSync("db/migrations/0041_account_workspace_items.sql", "utf8");
const bootstrap = readFileSync("db/schema.d1.sql", "utf8");

assert.match(storage, /isAccountWorkspaceRemoteMode\(\)/, "remote auth switches secureStorage to backend");
assert.match(storage, /putAccountWorkspaceItem\(key, value, expiresAt\)/, "remote writes use the authenticated account API");
assert.match(storage, /getAccountWorkspaceItem<T>\(key\)/, "remote reads restore data from the account API");
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
console.log("✓ account workspace is encrypted, tenant-scoped and restored after authenticated login");
