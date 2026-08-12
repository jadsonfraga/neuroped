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

console.log("✓ Operational contract: horários, sobreposição, status e dinheiro aprovados");
