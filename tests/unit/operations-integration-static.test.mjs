import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const app = read("client/src/App.tsx");
const nav = read("client/src/data/navigation.ts");
const routeGuard = read("client/src/components/RouteGuard.tsx");
const middleware = read("functions/api/_middleware.ts");
const professional = read("functions/api/operations/index.ts");
const access = read("functions/api/operations/_access.ts");
const publicBooking = read("functions/api/public-booking.ts");
const core = read("functions/api/operations/_core.ts");
const sharedOperations = read("shared/operations.ts");
const migration = read("db/migrations/0007_operational_suite.sql");
const hardeningMigration = read("db/migrations/0008_operational_hardening.sql");
const agenda = read("client/src/pages/agenda.tsx");
const recepcao = read("client/src/pages/recepcao.tsx");
const booking = read("client/src/pages/agendar.tsx");
const workflow = read(".github/workflows/operations-d1-migration.yml");

assert.match(app, /import\("@\/pages\/agenda"\)/);
assert.match(app, /import\("@\/pages\/agendar"\)/);
assert.match(app, /path="\/agenda"/);
assert.match(app, /path="\/agendar"/);
assert.match(nav, /href: "\/agenda", label: "Agenda & Gestão"/);

assert.match(middleware, /"\/api\/public-booking"/);
assert.match(
  middleware,
  /user\.role === "operator" && path === "\/api\/operations" && method === "POST"/,
  "operator deve ter exceção somente no endpoint operacional raiz",
);
assert.doesNotMatch(
  middleware,
  /user\.role === "operator"[\s\S]{0,180}path\.startsWith/,
  "operator não pode ganhar wildcard de escrita",
);
assert.match(professional, /role === "operator"/);
assert.match(professional, /STAFF_LINK_REQUIRED/);
assert.match(professional, /resolveOperationsPrincipal/);
assert.match(professional, /principal\.canConfigure/);
assert.match(professional, /appointment_status/);
assert.match(professional, /INVALID_TRANSITION/);
assert.match(professional, /appointment_payment/);
assert.match(professional, /waitlist_status/);
assert.match(professional, /review_moderate/);
assert.match(professional, /notification_status/);
assert.match(professional, /logOperationsAudit/);
assert.match(professional, /localNow\(profile\.timezone\)/, "métricas devem respeitar fuso da agenda");
assert.match(professional, /isValidTimeZone\(timezone\)/, "perfil não pode persistir timezone IANA inválido");
assert.ok(
  (professional.match(/meta\?\.changes/g) ?? []).length >= 6,
  "mutações por ID devem confirmar linha afetada antes de retornar sucesso/auditar",
);
assert.match(professional, /amountCents: null/, "financeiro de consulta deve ser redigido para recepção");
assert.match(
  professional,
  /fullServices\.map\(\(item\) => \(\{ \.\.\.item, priceCents: null \}\)\)/,
  "preço dos serviços deve ser redigido para recepção",
);
assert.match(
  professional,
  /const patientId = principal\.delegated \? null : cleanOptionalText\(body\.patientId, 100\)/,
  "recepção não pode associar agendamento diretamente a identificador clínico",
);
assert.match(professional, /STAFF_ALREADY_LINKED/, "API deve expor erro explícito de vínculo já pertencente a outro profissional");
assert.match(professional, /SCHEDULE_CONFLICT/, "API privada deve converter conflito físico de agenda em 409");
assert.match(professional, /reviews: principal\.canConfigure \? fullReviews : \[\]/, "recepção não deve receber reviews privados");

assert.match(access, /booking_staff_links/);
assert.match(access, /staff_user_id TEXT NOT NULL UNIQUE/);
assert.match(access, /user\.role !== "operator"/);
assert.match(
  access,
  /l\.staff_user_id = \? AND l\.active = 1/,
  "contexto do operador deve ser resolvido pelo vínculo ativo do próprio staff_user_id",
);
assert.match(access, /getExistingStaffOwner/);
assert.match(access, /STAFF_ALREADY_LINKED/);
assert.match(
  access,
  /existing && existing\.provider_user_id !== principal\.providerUserId/,
  "profissional não pode reassumir operador já pertencente a outro contexto",
);
assert.doesNotMatch(
  access,
  /ON CONFLICT\(staff_user_id\) DO UPDATE SET[\s\S]{0,240}provider_user_id = excluded\.provider_user_id/,
  "vínculo de recepção não pode reatribuir provider em UPSERT",
);
assert.match(access, /trg_appointments_respect_blocks_insert/);
assert.match(access, /trg_blocks_respect_appointments_insert/);
assert.match(access, /RAISE\(ABORT, 'SCHEDULE_CONFLICT'\)/);
assert.match(access, /role !== "operator"/);
assert.match(access, /safeAuditMetadata/);
assert.doesNotMatch(access, /guardianName|patientName|phone|email.*metadata/i, "auditoria não deve copiar PII operacional");

for (const table of [
  "booking_provider_profiles",
  "booking_services",
  "booking_availability_rules",
  "booking_blocks",
  "appointments",
  "appointment_slot_locks",
  "waitlist_entries",
  "appointment_reviews",
  "notification_outbox",
]) {
  assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
}
assert.match(hardeningMigration, /CREATE TABLE IF NOT EXISTS booking_staff_links/);
assert.match(hardeningMigration, /staff_user_id TEXT NOT NULL UNIQUE/);
assert.match(hardeningMigration, /CREATE TABLE IF NOT EXISTS operations_audit_log/);
assert.match(hardeningMigration, /idx_operations_audit_provider_time/);
assert.match(hardeningMigration, /idx_operations_audit_actor_time/);
for (const trigger of [
  "trg_appointments_respect_blocks_insert",
  "trg_appointments_respect_blocks_update",
  "trg_blocks_respect_appointments_insert",
  "trg_blocks_respect_appointments_update",
]) {
  assert.match(hardeningMigration, new RegExp(`CREATE TRIGGER IF NOT EXISTS ${trigger}`));
  assert.match(workflow, new RegExp(trigger));
}
assert.match(hardeningMigration, /RAISE\(ABORT, 'SCHEDULE_CONFLICT'\)/);

assert.match(migration, /ux_appointments_occupied_slot/);
assert.match(migration, /PRIMARY KEY \(provider_user_id, slot_key\)/);
assert.match(core, /slotLockStatements/);
assert.match(core, /releaseSlotLocksStatement/);
assert.match(core, /Promise<boolean>/);
assert.match(core, /operations\.notification-outbox/);
assert.match(professional, /env\.DB\.batch/);
assert.match(publicBooking, /env\.DB\.batch/);
assert.match(publicBooking, /ensureOperationsHardeningSchema/);
assert.match(publicBooking, /SCHEDULE_CONFLICT/);
assert.match(publicBooking, /selectFutureSlots/);
assert.match(publicBooking, /isValidLocalDate\(preferredDate\)/);
assert.doesNotMatch(core, /return slots\.slice\(0, 96\)/, "cap de slots não pode ocorrer antes do filtro de horários passados");
assert.match(sharedOperations, /date\.getUTCFullYear\(\) === year/);
assert.match(sharedOperations, /hour >= 0 && hour <= 23/);
assert.doesNotMatch(publicBooking, /searchParams\.get\("token"\)/, "capability token não pode trafegar em query string");
assert.match(publicBooking, /action === "manage"/);
assert.match(booking, /apiRequest\("POST", "\/api\/public-booking", \{ action: "manage"/);
assert.match(booking, /rescheduleBooking/);
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

assert.match(routeGuard, /path !== "\/agenda"/);
assert.match(routeGuard, /roles\.includes\("operator"\)/);
assert.match(routeGuard, /\.\.\.roles, "operator"/);
assert.match(agenda, /data\.access\.canConfigure/);
assert.match(agenda, /Recepção vinculada/);
assert.match(agenda, /action: "staff_link"/);
assert.match(agenda, /Trilha operacional/);
assert.match(agenda, /WhatsApp, SMS e e-mail externos não são simulados/);
assert.match(agenda, /pending_provider/);
assert.doesNotMatch(agenda, /pagamento aprovado|pix gerado|teleconsulta ativa/i);

assert.doesNotMatch(recepcao, /<AgendaBoard\s*\/>/, "Recepção não pode manter segunda agenda editável");
assert.doesNotMatch(recepcao, /import \{ AgendaBoard \}/, "agenda local antiga não deve ser renderizada na Recepção");
assert.match(recepcao, /Agenda oficial: Agenda & Gestão/);
assert.match(recepcao, /href="\/agenda"/);

assert.match(booking, /Não informe diagnóstico, medicação ou detalhes clínicos/);
assert.doesNotMatch(booking, /pagamento aprovado|pix gerado|teleconsulta ativa/i);

assert.match(workflow, /0007_operational_suite\.sql/);
assert.match(workflow, /0008_operational_hardening\.sql/);
assert.match(workflow, /booking_provider_profiles/);
assert.match(workflow, /ux_appointments_occupied_slot/);
assert.doesNotMatch(workflow, /workflow_dispatch:/);

console.log("✓ Operational Suite hardening: fonte única, equipe, RBAC, anti-sequestro, finanças/clinical boundary, conflitos físicos, auditoria, fuso, PII e locks aprovados");