// Aba "Direto ao teste" nas três aplicações diretas: Sonda Dez, OBS-10 e Reconhecimento Visual.
// Contrato: a aba dispensa guia, preparo, ensaio e checklist para a aplicadora experiente,
// exige apenas a idade, e o registro declara explicitamente que o preparo guiado foi dispensado.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PREPARATION_DIRECT_LINE, emptyObservation, makeReport, type SessionRecord } from "../../client/src/features/obs10/session";
import { makeDossier } from "../../client/src/features/obs10/dossier";
import { parseRecordJSON } from "../../client/src/features/obs10/importRecord";
import { OBS10_VERSION } from "../../client/src/features/obs10/protocol";
import { buildDigitalHandoff, buildDigitalReport, emptyRecord } from "../../client/src/lib/sondaDezSession";
import { DIGITAL_BANDS } from "../../client/src/data/sondaDezDigital";
import { buildPlan, eligibleItems, reportText, type Config } from "../../client/src/features/visual-recognition/model";

const sonda = readFileSync("client/src/components/sonda-dez/SondaDigitalGuided.tsx", "utf8");
const obs10 = readFileSync("client/src/pages/pre-consulta-obs10.tsx", "utf8");
const visual = readFileSync("client/src/features/visual-recognition/Workspace.tsx", "utf8");
const between = (source: string, start: string, end: string) => {
  const from = source.indexOf(start);
  assert.ok(from >= 0, `marker ausente: ${start}`);
  const to = source.indexOf(end, from);
  assert.ok(to > from, `marker ausente: ${end}`);
  return source.slice(from, to);
};

test("as três aplicações oferecem a aba Direto ao teste ao lado do guia de primeira aplicação", () => {
  for (const [source, tabs, start] of [
    [sonda, "sonda-track-tabs", "sonda-direct-start"],
    [obs10, "obs10-track-tabs", "obs10-direct-start"],
    [visual, "rv-track-tabs", "rv-direct-start"],
  ] as const) {
    assert.ok(source.includes(`data-testid="${tabs}"`), `${tabs}: tablist presente`);
    assert.ok(source.includes(`data-testid=${start.startsWith("sonda") ? `{direct ? "${start}" : undefined}` : `"${start}"`}`), `${start}: painel direto presente`);
    assert.ok(source.includes('role="tablist"') && source.includes('role="tab"'), `${tabs}: semântica de abas`);
    assert.ok(source.includes("Direto ao teste") && /Guia d[ae] (primeira aplicação|assistente)/.test(source), `${tabs}: os dois modos nomeados`);
  }
});

test("Sonda Dez: modo direto pula preparar e ensaiar, exige só a idade e declara isso no registro", () => {
  assert.match(sonda, /const ready = direct\s*\?\s*Boolean\(band\)/, "no modo direto só a idade libera o início");
  assert.ok(sonda.includes('{phase === "learn" && !direct && ('), "fase de ensaio nunca renderiza no modo direto");
  assert.ok(sonda.includes('{!direct && (phase === "prepare" || phase === "learn" || phase === "run") && ('), "guia da primeira aplicação oculto no modo direto");
  assert.ok(sonda.includes('{!direct && <section className={panel}>\n            <h2 className="text-xl font-bold">Conferir antes de começar</h2>'), "checklist e conferência de som só no modo guiado");
  assert.ok(sonda.includes('disabled={phase !== "prepare" || easyProgress > 0}'), "a aba só troca antes de iniciar a aplicação (guiada, direta ou joguinho)");
  assert.ok(sonda.includes('.concat(direct ? [DIRECT_TRACK_NOTE] : [])'), "registro recebe a nota do modo direto");
  assert.ok(sonda.includes('soundEnabled={direct ? sound !== "visual" : sound === "heard"}'), "som segue a escolha explícita do modo direto");
  const directPanel = between(sonda, "{direct && (", "Consultar o roteiro presencial original");
  assert.ok(directPanel.includes('setPhase("run")') && directPanel.includes("setStartedAt(new Date().toISOString())") && directPanel.includes("setPaused(false)"), "início direto inicia cronômetro e aplicação como o fluxo guiado");
  assert.ok(!directPanel.includes('setPhase("learn")'), "início direto não passa pelo ensaio");
  const band = DIGITAL_BANDS[0];
  const records = Object.fromEntries(band.missions.map((mission) => [mission.id, emptyRecord()]));
  const note = "Modo direto: guia de primeira aplicação, conferência de preparo e ensaio dispensados pela aplicadora experiente";
  const context = { code: "", operator: "", ageMonths: band.min, school: "", confounders: [note], flags: [], elapsedSeconds: 0 };
  assert.match(buildDigitalReport(band, records, context), /Interferentes: Modo direto: guia de primeira aplicação/);
  assert.match(buildDigitalHandoff(band, records, context), /Condições da aplicação: Modo direto/);
  assert.ok(sonda.includes(`"${note}"`), "a nota exportada é a mesma usada no componente");
});

test("OBS-10: modo direto exige só idade válida, oculta guia, kit, checklist e ensaio, e marca preparation=direct", () => {
  assert.ok(obs10.includes('const ready = direct ? Boolean(!importBusy && selectedBand && correctedValid) : guidedReady;'), "prontidão direta: idade e idade corrigida válidas");
  assert.ok(obs10.includes('...(direct ? { preparation: "direct" as const } : {})'), "início grava a marca no contexto da sessão");
  for (const guidedOnly of ['{stage === "setup" && !direct && <FirstTimeGuide />}', '{stage === "setup" && !direct && <PracticalMaterials', '{stage === "setup" && !direct && <div className="obs10-setup obs10-no-print">', '{stage === "setup" && !direct && <AudioPreflight']) {
    assert.ok(obs10.includes(guidedOnly), `só no modo guiado: ${guidedOnly.slice(0, 60)}`);
  }
  const directPanel = between(obs10, 'data-testid="obs10-direct-start"', "{stage === \"setup\" && !direct && <PracticalMaterials");
  assert.ok(directPanel.includes("Anos completos") && directPanel.includes("Iniciar aplicação · 10 minutos") && directPanel.includes("void start()"), "painel direto: idade e o mesmo botão de início");
  assert.ok(!directPanel.includes("<OperatorRehearsal") && !directPanel.includes("<FramingGuide") && !directPanel.includes("CHECKS.map"), "painel direto sem ensaio, enquadramento ou checklist");
  assert.ok(directPanel.includes("Usar câmera e microfone deste dispositivo"), "câmera continua opcional no modo direto");
  const base: SessionRecord = {
    version: OBS10_VERSION, sessionId: "direct-1",
    context: { code: "OBS-DIR", chronologicalMonths: 48, correctedMonths: null, bandId: "y04", schooling: "", language: "", adaptations: "", conditions: "", familyReport: "", proneAllowed: false, preparation: "direct" },
    observations: [{ ...emptyObservation("o1", 0, 10), task: "Tarefa", response: "Fez.", outcome: "R", assistance: "", quality: "Nítido" }],
    durationSeconds: 300, endReason: "Encerrado pela aplicadora.", encodingSecond: null, recallSecond: null, recording: "Sem vídeo integrado.",
  } as SessionRecord;
  assert.ok(makeReport(base).includes(PREPARATION_DIRECT_LINE), "registro declara o modo direto");
  assert.match(makeDossier(base), /Preparação: modo direto/);
  const guided = { ...base, context: { ...base.context, preparation: undefined } };
  assert.ok(!makeReport(guided).includes("modo direto") && !makeDossier(guided).includes("modo direto"), "registro guiado não muda");
  const roundTrip = parseRecordJSON(JSON.stringify(base));
  assert.ok(roundTrip.ok && roundTrip.record.context.preparation === "direct", "exportação com modo direto reimporta para revisão");
  const forged = parseRecordJSON(JSON.stringify({ ...base, context: { ...base.context, preparation: "skipped" } }));
  assert.ok(!forged.ok, "valor desconhecido de preparação é recusado na importação");
});

test("Reconhecimento Visual: modo direto dispensa as conferências, exige idade e figuras, e declara isso no registro", () => {
  assert.ok(visual.includes('if(!direct&&!checks.every(Boolean)){setMessage("Conclua os três cuidados de preparação.");return;}'), "conferências só bloqueiam o modo guiado");
  assert.ok(visual.includes('if(age===null){setMessage("Informe a idade exata'), "idade continua obrigatória");
  assert.ok(visual.includes('if(selected.length===0){setMessage("Selecione ao menos uma figura'), "sem figuras não inicia");
  assert.ok(visual.includes("conditions:direct?[...conditions,DIRECT_TRACK_NOTE]:[...conditions]"), "configuração recebe a nota do modo direto");
  assert.ok(visual.includes('{!easy&&phase==="prepare"&&!direct&&<>'), "preparo guiado só no modo guiado");
  const directPanel = between(visual, 'data-testid="rv-direct-start"', '{!easy&&phase==="prepare"&&!direct&&<>');
  assert.ok(directPanel.includes("Anos completos") && directPanel.includes("Iniciar aplicação") && !directPanel.includes("PREPARATION.map"), "painel direto: idade e início, sem os três cuidados");
  const note = "Modo direto: guia de primeira aplicação e conferências de preparo dispensados pela aplicadora experiente";
  assert.ok(visual.includes(`"${note}"`), "a nota exportada é a mesma usada no componente");
  const config: Config = { ageMonths: 48, mode: "receptivo", choices: 2, count: 6, selectedIds: eligibleItems(48, "receptivo").map((item) => item.id), seed: 7, distractors: "distantes", contextAcknowledged: false, conditions: [note] };
  assert.match(reportText(config, buildPlan(config), []), /Condições declaradas: Modo direto/);
});

test("modo direto não introduz persistência clínica nem rede", () => {
  for (const source of [sonda, obs10, visual]) assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(/);
});
