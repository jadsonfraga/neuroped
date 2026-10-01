/**
 * Mensagens de erro e rótulos que a família e a equipe leem: sempre em português,
 * nunca o erro cru (`Error: 409: {...}`) nem o identificador interno
 * (`requested`, `checked_in`, `booking_requested`).
 *
 * Fixtures 100% sintéticas, sem PHI.
 * Rodar: node --import tsx tests/unit/user-facing-labels.test.ts
 */
import assert from "node:assert/strict";

import { errorStatus, userFacingErrorMessage } from "../../client/src/lib/apiErrorMessage";
import {
  appointmentStatusLabel,
  appointmentStatuses,
  notificationTemplateLabel,
  waitlistStatusLabel,
  waitlistStatuses,
} from "../../shared/operations";

// ── userFacingErrorMessage ────────────────────────────────────────────────
const FALLBACK = "Tente novamente em instantes.";
{
  // `apiRequest` lança Error("<status>: <corpo>") com o JSON do servidor.
  const conflict = new Error(`409: ${JSON.stringify({ error: "Novo horário indisponível.", code: "SLOT_UNAVAILABLE" })}`);
  assert.equal(userFacingErrorMessage(conflict, FALLBACK), "Novo horário indisponível.", "usa a mensagem do servidor");

  const withStatus = Object.assign(new Error(`429: ${JSON.stringify({ error: "Muitas requisições. Aguarde antes de tentar novamente.", code: "RATE_LIMIT_EXCEEDED" })}`), { status: 429 });
  assert.equal(userFacingErrorMessage(withStatus, FALLBACK), "Muitas requisições. Aguarde antes de tentar novamente.");

  // Corpo que não é JSON do servidor: nunca o texto cru.
  for (const body of ["500: Internal Server Error", "502: <html><body>Bad Gateway {x}</body></html>", "404: ", "Error: algo"]) {
    const message = userFacingErrorMessage(new Error(body), FALLBACK);
    assert.equal(message, FALLBACK, `corpo ${JSON.stringify(body)} vira o texto de reserva`);
    assert.ok(!/Error|\{|<html|\d{3}:/.test(message), "nada de erro técnico na tela");
  }

  // `error` ausente, não textual ou longo demais: reserva.
  assert.equal(userFacingErrorMessage(new Error('400: {"code":"X"}'), FALLBACK), FALLBACK);
  assert.equal(userFacingErrorMessage(new Error('400: {"error":{"a":1}}'), FALLBACK), FALLBACK);
  assert.equal(userFacingErrorMessage(new Error(`400: ${JSON.stringify({ error: "x".repeat(301) })}`), FALLBACK), FALLBACK, "mensagem enorme não vai para a tela");
  assert.equal(userFacingErrorMessage(new Error('400: {"error":"   "}'), FALLBACK), FALLBACK);

  // Falha de rede.
  for (const failure of [new TypeError("Failed to fetch"), new TypeError("Load failed"), new TypeError("NetworkError when attempting to fetch resource.")]) {
    assert.match(userFacingErrorMessage(failure, FALLBACK), /Sem conexão com o servidor/, failure.message);
  }
  // Erro HTTP sem corpo útil NÃO é falha de rede.
  assert.equal(userFacingErrorMessage(Object.assign(new Error("503: "), { status: 503 }), FALLBACK), FALLBACK);

  // Valores que não são Error.
  assert.equal(userFacingErrorMessage('{"error":"Texto simples."}', FALLBACK), "Texto simples.");
  assert.equal(userFacingErrorMessage(undefined, FALLBACK), FALLBACK);
  assert.equal(userFacingErrorMessage(null, FALLBACK), FALLBACK);
  assert.equal(userFacingErrorMessage(42, FALLBACK), FALLBACK);
}

// ── errorStatus ───────────────────────────────────────────────────────────
{
  assert.equal(errorStatus(Object.assign(new Error("whatever"), { status: 404 })), 404, "propriedade status");
  assert.equal(errorStatus(new Error('404: {"error":"x"}')), 404, "prefixo do texto");
  assert.equal(errorStatus(new Error("sem status")), null);
  assert.equal(errorStatus(new TypeError("Failed to fetch")), null);
  assert.equal(errorStatus(undefined), null);
}

// ── Estados do agendamento ────────────────────────────────────────────────
{
  assert.deepEqual(Object.keys(appointmentStatusLabel).sort(), [...appointmentStatuses].sort(), "todo estado tem rótulo");
  for (const status of appointmentStatuses) {
    const label = appointmentStatusLabel[status];
    assert.ok(label && !label.includes("_") && label === label.toLowerCase(), `${status} → ${label}`);
    assert.notEqual(label, status);
  }
  assert.equal(appointmentStatusLabel.requested, "solicitada");
  assert.equal(appointmentStatusLabel.no_show, "faltou");
}

// ── Estados da lista de espera ────────────────────────────────────────────
{
  assert.deepEqual(Object.keys(waitlistStatusLabel).sort(), [...waitlistStatuses].sort());
  for (const status of waitlistStatuses) {
    assert.ok(waitlistStatusLabel[status] && waitlistStatusLabel[status] !== status, `${status} → ${waitlistStatusLabel[status]}`);
  }
  assert.equal(waitlistStatusLabel.waiting, "aguardando");
  assert.equal(waitlistStatusLabel.offered, "horário oferecido");
}

// ── Modelos de mensagem ───────────────────────────────────────────────────
{
  for (const template of ["booking_requested", "booking_cancelled", "booking_rescheduled", "appointment_created", "appointment_rescheduled"]) {
    const label = notificationTemplateLabel(template);
    assert.ok(label !== template && !label.includes("_"), `${template} → ${label}`);
  }
  // Um modelo por estado: `appointment_${status}` (functions/api/operations/index.ts).
  for (const status of appointmentStatuses) {
    const label = notificationTemplateLabel(`appointment_${status}`);
    assert.ok(!label.includes("_") && !label.startsWith("appointment"), `appointment_${status} → ${label}`);
  }
  assert.equal(notificationTemplateLabel("appointment_checked_in"), "Consulta: check-in");
  assert.equal(notificationTemplateLabel("appointment_confirmed"), "Consulta: confirmada");
  assert.equal(notificationTemplateLabel("modelo_desconhecido"), "modelo_desconhecido", "desconhecido volta como veio");
  assert.equal(notificationTemplateLabel("appointment_inventado"), "appointment_inventado");
}

console.log("user-facing-labels: erro sempre em português (servidor, rede ou reserva), nunca cru; estados do agendamento, da espera e modelos de mensagem com rótulo completo OK");
