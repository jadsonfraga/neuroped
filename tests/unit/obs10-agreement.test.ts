import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OUTCOMES, type Outcome } from "../../client/src/features/obs10/protocol";
import { AGREEMENT_SCHEMA, AgreementRefused, agreementText, compareCodings, type Coding } from "../../client/src/features/obs10/agreement";

const coding = (tasks: Array<[string, Outcome | null]>, extra: Partial<Coding> = {}): Coding => ({
  modality: "tablet-exploratory", bandId: "y06", months: 84, code: "PAR-FICTICIO",
  tasks: tasks.map(([taskId, outcome]) => ({ taskId, outcome })), unpairable: 0, ...extra,
});
const ids = ["t1", "t2", "t3", "t4"];

// Perfect agreement across more than one category: chance cannot explain it, so kappa must be 1.
const perfect = compareCodings(coding([["t1", "E"], ["t2", "R"], ["t3", "E"], ["t4", "ND"]]), coding([["t1", "E"], ["t2", "R"], ["t3", "E"], ["t4", "ND"]]), "par 01", ids);
assert.equal(perfect.comparable, 4);
assert.equal(perfect.exactMatches, 4);
assert.equal(perfect.percentAgreement, 1);
assert.equal(perfect.kappa, 1);
assert.deepEqual(perfect.divergences, []);
assert.equal(perfect.schema, AGREEMENT_SCHEMA);

// A single category used by both observers everywhere: chance alone would produce this, so kappa is undefined.
const degenerate = compareCodings(coding([["t1", "E"], ["t2", "E"]]), coding([["t1", "E"], ["t2", "E"]]), "par 02", ids);
assert.equal(degenerate.percentAgreement, 1, "raw agreement is still reported");
assert.equal(degenerate.kappa, null, "perfect expected agreement leaves kappa undefined instead of inventing 1");
assert.match(degenerate.kappaNote, /uma única categoria/);

// Total disagreement is worse than chance: kappa must be negative, never clamped to zero.
const opposed = compareCodings(coding([["t1", "E"], ["t2", "R"]]), coding([["t1", "R"], ["t2", "E"]]), "par 03", ids);
assert.equal(opposed.exactMatches, 0);
assert.equal(opposed.percentAgreement, 0);
assert.ok(opposed.kappa !== null && opposed.kappa < 0, "systematic disagreement stays below zero");
assert.equal(opposed.divergences.length, 2);

// Known worked example: 10 tasks, 8 matches. Both observers use E six times and R four times,
// so po = .8; pe = (6/10)(6/10) + (4/10)(4/10) = .52; kappa = .28/.48.
const a: Array<[string, Outcome | null]> = [];
const b: Array<[string, Outcome | null]> = [];
for (let i = 0; i < 10; i++) { a.push([`k${i}`, i < 6 ? "E" : "R"]); b.push([`k${i}`, i < 5 || i === 9 ? "E" : "R"]); }
const worked = compareCodings(coding(a), coding(b), "par 04", a.map(([id]) => id));
assert.equal(worked.comparable, 10);
assert.equal(worked.exactMatches, 8);
assert.equal(worked.percentAgreement, 0.8);
assert.equal(worked.kappa, Math.round((0.28 / 0.48) * 1000) / 1000);
assert.equal(worked.kappa, 0.583);
assert.match(worked.kappaNote, /corrigido pelo acaso/, "ten tasks is no longer flagged as a small sample");
// Four tasks, two categories, three matches: po = .75; pe = (2/4)(1/4) + (2/4)(3/4) = .5; kappa = .5.
const small = compareCodings(coding([["t1", "E"], ["t2", "E"], ["t3", "R"], ["t4", "R"]]), coding([["t1", "E"], ["t2", "R"], ["t3", "R"], ["t4", "R"]]), "par 05", ids);
assert.equal(small.kappa, 0.5);
assert.match(small.kappaNote, /amostra pequena/, "a handful of tasks must be flagged as unstable");

// Tasks only one observer coded are opportunities, not matches, and never enter the chance correction.
const partial = compareCodings(coding([["t1", "E"], ["t2", "V"]]), coding([["t1", "E"], ["t3", "R"]]), "par 06", ids);
assert.equal(partial.comparable, 1);
assert.equal(partial.codedOnlyByFirst, 1);
assert.equal(partial.codedOnlyBySecond, 1);
assert.equal(partial.codedByNeither, 1);
assert.equal(partial.tasksInSheet, 4);
assert.ok(partial.divergences.some((d) => d.taskId === "t2" && d.second === null));
assert.ok(partial.divergences.some((d) => d.taskId === "t3" && d.first === null));

// Nothing comparable must not produce a number.
const empty = compareCodings(coding([["t1", null]]), coding([["t1", null]]), "par 07", ids);
assert.equal(empty.percentAgreement, null);
assert.equal(empty.kappa, null);
assert.match(empty.kappaNote, /nenhuma tarefa/);

// Fails closed: a comparison across sheets, ages, modalities or codes would manufacture a number.
const refuse = (first: Coding, second: Coding, pattern: RegExp) => assert.throws(() => compareCodings(first, second, "x", ids), (error: unknown) => error instanceof AgreementRefused && pattern.test(error.message));
refuse(coding([["t1", "E"]]), coding([["t1", "E"]], { modality: "in-person" }), /Modalidades diferentes/);
refuse(coding([["t1", "E"]]), coding([["t1", "E"]], { bandId: "y09" }), /Ficha etária ou idade/);
refuse(coding([["t1", "E"]]), coding([["t1", "E"]], { months: 90 }), /Ficha etária ou idade/);
refuse(coding([["t1", "E"]]), coding([["t1", "E"]], { code: "OUTRO" }), /Código institucional/);
refuse(coding([["t1", "E"]], { code: "" }), coding([["t1", "E"]], { code: "" }), /Código institucional/);
refuse(coding([["t1", "E"], ["t1", "R"]]), coding([["t1", "E"]]), /repete a mesma tarefa/);

// Free-text entries have no identity between observers: counted and declared, never paired.
const withFree = compareCodings(coding([["t1", "E"]], { unpairable: 2 }), coding([["t1", "E"]], { unpairable: 3 }), "par 08", ids);
assert.equal(withFree.unpairableObservations, 5);
assert.match(agreementText(withFree), /Registros livres não pareáveis: 5/);

// The exported report is metadata only: no institutional code, session id, description or video.
const exported = JSON.stringify(worked);
assert.ok(!exported.includes("PAR-FICTICIO"), "the institutional code never leaves this screen");
// Whitelist, so a future field cannot quietly start carrying session content into the study export.
assert.deepEqual(Object.keys(worked).sort(), [
  "bandId", "codedByNeither", "codedOnlyByFirst", "codedOnlyBySecond", "comparable", "divergences", "exactMatches",
  "kappa", "kappaNote", "limitation", "modality", "months", "pairLabel", "percentAgreement", "schema", "tasksInSheet", "unpairableObservations",
].sort());
assert.deepEqual([...new Set(partial.divergences.flatMap((d) => Object.keys(d)))].sort(), ["first", "second", "taskId"]);
assert.equal(worked.pairLabel, "par 04");
const text = agreementText(perfect);
assert.match(text, /não o desempenho da criança/);
assert.match(text, /Nenhum resultado aqui autoriza diagnóstico/);
assert.ok(!/normal|adequado|atraso/i.test(text), "the comparison never characterises the child");
for (const option of OUTCOMES) assert.ok(option.label, "every category keeps a label for the human reader");
const agreementPanelSource = readFileSync("client/src/features/obs10/AgreementPanel.tsx", "utf8");
assert.ok(!agreementPanelSource.includes('className="obs10-panel'), "agreement content must not draw a second panel frame inside its parent details");
const source = readFileSync("client/src/features/obs10/agreement.ts", "utf8") + agreementPanelSource;
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|\b(?:localStorage|sessionStorage|indexedDB)\./.test(source), "reliability tooling stays local");
assert.ok(!/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(source));
console.log("OBS-10 agreement: kappa edge cases, worked example, fail-closed pairing and metadata-only export passed.");
