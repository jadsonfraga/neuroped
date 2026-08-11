import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "neuroped-auth-state-"));
process.env.DATABASE_PATH = path.join(tmp, "auth.db");
process.env.NEUROPED_JWT_SECRET = "segredo-express-de-teste-com-mais-de-trinta-e-dois-caracteres";
process.env.NODE_ENV = "test";

const [{ sqlite }, { signAccessToken }, { requireAuth, requireProfessional }] = await Promise.all([
  import("../../server/storage"),
  import("../../server/lib/jwt"),
  import("../../server/middleware/auth"),
]);

const userId = crypto.randomUUID();
const now = new Date().toISOString();
sqlite.prepare(`
  INSERT INTO users
    (id, email, name, password_hash, role, is_active, failed_login_attempts,
     must_change_password, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, 1, 0, 0, ?, ?)
`).run(
  userId,
  "current-state@example.com",
  "Estado Atual",
  "hash-apenas-para-teste-com-comprimento-suficiente",
  "reader",
  now,
  now,
);

// O JWT carrega um papel MAIS PRIVILEGIADO do que o banco atual. O middleware
// precisa ignorar o papel congelado no token e usar o papel vigente.
const staleProfessionalToken = signAccessToken({
  userId,
  email: "old-email@example.com",
  role: "professional",
  name: "Nome antigo",
});

function reqFor(token: string) {
  return {
    headers: { authorization: `Bearer ${token}` },
    cookies: {},
  } as any;
}

function recorder() {
  const state: { status: number; body: unknown } = { status: 200, body: null };
  const res: any = {
    status(code: number) {
      state.status = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return res;
    },
  };
  return { state, res };
}

{
  const req = reqFor(staleProfessionalToken);
  const { state, res } = recorder();
  let nextCalled = false;
  requireAuth(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(state.status, 200);
  assert.equal(req.user.role, "reader", "papel atual do banco deve vencer claim antigo");
  assert.equal(req.user.email, "current-state@example.com", "identidade atual deve vir do banco");

  const roleCheck = recorder();
  let privilegedNext = false;
  requireProfessional(req, roleCheck.res, () => { privilegedNext = true; });
  assert.equal(privilegedNext, false, "JWT antigo não pode preservar privilégio profissional");
  assert.equal(roleCheck.state.status, 403);
}

// Desativação precisa revogar imediatamente o access token ainda não expirado.
sqlite.prepare("UPDATE users SET is_active = 0 WHERE id = ?").run(userId);
{
  const req = reqFor(staleProfessionalToken);
  const { state, res } = recorder();
  let nextCalled = false;
  requireAuth(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(state.status, 401);
  assert.equal((state.body as { code?: string }).code, "AUTH_INVALID");
}

// Exclusão também revoga o token imediatamente.
sqlite.prepare("DELETE FROM users WHERE id = ?").run(userId);
{
  const req = reqFor(staleProfessionalToken);
  const { state, res } = recorder();
  let nextCalled = false;
  requireAuth(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(state.status, 401);
}

sqlite.close();
fs.rmSync(tmp, { recursive: true, force: true });

console.log("✓ Express auth: conta desativada e papel antigo no JWT não sobrevivem ao estado atual do banco");
