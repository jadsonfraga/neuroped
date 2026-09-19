import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OUTCOMES } from "../../client/src/features/obs10/protocol";
import { JOURNEY } from "../../client/src/features/obs10/Journey";
import { CAREGIVER_BRIEFING, CHILD_PHRASE, FIRST_TIME_STEPS, TROUBLE, nextSteps, videoDeliveryDone } from "../../client/src/features/obs10/Orientation";
import { monthsBetween, parseAge } from "../../client/src/features/obs10/session";

let assertions = 0;
const check = (value: unknown, message: string) => { assert.ok(value, message); assertions++; };

// Age from dates: completed months only, never rounded up; invalid or reversed dates refused; the result feeds the existing fields unchanged.
check(monthsBetween("2019-07-10", "2026-09-18") === 86, "7 years and 2 months");
check(monthsBetween("2019-07-10", "2026-09-09") === 85, "day before the monthly anniversary does not count the month");
check(monthsBetween("2026-09-18", "2026-09-18") === 0 && monthsBetween("2026-08-31", "2026-09-30") === 0 && monthsBetween("2026-08-31", "2026-10-01") === 1, "boundaries at the day");
check(monthsBetween("2024-02-29", "2026-02-28") === 23 && monthsBetween("2024-02-29", "2026-03-01") === 24, "leap birthday");
check(monthsBetween("2026-09-19", "2026-09-18") === null && monthsBetween("2026-02-30", "2026-09-18") === null && monthsBetween("", "2026-09-18") === null && monthsBetween("10/07/2019", "2026-09-18") === null, "reversed, impossible, empty or non-ISO dates refused");
for (const months of [0, 11, 12, 86, 215]) check(parseAge(String(Math.floor(months / 12)), String(months % 12)) === months, `fill round-trips ${months} months`);

// The first-time guide walks every journey stage, screen and room, and names the controls that exist on the page.
const page = readFileSync("client/src/pages/pre-consulta-obs10.tsx", "utf8");
const orientation = readFileSync("client/src/features/obs10/Orientation.tsx", "utf8");
for (const step of JOURNEY) check(FIRST_TIME_STEPS.some((s) => s.key === step.key), `first-time guide covers ${step.key}`);
for (const step of FIRST_TIME_STEPS) check(step.screen.length > 40 && step.room.length > 40 && !/diagn|normal\b|escore|percentil/i.test(step.screen + step.room), `${step.title}: both sides written, no clinical judgement`);
for (const control of ["Iniciar aplicação", "Encerrar antes", "Interromper e chamar médico", "Imprimir roteiro completo da ficha", "Nova aplicação"]) check(page.includes(control) && FIRST_TIME_STEPS.some((s) => s.screen.toLowerCase().includes(control.toLowerCase())), `guide names the real control: ${control}`);
check(TROUBLE.length >= 4 && TROUBLE.every(([p, a]) => p.length > 10 && a.length > 30), "trouble table filled");
check(CAREGIVER_BRIEFING.includes("não dê dicas") && CAREGIVER_BRIEFING.includes("parar") && CAREGIVER_BRIEFING.includes("não é prova"), "caregiver briefing: no prompting, may stop, not a test");
check(CHILD_PHRASE.includes("pedir ajuda ou parar"), "child phrase keeps the exit");
check(!page.includes("Vamos fazer algumas brincadeiras") && page.includes("<OpeningScripts />"), "page renders both scripts from one source");
check(page.includes('{stage === "setup" && <FirstTimeGuide />}') && page.includes("{running && <LiveHelp />}") && page.includes("{finished && <NextSteps steps={steps} />}") && page.includes("<AgeFromBirthDate"), "each stage carries its orientation");
check(orientation.includes("open>") && orientation.includes('data-testid="obs10-first-time"'), "first-time guide opens by default");
check(!/localStorage|sessionStorage|fetch\(|indexedDB/.test(orientation) && orientation.includes('setBirth("")'), "birth date never stored and cleared after filling");
for (const outcome of OUTCOMES) check(orientation.includes("OUTCOMES.map"), `legend lists ${outcome.id}`);

// Finished stage: six ordered steps, done flags only from what the screen can know, targets exist on the page.
const none = nextSteps({ described: false, reviewed: false, exported: false, video: false, dossier: false, declared: false });
const all = nextSteps({ described: true, reviewed: true, exported: true, video: true, dossier: true, declared: true });
check(none.length === 6 && none.every((s) => !s.done) && all.every((s) => s.done), "six steps, flags respected");
check(none[0].label.startsWith("Descreva") && none[2].label.includes("TXT") && none[5].label.includes("encaminhamento"), "order: describe, check, export, video, dossier, declare");
// Adversarial audit (commit 19f56f01): "described" and "reviewed" must be independent — a record with no missing
// fields is not the same as the aplicadora having opened the review board and declared she read it.
const describedOnly = nextSteps({ described: true, reviewed: false, exported: false, video: false, dossier: false, declared: false });
check(describedOnly[0].done === true && describedOnly[1].done === false, "zero pendências never marks the review step by itself");
const reviewedOnly = nextSteps({ described: false, reviewed: true, exported: false, video: false, dossier: false, declared: false });
check(reviewedOnly[0].done === false && reviewedOnly[1].done === true, "the review step follows only the aplicadora's own declaration");
const sources = page + readFileSync("client/src/features/obs10/SessionReview.tsx", "utf8") + readFileSync("client/src/features/obs10/Journey.tsx", "utf8");
for (const step of none) { const id = /data-testid="([^"]+)"/.exec(step.target)?.[1]; check(id ? sources.includes(`data-testid="${id}"`) : sources.includes(step.target.slice(1)), `target exists: ${step.target}`); }
check(page.includes("reviewed: handoff.recordsReviewed"), "review step reads the self-declared checkbox, not a derived pendência count");
check(page.includes("video: videoResolved"), "page delegates video completion to the explicit invariant helper");
check(page.includes("declared: Boolean(handoff.declaredAt) && exportedCurrent"), "declared handoff cannot read as final while TXT/JSON are stale");
check(page.includes("exported: exportedCurrent"), "export step compares snapshots to current TXT/JSON");
check(page.includes("dossier: dossierCurrent"), "dossier step follows the current copied or downloaded text snapshot");
check(page.includes("onCopy={() => setDelivered((d) => ({ ...d, md: dossier }))}"), "successful dossier copy counts as delivery");
check(page.includes("videoDownloadRequested: false, videoSavedConfirmed: false, externalVideoSavedConfirmed: false, videoUnavailableDeclared: false"), "a new application resets every video-delivery confirmation");
check(!/setDelivered\(\(d\) => \(\{ \.\.\.d, (?:txt|json|md): true \}\)\)/.test(page), "text artifacts are never represented by bare booleans");
check(videoDeliveryDone({ integratedRecordingAvailable: true, integratedRecordingConfirmedSaved: false, externalClipConfirmed: true, externalRecordingConfirmedSaved: true, unavailableDocumented: true }) === false, "external evidence can never mask an unsaved integrated recording");
check(videoDeliveryDone({ integratedRecordingAvailable: true, integratedRecordingConfirmedSaved: true, externalClipConfirmed: false, externalRecordingConfirmedSaved: false, unavailableDocumented: false }) === true, "integrated recording resolves only after explicit storage confirmation");
check(videoDeliveryDone({ integratedRecordingAvailable: false, integratedRecordingConfirmedSaved: false, externalClipConfirmed: true, externalRecordingConfirmedSaved: false, unavailableDocumented: false }) === true, "confirmed external clip resolves the external-video path");
check(videoDeliveryDone({ integratedRecordingAvailable: false, integratedRecordingConfirmedSaved: false, externalClipConfirmed: false, externalRecordingConfirmedSaved: true, unavailableDocumented: false }) === true, "explicit external institutional save resolves the external-video path");
check(videoDeliveryDone({ integratedRecordingAvailable: false, integratedRecordingConfirmedSaved: false, externalClipConfirmed: false, externalRecordingConfirmedSaved: false, unavailableDocumented: true }) === true, "documented video unavailability resolves the step without fabricating a saved file");
const evidence = readFileSync("client/src/features/obs10/EvidencePanel.tsx", "utf8");
check(evidence.includes("<strong>Opcional.</strong>"), "evidence panel declared optional");
const css = readFileSync("client/src/features/obs10/obs10.css", "utf8");
check(css.includes(".obs10 ol{list-style:decimal}"), "ordered lists show their numbers");
console.log(`OBS-10 v1.6: ${assertions} first-time orientation assertions passed.`);
