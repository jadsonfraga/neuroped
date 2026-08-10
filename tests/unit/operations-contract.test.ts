import assert from "node:assert/strict";
import {
  addMinutesLocal,
  appointmentSlotKeys,
  appointmentStatuses,
  bookingModalities,
  formatMoneyBRL,
  isValidLocalDate,
  isValidLocalDateTime,
  minutesToClock,
  occupiesSchedule,
  overlapsLocal,
} from "../../shared/operations";

assert.deepEqual(bookingModalities, ["in_person", "remote"]);
assert.ok(appointmentStatuses.includes("checked_in"));
assert.ok(appointmentStatuses.includes("no_show"));

assert.equal(isValidLocalDate("2026-08-10"), true);
assert.equal(isValidLocalDate("10/08/2026"), false);
assert.equal(isValidLocalDateTime("2026-08-10T08:30"), true);
assert.equal(isValidLocalDateTime("2026-08-10 08:30"), false);
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
assert.match(formatMoneyBRL(50000), /500/);

console.log("✓ Operational contract: horários, sobreposição, status e dinheiro aprovados");
