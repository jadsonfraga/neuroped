import assert from "node:assert/strict";
import fs from "node:fs";
import { DUMMY_PASSWORD_HASH, verifyPassword as verifyWorkerPassword } from "../../functions/api/auth/_crypto";
import { DUMMY_BCRYPT_HASH, verifyPassword as verifyServerPassword } from "../../server/lib/password";

assert.equal(await verifyWorkerPassword("senha-que-nao-existe", DUMMY_PASSWORD_HASH), false);
assert.equal(await verifyServerPassword("senha-que-nao-existe", DUMMY_BCRYPT_HASH), false);

const cfLogin = fs.readFileSync("functions/api/auth/login.ts", "utf8");
const exLogin = fs.readFileSync("server/auth/routes.ts", "utf8");
const shared = fs.readFileSync("functions/api/auth/_shared.ts", "utf8");
const sessions = fs.readFileSync("functions/api/auth/_sessions.ts", "utf8");

assert.doesNotMatch(cfLogin, /ACCOUNT_DISABLED|ACCOUNT_LOCKED|status[^\n]*423/);
assert.match(cfLogin, /DUMMY_PASSWORD_HASH/);
assert.match(cfLogin, /!user \|\| !user\.is_active \|\| locked \|\| !ok/);
assert.doesNotMatch(exLogin, /AUTH_LOCKED|status\(423\)/);
assert.match(exLogin, /DUMMY_BCRYPT_HASH/);
assert.match(shared, /failed_login_attempts = COALESCE\(failed_login_attempts, 0\) \+ 1/);
assert.match(shared, /registerSuccessfulLogin[\s\S]*meta\?\.changes/);
assert.match(sessions, /FROM users[\s\S]{0,300}is_active = 1[\s\S]{0,300}inserted\.meta\?\.changes/);

console.log("✓ auth: resposta não enumerável, dummy hash e contadores concorrentes protegidos");
