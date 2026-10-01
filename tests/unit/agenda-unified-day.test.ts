/**
 * agenda-unified-day.test.ts — issue 1064, etapa D. Funções puras da visão unificada
 * do dia da recepção (client/src/lib/agendaUnifiedDay.ts).
 *
 * Fixtures 100% sintéticas, sem PHI.
 * Rodar: node --import tsx tests/unit/agenda-unified-day.test.ts
 */
import assert from "node:assert/strict";

import {
  UNIFIED_DAY_MAX_PROVIDERS,
  buildUnifiedDay,
  selectUnifiedProviders,
  type UnifiedDaySource,
} from "../../client/src/lib/agendaUnifiedDay";

const DAY = "2026-10-02";
const P1 = { id: "prof-1", name: "Profissional Um" };
const P2 = { id: "prof-2", name: "Profissional Dois" };
const P3 = { id: "prof-3", name: "Profissional Três" };

function appointment(providerId: string, id: string, start: string, status = "confirmed", extra: Record<string, unknown> = {}) {
  const [date, time] = start.split("T");
  const [hh, mm] = time.split(":").map(Number);
  const end = `${date}T${String(hh + 1).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  return {
    id,
    providerUserId: providerId,
    serviceId: `svc-${providerId}`,
    patientId: null,
    startsAtLocal: start,
    endsAtLocal: end,
    timezone: "America/Recife",
    status,
    source: "professional",
    guardianName: null,
    guardianEmail: null,
    guardianPhone: null,
    patientName: `Criança ${id}`,
    amountCents: null,
    paymentStatus: "pending",
    paymentMethod: null,
    checkedInAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    serviceName: "Consulta",
    ...extra,
  };
}

function dashboard(owner: string, appointments: unknown[], timezone = "America/Recife") {
  return { profile: { timezone }, access: { providerUserId: owner }, appointments } as never;
}

const ok = (choice: { id: string; name: string }, data: unknown): UnifiedDaySource => ({
  choice,
  data: data as never,
  isLoading: false,
  isError: false,
});

// ── junta, filtra o dia e ordena por horário ──────────────────────────────
{
  const day = buildUnifiedDay(DAY, [
    ok(P1, dashboard(P1.id, [appointment(P1.id, "a1", `${DAY}T10:00`), appointment(P1.id, "a2", `${DAY}T08:00`), appointment(P1.id, "a-outro-dia", "2026-10-03T08:00")])),
    ok(P2, dashboard(P2.id, [appointment(P2.id, "b1", `${DAY}T09:00`), appointment(P2.id, "b2", `${DAY}T10:00`)])),
  ]);
  assert.deepEqual(
    day.rows.map((row) => `${row.appointment.startsAtLocal.slice(11)} ${row.providerName} ${row.appointment.id}`),
    [
      "08:00 Profissional Um a2",
      "09:00 Profissional Dois b1",
      "10:00 Profissional Dois b2", // mesmo horário: desempate por nome do profissional
      "10:00 Profissional Um a1",
    ],
    "ordem por horário, depois por profissional; o outro dia fica de fora",
  );
  assert.deepEqual(day.providers, [
    { providerId: "prof-1", providerName: "Profissional Um", status: "ok", count: 2 },
    { providerId: "prof-2", providerName: "Profissional Dois", status: "ok", count: 2 },
  ]);
  assert.deepEqual(day.timezones, ["America/Recife"]);
}

// ── canceladas e faltas somem, como na grade do dia ───────────────────────
{
  const day = buildUnifiedDay(DAY, [
    ok(P1, dashboard(P1.id, [
      appointment(P1.id, "x1", `${DAY}T08:00`, "cancelled"),
      appointment(P1.id, "x2", `${DAY}T09:00`, "no_show"),
      appointment(P1.id, "x3", `${DAY}T10:00`, "completed"),
      appointment(P1.id, "x4", `${DAY}T11:00`, "requested"),
    ])),
  ]);
  assert.deepEqual(day.rows.map((row) => row.appointment.id), ["x3", "x4"], "concluída e solicitada aparecem; cancelada e falta não");
  assert.equal((day.providers[0] as { count: number }).count, 2);
}

// ── ids iguais em agendas diferentes não colidem ──────────────────────────
{
  const day = buildUnifiedDay(DAY, [
    ok(P1, dashboard(P1.id, [appointment(P1.id, "mesmo-id", `${DAY}T08:00`)])),
    ok(P2, dashboard(P2.id, [appointment(P2.id, "mesmo-id", `${DAY}T08:00`)])),
  ]);
  assert.equal(new Set(day.rows.map((row) => row.key)).size, 2, "a chave inclui o profissional");
}

// ── NUNCA rotular com o profissional errado ───────────────────────────────
{
  // O servidor devolveu a agenda de OUTRO profissional para o pedido do prof-2.
  const swapped = buildUnifiedDay(DAY, [
    ok(P1, dashboard(P1.id, [appointment(P1.id, "a1", `${DAY}T08:00`)])),
    ok(P2, dashboard(P1.id, [appointment(P1.id, "a-do-um", `${DAY}T09:00`)])),
  ]);
  assert.deepEqual(swapped.rows.map((row) => `${row.providerId}:${row.appointment.id}`), ["prof-1:a1"], "consulta do prof-1 nunca aparece sob o nome do prof-2");
  assert.deepEqual(swapped.providers[1], { providerId: "prof-2", providerName: "Profissional Dois", status: "error" }, "fonte com dono errado vira erro");

  // Dentro de uma agenda legítima, uma consulta cujo dono é outro também é descartada.
  const foreign = buildUnifiedDay(DAY, [
    ok(P1, dashboard(P1.id, [appointment(P1.id, "a1", `${DAY}T08:00`), appointment(P2.id, "intrusa", `${DAY}T09:00`)])),
  ]);
  assert.deepEqual(foreign.rows.map((row) => row.appointment.id), ["a1"], "consulta de outro dono não é rotulada com este profissional");
  assert.equal((foreign.providers[0] as { count: number }).count, 1, "e não entra na contagem");

  // Resposta sem `access` (contrato quebrado) também é erro, não um palpite.
  const broken = buildUnifiedDay(DAY, [ok(P1, { appointments: [appointment(P1.id, "a1", `${DAY}T08:00`)] })]);
  assert.equal(broken.rows.length, 0);
  assert.equal(broken.providers[0].status, "error");
}

// ── carregando, erro e o restante continua útil ───────────────────────────
{
  const day = buildUnifiedDay(DAY, [
    ok(P1, dashboard(P1.id, [appointment(P1.id, "a1", `${DAY}T08:00`)])),
    { choice: P2, data: undefined, isLoading: true, isError: false },
    { choice: P3, data: undefined, isLoading: false, isError: true },
  ]);
  assert.deepEqual(day.providers.map((p) => `${p.providerId}:${p.status}`), ["prof-1:ok", "prof-2:loading", "prof-3:error"]);
  assert.deepEqual(day.rows.map((row) => row.appointment.id), ["a1"], "a falha de um profissional não esconde os outros");
}

// ── fusos diferentes: aviso, não mistura silenciosa ───────────────────────
{
  const day = buildUnifiedDay(DAY, [
    ok(P1, dashboard(P1.id, [appointment(P1.id, "a1", `${DAY}T08:00`)], "America/Recife")),
    ok(P2, dashboard(P2.id, [appointment(P2.id, "b1", `${DAY}T08:00`, "confirmed", { timezone: "America/Manaus" })], "America/Manaus")),
  ]);
  assert.deepEqual(day.timezones, ["America/Manaus", "America/Recife"], "fusos distintos aparecem, ordenados");
}

// ── limite de profissionais ───────────────────────────────────────────────
{
  const many = Array.from({ length: 11 }, (_, index) => ({ id: `p-${index}`, name: `Prof ${index}` }));
  const { shown, hidden } = selectUnifiedProviders(many);
  assert.equal(shown.length, UNIFIED_DAY_MAX_PROVIDERS);
  assert.equal(hidden, 3);
  assert.deepEqual(shown.map((choice) => choice.id), many.slice(0, UNIFIED_DAY_MAX_PROVIDERS).map((choice) => choice.id), "mantém a ordem recebida");
  assert.deepEqual(selectUnifiedProviders([P1, P2]), { shown: [P1, P2], hidden: 0 });
  assert.deepEqual(selectUnifiedProviders(many, 0).shown.length, UNIFIED_DAY_MAX_PROVIDERS, "limite inválido volta ao padrão");
  assert.deepEqual(selectUnifiedProviders(many, 2.5).shown.length, UNIFIED_DAY_MAX_PROVIDERS, "limite não inteiro volta ao padrão");
}

// ── não muta a entrada e é determinístico ─────────────────────────────────
{
  const data = dashboard(P1.id, [appointment(P1.id, "a2", `${DAY}T10:00`), appointment(P1.id, "a1", `${DAY}T08:00`)]);
  const before = JSON.stringify(data);
  const first = buildUnifiedDay(DAY, [ok(P1, data)]);
  const second = buildUnifiedDay(DAY, [ok(P1, data)]);
  assert.equal(JSON.stringify(data), before, "a entrada não é alterada");
  assert.deepEqual(first, second);
}

console.log("agenda-unified-day: junta e ordena o dia, esconde cancelada/falta, nunca rotula com o profissional errado, erro de um não esconde os outros, aviso de fusos e limite de profissionais OK");
