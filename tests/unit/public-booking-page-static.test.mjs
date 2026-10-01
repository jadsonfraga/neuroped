/**
 * Contrato estático das telas que a família e a equipe leem: página pública de
 * agendamento, aba Espera/Comunicação da agenda e visão do dia. O comportamento
 * das funções está em tests/unit/user-facing-labels.test.ts; aqui fica o que não
 * pode voltar no código: erro cru na tela, estado em inglês, lista de horários
 * obsoleta depois de reservar.
 *
 * Rodar: node tests/unit/public-booking-page-static.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const strip = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const booking = strip(read("client/src/pages/agendar.tsx"));
const agenda = strip(read("client/src/pages/agenda.tsx"));
const unifiedDay = strip(read("client/src/components/AgendaUnifiedDay.tsx"));

// ── Página pública: erro nunca cru ────────────────────────────────────────
assert.doesNotMatch(booking, /description:\s*String\(err\)/, "toast não pode mostrar String(err) (JSON cru do servidor)");
assert.doesNotMatch(booking, /function serverMessage\(/, "um único auxiliar de mensagem de erro (lib/apiErrorMessage)");
assert.match(booking, /import \{ errorStatus, userFacingErrorMessage \} from "@\/lib\/apiErrorMessage"/);
const toasts = booking.match(/variant: "destructive"/g) ?? [];
const viaHelper = booking.match(/description: userFacingErrorMessage\(err, /g) ?? [];
assert.ok(toasts.length >= 8, "a página tem os toasts de erro esperados");
assert.equal(
  viaHelper.length,
  toasts.length - 1,
  "todo toast de erro usa o auxiliar, exceto o de reserva não encontrada (texto fixo)",
);

// "Reserva não encontrada" só com 404: falha de rede ou 5xx não pode sugerir que a reserva sumiu.
assert.match(booking, /if \(errorStatus\(err\) === 404\) \{[\s\S]{0,200}Reserva não encontrada\./);
assert.match(booking, /Não foi possível consultar a reserva agora\./);

// Estado em português e com data na remarcação.
assert.match(booking, /appointmentStatusLabel\[managed\.status\] \?\? managed\.status/, "estado da reserva em português");
assert.doesNotMatch(booking, /<Badge variant="outline">\{managed\.status\}<\/Badge>/, "estado cru em inglês não vai à tela");
assert.match(booking, /Remarcar para \{displayLocal\(slot\.startsAtLocal\)\}/, "o botão diz a data, não só a hora");
assert.doesNotMatch(booking, /Remarcar para \{slot\.startsAtLocal\.slice\(11\)\}/);

// Depois de reservar ou remarcar, o horário usado sai da lista e da seleção.
const afterBooking = booking.slice(booking.indexOf("async function submitBooking"), booking.indexOf("async function manageBooking"));
assert.match(afterBooking, /setSlots\(\(current\) => current\.filter\(\(item\) => item\.startsAtLocal !== slot\.startsAtLocal\)\);\s*setSlot\(null\);/, "reserva remove o horário usado");
const afterReschedule = booking.slice(booking.indexOf("async function rescheduleBooking"), booking.indexOf("async function cancelBooking"));
assert.match(afterReschedule, /setSlots\(\(current\) => current\.filter\(\(item\) => item\.startsAtLocal !== slot\.startsAtLocal\)\);\s*setSlot\(null\);/, "remarcação remove o horário usado");

// ── Agenda interna: estados em português ──────────────────────────────────
assert.match(agenda, /appointmentStatusLabel as statusLabel/, "um único mapa de estados (shared/operations)");
assert.doesNotMatch(agenda, /const statusLabel: Record</, "sem cópia local do mapa de estados");
assert.match(agenda, /waitlistStatusLabel\[item\.status\] \?\? item\.status/, "lista de espera em português");
assert.doesNotMatch(agenda, /<Badge variant="outline">\{item\.status\}<\/Badge>/, "estado cru da espera não vai à tela");
assert.match(agenda, /notificationTemplateLabel\(item\.template\)/, "modelo da mensagem em português");
assert.doesNotMatch(agenda, />\{item\.template\}</, "identificador interno do modelo não vai à tela");

// ── Visão do dia usa o mesmo mapa ─────────────────────────────────────────
assert.match(unifiedDay, /appointmentStatusLabel as statusLabel/);
assert.doesNotMatch(unifiedDay, /const statusLabel: Record</, "sem cópia local do mapa na visão do dia");

console.log("public-booking-page-static: erro nunca cru, 'não encontrada' só com 404, estados e modelos em português, horário usado sai da lista OK");
