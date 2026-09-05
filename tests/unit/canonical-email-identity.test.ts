/**
 * canonical-email-identity.test.ts — prova adversarial da identidade canônica
 * de e-mail (migração 0022).
 *
 * Roda contra o SQL REAL: o schema de `users` como está em produção (UNIQUE
 * binário) e o arquivo real db/migrations/0022_canonical_email_identity.sql.
 * Usa o `getUserByEmail` REAL de functions/api/auth/_shared.
 *
 * Invariantes provados:
 *  1. o bug existe de verdade: sem a 0022 o banco aceita duas linhas que só
 *     diferem na caixa — duas identidades para o mesmo humano;
 *  2. a consulta de preflight enxerga essa colisão;
 *  3. a 0022 falha FECHADA sobre um banco colidido — não funde, não escolhe,
 *     não descarta nenhuma conta;
 *  4. sobre um banco sadio a 0022 canonicaliza e passa a rejeitar, no próprio
 *     banco, qualquer nova identidade equivalente;
 *  5. login enxerga a linha herdada em caixa mista (antes era invisível para
 *     ele e visível para a redefinição de senha — a divergência do relato);
 *  6. com duas linhas equivalentes, o login falha FECHADO em vez de sortear;
 *  7. o signup não consegue criar uma segunda conta para a mesma identidade.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import {
  canonicalEmail,
  getUserByEmail,
} from "../../functions/api/auth/_shared";

const MIGRATION_0022 = readFileSync(
  new URL(
    "../../db/migrations/0022_canonical_email_identity.sql",
    import.meta.url,
  ),
  "utf8",
);

// Consulta de preflight — a mesma que o workflow roda contra o D1 remoto antes
// de aplicar a migração. Se ela mudar aqui, precisa mudar lá.
const PREFLIGHT = `
  SELECT lower(trim(email)) AS canonico, COUNT(*) AS linhas
    FROM users WHERE email IS NOT NULL
   GROUP BY canonico HAVING COUNT(*) > 1`;

// Schema real de users em produção: UNIQUE binário, sem índice canônico.
const USERS_SCHEMA = `
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
  CREATE INDEX idx_users_email ON users(email);`;

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
}

function novoBanco(): Database.Database {
  const sqlite = new Database(":memory:");
  sqlite.exec(USERS_SCHEMA);
  return sqlite;
}

function inserirUsuario(sqlite: Database.Database, id: string, email: string) {
  sqlite
    .prepare(
      `INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`,
    )
    .run(id, `Usuário ${id}`, email);
}

function asD1(sqlite: Database.Database) {
  return new D1DatabaseMock(sqlite) as unknown as D1Database;
}

// ── 1) O bug é real: o banco de produção aceita a identidade duplicada ──────
{
  const sqlite = novoBanco();
  inserirUsuario(sqlite, "u1", "Medico@Dominio.com");
  assert.doesNotThrow(
    () => inserirUsuario(sqlite, "u2", "medico@dominio.com"),
    "premissa do teste falhou: o UNIQUE binário deveria aceitar as duas caixas",
  );
  assert.equal(
    sqlite.prepare(`SELECT COUNT(*) AS n FROM users`).get<{ n: number }>()!.n,
    2,
  );
}

// ── 2) O preflight enxerga a colisão ───────────────────────────────────────
{
  const sqlite = novoBanco();
  inserirUsuario(sqlite, "u1", "Medico@Dominio.com");
  inserirUsuario(sqlite, "u2", "medico@dominio.com");
  const colisoes = sqlite.prepare(PREFLIGHT).all() as Array<{
    canonico: string;
    linhas: number;
  }>;
  assert.equal(colisoes.length, 1);
  assert.equal(colisoes[0].canonico, "medico@dominio.com");
  assert.equal(colisoes[0].linhas, 2);
}

// ── 3) A 0022 falha FECHADA sobre banco colidido, sem fundir contas ────────
{
  const sqlite = novoBanco();
  inserirUsuario(sqlite, "u1", "Medico@Dominio.com");
  inserirUsuario(sqlite, "u2", "medico@dominio.com");
  assert.throws(
    () => sqlite.exec(MIGRATION_0022),
    "a 0022 aplicou sobre um banco colidido — deveria falhar fechada",
  );
  // Nenhuma conta foi fundida, escolhida ou descartada.
  assert.equal(
    sqlite.prepare(`SELECT COUNT(*) AS n FROM users`).get<{ n: number }>()!.n,
    2,
  );
  const emails = (
    sqlite.prepare(`SELECT email FROM users ORDER BY id`).all() as Array<{
      email: string;
    }>
  ).map((row) => row.email);
  assert.deepEqual(emails, ["Medico@Dominio.com", "medico@dominio.com"]);
}

// ── 4) Sobre banco sadio: canonicaliza e passa a impedir no próprio banco ──
{
  const sqlite = novoBanco();
  inserirUsuario(sqlite, "u1", "  Medico@Dominio.com  ");
  inserirUsuario(sqlite, "u2", "outro@dominio.com");
  assert.equal(
    sqlite.prepare(PREFLIGHT).all().length,
    0,
    "preflight deveria estar limpo",
  );

  sqlite.exec(MIGRATION_0022);

  assert.equal(
    sqlite
      .prepare(`SELECT email FROM users WHERE id = 'u1'`)
      .get<{ email: string }>()!.email,
    "medico@dominio.com",
    "a 0022 deveria ter canonicalizado a linha em caixa mista",
  );
  // Agora o banco garante o invariante que a aplicação assume.
  assert.throws(
    () => inserirUsuario(sqlite, "u3", "MEDICO@DOMINIO.COM"),
    "o índice canônico deveria rejeitar a identidade equivalente",
  );
  // Idempotência: reaplicar não quebra nem altera nada.
  assert.doesNotThrow(() => sqlite.exec(MIGRATION_0022));
  assert.equal(
    sqlite.prepare(`SELECT COUNT(*) AS n FROM users`).get<{ n: number }>()!.n,
    2,
  );
}

// ── 5) Login enxerga a linha herdada em caixa mista ────────────────────────
{
  const sqlite = novoBanco();
  inserirUsuario(sqlite, "u1", "Medico@Dominio.com");
  const user = await getUserByEmail(asD1(sqlite), "medico@dominio.com");
  assert.ok(
    user,
    "getUserByEmail não encontrou a linha em caixa mista — a divergência do relato",
  );
  assert.equal(user.id, "u1");

  // E continua encontrando quando quem digita é que varia a caixa.
  const mesmo = await getUserByEmail(asD1(sqlite), "  MEDICO@DOMINIO.COM  ");
  assert.equal(mesmo?.id, "u1");
}

// ── 6) Duas linhas equivalentes: login falha FECHADO em vez de sortear ─────
{
  const sqlite = novoBanco();
  inserirUsuario(sqlite, "u1", "Medico@Dominio.com");
  inserirUsuario(sqlite, "u2", "medico@dominio.com");
  const erros: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => erros.push(args);
  try {
    const user = await getUserByEmail(asD1(sqlite), "medico@dominio.com");
    assert.equal(
      user,
      null,
      "identidade ambígua deveria recusar autenticação, não sortear a conta",
    );
  } finally {
    console.error = original;
  }
  assert.equal(erros.length, 1, "a ambiguidade precisa ser observável no log");
  assert.doesNotMatch(
    JSON.stringify(erros),
    /medico@dominio\.com/i,
    "o log de ambiguidade não pode carregar o e-mail (PII)",
  );
}

// ── 7) O signup não cria segunda conta para a mesma identidade ─────────────
{
  const sqlite = novoBanco();
  inserirUsuario(sqlite, "u1", "Medico@Dominio.com");
  // Mesma cláusula de existência usada por functions/api/auth/signup.ts.
  const inserted = sqlite
    .prepare(
      `INSERT INTO users (id, name, email, role, is_active, created_at, updated_at)
       SELECT ?, ?, ?, 'professional', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = ?)`,
    )
    .run("u2", "Impostor", "medico@dominio.com", "medico@dominio.com");
  assert.equal(
    inserted.changes,
    0,
    "signup criou uma segunda conta para a mesma identidade",
  );
  assert.equal(
    sqlite.prepare(`SELECT COUNT(*) AS n FROM users`).get<{ n: number }>()!.n,
    1,
  );
}

// ── 8) A canonicalização da aplicação bate com a do banco ──────────────────
{
  for (const bruto of [
    "  Medico@Dominio.com ",
    "MEDICO@DOMINIO.COM",
    "medico@dominio.com",
  ]) {
    assert.equal(canonicalEmail(bruto), "medico@dominio.com");
  }
  assert.equal(canonicalEmail(null), "");
  assert.equal(canonicalEmail(undefined), "");
}

console.log(
  "✓ canonical-email-identity: colisão reproduzida, preflight eficaz, 0022 fail-closed sobre banco colidido, índice canônico ativo, login sem ponto cego e sem sorteio, signup sem identidade duplicada",
);
