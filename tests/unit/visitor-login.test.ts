/**
 * visitor-login.test.ts — login de visitante que só abre as escalas.
 *
 * Handlers REAIS (login, refresh, middleware) sobre SQLite em memória com o SQL
 * real da migração de sessões. A senha do visitante é montada em runtime a
 * partir do "ambiente" do teste: ela nunca está no repositório nem no banco.
 *
 * Provado:
 *  1. sem o segredo (ou curto demais) o login responde 401 genérico e NENHUMA
 *     conta é criada;
 *  2. senha errada: 401 e nenhuma conta; senha certa: sessão com papel
 *     `visitor`, linha sem password_hash, sem membership, idempotente;
 *  3. sem lockout por conta: muitas tentativas erradas não trancam o visitante;
 *  4. middleware deny-by-default: só GET /api/auth/me passa; leitura clínica,
 *     escrita, troca de senha, consentimento, perfil, convite e auditoria são
 *     403 VISITOR_RESTRICTED e o handler seguinte nunca roda;
 *  5. interruptores: remover o segredo derruba sessões e refresh; desativar a
 *     conta também; identidade ocupada por outro papel nunca é sequestrada;
 *  6. `getContextUser` recusa o papel (handlers de clínica respondem 401).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { onRequest } from "../../functions/api/_middleware";
import { onRequestPost as login } from "../../functions/api/auth/login";
import { onRequestPost as refresh } from "../../functions/api/auth/refresh";
import { getContextUser } from "../../functions/api/auth/_authorization";
import { visitorApiAllowed } from "../../functions/api/auth/_visitor";
import { publicUser, type UserRow } from "../../functions/api/auth/_shared";

class StatementMock {
  constructor(
    private readonly db: Database.Database,
    private readonly sql: string,
    private readonly values: unknown[] = [],
  ) {}
  bind(...values: unknown[]) {
    return new StatementMock(this.db, this.sql, values);
  }
  async first<T>() {
    return (this.db.prepare(this.sql).get(...this.values) as T | undefined) ?? null;
  }
  async all<T>() {
    return { success: true, results: this.db.prepare(this.sql).all(...this.values) as T[], meta: {} };
  }
  async run() {
    const result = this.db.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: result.changes } };
  }
  exec() {
    const result = this.db.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: result.changes } };
  }
}
class D1Mock {
  constructor(private readonly db: Database.Database) {}
  prepare(sql: string) {
    return new StatementMock(this.db, sql);
  }
  async batch(statements: StatementMock[]) {
    return this.db.transaction(() => statements.map((s) => s.exec()))();
  }
}

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'professional' CHECK (role IN ('admin', 'professional', 'reader', 'operator')),
    is_active INTEGER NOT NULL DEFAULT 1,
    password_hash TEXT,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE clinic_memberships (
    clinic_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (clinic_id, user_id)
  );
`);
sqlite.exec(readFileSync("db/migrations/0003_refresh_sessions.sql", "utf8"));
const db = new D1Mock(sqlite) as unknown as D1Database;

// Montados em runtime: nada aqui parece credencial real para o scanner do repo.
const jwtSecret = ["visitor", "test", "jwt", "secret", "with", "enough", "length", "0123456789"].join("-");
const visitorPw = ["visitor", "fixture", "pw"].join("-");
const baseEnv = { DB: db, NEUROPED_JWT_SECRET: jwtSecret, NEUROPED_VISITOR_PASSWORD: visitorPw };

const users = () => sqlite.prepare("SELECT * FROM users WHERE lower(email) = 'visitante'").all() as Array<Record<string, unknown>>;
const families = () => (sqlite.prepare("SELECT COUNT(DISTINCT family_id) AS n FROM auth_refresh_sessions").get() as { n: number }).n;

let ipCounter = 0;
function loginContext(email: string, password: string, env: Record<string, unknown>) {
  ipCounter += 1;
  return {
    env,
    request: new Request("https://neuroped.test/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", "CF-Connecting-IP": `198.51.100.${ipCounter % 250}` },
      body: JSON.stringify({ email, password }),
    }),
  } as never;
}

// ── 1) Sem segredo (ou curto): 401 genérico e nenhuma conta ────────────────
for (const env of [
  { ...baseEnv, NEUROPED_VISITOR_PASSWORD: undefined },
  { ...baseEnv, NEUROPED_VISITOR_PASSWORD: "curta" },
  { ...baseEnv, NEUROPED_VISITOR_PASSWORD: "   " },
]) {
  const response = await login(loginContext("visitante", visitorPw, env));
  assert.equal(response.status, 401, "sem segredo configurado o login não existe");
  assert.equal(((await response.json()) as { code: string }).code, "INVALID_CREDENTIALS");
}
assert.equal(users().length, 0, "login desligado não cria conta");

// ── 2) Senha errada: 401 e nada criado; certa: sessão visitor ──────────────
{
  const wrong = await login(loginContext("visitante", "senha-errada", baseEnv));
  assert.equal(wrong.status, 401);
  assert.equal(users().length, 0, "senha errada não provisiona conta");
}
const ok = await login(loginContext("visitante", visitorPw, baseEnv));
assert.equal(ok.status, 200);
const session = (await ok.json()) as {
  accessToken: string;
  refreshToken: string;
  user: { id: string; role: string; email: string; mustChangePassword: boolean };
};
assert.equal(session.user.role, "visitor");
assert.equal(session.user.email, "visitante");
assert.equal(session.user.mustChangePassword, false);
{
  const rows = users();
  assert.equal(rows.length, 1);
  // O CHECK de produção (schema.d1.sql) só aceita admin/professional/reader/operator.
  assert.equal(rows[0].role, "reader", "no banco o visitante é o papel mínimo reader");
  assert.equal(rows[0].password_hash, null, "a senha nunca é gravada no banco");
  assert.equal(
    (sqlite.prepare("SELECT COUNT(*) AS n FROM clinic_memberships WHERE user_id = ?").get(rows[0].id) as { n: number }).n,
    0,
    "visitante nunca tem clínica",
  );
}
// Variantes de caixa/espaço são a mesma identidade; segunda sessão é outra família.
{
  const again = await login(loginContext("  VISITANTE ", visitorPw, baseEnv));
  assert.equal(again.status, 200);
  assert.equal(users().length, 1, "idempotente: uma única linha");
  assert.equal(families(), 2, "cada login é uma sessão independente");
}

// ── 3) Sem lockout por conta ───────────────────────────────────────────────
for (let attempt = 0; attempt < 8; attempt++) {
  const wrong = await login(loginContext("visitante", `errada-${attempt}`, baseEnv));
  assert.equal(wrong.status, 401);
}
{
  const row = users()[0];
  assert.equal(row.failed_login_attempts, 0);
  assert.equal(row.locked_until, null, "terceiros não trancam a conta compartilhada");
  const stillOk = await login(loginContext("visitante", visitorPw, baseEnv));
  assert.equal(stillOk.status, 200);
}

// ── 4) Middleware deny-by-default ──────────────────────────────────────────
let nextCalls = 0;
const next = async () => {
  nextCalls += 1;
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
};
async function callApi(method: string, path: string, token: string, env: Record<string, unknown> = baseEnv) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "CF-Connecting-IP": "203.0.113.9" };
  if (method !== "GET") headers["Content-Type"] = "application/json";
  return onRequest({
    request: new Request(`https://neuroped.test${path}`, {
      method,
      headers,
      body: method === "GET" ? undefined : "{}",
    }),
    env,
    next,
    data: {},
  } as never);
}

{
  nextCalls = 0;
  assert.equal((await callApi("GET", "/api/auth/me", session.accessToken)).status, 200, "a própria sessão pode ser lida");
  assert.equal(nextCalls, 1);

  const denied: Array<[string, string]> = [
    ["GET", "/api/patients"],
    ["POST", "/api/patients"],
    ["GET", "/api/tenants"],
    ["GET", "/api/me/profile"],
    ["PUT", "/api/me/profile"],
    ["GET", "/api/live/patients"],
    ["POST", "/api/live/documents"],
    ["POST", "/api/auth/change-password"],
    ["POST", "/api/consents"],
    ["POST", "/api/billing/accept"],
    ["GET", "/api/billing/me"],
    ["GET", "/api/audit-log"],
    ["GET", "/api/admin/go-live"],
    ["DELETE", "/api/patients/abc"],
    ["POST", "/api/auth/me"],
    ["GET", "/api/documents"],
  ];
  nextCalls = 0;
  for (const [method, path] of denied) {
    const response = await callApi(method, path, session.accessToken);
    assert.equal(response.status, 403, `${method} ${path} deve ser negado ao visitante`);
    assert.equal(((await response.json()) as { code: string }).code, "VISITOR_RESTRICTED");
  }
  assert.equal(nextCalls, 0, "nenhum handler seguinte pode rodar para o visitante");

  // A allowlist é exata (método + caminho), não prefixo.
  assert.equal(visitorApiAllowed("GET", "/api/auth/me/"), true);
  assert.equal(visitorApiAllowed("GET", "/api/auth/me/extra"), false);
  assert.equal(visitorApiAllowed("POST", "/api/auth/me"), false);
  assert.equal(visitorApiAllowed("GET", "/api/auth"), false);
}

// ── 6a) O papel exposto distingue o visitante do reader de clínica ─────────
{
  const row = (email: string, role: string) =>
    ({ id: "u", name: "N", email, role, is_active: 1, password_hash: null, must_change_password: 0, failed_login_attempts: 0, locked_until: null }) as UserRow;
  assert.equal(publicUser(row("visitante", "reader")).role, "visitor");
  assert.equal(publicUser(row("  Visitante ", "reader")).role, "visitor");
  assert.equal(publicUser(row("leitor@clinica.example", "reader")).role, "reader", "reader de clínica não vira visitante");
  assert.equal(publicUser(row("visitante", "professional")).role, "professional", "outro papel nunca é rebaixado nem promovido por e-mail");
  assert.equal(publicUser(row("visitante", "admin")).role, "admin");
}

// ── 6) Handlers de clínica recusam o papel por construção ──────────────────
assert.equal(
  getContextUser({ data: { authUser: { id: session.user.id, role: "visitor", email: "visitante", name: "V", mustChangePassword: false } } }),
  null,
);

// ── 5a) Refresh funciona enquanto o interruptor está ligado ────────────────
async function callRefresh(refreshToken: string, env: Record<string, unknown>) {
  return refresh({
    env,
    request: new Request("https://neuroped.test/api/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }),
  } as never);
}
{
  const rotated = await callRefresh(session.refreshToken, baseEnv);
  assert.equal(rotated.status, 200, "refresh do visitante funciona com o segredo ligado");
  const tokens = (await rotated.json()) as { accessToken: string; refreshToken: string };
  session.accessToken = tokens.accessToken;
  session.refreshToken = tokens.refreshToken;
}

// ── 5b) Remover o segredo derruba sessão e refresh ─────────────────────────
{
  const off = { ...baseEnv, NEUROPED_VISITOR_PASSWORD: undefined };
  const me = await callApi("GET", "/api/auth/me", session.accessToken, off);
  assert.equal(me.status, 401, "sessão de visitante morre quando o segredo é removido");
  assert.equal(((await me.json()) as { code: string }).code, "INVALID_SESSION");
  const refreshed = await callRefresh(session.refreshToken, off);
  assert.equal(refreshed.status, 401, "refresh também é recusado sem o segredo");
}

// ── 5c) Segundo interruptor: desativar a conta ─────────────────────────────
{
  const fresh = (await (await login(loginContext("visitante", visitorPw, baseEnv))).json()) as typeof session;
  sqlite.prepare("UPDATE users SET is_active = 0 WHERE lower(email) = 'visitante'").run();
  const relogin = await login(loginContext("visitante", visitorPw, baseEnv));
  assert.equal(relogin.status, 401, "conta desativada não loga e não é reativada");
  assert.equal(users()[0].is_active, 0);
  const me = await callApi("GET", "/api/auth/me", fresh.accessToken);
  assert.equal(me.status, 401);
  sqlite.prepare("UPDATE users SET is_active = 1 WHERE lower(email) = 'visitante'").run();
}

// ── 5d) Identidade ocupada por outro papel nunca é sequestrada ─────────────
{
  sqlite.prepare("UPDATE users SET role = 'professional' WHERE lower(email) = 'visitante'").run();
  const blocked = await login(loginContext("visitante", visitorPw, baseEnv));
  assert.equal(blocked.status, 401, "e-mail 'visitante' com outro papel não vira visitante");
  assert.equal(users()[0].role, "professional", "a linha existente não é reescrita");
}

sqlite.close();
console.log(
  "✓ visitor-login: segredo no ambiente (nunca no banco), sem lockout, deny-by-default no middleware, interruptores (segredo e conta) e sem sequestro de identidade",
);
