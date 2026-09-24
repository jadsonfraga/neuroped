import assert from "node:assert/strict";
import { mediaClock } from "../../client/src/features/obs10/evidence";
assert.equal(mediaClock(59.96), "01:00.0", "rounding carries seconds into minutes");
assert.equal(mediaClock(119.99), "02:00.0");
assert.equal(mediaClock(3599.99), "60:00.0");
assert.equal(mediaClock(0), "00:00.0");
assert.equal(mediaClock(.2), "00:00.2");
for (const n of [NaN, Infinity, -1]) assert.equal(mediaClock(n), "—");
for (let n = 0; n <= 360000; n += 7) {
  const formatted = mediaClock(n / 100);
  assert.match(formatted, /^\d{2,}:[0-5]\d\.\d$/);
  const [minutes, seconds] = formatted.split(":").map(Number);
  assert.ok(Math.abs(minutes * 60 + seconds - n / 100) <= .051);
}
console.log("OBS-10 media time: boundaries and 51,429 positions passed.");
