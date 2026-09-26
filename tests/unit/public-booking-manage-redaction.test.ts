/**
 * public-booking-manage-redaction.test.ts — OPS-19 (ciclo 4 da espiral
 * SaaS, 2026-09-26 — docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * `POST /api/public-booking` `action=manage` devolvia o DTO completo de
 * `appointmentToApi` (o mesmo usado no painel PRIVADO do profissional) a
 * qualquer pessoa que só tivesse o token opaco da reserva — incluindo
 * `providerUserId`/`patientId` (identificadores internos sem uso
 * legítimo para a família) e `amountCents`/`paymentMethod` (detalhe
 * financeiro granular que nem a recepção delegada enxerga em
 * `operations/index.ts`, que redige exatamente esses dois campos para
 * quem não é `canConfigure`).
 *
 * Este teste roda sobre o schema real (db/schema.d1.sql + todas as
 * migrações) e o handler real de `POST /api/public-booking`: prova que a
 * resposta de `action=manage` não contém mais esses quatro campos, mas
 * continua trazendo o que a família precisa para o autoatendimento
 * (nome, telefone, horário, status, status de pagamento).
 *
 * Nenhum dado real: tudo aqui é sintético.
 *
 * Rodar: node --import tsx tests/unit/public-booking-manage-redaction.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequestPost as publicBookingPost } from "../../functions/api/public-booking";
import { encryptText, sha256 } from "../../functions/api/operations/_core";

const raw = new DatabaseSync(":memory:");
raw.exec("PRAGMA foreign_keys = OFF;");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
const superadas: string[] = [];
for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
  try {
    raw.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
  } catch (erro) {
    assert.match(String(erro), /duplicate column name/i, `migração ${nome}: ${String(erro)}`);
    superadas.push(nome);
  }
}
assert.deepEqual(superadas, ["0001_users_auth.sql", "0002_patient_ownership.sql"]);
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
  return {
    prepare,
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      database.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;
}
const db = makeDb(raw);

const OPERATIONAL_KEY = "chave-operacional-de-teste-com-32-caracteres!!";
const env = { DB: db, OPERATIONAL_DATA_KEY: OPERATIONAL_KEY };

const now = new Date().toISOString();
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES ('pro-red', 'Profissional', 'pro-red@example.test', 'professional')`).run();
// trg_public_appointment_billing_guard (migração 0013) exige billing válido
// para qualquer INSERT de agendamento com source='public' — a criação da
// clínica já dispara trg_clinic_create_billing_trial (migração 0015), que
// nasce em trial válido por 14 dias.
raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES ('clinica-red', 'clinica-red', 'Clínica Red', 'active', 'pro-red', ?, ?)`).run(now, now);
raw.prepare(`INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES ('clinica-red', 'pro-red', 'professional', 1, ?, ?)`).run(now, now);
raw.prepare(
  `INSERT INTO booking_services (id, provider_user_id, name, duration_minutes, price_cents, modality, active, public_visible, created_at, updated_at)
   VALUES ('svc-1', 'pro-red', 'Consulta', 50, 30000, 'in_person', 1, 1, ?, ?)`,
).run(now, now);

const token = "token-sintetico-de-teste-com-mais-de-vinte-caracteres";
const tokenHash = await sha256(token);
const guardianNameEnc = await encryptText(env, "Responsável Sintético", "guardian_name");
const guardianPhoneEnc = await encryptText(env, "+5581999998888", "guardian_phone");
const patientNameEnc = await encryptText(env, "Paciente Sintético", "patient_name");

raw.prepare(
  `INSERT INTO appointments
    (id, provider_user_id, clinic_id, service_id, patient_id, starts_at_local, ends_at_local, timezone,
     status, source, booking_token_hash, guardian_name_encrypted, guardian_phone_encrypted, patient_name_encrypted,
     amount_cents, payment_status, payment_method, created_at, updated_at)
   VALUES ('apt-1', 'pro-red', 'clinica-red', 'svc-1', 'live-patient-opaco-123', '2026-10-01T10:00', '2026-10-01T10:50', 'America/Recife',
     'confirmed', 'public', ?, ?, ?, ?, 30000, 'paid', 'pix', ?, ?)`,
).run(tokenHash, guardianNameEnc, guardianPhoneEnc, patientNameEnc, now, now);

const response = await publicBookingPost({
  env,
  request: new Request("https://neuroped.test/api/public-booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "manage", token }),
  }),
} as never);

assert.equal(response.status, 200, `manage deveria responder 200, veio ${await response.clone().text()}`);
const body = await response.json() as { appointment: Record<string, unknown> };
const appointment = body.appointment;

for (const campoInterno of ["providerUserId", "patientId", "amountCents", "paymentMethod"]) {
  assert.equal(
    Object.prototype.hasOwnProperty.call(appointment, campoInterno),
    false,
    `campo interno "${campoInterno}" não pode ser exposto a quem só tem o token (OPS-19)`,
  );
}
assert.ok(
  !JSON.stringify(appointment).includes("live-patient-opaco-123"),
  "o identificador clínico interno do paciente não pode vazar no corpo da resposta",
);

assert.equal(appointment.guardianName, "Responsável Sintético");
assert.equal(appointment.guardianPhone, "+5581999998888");
assert.equal(appointment.patientName, "Paciente Sintético");
assert.equal(appointment.status, "confirmed");
assert.equal(appointment.paymentStatus, "paid", "status de pagamento continua, a família precisa dele para o autoatendimento");
assert.equal(appointment.serviceName, "Consulta");
assert.equal(appointment.startsAtLocal, "2026-10-01T10:00");

console.log("✓ POST /api/public-booking action=manage: identificadores internos e detalhe financeiro granular não são mais expostos a quem só tem o token (OPS-19)");
