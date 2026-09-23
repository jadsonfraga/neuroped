import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { OUTCOMES, clock } from "../protocol";
import { sessionElapsed } from "../safety";
import { useExitGuard } from "../useExitGuard";
import { useLocalRecorder } from "../useLocalRecorder";
import { initialTabletState, isCollecting, tabletReducer, parseTabletRecord, tabletText, drawingStrokes, type TabletAction, type TabletContext, type TabletOutcome } from "./engine";
import { tabletPlan, TABLET_LIMITS, TABLET_VERSION } from "./protocol";
import { HearTabletHelp, TabletStimulus } from "./Stimulus";
import { TABLET_STYLE } from "./style";

const SAFETY = ["Autorização institucional para filmar e tratar os dados registrada; participação aceita.", "Aplicador treinado, médico disponível e uso experimental do modo tablet autorizado pela equipe.", "Criança confortável, sem mudança aguda; apoios habituais preservados e ambiente seguro."];
function download(name: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function Preview({ stream }: { stream: MediaStream | null }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (video.current) video.current.srcObject = stream; }, [stream]);
  return <video ref={video} autoPlay muted playsInline aria-label="Prévia da câmera do modo tablet" className="ot-video" />;
}

export default function TabletWorkspace({ onClose }: { onClose: () => void }) {
  const [state, dispatch] = useReducer(tabletReducer, undefined, initialTabletState);
  const stateRef = useRef(state); stateRef.current = state;
  const [years, setYears] = useState(""); const [months, setMonths] = useState("");
  const [context, setContext] = useState<TabletContext>({ code: "", months: 0, schooling: "", communication: "", conditions: "" });
  const [checks, setChecks] = useState(SAFETY.map(() => false));
  const [camera, setCamera] = useState<"integrated" | "external">("integrated");
  const [framing, setFraming] = useState(false); const [externalReady, setExternalReady] = useState(false);
  const [rehearsal, setRehearsal] = useState(false); const [rehearsalSeen, setRehearsalSeen] = useState(false);
  const [note, setNote] = useState(""); const [outcome, setOutcome] = useState<TabletOutcome | "">("");
  const [large, setLarge] = useState(false); const [message, setMessage] = useState("");
  const [starting, setStarting] = useState(false); const [urgent, setUrgent] = useState(false);
  const [savedJson, setSavedJson] = useState(""); const [savedText, setSavedText] = useState("");
  const [confirmedSnapshot, setConfirmedSnapshot] = useState("");
  const [videoRequested, setVideoRequested] = useState(false); const [videoConfirmed, setVideoConfirmed] = useState(false);
  const [externalVideo, setExternalVideo] = useState<"" | "saved" | "unavailable">("");
  const [localVideo, setLocalVideo] = useState("");
  const localVideoRef = useRef("");
  const alive = useRef(true); const ticket = useRef(0);
  const startWall = useRef<number | null>(null); const startMono = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const media = useLocalRecorder({ facingMode: "user" });
  const collect = isCollecting(state.phase);
  const ageValid = /^\d+$/.test(years) && /^\d+$/.test(months) && Number(years) <= 17 && Number(months) <= 11;
  const age = ageValid ? Number(years) * 12 + Number(months) : -1;
  const plan = tabletPlan(state.record?.context.months ?? age);
  const task = plan?.tasks[state.cursor];
  const payload = state.record ? JSON.stringify(state.record, null, 2) : "";
  const summary = state.record ? tabletText(state.record) : "";
  const jsonCurrent = Boolean(payload) && savedJson === payload;
  const textCurrent = Boolean(summary) && savedText === summary;
  const videoDone = media.url ? videoConfirmed : externalVideo !== "";
  const ready = ageValid && /^[A-Za-z0-9_-]{1,32}$/.test(context.code) && checks.every(Boolean);
  const second = useCallback(() => startWall.current === null ? stateRef.current.elapsed : sessionElapsed(startWall.current, startMono.current, Date.now(), performance.now(), stateRef.current.elapsed), []);
  useExitGuard(Boolean(context.code || years || state.record));
  const end = useCallback((reason: string) => {
    if (!isCollecting(stateRef.current.phase)) return;
    media.stop(); dispatch({ type: "end", reason, second: second() });
  }, [media.stop, second]);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; ticket.current++; if (localVideoRef.current) URL.revokeObjectURL(localVideoRef.current); };
  }, []);
  useEffect(() => {
    heading.current?.focus();
    document.querySelector(".ot-dialog")?.scrollTo({ top: 0, behavior: "auto" });
  }, [state.phase, state.cursor]);
  useEffect(() => {
    if (!collect) return;
    const tick = () => { const elapsed = second(); if (elapsed >= 600) end("Limite absoluto de dez minutos atingido"); else dispatch({ type: "tick", second: elapsed }); };
    const hidden = () => { if (document.hidden) end("Coleta encerrada ao sair da aba ou bloquear a tela"); };
    const timer = setInterval(tick, 200); document.addEventListener("visibilitychange", hidden);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", hidden); };
  }, [collect, end, second]);
  useEffect(() => { if (collect && media.error) end("Interrupção técnica da câmera ou microfone; confira o vídeo parcial"); }, [collect, media.error, end]);
  useEffect(() => { if (state.phase === "review") media.stop(); }, [state.phase, media.stop]);
  useEffect(() => { if (collect && state.record?.eventLimitReached) end("Limite de interações atingido; parte dos dados brutos pode estar incompleta"); }, [collect, state.record?.eventLimitReached, end]);
  function apply(a: TabletAction) {
    if (isCollecting(stateRef.current.phase)) {
      const now = second();
      if (now >= 600) { end("Limite absoluto de dez minutos atingido"); return; }
      dispatch({ type: "tick", second: now });
    }
    dispatch(a);
  }
  async function start() {
    if (starting || media.pending || state.phase !== "ready" || !ready || document.hidden) return;
    if (camera === "external" && !externalReady) return;
    if (!framing) return;
    const id = ++ticket.current; setStarting(true);
    const ok = camera === "external" || await media.start();
    if (!alive.current || ticket.current !== id) return;
    setStarting(false);
    if (!ok || document.hidden) { media.cancel(); return; }
    startWall.current = Date.now(); startMono.current = performance.now();
    dispatch({ type: "start", context: { ...context, months: age }, camera, sessionId: `tablet-${crypto.randomUUID()}` });
  }
  function exit() {
    if (starting || media.pending || media.status === "finalizing" || collect) { setMessage("Encerre a coleta e preserve os arquivos antes de sair."); return; }
    if (state.record && (confirmedSnapshot !== payload || !videoDone)) { setMessage("Salve o registro atual e confira o vídeo ou sua indisponibilidade antes de sair."); return; }
    if (!state.record && (context.code || years) && !window.confirm("Voltar descarta apenas a preparação deste modo. Continuar?")) return;
    media.reset(); onClose();
  }
  async function importRecord(file?: File) {
    if (!file || state.phase !== "setup") return;
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error("Limite de 4 MB.");
      const record = parseTabletRecord(await file.text());
      if (!alive.current || stateRef.current.phase !== "setup") return;
      media.reset(); dispatch({ type: "import", record }); setMessage("Reaberto apenas para revisão. Selecione o vídeo separadamente; a origem do JSON não é autenticada.");
    } catch { setMessage("Não foi possível abrir: use um JSON do modo tablet, até 4 MB. O registro atual foi preservado."); }
  }
  const label = state.phase === "setup" ? "1. Prepare este atendimento" : state.phase === "camera" ? "2. Confira a câmera" : state.phase === "rehearsal" ? "3. Experimente sem criança" : state.phase === "ready" ? "4. Tudo pronto para começar?" : state.phase === "cue" ? `Prepare: ${task?.title}` : state.phase === "child" ? "Atividade em andamento" : state.phase === "response" ? "Registre o que aconteceu" : state.phase === "review" ? "Confira antes de entregar" : "Guarde os arquivos desta sessão";
  return <div className={`obs10 ot-root ${large ? "ot-large" : ""}`} data-testid="obs10-tablet" data-phase={state.phase}>
    <style>{TABLET_STYLE}</style>
    <header className="ot-header">
      <div><p className="ot-eyebrow">NEUROPED · OBS-10 TABLET</p><h1 id="ot-title" ref={heading} tabIndex={-1}>{label}</h1></div>
      {state.phase !== "child" && <button type="button" aria-pressed={large} onClick={() => setLarge((v) => !v)}>Letras maiores</button>}
    </header>
    {state.phase !== "child" && <><p className="ot-mode">Modo sem kit físico · experimental · não equivalente ao presencial</p><nav aria-label="Etapas da aplicação" className="ot-progress">{["Preparar", "Aplicar", "Revisar", "Guardar"].map((title, i) => { const index = collect ? 1 : state.phase === "review" ? 2 : state.phase === "delivery" ? 3 : 0; return <span key={title} aria-current={i === index ? "step" : undefined}>{i + 1}. {title}</span>; })}</nav></>}
    {collect && <div className="ot-live-bar"><span aria-label="Tempo da coleta">{clock(state.elapsed)} / 10:00</span><span>Atividade {state.cursor + 1} de {plan?.tasks.length}</span><button type="button" onClick={() => end("Aplicador encerrou antes do limite")}>Encerrar coleta</button><button type="button" className="ot-danger" onClick={() => { end("Interrupção por segurança"); setUrgent(true); }}>Chamar médico</button></div>}
    {state.phase === "setup" && <section className="ot-card">
      <p>Sem papel, lápis, impressora ou brinquedos. Usaremos interação, recursos locais e câmera. Objetos e habilidades físicas ausentes não serão simulados como equivalentes.</p>
      <HearTabletHelp />
      <label>Código institucional, sem nome<input value={context.code} maxLength={32} placeholder="Ex.: OBS-001" onChange={(e) => setContext({ ...context, code: e.target.value })} /></label>
      <div className="ot-fields"><label>Anos completos<input type="number" inputMode="numeric" min="0" max="17" value={years} onChange={(e) => setYears(e.target.value)} /></label><label>Meses adicionais<input type="number" inputMode="numeric" min="0" max="11" value={months} onChange={(e) => setMonths(e.target.value)} /></label></div>
      {plan ? <p className="ot-info">Ficha digital: {plan.bandLabel}. {age < 24 ? "O tablet fica com o adulto: não haverá estímulos de tela para o bebê." : "A criança pode apontar ou falar sem tocar; registre adaptações."}</p> : <p>Preencha a idade cronológica, sem arredondar. Para bebês, use zero em anos.</p>}
      <label>Escolaridade e oportunidades de aprendizagem<input maxLength={120} value={context.schooling} onChange={(e) => setContext({ ...context, schooling: e.target.value })} /></label>
      <label>Comunicação e apoios habituais<input maxLength={200} value={context.communication} onChange={(e) => setContext({ ...context, communication: e.target.value })} /></label>
      <label>Condições relatadas do dia<textarea maxLength={1000} value={context.conditions} onChange={(e) => setContext({ ...context, conditions: e.target.value })} /></label>
      {SAFETY.map((text, i) => <label className="ot-check" key={text}><input type="checkbox" checked={checks[i]} onChange={(e) => setChecks((v) => v.map((old, j) => j === i ? e.target.checked : old))} />{text}</label>)}
      <details><summary>O que muda em relação ao modo presencial?</summary><p>{TABLET_LIMITS}</p>{plan?.limitations.map((line) => <p key={line}>{line}</p>)}<p>A idade corrigida não é calculada neste modo. Prematuridade e condições de acesso precisam ser contextualizadas pelo médico.</p></details>
      <div className="ot-actions"><button type="button" onClick={exit}>Voltar ao modo presencial</button><button type="button" className="ot-primary" disabled={!ready} onClick={() => dispatch({ type: "next-setup" })}>Continuar para a câmera</button></div>
      {!ready && <p role="status">Para continuar: idade válida, código sem espaços e as três conferências acima.</p>}
      <details><summary>Reabrir um registro tablet já salvo</summary><p>Somente revisão. Não reinicia a coleta nem recupera vídeo.</p><label>JSON do modo tablet<input type="file" accept="application/json,.json" onChange={(e) => { void importRecord(e.target.files?.[0]); e.target.value = ""; }} /></label></details>
    </section>}
    {state.phase === "camera" && <section className="ot-card">
      <p>Confira rosto, mãos e voz. Ao entregar a tela à criança, a câmera não deve perder o enquadramento. Teste sem criança e não presuma áudio claro apenas pela prévia.</p>
      <label className="ot-check"><input type="radio" name="tablet-camera" checked={camera === "integrated"} disabled={media.pending} onChange={() => { media.reset(); setCamera("integrated"); setFraming(false); }} />Câmera frontal deste tablet</label>
      <label className="ot-check"><input type="radio" name="tablet-camera" checked={camera === "external"} disabled={media.pending} onChange={() => { media.reset(); setCamera("external"); setFraming(false); }} />Outra câmera institucional</label>
      {camera === "integrated" ? <><button type="button" disabled={media.pending} onClick={() => { void media.prepare(); }}>Testar câmera do tablet</button>{media.stream && <Preview stream={media.stream} />}{media.pending && <button type="button" onClick={() => { ticket.current++; media.cancel(); }}>Cancelar pedido de câmera</button>}</> : <label className="ot-check"><input type="checkbox" checked={externalReady} onChange={(e) => setExternalReady(e.target.checked)} />A outra câmera está pronta e será iniciada antes da coleta.</label>}
      <label className="ot-check"><input type="checkbox" checked={framing} onChange={(e) => setFraming(e.target.checked)} />Conferi enquadramento e captação de voz no equipamento. Tenho espaço para salvar.</label>
      <div className="ot-actions"><button type="button" disabled={media.pending} onClick={() => { media.cancel(); dispatch({ type: "back-setup" }); }}>Voltar</button><button type="button" className="ot-primary" disabled={!framing || media.pending || (camera === "external" ? !externalReady : !media.stream)} onClick={() => { media.cancel(); dispatch({ type: "next-setup" }); }}>Continuar para o ensaio</button></div>
    </section>}
    {state.phase === "rehearsal" && <section className="ot-card">
      <p>Treino do aplicador, sem criança, gravação ou contagem de tempo. A instrução aparece primeiro; depois só a atividade; por último, o registro.</p>
      {!rehearsal ? <button type="button" className="ot-primary" onClick={() => setRehearsal(true)}>Experimentar a tela da criança</button> : <div className="ot-rehearsal"><p>Esta é uma área sem instruções clínicas ou respostas.</p><button type="button" onClick={() => { setRehearsal(false); setRehearsalSeen(true); }}>Terminei o ensaio · voltar às instruções</button></div>}
      <p>Exemplo de registro: “Apontou para a figura após ouvir novamente o pedido.” Não escreva “desatento” nem tente ensinar até acertar.</p>
      <div className="ot-actions"><button type="button" onClick={() => dispatch({ type: "back-setup" })}>Voltar</button><button type="button" className="ot-primary" disabled={!rehearsalSeen || rehearsal} onClick={() => dispatch({ type: "next-setup" })}>Entendi · revisar preparação</button></div>
    </section>}
    {state.phase === "ready" && <section className="ot-card">
      <p><strong>{plan?.bandLabel} · {plan?.tasks.length} atividades digitais ou de interação.</strong></p><p>Diga ao responsável: “Não é prova nem nota. Fique perto sem dar dicas. Podemos parar a qualquer momento.”</p>
      <p>Preparação encerrada. A partir do próximo botão, transições e anotações contam no limite de dez minutos, sem pausa. Não sair do aplicativo nem bloquear a tela.</p>
      <p>{camera === "integrated" ? "A câmera frontal será iniciada após sua autorização." : "Inicie agora a câmera externa e mantenha este tablet no roteiro."}</p>
      <div className="ot-actions"><button type="button" disabled={starting} onClick={() => dispatch({ type: "back-setup" })}>Voltar ao ensaio</button><button type="button" className="ot-primary" disabled={starting || media.pending} onClick={() => { void start(); }}>Iniciar observação de até 10 minutos</button></div>
      {(starting || media.pending) && <button type="button" onClick={() => { ticket.current++; setStarting(false); media.cancel(); }}>Cancelar início</button>}
    </section>}
    {state.phase === "cue" && task && <section className="ot-card" data-testid="tablet-cue">
      <p className="ot-badge">SOMENTE PARA O APLICADOR</p><h2>1. Prepare</h2><p>{task.prepare}</p><h2>2. Diga ou faça</h2><p className="ot-command">{task.command}</p><h2>3. Observe</h2><p>{task.observe}</p><p className="ot-info">{task.caution}</p>
      <p>{task.kind === "quiet" ? "Sem objeto e sem estímulo visual. Ao iniciar, mantenha a interação natural." : "O próximo botão abre somente o recurso necessário, dentro desta mesma tela. Não há impressão ou troca de aplicativo."}</p>
      <div className="ot-actions"><button type="button" className="ot-primary" onClick={() => apply({ type: "show" })}>{task.kind === "quiet" ? "Iniciar esta interação" : "Abrir atividade para a criança"}</button></div>
      <details><summary>Não posso aplicar esta atividade</summary><label>Motivo da não aplicação<textarea value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} /></label><button type="button" onClick={() => { apply({ type: "skip", reason: note }); if (note.trim()) { setNote(""); setOutcome(""); } }}>Registrar motivo e seguir</button></details>
    </section>}
    {state.phase === "child" && task && <section className="ot-child" data-testid="tablet-child">
      <TabletStimulus key={task.id} task={task} strokes={drawingStrokes(state.record?.events ?? [], task.id)} onInput={(event, value) => apply({ type: "input", event, value })} />
      <button type="button" className="ot-primary" onClick={() => apply({ type: "response" })}>Terminar tentativa · registrar</button>
    </section>}
    {state.phase === "response" && task && <section className="ot-card" data-testid="tablet-response">
      <h2>{task.title}</h2><p>A tentativa terminou. Não repita para melhorar a resposta.</p>
      <fieldset className="ot-outcomes"><legend>Como aconteceu?</legend>{OUTCOMES.map((o) => <button key={o.id} type="button" aria-pressed={outcome === o.id} onClick={() => setOutcome(o.id)}>{o.label}</button>)}</fieldset>
      {outcome && <p className="ot-info">{OUTCOMES.find((o) => o.id === outcome)?.description}</p>}
      <label>O que você viu ou ouviu? Inclua ajuda e limitações.<textarea value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} placeholder="Escreva apenas o fato observado. Não use nomes." /></label>
      <button type="button" className="ot-primary" disabled={!outcome || !note.trim()} onClick={() => { if (outcome) { apply({ type: "save", outcome, note }); setNote(""); setOutcome(""); } }}>Salvar resposta e continuar</button>
      <button type="button" onClick={() => end("Encerramento com descrição ainda pendente")}>Encerrar e completar depois</button>
    </section>}
    {state.phase === "review" && state.record && <section className="ot-card">
      <p className="ot-info">Coleta encerrada: {state.record.endReason}. Não aplicar novas tarefas. Complete só o que já ocorreu.</p>
      {plan?.tasks.map((t) => { const o = state.record!.observations.find((v) => v.taskId === t.id); return <details key={t.id} className="ot-review-item"><summary>{t.title} · {o ? o.outcome ? OUTCOMES.find((v) => v.id === o.outcome)?.label : "registro parcial" : "não observada"}</summary>{o ? <><p>{t.command}</p><label>Complemento factual de {t.title}<textarea value={o.note} maxLength={2000} onChange={(e) => dispatch({ type: "amend", taskId: t.id, note: e.target.value })} /></label>{t.kind === "drawing" && <TabletStimulus task={{ ...t, kind: "quiet" }} strokes={[]} onInput={() => undefined} />}</> : <p>Não houve registro desta atividade. Não concluir que a criança não sabe fazer.</p>}</details>; })}
      <details><summary>Limites e habilidades não examinadas</summary>{plan?.limitations.map((text) => <p key={text}>{text}</p>)}</details>
      <label className="ot-check"><input type="checkbox" checked={state.record.reviewed} onChange={(e) => dispatch({ type: "reviewed", value: e.target.checked })} />Conferi descrições, ajudas e tarefas não observadas. Esta é uma declaração minha, não uma assinatura médica.</label>
      <button type="button" className="ot-primary" onClick={() => dispatch({ type: "delivery" })}>Continuar para guardar os arquivos</button><p>É permitido exportar um registro parcial, com as pendências explícitas.</p>
    </section>}
    {state.phase === "delivery" && state.record && <section className="ot-card">
      <h2>1. Salve o registro atual</h2><p>O JSON contém descrições, eventos e traçados. Não contém vídeo. Não há upload ou salvamento automático no prontuário.</p>
      <button type="button" className="ot-primary" onClick={() => { download(`OBS10-TABLET-${state.record!.sessionId}.json`, payload, "application/json"); setSavedJson(payload); setConfirmedSnapshot(""); }}>Salvar registro JSON</button><p role="status">{jsonCurrent ? "Download do registro atual solicitado. Confira o arquivo no tablet." : "Registro atual ainda não exportado."}</p>
      <button type="button" onClick={() => { download(`OBS10-TABLET-${state.record!.sessionId}.txt`, summary, "text/plain;charset=utf-8"); setSavedText(summary); }}>Salvar resumo para o médico</button><p>{textCurrent ? "Resumo atual exportado." : "Resumo textual opcional."}</p>
      <h2>2. Confira e salve o vídeo</h2>
      {media.status === "finalizing" && <p role="status">Finalizando o vídeo. Não saia desta tela.</p>}
      {media.url ? <><video className="ot-video" controls playsInline src={media.url} aria-label="Conferir vídeo gravado" /><a className="ot-file" href={media.url} download={`OBS10-TABLET-${state.record.sessionId}.${media.mime.includes("mp4") ? "mp4" : "webm"}`} onClick={() => setVideoRequested(true)}>Salvar vídeo no tablet</a><label className="ot-check"><input type="checkbox" checked={videoConfirmed} disabled={!videoRequested} onChange={(e) => setVideoConfirmed(e.target.checked)} />O vídeo apareceu no destino institucional; conferi som e imagem.</label></> : <><p>Vídeo externo, importado ou indisponível: marque somente o que ocorreu.</p><label className="ot-check"><input type="radio" name="video-result" checked={externalVideo === "saved"} onChange={() => setExternalVideo("saved")} />Vídeo salvo e conferido no fluxo institucional.</label><label className="ot-check"><input type="radio" name="video-result" checked={externalVideo === "unavailable"} onChange={() => setExternalVideo("unavailable")} />Não há vídeo utilizável; informarei essa limitação ao médico.</label><label>Abrir vídeo local somente para conferir<input type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 128 * 1024 * 1024) { setMessage("Vídeo maior que 128 MB. Confira no fluxo institucional."); return; } if (localVideoRef.current) URL.revokeObjectURL(localVideoRef.current); localVideoRef.current = URL.createObjectURL(f); setLocalVideo(localVideoRef.current); }} /></label>{localVideo && <video className="ot-video" src={localVideo} controls playsInline aria-label="Conferir vídeo selecionado localmente" />}</>}
      <h2>3. Confirme antes de sair</h2><label className="ot-check"><input type="checkbox" checked={confirmedSnapshot === payload && jsonCurrent && videoDone} disabled={!jsonCurrent || !videoDone || media.status === "finalizing"} onChange={(e) => setConfirmedSnapshot(e.target.checked ? payload : "")} />Conferi os arquivos atuais no armazenamento institucional. Entrega ao médico segue o fluxo da clínica.</label>
      <div className="ot-actions"><button type="button" onClick={() => dispatch({ type: "back-review" })}>Voltar e revisar</button><button type="button" className="ot-primary" disabled={confirmedSnapshot !== payload || !jsonCurrent || !videoDone || media.status === "finalizing"} onClick={exit}>Concluir e voltar ao OBS-10</button></div>
      <details><summary>Ver resumo completo</summary><pre>{summary}</pre></details>
    </section>}
    {media.error && <p role="alert" className="ot-error">{media.error}</p>}{state.error && <p role="alert" className="ot-error">{state.error}</p>}{message && <p role="status" className="ot-info">{message}</p>}
    {urgent && <section role="alert" className="ot-emergency"><h2>Interrompa e chame a equipe presencial.</h2><p>Alteração de consciência, crise, dificuldade respiratória, fraqueza súbita, dor intensa ou risco imediato: não espere vídeo ou IA. Em emergência, SAMU 192.</p><p>Na crise: proteja contra lesões, não contenha à força e não coloque nada na boca. Conteúdo sensível exige atendimento reservado.</p><button type="button" onClick={() => setUrgent(false)}>Entendi · manter coleta encerrada</button></section>}
    {state.phase !== "child" && <footer className="ot-footer">{TABLET_VERSION} · Recursos digitais autorais · Revisão médica indispensável · Dados temporários nesta tela até exportar.</footer>}
  </div>;
}
