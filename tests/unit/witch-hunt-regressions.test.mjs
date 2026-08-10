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

console.log("✓ caça a bugs: corridas e fail-open administrativos protegidos");
