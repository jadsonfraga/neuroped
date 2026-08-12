import assert from "node:assert/strict";
import fs from "node:fs";
import { isLocked, type UserRow } from "../../functions/api/auth/_shared";
import { isAccountLocked, isExpiredOrInvalidTimestamp } from "../../server/lib/password";

const user: UserRow = {
  id: "u", name: "U", email: "u@example.com", role: "professional", is_active: 1,
  password_hash: "x", must_change_password: 0, failed_login_attempts: 0, locked_until: "nao-e-data",
};
assert.equal(isLocked(user), true, "lock D1 malformado deve falhar fechado");
assert.equal(isAccountLocked("nao-e-data"), true, "lock Express malformado deve falhar fechado");
assert.equal(isExpiredOrInvalidTimestamp("nao-e-data"), true);
assert.equal(isExpiredOrInvalidTimestamp("2000-01-01T00:00:00.000Z"), true);
assert.equal(isExpiredOrInvalidTimestamp("2999-01-01T00:00:00.000Z"), false);

const sessions = fs.readFileSync("functions/api/auth/_sessions.ts", "utf8");
assert.match(sessions, /!Number\.isFinite\(currentExpiry\)/);
assert.match(sessions, /julianday\(expires_at\) > julianday\(\?\)/);
assert.match(sessions, /EXISTS \([\s\S]{0,300}FROM users u[\s\S]{0,300}u\.is_active = 1/);
assert.match(sessions, /SELECT 1 AS active[\s\S]{0,300}julianday\(expires_at\)/);

const expressAuth = fs.readFileSync("server/auth/routes.ts", "utf8");
assert.match(expressAuth, /isExpiredOrInvalidTimestamp\(stored\.expiresAt\)/);
assert.match(expressAuth, /isExpiredOrInvalidTimestamp\(current\.expiresAt\)/);
assert.doesNotMatch(expressAuth, /new Date\((?:stored|current)\.expiresAt\)\.getTime\(\)/);

console.log("✓ auth temporal: locks/expiries malformados e sessão de conta desativada falham fechado");
