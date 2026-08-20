import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const cockpit = readFileSync(new URL("../../client/src/components/clinical/PatientCockpit.tsx", import.meta.url), "utf8");

assert.match(cockpit, /enabled:\s*Boolean\(patientId\) && legacyMode/);
assert.match(cockpit, /enabled:\s*Boolean\(patientId\) && liveMode/);
assert.match(cockpit, /const liveScaleCount = liveMode \? null : scaleCount/);
assert.match(cockpit, /liveMode \? "Indisponível no LIVE"/);
assert.match(cockpit, /liveMode\s*\?\s*undefined/);
assert.match(cockpit, /Clinical Core LIVE/);

console.log("patient cockpit LIVE contract ok");
