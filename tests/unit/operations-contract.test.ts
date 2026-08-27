import assert from "node:assert/strict";
import {
  addMinutesLocal,
  appointmentSlotKeys,
  appointmentStatuses,
  bookingModalities,
  formatMoneyBRL,
  isValidLocalDate,
  isValidLocalDateTime,
  isValidTimeZone,
  minutesToClock,
  occupiesSchedule,
  overlapsLocal,
  selectFutureSlots,
} from "../../shared/operations";
import { validSlug } from "../../functions/api/operations/_core";
import { resolveOperationsPrincipal } from "../../functions/api/operations/_access";

assert.deepEqual(bookingModalities, ["in_person", "remote"]);
assert.ok(appointmentStatuses.includes("checked_in"));
assert.ok(appointmentStatuses.includes("no_show"));

assert.equal(isValidLocalDate("2026-08-10"), true);
assert.equal(isValidLocalDate("2024-02-29"), true, "ano bissexto válido");
assert.equal(isValidLocalDate("2026-02-29"), false, "dia inexistente deve falhar");
assert.equal(isValidLocalDate("2026-04-31"), false, "mês de 30 dias não aceita dia 31");
assert.equal(isValidLocalDate("2026-13-01"), false, "mês impossível deve falhar");
assert.equal(isValidLocalDate("10/08/2026"), false);
assert.equal(isValidLocalDateTime("2026-08-10T08:30"), true);
assert.equal(isValidLocalDateTime("2026-02-29T08:30"), false);
assert.equal(isValidLocalDateTime("2026-08-10T24:00"), false);
assert.equal(isValidLocalDateTime("2026-08-10T23:60"), false);
assert.equal(isValidLocalDateTime("2026-08-10 08:30"), false);
assert.equal(isValidTimeZone("America/Recife"), true);
assert.equal(isValidTimeZone("Mars/Olympus"), false);
assert.equal(validSlug("a"), true);
assert.equal(validSlug("ab"), true, "slug de dois caracteres não pode ser rejeitado");
assert.equal(validSlug("a-"), false);
assert.equal(minutesToClock(0), "00:00");
assert.equal(minutesToClock(510), "08:30");
assert.equal(addMinutesLocal("2026-08-10T23:45", 30), "2026-08-11T00:15");
assert.equal(overlapsLocal("2026-08-10T08:00", "2026-08-10T09:00", "2026-08-10T08:30", "2026-08-10T09:30"), true);
assert.equal(overlapsLocal("2026-08-10T08:00", "2026-08-10T09:00", "2026-08-10T09:00", "2026-08-10T10:00"), false);
assert.equal(occupiesSchedule("requested"), true);
assert.equal(occupiesSchedule("completed"), false);
assert.deepEqual(appointmentSlotKeys("2026-08-10T08:00", "2026-08-10T08:20"), [
  "2026-08-10T08:00",
  "2026-08-10T08:05",
  "2026-08-10T08:10",
  "2026-08-10T08:15",
]);
assert.deepEqual(appointmentSlotKeys("2026-08-10T08:01", "2026-08-10T08:06"), [
  "2026-08-10T08:00",
  "2026-08-10T08:05",
]);
const manySlots = Array.from({ length: 140 }, (_, index) => {
  const startsAtLocal = addMinutesLocal("2026-08-10T08:00", index * 5);
  return { startsAtLocal, endsAtLocal: addMinutesLocal(startsAtLocal, 30) };
});
const lateDaySlots = selectFutureSlots(manySlots, "2026-08-10T16:00", 20);
assert.equal(lateDaySlots.length, 20, "cap deve ser aplicado depois de remover horários passados");
assert.equal(lateDaySlots[0].startsAtLocal, "2026-08-10T16:05");
assert.deepEqual(
  selectFutureSlots([manySlots[100], manySlots[100]], "2026-08-10T16:00"),
  [manySlots[100]],
  "regras de disponibilidade sobrepostas não devem duplicar o mesmo horário público",
);
assert.match(formatMoneyBRL(50000), /500/);

const professional = {
  id: "professional-actor",
  email: "professional@example.test",
  name: "Profissional",
  role: "professional",
  mustChangePassword: false,
};
const linkedDb = {
  prepare: () => ({
    bind: () => ({
      first: async () => ({
        provider_user_id: "inviting-provider",
        provider_name: "Profissional responsável",
        provider_role: "professional",
        is_active: 1,
      }),
    }),
  }),
} as unknown as D1Database;
const unlinkedDb = {
  prepare: () => ({ bind: () => ({ first: async () => null }) }),
} as unknown as D1Database;

function clinicScopedDb(
  membershipRole: string | null,
  providerInClinic = true,
): D1Database {
  return {
    prepare: (sql: string) => ({
      bind: (..._values: unknown[]) => ({
        first: async () => {
          if (sql.includes("FROM clinic_memberships") && !sql.includes("JOIN clinic_memberships")) {
            return membershipRole ? { role: membershipRole } : null;
          }
          if (sql.includes("JOIN clinic_memberships provider_membership")) {
            return providerInClinic
              ? {
                  provider_user_id: "provider-clinic-b",
                  provider_name: "Profissional B",
                  provider_role: "professional",
                  is_active: 1,
                }
              : null;
          }
          return null;
        },
      }),
    }),
  } as unknown as D1Database;
}

assert.deepEqual(
  await resolveOperationsPrincipal(linkedDb, professional),
  {
    actorUserId: "professional-actor",
    actorRole: "professional",
    providerUserId: "inviting-provider",
    providerName: "Profissional responsável",
    delegated: true,
    canConfigure: false,
  },
  "fallback legado sem clinicId mantém o vínculo operacional existente",
);
assert.deepEqual(
  await resolveOperationsPrincipal(unlinkedDb, professional),
  {
    actorUserId: "professional-actor",
    actorRole: "professional",
    providerUserId: "professional-actor",
    providerName: "Profissional",
    delegated: false,
    canConfigure: true,
  },
  "profissional sem vínculo mantém sua própria Agenda",
);
assert.equal(
  await resolveOperationsPrincipal(linkedDb, { ...professional, role: "reader" }),
  null,
  "vínculo inconsistente não pode elevar leitor ao contexto operacional",
);

assert.deepEqual(
  await resolveOperationsPrincipal(clinicScopedDb("professional"), professional, "clinic-a"),
  {
    actorUserId: "professional-actor",
    actorRole: "professional",
    providerUserId: "professional-actor",
    providerName: "Profissional",
    delegated: false,
    canConfigure: true,
  },
  "na clínica onde é profissional, a conta deve preservar a própria agenda",
);
assert.deepEqual(
  await resolveOperationsPrincipal(clinicScopedDb("assistant"), professional, "clinic-b"),
  {
    actorUserId: "professional-actor",
    actorRole: "professional",
    providerUserId: "provider-clinic-b",
    providerName: "Profissional B",
    delegated: true,
    canConfigure: false,
  },
  "na clínica onde é assistente, a mesma conta deve delegar apenas ao provider daquela clínica",
);
assert.equal(
  await resolveOperationsPrincipal(clinicScopedDb("assistant", false), professional, "clinic-b"),
  null,
  "provider fora da clínica ativa não pode ser alcançado por vínculo operacional",
);
assert.equal(
  await resolveOperationsPrincipal(clinicScopedDb(null), professional, "clinic-b"),
  null,
  "clinicId explícito sem membership ativa deve falhar fechado",
);
assert.equal(
  await resolveOperationsPrincipal(clinicScopedDb("financial"), professional, "clinic-b"),
  null,
  "papel financeiro não pode adquirir contexto operacional da agenda",
);

console.log("✓ Operational contract: horários, sobreposição, status, dinheiro e escopo multi-clínica aprovados");
