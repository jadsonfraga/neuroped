import assert from "node:assert/strict";
import fs from "node:fs";

const operationsCore = fs.readFileSync(
  "functions/api/operations/_core.ts",
  "utf8",
);
const operationsApi = fs.readFileSync(
  "functions/api/operations/index.ts",
  "utf8",
);
const agenda = fs.readFileSync("client/src/pages/agenda.tsx", "utf8");

assert.match(operationsCore, /ensureDefaultBookingSetup/);
assert.match(operationsCore, /Consulta neuropediátrica/);
assert.match(operationsCore, /VALUES \(\?, \?, 'Consulta neuropediátrica', 60/);
assert.match(operationsCore, /VALUES \(\?, \?, \?, 480, 1080, 60/);
assert.match(operationsApi, /action === "create_appointment"/);
assert.match(operationsApi, /action === "update_appointment"/);
assert.match(operationsApi, /action === "appointment_status"/);
assert.match(operationsApi, /assertAppointmentSlot/);
assert.match(operationsApi, /OUTSIDE_AVAILABILITY/);
assert.match(operationsApi, /SCHEDULE_CONFLICT/);
assert.match(operationsApi, /releaseSlotLocksAfterSuccessfulMutationStatement/);
assert.match(operationsApi, /slotLockStatementsForAppointmentState/);
assert.match(operationsApi, /STALE_APPOINTMENT/);
assert.match(agenda, /Agendar por 1 hora/);
assert.match(agenda, /Editar agendamento persistente/);
assert.match(agenda, /action: "update_appointment"/);
assert.match(agenda, /action: "appointment_status"/);
assert.match(agenda, /Editar/);

console.log("agenda-booking-lifecycle-static: ok");
