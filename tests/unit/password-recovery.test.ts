/**
 * password-recovery.test.ts — prova adversarial do fluxo self-service de
 * recuperação de senha (porte do PR #770, migração 0020).
 *
 * Roda contra o SQL REAL das migrações 0003 + 0020 num SQLite em memória com
 * um fake fiel de D1 (prepare/bind/first/run/batch transacional).
 *
 * Invariantes provados:
 *  1. anti-enumeração: e-mail desconhecido, entrega desconfigurada e sucesso
 *     respondem o MESMO corpo 202;
 *  2. o token nunca é persistido em texto claro (somente SHA-256) e o link
 *     aponta para a rota dedicada /#/redefinir-senha;
 *  3. falha de entrega apaga o token recém-criado (nada pendente sem e-mail);
 *  4. política de senha da casa (12–128 + maiúscula/minúscula/número/símbolo)
 *     — o porte literal do #770 (apenas length>=12) FALHARIA aqui;
 *  5. redefinição válida troca a senha, revoga TODAS as sessões refresh,
 *     consome o token e grava auditoria; reuso e token expirado dão 400;
 *  6. rate limit persistente por IP bloqueia a 6ª solicitação na janela.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { onRequestPost as forgotPassword } from "../../functions/api/auth/forgot-password";
import { onRequestPost as resetPassword } from "../../functions/api/auth/reset-password";
import { hashPassword, verifyPassword, sha256Hex } from "../../functions/api/auth/_crypto";

class D1StatementMock {
  constructor(
    private readonly db: Database.Database,
    private readonly sql: string,
    private readonly values: unknown[] = [],
  ) {}

  bind(...values: unknown[]) {
    return new D1StatementMock(this.db, this.sql, values);
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
}

class D1DatabaseMock {
  constructor(private readonly db: Database.Database) {}

  prepare(sql: string) {
    return new D1StatementMock(this.db, sql);
  }

  async batch(statements: D1StatementMock[]) {
    return this.db.transaction(() => statements.map((statement) => {
      const raw = statement as unknown as { db: Database.Database; sql: string; values: unknown[] };
      const result = raw.db.prepare(raw.sql).run(...raw.values);
      return { success: true, meta: { changes: result.changes } };
    }))();
  }
}

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    password_hash TEXT,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until DATETIME,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE saas_audit_log (
    id TEXT PRIMARY KEY,
    clinic_id TEXT,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
// SQL real das migrações sob teste — nada de schema paralelo divergente.
sqlite.exec(readFileSync("db/migrations/0003_refresh_sessions.sql", "utf8"));
sqlite.exec(readFileSync("db/migrations/0020_password_recovery.sql", "utf8"));

const USER_ID = "user-recovery-synthetic";
const USER_EMAIL = "titular@example.test";
const OLD_PASSWORD = "SenhaAntiga#2026!";
const NEW_PASSWORD = "NovaSenhaForte#2026!";

const oldHash = await hashPassword(OLD_PASSWORD);
sqlite.prepare(
  `INSERT INTO users (id, email, name, role, is_active, password_hash) VALUES (?, ?, ?, 'professional', 1, ?)`,
).run(USER_ID, USER_EMAIL, "Titular Sintético", oldHash);
sqlite.prepare(
  `INSERT INTO auth_refresh_sessions (id, user_id, family_id, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)`,
).run("session-1", USER_ID, "family-1", "refresh-hash-1", new Date(Date.now() + 86_400_000).toISOString());

// Segredo sintético de teste (≥32 chars), nunca usado fora deste processo.
const syntheticJwtSecret = "synthetic-password-recovery-secret-0123456789ABCDEF";

const env = {
  DB: new D1DatabaseMock(sqlite) as unknown as D1Database,
  NEUROPED_JWT_SECRET: syntheticJwtSecret,
  AUTH_PUBLIC_APP_URL: "https://app.neuroped.example",
  AUTH_RESEND_API_KEY: "re_synthetic_key",
  AUTH_EMAIL_FROM: "NeuroPed <no-reply@neuroped.example>",
};

interface CapturedEmail {
  to: string[];
  text: string;
}
const sentEmails: CapturedEmail[] = [];
let deliveryShouldFail = false;
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  assert.equal(url, "https://api.resend.com/emails", "nenhuma outra chamada externa é permitida no fluxo");
  if (deliveryShouldFail) return new Response("{}", { status: 500 });
  const payload = JSON.parse(String(init?.body)) as CapturedEmail;
  sentEmails.push(payload);
  return new Response("{}", { status: 200 });
}) as typeof fetch;

function forgotContext(email: unknown, envOverride: Record<string, unknown> = env, ip = "203.0.113.10") {
  return {
    env: envOverride,
    params: {},
    data: {},
    request: new Request("https://app.neuroped.example/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json", "CF-Connecting-IP": ip },
      body: JSON.stringify({ email }),
    }),
  } as never;
}

function resetContext(token: string, password: string) {
  return {
    env,
    params: {},
    data: {},
    request: new Request("https://app.neuroped.example/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    }),
  } as never;
}

function tokenRows() {
  return sqlite.prepare("SELECT * FROM auth_password_reset_tokens").all() as Array<Record<string, unknown>>;
}

// ── 1) Anti-enumeração: e-mail desconhecido ────────────────────────────────
const unknownResponse = await forgotPassword(forgotContext("ninguem@example.test"));
assert.equal(unknownResponse.status, 202);
const unknownBody = await unknownResponse.text();
assert.equal(tokenRows().length, 0, "e-mail desconhecido não pode criar token");
assert.equal(sentEmails.length, 0);

// ── 2) Entrega desconfigurada: 202 idêntico, sem token ─────────────────────
const unconfiguredEnv = { ...env, AUTH_RESEND_API_KEY: undefined };
const unconfiguredResponse = await forgotPassword(forgotContext(USER_EMAIL, unconfiguredEnv));
assert.equal(unconfiguredResponse.status, 202);
assert.equal(await unconfiguredResponse.text(), unknownBody, "corpo deve ser indistinguível");
assert.equal(tokenRows().length, 0, "sem entrega configurada não pode restar token pendente");

// Base URL http:// (não-https) também conta como desconfigurada.
const httpEnv = { ...env, AUTH_PUBLIC_APP_URL: "http://app.neuroped.example" };
const httpResponse = await forgotPassword(forgotContext(USER_EMAIL, httpEnv));
assert.equal(httpResponse.status, 202);
assert.equal(tokenRows().length, 0);

// ── 3) Falha de entrega apaga o token recém-criado ─────────────────────────
deliveryShouldFail = true;
const failedDelivery = await forgotPassword(forgotContext(USER_EMAIL));
assert.equal(failedDelivery.status, 202);
assert.equal(await failedDelivery.text(), unknownBody);
assert.equal(tokenRows().length, 0, "falha de entrega deve remover o token pendente");
deliveryShouldFail = false;

// ── 4) Sucesso: token só como SHA-256, link para /#/redefinir-senha ────────
const successResponse = await forgotPassword(forgotContext(USER_EMAIL));
assert.equal(successResponse.status, 202);
assert.equal(await successResponse.text(), unknownBody, "sucesso deve ser indistinguível de desconhecido");
assert.equal(sentEmails.length, 1);
assert.deepEqual(sentEmails[0].to, [USER_EMAIL]);
const tokenMatch = sentEmails[0].text.match(/#\/redefinir-senha\?token=([0-9a-f]{64})/);
assert.ok(tokenMatch, "o e-mail deve linkar a rota dedicada /#/redefinir-senha com o token");
const plaintextToken = tokenMatch[1];

const [tokenRow] = tokenRows();
assert.equal(tokenRows().length, 1);
assert.equal(tokenRow.user_id, USER_ID);
assert.equal(tokenRow.token_hash, await sha256Hex(plaintextToken));
assert.notEqual(tokenRow.token_hash, plaintextToken, "token em texto claro não pode ser persistido");
assert.ok(!JSON.stringify(tokenRows()).includes(plaintextToken), "nenhuma coluna pode conter o token em claro");
assert.equal(tokenRow.consumed_at, null);
const requestAudit = sqlite.prepare(
  "SELECT clinic_id FROM saas_audit_log WHERE action = 'password_reset_requested' AND actor_user_id = ?",
).all(USER_ID);
assert.equal(requestAudit.length, 1, "solicitação deve ser auditada");

// ── 5) Token errado / expirado ─────────────────────────────────────────────
const wrongToken = "f".repeat(64);
const wrongResponse = await resetPassword(resetContext(wrongToken, NEW_PASSWORD));
assert.equal(wrongResponse.status, 400);
assert.equal((await wrongResponse.json() as { code: string }).code, "RESET_TOKEN_INVALID");

sqlite.prepare(
  `INSERT INTO auth_password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
).run("expired-token", USER_ID, await sha256Hex("e".repeat(64)), new Date(Date.now() - 60_000).toISOString());
const expiredResponse = await resetPassword(resetContext("e".repeat(64), NEW_PASSWORD));
assert.equal(expiredResponse.status, 400, "token expirado deve responder o mesmo 400 genérico");
sqlite.prepare("DELETE FROM auth_password_reset_tokens WHERE id = 'expired-token'").run();

// ── 6) Política de senha da casa (não só length, como no #770 literal) ─────
for (const weak of [
  "curta1!A", // < 12
  "somenteminusculas#2026", // sem maiúscula
  "SOMENTEMAIUSCULAS#2026", // sem minúscula
  "SenhaSemNumero#!", // sem número
  "SenhaSemSimbolo2026", // sem símbolo
]) {
  const weakResponse = await resetPassword(resetContext(plaintextToken, weak));
  assert.equal(weakResponse.status, 400, `senha fraca aceita: ${weak}`);
  assert.equal((await weakResponse.json() as { code: string }).code, "PASSWORD_TOO_WEAK");
}
assert.equal(tokenRows()[0].consumed_at, null, "tentativas fracas não podem consumir o token");

// ── 7) Redefinição válida ──────────────────────────────────────────────────
const resetResponse = await resetPassword(resetContext(plaintextToken, NEW_PASSWORD));
assert.equal(resetResponse.status, 200);

const userRow = sqlite.prepare("SELECT * FROM users WHERE id = ?").get(USER_ID) as Record<string, unknown>;
assert.ok(await verifyPassword(NEW_PASSWORD, String(userRow.password_hash)), "nova senha deve autenticar");
assert.ok(!(await verifyPassword(OLD_PASSWORD, String(userRow.password_hash))), "senha antiga deve morrer");
assert.equal(userRow.must_change_password, 0);
assert.equal(userRow.failed_login_attempts, 0);
assert.equal(userRow.locked_until, null);

const sessions = sqlite.prepare("SELECT COUNT(*) AS n FROM auth_refresh_sessions WHERE user_id = ?").get(USER_ID) as { n: number };
assert.equal(sessions.n, 0, "todas as sessões refresh devem ser revogadas na redefinição");

const consumedRow = tokenRows()[0];
assert.ok(consumedRow.consumed_at, "token deve estar consumido");
assert.ok(consumedRow.consumed_by_request_id, "claim rastreável obrigatório");
const completeAudit = sqlite.prepare(
  "SELECT metadata_json FROM saas_audit_log WHERE action = 'password_reset_completed' AND actor_user_id = ?",
).all(USER_ID);
assert.equal(completeAudit.length, 1, "conclusão deve ser auditada");

// ── 8) Reuso do token: mesmo 400, senha intacta ────────────────────────────
const reuseResponse = await resetPassword(resetContext(plaintextToken, "OutraSenhaForte#2026!"));
assert.equal(reuseResponse.status, 400);
const afterReuse = sqlite.prepare("SELECT password_hash FROM users WHERE id = ?").get(USER_ID) as { password_hash: string };
assert.ok(await verifyPassword(NEW_PASSWORD, afterReuse.password_hash), "reuso não pode alterar a senha");

// ── 9) Rate limit persistente por IP: 6ª solicitação bloqueada ─────────────
const RATE_IP = "198.51.100.77";
for (let attempt = 1; attempt <= 5; attempt++) {
  const allowed = await forgotPassword(forgotContext(USER_EMAIL, env, RATE_IP));
  assert.equal(allowed.status, 202);
}
const emailsBeforeBlock = sentEmails.length;
const tokensBeforeBlock = tokenRows().length;
const blockedResponse = await forgotPassword(forgotContext(USER_EMAIL, env, RATE_IP));
assert.equal(blockedResponse.status, 202, "bloqueio não pode ser distinguível externamente");
assert.equal(await blockedResponse.text(), unknownBody);
assert.equal(sentEmails.length, emailsBeforeBlock, "bloqueado não pode enviar e-mail");
assert.equal(tokenRows().length, tokensBeforeBlock, "bloqueado não pode criar token");
const rateRow = sqlite.prepare(
  "SELECT blocked_until FROM auth_password_reset_rate_limits LIMIT 1",
).get() as { blocked_until: string | null } | undefined;
assert.ok(rateRow?.blocked_until, "o bucket deve registrar blocked_until persistente");

globalThis.fetch = realFetch;
sqlite.close();
console.log("✓ password-recovery: anti-enumeração, hash-only, política da casa, revogação de sessões, uso único e rate limit provados contra o SQL real da 0020");
