import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const cfConecta = read("functions/api/conecta/[id].ts");
const exConecta = read("server/routes/conecta.ts");
const access = read("functions/api/operations/_access.ts");
const operations = read("functions/api/operations/index.ts");
const auditLog = read("functions/api/audit-log.ts");

assert.match(cfConecta, /deletion\.meta\?\.changes[\s\S]*NOT_FOUND/, "Conecta D1 deve confirmar remoção real");
assert.match(exConecta, /deletion\.changes !== 1[\s\S]*NOT_FOUND/, "Conecta Express deve confirmar remoção real");
assert.match(access, /update\.meta\?\.changes[\s\S]*seguimos para[\s\S]*INSERT/, "vínculo staff deve sobreviver à corrida SELECT→UPDATE");
assert.match(operations, /UPDATE booking_provider_profiles[\s\S]{0,700}update\.meta\?\.changes/, "perfil deve confirmar linha atualizada");
assert.match(operations, /UPDATE booking_services[\s\S]{0,700}update\.meta\?\.changes/, "serviço deve confirmar linha atualizada");
assert.doesNotMatch(auditLog, /DEMO_LOGS|Log de auditoria simulado/, "audit-log admin não pode degradar para fixture pública");

const publicBooking = read("functions/api/public-booking.ts");
const core = read("functions/api/operations/_core.ts");
assert.match(core, /changes\(\) = 1/, "liberação de locks deve depender da mutação imediatamente anterior");
assert.match(publicBooking, /cancelResults\[0\][\s\S]{0,300}STALE_APPOINTMENT/, "cancelamento público deve detectar corrida de estado");
assert.match(publicBooking, /rescheduleResults\[0\][\s\S]{0,300}STALE_APPOINTMENT/, "remarcação pública deve detectar corrida de estado");
assert.match(publicBooking, /WHERE id = \? AND status = \? AND starts_at_local = \? AND ends_at_local = \?/, "mutações públicas devem comparar o estado lido");
assert.match(publicBooking, /slotLockStatementsForAppointmentState/, "remarcação deve readquirir locks somente para o estado efetivamente gravado");
assert.match(operations, /transitionResults\[0\][\s\S]{0,300}STALE_APPOINTMENT/, "transição profissional deve rejeitar leitura obsoleta");

console.log("✓ caça a bugs: corridas e fail-open administrativos protegidos");
