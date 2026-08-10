import assert from "node:assert/strict";
import {
  buildAppointmentReminder,
  buildPrivateAppointmentIcs,
  findAppointmentConflicts,
  findBlockConflicts,
  type AgendaAppointment,
  type AgendaBlock,
  type AgendaWorkspace,
} from "../../client/src/lib/agendaCore";

const appointment: AgendaAppointment = {
  id: "agenda-existing",
  patientLabel: "Paciente-001",
  guardianLabel: "Responsável-001",
  date: "2026-08-10",
  startTime: "09:00",
  durationMinutes: 60,
  visitType: "retorno",
  status: "confirmado",
  operationalNote: "Chegar 10 min antes",
  createdAt: "2026-08-10T09:00:00.000Z",
  updatedAt: "2026-08-10T09:00:00.000Z",
};

const block: AgendaBlock = {
  id: "block-lunch",
  date: "2026-08-10",
  startTime: "12:00",
  endTime: "13:00",
  label: "Intervalo",
  createdAt: "2026-08-10T09:00:00.000Z",
};

const workspace: AgendaWorkspace = {
  version: 1,
  appointments: [appointment],
  blocks: [block],
  waitlist: [],
};

assert.equal(
  findAppointmentConflicts(
    { id: "new-overlap", date: "2026-08-10", startTime: "09:30", durationMinutes: 30, status: "agendado" },
    workspace,
  ).length,
  1,
  "agenda deve detectar sobreposição entre consultas",
);

assert.equal(
  findAppointmentConflicts(
    { id: "new-free", date: "2026-08-10", startTime: "10:00", durationMinutes: 30, status: "agendado" },
    workspace,
  ).length,
  0,
  "horário adjacente sem sobreposição deve permanecer disponível",
);

assert.equal(
  findAppointmentConflicts(
    { id: "new-blocked", date: "2026-08-10", startTime: "12:30", durationMinutes: 30, status: "agendado" },
    workspace,
  )[0]?.kind,
  "block",
  "agenda deve impedir consulta dentro de bloqueio",
);

assert.equal(
  findBlockConflicts(
    { id: "block-overlap", date: "2026-08-10", startTime: "09:30", endTime: "10:30" },
    workspace,
  )[0]?.kind,
  "appointment",
  "bloqueio deve respeitar consultas já existentes",
);

const ics = buildPrivateAppointmentIcs(appointment);
assert.match(ics, /SUMMARY:Consulta NeuroPed/);
assert.match(ics, /DTSTART;TZID=America\/Recife:20260810T090000/);
assert.doesNotMatch(ics, /Paciente-001|Responsável-001|Chegar 10 min antes/);
assert.match(ics, /Dados clínicos e identificação do paciente não foram incluídos/);

const reminder = buildAppointmentReminder(appointment);
assert.match(reminder, /Paciente-001/);
assert.match(reminder, /10\/08\/2026/);
assert.match(reminder, /09:00/);

console.log("✓ Agenda NeuroPed: conflitos, bloqueios, lembrete manual e .ics privado aprovados");
