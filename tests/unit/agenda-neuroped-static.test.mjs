import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const core = read("client/src/lib/agendaCore.ts");
const board = read("client/src/components/agenda/AgendaBoard.tsx");
const reception = read("client/src/pages/recepcao.tsx");
const operational = read("client/src/pages/agenda.tsx");

// O legado local é mantido para leitura/migração segura e não é apagado em massa.
assert.match(core, /persistentSecureGet/, "agenda local legada deve continuar legível no cofre cifrado");
assert.match(core, /persistentSecureSet/, "módulo legado preserva compatibilidade de escrita fora da Recepção");
assert.doesNotMatch(core, /localStorage|sessionStorage/, "legado não deve persistir diretamente em storage em texto/plain envelope próprio");
assert.match(core, /findAppointmentConflicts/, "motor legado mantém detecção explícita de conflitos");
assert.match(core, /findBlockConflicts/, "bloqueios continuam testados no motor legado");
assert.match(core, /SUMMARY:Consulta NeuroPed/, "arquivo ICS legado deve usar título neutro");
assert.doesNotMatch(core, /SUMMARY:.*patientLabel|DESCRIPTION:.*patientLabel/, "ICS legado não deve incorporar identificação do paciente");

// A UI antiga permanece no código somente como compatibilidade, mas não pode
// competir com a Operational Suite como fonte editável na Recepção.
assert.match(board, /Agenda NeuroPed/, "componente legado deve continuar identificável para migração controlada");
assert.doesNotMatch(reception, /<AgendaBoard\s*\/>/, "Recepção não pode renderizar uma segunda agenda editável");
assert.doesNotMatch(reception, /import \{ AgendaBoard \}/, "Recepção não deve importar a agenda local legada");
assert.match(reception, /Agenda oficial: Agenda & Gestão/, "Recepção deve apontar para a fonte cloud oficial");
assert.match(reception, /href="\/agenda"/, "Recepção deve abrir a Operational Suite");

assert.match(operational, /Agenda & Gestão/, "Operational Suite deve ser a agenda visível oficial");
assert.match(operational, /Lista de espera/, "lista de espera cloud deve existir");
assert.match(operational, /pending_provider/, "comunicação sem provedor externo deve permanecer honesta");
assert.match(operational, /WhatsApp, SMS e e-mail externos não são simulados/, "UI deve negar automações externas não implementadas");
assert.match(operational, /data\.access\.canConfigure/, "agenda oficial deve adaptar ações ao papel do usuário");

console.log("✓ Agenda NeuroPed: legado cifrado preservado e Operational Suite como fonte única aprovados");
