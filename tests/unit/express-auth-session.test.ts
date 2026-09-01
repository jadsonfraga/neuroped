import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import express from "express";

const dbPath = `/tmp/neuroped-express-auth-session-${process.pid}.db`;
fs.rmSync(dbPath, { force: true });
process.env.DATABASE_PATH = dbPath;
process.env.NEUROPED_JWT_SECRET = ["express-auth", "session", "fixture"].join("-").padEnd(
  64,
  "x",
);
process.env.NODE_ENV = "test";

const [{ sqlite }, { registerAuthRoutes }, { hashPassword }] =
  await Promise.all([
    import("../../server/storage.js"),
    import("../../server/auth/routes.js"),
    import("../../server/lib/password.js"),
  ]);

const app = express();
app.use(express.json());
registerAuthRoutes(app);

const userId = crypto.randomUUID();
const email = "auth-session@example.test";
const oldPassword = "Old-Password-123!";
const newPassword = "New-Password-456!";
const now = new Date().toISOString();
const passwordHash = await hashPassword(oldPassword);

sqlite
  .prepare(
    `INSERT INTO users
      (id, email, name, password_hash, role, is_active,
       failed_login_attempts, must_change_password, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'admin', 1, 0, 0, ?, ?)`,
  )
  .run(userId, email, "Sessão de Teste", passwordHash, now, now);

const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
  const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
});
const address = server.address();
if (!address || typeof address === "string")
  throw new Error("Servidor de teste sem porta");
const baseUrl = `http://127.0.0.1:${address.port}`;

async function request(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

try {
  const login = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: oldPassword }),
  });
  assert.equal(login.status, 200);
  const initial = (await login.json()) as {
    accessToken: string;
    refreshToken: string;
    user: { mustChangePassword?: boolean };
  };
  assert.ok(initial.accessToken);
  assert.ok(initial.refreshToken);
  assert.equal(initial.user.mustChangePassword, false);

  const initialMe = await request("/api/auth/me", {
    headers: { Authorization: `Bearer ${initial.accessToken}` },
  });
  assert.equal(initialMe.status, 200);

  const changed = await request("/api/auth/change-password", {
    method: "POST",
    headers: { Authorization: `Bearer ${initial.accessToken}` },
    body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
  });
  assert.equal(changed.status, 200);
  const rotated = (await changed.json()) as {
    accessToken: string;
    refreshToken: string;
    user: { mustChangePassword?: boolean };
  };
  assert.ok(rotated.accessToken);
  assert.ok(rotated.refreshToken);
  assert.notEqual(rotated.accessToken, initial.accessToken);
  assert.notEqual(rotated.refreshToken, initial.refreshToken);
  assert.equal(rotated.user.mustChangePassword, false);

  const oldMe = await request("/api/auth/me", {
    headers: { Authorization: `Bearer ${initial.accessToken}` },
  });
  assert.equal(oldMe.status, 401);
  assert.equal(
    ((await oldMe.json()) as { code?: string }).code,
    "AUTH_INVALID_SESSION",
  );

  const newMe = await request("/api/auth/me", {
    headers: { Authorization: `Bearer ${rotated.accessToken}` },
  });
  assert.equal(newMe.status, 200);

  const oldLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: oldPassword }),
  });
  assert.equal(oldLogin.status, 401);

  const newLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: newPassword }),
  });
  assert.equal(newLogin.status, 200);
  const postChange = (await newLogin.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  const logout = await request("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: postChange.refreshToken }),
  });
  assert.equal(logout.status, 200);

  const postLogout = await request("/api/auth/me", {
    headers: { Authorization: `Bearer ${postChange.accessToken}` },
  });
  assert.equal(postLogout.status, 401);
  assert.equal(
    ((await postLogout.json()) as { code?: string }).code,
    "AUTH_INVALID_SESSION",
  );

  console.log(
    "[express-auth-session] ✓ troca de senha revoga access/refresh antigos e logout revoga a sessão nova",
  );
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  sqlite.close();
  fs.rmSync(dbPath, { force: true });
  fs.rmSync(`${dbPath}-shm`, { force: true });
  fs.rmSync(`${dbPath}-wal`, { force: true });
}
