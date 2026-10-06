/**
 * Ativação auditada do agendamento online institucional (#963 A).
 * Schema real (base + todas as migrações + triggers), contexto criado pelo
 * script real provision-institutional-agenda.mjs e prova final pelo handler
 * real de /api/public-booking (providers + slots).
 *
 * Rodar: node --import tsx tests/unit/institutional-booking-activation.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
// @ts-expect-error módulo .mjs sem tipos
import { activateInstitutionalBooking, normalizeBookingConfig, slugifyName } from "../../scripts/operations/activate-institutional-booking.mjs";
// @ts-expect-error módulo .mjs sem tipos
import { provisionInstitutionalAgenda } from "../../scripts/operations/provision-institutional-agenda.mjs";
import { onRequestGet as publicBookingGet } from "../../functions/api/public-booking";

const OWNER = "owner@example.test";
const E2E = "e2e@example.test";
const TODAY = "2026-10-06";
const repoConfig = JSON.parse(readFileSync("scripts/operations/institutional-booking.config.json", "utf8"));
// Segunda e domingo sempre futuros (o teste não envelhece).
function futureWeekday(weekday: number): string {
  const d = new Date(Date.now() + 400 * 86400000);
  while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
const MONDAY = futureWeekday(1);
const SUNDAY = futureWeekday(0);
const confirmed = (overrides: Record<string, unknown> = {}) => ({ ...repoConfig, confirmedByOwner: true, ...overrides });

function freshDb() {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = OFF;");
  raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
    try { raw.exec(readFileSync(`db/migrations/${nome}`, "utf8")); }
    catch (erro) { assert.match(String(erro), /duplicate column name/i, `${nome}: ${String(erro)}`); }
  }
  raw.exec("PRAGMA foreign_keys = ON;");
  raw.prepare(`INSERT INTO billing_plans (id, name, slug, price_cents, seat_price_cents) SELECT 'saas-professional', 'Plano', 'saas-professional', 9900, 9900 WHERE NOT EXISTS (SELECT 1 FROM billing_plans WHERE id = 'saas-professional')`).run();
  for (const [id, email, role] of [["u-owner", OWNER, "admin"], ["u-e2e", E2E, "reader"], ["u-other", "other@example.test", "professional"]]) {
    raw.prepare(`INSERT INTO users (id, name, email, role, is_active) VALUES (?, ?, ?, ?, 1)`).run(id, id === "u-owner" ? "Dr. Jadson Fraga" : id, email, role);
  }
  let beforeBatch: (() => void) | undefined;
  let batches = 0;
  const adapter = {
    query: async (sql: string, params: unknown[] = []) => raw.prepare(sql).all(...(params as never[])),
    batch: async (statements: Array<{ sql: string; params: unknown[] }>) => {
      batches += 1;
      beforeBatch?.();
      raw.exec("BEGIN");
      try { for (const { sql, params } of statements) raw.prepare(sql).all(...(params as never[])); raw.exec("COMMIT"); }
      catch (error) { raw.exec("ROLLBACK"); throw error; }
    },
  };
  // D1 shim mínimo para o handler real do booking público.
  const d1 = {
    prepare(sql: string) {
      const make = (args: unknown[]) => ({
        async first<T>() { return (raw.prepare(sql).get(...(args as never[])) as T | undefined) ?? null; },
        async run() { const info = raw.prepare(sql).run(...(args as never[])); return { meta: { changes: Number(info.changes) } }; },
        async all<T>() { return { results: raw.prepare(sql).all(...(args as never[])) as T[] }; },
      });
      return { bind: (...args: unknown[]) => make(args), ...make([]) };
    },
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      raw.exec("SAVEPOINT b");
      try { const out = []; for (const s of statements) out.push(await s.run()); raw.exec("RELEASE b"); return out; }
      catch (e) { raw.exec("ROLLBACK TO b; RELEASE b"); throw e; }
    },
    async exec(sql: string) { raw.exec(sql); return { count: 0, duration: 0 }; },
  };
  return { raw, adapter, d1, setBeforeBatch: (fn?: () => void) => { beforeBatch = fn; }, batches: () => batches };
}

const count = (raw: DatabaseSync, sql: string, ...args: unknown[]) => Number((raw.prepare(sql).get(...(args as never[])) as { n: number }).n);
const opts = (config: unknown, apply = true) => ({ ownerEmail: OWNER, e2eEmail: E2E, config, apply, runId: "test", today: TODAY });
async function publicGet(d1: unknown, query: string) {
  const response = await publicBookingGet({ env: { DB: d1 }, request: new Request(`https://x.test/api/public-booking?${query}`) } as never);
  return { status: response.status, body: (await response.json()) as Record<string, any> };
}
const rejects = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (e: Error) => e.message === `BOOKING_ACTIVATION_${code}`, code);

// 1. Configuração do repositório é válida e começa SEM consentimento.
{
  const cfg = normalizeBookingConfig(repoConfig);
  assert.equal(cfg.confirmedByOwner, true, "proprietário confirmou em 06/10 17:37 BRT");
  assert.equal(cfg.profile.locationLabel, null, "local em branco");
  assert.equal(cfg.service.durationMinutes, 60, "#963: serviço de 60 minutos");
  assert.equal(cfg.service.modality, "in_person", "#963: presencial");
  assert.equal(cfg.rules.length, 5);
  assert.equal(slugifyName("Dr. Jadson Fraga"), "dr-jadson-fraga");
  for (const bad of [
    { ...repoConfig, version: 2 },
    { ...repoConfig, confirmedByOwner: "sim" },
    { ...repoConfig, service: { ...repoConfig.service, durationMinutes: 5 } },
    { ...repoConfig, rules: [{ weekday: 1, start: "14:00", end: "14:30", slotMinutes: 60 }] },
    { ...repoConfig, rules: [] },
    { ...repoConfig, profile: { ...repoConfig.profile, timezone: "UTC" } },
    { ...repoConfig, profile: { ...repoConfig.profile, slug: "Com Espaço" } },
    { ...repoConfig, holidays: [{ date: "12/10/2026", reason: "x" }] },
  ]) assert.throws(() => normalizeBookingConfig(bad), /BOOKING_ACTIVATION_CONFIG_INVALID/);
}

// 2. Sem contexto institucional: falha fechado, sem escrita.
{
  const t = freshDb();
  await rejects(activateInstitutionalBooking(t.adapter, opts(confirmed())), "INSTITUTIONAL_CONTEXT_MISSING");
  assert.equal(t.batches(), 0);
  await rejects(activateInstitutionalBooking(t.adapter, { ...opts(confirmed()), e2eEmail: OWNER }), "OWNER_IDENTITY_REQUIRED");
}

// 3. Contexto real + sem confirmação: só leitura, recibo com o estado.
const t = freshDb();
const provisioned = await provisionInstitutionalAgenda(t.adapter, { ownerEmail: OWNER, e2eEmail: E2E, apply: true });
assert.equal(provisioned.status, "configured");
{
  const before = (await publicGet(t.d1, "action=providers")).body.providers;
  assert.deepEqual(before, [], "estado de produção hoje: diretório vazio");
  // A trava de consentimento é exercitada com confirmedByOwner=false explícito:
  // o arquivo do repositório pode estar true (ativação aprovada) sem enfraquecer o teste.
  const result = await activateInstitutionalBooking(t.adapter, opts({ ...repoConfig, confirmedByOwner: false }));
  assert.equal(result.status, "awaiting_owner_confirmation");
  assert.equal(result.writes, 0);
  assert.equal(result.snapshot.institutionalContextReady, true);
  assert.equal(result.snapshot.publicDirectoryListed, false);
  assert.equal(t.batches(), 1, "só o batch do provisionamento; nenhuma escrita da ativação");
  const dry = await activateInstitutionalBooking(t.adapter, opts(confirmed(), false));
  assert.equal(dry.status, "ready_to_apply");
  assert.equal(t.batches(), 1);
}

// 4. Corrida: estado muda entre leitura e batch → nada parcial.
{
  t.setBeforeBatch(() => t.raw.prepare(`INSERT INTO booking_services (id, provider_user_id, clinic_id, name, duration_minutes, active, public_visible) VALUES ('svc-race', 'u-owner', NULL, 'Corrida', 30, 0, 0)`).run());
  await assert.rejects(activateInstitutionalBooking(t.adapter, opts(confirmed())));
  t.setBeforeBatch(undefined);
  assert.equal(count(t.raw, `SELECT COUNT(*) AS n FROM booking_availability_rules WHERE provider_user_id = 'u-owner'`), 0, "nenhuma regra parcial");
  assert.equal(count(t.raw, `SELECT COUNT(*) AS n FROM booking_provider_profiles WHERE user_id = 'u-owner' AND booking_enabled = 1`), 0);
  // Configuração manual existente nunca é sobrescrita.
  await rejects(activateInstitutionalBooking(t.adapter, opts(confirmed())), "EXISTING_CONFIGURATION_REVIEW_REQUIRED");
  t.raw.prepare(`DELETE FROM booking_services WHERE id = 'svc-race'`).run();
}

// 5. Slug de outro profissional: conflito, sem escrita.
{
  t.raw.prepare(`INSERT INTO booking_provider_profiles (user_id, slug, display_name, specialty) VALUES ('u-other', 'dr-jadson-fraga', 'Outro', 'X')`).run();
  await rejects(activateInstitutionalBooking(t.adapter, opts(confirmed())), "SLUG_CONFLICT");
  t.raw.prepare(`DELETE FROM booking_provider_profiles WHERE user_id = 'u-other'`).run();
}

// 6. Perfil já criado por /agenda (booking desligado) + confirmação → ativa, mantendo o slug existente.
{
  t.raw.prepare(`INSERT INTO booking_provider_profiles (user_id, slug, display_name, specialty, booking_enabled) VALUES ('u-owner', 'dr-jadson-fraga-agenda', 'Dr. Jadson Fraga', 'Neuropediatria', 0)`).run();
  const result = await activateInstitutionalBooking(t.adapter, opts(confirmed()));
  assert.equal(result.status, "activated");
  assert.equal(result.slug, "dr-jadson-fraga-agenda");
  assert.equal(result.rulesCreated, 5);
  assert.equal(result.holidayBlocksCreated, 7, "só feriados a partir de hoje");
  const providers = (await publicGet(t.d1, "action=providers")).body.providers;
  assert.deepEqual(providers.map((p: { slug: string }) => p.slug), ["dr-jadson-fraga-agenda"], "diretório público deixa de ser []");
  const service = t.raw.prepare(`SELECT id, clinic_id, duration_minutes, price_cents, modality FROM booking_services WHERE provider_user_id = 'u-owner'`).get() as Record<string, unknown>;
  assert.match(String(service.clinic_id), /^institutional-/);
  assert.equal(service.duration_minutes, 60);
  // Segunda-feira futura (fora da lista de feriados): 09:30, 10:30, 11:30, 12:30, 13:30.
  const slots = await publicGet(t.d1, `action=slots&provider=dr-jadson-fraga-agenda&service=${service.id}&date=${MONDAY}`);
  assert.equal(slots.status, 200);
  assert.deepEqual(slots.body.slots.map((s: { startsAtLocal: string }) => s.startsAtLocal.slice(11, 16)), ["09:30", "10:30", "11:30", "12:30", "13:30"]);
  const holiday = await publicGet(t.d1, `action=slots&provider=dr-jadson-fraga-agenda&service=${service.id}&date=2026-10-12`);
  assert.deepEqual(holiday.body.slots, [], "feriado bloqueado");
  const sunday = await publicGet(t.d1, `action=slots&provider=dr-jadson-fraga-agenda&service=${service.id}&date=${SUNDAY}`);
  assert.deepEqual(sunday.body.slots, [], "domingo sem regra");
  const audit = t.raw.prepare(`SELECT action, metadata_json FROM saas_audit_log WHERE action = 'institutional_booking_activated'`).all() as Array<{ metadata_json: string }>;
  assert.equal(audit.length, 1);
  assert.doesNotMatch(audit[0].metadata_json, /@|Jadson/, "auditoria sem e-mail nem nome");
}

// 7. Idempotência: reexecução não escreve.
{
  const before = t.batches();
  const again = await activateInstitutionalBooking(t.adapter, opts(confirmed()));
  assert.equal(again.status, "already_activated");
  assert.equal(again.writes, 0);
  assert.equal(t.batches(), before);
  // Proprietário pausou pela UI depois: o script não reativa por conta própria.
  t.raw.prepare(`UPDATE booking_provider_profiles SET booking_enabled = 0 WHERE user_id = 'u-owner'`).run();
  await rejects(activateInstitutionalBooking(t.adapter, opts(confirmed())), "EXISTING_ACTIVATION_CHANGED_REVIEW_REQUIRED");
}

// 8. Contrato do runner: só main confiável, leitura com SELECT, recibo sem PHI.
{
  const source = readFileSync("scripts/operations/activate-institutional-booking.mjs", "utf8");
  assert.match(source, /GITHUB_REF !== 'refs\/heads\/main'\) fail\('TRUSTED_MAIN_REQUIRED'\)/);
  assert.match(source, /if \(!\/\^SELECT\\s\/i\.test\(sql\) \|\| sql\.includes\(';'\)\) fail\('READ_QUERY_REQUIRED'\)/);
  assert.match(source, /if \(!cfg\.confirmedByOwner\) return \{ status: 'awaiting_owner_confirmation', writes: 0/);
  const workflow = readFileSync(".github/workflows/agenda-booking-activation.yml", "utf8");
  assert.match(workflow, /if: github\.event_name != 'pull_request' && github\.ref == 'refs\/heads\/main'/);
  assert.doesNotMatch(workflow.split("activate:")[0], /secrets\./, "job de PR não recebe segredos");
}

t.raw.close();
console.log("✓ ativação do agendamento institucional: trava de consentimento, contexto real, sem sobrescrever configuração manual, atômica, idempotente e diretório público com slots reais");
