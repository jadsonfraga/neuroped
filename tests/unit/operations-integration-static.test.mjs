import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const app = read("client/src/App.tsx");
const nav = read("client/src/data/navigation.ts");
const middleware = read("functions/api/_middleware.ts");
const professional = read("functions/api/operations/index.ts");
const publicBooking = read("functions/api/public-booking.ts");
const core = read("functions/api/operations/_core.ts");
const migration = read("db/migrations/0007_operational_suite.sql");
const agenda = read("client/src/pages/agenda.tsx");
const booking = read("client/src/pages/agendar.tsx");
const workflow = read(".github/workflows/operations-d1-migration.yml");

assert.match(app, /import\("@\/pages\/agenda"\)/);
assert.match(app, /import\("@\/pages\/agendar"\)/);
assert.match(app, /path="\/agenda"/);
assert.match(app, /path="\/agendar"/);
assert.match(nav, /href: "\/agenda", label: "Agenda & Gestão"/);

assert.match(middleware, /"\/api\/public-booking"/);
assert.doesNotMatch(
  middleware,
  /isOperationalOperatorWrite/,
  "operador não pode ganhar escrita operacional sem vínculo explícito staff→provider",
);
assert.match(professional, /canOperate/);
assert.match(professional, /appointment_status/);
assert.match(professional, /INVALID_TRANSITION/);
assert.match(professional, /appointment_payment/);
assert.match(professional, /waitlist_status/);
assert.match(professional, /review_moderate/);
assert.match(professional, /notification_status/);

for (const table of [
  "booking_provider_profiles",
  "booking_services",
  "booking_availability_rules",
  "booking_blocks",
  "appointments",
  "waitlist_entries",
  "appointment_reviews",
  "notification_outbox",
]) {
  assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
}
assert.match(migration, /ux_appointments_occupied_slot/);
assert.match(migration, /booking_token_hash TEXT NOT NULL UNIQUE/);
assert.match(core, /AES-GCM/);
assert.match(core, /neuroped-operational-v1/);
assert.match(core, /OPERATIONAL_DATA_KEY/);
assert.match(core, /sha256\(token\)/);
assert.doesNotMatch(migration, /guardian_name\s+TEXT/i, "contato do responsável não pode persistir em plaintext");
assert.doesNotMatch(migration, /guardian_phone\s+TEXT/i, "telefone não pode persistir em plaintext");
assert.doesNotMatch(migration, /patient_name\s+TEXT/i, "nome da criança não pode persistir em plaintext");

assert.match(publicBooking, /privacyAccepted/);
assert.match(publicBooking, /SLOT_CONFLICT/);
assert.match(publicBooking, /findAppointmentByToken/);
assert.match(publicBooking, /status !== "completed"/);
assert.doesNotMatch(publicBooking, /diagn[oó]stico|medica[cç][aã]o.*body/i, "booking público não deve pedir dado clínico livre");

assert.match(agenda, /WhatsApp, SMS e e-mail externos não são simulados/);
assert.match(agenda, /pending_provider/);
assert.match(booking, /Não informe diagnóstico, medicação ou detalhes clínicos/);
assert.doesNotMatch(agenda, /pagamento aprovado|pix gerado|teleconsulta ativa/i);
assert.doesNotMatch(booking, /pagamento aprovado|pix gerado|teleconsulta ativa/i);

assert.match(workflow, /0007_operational_suite\.sql/);
assert.match(workflow, /booking_provider_profiles/);
assert.match(workflow, /ux_appointments_occupied_slot/);
assert.doesNotMatch(workflow, /workflow_dispatch:/);

console.log("✓ Operational Suite: agenda, booking, criptografia, antifake e deploy versionado aprovados");
