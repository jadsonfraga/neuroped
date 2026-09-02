/**
 * Regressão: a evidência LGPD do aceite público precisa nascer pelo caminho de
 * PRODUÇÃO (bootstrap de runtime), não apenas pela migração 0016. Antes da
 * correção, `ensureOperationsHardeningSchema` não criava a tabela nem os
 * triggers de `public_booking_consent_evidence` — num banco onde a migração
 * ainda não rodou, agendamentos públicos e entradas de waitlist eram gravados
 * sem qualquer prova de aceite.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { ensureOperationsSchema } from "../../functions/api/operations/_core";
import { ensureOperationsHardeningSchema } from "../../functions/api/operations/_access";

function makeDb(raw: DatabaseSync) {
  const prepare = (sql: string) => ({
    bind: (...args: unknown[]) => ({
      async first<T>() {
        return (raw.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
      },
      async run() {
        const info = raw.prepare(sql).run(...(args as never[]));
        return { meta: { changes: Number(info.changes) } };
      },
    }),
    async run() {
      raw.exec(sql);
      return { meta: { changes: 0 } };
    },
  });
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

async function freshRuntimeDb(): Promise<DatabaseSync> {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON;");
  // Tabela base fora do escopo do módulo operations (criada por auth/tenant).
  raw.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, email TEXT, role TEXT, is_active INTEGER DEFAULT 1);`);
  const db = makeDb(raw);
  // Caminho real do endpoint /api/public-booking: schema + hardening, SEM migração.
  await ensureOperationsSchema(db);
  await ensureOperationsHardeningSchema(db);
  raw.exec(`
    INSERT INTO users(id, name, email, role) VALUES ('prov-1', 'Dra. Prova', 'p@x.dev', 'professional');
    INSERT INTO booking_services(id, provider_user_id, name, duration_minutes, modality)
      VALUES ('svc-1', 'prov-1', 'Consulta', 50, 'in_person');
  `);
  return raw;
}

// ── 1. INSERT público de appointment gera evidência no mesmo commit ─────────
{
  const raw = await freshRuntimeDb();
  raw.exec(`
    INSERT INTO appointments(id, provider_user_id, service_id, starts_at_local, ends_at_local, timezone, source, booking_token_hash, created_at)
      VALUES ('appt-pub', 'prov-1', 'svc-1', '2026-09-02T09:00', '2026-09-02T09:50', 'America/Sao_Paulo', 'public', 'hash-1', '2026-09-01T12:00:00Z');
  `);
  const evidence = raw
    .prepare("SELECT notice_version, notice_sha256, purpose, accepted_at FROM public_booking_consent_evidence WHERE appointment_id = 'appt-pub'")
    .get() as { notice_version: string; notice_sha256: string; purpose: string; accepted_at: string } | undefined;
  assert.ok(evidence, "agendamento público sem migração 0016 não pode ficar sem evidência de aceite");
  assert.equal(evidence!.notice_version, "public-booking-privacy-v1");
  assert.match(evidence!.notice_sha256, /^sha256:[0-9a-f]{64}$/);
  assert.equal(evidence!.purpose, "appointment_scheduling_and_management");
  assert.equal(evidence!.accepted_at, "2026-09-01T12:00:00Z");

  // Agendamento criado pelo profissional não presume consentimento público.
  raw.exec(`
    INSERT INTO appointments(id, provider_user_id, service_id, starts_at_local, ends_at_local, timezone, source, booking_token_hash)
      VALUES ('appt-pro', 'prov-1', 'svc-1', '2026-09-03T09:00', '2026-09-03T09:50', 'America/Sao_Paulo', 'professional', 'hash-2');
  `);
  const none = raw
    .prepare("SELECT id FROM public_booking_consent_evidence WHERE appointment_id = 'appt-pro'")
    .get();
  assert.equal(none, undefined, "source='professional' não pode gerar evidência de aceite presumido");
}

// ── 2. INSERT de waitlist gera evidência no mesmo commit ────────────────────
{
  const raw = await freshRuntimeDb();
  raw.exec(`
    INSERT INTO waitlist_entries(id, provider_user_id, service_id, access_token_hash, created_at)
      VALUES ('wait-1', 'prov-1', 'svc-1', 'hash-w1', '2026-09-01T13:00:00Z');
  `);
  const evidence = raw
    .prepare("SELECT notice_version FROM public_booking_consent_evidence WHERE waitlist_entry_id = 'wait-1'")
    .get() as { notice_version: string } | undefined;
  assert.ok(evidence, "entrada de waitlist sem migração 0016 não pode ficar sem evidência de aceite");
  assert.equal(evidence!.notice_version, "public-booking-privacy-v1");
}

// ── 3. Bootstrap é idempotente e convive com a migração 0016 já aplicada ────
{
  const raw = await freshRuntimeDb();
  raw.exec(readFileSync("db/migrations/0016_public_booking_consent_evidence.sql", "utf8"));
  const db = makeDb(raw);
  await ensureOperationsHardeningSchema(db);
  await ensureOperationsHardeningSchema(db);
  raw.exec(`
    INSERT INTO appointments(id, provider_user_id, service_id, starts_at_local, ends_at_local, timezone, source, booking_token_hash)
      VALUES ('appt-x', 'prov-1', 'svc-1', '2026-09-04T09:00', '2026-09-04T09:50', 'America/Sao_Paulo', 'public', 'hash-x');
  `);
  const rows = raw
    .prepare("SELECT COUNT(*) AS n FROM public_booking_consent_evidence WHERE appointment_id = 'appt-x'")
    .get() as { n: number };
  assert.equal(rows.n, 1, "migração + bootstrap não podem duplicar evidência nem conflitar");
}

// ── 4. Runtime e migração compartilham versão/hash do aviso (sem drift) ─────
{
  const migration = readFileSync("db/migrations/0016_public_booking_consent_evidence.sql", "utf8");
  const runtime = readFileSync("functions/api/operations/_access.ts", "utf8");
  for (const literal of [
    "public-booking-privacy-v1",
    "sha256:d0a7e8c1ed9dff137adb2532a1ce4b11a3e91accf5ce6880fd3108a918932ece",
    "appointment_scheduling_and_management",
  ]) {
    assert.ok(migration.includes(literal), `migração 0016 deve conter ${literal}`);
    assert.ok(runtime.includes(literal), `bootstrap de runtime deve conter ${literal}`);
  }
}

console.log("✓ evidência de aceite público nasce pelo bootstrap de runtime (caminho de produção), idempotente com a migração 0016");
