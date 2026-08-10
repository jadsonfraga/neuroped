import assert from "node:assert/strict";
import {
  agendaCloudWorkspaceSchema,
  emptyAgendaCloudWorkspace,
  findAgendaWorkspaceConflicts,
  isDemoSafeAgendaWorkspace,
  type AgendaCloudWorkspace,
} from "../../shared/agenda-cloud";

const now = new Date().toISOString();

function baseWorkspace(): AgendaCloudWorkspace {
  return {
    version: 2,
    appointments: [
      {
        id: "agenda-demo-1",
        patientLabel: "Demo Paciente 1",
        date: "2026-08-10",
        startTime: "08:00",
        durationMinutes: 60,
        visitType: "primeira-consulta",
        status: "agendado",
        createdAt: now,
        updatedAt: now,
      },
    ],
    blocks: [
      {
        id: "block-demo-1",
        date: "2026-08-10",
        startTime: "12:00",
        endTime: "13:00",
        label: "Demo almoço",
        createdAt: now,
      },
    ],
    waitlist: [
      {
        id: "wait-demo-1",
        patientLabel: "Fictício Paciente 2",
        visitType: "retorno",
        preferredPeriod: "tarde",
        status: "aguardando",
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

const clean = baseWorkspace();
assert.equal(agendaCloudWorkspaceSchema.safeParse(clean).success, true, "workspace válida deve passar");
assert.equal(findAgendaWorkspaceConflicts(clean).length, 0, "workspace válida não deve ter conflito");
assert.equal(isDemoSafeAgendaWorkspace(clean), true, "workspace fictícia deve ser aceita no backend DEMO");

const conflict = baseWorkspace();
conflict.appointments.push({
  ...conflict.appointments[0],
  id: "agenda-demo-2",
  startTime: "08:30",
});
assert.equal(findAgendaWorkspaceConflicts(conflict).length > 0, true, "sobreposição deve ser detectada");
assert.equal(agendaCloudWorkspaceSchema.safeParse(conflict).success, false, "snapshot com conflito não pode ser salvo");

const blockConflict = baseWorkspace();
blockConflict.appointments.push({
  ...blockConflict.appointments[0],
  id: "agenda-demo-3",
  startTime: "12:15",
  durationMinutes: 30,
});
assert.equal(agendaCloudWorkspaceSchema.safeParse(blockConflict).success, false, "consulta sobre bloqueio deve falhar");

const duplicate = baseWorkspace();
duplicate.waitlist.push({
  ...duplicate.waitlist[0],
  id: duplicate.appointments[0].id,
});
assert.equal(agendaCloudWorkspaceSchema.safeParse(duplicate).success, false, "IDs duplicados entre coleções devem falhar");

const real = baseWorkspace();
real.appointments[0] = {
  ...real.appointments[0],
  patientLabel: "Maria Silva",
};
assert.equal(isDemoSafeAgendaWorkspace(real), false, "nome real não pode ser enviado ao Cloudflare DEMO");

const demoWithClinicalNote = baseWorkspace();
demoWithClinicalNote.appointments[0] = {
  ...demoWithClinicalNote.appointments[0],
  operationalNote: "diagnóstico X",
};
assert.equal(isDemoSafeAgendaWorkspace(demoWithClinicalNote), false, "notas livres não entram no backend DEMO");

assert.deepEqual(emptyAgendaCloudWorkspace(), {
  version: 2,
  appointments: [],
  blocks: [],
  waitlist: [],
});

console.log("✓ Agenda Cloud v2: conflitos, IDs e isolamento DEMO aprovados");
