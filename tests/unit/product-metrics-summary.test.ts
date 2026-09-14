/**
 * product-metrics-summary.test.ts
 *
 * Os primitivos de DAU/WAU/MAU/ativação/retenção já existem espalhados no
 * schema (`users.last_login_at`, `created_at`, `email_verified_at`,
 * `clinics.created_at`, `clinic_memberships`) — nada os agregava. Este teste
 * prova o agregador contra o schema REAL (db/schema.d1.sql + todas as
 * migrações, `foreign_keys` ligado), com timestamps sintéticos controlados
 * relativos ao "agora" real do processo (o módulo usa `julianday('now')`).
 *
 * Nenhum dado real: nomes e e-mails aqui são só rótulos de teste (`user-d1`,
 * `d1@example.test`), nunca de pessoa alguma.
 *
 * Invariantes provados:
 *  1. DAU/WAU/MAU contam login recente por janela, com fronteira correta
 *     (dentro da janela conta, fora não conta);
 *  2. `admin` e `reader` (sentinela E2E) NUNCA entram em conta-cliente,
 *     mesmo com login recentíssimo — testado nos três agregados que os
 *     excluem;
 *  3. novas contas/clínicas contam por `created_at`, mesma fronteira;
 *  4. funil de ativação: assinou → verificou e-mail → possui clínica, com
 *     contagens exatas e independentes entre si;
 *  5. proxy de retenção: coorte é só 30–60 dias atrás — mais novo (ainda sem
 *     30 dias completos) e mais velho (fora da coorte) ficam de fora;
 *     dentro da coorte, só quem tem último login ≥ 30 dias após o cadastro
 *     conta como retido;
 *  6. a resposta da rota nunca carrega e-mail ou nome de conta alguma, só
 *     contagens;
 *  7. RBAC: admin vê, profissional e anônimo não.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";
import {
  computeActivationFunnel,
  computeActivityWindow,
  computeRetentionProxy,
} from "../../functions/api/admin/_productMetrics";
import { onRequestGet } from "../../functions/api/admin/analytics-summary";

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

const SCHEMA_SQL = readFileSync("db/schema.d1.sql", "utf8");
const MIGRATION_FILES = readdirSync("db/migrations").sort();
const MIGRATION_SQL = MIGRATION_FILES.map((file) =>
  readFileSync(`db/migrations/${file}`, "utf8"),
);

/**
 * Um banco novo por cenário, em vez de `DELETE FROM` entre cenários: a
 * trigger `trg_clinic_memberships_keep_last_owner_delete` (0010) protege a
 * clínica contra ficar sem dono — inclusive via cascade de `DELETE FROM
 * clinics` — e bloquearia legitimamente a limpeza de qualquer clínica
 * sintética com um único owner. É a mesma proteção que existe para produção;
 * o teste se adapta a ela, não a contorna.
 */
function freshDb(): { sqlite: Database.Database; db: D1Database } {
  const raw = new Database(":memory:");
  raw.pragma("foreign_keys = ON");
  raw.exec(SCHEMA_SQL);
  MIGRATION_SQL.forEach((sql, index) => {
    try {
      raw.exec(sql);
    } catch (error) {
      const message = (error as Error).message;
      assert.match(
        message,
        /duplicate column name/,
        `migração ${MIGRATION_FILES[index]} não aplicou por um motivo inesperado: ${message}`,
      );
    }
  });
  return { sqlite: raw, db: new D1DatabaseMock(raw) as unknown as D1Database };
}

let { sqlite, db } = freshDb();

/** ISO de N dias atrás em relação ao "agora" real — mesma referência que `julianday('now')` usa dentro do SQLite. */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

let seq = 0;
function insertUser(opts: {
  role: "admin" | "professional" | "reader" | "operator";
  createdAt: string;
  lastLoginAt?: string | null;
  emailVerifiedAt?: string | null;
}): string {
  seq += 1;
  const id = `user-sintetico-${seq}`;
  sqlite
    .prepare(
      `INSERT INTO users (id, name, email, role, is_active, created_at, updated_at, last_login_at, email_verified_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)`,
    )
    .run(
      id,
      `Sintético ${seq}`,
      `sintetico-${seq}@example.test`,
      opts.role,
      opts.createdAt,
      opts.createdAt,
      opts.lastLoginAt ?? null,
      opts.emailVerifiedAt ?? null,
    );
  return id;
}

function insertClinic(ownerId: string, createdAt: string): string {
  seq += 1;
  const id = `clinic-sintetica-${seq}`;
  sqlite
    .prepare(
      `INSERT INTO clinics (id, slug, name, timezone, status, created_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, 'America/Recife', 'active', ?, ?, ?)`,
    )
    .run(
      id,
      `clinica-sintetica-${seq}`,
      `Clínica Sintética ${seq}`,
      ownerId,
      createdAt,
      createdAt,
    );
  sqlite
    .prepare(
      `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at)
       VALUES (?, ?, 'owner', 1, ?, ?)`,
    )
    .run(id, ownerId, createdAt, createdAt);
  return id;
}

// ---------------------------------------------------------------------------
// 1 e 2. DAU/WAU/MAU: fronteira de janela e exclusão de admin/reader.
// ---------------------------------------------------------------------------
const oldEnough = daysAgo(400); // fora de qualquer janela/coorte deste teste
insertUser({
  role: "professional",
  createdAt: oldEnough,
  lastLoginAt: daysAgo(0.3),
}); // dentro de d1
insertUser({
  role: "professional",
  createdAt: oldEnough,
  lastLoginAt: daysAgo(3),
}); // fora de d1, dentro de d7
insertUser({
  role: "professional",
  createdAt: oldEnough,
  lastLoginAt: daysAgo(15),
}); // fora de d7, dentro de d30
insertUser({
  role: "professional",
  createdAt: oldEnough,
  lastLoginAt: daysAgo(45),
}); // fora de tudo
insertUser({ role: "admin", createdAt: oldEnough, lastLoginAt: daysAgo(0.1) }); // login agora, mas é admin
insertUser({ role: "reader", createdAt: oldEnough, lastLoginAt: daysAgo(0.1) }); // login agora, mas é a sentinela E2E

const d1 = await computeActivityWindow(db, 1);
const d7 = await computeActivityWindow(db, 7);
const d30 = await computeActivityWindow(db, 30);
assert.equal(
  d1.activeAccounts,
  1,
  "só o login de 0,3 dia atrás deveria contar em D1",
);
assert.equal(
  d7.activeAccounts,
  2,
  "D7 deveria somar os logins de 0,3 e 3 dias atrás",
);
assert.equal(
  d30.activeAccounts,
  3,
  "D30 deveria somar os logins de 0,3, 3 e 15 dias atrás",
);
assert.equal(
  await computeActivityWindow(db, 9999).then((r) => r.activeAccounts),
  4,
  "janela enorme soma as 4 contas-cliente com login, mas nunca admin/reader",
);

// ---------------------------------------------------------------------------
// 3. Novas contas/clínicas por created_at, mesma fronteira.
// ---------------------------------------------------------------------------
({ sqlite, db } = freshDb());
const ownerRecent = insertUser({ role: "professional", createdAt: daysAgo(2) });
insertUser({ role: "professional", createdAt: daysAgo(20) });
insertUser({ role: "professional", createdAt: daysAgo(45) });
insertUser({ role: "admin", createdAt: daysAgo(0.1) }); // não é conta-cliente
insertClinic(ownerRecent, daysAgo(2));

const janela7 = await computeActivityWindow(db, 7);
const janela30 = await computeActivityWindow(db, 30);
assert.equal(janela7.newAccounts, 1, "só a conta de 2 dias atrás entra em D7");
assert.equal(
  janela30.newAccounts,
  2,
  "D30 soma as contas de 2 e 20 dias atrás, sem contar o admin",
);
assert.equal(janela7.newClinics, 1, "a clínica de 2 dias atrás entra em D7");
assert.equal(janela30.newClinics, 1, "a mesma clínica também entra em D30");

// ---------------------------------------------------------------------------
// 4. Funil de ativação: assinou → verificou e-mail → possui clínica.
// ---------------------------------------------------------------------------
({ sqlite, db } = freshDb());
const soAssinou = insertUser({ role: "professional", createdAt: daysAgo(5) });
const verificouENaoTemClinica = insertUser({
  role: "professional",
  createdAt: daysAgo(5),
  emailVerifiedAt: daysAgo(4),
});
const completouTudo = insertUser({
  role: "professional",
  createdAt: daysAgo(5),
  emailVerifiedAt: daysAgo(4),
});
insertClinic(completouTudo, daysAgo(3));
insertUser({ role: "professional", createdAt: daysAgo(45) }); // fora da janela de 30d
void soAssinou;
void verificouENaoTemClinica;

const funil = await computeActivationFunnel(db, 30);
assert.equal(
  funil.signedUp,
  3,
  "3 contas-cliente criadas dentro dos últimos 30 dias",
);
assert.equal(funil.emailVerified, 2, "2 delas verificaram e-mail");
assert.equal(funil.ownsClinic, 1, "só 1 chegou a ter clínica");

// ---------------------------------------------------------------------------
// 5. Retenção: coorte é só 30–60 dias atrás; dentro dela, login recente
//    o bastante conta como "ainda ativo".
// ---------------------------------------------------------------------------
({ sqlite, db } = freshDb());
insertUser({ role: "professional", createdAt: daysAgo(10) }); // recente demais: fora da coorte
insertUser({ role: "professional", createdAt: daysAgo(70) }); // velho demais: fora da coorte
const coortRetido = insertUser({
  role: "professional",
  createdAt: daysAgo(40),
  lastLoginAt: daysAgo(5), // 35 dias depois do cadastro: >= 30, conta como retido
});
const coortPerdido = insertUser({
  role: "professional",
  createdAt: daysAgo(40),
  lastLoginAt: daysAgo(35), // só 5 dias depois do cadastro: não chega a 30
});
insertUser({ role: "admin", createdAt: daysAgo(40), lastLoginAt: daysAgo(1) }); // fora por role
void coortRetido;
void coortPerdido;

const retencao = await computeRetentionProxy(db);
assert.equal(
  retencao.cohortSize,
  2,
  "coorte de 30–60 dias: os dois profissionais de 40 dias, sem os de 10/70 e sem o admin",
);
assert.equal(
  retencao.stillActiveAfter30d,
  1,
  "só o login 35 dias após o cadastro cruza o limiar de 30",
);

// ---------------------------------------------------------------------------
// 6 e 7. A rota: nenhum PII na resposta, RBAC correto.
// ---------------------------------------------------------------------------
function contexto(role: string | null) {
  return {
    env: { DB: db },
    data: role
      ? { authUser: { id: "user-x", name: "X", email: "x@example.test", role } }
      : {},
    request: new Request("https://exemplo.test/api/admin/analytics-summary"),
  } as never;
}

const anonimo = await onRequestGet(contexto(null));
assert.equal(anonimo.status, 401, "anônimo não lê métricas de produto");

const profissional = await onRequestGet(contexto("professional"));
assert.equal(
  profissional.status,
  403,
  "profissional não lê agregado cross-tenant",
);

const admin = await onRequestGet(contexto("admin"));
assert.equal(admin.status, 200);
const corpo = await admin.text();
const payload = JSON.parse(corpo);
assert.equal(typeof payload.window.d1.activeAccounts, "number");
assert.equal(typeof payload.retentionProxy.cohortSize, "number");

for (let i = 1; i <= seq; i += 1) {
  assert.equal(
    corpo.includes(`sintetico-${i}@example.test`),
    false,
    "nenhum e-mail de conta pode atravessar a rota de métricas",
  );
}
assert.equal(
  corpo.includes("Sintético"),
  false,
  "nenhum nome de conta pode atravessar a rota de métricas",
);

console.log(
  "✓ métricas de produto: DAU/WAU/MAU, funil de ativação, proxy de retenção, exclusão de admin/E2E, RBAC e ausência de PII aprovados",
);
