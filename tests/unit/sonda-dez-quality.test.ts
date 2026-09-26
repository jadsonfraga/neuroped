import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { SONDA_DEZ_PROTOCOL, type FieldDef } from "../../client/src/data/sondaDezProtocol";
import { DIGITAL_BANDS } from "../../client/src/data/sondaDezDigital";
import { isSondaResponseCode, validSondaAge, validSondaField, legacyCoverage, leavesSondaRoute, advanceSondaActiveTime, type SondaActiveTime } from "../../client/src/lib/sondaDezQuality";
import { buildDigitalHandoff, emptyRecord, markMissionUnavailable, recordProblems, recordedGridMetrics, validSequenceRun, type StepRun } from "../../client/src/lib/sondaDezSession";

const context = { code: "SYNTHETIC-QUALITY", ageMonths: 36, school: "fictícia", operator: "OPERADOR-TESTE", elapsedSeconds: 700, flags: ["ALERTA SINTÉTICO"], confounders: ["Sono referido"], startedAt: "2026-09-22T12:00:00.000Z" };
const count: FieldDef = { id: "count", kind: "count", label: "Erros", max: 4 };
const repeat: FieldDef = { id: "repeat", kind: "choice", label: "Repetições", options: ["0", "1", "2", "NA"] };
const code: FieldDef = { id: "code", kind: "choice", label: "Resposta", options: ["E", "I", "P", "0", "NA"] };

test("presencial: idade exige inteiros explícitos sem clamp nem faixa presumida", () => {
  for (const [y, m] of [["", "0"], ["0", "0"], ["0", "11"], ["18", "0"], ["3", "12"], ["3.5", "0"], ["-1", "0"], ["1e1", "0"], ["3", ""], ["3", "-1"], ["Infinity", "0"]]) assert.equal(validSondaAge(y, m), undefined);
  assert.equal(validSondaAge("1", "0"), 12);
  assert.equal(validSondaAge("17", "11"), 215);
  for (const band of SONDA_DEZ_PROTOCOL) for (const m of [band.minMonths, band.maxMonths]) assert.equal(validSondaAge(String(Math.floor(m / 12)), String(m % 12)), m);
});
test("zero, vazio, contagem inválida e código clínico nunca se confundem", () => {
  assert.equal(validSondaField(count, 0), true);
  for (const value of [undefined, "", "0", -1, 0.5, 5, NaN, Infinity]) assert.equal(validSondaField(count, value), false);
  assert.equal(validSondaField(count, "NA"), true);
  assert.equal(isSondaResponseCode(count, 0), false);
  assert.equal(isSondaResponseCode(repeat, "0"), false);
  assert.equal(isSondaResponseCode(code, "0"), true);
  assert.equal(isSondaResponseCode(code, 0), false);
  assert.equal(validSondaField(code, "inventado"), false);
});
test("presencial: cobertura exige contexto para NA/P, sem chamar ausência de zero", () => {
  const band = SONDA_DEZ_PROTOCOL[0];
  const mission = band.missions[0];
  const records = { [mission.id]: { values: Object.fromEntries(mission.fields.map((f) => [f.id, "NA"])), notes: "" } };
  assert.equal(legacyCoverage(band, {})[0].complete, false);
  assert.equal(legacyCoverage(band, records)[0].needsContext, true);
  records[mission.id].notes = "Recusa observada nesta oportunidade sintética";
  assert.equal(legacyCoverage(band, records)[0].complete, true);
});
test("proteção de saída cobre SPA, histórico e links externos sem impedir autenticação", () => {
  const here = "https://example.invalid/#/testes-diretos";
  for (const target of ["#/pacientes", "#/obs-10", "https://other.invalid/", "/outro"]) assert.equal(leavesSondaRoute(target, here), true);
  for (const target of ["#/testes-diretos", "#/testes-diretos?fonte=menu", "#/login", "#/sessao-expirada", "#/consentimento-lgpd"]) assert.equal(leavesSondaRoute(target, here), false);
  const source = fs.readFileSync("client/src/hooks/useSondaExitGuard.ts", "utf8");
  for (const event of ["beforeunload", "click", "hashchange", "popstate"]) assert.ok(source.includes(`removeEventListener("${event}"`));
});
test("Voltar do navegador para /login com sessão ainda válida não é a sessão forçando a saída (bug corrigido)", () => {
  const here = "https://example.invalid/#/testes-diretos";
  // Sessão inválida (padrão): /login, /sessão-expirada e /consentimento-lgpd continuam isentos.
  for (const target of ["#/login", "#/sessao-expirada", "#/consentimento-lgpd"]) assert.equal(leavesSondaRoute(target, here, true), false);
  // Sessão ainda válida: essas mesmas rotas passam a proteger o registro em curso,
  // porque é a própria página de login que devolve o profissional autenticado sozinha.
  for (const target of ["#/login", "#/sessao-expirada", "#/consentimento-lgpd"]) assert.equal(leavesSondaRoute(target, here, false), true);
  assert.equal(leavesSondaRoute("#/testes-diretos", here, false), false, "a própria rota nunca é saída, com sessão válida ou não");
  const guard = fs.readFileSync("client/src/hooks/useSondaExitGuard.ts", "utf8");
  assert.match(guard, /export function useSondaExitGuard\(dirty: boolean, sessionInvalid = true/);
  assert.match(guard, /leavesSondaRoute\(anchor\.href, heldUrl, invalid\)/);
  assert.match(guard, /leavesSondaRoute\(window\.location\.href, heldUrl, invalid\)/);
  const page = fs.readFileSync("client/src/components/sonda-dez/SondaDigitalGuided.tsx", "utf8");
  assert.match(page, /useSondaExitGuard\(dirty, !isAuthenticated\)/, "a sessão real do app decide a isenção, não uma rota fixa");
});
const sequence: StepRun = { status: "complete", elapsedMs: 5000, events: [
  { type: "apresentado", value: "0", elapsedMs: 0 },
  { type: "apresentado", value: "1", elapsedMs: 2500 },
  { type: "serie-concluida", value: "2", elapsedMs: 5000 },
] };
test("série completa exige ordem, índices reais, duração e término coerentes", () => {
  assert.equal(validSequenceRun(["sol", "lua"], 2500, sequence), true);
  for (const mutate of [
    (r: StepRun) => { r.events[0].value = "99"; },
    (r: StepRun) => { r.events[1].value = "0"; },
    (r: StepRun) => { r.events[1].elapsedMs = 100; },
    (r: StepRun) => { r.events[2].value = "3"; },
    (r: StepRun) => { r.events[2].elapsedMs = 4999; },
    (r: StepRun) => { r.elapsedMs = NaN; },
    (r: StepRun) => { r.status = "interrupted"; },
  ]) { const bad = structuredClone(sequence); mutate(bad); assert.equal(validSequenceRun(["sol", "lua"], 2500, bad), false); }
});
test("grade malformada não fabrica contagem zero nem sucesso", () => {
  const run = (selected: unknown): StepRun => ({ status: "complete", elapsedMs: 60000, events: [{ type: "grade-concluida", value: JSON.stringify({ selected }), elapsedMs: 60000 }] });
  assert.deepEqual(recordedGridMetrics(["A", "B"], "A", run([])), { hits: 0, omissions: 1, commissions: 0 });
  for (const bad of [[-1], [2], [0.5], [0, 0], ["0"], [null], "0", null]) assert.equal(recordedGridMetrics(["A", "B"], "A", run(bad)), undefined);
});
test("autoria é obrigatória na apresentação concluída; operação mista exige discriminação", () => {
  const mission = DIGITAL_BANDS[0].missions[0];
  const record = markMissionUnavailable(mission, emptyRecord(), "Condição sintética");
  record.reviewed = true;
  record.runs[0] = { status: "complete", events: [], elapsedMs: 30000 };
  assert.ok(recordProblems(mission, record).some((p) => p.includes("quem operou")));
  record.interaction = "mixed";
  assert.ok(recordProblems(mission, record).some((p) => p.includes("Discrimine")));
  record.interaction = "operator";
  assert.ok(!recordProblems(mission, record).some((p) => p.includes("quem operou") || p.includes("Discrimine")));
});
test("NA preserva histórico e motivo original de interrupção", () => {
  const mission = DIGITAL_BANDS[0].missions[0];
  const record = emptyRecord();
  record.runs[0] = { ...sequence, status: "interrupted", reason: "Aba oculta" };
  const next = markMissionUnavailable(mission, record, "Não tolerou repetição");
  assert.equal(next.runs[0].previousRuns?.[0].reason, "Aba oculta");
  assert.deepEqual(next.runs[0].previousRuns?.[0].events, sequence.events);
  assert.equal(next.runs[0].reason, "Não tolerou repetição");
});
test("resumo factual parcial mostra alertas, lacunas e limites sem narrar eventos como resposta", () => {
  const text = buildDigitalHandoff(DIGITAL_BANDS[2], {}, context);
  assert.match(text, /REGISTRO PARCIAL/);
  assert.match(text, /ALERTA SINTÉTICO/);
  assert.match(text, /Sono referido/);
  assert.match(text, /Ausente ou inválido/);
  assert.match(text, /Não equivale a zero/);
  assert.match(text, /não é escore/);
  assert.match(text, /700s/);
  assert.match(text, /2026-09-22T12:00:00.000Z/);
  assert.doesNotMatch(text, /Evento \d+ms/);
  assert.equal(text, buildDigitalHandoff(DIGITAL_BANDS[2], {}, context));
});
test("resumo inteiramente NA é cobertura documental, não avaliação de habilidades", () => {
  const band = DIGITAL_BANDS[2];
  const records = Object.fromEntries(band.missions.map((m) => [m.id, { ...markMissionUnavailable(m, emptyRecord(), "Recusa sintética"), reviewed: true }]));
  const text = buildDigitalHandoff(band, records, context);
  assert.match(text, /7\/7 missões revisadas/);
  assert.match(text, /Campos NA continuam não avaliáveis/);
  assert.match(text, /Não avaliável:/);
  assert.doesNotMatch(text, /Registros da aplicadora:/);
});
test("banco não fornece respostas narrativas nem uma sequência inteira simultaneamente", () => {
  const bank = fs.readFileSync("client/src/components/sonda-dez/SondaDezDailyCore.tsx", "utf8");
  assert.doesNotMatch(bank, /\{active\.subtitle\}/);
  assert.match(bank, /<SondaScene kind="rain"/);
  assert.match(bank, /initialBand=\{band\}/);
  assert.match(bank, /values\[position\]/);
  assert.doesNotMatch(bank, /06:45 · acordar/);
});

test("relógio conserva frações por missão e o relatório usa a versão presencial canônica", () => {
  const clock: SondaActiveTime = { totalMs: 0, missions: {} };
  for (let i = 0; i < 10; i++) advanceSondaActiveTime(clock, "primeira", 90);
  advanceSondaActiveTime(clock, "segunda", 200);
  advanceSondaActiveTime(clock, "primeira", 100);
  assert.equal(clock.totalMs, 1200);
  assert.deepEqual(clock.missions, { primeira: 1000, segunda: 200 });
  for (const invalid of [NaN, Infinity, -100]) advanceSondaActiveTime(clock, "primeira", invalid);
  assert.equal(clock.totalMs, 1200);
  advanceSondaActiveTime(clock, "segunda", 900000);
  assert.equal(clock.totalMs, 600000);
  assert.equal(clock.missions.primeira + clock.missions.segunda, 600000);
  advanceSondaActiveTime(clock, "primeira", 500);
  assert.equal(clock.totalMs, 600000);
  const page = fs.readFileSync("client/src/pages/testes-diretos.tsx", "utf8");
  assert.match(page, /SONDA_DEZ_VERSION.*from "@\/data\/sondaDezCanonical"/);
  assert.match(page, /PROTOCOLO v\$\{SONDA_DEZ_VERSION\}/);
  assert.match(page, /useLayoutEffect\(\(\) => \{\s*const clock = activeTime.current/);
  assert.match(page, /window.clearInterval\(timer\); tick\(\)/);
  assert.match(page, /activeTime.current !== clock/);
});

test("resumo factual preserva integridade das contagens derivadas da PR concorrente", () => {
  const band = DIGITAL_BANDS[2];
  const mission = band.missions.find((m) => m.id === "b-atencao-sustentada")!;
  const record = emptyRecord();
  record.values = { acertos: "5", omissoes: "0", comissoes: "0", redirecionamentos: "2" };
  record.interaction = "operator";
  const text = buildDigitalHandoff(band, { [mission.id]: record }, context);
  assert.match(text, /contagem não confirmada pelos eventos; não interpretar/);
  assert.doesNotMatch(text, /5\/5 \(contagem bruta\)/);
  assert.match(text, /não expectativas equivalentes nem normas/);
});
