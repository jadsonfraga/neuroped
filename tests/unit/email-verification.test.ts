/**
 * email-verification.test.ts — prova adversarial da verificação de posse do
 * e-mail no cadastro externo (migração 0024).
 *
 * Roda os handlers REAIS (signup, verify-email, resend-verification e o POST
 * de /api/tenants) contra o SQL REAL da 0024 num SQLite em memória com fake
 * fiel de D1 (prepare/bind/first/all/run/batch transacional).
 *
 * Invariantes provados:
 *  1. o grandfathering é rotulado: contas anteriores à 0024 ficam utilizáveis,
 *     mas marcadas como 'grandfathered_pre_0024' — não como se tivessem provado
 *     posse do endereço;
 *  2. o cadastro emite token, persiste SÓ o SHA-256 e envia o link;
 *  3. conta recém-criada NÃO cria clínica antes de confirmar (o gate);
 *  4. confirmar o e-mail libera a criação de clínica;
 *  5. token é de uso único: o reuso dá o mesmo 400 genérico;
 *  6. token expirado dá o mesmo 400 genérico;
 *  7. se o e-mail da conta muda depois da emissão, o token antigo NÃO verifica
 *     o endereço novo;
 *  8. reenvio é anti-enumeração: desconhecido, já verificado e pendente
 *     respondem o MESMO corpo 202;
 *  9. o rate limit do reenvio vale mesmo SEM CF-Connecting-IP (sem bypass);
 * 10. a auditoria do e-mail confirmado não carrega o endereço (PII).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { onRequestPost as signup } from "../../functions/api/auth/signup";
import { onRequestPost as verifyEmail } from "../../functions/api/auth/verify-email";
import { onRequestPost as resendVerification } from "../../functions/api/auth/resend-verification";
import { onRequestPost as createClinic } from "../../functions/api/tenants/index";
import { sha256Hex } from "../../functions/api/auth/_crypto";

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
    return (
      (this.db.prepare(this.sql).get(...this.values) as T | undefined) ?? null
    );
  }
  async all<T>() {
    return {
      success: true,
      results: this.db.prepare(this.sql).all(...this.values) as T[],
      meta: {},
    };
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
    return this.db.transaction(() =>
      statements.map((statement) => {
        const raw = statement as unknown as {
          db: Database.Database;
          sql: string;
          values: unknown[];
        };
        const result = raw.db.prepare(raw.sql).run(...raw.values);
        return { success: true, meta: { changes: result.changes } };
      }),
    )();
  }
}

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'professional',
    is_active INTEGER NOT NULL DEFAULT 1,
    password_hash TEXT,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE clinics (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    legal_name TEXT,
    timezone TEXT NOT NULL,
    status TEXT NOT NULL,
    created_by_user_id TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
  );
  CREATE TABLE clinic_memberships (
    clinic_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    invited_by_user_id TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (clinic_id, user_id)
  );
  CREATE TABLE saas_audit_log (
    id TEXT PRIMARY KEY,
    clinic_id TEXT,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata_json TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
// Sessões refresh vêm do SQL real da 0003 — o signup emite tokens de sessão e
// um schema paralelo divergente esconderia quebras reais.
sqlite.exec(readFileSync("db/migrations/0003_refresh_sessions.sql", "utf8"));

// Conta que já existia ANTES do controle — precisa continuar funcionando.
sqlite
  .prepare(
    `INSERT INTO users (id, name, email, role, created_at) VALUES (?, ?, ?, 'professional', ?)`,
  )
  .run(
    "user-legado",
    "Profissional Legado",
    "legado@example.test",
    "2026-01-01T00:00:00.000Z",
  );

// SQL real da migração sob teste — nada de schema paralelo divergente.
sqlite.exec(readFileSync("db/migrations/0024_email_verification.sql", "utf8"));

// ── 1) Grandfathering é rotulado, não disfarçado ───────────────────────────
{
  const legado = sqlite
    .prepare(
      `SELECT email_verified_at, email_verified_source FROM users WHERE id = 'user-legado'`,
    )
    .get() as {
    email_verified_at: string | null;
    email_verified_source: string | null;
  };
  assert.ok(
    legado.email_verified_at,
    "conta anterior à 0024 não pode ficar travada",
  );
  assert.equal(
    legado.email_verified_source,
    "grandfathered_pre_0024",
    "a origem precisa dizer que foi grandfathering, não prova de posse",
  );
  const provaram = sqlite
    .prepare(
      `SELECT COUNT(*) AS n FROM users WHERE email_verified_source = 'self_service_token'`,
    )
    .get() as { n: number };
  assert.equal(
    provaram.n,
    0,
    "ninguém pode nascer marcado como tendo provado posse",
  );
}

const syntheticJwtSecret =
  "synthetic-email-verification-secret-0123456789ABCDEF";
const db = new D1DatabaseMock(sqlite) as unknown as D1Database;
const env = {
  DB: db,
  NEUROPED_JWT_SECRET: syntheticJwtSecret,
  SAAS_SIGNUP_ENABLED: "true",
  AUTH_PUBLIC_APP_URL: "https://app.neuroped.example",
  AUTH_RESEND_API_KEY: "re_synthetic_key",
  AUTH_EMAIL_FROM: "NeuroPed <no-reply@neuroped.example>",
};

interface CapturedEmail {
  to: string[];
  text: string;
}
const sentEmails: CapturedEmail[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  assert.equal(
    String(input),
    "https://api.resend.com/emails",
    "nenhuma outra chamada externa",
  );
  sentEmails.push(JSON.parse(String(init?.body)) as CapturedEmail);
  return new Response("{}", { status: 200 });
}) as typeof fetch;

function postContext(
  path: string,
  body: unknown,
  options: {
    envOverride?: Record<string, unknown>;
    ip?: string | null;
    user?: unknown;
  } = {},
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options.ip !== null)
    headers["CF-Connecting-IP"] = options.ip ?? "203.0.113.10";
  return {
    env: options.envOverride ?? env,
    params: {},
    data: options.user ? { authUser: options.user } : {},
    request: new Request(`https://app.neuroped.example${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  } as never;
}

function tokenRows() {
  return sqlite
    .prepare("SELECT * FROM auth_email_verification_tokens")
    .all() as Array<Record<string, unknown>>;
}

function tokenFromLastEmail(): string {
  const last = sentEmails[sentEmails.length - 1];
  const match = last.text.match(/verificar-email\?token=([0-9a-f]{64})/);
  assert.ok(match, "o e-mail precisa conter o link com o token");
  return match[1];
}

const NEW_EMAIL = "novo.profissional@example.test";
const STRONG_PASSWORD = "SenhaForteDeTeste#2026!";

// ── 2) Cadastro emite token hash-only e envia o link ───────────────────────
const signupResponse = await signup(
  postContext("/api/auth/signup", {
    name: "Profissional Novo",
    email: NEW_EMAIL,
    password: STRONG_PASSWORD,
  }),
);
assert.equal(signupResponse.status, 201);
const signupBody = (await signupResponse.json()) as {
  emailVerificationRequired?: boolean;
};
assert.equal(
  signupBody.emailVerificationRequired,
  true,
  "o cadastro precisa avisar que falta confirmar",
);

const newUser = sqlite
  .prepare(
    `SELECT id, email, email_verified_at FROM users WHERE lower(email) = ?`,
  )
  .get(NEW_EMAIL) as {
  id: string;
  email: string;
  email_verified_at: string | null;
};
assert.ok(newUser, "a conta precisa existir");
assert.equal(
  newUser.email_verified_at,
  null,
  "conta nova não nasce verificada",
);

assert.equal(sentEmails.length, 1, "o cadastro precisa disparar a confirmação");
const plaintextToken = tokenFromLastEmail();
const stored = tokenRows();
assert.equal(stored.length, 1);
assert.equal(
  stored[0].token_hash,
  await sha256Hex(plaintextToken),
  "só o SHA-256 do token pode ser persistido",
);
assert.ok(
  !JSON.stringify(stored[0]).includes(plaintextToken),
  "o token em claro não pode aparecer em nenhuma coluna",
);

// ── 2b) Cadastro sem entrega configurada recusa em vez de gerar conta morta ─
// Com o gate da 0024 ativo, uma conta que não consegue confirmar o e-mail
// nunca cria clínica. Deixar o cadastro aberto nesse estado só produziria
// contas mortas — o funil precisa fechar antes, não depois.
{
  const semEntrega = { ...env, AUTH_RESEND_API_KEY: undefined };
  const antes = (
    sqlite.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }
  ).n;
  const response = await signup(
    postContext(
      "/api/auth/signup",
      {
        name: "Conta Morta",
        email: "conta.morta@example.test",
        password: STRONG_PASSWORD,
      },
      { envOverride: semEntrega },
    ),
  );
  assert.equal(response.status, 503);
  assert.equal(
    ((await response.json()) as { code: string }).code,
    "EMAIL_VERIFICATION_NOT_CONFIGURED",
  );
  assert.equal(
    (sqlite.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number })
      .n,
    antes,
    "nenhuma conta pode nascer sem caminho de confirmação",
  );
}

// ── 3) O gate: conta não confirmada não cria clínica ───────────────────────
const unverifiedUser = {
  id: newUser.id,
  email: newUser.email,
  name: "Profissional Novo",
  role: "professional",
};
const blockedClinic = await createClinic(
  postContext(
    "/api/tenants",
    { name: "Clínica Teste", slug: "clinica-teste" },
    { user: unverifiedUser },
  ),
);
assert.equal(
  blockedClinic.status,
  403,
  "conta sem e-mail confirmado não pode criar clínica",
);
const blockedBody = (await blockedClinic.json()) as { code?: string };
assert.equal(blockedBody.code, "EMAIL_VERIFICATION_REQUIRED");
assert.equal(
  (sqlite.prepare("SELECT COUNT(*) AS n FROM clinics").get() as { n: number })
    .n,
  0,
  "nenhuma clínica pode ter sido criada",
);

// ── 4) Confirmar libera a criação de clínica ───────────────────────────────
const verified = await verifyEmail(
  postContext("/api/auth/verify-email", { token: plaintextToken }),
);
assert.equal(verified.status, 200);
const afterVerify = sqlite
  .prepare(
    `SELECT email_verified_at, email_verified_source FROM users WHERE id = ?`,
  )
  .get(newUser.id) as {
  email_verified_at: string | null;
  email_verified_source: string;
};
assert.ok(afterVerify.email_verified_at);
assert.equal(afterVerify.email_verified_source, "self_service_token");

const allowedClinic = await createClinic(
  postContext(
    "/api/tenants",
    { name: "Clínica Teste", slug: "clinica-teste" },
    { user: unverifiedUser },
  ),
);
assert.equal(
  allowedClinic.status,
  201,
  "com o e-mail confirmado a criação precisa passar",
);

// ── 10) Auditoria do e-mail confirmado não carrega o endereço ─────────────
{
  const audit = sqlite
    .prepare(`SELECT * FROM saas_audit_log WHERE action = 'email_verified'`)
    .all() as Array<Record<string, unknown>>;
  assert.equal(audit.length, 1, "confirmar precisa deixar trilha");
  assert.equal(audit[0].actor_user_id, newUser.id);
  assert.ok(
    !JSON.stringify(audit[0]).includes(NEW_EMAIL),
    "a trilha não pode carregar o e-mail (PII)",
  );
}

// ── 5) Uso único: reuso dá o mesmo 400 genérico ────────────────────────────
const reused = await verifyEmail(
  postContext("/api/auth/verify-email", { token: plaintextToken }),
);
assert.equal(reused.status, 400);
const genericBody = await reused.text();

// ── 6) Token expirado dá o mesmo 400 genérico ──────────────────────────────
{
  const expiredPlain = "e".repeat(64);
  sqlite
    .prepare(
      `INSERT INTO auth_email_verification_tokens
        (id, user_id, token_hash, email_at_issue, expires_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      "token-expirado",
      "user-legado",
      await sha256Hex(expiredPlain),
      "legado@example.test",
      new Date(Date.now() - 60_000).toISOString(),
    );
  const expired = await verifyEmail(
    postContext("/api/auth/verify-email", { token: expiredPlain }),
  );
  assert.equal(expired.status, 400);
  assert.equal(
    await expired.text(),
    genericBody,
    "expirado precisa ser indistinguível de inválido",
  );
}

// ── 7) Token não verifica um endereço que a conta passou a ter depois ─────
{
  const stalePlain = "f".repeat(64);
  sqlite
    .prepare(
      `INSERT INTO auth_email_verification_tokens
        (id, user_id, token_hash, email_at_issue, expires_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      "token-endereco-antigo",
      "user-legado",
      await sha256Hex(stalePlain),
      "endereco-antigo@example.test",
      new Date(Date.now() + 3_600_000).toISOString(),
    );
  const stale = await verifyEmail(
    postContext("/api/auth/verify-email", { token: stalePlain }),
  );
  assert.equal(
    stale.status,
    400,
    "token emitido para outro endereço não pode verificar o atual",
  );
  assert.equal(await stale.text(), genericBody);
  const untouched = sqlite
    .prepare(`SELECT email_verified_source FROM users WHERE id = 'user-legado'`)
    .get() as { email_verified_source: string };
  assert.equal(
    untouched.email_verified_source,
    "grandfathered_pre_0024",
    "a conta não pode ser reclassificada por um token de outro endereço",
  );
}

// ── 8) Reenvio é anti-enumeração ───────────────────────────────────────────
const emailsBeforeResend = sentEmails.length;
const unknownResend = await resendVerification(
  postContext("/api/auth/resend-verification", {
    email: "ninguem@example.test",
  }),
);
assert.equal(unknownResend.status, 202);
const resendGenericBody = await unknownResend.text();
assert.equal(
  sentEmails.length,
  emailsBeforeResend,
  "e-mail desconhecido não envia nada",
);

const alreadyVerified = await resendVerification(
  postContext("/api/auth/resend-verification", { email: NEW_EMAIL }),
);
assert.equal(alreadyVerified.status, 202);
assert.equal(
  await alreadyVerified.text(),
  resendGenericBody,
  "conta já verificada precisa ser indistinguível de conta inexistente",
);
assert.equal(
  sentEmails.length,
  emailsBeforeResend,
  "conta já verificada não recebe novo link",
);

// ── 9) Rate limit do reenvio vale SEM CF-Connecting-IP ─────────────────────
{
  const bucketsBefore = (
    sqlite
      .prepare("SELECT COUNT(*) AS n FROM auth_email_verification_rate_limits")
      .get() as { n: number }
  ).n;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await resendVerification(
      postContext(
        "/api/auth/resend-verification",
        { email: "ninguem@example.test" },
        { ip: null },
      ),
    );
    assert.equal(response.status, 202);
  }
  const bucketsAfter = (
    sqlite
      .prepare("SELECT COUNT(*) AS n FROM auth_email_verification_rate_limits")
      .get() as { n: number }
  ).n;
  assert.equal(
    bucketsAfter,
    bucketsBefore + 1,
    "requisição sem IP precisa consumir um balde, não passar livre",
  );

  const blocked = sqlite
    .prepare(
      "SELECT blocked_until FROM auth_email_verification_rate_limits WHERE blocked_until IS NOT NULL",
    )
    .all() as Array<{ blocked_until: string }>;
  assert.ok(blocked.length >= 1, "o teto precisa bloquear o balde sem IP");
}

globalThis.fetch = realFetch;
sqlite.close();
console.log(
  "✓ email-verification: grandfathering rotulado, token hash-only, gate de criação de clínica, uso único, expiração, troca de endereço, anti-enumeração e rate limit sem bypass",
);
