import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AGE_BANDS, MAX_SECONDS, MOTOR_CORE, OBS10_ROUTE, OUTCOMES, PHASES, bandForMonths, clock, elapsedSeconds, phaseForSeconds } from "../../client/src/features/obs10/protocol";
import { emptyObservation, exportFilename, makeReport, parseAge, usableObservation, validCorrectedAge, type SessionRecord } from "../../client/src/features/obs10/session";
import { decideRouteAccess, isRouteSensitive } from "../../client/src/security/routeGuardPolicy";
import { featuredNavigation, navigablePages } from "../../client/src/data/navigation";

let assertions = 0;
function check(value: unknown, message: string) { assert.ok(value, message); assertions++; }
check(AGE_BANDS.length === 13, "13 bands");
check(new Set(AGE_BANDS.map((b) => b.id)).size === 13, "unique ids");
for (let month = 0; month < 216; month++) {
  const matches = AGE_BANDS.filter((b) => month >= b.min && month < b.max);
  check(matches.length === 1, `age ${month}: exactly one sheet`);
  check(bandForMonths(month)?.id === matches[0].id, `age ${month}: correct selection`);
}
for (const invalid of [-1, 216, Infinity, NaN]) check(bandForMonths(invalid) === undefined, `reject ${invalid}`);
for (const band of AGE_BANDS) {
  check(band.tasks.length === 6 && band.tasks.every((task) => task.length > 35), `${band.id}: six real tasks`);
  check(Boolean(band.materials && band.reference && band.caution), `${band.id}: complete instructions`);
}
check(parseAge("0", "0") === 0, "newborn is valid");
check(parseAge("17", "11") === 215, "oldest accepted");
for (const [years, months] of [["", "0"], ["18", "0"], ["3", "12"], ["3.5", "1"], ["-1", "0"], ["2", ""]]) check(parseAge(years, months) === null, `invalid age ${years}/${months}`);
check(validCorrectedAge(8, "6", true), "physician-informed corrected age");
check(!validCorrectedAge(8, "9", true), "cannot exceed chronological");
check(!validCorrectedAge(25, "22", true), "outside corrected-age workflow");
check(!validCorrectedAge(null, "2", true), "chronological required");
check(!validCorrectedAge(8, "", true), "empty corrected age rejected");
check(PHASES[0].start === 0 && PHASES[5].end === MAX_SECONDS, "600-second schedule");
PHASES.forEach((p, i) => {
  check(phaseForSeconds(p.start) === i, `phase at ${p.start}`);
  check(phaseForSeconds(p.end - 1) === i, `phase before ${p.end}`);
  if (i) check(PHASES[i - 1].end === p.start, "continuous windows");
});
check(phaseForSeconds(600) === 5, "ended timer stays on final block");
check(elapsedSeconds(1000, 602000) === 600, "hard cap after suspended browser");
check(elapsedSeconds(1000, 0) === 0, "clock cannot be negative");
check(clock(601) === "10:00", "display hard cap");
check(MOTOR_CORE.length === 7, "full motor core included");
check(OUTCOMES.length === 7 && OUTCOMES.some((o) => o.id === "NA"), "descriptive categories, not points");
const empty = emptyObservation("synthetic", 2, 145);
check(empty.outcome === "" && !usableObservation(empty), "no normal/default outcome");
const record: SessionRecord = {
  version: "1.0.0", context: { code: "SINTETICO-OBS", chronologicalMonths: 84, correctedMonths: null, bandId: "y06", schooling: "Ensino de teste", language: "Português", adaptations: "", conditions: "", familyReport: "Relato sintético", proneAllowed: false },
  observations: [{ ...empty, task: "Comando sintético", response: "Concluiu após repetir uma vez.", outcome: "V" }],
  durationSeconds: 600, endReason: "Limite", encodingSecond: 125, recallSecond: 515, recording: "Sem captação no teste",
};
const report = makeReport(record);
check(report.includes("390 segundos"), "real marked memory interval");
check(report.includes("Sem registro de aplicação"), "omitted domains explicit");
check(report.includes("Nenhuma análise automática de vídeo"), "no fake AI analysis");
check(report.includes("NÃO É LAUDO NEM DIAGNÓSTICO"), "medical review context");
check(report.includes("RELATO DO RESPONSÁVEL — NÃO É ACHADO OBSERVADO"), "source separation");
check(!makeReport({ ...record, encodingSecond: null }).includes("390 segundos"), "missing encoding not manufactured");
check(exportFilename("../<script>\nTEST", "txt") === "OBS10-scriptTEST.txt", "safe download filename");
const base = { path: OBS10_ROUTE, accessMode: "remote" as const, isAuthenticated: true, isLoading: false };
for (const role of ["admin", "professional", "operator"] as const) check(decideRouteAccess({ ...base, userRole: role }) === "allow", `allowed role ${role}`);
check(decideRouteAccess({ ...base, userRole: "reader" }) === "forbidden", "reader denied");
check(decideRouteAccess({ ...base, isAuthenticated: false }) === "login", "anonymous denied");
check(isRouteSensitive(OBS10_ROUTE), "sensitive clinical route");
check(featuredNavigation.some((entry) => entry.href === OBS10_ROUTE), "highlighted navigation");
check(navigablePages.filter((entry) => entry.href === OBS10_ROUTE).length === 1, "one canonical destination");
check(featuredNavigation[0].href === "/super-neuropad-game" && featuredNavigation[1].href === "/testes-diretos", "Super NeuroPad Game abre o destaque e a Sonda segue logo atrás");
const app = readFileSync("client/src/App.tsx", "utf8");
check(app.includes('path="/avaliacao-pre-consulta-faixa-etaria"'), "real App route");
const page = readFileSync("client/src/pages/pre-consulta-obs10.tsx", "utf8");
const capture = readFileSync("client/src/features/obs10/useLocalRecorder.ts", "utf8");
check(!/\b(?:localStorage|sessionStorage|indexedDB)\s*\./.test(page + capture), "no clinical persistence");
check(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(page + capture), "no network upload");
check(page.includes('document.addEventListener("visibilitychange"'), "background tab ends collection");
check(capture.includes("getTracks().forEach") && capture.includes("URL.revokeObjectURL"), "camera and URL cleanup");
console.log(`OBS-10: ${assertions} assertions passed.`);
