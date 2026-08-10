import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const core = read("client/src/lib/agendaCore.ts");
const board = read("client/src/components/agenda/AgendaBoard.tsx");
const reception = read("client/src/pages/recepcao.tsx");

assert.match(core, /persistentSecureGet/, "agenda deve ler de armazenamento persistente cifrado");
assert.match(core, /persistentSecureSet/, "agenda deve gravar em armazenamento persistente cifrado");
assert.doesNotMatch(core, /localStorage|sessionStorage/, "agenda não deve persistir diretamente em storage em texto/plain envelope próprio");
assert.match(core, /findAppointmentConflicts/, "agenda deve ter detecção explícita de conflitos");
assert.match(core, /findBlockConflicts/, "bloqueios devem participar da detecção de conflitos");
assert.match(core, /SUMMARY:Consulta NeuroPed/, "arquivo ICS deve usar título neutro");
assert.doesNotMatch(core, /SUMMARY:.*patientLabel|DESCRIPTION:.*patientLabel/, "ICS não deve incorporar identificação do paciente");

assert.match(board, /Agenda NeuroPed/, "painel operacional de agenda deve estar explícito");
assert.match(board, /Lista de espera \/ encaixes/, "lista de espera deve existir");
assert.match(board, /Bloqueios de agenda/, "bloqueios de agenda devem existir");
assert.match(board, /Copiar lembrete/, "lembrete deve ser ação manual verificável");
assert.match(board, /Exportar \.ics/, "exportação de calendário deve existir");
assert.match(board, /Não há envio automático de WhatsApp\/SMS/, "UI deve negar automações de mensagem não implementadas");
assert.match(board, /sem sincronização automática com servidor/, "UI deve declarar limitação de persistência local");
assert.match(board, /Não registre diagnóstico, medicação, laudo ou informação clínica sensível/, "UI deve separar agenda operacional do prontuário clínico");
assert.match(reception, /<AgendaBoard \/>/, "agenda deve integrar a Recepção existente em vez de criar prontuário paralelo");

console.log("✓ Agenda NeuroPed static contract: escopo operacional, privacidade e honestidade aprovados");
