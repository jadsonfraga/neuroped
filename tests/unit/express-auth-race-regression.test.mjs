import assert from "node:assert/strict";
import fs from "node:fs";

const auth = fs.readFileSync("server/auth/routes.ts", "utf8");
// Incremento do contador continua atômico em SQL puro (CASE/COALESCE na
// própria UPDATE, nunca read-modify-write em JS)…
assert.match(auth, /failedLoginAttempts: sql`CASE[\s\S]{0,400}COALESCE/);
// …e lockout expirado REINICIA a contagem (senão um erro a cada 15min
// re-bloqueava a conta para sempre).
assert.match(auth, /THEN 1[\s\S]{0,200}ELSE COALESCE/);
assert.match(auth, /PASSWORD_POLICY\.maxFailedAttempts/);
assert.match(auth, /const accepted = db\.transaction/);
assert.match(auth, /eq\(users\.isActive, true\)/);
assert.match(auth, /const newRefreshRow = tx[\s\S]{0,800}const revoked = tx\.update/);
assert.match(auth, /revoked\.changes !== 1/);
assert.match(auth, /REFRESH_RACE/);
// Corrida benigna (dois refreshes do mesmo cliente) NÃO revoga a família;
// reuso fora da janela de graça revoga.
assert.match(auth, /refresh_concurrent_race/);
assert.match(auth, /refresh_reuse_detected/);
assert.match(auth, /REFRESH_REUSE_GRACE_MS/);
console.log("✓ Express auth: lockout, login e rotação de refresh são protegidos contra corrida");
