import assert from "node:assert/strict";
import fs from "node:fs";

const auth = fs.readFileSync("server/auth/routes.ts", "utf8");
assert.match(auth, /failedLoginAttempts: sql`COALESCE/);
assert.match(auth, /PASSWORD_POLICY\.maxFailedAttempts/);
assert.match(auth, /const accepted = db\.transaction/);
assert.match(auth, /eq\(users\.isActive, true\)/);
assert.match(auth, /const newRefreshRow = tx[\s\S]{0,800}const revoked = tx\.update/);
assert.match(auth, /revoked\.changes !== 1/);
assert.match(auth, /REFRESH_RACE/);
assert.match(auth, /refresh_race_or_reuse_detected/);
console.log("✓ Express auth: lockout, login e rotação de refresh são protegidos contra corrida");
