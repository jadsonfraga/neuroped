import assert from "node:assert/strict";
import fs from "node:fs";
import { DUMMY_PASSWORD_HASH, verifyPassword as verifyWorkerPassword } from "../../functions/api/auth/_crypto";
import { DUMMY_BCRYPT_HASH, verifyPassword as verifyServerPassword } from "../../server/lib/password";

assert.equal(await verifyWorkerPassword("senha-que-nao-existe", DUMMY_PASSWORD_HASH), false);
assert.equal(await verifyServerPassword("senha-que-nao-existe", DUMMY_BCRYPT_HASH), false);

const cfLogin = fs.readFileSync("functions/api/auth/login.ts", "utf8");
const cfCrypto = fs.readFileSync("functions/api/auth/_crypto.ts", "utf8");
const exLogin = fs.readFileSync("server/auth/routes.ts", "utf8");
const exJwt = fs.readFileSync("server/lib/jwt.ts", "utf8");
const shared = fs.readFileSync("functions/api/auth/_shared.ts", "utf8");
const sessions = fs.readFileSync("functions/api/auth/_sessions.ts", "utf8");

assert.doesNotMatch(cfLogin, /ACCOUNT_DISABLED|ACCOUNT_LOCKED|status[^\n]*423/);
assert.match(cfLogin, /DUMMY_PASSWORD_HASH/);
assert.match(cfLogin, /passwordHashNeedsUpgrade/);
assert.match(cfLogin, /needsPasswordUpgrade[\s\S]{0,500}Promise\.all/);
assert.match(cfLogin, /verifyPassword\(password, DUMMY_PASSWORD_HASH\)/);
assert.match(cfCrypto, /PBKDF2_ITERATIONS = 600_000/);
assert.match(shared, /password_hash = COALESCE\(\?, password_hash\)/);
assert.match(shared, /AND password_hash = \?/);
assert.match(cfLogin, /!user \|\| !user\.is_active \|\| locked \|\| !ok/);
assert.doesNotMatch(exLogin, /AUTH_LOCKED|status\(423\)/);
assert.match(exLogin, /DUMMY_BCRYPT_HASH/);
assert.match(shared, /failed_login_attempts = COALESCE\(failed_login_attempts, 0\) \+ 1/);
assert.match(shared, /registerSuccessfulLogin[\s\S]*meta\?\.changes/);
assert.match(sessions, /FROM users[\s\S]{0,300}is_active = 1[\s\S]{0,300}inserted\.meta\?\.changes/);
assert.match(cfCrypto, /header\.alg !== "HS256" \|\| header\.typ !== "JWT"/);
assert.match(cfCrypto, /payload\.iss !== JWT_ISSUER \|\| payload\.aud !== JWT_AUDIENCE/);
assert.match(cfCrypto, /!Number\.isInteger\(payload\.iat\)/);
assert.match(cfCrypto, /payload\.type !== "access" && payload\.type !== "refresh"/);
assert.match(exJwt, /type: "access"/);
assert.match(exJwt, /issuer: JWT_ISSUER/);
assert.match(exJwt, /audience: JWT_AUDIENCE/);
assert.match(exJwt, /decoded\.type !== "access"/);

console.log("✓ auth: resposta não enumerável, dummy hash, contadores concorrentes e contrato JWT protegido");
