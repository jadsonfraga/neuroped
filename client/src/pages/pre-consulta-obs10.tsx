import { useCallback, useEffect, useRef, useState } from "react";
import { Baby, Camera, Check, ChevronLeft, ChevronRight, ClipboardList, Download, Heart, ShieldCheck, Square, Timer } from "lucide-react";
import { AGE_BANDS, MAX_SECONDS, MOTOR_CORE, OBS10_TITLE, OBS10_VERSION, OUTCOMES, PHASES, SOURCES, bandForMonths, clock, elapsedSeconds, phaseForSeconds } from "@/features/obs10/protocol";
import { emptyObservation, exportFilename, makeReport, parseAge, usableObservation, validCorrectedAge, type Observation, type SessionContext, type SessionRecord } from "@/features/obs10/session";
import { useLocalRecorder } from "@/features/obs10/useLocalRecorder";
import "@/features/obs10/obs10.css";

const CHECKS = [
  "Autorização institucional para filmar registrada; finalidade e privacidade explicadas.",
  "Participação aceita conforme compreensão; criança acordada, confortável e sem mudança aguda.",
  "Aplicadora treinada e médico disponível para intercorrências.",
  "Piso seguro, cuidador próximo e apoios habituais preservados.",
  "Materiais separados, sem peças pequenas, comida ou objetos perigosos.",
  "Enquadramento e áudio conferidos; celular horizontal, sem filtros ou espelhamento.",
] as const;
const RULES = ["Diga o comando da ficha.", "Aguarde cerca de 5 segundos.", "Repita uma única vez.", "Demonstre uma vez, só quando permitido.", "Registre a ajuda e siga. Não treine até acertar."];
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
  const [stage, setStage] = useState<"setup" | "running" | "finished">("setup");
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [endReason, setEndReason] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [encodingSecond, setEncodingSecond] = useState<number | null>(null);
  const [recallSecond, setRecallSecond] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const started = useRef<number | null>(null);
  const ended = useRef(false);
  const sequence = useRef(0);
  const starting = useRef(false);
  const finishRef = useRef<(reason: string) => void>(() => undefined);
  const media = useLocalRecorder();
  const chrono = parseAge(years, months);
  const correctedValid = validCorrectedAge(chrono, corrected, useCorrected);
  const effective = chrono === null || !correctedValid ? null : useCorrected ? Number(corrected) : chrono;
  const selectedBand = effective === null ? undefined : bandForMonths(effective);
  const band = stage === "setup" ? selectedBand : AGE_BANDS.find((item) => item.id === context.bandId);
  const preview = AGE_BANDS.find((item) => item.id === previewBand) ?? selectedBand;
  const ready = Boolean(selectedBand && checks.every(Boolean) && correctedValid);
  const running = stage === "running";
  const finished = stage === "finished";
  const expectedStep = phaseForSeconds(elapsed);
  const nowSecond = useCallback(() => started.current === null ? 0 : elapsedSeconds(started.current, Date.now()), []);

  const finish = useCallback((reason: string) => {
    if (ended.current || started.current === null) return;
    ended.current = true;
    setElapsed(nowSecond());
    media.stop();
    setEndReason(reason);
    setStage("finished");
  }, [media.stop, nowSecond]);
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
    if (stage === "setup") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [stage]);
  useEffect(() => {
    if (running && media.error) finishRef.current("Interrupção técnica da captação; vídeo pode estar incompleto.");
  }, [media.error, running]);

  async function start() {
    if (!ready || !selectedBand || chrono === null || starting.current) return;
    starting.current = true;
    if (!cameraEnabled) media.reset();
    if (cameraEnabled && !(await media.start())) { starting.current = false; return; }
    setContext((current) => ({ ...current, chronologicalMonths: chrono, correctedMonths: useCorrected ? Number(corrected) : null, bandId: selectedBand.id }));
    started.current = Date.now(); ended.current = false; setElapsed(0); setStep(0); setStage("running");
    starting.current = false;
  }
  function emergencyStop() {
    if (running) media.stop(); else media.cancel();
    if (running) finish("Interrompido por segurança; chamar médico/equipe imediatamente.");
    setUrgent(true);
  }
  function resetSession() {
    if (!window.confirm("Exportou o registro e, se houver, o vídeo? Uma nova aplicação apaga os dados desta tela. Continuar?")) return;
    media.reset();
    started.current = null; ended.current = false; sequence.current = 0;
    setStage("setup"); setElapsed(0); setStep(0); setObservations([]); setEndReason("");
    setEncodingSecond(null); setRecallSecond(null); setUrgent(false); setMessage("");
    setContext(MISSING_CONTEXT); setYears(""); setMonths(""); setCorrected(""); setUseCorrected(false);
    setChecks(CHECKS.map(() => false)); setPreviewBand(null); setCameraEnabled(false);
  }
  function updateObservation(id: string, patch: Partial<Observation>) {
    setObservations((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry));
  }
  function addObservation() {
    setObservations((current) => [...current, emptyObservation(String(++sequence.current), step, nowSecond())]);
  }
  const record: SessionRecord = {
    version: OBS10_VERSION, context, observations, durationSeconds: elapsed, endReason, encodingSecond, recallSecond,
    recording: cameraEnabled ? media.url ? "Vídeo local disponível; conteúdo e integridade ainda não verificados pelo médico." : "Câmera integrada solicitada; confirme a existência e a integridade do arquivo antes de sair." : "Filmagem externa orientada; nenhum vídeo recebido ou verificado por este aplicativo.",
  };
  const report = makeReport(record);
  const incomplete = observations.filter((o) => !usableObservation(o)).length;
  const stepObservations = observations.filter((o) => o.phase === step);
  const updateContext = (patch: Partial<SessionContext>) => setContext((current) => ({ ...current, ...patch }));

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
      <details className="obs10-guide obs10-no-print">
        <summary>🌷 Guia rápido: o que fazer, filmar e registrar</summary>
        <div className="obs10-guide-grid">
          <section><h2>A cada tarefa</h2><ol>{RULES.map((rule) => <li key={rule}>{rule}</li>)}</ol><p>Máximo de duas oportunidades; modelo apenas quando previsto. Adaptações habituais são permitidas e precisam ser registradas.</p></section>
          <section><h2>Filme o processo</h2><p>Celular fixo e horizontal; preferencialmente 1080p/30 quadros, luz frontal, som claro, sem filtros. Mostre rosto e mãos na mesa; corpo inteiro e pés ao mover; mão, lápis e folha na escrita.</p><p>Não corte tentativas ou ajuda. Não ensaie nem escolha apenas o acerto. Use outro dispositivo para filmagem externa; sair desta aba encerra a coleta.</p></section>
          <section><h2>Registre, não diagnostique</h2><p>Em vez de “não tem atenção”, escreva “iniciou após repetição do comando”. Em vez de “fraqueza”, descreva o apoio usado para levantar.</p><p><strong>Não demonstrado ≠ incapaz. Recusa ≠ alteração.</strong> Sem dado, deixe explícito “não avaliável”. Humor referido é diferente de expressão observada.</p></section>
          <section><h2>Nunca faça</h2><p>Reflexos, força contra resistência, estímulo doloroso, tração pelos braços, movimentos passivos, equilíbrio de olhos fechados, escadas, hiperventilação ou sustos. Não retire apoio nem objeto regulador; não force contato ocular.</p><p>Recusa persistente, dor, tontura ou cansaço: pare a tarefa. Não provoque frustração para avaliar reação.</p></section>
        </div>
      </details>

      {stage === "setup" && <div className="obs10-setup obs10-no-print">
        <section className="obs10-panel">
          <h2><span className="obs10-number">1</span>Escolha pela idade</h2>
          <p className="obs10-muted">Informe anos e meses completos. Para bebês, use zero no campo de anos.</p>
          <div className="obs10-fields">
            <label>Código institucional, sem nome<input value={context.code} maxLength={32} placeholder="Ex.: OBS-001" onChange={(e) => updateContext({ code: e.target.value })} /></label>
            <label>Anos completos<input type="number" inputMode="numeric" min="0" max="17" value={years} onChange={(e) => { setYears(e.target.value); setPreviewBand(null); }} /></label>
            <label>Meses adicionais<input type="number" inputMode="numeric" min="0" max="11" value={months} onChange={(e) => { setMonths(e.target.value); setPreviewBand(null); }} /></label>
          </div>
          <label className="obs10-check"><input type="checkbox" checked={useCorrected} onChange={(e) => setUseCorrected(e.target.checked)} />Usar idade corrigida informada pelo médico (prematuros, antes de 24 meses)</label>
          {useCorrected && <label>Idade corrigida em meses completos<input type="number" min="0" max="23" value={corrected} onChange={(e) => setCorrected(e.target.value)} /></label>}
          {!correctedValid && <p role="alert" className="obs10-error">Confirme a idade corrigida com o médico: deve ser não negativa, não maior que a cronológica e utilizada antes de 24 meses.</p>}
          {(years !== "" || months !== "") && chrono === null && <p className="obs10-error">Informe anos de 0 a 17 e meses adicionais de 0 a 11.</p>}
          <div className="obs10-band-selected" aria-live="polite">{selectedBand ? <><span aria-hidden="true">{selectedBand.icon}</span><div><strong>Ficha da aplicação: {selectedBand.label}</strong><p>{useCorrected ? "Selecionada pela idade corrigida informada." : `${chrono} meses de idade cronológica.`}</p></div></> : <p>Preencha a idade para selecionar a ficha e liberar a preparação.</p>}</div>
          <details><summary>Consultar as 13 fichas sem iniciar</summary><div className="obs10-band-grid">{AGE_BANDS.map((item) => <button type="button" key={item.id} aria-pressed={previewBand === item.id} onClick={() => setPreviewBand(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}</div><p className="obs10-muted">Consultar outra ficha não muda a faixa selecionada pela idade.</p></details>
          {preview && <div className="obs10-preview"><h3>{preview.label} · materiais e roteiro</h3><p><strong>Separe:</strong> {preview.materials}</p><details><summary>Ver comandos desta ficha</summary>{PHASES.map((phase, i) => <p key={phase.title}><strong>{clock(phase.start)}–{clock(phase.end)} · {phase.title}:</strong> {preview.tasks[i]}</p>)}</details><p><strong>Referência, não ponto de corte:</strong> {preview.reference}</p><p className="obs10-caution">{preview.caution}</p></div>}
          <div className="obs10-fields"><label>Escolaridade (sem nome da escola)<input value={context.schooling} maxLength={120} onChange={(e) => updateContext({ schooling: e.target.value })} /></label><label>Idioma / comunicação utilizada<input value={context.language} maxLength={120} onChange={(e) => updateContext({ language: e.target.value })} /></label></div>
          <label>Óculos, aparelho auditivo, comunicação e apoios habituais<textarea value={context.adaptations} maxLength={1500} onChange={(e) => updateContext({ adaptations: e.target.value })} /></label>
          <label>Condições do dia: sono, fome, dor, doença, medicação e horário informados<textarea value={context.conditions} maxLength={1500} onChange={(e) => updateContext({ conditions: e.target.value })} /></label>
          <label>Relato familiar relevante (separado do que você observa)<textarea value={context.familyReport} maxLength={2000} onChange={(e) => updateContext({ familyReport: e.target.value })} /></label>
          {selectedBand && selectedBand.min < 9 && <label className="obs10-check"><input type="checkbox" checked={context.proneAllowed} onChange={(e) => updateContext({ proneAllowed: e.target.checked })} />Médico autorizou posição de bruços; somente acordado, supervisionado e se tolerado.</label>}
        </section>
        <section className="obs10-panel">
          <h2><span className="obs10-number">2</span>Prepare com segurança</h2>
          <p>Antes do cronômetro, confirme os itens abaixo. Mudança aguda ou perda de habilidade: avise o médico antes da aplicação.</p>
          <div className="obs10-checklist">{CHECKS.map((item, index) => <label key={item} className={`obs10-check ${checks[index] ? "is-checked" : ""}`}><input type="checkbox" checked={checks[index]} onChange={(e) => setChecks((current) => current.map((value, i) => i === index ? e.target.checked : value))} /><span>{item}</span></label>)}</div>
          <div className="obs10-privacy"><h3><ShieldCheck size={18} />Dados só nesta tela</h3><p>Sem salvamento automático, envio ao servidor ou análise por IA. Rosto e voz identificam a criança: um código não anonimiza o vídeo. Não use nome, escola, endereço ou uniforme identificável.</p><p>Exporte apenas para armazenamento institucional autorizado. Compartilhamento externo/IA depende de autorização e fluxo próprio da clínica. As marcações acima não substituem o termo institucional.</p></div>
          <label className="obs10-check"><input type="checkbox" checked={cameraEnabled} disabled={media.pending} onChange={(e) => setCameraEnabled(e.target.checked)} /><span><strong>Usar câmera e microfone deste dispositivo</strong><br />Opcional. Sem esta opção, filme em outro dispositivo institucional.</span></label>
          <p className="obs10-muted">A permissão do navegador será solicitada ao iniciar. A preparação não consome os dez minutos. Pausas e transições depois do início consomem.</p>
          {media.error && <p role="alert" className="obs10-error">{media.error}</p>}
          <button type="button" className="obs10-primary obs10-wide" disabled={!ready || media.pending} onClick={() => void start()}><Camera size={19} />{media.pending ? "Aguardando câmera e microfone…" : "Iniciar aplicação · 10 minutos"}</button>
          {media.pending && <button type="button" className="obs10-secondary obs10-wide" onClick={() => { media.cancel(); starting.current = false; }}>Cancelar solicitação de câmera</button>}
          {!ready && <p className="obs10-muted">O início é liberado após idade válida e todas as confirmações de segurança.</p>}
          <div className="obs10-kind"><Heart size={18} /><p>“Vamos fazer algumas brincadeiras e movimentos para o médico conhecer seu jeito de fazer as coisas. Você pode pedir ajuda ou parar.”</p></div>
        </section>
      </div>}

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
        <div className="obs10-live-grid">
          <section className="obs10-panel obs10-task">
            <div className="obs10-eyebrow">BLOCO {step + 1} DE 6 · {clock(PHASES[step].start)}–{clock(PHASES[step].end)}</div>
            <h2>{PHASES[step].icon} {PHASES[step].title}</h2>
            <h3>O que falar e fazer</h3><p className="obs10-command">{band.tasks[step]}</p>
            {step === 3 && band.min < 9 && !context.proneAllowed && <div role="note" className="obs10-caution"><strong>Sem autorização para prono:</strong> omita qualquer posicionamento de bruços. Observe somente a posição habitual segura.</div>}
            {band.id === "m24" && (context.correctedMonths ?? context.chronologicalMonths) < 30 && (step === 2 || step === 3) && <p className="obs10-caution"><strong>Menos de 30 meses:</strong> não aplicar o desafio adicional de dois passos nem solicitar salto.</p>}
            {step === 3 && band.min >= 60 && <ol className="obs10-motor">{MOTOR_CORE.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>}
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
            <p>Use <strong>um registro para cada tarefa</strong>. Separe respostas diferentes; não dê uma nota ao bloco inteiro. Descreva fato, ajuda e limite.</p>
            <button type="button" className="obs10-secondary obs10-wide" onClick={addObservation}>+ Registrar uma tarefa deste bloco</button>
            {!stepObservations.length && <div className="obs10-empty"><span aria-hidden="true">🌱</span><p>Nenhuma tarefa registrada neste bloco.<br />Isso não significa habilidade ausente ou preservada.</p></div>}
            {stepObservations.map((entry, index) => <fieldset className="obs10-observation" key={entry.id}><legend>Tarefa observada {index + 1}</legend>
              <label>Qual tarefa?<input value={entry.task} maxLength={180} placeholder="Ex.: seguir comando de dois passos" onChange={(e) => updateObservation(entry.id, { task: e.target.value })} /></label>
              <label>O que fez ou falou? Descreva literalmente<textarea value={entry.response} maxLength={2000} placeholder="Ex.: realizou a primeira ação; concluiu a segunda após repetição." onChange={(e) => updateObservation(entry.id, { response: e.target.value })} /></label>
              <label>Como respondeu?<select value={entry.outcome} onChange={(e) => updateObservation(entry.id, { outcome: e.target.value as Observation["outcome"] })}><option value="">Escolha sem presumir resultado</option>{OUTCOMES.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label>
              {entry.outcome && <p className="obs10-category-help">{OUTCOMES.find((o) => o.id === entry.outcome)?.description}</p>}
              <label>Ajuda, adaptação ou motivo de não aplicação<textarea value={entry.assistance} maxLength={1000} onChange={(e) => updateObservation(entry.id, { assistance: e.target.value })} /></label>
              <label>Qualidade do trecho, conferida por você<select value={entry.quality} onChange={(e) => updateObservation(entry.id, { quality: e.target.value as Observation["quality"] })}><option value="">Ainda não conferida</option><option>Nítido</option><option>Parcial</option><option>Não avaliável</option></select></label>
              <div className="obs10-fields"><label>Clipe (opcional)<input value={entry.clip} maxLength={40} placeholder="Ex.: B" onChange={(e) => updateObservation(entry.id, { clip: e.target.value })} /></label><label>Tempo no vídeo (conferido)<input value={entry.videoTime} maxLength={20} placeholder="Ex.: 01:20" onChange={(e) => updateObservation(entry.id, { videoTime: e.target.value })} /></label></div>
              <button type="button" className="obs10-text-button" onClick={() => { if (window.confirm("Excluir apenas este registro de tarefa?")) setObservations((current) => current.filter((o) => o.id !== entry.id)); }}>Excluir este registro</button>
            </fieldset>)}
          </section>
        </div>
        {finished && <section className="obs10-panel obs10-delivery">
          <h2>🌷 Revisar e entregar ao médico</h2><p>Confirme ficha, tarefas, ajuda, áudio e enquadramento. Não complete lacunas com “normal”. Os registros podem ser corrigidos nos blocos acima sem reiniciar a aplicação.</p>
          {incomplete > 0 && <p role="status" className="obs10-caution">{incomplete} registro(s) incompleto(s). A exportação apontará explicitamente as informações que faltam.</p>}
          <div className="obs10-actions"><button type="button" className="obs10-primary" onClick={() => { saveFile(exportFilename(context.code, "txt"), report, "text/plain;charset=utf-8"); setMessage("Download solicitado. Confirme o arquivo no armazenamento institucional antes de sair."); }}><Download size={17} />Exportar registro TXT</button><button type="button" onClick={() => { saveFile(exportFilename(context.code, "json"), JSON.stringify(record, null, 2), "application/json"); setMessage("Download JSON solicitado; nenhum envio ao servidor."); }}>Exportar JSON</button><button type="button" onClick={() => window.print()}>Imprimir resumo</button></div>
          {media.url && <div className="obs10-video-result"><video controls playsInline src={media.url} aria-label="Revisão do vídeo local" /><a className="obs10-download" href={media.url} download={exportFilename(context.code, media.mime.includes("mp4") ? "mp4" : "webm")}>Salvar vídeo no dispositivo institucional</a><p>Arquivo somente nesta sessão. Revise som, enquadramento e integridade. Não foi analisado por IA nem enviado ao prontuário.</p></div>}
          <p role="status">{message}</p><p className="obs10-caution"><strong>Antes de sair:</strong> exporte o registro e, se houver, salve o vídeo. Recarregar ou navegar para outra página elimina os dados desta sessão.</p>
          <button type="button" className="obs10-secondary" onClick={resetSession}>Nova aplicação · limpar esta sessão</button>
        </section>}
      </div>}
      {finished && <section className="obs10-summary"><h2>Resumo para revisão médica</h2><pre>{report}</pre></section>}
      {urgent && <section className="obs10-emergency obs10-no-print" role="alert" aria-labelledby="obs10-emergency-title"><h2 id="obs10-emergency-title">Pare a avaliação. Chame o médico agora.</h2><p>Alteração de consciência, crise, dificuldade respiratória, fraqueza súbita, instabilidade nova, dor intensa ou risco imediato: acione o fluxo presencial da clínica. Em emergência, <a href="tel:192">SAMU 192</a>. Não espere vídeo ou IA.</p><p>Em crise: proteja de lesões, não contenha à força e não coloque nada na boca. Relato de autoagressão/abuso: pare a gravação sensível, acolha sem perguntas sugestivas e acione o médico; diante de risco imediato, não deixe sozinho.</p><button type="button" onClick={() => setUrgent(false)}>Entendido · manter aplicação encerrada</button></section>}
      <footer className="obs10-footer obs10-no-print"><details><summary>Fontes, versão e limites clínicos</summary><p>OBS-10 v{OBS10_VERSION} · Manual e fichas de 17/09/2026. Tempos, comandos e fluxo são propostas autorais; nenhuma fonte valida o conjunto como teste diagnóstico. Revisão médica e aplicações supervisionadas antecedem uso rotineiro.</p><p>Não inferir força 5/5, tônus/reflexos preservados, normalidade do exame, QI, idade mental, CID ou risco ausente. Investigação de saúde mental e risco suicida segue fluxo clínico confidencial, não interrogatório filmado pela secretária.</p>{SOURCES.map(([label, href]) => <p key={href}><a href={href} target="_blank" rel="noreferrer">{label}</a></p>)}</details><p>Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756</p></footer>
    </div>
  );
}
