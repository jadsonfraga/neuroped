import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { nextAuditIsoDay, onRequestGet, parseAuditLogQuery } from "../../functions/api/audit-log";

const sane = parseAuditLogQuery(new URL("https://neuroped.invalid/api/audit-log?page=abc&limit=-5"));
assert.equal(sane.ok, true);
if (sane.ok) {
  assert.equal(sane.page, 1, "page inválida deve cair no fallback seguro");
  assert.equal(sane.limit, 50, "limit inválido deve cair no fallback seguro");
}

const capped = parseAuditLogQuery(new URL("https://neuroped.invalid/api/audit-log?page=999999999999999999999&limit=999"));
assert.equal(capped.ok, true);
if (capped.ok) {
  assert.equal(capped.page, 1, "inteiro fora do intervalo seguro não pode virar Infinity/NaN");
  assert.equal(capped.limit, 100, "limit numérico deve respeitar teto");
}

for (const query of [
  "from=2026-02-31",
  "to=2026-13-01",
  "from=2026-08-11&to=2026-08-10",
]) {
  assert.equal(
    parseAuditLogQuery(new URL(`https://neuroped.invalid/api/audit-log?${query}`)).ok,
    false,
    `${query}: intervalo/data inválido deve ser rejeitado`,
  );
}

const noDb = await onRequestGet({
  env: {},
  request: new Request("https://neuroped.invalid/api/audit-log"),
  data: {},
} as never);
assert.equal(noDb.status, 503, "log administrativo sem D1 deve falhar fechado");
const payload = await noDb.json() as { code?: string; data?: unknown };
assert.equal(payload.code, "DB_REQUIRED");
assert.equal("data" in payload, false, "falha sem DB não pode expor logs fictícios");
assert.equal(nextAuditIsoDay("2026-02-28"), "2026-03-01");
assert.equal(nextAuditIsoDay("2024-02-28"), "2024-02-29");
assert.equal(nextAuditIsoDay("2026-12-31"), "2027-01-01");

// ── AUTHZ-P1-08/LTB-19: a própria leitura do admin de plataforma vira trilha ──
{
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

  function makeDb(database: DatabaseSync): D1Database {
    const prepare = (sql: string) => {
      const make = (args: unknown[]) => ({
        async first<T>() {
          return (database.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
        },
        async run() {
          const info = database.prepare(sql).run(...(args as never[]));
          return { meta: { changes: Number(info.changes) } };
        },
        async all<T>() {
          return { results: database.prepare(sql).all(...(args as never[])) as T[] };
        },
      });
      return { bind: (...args: unknown[]) => make(args), ...make([]) };
    };
    return { prepare } as unknown as D1Database;
  }
  const db = makeDb(raw);

  raw.prepare(`INSERT INTO users (id, name, email, role) VALUES ('admin-1', 'Admin', 'admin@example.test', 'admin')`).run();

  const waited: Promise<unknown>[] = [];
  const response = await onRequestGet({
    env: { DB: db },
    request: new Request("https://neuroped.invalid/api/audit-log?resource=patients&action=login"),
    data: { authUser: { id: "admin-1", email: "admin@example.test", name: "Admin", role: "admin", mustChangePassword: false } },
    waitUntil: (p: Promise<unknown>) => waited.push(p),
  } as never);
  assert.equal(response.status, 200, "admin autenticado precisa conseguir ler o log");
  await Promise.all(waited);

  const trilha = raw.prepare(
    `SELECT clinic_id, actor_user_id, target_type, metadata_json FROM saas_audit_log WHERE action = 'platform_audit_log_read'`,
  ).get() as { clinic_id: string | null; actor_user_id: string; target_type: string; metadata_json: string } | undefined;
  assert.ok(trilha, "a leitura do admin de plataforma precisa virar trilha própria");
  assert.equal(trilha?.clinic_id, null, "a leitura é cross-tenant por natureza");
  assert.equal(trilha?.actor_user_id, "admin-1");
  assert.equal(trilha?.target_type, "audit_logs");
  const metadata = JSON.parse(trilha?.metadata_json ?? "{}") as Record<string, unknown>;
  assert.equal(metadata.resource, "patients");
  assert.equal(metadata.action, "login");
}
console.log("✓ audit-log: leitura do admin de plataforma sobre audit_logs também vira trilha própria, cross-tenant e sem PHI (AUTHZ-P1-08/LTB-19)");

console.log("✓ audit-log falha fechado e normaliza paginação/filtros sem NaN ou datas impossíveis");
