/**
 * Regressões do self-service SaaS (rodada de transformação SaaS):
 *
 * 1. Signup público: fechado por padrão (503), abre por env, cria conta
 *    'professional' com sessão revogável; e-mail duplicado/reservado → 409
 *    sem oráculo diferenciado; senha fraca → 400.
 * 2. PATCH /api/tenants/:id: gestor edita nome/timezone/settings; membro
 *    'professional' e usuário de outra clínica recebem 403 (anti-IDOR).
 * 3. GET/PUT /api/me/profile: perfil profissional próprio, nunca de terceiro.
 * 4. Middleware: signup é rota pública; /api/billing/accept tem auth opcional
 *    (sem Authorization segue anônimo) — antes, convidado sem conta era
 *    barrado com 401 antes de o token do convite ser sequer lido.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { onRequestPost as signupPost } from "../../functions/api/auth/signup";
import {
  onRequestGet as profileGet,
  onRequestPut as profilePut,
} from "../../functions/api/me/profile";
import {
  onRequestGet as tenantGet,
  onRequestPatch as tenantPatch,
} from "../../functions/api/tenants/[id]/index";

const SECRET = "unit-test-jwt-secret-with-32-plus-chars!";

function makeDb(raw: DatabaseSync) {
  const prepare = (sql: string) => {
    const make = (args: unknown[]) => ({
      async first<T>() {
        return (
          (raw.prepare(sql).get(...(args as never[])) as T | undefined) ?? null
        );
      },
      async run() {
        const info = raw.prepare(sql).run(...(args as never[]));
        return { meta: { changes: Number(info.changes) } };
      },
      async all<T>() {
        return { results: raw.prepare(sql).all(...(args as never[])) as T[] };
      },
    });
    const statement = { bind: (...args: unknown[]) => make(args), ...make([]) };
    return statement;
  };
  return {
    prepare,
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      raw.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        raw.exec("COMMIT");
        return results;
      } catch (error) {
        raw.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;
}

function freshDb(): DatabaseSync {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON;");
  raw.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until DATETIME,
      last_login_at DATETIME,
      role TEXT NOT NULL DEFAULT 'professional',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE auth_login_rate_limit (
      bucket_hash TEXT PRIMARY KEY,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      blocked_until DATETIME,
      window_started_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    );
    CREATE TABLE clinics (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      name TEXT NOT NULL,
      legal_name TEXT,
      timezone TEXT NOT NULL DEFAULT 'America/Recife',
      status TEXT NOT NULL DEFAULT 'active',
      created_by_user_id TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE clinic_memberships (
      clinic_id TEXT NOT NULL REFERENCES clinics(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      invited_by_user_id TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  // Sessões revogáveis usam exatamente o schema real da migração 0003.
  raw.exec(readFileSync("db/migrations/0003_refresh_sessions.sql", "utf8"));
  // O signup emite a confirmação de posse do e-mail; sem o schema da 0024 a
  // emissão falharia silenciosamente e o teste esconderia essa dependência.
  raw.exec(readFileSync("db/migrations/0024_email_verification.sql", "utf8"));
  return raw;
}

interface FakeContextInput {
  db: D1Database;
  request: Request;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    mustChangePassword: boolean;
  } | null;
  params?: Record<string, string>;
  env?: Record<string, unknown>;
}

function makeContext(input: FakeContextInput) {
  return {
    env: { DB: input.db, NEUROPED_JWT_SECRET: SECRET, ...(input.env ?? {}) },
    request: input.request,
    params: input.params ?? {},
    data: input.user ? { authUser: input.user } : {},
    waitUntil: () => undefined,
    next: async () => new Response(null),
  } as unknown as Parameters<typeof signupPost>[0];
}

function jsonRequest(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const STRONG_PASSWORD = "Senha-Fort3-Unica!";

// ── 1. Signup ───────────────────────────────────────────────────────────────
{
  const raw = freshDb();
  const db = makeDb(raw);

  // Fechado por padrão.
  const closed = await signupPost(
    makeContext({
      db,
      request: jsonRequest("https://x.test/api/auth/signup", "POST", {
        name: "Nova Médica",
        email: "nova@example.com",
        password: STRONG_PASSWORD,
      }),
      env: {},
    }),
  );
  assert.equal(
    closed.status,
    503,
    "signup deve nascer fechado (decisão de negócio do operador)",
  );
  assert.equal(
    ((await closed.json()) as { code: string }).code,
    "SIGNUP_DISABLED",
  );

  // Entrega de e-mail configurada: sem ela o signup recusa antes de validar,
  // porque uma conta que não consegue confirmar o endereço nunca cria clínica.
  const enabledEnv = {
    SAAS_SIGNUP_ENABLED: "true",
    ADMIN_EMAIL: "dono@plataforma.dev",
    AUTH_PUBLIC_APP_URL: "https://app.neuroped.example",
    AUTH_RESEND_API_KEY: "re_synthetic_key",
    AUTH_EMAIL_FROM: "NeuroPed <no-reply@neuroped.example>",
  };

  // Senha fraca.
  const weak = await signupPost(
    makeContext({
      db,
      request: jsonRequest("https://x.test/api/auth/signup", "POST", {
        name: "Nova Médica",
        email: "nova@example.com",
        password: "curta1!",
      }),
      env: enabledEnv,
    }),
  );
  assert.equal(weak.status, 400);

  // Sucesso: conta professional + sessão emitida.
  const ok = await signupPost(
    makeContext({
      db,
      request: jsonRequest("https://x.test/api/auth/signup", "POST", {
        name: "Nova Médica",
        email: "Nova@Example.com ",
        password: STRONG_PASSWORD,
      }),
      env: enabledEnv,
    }),
  );
  assert.equal(ok.status, 201, "signup habilitado deve criar a conta");
  const created = (await ok.json()) as {
    accessToken: string;
    refreshToken: string;
    user: { role: string; email: string };
  };
  assert.ok(
    created.accessToken && created.refreshToken,
    "signup emite sessão revogável",
  );
  assert.equal(created.user.role, "professional");
  assert.equal(created.user.email, "nova@example.com", "e-mail normalizado");
  const row = raw
    .prepare(
      "SELECT role, is_active, password_hash FROM users WHERE email='nova@example.com'",
    )
    .get() as {
    role: string;
    is_active: number;
    password_hash: string;
  };
  assert.equal(row.role, "professional");
  assert.equal(row.is_active, 1);
  assert.ok(
    row.password_hash && !row.password_hash.includes(STRONG_PASSWORD),
    "senha nunca em texto claro",
  );

  // Duplicado e e-mail reservado: mesma resposta 409.
  for (const email of ["nova@example.com", "dono@plataforma.dev"]) {
    const dup = await signupPost(
      makeContext({
        db,
        request: jsonRequest("https://x.test/api/auth/signup", "POST", {
          name: "Outra Pessoa",
          email,
          password: STRONG_PASSWORD,
        }),
        env: enabledEnv,
      }),
    );
    assert.equal(
      dup.status,
      409,
      `cadastro repetido/reservado (${email}) responde 409`,
    );
    assert.equal(((await dup.json()) as { code: string }).code, "EMAIL_IN_USE");
  }
  assert.equal(
    (raw.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n,
    1,
    "tentativas rejeitadas não criam contas",
  );
}

// ── 2. Tenant settings: gestão, RBAC e anti-IDOR ────────────────────────────
{
  const raw = freshDb();
  const db = makeDb(raw);
  raw.exec(`
    INSERT INTO users(id, name, email, role) VALUES
      ('u-owner', 'Dona A', 'a@x.dev', 'professional'),
      ('u-prof', 'Prof A', 'p@x.dev', 'professional'),
      ('u-other', 'Dona B', 'b@x.dev', 'professional');
    INSERT INTO clinics(id, slug, name) VALUES
      ('clin-a', 'clin-a', 'Clínica A'),
      ('clin-b', 'clin-b', 'Clínica B');
    INSERT INTO clinic_memberships(clinic_id, user_id, role) VALUES
      ('clin-a', 'u-owner', 'owner'),
      ('clin-a', 'u-prof', 'professional'),
      ('clin-b', 'u-other', 'owner');
  `);
  const owner = {
    id: "u-owner",
    email: "a@x.dev",
    name: "Dona A",
    role: "professional",
    mustChangePassword: false,
  };
  const prof = {
    id: "u-prof",
    email: "p@x.dev",
    name: "Prof A",
    role: "professional",
    mustChangePassword: false,
  };
  const other = {
    id: "u-other",
    email: "b@x.dev",
    name: "Dona B",
    role: "professional",
    mustChangePassword: false,
  };

  const patchBody = {
    name: "Clínica A Renomeada",
    timezone: "America/Sao_Paulo",
    settings: {
      displayName: "Clínica A",
      addressLine1: "Rua Um, 10",
      phone: "(11) 90000-0000",
    },
  };

  // Usuária da clínica B não altera a clínica A (anti-IDOR).
  const cross = await tenantPatch(
    makeContext({
      db,
      request: jsonRequest(
        "https://x.test/api/tenants/clin-a",
        "PATCH",
        patchBody,
      ),
      user: other,
      params: { id: "clin-a" },
    }) as never,
  );
  assert.equal(
    cross.status,
    403,
    "membro de outra clínica não pode alterar o tenant",
  );

  // Professional (não gestor) também não.
  const nonManager = await tenantPatch(
    makeContext({
      db,
      request: jsonRequest(
        "https://x.test/api/tenants/clin-a",
        "PATCH",
        patchBody,
      ),
      user: prof,
      params: { id: "clin-a" },
    }) as never,
  );
  assert.equal(
    nonManager.status,
    403,
    "professional sem gestão não altera settings",
  );

  // Owner altera; settings persistem; auditoria registrada.
  const okPatch = await tenantPatch(
    makeContext({
      db,
      request: jsonRequest(
        "https://x.test/api/tenants/clin-a",
        "PATCH",
        patchBody,
      ),
      user: owner,
      params: { id: "clin-a" },
    }) as never,
  );
  assert.equal(okPatch.status, 200);
  const patched = (await okPatch.json()) as {
    name: string;
    timezone: string;
    settings: { displayName: string };
  };
  assert.equal(patched.name, "Clínica A Renomeada");
  assert.equal(patched.timezone, "America/Sao_Paulo");
  assert.equal(patched.settings.displayName, "Clínica A");
  assert.ok(
    raw
      .prepare(
        "SELECT 1 FROM saas_audit_log WHERE clinic_id='clin-a' AND action='clinic_update'",
      )
      .get(),
    "alteração de tenant é auditada",
  );

  // GET por membro comum funciona; por não-membro, 403.
  const okGet = await tenantGet(
    makeContext({
      db,
      request: new Request("https://x.test/api/tenants/clin-a"),
      user: prof,
      params: { id: "clin-a" },
    }) as never,
  );
  assert.equal(okGet.status, 200);
  const crossGet = await tenantGet(
    makeContext({
      db,
      request: new Request("https://x.test/api/tenants/clin-a"),
      user: other,
      params: { id: "clin-a" },
    }) as never,
  );
  assert.equal(
    crossGet.status,
    403,
    "não-membro não lê nem os settings do tenant",
  );
}

// ── 3. Perfil profissional próprio ──────────────────────────────────────────
{
  const raw = freshDb();
  const db = makeDb(raw);
  raw.exec(
    `INSERT INTO users(id, name, email, role) VALUES ('u-1', 'Ana', 'ana@x.dev', 'professional');`,
  );
  const ana = {
    id: "u-1",
    email: "ana@x.dev",
    name: "Ana",
    role: "professional",
    mustChangePassword: false,
  };

  const empty = await profileGet(
    makeContext({
      db,
      request: new Request("https://x.test/api/me/profile"),
      user: ana,
    }) as never,
  );
  assert.equal(empty.status, 200);
  const emptyBody = (await empty.json()) as {
    configured: boolean;
    fallbackDisplayName: string;
  };
  assert.equal(
    emptyBody.configured,
    false,
    "perfil não configurado é declarado, nunca inventado",
  );
  assert.equal(emptyBody.fallbackDisplayName, "Ana");

  const put = await profilePut(
    makeContext({
      db,
      request: jsonRequest("https://x.test/api/me/profile", "PUT", {
        displayName: "Dra. Ana Souza",
        credentialsLine: "CRM-SP 12345 · RQE 6789",
        specialty: "Neuropediatria",
        documentEmail: "contato@clinicaana.com.br",
      }),
      user: ana,
    }) as never,
  );
  assert.equal(put.status, 200);
  const saved = (await put.json()) as {
    configured: boolean;
    displayName: string;
  };
  assert.equal(saved.configured, true);
  assert.equal(saved.displayName, "Dra. Ana Souza");
  const persisted = raw
    .prepare("SELECT display_name FROM user_profiles WHERE user_id='u-1'")
    .get() as { display_name: string };
  assert.equal(persisted.display_name, "Dra. Ana Souza");
}

// ── 4. Middleware: rotas públicas e auth opcional ───────────────────────────
{
  const middleware = readFileSync("functions/api/_middleware.ts", "utf8");
  assert.match(
    middleware,
    /"\/api\/auth\/signup",/,
    "signup precisa ser rota pública",
  );
  assert.match(
    middleware,
    /OPTIONAL_AUTH_API_PATHS = new Set\(\[\s*"\/api\/billing\/accept",/,
    "aceite de convite exige auth opcional: anônimo entra com o token do convite",
  );
  assert.match(
    middleware,
    /OPTIONAL_AUTH_API_PATHS\.has\(path\) && !request\.headers\.get\("Authorization"\)/,
    "sem Authorization o aceite segue anônimo; com header, validação integral",
  );
  const signupSource = readFileSync("functions/api/auth/signup.ts", "utf8");
  assert.match(
    signupSource,
    /SAAS_SIGNUP_ENABLED !== "true"/,
    "signup permanece fechado por padrão",
  );
  assert.match(
    signupSource,
    /registerLoginAbuseFailure/,
    "tentativas contra e-mails existentes contam no teto de abuso",
  );
}

console.log(
  "✓ self-service SaaS: signup fechado-por-padrão, settings por tenant com RBAC/anti-IDOR, perfil próprio e aceite de convite alcançável",
);
