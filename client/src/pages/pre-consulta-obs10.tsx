import { useCallback, useEffect, useRef, useState } from "react";
import { Baby, Camera, Check, ChevronLeft, ChevronRight, ClipboardList, Download, ShieldCheck, Square, Timer } from "lucide-react";
import { AGE_BANDS, APPLICATION_RULES, MAX_SECONDS, OBS10_TITLE, OBS10_VERSION, OUTCOMES, PHASES, SOURCES, bandForMonths, clock, phaseForSeconds } from "@/features/obs10/protocol";
import { emptyObservation, amendObservation, emptyHandoff, exportFilename, makeReport, parseAge, usableObservation, validCorrectedAge, type Observation, type SessionContext, type SessionRecord } from "@/features/obs10/session";
import { useLocalRecorder } from "@/features/obs10/useLocalRecorder";
import { PracticalMaterials, PracticalTaskGuide, FramingGuide, OperatorRehearsal, completeKit, type KitState } from "@/features/obs10/PracticalGuide";
import { KITS, MATERIALS, PRACTICAL_TASKS, type PracticalTask } from "@/features/obs10/practical";
import { sessionElapsed } from "@/features/obs10/safety";
import { useExitGuard } from "@/features/obs10/useExitGuard";
import { printPlainTextDocument } from "@/lib/printDocument";
import type { Outcome } from "@/features/obs10/protocol";
import { ImportReview, SessionReview } from "@/features/obs10/SessionReview";
import { reviewText } from "@/features/obs10/review";
import { AudioPreflight } from "@/features/obs10/AudioPreflight";
import { EvidencePanel } from "@/features/obs10/EvidencePanel";
import { emptyEvidence, evidenceText, type EvidenceBundle } from "@/features/obs10/evidence";
import { PilotPanel } from "@/features/obs10/PilotPanel";
import { emptyPilot, type PilotRecord } from "@/features/obs10/pilot";
import { useWorkClock } from "@/features/obs10/useWorkClock";
import { DossierPanel, JourneyMap, Readiness, type ReadinessItem } from "@/features/obs10/Journey";
import { AgeFromBirthDate, FirstTimeGuide, LiveHelp, NextSteps, OpeningScripts, nextSteps, videoDeliveryDone } from "@/features/obs10/Orientation";
import { makeDossier, makeScript } from "@/features/obs10/dossier";
import "@/features/obs10/obs10.css";

const CHECKS = [
  "Autorização institucional para filmar registrada; finalidade e privacidade explicadas.",
  "Participação aceita conforme compreensão; criança acordada, confortável e sem mudança aguda.",
  "Aplicadora treinada e médico disponível para intercorrências.",
  "Piso seguro, cuidador próximo e apoios habituais preservados.",
  "Materiais separados, sem peças pequenas, comida ou objetos perigosos.",
  "Enquadramento e áudio conferidos; celular horizontal, sem filtros ou espelhamento.",
] as const;
const MISSING_CONTEXT: SessionContext = { code: "", chronologicalMonths: 0, correctedMonths: null, bandId: "", schooling: "", language: "", adaptations: "", conditions: "", familyReport: "", proneAllowed: false };
function saveFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PreConsultaObs10Page() {
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("");
  const [corrected, setCorrected] = useState("");
  const [useCorrected, setUseCorrected] = useState(false);
  const [context, setContext] = useState<SessionContext>(MISSING_CONTEXT);
  const [checks, setChecks] = useState<boolean[]>(CHECKS.map(() => false));
  const [previewBand, setPreviewBand] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [kits, setKits] = useState<Record<string, KitState>>({});
  const [sessionId, setSessionId] = useState("");
  const [evidence, setEvidence] = useState<EvidenceBundle>(emptyEvidence);
  const [pilot, setPilot] = useState<PilotRecord>(emptyPilot);
  const [reviewEpoch, setReviewEpoch] = useState(0);
  const workClock = useWorkClock((log) => { setPilot((p) => ({ ...p, logs: [...p.logs, log].slice(0, 100) })); setHandoff(emptyHandoff()); });
  const [handoff, setHandoff] = useState(emptyHandoff);
  const [importBusy, setImportBusy] = useState(false);
  const [importedRecord, setImportedRecord] = useState<SessionRecord | null>(null);
  const startTicket = useRef(0);
  const monotonicStart = useRef<number | null>(null);
  const lastElapsed = useRef(0);
  const [stage, setStage] = useState<"setup" | "running" | "finished">("setup");
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [endReason, setEndReason] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [encodingSecond, setEncodingSecond] = useState<number | null>(null);
  const [recallSecond, setRecallSecond] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  // Text snapshots make TXT/JSON/dossier freshness content-addressed. Video uses explicit operator confirmations:
  // a click only requests a browser download; it does not prove durable storage.
  const [delivered, setDelivered] = useState<{
    txt: string | null; json: string | null; md: string | null;
    videoDownloadRequested: boolean; videoSavedConfirmed: boolean;
    externalVideoSavedConfirmed: boolean; videoUnavailableDeclared: boolean;
  }>({ txt: null, json: null, md: null, videoDownloadRequested: false, videoSavedConfirmed: false, externalVideoSavedConfirmed: false, videoUnavailableDeclared: false });
  const video = useRef<HTMLVideoElement>(null);
  const started = useRef<number | null>(null);
  const ended = useRef(false);
  const sequence = useRef(0);
  const starting = useRef(false);
  const finishRef = useRef<(reason: string) => void>(() => undefined);
  const media = useLocalRecorder();
  const stopRecording = media.stop;
  const chrono = parseAge(years, months);
  const correctedValid = validCorrectedAge(chrono, corrected, useCorrected);
  const effective = chrono === null || !correctedValid ? null : useCorrected ? Number(corrected) : chrono;
  const selectedBand = effective === null ? undefined : bandForMonths(effective);
  const band = stage === "setup" ? selectedBand : AGE_BANDS.find((item) => item.id === context.bandId);

  const activeKit = kits[band?.id ?? ""] ?? {};
  const ready = Boolean(!importBusy && selectedBand && checks.every(Boolean) && correctedValid && completeKit(selectedBand.id, kits[selectedBand.id] ?? {}) && kits[selectedBand.id]?.device === "ready");
  const running = stage === "running";
  const finished = stage === "finished";
  const expectedStep = phaseForSeconds(elapsed);
  const nowSecond = useCallback(() => {
    if (started.current === null || monotonicStart.current === null) return 0;
    const current = sessionElapsed(started.current, monotonicStart.current, Date.now(), performance.now(), lastElapsed.current);
    lastElapsed.current = current;
    return current;
  }, []);
  useExitGuard(Boolean(workClock.phase) || pilot.logs.length > 0 || stage !== "setup" || media.pending || Boolean(years || months || context.code || context.schooling || context.language || context.adaptations || context.conditions || context.familyReport));

  const finish = useCallback((reason: string) => {
    if (ended.current || started.current === null) return;
    ended.current = true;
    setElapsed(nowSecond());
    stopRecording();
    setEndReason(reason);
    setStage("finished");
  }, [stopRecording, nowSecond]);
  finishRef.current = finish;
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const seconds = nowSecond();
      setElapsed(seconds);
      if (seconds >= MAX_SECONDS) finishRef.current("Limite de 10 minutos atingido; tarefas restantes não aplicadas.");
    };
    const timer = setInterval(tick, 250);
    const visibility = () => {
      if (document.hidden) finishRef.current("Coleta encerrada ao sair da aba; não continuar tarefas fora do cronômetro.");
    };
    document.addEventListener("visibilitychange", visibility);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visibility); };
  }, [nowSecond, running]);
  useEffect(() => {
    if (video.current) video.current.srcObject = media.stream;
  }, [media.stream, stage]);
  useEffect(() => {
    const invalidateHiddenStart = () => {
      if (document.hidden && starting.current) {
        startTicket.current += 1;
        starting.current = false;
      }
    };
    document.addEventListener("visibilitychange", invalidateHiddenStart);
    return () => {
      startTicket.current += 1;
      document.removeEventListener("visibilitychange", invalidateHiddenStart);
    };
  }, []);
  useEffect(() => {
    if (running && media.error) finishRef.current("Interrupção técnica da captação; vídeo pode estar incompleto.");
  }, [media.error, running]);

  async function start() {
    if (document.hidden || !ready || !selectedBand || chrono === null || starting.current || media.status === "finalizing") return;
    starting.current = true;
    const ticket = ++startTicket.current;
    if (!cameraEnabled) media.reset();
    const permitted = !cameraEnabled || await media.start();
    if (startTicket.current !== ticket) return;
    starting.current = false;
    if (!permitted) return;
    if (document.hidden) { media.cancel(); return; }
    workClock.stop("início da coleta");
    setContext((current) => ({ ...current, chronologicalMonths: chrono, correctedMonths: useCorrected ? Number(corrected) : null, bandId: selectedBand.id,
      missingMaterials: KITS[selectedBand.id].filter((item) => (kits[selectedBand.id] ?? {})[item.id] === "missing").map((item) => MATERIALS[item.id].label) }));
    const suffix = typeof crypto.randomUUID === "function" ? crypto.randomUUID().slice(0, 8) : String(Math.floor(performance.now()));
    setSessionId(`${new Date().toISOString().replace(/[:.]/g, "-")}-${suffix}`);
    started.current = Date.now(); monotonicStart.current = performance.now(); lastElapsed.current = 0;
    ended.current = false; setElapsed(0); setStep(0); setStage("running");
  }
  function cancelCamera() {
    startTicket.current += 1; starting.current = false; media.cancel();
  }
  function emergencyStop() {
    if (running) media.stop(); else if (stage === "setup") cancelCamera();
    if (running) finish("Interrompido por segurança; chamar médico/equipe imediatamente.");
    setUrgent(true);
  }
  function resetSession() {
    if (media.status === "finalizing") return;
    if (!window.confirm("Exportou o registro e, se houver, o vídeo? Uma nova aplicação apaga os dados desta tela. Continuar?")) return;
    startTicket.current += 1; starting.current = false;
    media.reset(); workClock.reset(); setPilot(emptyPilot()); setEvidence(emptyEvidence()); setReviewEpoch((n) => n + 1);
    monotonicStart.current = null; lastElapsed.current = 0; setSessionId(""); setHandoff(emptyHandoff()); setKits({}); setImportedRecord(null); setImportBusy(false);
    started.current = null; ended.current = false; sequence.current = 0;
    setStage("setup"); setElapsed(0); setStep(0); setObservations([]); setEndReason("");
    setEncodingSecond(null); setRecallSecond(null); setUrgent(false); setMessage(""); setDelivered({ txt: null, json: null, md: null, videoDownloadRequested: false, videoSavedConfirmed: false, externalVideoSavedConfirmed: false, videoUnavailableDeclared: false });
    setContext(MISSING_CONTEXT); setYears(""); setMonths(""); setCorrected(""); setUseCorrected(false);
    setChecks(CHECKS.map(() => false)); setPreviewBand(null); setCameraEnabled(false);
  }
  function updateObservation(id: string, patch: Partial<Observation>) {
    setHandoff(emptyHandoff());
    setObservations((current) => current.map((entry) => entry.id === id ? amendObservation(entry, patch, finished) : entry));
  }
  function addObservation() {
    if (observations.length >= 200) { setMessage("Limite de 200 registros. Exporte e revise os existentes; não crie duplicatas."); return; }
    let id: string;
    do { id = `manual-${++sequence.current}`; } while (observations.some((entry) => entry.id === id));
    setHandoff(emptyHandoff());
    setObservations((current) => [...current, { ...emptyObservation(id, step, running ? nowSecond() : elapsed), recordedAfterEnd: !running }]);
  }
  function quickRecord(task: PracticalTask, outcome: Outcome, reason: string) {
    const id = `guided-${task.id}`;
    if (observations.length >= 200 && !observations.some((entry) => entry.id === id)) { setMessage("Limite de registros atingido. Revise os já existentes."); return; }
    setHandoff(emptyHandoff());
    setObservations((current) => {
      const existing = current.find((item) => item.id === id);
      const entry: Observation = { ...emptyObservation(id, task.phase, running ? nowSecond() : elapsed),
        ...existing, task: task.title, outcome, modelInInstruction: Boolean(task.model), recordedAfterEnd: existing ? existing.recordedAfterEnd : !running, editedAfterEnd: finished || existing?.editedAfterEnd,
        ...(reason ? { response: "Tarefa não aplicada.", assistance: reason } : {}) };
      return existing ? current.map((item) => item.id === id ? entry : item) : [...current, entry];
    });
  }
  const record: SessionRecord = {
    version: importedRecord?.version ?? OBS10_VERSION, sessionId, context, observations, handoff, evidence, pilot,
    ...(importedRecord ? { importedForReview: true, sourceRecording: importedRecord.sourceRecording } : {}), durationSeconds: elapsed, endReason, encodingSecond, recallSecond,
    recording: evidence.clips.length ? `${evidence.clips.length} clipe(s) associado(s) por declaração. JSON guarda referências, não o vídeo. Reanexe o arquivo para conferir seus bytes e abrir os trechos.` : importedRecord ? importedRecord.recording : cameraEnabled ? media.url ? "Vídeo local disponível; conteúdo e integridade ainda não verificados pelo médico." : "Câmera integrada solicitada; confirme a existência e a integridade do arquivo antes de sair." : "Filmagem externa orientada; nenhum vídeo recebido ou verificado por este aplicativo.",
  };
  const report = `${makeReport(record)}\n\n${reviewText(record)}\n\n${evidenceText(record)}`;
  const dossier = finished ? makeDossier(record) : "";
  const incomplete = observations.filter((o) => !usableObservation(o)).length;
  const kitItems = selectedBand ? KITS[selectedBand.id] : [];
  const kitChecked = kitItems.filter((item) => (kits[selectedBand?.id ?? ""] ?? {})[item.id]).length;
  const readiness: ReadinessItem[] = [
    { label: "Idade válida", ok: chrono !== null, detail: chrono === null ? "anos de 0 a 17 e meses de 0 a 11" : `${chrono} meses` },
    ...(useCorrected ? [{ label: "Idade corrigida válida", ok: correctedValid && chrono !== null, detail: "informada pelo médico, antes de 24 meses" }] : []),
    { label: "Ficha selecionada", ok: Boolean(selectedBand), detail: selectedBand?.label },
    { label: "Kit conferido item a item", ok: Boolean(selectedBand) && completeKit(selectedBand?.id ?? "", kits[selectedBand?.id ?? ""] ?? {}), detail: selectedBand ? `${kitChecked}/${kitItems.length} itens` : "depende da ficha" },
    { label: "Dispositivo de filmagem disponível", ok: kits[selectedBand?.id ?? ""]?.device === "ready", detail: "celular ou tablet institucional fixo" },
    { label: "Confirmações de segurança", ok: checks.every(Boolean), detail: `${checks.filter(Boolean).length}/${CHECKS.length}` },
  ];
  const currentJson = JSON.stringify(record, null, 2);
  const exportedCurrent = delivered.txt === report && delivered.json === currentJson;
  const videoResolved = videoDeliveryDone({
    integratedRecordingAvailable: Boolean(media.url),
    integratedRecordingConfirmedSaved: delivered.videoSavedConfirmed,
    externalClipConfirmed: Boolean(evidence.clips.length),
    externalRecordingConfirmedSaved: delivered.externalVideoSavedConfirmed,
    unavailableDocumented: delivered.videoUnavailableDeclared,
  });
  const dossierCurrent = delivered.md === dossier;
  const steps = finished ? nextSteps({
    described: observations.length > 0 && incomplete === 0,
    reviewed: handoff.recordsReviewed,
    exported: exportedCurrent,
    video: videoResolved,
    dossier: dossierCurrent,
    declared: Boolean(handoff.declaredAt) && exportedCurrent,
  }) : [];
  function printScript() {
    if (!selectedBand) return;
    const text = makeScript(selectedBand.id, { proneAllowed: context.proneAllowed, months: effective ?? undefined });
    if (!printPlainTextDocument({ title: `OBS-10 — roteiro ${selectedBand.label}`, text })) setMessage("Impressão bloqueada pelo navegador. Permita a janela ou use a exportação TXT.");
  }
  const stepObservations = observations.filter((o) => o.phase === step);
  const updateContext = (patch: Partial<SessionContext>) => { setHandoff(emptyHandoff()); setContext((current) => ({ ...current, ...patch })); };
  function restoreForReview(value: SessionRecord) {
    startTicket.current += 1; starting.current = false; media.reset();
    started.current = null; monotonicStart.current = null; lastElapsed.current = value.durationSeconds; ended.current = true;
    sequence.current = 0; workClock.reset(); setEvidence(value.evidence ?? emptyEvidence()); setPilot(value.pilot ?? emptyPilot()); setReviewEpoch((n) => n + 1);
    setContext(value.context); setObservations(value.observations); setImportedRecord(value); setSessionId(value.sessionId || crypto.randomUUID());
    setElapsed(value.durationSeconds); setEndReason(value.endReason); setEncodingSecond(value.encodingSecond); setRecallSecond(value.recallSecond);
    setCameraEnabled(false); setHandoff(emptyHandoff()); setUrgent(false); setStep(0); setImportBusy(false);
    const kit = Object.fromEntries(KITS[value.context.bandId].filter((item) => value.context.missingMaterials?.includes(MATERIALS[item.id].label)).map((item) => [item.id, "missing"])) as KitState;
    setKits({ [value.context.bandId]: kit });
    setStage("finished"); setMessage("Registro reaberto apenas para revisão. Nenhum vídeo foi carregado; o cronômetro permanece encerrado.");
  }
  function openReviewPhase(index: number) {
    setStep(index);
    window.setTimeout(() => document.querySelector(".obs10-records")?.scrollIntoView({ block: "start", behavior: "auto" }), 0);
  }

  return (
    <div className="obs10" data-testid="obs10-workspace">
      <header className="obs10-hero obs10-no-print">
        <div className="obs10-mascot" aria-hidden="true">🧸<span>✦</span></div>
        <div>
          <div className="obs10-eyebrow">NEUROPED · OBS-10 · GUIA DA ASSISTENTE</div>
          <h1>{OBS10_TITLE}</h1>
          <p>Uma idade. Um roteiro. Até dez minutos de observação — com cuidado em cada passo.</p>
          <div className="obs10-chips"><span><Baby size={15} />13 faixas etárias</span><span><Timer size={15} />Até 10 minutos</span><span><ShieldCheck size={15} />Revisão médica</span></div>
        </div>
      </header>
      <div className="obs10-notice obs10-no-print"><ShieldCheck size={19} aria-hidden="true" /><p><strong>Você aplica e registra. O médico interpreta.</strong> Roteiro autoral não validado; não é exame completo, escala ou diagnóstico. Sem notas, percentis ou classificação de inteligência.</p></div>
      <JourneyMap stage={stage} delivered={Boolean(handoff.declaredAt)} />
      {stage === "setup" && <FirstTimeGuide />}
      {stage === "setup" && <PracticalMaterials actualBand={selectedBand} previewId={previewBand} onPreview={setPreviewBand}
        state={selectedBand ? kits[selectedBand.id] ?? {} : {}} locked={media.pending || starting.current || importBusy}
        onState={(value) => { if (selectedBand) setKits((current) => ({ ...current, [selectedBand.id]: value })); }}>
        <fieldset disabled={media.pending || starting.current || importBusy} className="obs10-age-fieldset">
          <p className="obs10-muted">Informe anos e meses completos. Para bebês, use zero no campo de anos.</p>
          <div className="obs10-fields">

            <label>Anos completos<input type="number" inputMode="numeric" min="0" max="17" value={years} onChange={(e) => { setYears(e.target.value); setPreviewBand(null); }} /></label>
            <label>Meses adicionais<input type="number" inputMode="numeric" min="0" max="11" value={months} onChange={(e) => { setMonths(e.target.value); setPreviewBand(null); }} /></label>
          </div>
          <AgeFromBirthDate disabled={media.pending || starting.current || importBusy} onFill={(y, m) => { setYears(y); setMonths(m); setPreviewBand(null); }} />
          <label className="obs10-check"><input type="checkbox" checked={useCorrected} onChange={(e) => setUseCorrected(e.target.checked)} />Usar idade corrigida informada pelo médico (prematuros, antes de 24 meses)</label>
          {useCorrected && <label>Idade corrigida em meses completos<input type="number" min="0" max="23" value={corrected} onChange={(e) => setCorrected(e.target.value)} /></label>}
          {!correctedValid && <p role="alert" className="obs10-error">Confirme a idade corrigida com o médico: deve ser não negativa, não maior que a cronológica e utilizada antes de 24 meses.</p>}
          {(years !== "" || months !== "") && chrono === null && <p className="obs10-error">Informe anos de 0 a 17 e meses adicionais de 0 a 11.</p>}
          <div className="obs10-band-selected" aria-live="polite">{selectedBand ? <><span aria-hidden="true">{selectedBand.icon}</span><div><strong>Ficha da aplicação: {selectedBand.label}</strong><p>{useCorrected ? "Selecionada pela idade corrigida informada." : `${chrono} meses de idade cronológica.`}</p></div></> : <p>Preencha a idade para selecionar a ficha e liberar a preparação.</p>}</div>
        </fieldset>
      </PracticalMaterials>}
      <details className="obs10-guide obs10-no-print">
        <summary>🌷 Guia rápido: o que fazer, filmar e registrar</summary>
        <div className="obs10-guide-grid">
          <section><h2>A cada tarefa</h2><ol>{APPLICATION_RULES.map((rule) => <li key={rule}>{rule}</li>)}</ol><p>Uma repetição verbal; uma demonstração somente quando prevista. Adaptações habituais são permitidas e precisam ser registradas.</p></section>
          <section><h2>Filme o processo</h2><p>Celular fixo e horizontal; preferencialmente 1080p/30 quadros, luz frontal, som claro, sem filtros. Mostre rosto e mãos na mesa; corpo inteiro e pés ao mover; mão, lápis e folha na escrita.</p><p>Não corte tentativas ou ajuda. Não ensaie nem escolha apenas o acerto. Use outro dispositivo para filmagem externa; sair desta aba encerra a coleta.</p></section>
          <section><h2>Registre, não diagnostique</h2><p>Em vez de “não tem atenção”, escreva “iniciou após repetição do comando”. Em vez de “fraqueza”, descreva o apoio usado para levantar.</p><p><strong>Não demonstrado ≠ incapaz. Recusa ≠ alteração.</strong> Sem dado, deixe explícito “não avaliável”. Humor referido é diferente de expressão observada.</p></section>
          <section><h2>Nunca faça</h2><p>Reflexos, força contra resistência, estímulo doloroso, tração pelos braços, movimentos passivos, equilíbrio de olhos fechados, escadas, hiperventilação ou sustos. Não retire apoio nem objeto regulador; não force contato ocular.</p><p>Recusa persistente, dor, tontura ou cansaço: pare a tarefa. Não provoque frustração para avaliar reação.</p></section>
        </div>
      </details>
      <PilotPanel record={record} stage={stage} activePhase={workClock.phase} seconds={workClock.seconds} onStart={workClock.start} onStop={() => workClock.stop()} onChange={(p) => { setPilot(p); setHandoff(emptyHandoff()); }} />

      {stage === "setup" && <div className="obs10-setup obs10-no-print">
        <section className="obs10-panel">
          <h2><span className="obs10-number">2</span>Identifique e adapte a aplicação</h2>
          <fieldset disabled={media.pending || starting.current || importBusy} className="obs10-context-fieldset">
            <label>Código institucional, sem nome<input value={context.code} maxLength={32} placeholder="Ex.: OBS-001" onChange={(e) => updateContext({ code: e.target.value })} /></label>
          <div className="obs10-fields"><label>Escolaridade (sem nome da escola)<input value={context.schooling} maxLength={120} onChange={(e) => updateContext({ schooling: e.target.value })} /></label><label>Idioma / comunicação utilizada<input value={context.language} maxLength={120} onChange={(e) => updateContext({ language: e.target.value })} /></label></div>
          <label>Óculos, aparelho auditivo, comunicação e apoios habituais<textarea value={context.adaptations} maxLength={1500} onChange={(e) => updateContext({ adaptations: e.target.value })} /></label>
          <label>Condições do dia: sono, fome, dor, doença, medicação e horário informados<textarea value={context.conditions} maxLength={1500} onChange={(e) => updateContext({ conditions: e.target.value })} /></label>
          <label>Relato familiar relevante (separado do que você observa)<textarea value={context.familyReport} maxLength={2000} onChange={(e) => updateContext({ familyReport: e.target.value })} /></label>
          {selectedBand && selectedBand.min < 9 && <label className="obs10-check"><input type="checkbox" checked={context.proneAllowed} onChange={(e) => updateContext({ proneAllowed: e.target.checked })} />Médico autorizou posição de bruços; somente acordado, supervisionado e se tolerado.</label>}
          </fieldset>
        </section>
        <section className="obs10-panel">
          <h2><span className="obs10-number">3</span>Confira e inicie com segurança</h2>
          <p>Antes do cronômetro, confirme os itens abaixo. Mudança aguda ou perda de habilidade: avise o médico antes da aplicação.</p>
          <fieldset disabled={media.pending || starting.current || importBusy} className="obs10-checklist">{CHECKS.map((item, index) => <label key={item} className={`obs10-check ${checks[index] ? "is-checked" : ""}`}><input type="checkbox" checked={checks[index]} onChange={(e) => setChecks((current) => current.map((value, i) => i === index ? e.target.checked : value))} /><span>{item}</span></label>)}</fieldset>
          <div className="obs10-actions"><button type="button" disabled={!selectedBand || media.pending || importBusy} onClick={printScript}>Imprimir roteiro completo da ficha</button></div>
          <p className="obs10-muted">O roteiro impresso traz kit, comando, passos e o que registrar de cada tarefa da ficha, para ler ao lado da câmera sem mostrar a tela à criança.</p>
          <FramingGuide />
          <OperatorRehearsal />
          <div className="obs10-privacy"><h3><ShieldCheck size={18} />Dados só nesta tela</h3><p>Sem salvamento automático, envio ao servidor ou análise por IA. Rosto e voz identificam a criança: um código não anonimiza o vídeo. Não use nome, escola, endereço ou uniforme identificável.</p><p>Exporte apenas para armazenamento institucional autorizado. Compartilhamento externo/IA depende de autorização e fluxo próprio da clínica. As marcações acima não substituem o termo institucional.</p></div>
          <label className="obs10-check"><input type="checkbox" checked={cameraEnabled} disabled={media.pending || importBusy} onChange={(e) => { if (!e.target.checked) cancelCamera(); setCameraEnabled(e.target.checked); }} /><span><strong>Usar câmera e microfone deste dispositivo</strong><br />Opcional. Sem esta opção, filme em outro dispositivo institucional.</span></label>
          {cameraEnabled && <div className="obs10-camera-test">
            <button type="button" disabled={media.pending || importBusy || media.status === "preview"} onClick={() => void media.prepare()}>Testar câmera antes de iniciar</button>
            {media.stream && <><video ref={video} autoPlay muted playsInline aria-label="Teste de enquadramento antes da aplicação" /><p><strong>Prévia, sem gravação.</strong> Confira enquadramento e disponibilidade do microfone no navegador. Este vídeo não permite ouvir a própria captação; confirme o áudio do arquivo após gravar.</p><button type="button" onClick={cancelCamera}>Fechar prévia</button></>}
            <p>A primeira permissão abre a câmera. Iniciar aplicação começa a gravação e o cronômetro. Para filmagem externa, use outro dispositivo.</p>
          </div>}
          <p className="obs10-muted">Preparação fora dos dez minutos. Depois do início, pausas e transições contam. Não encene respostas nem prolongue para terminar tudo.</p>
          {media.error && <p role="alert" className="obs10-error">{media.error}</p>}
          <Readiness items={readiness} />
          <button type="button" className="obs10-primary obs10-wide" disabled={!ready || media.pending} onClick={() => void start()}><Camera size={19} />{media.pending ? "Aguardando câmera e microfone…" : "Iniciar aplicação · 10 minutos"}</button>
          {media.pending && <button type="button" className="obs10-secondary obs10-wide" onClick={cancelCamera}>Cancelar solicitação de câmera</button>}
          <OpeningScripts />
        </section>
      </div>}

      {stage === "setup" && <AudioPreflight disabled={media.pending || Boolean(media.stream) || importBusy} />}
      {stage === "setup" && <ImportReview disabled={media.pending || Boolean(media.stream) || starting.current} onImport={restoreForReview} onBusy={setImportBusy} />}
      {stage !== "setup" && band && <div className="obs10-no-print">
        <div className="obs10-toolbar">
          <div className={`obs10-clock ${elapsed >= 510 ? "is-ending" : ""}`}><Timer size={21} /><span aria-label="Tempo de aplicação" data-testid="obs10-clock">{clock(elapsed)}</span><small>/ 10:00</small></div>
          <div><strong>{band.icon} {band.label}</strong><span className="obs10-muted"> {finished ? "· encerrada; revise os registros" : "· observação em andamento"}</span></div>
          {running && <button type="button" className="obs10-secondary" onClick={() => finish("Encerramento antecipado pela aplicadora; conferir tarefas não realizadas.")}><Square size={16} />Encerrar antes</button>}
          <button type="button" className="obs10-danger" onClick={emergencyStop}>Interromper e chamar médico</button>
        </div>
        <progress className="obs10-progress" max={600} value={elapsed} aria-label="Tempo utilizado da aplicação" />
        {finished && <div className="obs10-notice" role="status"><Check size={20} /><p><strong>Aplicação encerrada.</strong> {endReason} Não continue tarefas. Você ainda pode completar o registro do que já observou.</p></div>}
        {media.error && <p role="alert" className="obs10-error">{media.error}</p>}
        {media.stream && <div className="obs10-camera"><video ref={video} autoPlay muted playsInline aria-label="Prévia local da câmera" /><p>Câmera e microfone ativos. Ajuste o enquadramento ao bloco; nenhuma transmissão externa.</p></div>}
        <nav className="obs10-stepper" aria-label="Blocos de observação">{PHASES.map((phase, index) => <button type="button" key={phase.title} className={step === index ? "is-active" : ""} aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)}><span aria-hidden="true">{phase.icon}</span><strong>{index + 1}. {phase.title}</strong><small>{clock(phase.start)}–{clock(phase.end)}</small></button>)}</nav>
        {running && expectedStep !== step && <div className="obs10-time-hint" role="status">Janela sugerida pelo cronômetro: {PHASES[expectedStep].title}. Não prolongue uma tentativa.<button type="button" onClick={() => setStep(expectedStep)}>Abrir bloco sugerido</button></div>}
        {running && <LiveHelp />}
        {finished && <NextSteps steps={steps} />}
        <div className="obs10-live-grid">
          <section className="obs10-panel obs10-task">
            <div className="obs10-eyebrow">BLOCO {step + 1} DE 6 · {clock(PHASES[step].start)}–{clock(PHASES[step].end)}</div>
            <h2>{PHASES[step].icon} {PHASES[step].title}</h2>
            <PracticalTaskGuide key={`${band.id}-${step}`} band={band} phase={step} months={context.correctedMonths ?? context.chronologicalMonths}
              proneAllowed={context.proneAllowed} kit={activeKit} observations={observations} running={running} finished={finished}
              onRecord={quickRecord} onNextPhase={() => setStep((current) => Math.min(5, current + 1))} />
            <details><summary>Roteiro integral de referência</summary><p>{band.tasks[step]}</p></details>
            <div className="obs10-camera-tip"><Camera size={21} /><p><strong>Como filmar</strong><br />{PHASES[step].camera}</p></div>
            <p className="obs10-muted">Dê a instrução → aguarde ~5 s → repita uma vez → modelo só se previsto → registre e siga.</p>
            {band.min >= 72 && (step === 2 || step === 5) && <div className="obs10-memory">
              <h3>Horário da tarefa de memória</h3><p>Marque somente quando tiver apresentado e conferido o registro ou solicitado a evocação. Anote a resposta literal; não há pontuação.</p>
              {step === 2 && <button type="button" disabled={!running || encodingSecond !== null} onClick={() => setEncodingSecond(nowSecond())}>{encodingSecond === null ? "Marcar registro inicial agora" : `Registro marcado em ${clock(encodingSecond)}`}</button>}
              {step === 5 && <button type="button" disabled={!running || encodingSecond === null || recallSecond !== null} onClick={() => setRecallSecond(nowSecond())}>{recallSecond === null ? "Marcar evocação agora" : `Evocação marcada em ${clock(recallSecond)}`}</button>}
              {encodingSecond !== null && recallSecond !== null && <p>Intervalo efetivamente marcado: {recallSecond - encodingSecond} segundos. Interpretar com o registro inicial.</p>}
            </div>}
            <details><summary>Referência e cuidado de interpretação</summary><p>{band.reference}</p><p>{band.caution}</p></details>
            <div className="obs10-actions"><button type="button" disabled={step === 0} onClick={() => setStep((current) => current - 1)}><ChevronLeft size={17} />Anterior</button><button type="button" disabled={step === 5} onClick={() => setStep((current) => current + 1)}>Próximo bloco<ChevronRight size={17} /></button></div>
          </section>
          <section className="obs10-panel obs10-records">
            <h2><ClipboardList size={22} />Como registrar o que aconteceu</h2>
            <p>Marque uma categoria no cartão ao lado. <strong>Detalhe os fatos depois da coleta.</strong> As categorias não geram descrições nem diagnósticos. Os campos incompletos permanecerão sinalizados.</p>
            <button type="button" className="obs10-secondary obs10-wide" disabled={observations.length >= 200} onClick={addObservation}>+ Registrar uma tarefa deste bloco</button>
            {!stepObservations.length && <div className="obs10-empty"><span aria-hidden="true">🌱</span><p>Nenhuma tarefa registrada neste bloco.<br />Isso não significa habilidade ausente ou preservada.</p></div>}
            {stepObservations.map((entry, index) => <details className="obs10-record-details" key={entry.id} open={!running || !entry.id.startsWith("guided-")}><summary>{entry.task || `Tarefa observada ${index + 1}`} · {entry.response ? "descrição registrada" : "detalhar depois"}</summary><fieldset className="obs10-observation"><legend>Tarefa observada {index + 1}</legend>
              {entry.editedAfterEnd && <p className="obs10-muted">Descrição complementada após a coleta; horário original preservado.</p>}
              <label>Qual tarefa?<input value={entry.task} maxLength={180} placeholder="Ex.: seguir comando de dois passos" onChange={(e) => updateObservation(entry.id, { task: e.target.value })} /></label>
              <label>O que fez ou falou? Descreva literalmente<textarea aria-label="O que fez ou falou? Descreva literalmente" value={entry.response} maxLength={2000} placeholder="Ex.: realizou a primeira ação; concluiu a segunda após repetição." onChange={(e) => updateObservation(entry.id, { response: e.target.value })} /></label>
              <label>Como respondeu?<select aria-label="Como respondeu?" value={entry.outcome} onChange={(e) => updateObservation(entry.id, { outcome: e.target.value as Observation["outcome"] })}><option value="">Escolha sem presumir resultado</option>{OUTCOMES.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label>
              {entry.outcome && <p className="obs10-category-help">{OUTCOMES.find((o) => o.id === entry.outcome)?.description}</p>}
              <label>Ajuda, adaptação ou motivo de não aplicação<textarea aria-label="Ajuda, adaptação ou motivo de não aplicação" value={entry.assistance} maxLength={1000} onChange={(e) => updateObservation(entry.id, { assistance: e.target.value })} /></label>
              <label>Qualidade do trecho, conferida por você<select aria-label="Qualidade do trecho, conferida por você" value={entry.quality} onChange={(e) => updateObservation(entry.id, { quality: e.target.value as Observation["quality"] })}><option value="">Ainda não conferida</option><option>Nítido</option><option>Parcial</option><option>Não avaliável</option></select></label>
              <div className="obs10-fields"><label>Clipe (opcional)<input value={entry.clip} maxLength={40} placeholder="Ex.: B" onChange={(e) => updateObservation(entry.id, { clip: e.target.value })} /></label><label>Tempo no vídeo (conferido)<input value={entry.videoTime} maxLength={20} placeholder="Ex.: 01:20" onChange={(e) => updateObservation(entry.id, { videoTime: e.target.value })} /></label></div>
              <button type="button" className="obs10-text-button" onClick={() => { if (evidence.moments.some((m) => m.observationId === entry.id)) { setMessage("Esta tarefa possui trechos vinculados. Preserve a origem e acrescente uma retificação na descrição."); return; } if (window.confirm("Excluir apenas este registro de tarefa?")) { setHandoff(emptyHandoff()); setObservations((current) => current.filter((o) => o.id !== entry.id)); } }}>Excluir este registro</button>
            </fieldset></details>)}
          </section>
        </div>
        {finished && <>
          {importedRecord && <div className="obs10-notice"><p><strong>Revisão de registro importado.</strong> Versão de origem {record.version}. O JSON não contém vídeo. Nenhuma coleta foi reiniciada.</p></div>}
          <label className="obs10-review-code">Código institucional do registro<input disabled={evidence.clips.length > 0} title={evidence.clips.length ? "Código protegido após associar vídeo; use nova sessão para outro registro." : undefined} value={context.code} maxLength={32} onChange={(e) => updateContext({ code: e.target.value })} /></label>
          <SessionReview record={record} finalizing={media.status === "finalizing"} onOpenPhase={openReviewPhase} onChange={setHandoff} />
        </>}
        {finished && <section className="obs10-panel obs10-delivery">
          <h2>🌷 Revisar e entregar ao médico</h2><p>Confirme ficha, tarefas, ajuda, áudio e enquadramento. Não complete lacunas com “normal”. Os registros podem ser corrigidos nos blocos acima sem reiniciar a aplicação.</p>
          <p className="obs10-note-counter">{PRACTICAL_TASKS[band.id].filter((task) => !observations.some((entry) => entry.id === `guided-${task.id}`)).length} cartões sem marcação guiada. Confira também seus registros livres; ausência de marcação não é prova de ausência de habilidade.</p>
          {incomplete > 0 && <p role="status" className="obs10-caution">{incomplete} registro(s) incompleto(s). A exportação apontará explicitamente as informações que faltam.</p>}
          <div className="obs10-actions"><button type="button" className="obs10-primary" onClick={() => { saveFile(exportFilename(context.code, "txt", sessionId), report, "text/plain;charset=utf-8"); setDelivered((d) => ({ ...d, txt: report })); setMessage("Download solicitado. Confirme o arquivo no armazenamento institucional antes de sair."); }}><Download size={17} />Exportar registro TXT</button><button type="button" onClick={() => { saveFile(exportFilename(context.code, "json", sessionId), currentJson, "application/json"); setDelivered((d) => ({ ...d, json: currentJson })); setMessage("Download JSON solicitado; nenhum envio ao servidor."); }}>Exportar JSON</button><button type="button" onClick={() => { if (!printPlainTextDocument({ title: "OBS-10 — registro para revisão", text: report })) setMessage("Impressão bloqueada pelo navegador. Permita a janela ou use a exportação TXT."); }}>Imprimir resumo</button></div>
          {media.status === "finalizing" && <p role="status" className="obs10-caution">Finalizando o arquivo de vídeo. Não saia nem reinicie a sessão até aparecer o arquivo ou uma mensagem de falha.</p>}
          {media.url && <div className="obs10-video-result"><video controls playsInline src={media.url} aria-label="Revisão do vídeo local" /><a className="obs10-download" href={media.url} download={exportFilename(context.code, media.mime.includes("mp4") ? "mp4" : "webm", sessionId)} onClick={() => setDelivered((d) => ({ ...d, videoDownloadRequested: true, videoSavedConfirmed: false }))}>Salvar vídeo no dispositivo institucional</a><label className="obs10-check"><input type="checkbox" checked={delivered.videoSavedConfirmed} disabled={!delivered.videoDownloadRequested} onChange={(event) => setDelivered((d) => ({ ...d, videoSavedConfirmed: event.target.checked }))} />Confirmei que o arquivo de vídeo apareceu no armazenamento institucional.</label><p>O clique inicia o download, mas não prova que o navegador concluiu a gravação no destino. Confirme o arquivo antes de sair. Não foi analisado por IA nem enviado ao prontuário.</p></div>}
          {!media.url && <div className="obs10-video-result"><p><strong>Filmagem externa ou vídeo indisponível.</strong> Escolha apenas a situação que realmente ocorreu.</p><label className="obs10-check"><input type="checkbox" checked={delivered.externalVideoSavedConfirmed} onChange={(event) => setDelivered((d) => ({ ...d, externalVideoSavedConfirmed: event.target.checked, videoUnavailableDeclared: event.target.checked ? false : d.videoUnavailableDeclared }))} />Confirmei que a filmagem externa foi salva no fluxo institucional deste atendimento.</label><label className="obs10-check"><input type="checkbox" checked={delivered.videoUnavailableDeclared} onChange={(event) => setDelivered((d) => ({ ...d, videoUnavailableDeclared: event.target.checked, externalVideoSavedConfirmed: event.target.checked ? false : d.externalVideoSavedConfirmed }))} />Não há arquivo de vídeo utilizável; a indisponibilidade foi documentada para o médico.</label></div>}
          <p role="status">{message}</p><p className="obs10-caution"><strong>Antes de sair:</strong> exporte o registro e, se houver, salve o vídeo. Recarregar ou navegar para outra página elimina os dados desta sessão.</p>
          <button type="button" className="obs10-secondary" disabled={media.status === "finalizing"} onClick={resetSession}>Nova aplicação · limpar esta sessão</button>
        </section>}
        {finished && <DossierPanel text={dossier} onCopy={() => setDelivered((d) => ({ ...d, md: dossier }))} onDownload={() => { saveFile(exportFilename(context.code, "md", sessionId), dossier, "text/markdown;charset=utf-8"); setDelivered((d) => ({ ...d, md: dossier })); setMessage("Download do dossiê solicitado; nenhum envio ao servidor."); }} />}
      </div>}
      {finished && <div className="obs10-no-print"><EvidencePanel key={`${sessionId}-${reviewEpoch}`} record={record} onChange={(value) => { setEvidence(value); setHandoff(emptyHandoff()); }} /></div>}
      {finished && <section className="obs10-summary"><h2>Resumo para revisão médica</h2><pre>{report}</pre></section>}
      {urgent && <section className="obs10-emergency obs10-no-print" role="alert" aria-labelledby="obs10-emergency-title"><h2 id="obs10-emergency-title">Pare a avaliação. Chame o médico agora.</h2><p>Alteração de consciência, crise, dificuldade respiratória, fraqueza súbita, instabilidade nova, dor intensa ou risco imediato: acione o fluxo presencial da clínica. Em emergência, <a href="tel:192">SAMU 192</a>. Não espere vídeo ou IA.</p><p>Em crise: proteja de lesões, não contenha à força e não coloque nada na boca. Relato de autoagressão/abuso: pare a gravação sensível, acolha sem perguntas sugestivas e acione o médico; diante de risco imediato, não deixe sozinho.</p><button type="button" onClick={() => setUrgent(false)}>Entendido · manter aplicação encerrada</button></section>}
      <footer className="obs10-footer obs10-no-print">{!running && <p><a href="/obs10-global/" target="_blank" rel="noopener noreferrer">Apresentação internacional · Português / English / Español</a> · Explore fora da coleta.</p>}<details><summary>Fontes, versão e limites clínicos</summary><p>OBS-10 v{OBS10_VERSION} · Manual e fichas de 17/09/2026. Tempos, comandos e fluxo são propostas autorais; nenhuma fonte valida o conjunto como teste diagnóstico. Revisão médica e aplicações supervisionadas antecedem uso rotineiro.</p><p>Não inferir força 5/5, tônus/reflexos preservados, normalidade do exame, QI, idade mental, CID ou risco ausente. Investigação de saúde mental e risco suicida segue fluxo clínico confidencial, não interrogatório filmado pela secretária.</p>{SOURCES.map(([label, href]) => <p key={href}><a href={href} target="_blank" rel="noreferrer">{label}</a></p>)}</details><p>Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756</p></footer>
    </div>
  );
}
