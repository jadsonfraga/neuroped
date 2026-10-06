/**
 * Aceite versionado dos Termos de Uso e da Política de Privacidade no cadastro.
 *
 * Harness real: db/schema.d1.sql + todas as migrações (inclui a 0033) e o
 * handler real de /api/auth/signup. Cobre:
 *   1. sem aceite / aceite incompleto → 400 LEGAL_ACCEPTANCE_REQUIRED, nenhuma conta;
 *   2. versão diferente da vigente → 400 LEGAL_VERSION_OUTDATED, nenhuma conta;
 *   3. aceite vigente → conta + 2 aceites (versão, SHA-256, origem, data = criação);
 *   4. e-mail já usado → 409 sem aceite órfão;
 *   5. atomicidade: aceite que falha desfaz a conta;
 *   6. bootstrap de runtime: banco sem a 0033 cria a tabela no cadastro;
 *   7. trava de versão: o texto publicado bate com o SHA-256 declarado;
 *   8. texto honesto: rascunho marcado, pendências visíveis, números do billing.
 *
 * Rodar: node --import tsx tests/unit/saas-legal-acceptance.test.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequestPost as signupPost } from "../../functions/api/auth/signup";
import {
  LEGAL_DOCUMENTS,
  LEGAL_PENDING,
  checkLegalAcceptance,
  currentLegalVersions,
  legalDocumentCanonicalText,
  legalDocumentKeys,
} from "../../shared/legal";
import { CANONICAL_TRIAL_DAYS, POST_CANCEL_RETENTION_DAYS } from "../../shared/billing";

const SECRET = "unit-test-jwt-secret-with-32-plus-chars!";
const STRONG_PASSWORD = "SenhaForteDeTeste#2026!";
const ENV = {
  SAAS_SIGNUP_ENABLED: "true",
  NEUROPED_JWT_SECRET: SECRET,
  AUTH_PUBLIC_APP_URL: "https://app.neuroped.example",
  AUTH_RESEND_API_KEY: "re_synthetic_key",
  AUTH_EMAIL_FROM: "NeuroPed <no-reply@neuroped.example>",
};

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => new Response(JSON.stringify({ id: "synthetic-email" }), { status: 202 });

function fullSchema(): DatabaseSync {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = OFF;");
  raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
    try {
      raw.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
    } catch (erro) {
      assert.match(String(erro), /duplicate column name/i, `migração ${nome}: ${String(erro)}`);
    }
  }
  raw.exec("PRAGMA foreign_keys = ON;");
  return raw;
}

function makeDb(raw: DatabaseSync, failOn?: RegExp): D1Database {
  const prepare = (sql: string) => {
    const make = (args: unknown[]) => ({
      async first<T>() {
        return (raw.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
      },
      async run() {
        if (failOn?.test(sql)) throw new Error("falha sintética de escrita");
        const info = raw.prepare(sql).run(...(args as never[]));
        return { meta: { changes: Number(info.changes) } };
      },
      async all<T>() {
        return { results: raw.prepare(sql).all(...(args as never[])) as T[] };
      },
    });
    return { bind: (...args: unknown[]) => make(args), ...make([]) };
  };
  return {
    prepare,
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      raw.exec("SAVEPOINT d1_batch");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        raw.exec("RELEASE d1_batch");
        return results;
      } catch (error) {
        raw.exec("ROLLBACK TO d1_batch; RELEASE d1_batch");
        throw error;
      }
    },
  } as unknown as D1Database;
}

async function signup(db: D1Database, body: Record<string, unknown>) {
  const context = {
    env: { DB: db, ...ENV },
    request: new Request("https://x.test/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.7" },
      body: JSON.stringify(body),
    }),
    params: {},
    data: {},
    waitUntil: () => undefined,
    next: async () => new Response(null),
  } as unknown as Parameters<typeof signupPost>[0];
  const response = await signupPost(context);
  return { status: response.status, body: (await response.json()) as Record<string, any> };
}

type Row = Record<string, any>;
const base = (email: string) => ({ name: "Dra. Teste Legal", email, password: STRONG_PASSWORD });
const count = (raw: DatabaseSync, sql: string, ...args: unknown[]) =>
  Number((raw.prepare(sql).get(...(args as never[])) as Row).n);

const raw = fullSchema();
const db = makeDb(raw);

// ── 1. Sem aceite ou aceite incompleto ──────────────────────────────────────
for (const acceptedLegal of [undefined, null, true, "sim", [], {}, { saas_terms: LEGAL_DOCUMENTS.saas_terms.version }]) {
  const result = await signup(db, { ...base("sem.aceite@example.test"), acceptedLegal });
  assert.equal(result.status, 400, `aceite ${JSON.stringify(acceptedLegal)}`);
  assert.equal(result.body.code, "LEGAL_ACCEPTANCE_REQUIRED");
}
assert.equal(count(raw, `SELECT COUNT(*) AS n FROM users WHERE email = 'sem.aceite@example.test'`), 0, "nenhuma conta sem aceite");

// ── 2. Versão desatualizada ─────────────────────────────────────────────────
{
  const result = await signup(db, {
    ...base("versao.velha@example.test"),
    acceptedLegal: { ...currentLegalVersions(), privacy_policy: "2026-01-01-v0" },
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.code, "LEGAL_VERSION_OUTDATED");
  assert.match(result.body.error, /Recarregue/);
  assert.equal(count(raw, `SELECT COUNT(*) AS n FROM users WHERE email = 'versao.velha@example.test'`), 0);
}

// ── 3. Aceite vigente: conta + um aceite por documento ──────────────────────
let userId: string;
{
  const result = await signup(db, { ...base("aceitou@example.test"), acceptedLegal: currentLegalVersions() });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  userId = result.body.user.id;
  const user = raw.prepare(`SELECT created_at FROM users WHERE id = ?`).get(userId) as Row;
  const rows = raw.prepare(`SELECT * FROM saas_legal_acceptances WHERE user_id = ? ORDER BY document`).all(userId) as Row[];
  assert.equal(rows.length, 2, "um aceite por documento");
  for (const row of rows) {
    const doc = LEGAL_DOCUMENTS[row.document as keyof typeof LEGAL_DOCUMENTS];
    assert.ok(doc, `documento conhecido: ${row.document}`);
    assert.equal(row.version, doc.version);
    assert.equal(row.content_sha256, doc.contentSha256);
    assert.equal(row.source, "signup");
    assert.equal(row.accepted_at, user.created_at, "aceite e conta no mesmo instante");
    assert.match(row.id, /^legal-/);
  }
  assert.deepEqual(rows.map((r) => r.document), ["privacy_policy", "saas_terms"]);
  const columns = (raw.prepare(`SELECT name FROM pragma_table_info('saas_legal_acceptances')`).all() as Row[]).map((r) => r.name);
  assert.ok(!columns.some((c) => /ip|agent|email/i.test(c)), "nenhum IP, user-agent ou e-mail na prova de aceite");
}

// ── 4. E-mail já usado: 409 e nenhum aceite órfão ───────────────────────────
{
  const before = count(raw, `SELECT COUNT(*) AS n FROM saas_legal_acceptances`);
  const dup = await signup(db, { ...base("Aceitou@Example.test"), acceptedLegal: currentLegalVersions() });
  assert.equal(dup.status, 409);
  assert.equal(dup.body.code, "EMAIL_IN_USE");
  assert.equal(count(raw, `SELECT COUNT(*) AS n FROM saas_legal_acceptances`), before, "sem aceite órfão");
  assert.equal(
    count(raw, `SELECT COUNT(*) AS n FROM saas_legal_acceptances a LEFT JOIN users u ON u.id = a.user_id WHERE u.id IS NULL`),
    0,
  );
}

// ── 5. Atomicidade: aceite que falha desfaz a conta ─────────────────────────
{
  const failing = makeDb(raw, /INSERT INTO saas_legal_acceptances/);
  let threw = false;
  const result = await signup(failing, { ...base("atomico@example.test"), acceptedLegal: currentLegalVersions() }).catch(() => {
    threw = true;
    return null;
  });
  assert.ok(threw || result?.status === 500, "falha no aceite não vira sucesso");
  assert.equal(count(raw, `SELECT COUNT(*) AS n FROM users WHERE email = 'atomico@example.test'`), 0, "conta desfeita junto");
}

// ── 6. Banco sem a 0033: o cadastro cria a tabela (bootstrap de runtime) ────
{
  const legacy = new DatabaseSync(":memory:");
  legacy.exec("PRAGMA foreign_keys = OFF;");
  legacy.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql") && f < "0033").sort()) {
    try {
      legacy.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
    } catch (erro) {
      assert.match(String(erro), /duplicate column name/i);
    }
  }
  legacy.exec("PRAGMA foreign_keys = ON;");
  assert.equal(count(legacy, `SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'saas_legal_acceptances'`), 0);
  const result = await signup(makeDb(legacy), { ...base("antes.da.migracao@example.test"), acceptedLegal: currentLegalVersions() });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  assert.equal(count(legacy, `SELECT COUNT(*) AS n FROM saas_legal_acceptances`), 2, "aceite gravado mesmo antes da migração");
  // A tabela criada em runtime é a mesma da migração (rodar a 0033 depois não muda nada).
  const runtimeSql = (legacy.prepare(`SELECT sql FROM sqlite_master WHERE name = 'saas_legal_acceptances'`).get() as Row).sql;
  const migrationSql = (raw.prepare(`SELECT sql FROM sqlite_master WHERE name = 'saas_legal_acceptances'`).get() as Row).sql;
  const norm = (sql: string) => sql.replace(/\s+/g, " ").replace(/IF NOT EXISTS /, "").trim();
  assert.equal(norm(runtimeSql), norm(migrationSql), "bootstrap de runtime espelha a 0033");
  legacy.exec(readFileSync("db/migrations/0033_saas_legal_acceptance.sql", "utf8"));
  assert.equal(count(legacy, `SELECT COUNT(*) AS n FROM saas_legal_acceptances`), 2, "0033 é idempotente sobre o bootstrap");
}

// ── 7. Eliminação da conta leva os aceites (CASCADE) ────────────────────────
{
  raw.prepare(`DELETE FROM auth_refresh_sessions WHERE user_id = ?`).run(userId);
  raw.prepare(`DELETE FROM auth_email_verification_tokens WHERE user_id = ?`).run(userId);
  raw.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
  assert.equal(count(raw, `SELECT COUNT(*) AS n FROM saas_legal_acceptances WHERE user_id = ?`, userId), 0);
}

// ── 8. Trava de versão: texto publicado = SHA-256 declarado ─────────────────
for (const key of legalDocumentKeys) {
  const doc = LEGAL_DOCUMENTS[key];
  const actual = createHash("sha256").update(legalDocumentCanonicalText(doc), "utf8").digest("hex");
  assert.equal(
    `sha256:${actual}`,
    doc.contentSha256,
    `${key}: o texto mudou. Publique uma versão nova: atualize \`version\`, \`publishedAt\` e \`contentSha256\` (sha256:${actual}) juntos.`,
  );
  assert.match(doc.version, /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/);
  assert.ok(doc.path.startsWith("/"));
}
assert.deepEqual(checkLegalAcceptance(currentLegalVersions()), { ok: true });

// ── 9. Texto honesto ────────────────────────────────────────────────────────
for (const key of legalDocumentKeys) {
  const doc = LEGAL_DOCUMENTS[key];
  assert.equal(doc.status, "draft_pending_legal_review", "enquanto o G6 não fecha, o status é rascunho");
  assert.match(doc.version, /rascunho/, "a versão de rascunho diz que é rascunho");
  const text = legalDocumentCanonicalText(doc);
  assert.ok(text.includes(LEGAL_PENDING), `${key}: pendências jurídicas marcadas no texto`);
  assert.doesNotMatch(text, /Lorem|TODO|XXX/i, "sem texto de preenchimento genérico");
}
const terms = legalDocumentCanonicalText(LEGAL_DOCUMENTS.saas_terms);
assert.ok(terms.includes(`${CANONICAL_TRIAL_DAYS} dias de avaliação`), "trial vem de shared/billing");
assert.ok(terms.includes("R$ 99,00"), "preço vem de shared/billing, sem depender do Intl");
assert.ok(legalDocumentCanonicalText(LEGAL_DOCUMENTS.privacy_policy).includes(`por ${POST_CANCEL_RETENTION_DAYS} dias`));

// ── 10. Telas: rotas públicas, cadastro envia as versões, links ─────────────
{
  const app = readFileSync("client/src/App.tsx", "utf8");
  const publicRoutes = readFileSync("client/src/lib/publicRoutes.ts", "utf8");
  const cadastro = readFileSync("client/src/pages/cadastro.tsx", "utf8");
  const planos = readFileSync("client/src/pages/planos.tsx", "utf8");
  const page = readFileSync("client/src/components/LegalDocumentPage.tsx", "utf8");
  for (const path of ["/termos-de-uso", "/privacidade"]) {
    assert.ok(app.includes(`<Route path="${path}"`), `${path} roteada`);
    assert.ok(publicRoutes.includes(`"${path}"`), `${path} pública (sem PIN)`);
    assert.ok(planos.includes(`href="${path}"`), `${path} linkada em /planos`);
  }
  assert.match(cadastro, /signup\(name\.trim\(\), email\.trim\(\), password, currentLegalVersions\(\)\)/, "cadastro envia as versões vigentes");
  assert.match(cadastro, /disabled=\{submitting \|\| !acceptedLegal\}/, "sem aceite não envia");
  assert.match(cadastro, /LEGAL_DOCUMENTS\.saas_terms\.path/);
  assert.match(page, /Rascunho pendente de revisão jurídica/);
  assert.match(page, /LEGAL_DOCUMENTS\[documentKey\]/, "a página mostra a mesma fonte que o servidor grava");
}

globalThis.fetch = originalFetch;
raw.close();
console.log("✓ aceite legal no cadastro: obrigatório e na versão vigente, gravado atomicamente com a conta (versão + SHA-256), sem órfão, bootstrap antes da migração, trava de versão do texto e páginas públicas");
